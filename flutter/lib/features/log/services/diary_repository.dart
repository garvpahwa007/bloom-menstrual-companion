import 'dart:convert';
import 'dart:math';

import 'package:cryptography/cryptography.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../common/bloom_config.dart';
import '../../../common/date_utils.dart';
import '../models/day_log.dart';
import '../models/mood_catalog.dart';
import 'demo_data.dart';

/// Local-first diary storage. Only encrypted backup envelopes may leave the device.
class DiaryRepository extends ChangeNotifier {
  static const storageKey = 'saheli.v1';
  static const _legacyStorageKey = 'bloom.diary.v1';
  static const _backupFormat = 'bloom-encrypted-backup';
  static const _algorithmName = 'PBKDF2-SHA256';
  static const _cipherName = 'AES-GCM-256';

  Map<String, dynamic>? _state;
  Map<String, dynamic>? _lockedEnvelope;
  SecretKey? _vaultKey;
  List<int>? _vaultSalt;
  bool _locked = false;
  bool _storageError = false;
  bool _encrypted = false;
  Future<void> _writeQueue = Future.value();

  bool get hasDiary => _state != null;
  bool get locked => _locked;
  bool get storageError => _storageError;
  bool get isPinEnabled => _encrypted;
  bool get isVaultUnlocked => _vaultKey != null;
  bool get isDemo => _state?['demo'] == true;
  String get language => settings['language'] as String? ?? 'en';

  Map<String, DayLog> get logs {
    final raw = _state?['logs'];
    if (raw is! Map) return const {};
    final result = <String, DayLog>{};
    for (final entry in raw.entries) {
      if (entry.key is String && entry.value is Map) {
        try {
          final json = Map<String, dynamic>.from(entry.value as Map);
          json['date'] ??= entry.key;
          result[entry.key as String] = DayLog.fromJson(json);
        } on Object {
          continue;
        }
      }
    }
    return Map.unmodifiable(result);
  }

  Map<String, dynamic> get profile => Map.unmodifiable(
    Map<String, dynamic>.from(_state?['profile'] as Map? ?? const {}),
  );

  Map<String, dynamic> get settings => Map.unmodifiable(
    Map<String, dynamic>.from(_state?['settings'] as Map? ?? const {}),
  );

  List<Map<String, dynamic>> get reminders => List.unmodifiable(
    (_state?['reminders'] as List? ?? const []).whereType<Map>().map(
      (e) => Map<String, dynamic>.from(e),
    ),
  );

  Map<String, dynamic> get dismissals => Map.unmodifiable(
    Map<String, dynamic>.from(_state?['dismissals'] as Map? ?? const {}),
  );

  Map<String, dynamic> get snapshot => _state == null
      ? <String, dynamic>{}
      : Map<String, dynamic>.from(jsonDecode(jsonEncode(_state)) as Map);

  DayLog? forDate(DateTime date) => logs[dateKey(date)];

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    var raw = prefs.getString(storageKey);
    if (raw == null) {
      final legacy = prefs.getString(_legacyStorageKey);
      if (legacy != null) {
        try {
          final decoded = jsonDecode(legacy);
          if (decoded is Map && decoded.containsKey('logs')) {
            _state = validateState(Map<String, dynamic>.from(decoded));
          } else if (decoded is Map) {
            _state = _migrateLegacyLogs(decoded);
          }
          if (_state != null) await _commit();
        } on Object {
          _storageError = true;
        }
        notifyListeners();
        return;
      }
    }
    if (raw == null || raw.isEmpty) return;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) throw const FormatException('invalidStorage');
      final envelope = Map<String, dynamic>.from(decoded);
      if (envelope['version'] != BloomConfig.version) {
        throw const FormatException('storageVersion');
      }
      _encrypted = envelope['encrypted'] == true;
      if (_encrypted) {
        _lockedEnvelope = envelope;
        _locked = true;
      } else {
        final data = envelope['data'];
        if (data is! Map) throw const FormatException('invalidStorage');
        _state = validateState(Map<String, dynamic>.from(data));
        _locked = false;
      }
    } on Object {
      // Do not replace an unreadable snapshot with an empty diary.
      _storageError = true;
    }
    notifyListeners();
  }

  Future<bool> start({
    required bool demo,
    required String ageGroup,
    required String language,
  }) async {
    if (hasDiary || locked || storageError) return false;
    final data = demo
        ? createDemoData()
        : createFreshData(ageGroup: ageGroup, language: language);
    data['demo'] = demo;
    (data['profile'] as Map<String, dynamic>)['ageGroup'] = ageGroup;
    (data['settings'] as Map<String, dynamic>)['language'] = language;
    try {
      _state = validateState(data);
      await _commit();
      notifyListeners();
      return true;
    } on Object {
      _state = null;
      return false;
    }
  }

  Future<bool> registerProfile(String ageGroup) async {
    if (!['adult', 'under18'].contains(ageGroup) || locked || storageError) {
      return false;
    }
    if (_state == null) {
      return start(demo: false, ageGroup: ageGroup, language: 'en');
    }
    return updateProfile({'ageGroup': ageGroup});
  }

  Future<bool> save(DayLog log) async {
    if (_state == null || _locked) return false;
    final next = snapshot;
    final nextLogs = Map<String, dynamic>.from(next['logs'] as Map);
    nextLogs[log.dateKey] = log.toJson();
    next['logs'] = nextLogs;
    return replaceState(next);
  }

  Future<bool> updateSettings(Map<String, Object?> changes) async {
    if (_state == null || _locked) return false;
    final next = snapshot;
    next['settings'] = <String, dynamic>{...settings, ...changes};
    return replaceState(next);
  }

  Future<bool> updateProfile(Map<String, Object?> changes) async {
    if (_state == null || _locked) return false;
    final next = snapshot;
    next['profile'] = <String, dynamic>{...profile, ...changes};
    return replaceState(next);
  }

  Future<bool> saveReminders(List<Map<String, dynamic>> value) async {
    if (_state == null || _locked) return false;
    final next = snapshot;
    next['reminders'] = value;
    return replaceState(next);
  }

  Future<bool> dismiss(String id, {String? until}) async {
    if (_state == null || _locked) return false;
    final next = snapshot;
    final values = Map<String, dynamic>.from(dismissals);
    values[id] = until ?? true;
    next['dismissals'] = values;
    return replaceState(next);
  }

  Future<bool> replaceState(Map<String, dynamic> next) async {
    if (_locked || _state == null && !next.containsKey('version')) return false;
    try {
      _state = validateState(next);
      await _commit();
      notifyListeners();
      return true;
    } on Object {
      return false;
    }
  }

  Future<void> _commit() async {
    final completer = _writeQueue.then((_) async {
      final prefs = await SharedPreferences.getInstance();
      final state = _state;
      if (state == null) throw StateError('There is no unlocked diary.');
      Map<String, dynamic> envelope;
      if (_encrypted) {
        final key = _vaultKey;
        final salt = _vaultSalt;
        if (key == null || salt == null) {
          throw StateError('Unlock the diary before saving.');
        }
        envelope = await _encryptEnvelope(state, key, salt);
        _lockedEnvelope = envelope;
      } else {
        envelope = {
          'version': BloomConfig.version,
          'encrypted': false,
          'data': state,
        };
      }
      final wrote = await prefs.setString(storageKey, jsonEncode(envelope));
      if (!wrote) throw StateError('Local storage write failed.');
    });
    _writeQueue = completer.catchError((_) {});
    await completer;
  }

  Future<Map<String, dynamic>> _encryptEnvelope(
    Map<String, dynamic> value,
    SecretKey key,
    List<int> salt,
  ) async {
    final nonce = _randomBytes(BloomConfig.encryptionIvBytes);
    final box = await AesGcm.with256bits().encrypt(
      utf8.encode(jsonEncode(value)),
      secretKey: key,
      nonce: nonce,
    );
    return {
      'version': BloomConfig.version,
      'encrypted': true,
      'kdf': _algorithmName,
      'iterations': BloomConfig.pbkdf2Iterations,
      'salt': base64Encode(salt),
      'iv': base64Encode(nonce),
      // WebCrypto stores ciphertext followed by the 16-byte GCM tag.
      'ciphertext': base64Encode([...box.cipherText, ...box.mac.bytes]),
    };
  }

  Future<SecretKey> _deriveKey(String pin, List<int> salt, {int? iterations}) {
    if (!RegExp(r'^\d{4}$').hasMatch(pin)) {
      throw const FormatException('pinFormat');
    }
    return Pbkdf2(
      macAlgorithm: Hmac.sha256(),
      iterations: iterations ?? BloomConfig.pbkdf2Iterations,
      bits: 256,
    ).deriveKey(secretKey: SecretKey(utf8.encode(pin)), nonce: salt);
  }

  Future<bool> enablePin(String pin) async {
    if (_state == null || !RegExp(r'^\d{4}$').hasMatch(pin)) return false;
    try {
      final salt = _randomBytes(BloomConfig.encryptionSaltBytes);
      final key = await _deriveKey(pin, salt);
      final envelope = await _encryptEnvelope(_state!, key, salt);
      final prefs = await SharedPreferences.getInstance();
      if (!await prefs.setString(storageKey, jsonEncode(envelope)))
        return false;
      _vaultKey = key;
      _vaultSalt = salt;
      _lockedEnvelope = envelope;
      _encrypted = true;
      notifyListeners();
      return true;
    } on Object {
      return false;
    }
  }

  Future<bool> unlockPin(String pin) async {
    final envelope = _lockedEnvelope;
    if (envelope == null || envelope['encrypted'] != true) return false;
    try {
      final salt = base64Decode(envelope['salt'] as String);
      final nonce = base64Decode(envelope['iv'] as String);
      final allBytes = base64Decode(envelope['ciphertext'] as String);
      if (allBytes.length < 16) return false;
      final key = await _deriveKey(pin, salt);
      final box = SecretBox(
        allBytes.sublist(0, allBytes.length - 16),
        nonce: nonce,
        mac: Mac(allBytes.sublist(allBytes.length - 16)),
      );
      final clear = await AesGcm.with256bits().decrypt(box, secretKey: key);
      final decoded = jsonDecode(utf8.decode(clear));
      if (decoded is! Map) return false;
      _state = validateState(Map<String, dynamic>.from(decoded));
      _vaultKey = key;
      _vaultSalt = salt;
      _locked = false;
      _storageError = false;
      notifyListeners();
      return true;
    } on Object {
      return false;
    }
  }

  Future<void> lock() async {
    if (!_encrypted || _state == null) return;
    await _writeQueue;
    _state = null;
    _vaultKey = null;
    _vaultSalt = null;
    _locked = true;
    notifyListeners();
  }

  Future<bool> disablePin() async {
    if (_state == null || !_encrypted) return false;
    try {
      final prefs = await SharedPreferences.getInstance();
      final envelope = {
        'version': BloomConfig.version,
        'encrypted': false,
        'data': _state,
      };
      if (!await prefs.setString(storageKey, jsonEncode(envelope)))
        return false;
      _encrypted = false;
      _lockedEnvelope = null;
      _vaultKey = null;
      _vaultSalt = null;
      notifyListeners();
      return true;
    } on Object {
      return false;
    }
  }

  Future<String> exportJson() async =>
      const JsonEncoder.withIndent('  ').convert(snapshot);

  String exportCsv() {
    final state = snapshot;
    final rows = <List<String>>[
      ['record_type', 'date', 'flow', 'pain', 'mood', 'symptoms', 'data_json'],
      [
        'metadata',
        '',
        '',
        '',
        '',
        '',
        jsonEncode({...state}..remove('logs')),
      ],
    ];
    final sortedLogs = logs.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    for (final entry in sortedLogs) {
      final log = entry.value.toJson();
      rows.add([
        'day',
        entry.key,
        entry.value.flow,
        '${entry.value.pain}',
        entry.value.mood,
        entry.value.symptoms.join(';'),
        jsonEncode(log),
      ]);
    }
    return rows.map((row) => row.map(_quoteCsv).join(',')).join('\r\n');
  }

  Future<String> exportEncryptedBackup(String passphrase) async {
    _validateBackupPassphrase(passphrase);
    final snapshotValue = validateState(snapshot);
    final salt = _randomBytes(BloomConfig.encryptionSaltBytes);
    final nonce = _randomBytes(BloomConfig.encryptionIvBytes);
    final key = await Pbkdf2(
      macAlgorithm: Hmac.sha256(),
      iterations: BloomConfig.pbkdf2Iterations,
      bits: 256,
    ).deriveKey(secretKey: SecretKey(utf8.encode(passphrase)), nonce: salt);
    final box = await AesGcm.with256bits().encrypt(
      utf8.encode(jsonEncode(snapshotValue)),
      secretKey: key,
      nonce: nonce,
    );
    final encrypted = base64Encode([...box.cipherText, ...box.mac.bytes]);
    final wrapper = {
      'format': _backupFormat,
      'version': 1,
      'cipher': _cipherName,
      'kdf': _algorithmName,
      'iterations': BloomConfig.pbkdf2Iterations,
      'salt': base64Encode(salt),
      'iv': base64Encode(nonce),
      'ciphertext': encrypted,
    };
    final output = const JsonEncoder.withIndent('  ').convert(wrapper);
    if (utf8.encode(output).length > BloomConfig.maximumEncryptedBackupBytes) {
      throw const FormatException('invalidImport');
    }
    return output;
  }

  Future<Map<String, dynamic>> decryptEncryptedBackup(
    String text,
    String passphrase,
  ) async {
    _validateBackupPassphrase(passphrase);
    if (utf8.encode(text).length > BloomConfig.maximumEncryptedBackupBytes) {
      throw const FormatException('invalidImport');
    }
    final wrapperValue = jsonDecode(text);
    if (wrapperValue is! Map || wrapperValue['format'] != _backupFormat) {
      throw const FormatException('invalidEncryptedBackup');
    }
    final wrapper = Map<String, dynamic>.from(wrapperValue);
    final keys = wrapper.keys.toList()..sort();
    final expected = [
      'cipher',
      'ciphertext',
      'format',
      'iterations',
      'iv',
      'kdf',
      'salt',
      'version',
    ]..sort();
    if (jsonEncode(keys) != jsonEncode(expected) ||
        wrapper['version'] != 1 ||
        wrapper['cipher'] != _cipherName ||
        wrapper['kdf'] != _algorithmName ||
        wrapper['iterations'] is! int ||
        (wrapper['iterations'] as int) < 100000 ||
        (wrapper['iterations'] as int) > 500000) {
      throw const FormatException('backupUnsupported');
    }
    try {
      final salt = base64Decode(wrapper['salt'] as String);
      final nonce = base64Decode(wrapper['iv'] as String);
      final bytes = base64Decode(wrapper['ciphertext'] as String);
      if (salt.length != BloomConfig.encryptionSaltBytes ||
          nonce.length != BloomConfig.encryptionIvBytes ||
          bytes.length < 16 ||
          bytes.length > BloomConfig.maximumImportBytes + 16) {
        throw const FormatException('invalidEncryptedBackup');
      }
      final key = await Pbkdf2(
        macAlgorithm: Hmac.sha256(),
        iterations: wrapper['iterations'] as int,
        bits: 256,
      ).deriveKey(secretKey: SecretKey(utf8.encode(passphrase)), nonce: salt);
      final box = SecretBox(
        bytes.sublist(0, bytes.length - 16),
        nonce: nonce,
        mac: Mac(bytes.sublist(bytes.length - 16)),
      );
      final clear = await AesGcm.with256bits().decrypt(box, secretKey: key);
      final decoded = jsonDecode(utf8.decode(clear));
      if (decoded is! Map)
        throw const FormatException('invalidEncryptedBackup');
      return validateState(Map<String, dynamic>.from(decoded));
    } on FormatException {
      rethrow;
    } on Object {
      throw const FormatException('backupPassphraseWrong');
    }
  }

  Future<Map<String, dynamic>> importText(String text) async {
    if (utf8.encode(text).length > BloomConfig.maximumImportBytes) {
      throw const FormatException('invalidImport');
    }
    final trimmed = text.trimLeft().replaceFirst('\uFEFF', '');
    if (trimmed.startsWith('{')) {
      final decoded = jsonDecode(trimmed);
      if (decoded is! Map) throw const FormatException('invalidImport');
      return validateState(Map<String, dynamic>.from(decoded));
    }
    final rows = _parseCsv(trimmed);
    if (rows.isEmpty ||
        rows.first.isEmpty ||
        rows.first.first != 'record_type') {
      throw const FormatException('invalidImport');
    }
    final metadata = rows
        .where((r) => r.isNotEmpty && r[0] == 'metadata')
        .firstOrNull;
    if (metadata == null || metadata.length < 7)
      throw const FormatException('invalidImport');
    final base = jsonDecode(metadata[6]);
    if (base is! Map) throw const FormatException('invalidImport');
    final state = Map<String, dynamic>.from(base)
      ..['logs'] = <String, dynamic>{};
    for (final row in rows.where((r) => r.isNotEmpty && r[0] == 'day')) {
      if (row.length < 7) throw const FormatException('invalidImport');
      final log = jsonDecode(row[6]);
      if (log is! Map) throw const FormatException('invalidImport');
      (state['logs'] as Map<String, dynamic>)[row[1]] = log;
    }
    return validateState(state);
  }

  Future<bool> importAndReplace(Map<String, dynamic> imported) async {
    if (_locked ||
        _storageError ||
        (_encrypted && (_vaultKey == null || _vaultSalt == null))) {
      return false;
    }
    final previousState = _state;
    final previousEnvelope = _lockedEnvelope;
    try {
      _state = validateState(imported);
      await _commit();
      notifyListeners();
      return true;
    } on Object {
      _state = previousState;
      _lockedEnvelope = previousEnvelope;
      return false;
    }
  }

  Future<void> deleteEverything() async {
    await _writeQueue;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(storageKey);
    await prefs.remove(_legacyStorageKey);
    _state = null;
    _lockedEnvelope = null;
    _vaultKey = null;
    _vaultSalt = null;
    _locked = false;
    _encrypted = false;
    _storageError = false;
    notifyListeners();
  }

  static Map<String, dynamic> validateState(Map<String, dynamic> input) {
    bool object(Object? value) =>
        value is Map && value.keys.every((k) => k is String);
    bool validDate(Object? value) {
      if (value is! String) return false;
      try {
        parseDateKey(value);
        return true;
      } on Object {
        return false;
      }
    }

    if (input['version'] != BloomConfig.version ||
        !object(input['logs']) ||
        !object(input['profile']) ||
        !object(input['settings']) ||
        input['reminders'] is! List) {
      throw const FormatException('invalidImport');
    }
    final profile = Map<String, dynamic>.from(input['profile'] as Map);
    final settings = Map<String, dynamic>.from(input['settings'] as Map);
    if (!['adult', 'under18'].contains(profile['ageGroup']) ||
        !['en', 'hi', 'ta'].contains(settings['language'])) {
      throw const FormatException('invalidImport');
    }
    for (final key in [
      'pregnancyEnabled',
      'pregnancyConfirmed',
      'fertilityEnabled',
      'pregnancyFeatureEnabled',
    ]) {
      if (profile.containsKey(key) && profile[key] is! bool)
        throw const FormatException('invalidImport');
    }
    final lastPeriod = profile['lastPeriodDate'];
    if (lastPeriod != null && lastPeriod != '' && !validDate(lastPeriod))
      throw const FormatException('invalidImport');
    if (profile['pregnancyEnabled'] == true &&
        (profile['pregnancyConfirmed'] != true ||
            !validDate(lastPeriod) ||
            (lastPeriod as String).compareTo(todayIso()) > 0)) {
      throw const FormatException('invalidImport');
    }
    for (final key in ['highContrast', 'readAloud', 'discreet']) {
      if (settings[key] is! bool) throw const FormatException('invalidImport');
    }
    if (!['normal', 'large', 'largest'].contains(settings['textSize']) ||
        settings['trackedSymptoms'] is! List ||
        (settings['trackedSymptoms'] as List).any(
          (e) => e is! String || e.length > 80,
        )) {
      throw const FormatException('invalidImport');
    }
    final logs = Map<String, dynamic>.from(input['logs'] as Map);
    for (final entry in logs.entries) {
      final date = entry.key;
      final log = entry.value;
      if (!validDate(date) || !object(log) || log['symptoms'] is! List)
        throw const FormatException('invalidImport');
      final record = Map<String, dynamic>.from(log as Map);
      if (record['date'] != null && record['date'] != date)
        throw const FormatException('invalidImport');
      if ((record['symptoms'] as List).any(
        (e) => e is! String || e.length > 80,
      ))
        throw const FormatException('invalidImport');
      if (record['symptomIntensity'] != null) {
        if (!object(record['symptomIntensity']))
          throw const FormatException('invalidImport');
        for (final item in (record['symptomIntensity'] as Map).entries) {
          if (item.key is! String ||
              item.key.length > 80 ||
              !(record['symptoms'] as List).contains(item.key) ||
              item.value is! int ||
              item.value < 1 ||
              item.value > 3) {
            throw const FormatException('invalidImport');
          }
        }
      }
      for (final key in ['note', 'medicines']) {
        if (record.containsKey(key) &&
            (record[key] is! String || (record[key] as String).length > 10000))
          throw const FormatException('invalidImport');
      }
      for (final key in [
        'period',
        'padFrequent',
        'largeClots',
        'painDisrupts',
        'painUnrelieved',
        'betweenBleeding',
        'afterSexBleeding',
        'pregnancyPossible',
        'urgentPain',
        'fainting',
        'confirmedGap',
      ]) {
        if (record.containsKey(key) && record[key] is! bool)
          throw const FormatException('invalidImport');
      }
      final pain = record['pain'];
      if (pain != null &&
          (pain is! num ||
              !pain.isFinite ||
              pain < 0 ||
              pain > BloomConfig.painScaleMaximum))
        throw const FormatException('invalidImport');
      final sleep = record['sleep'];
      if (sleep != null &&
          (sleep is! num ||
              !sleep.isFinite ||
              sleep < 0 ||
              sleep > BloomConfig.maximumSleepHours))
        throw const FormatException('invalidImport');
      if (record['flow'] != null &&
          !['spotting', 'light', 'medium', 'heavy'].contains(record['flow']))
        throw const FormatException('invalidImport');
      if (record['mood'] != null && !validMoodIds.contains(record['mood']))
        throw const FormatException('invalidImport');
      if (record['energy'] != null &&
          !['low', 'okay', 'high'].contains(record['energy']))
        throw const FormatException('invalidImport');
    }
    final reminders = (input['reminders'] as List).map((value) {
      if (!object(value)) throw const FormatException('invalidImport');
      final reminder = Map<String, dynamic>.from(value as Map);
      if (reminder['id'] is! String ||
          ![
            'daily',
            'period',
            'medicine',
            'custom',
            'checkup',
          ].contains(reminder['type']) ||
          reminder['enabled'] is! bool ||
          reminder['time'] is! String ||
          !RegExp(r'^(?:[01]\d|2[0-3]):[0-5]\d$')
              .hasMatch(reminder['time'] as String) ||
          (reminder['date'] != null && !validDate(reminder['date'])) ||
          (reminder['title'] != null && reminder['title'] is! String)) {
        throw const FormatException('invalidImport');
      }
      return reminder;
    }).toList();
    final dismissals = input['dismissals'] == null
        ? <String, dynamic>{}
        : Map<String, dynamic>.from(input['dismissals'] as Map);
    if (dismissals.values.any((v) => v is! String && v != true))
      throw const FormatException('invalidImport');
    return {
      ...input,
      'logs': logs,
      'profile': profile,
      'settings': settings,
      'reminders': reminders,
      'dismissals': dismissals,
      'demo': input['demo'] == true,
    };
  }

  Map<String, dynamic> _migrateLegacyLogs(Map<dynamic, dynamic> old) {
    final logs = <String, dynamic>{};
    for (final entry in old.entries) {
      if (entry.key is String && entry.value is Map) {
        final key = entry.key as String;
        final log = Map<String, dynamic>.from(entry.value as Map);
        log['date'] ??= key;
        logs[key] = log;
      }
    }
    final migrated = createFreshData(ageGroup: 'under18', language: 'en')
      ..['logs'] = logs;
    return validateState(migrated);
  }

  static List<int> _randomBytes(int count) {
    final random = Random.secure();
    return List.generate(count, (_) => random.nextInt(256));
  }

  static String _quoteCsv(Object? value) =>
      '"${(value ?? '').toString().replaceAll('"', '""')}"';

  static List<List<String>> _parseCsv(String text) {
    final rows = <List<String>>[];
    var row = <String>[];
    final value = StringBuffer();
    var quoted = false;
    for (var i = 0; i < text.length; i++) {
      final char = text[i];
      if (char == '"') {
        if (quoted && i + 1 < text.length && text[i + 1] == '"') {
          value.write('"');
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (char == ',' && !quoted) {
        row.add(value.toString());
        value.clear();
      } else if ((char == '\n' || char == '\r') && !quoted) {
        if (char == '\r' && i + 1 < text.length && text[i + 1] == '\n') i++;
        row.add(value.toString());
        rows.add(row);
        row = <String>[];
        value.clear();
      } else {
        value.write(char);
      }
    }
    if (quoted) throw const FormatException('invalidImport');
    if (value.isNotEmpty || row.isNotEmpty) {
      row.add(value.toString());
      rows.add(row);
    }
    return rows;
  }

  static void _validateBackupPassphrase(String value) {
    final length = value.runes.length;
    if (length < 12 || value.length > 1024) {
      throw const FormatException('backupPassphraseFormat');
    }
  }
}

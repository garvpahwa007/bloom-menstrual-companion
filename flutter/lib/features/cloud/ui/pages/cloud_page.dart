import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../../log/services/diary_repository.dart';
import '../../services/bloom_api_client.dart';

class CloudPage extends StatefulWidget {
  const CloudPage({
    super.key,
    required this.diary,
    this.api,
    this.onDiaryChanged,
  });

  final DiaryRepository diary;
  final BloomApiClient? api;
  final VoidCallback? onDiaryChanged;

  @override
  State<CloudPage> createState() => _CloudPageState();
}

class _CloudPageState extends State<CloudPage> {
  final _formKey = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();
  final _passwordConfirm = TextEditingController();
  final _backupPassphrase = TextEditingController();
  final _backupPassphraseConfirm = TextEditingController();
  final _restorePassphrase = TextEditingController();
  late final BloomApiClient _api;
  late final bool _ownsApi;
  final BloomCatalog _catalog = BloomCatalog.instance;

  Map<String, dynamic>? _user;
  Map<String, dynamic>? _backupStatus;
  Map<String, dynamic>? _pendingRestore;
  String? _ageGroup;
  String? _error;
  String? _notice;
  String _phase = 'guest';
  bool _registering = false;
  bool _loading = false;
  bool _busy = false;
  bool _obscurePassword = true;
  bool _obscurePassphrase = true;

  String get _language => widget.diary.language;
  String _t(String key) => _catalog.t('cloud.$key', _language);
  bool get _restoreAllowed =>
      !widget.diary.locked && !widget.diary.storageError;
  bool get _hasBackup => _backupStatus?['hasBackup'] == true;
  int get _revision => (_backupStatus?['revision'] as num?)?.toInt() ?? 0;

  @override
  void initState() {
    super.initState();
    _api = widget.api ?? BloomApiClient();
    _ownsApi = widget.api == null;
    final currentAge = widget.diary.profile['ageGroup'];
    if (currentAge is String && ['adult', 'under18'].contains(currentAge)) {
      _ageGroup = currentAge;
    }
    if (_api.isConfigured) {
      _phase = 'loading';
      _loading = true;
      unawaited(_loadSession());
    }
  }

  @override
  void dispose() {
    _clearSecrets();
    _username.dispose();
    _password.dispose();
    _passwordConfirm.dispose();
    _backupPassphrase.dispose();
    _backupPassphraseConfirm.dispose();
    _restorePassphrase.dispose();
    if (_ownsApi) _api.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      backgroundColor: BloomTheme.background,
      surfaceTintColor: Colors.transparent,
      title: Text(_t('title')),
    ),
    body: SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
        children: [
          _privacyCard(),
          const SizedBox(height: 16),
          if (!_api.isConfigured) _configurationCard(),
          if (_api.isConfigured && _loading) _loadingCard(),
          if (_api.isConfigured && _phase == 'unavailable') _unavailableCard(),
          if (_api.isConfigured && _phase == 'guest') _authCard(),
          if (_api.isConfigured && _user != null) ..._signedInSections(),
        ],
      ),
    ),
  );

  Widget _privacyCard() => Container(
    padding: const EdgeInsets.all(19),
    decoration: BoxDecoration(
      color: const Color(0xFFF4F0F7),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.lock_outline_rounded, color: BloomTheme.plum),
            const SizedBox(width: 11),
            Expanded(
              child: Text(
                _t('privacy'),
                style: const TextStyle(color: BloomTheme.ink, height: 1.5),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(_t('limits'), style: const TextStyle(height: 1.45)),
        const SizedBox(height: 6),
        Text(
          _t('local'),
          style: const TextStyle(color: BloomTheme.muted, height: 1.45),
        ),
      ],
    ),
  );

  Widget _configurationCard() => Card(
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.link_rounded, color: BloomTheme.plum),
          const SizedBox(height: 12),
          Text(
            _t('title'),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: BloomTheme.ink,
            ),
          ),
          const SizedBox(height: 7),
          const Text(
            'Set BLOOM_API_BASE_URL to your backend origin (without /api/v1).',
            style: TextStyle(color: BloomTheme.muted, height: 1.5),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F4F8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const SelectableText(
              'flutter run --dart-define=BLOOM_API_BASE_URL=https://your-api.example.com',
              style: TextStyle(fontSize: 12, color: BloomTheme.plumDark),
            ),
          ),
        ],
      ),
    ),
  );

  Widget _loadingCard() => Card(
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(_t('loading'))),
        ],
      ),
    ),
  );

  Widget _unavailableCard() => Card(
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_error ?? _t('unavailable')),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _busy ? null : _retrySession,
            icon: const Icon(Icons.refresh_rounded),
            label: Text(_t('retry')),
          ),
        ],
      ),
    ),
  );

  Widget _authCard() => Card(
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _registering ? _t('register') : _t('signIn'),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: BloomTheme.ink,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _t('sessionHelp'),
              style: const TextStyle(color: BloomTheme.muted),
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: Text(_t('signIn')),
                  selected: !_registering,
                  onSelected: _busy ? null : (_) => _setMode(false),
                ),
                ChoiceChip(
                  label: Text(_t('register')),
                  selected: _registering,
                  onSelected: _busy || !_restoreAllowed
                      ? null
                      : (_) => _setMode(true),
                ),
              ],
            ),
            if (!_restoreAllowed) ...[
              const SizedBox(height: 10),
              _inlineNotice(_t('registrationLocked')),
            ],
            const SizedBox(height: 12),
            TextFormField(
              controller: _username,
              textInputAction: TextInputAction.next,
              autocorrect: false,
              enableSuggestions: false,
              textCapitalization: TextCapitalization.none,
              decoration: InputDecoration(
                labelText: _t('alias'),
                prefixIcon: const Icon(Icons.person_outline_rounded),
                helperText: _t('aliasHelp'),
              ),
              validator: (value) {
                final alias = (value ?? '').trim().toLowerCase();
                if (!RegExp(r'^[a-z0-9_]{3,32}$').hasMatch(alias)) {
                  return _t('invalid');
                }
                return null;
              },
            ),
            if (_registering) ...[
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _ageGroup,
                decoration: InputDecoration(labelText: _t('ageGroup')),
                items: [
                  DropdownMenuItem(
                    value: 'under18',
                    child: Text(_t('under18')),
                  ),
                  DropdownMenuItem(value: 'adult', child: Text(_t('adult'))),
                ],
                onChanged: _busy
                    ? null
                    : (value) => setState(() => _ageGroup = value),
                validator: (value) => value == null ? _t('selectAge') : null,
              ),
              const SizedBox(height: 6),
              Text(
                _t('ageHelp'),
                style: const TextStyle(color: BloomTheme.muted, fontSize: 12),
              ),
            ],
            const SizedBox(height: 12),
            TextFormField(
              controller: _password,
              obscureText: _obscurePassword,
              textInputAction: _registering
                  ? TextInputAction.next
                  : TextInputAction.done,
              maxLength: 128,
              decoration: InputDecoration(
                labelText: _t('password'),
                helperText: _t('passwordHelp'),
                counterText: '',
                prefixIcon: const Icon(Icons.key_rounded),
                suffixIcon: IconButton(
                  tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                  ),
                ),
              ),
              validator: (value) {
                final password = value ?? '';
                if (password.length < 12 || password.length > 128) {
                  return _t('invalid');
                }
                return null;
              },
              onFieldSubmitted: (_) {
                if (!_registering) _submit();
              },
            ),
            if (_registering) ...[
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordConfirm,
                obscureText: true,
                maxLength: 128,
                decoration: InputDecoration(
                  labelText: _t('confirmPassword'),
                  counterText: '',
                ),
                validator: (value) {
                  if (value != _password.text) return _t('mismatchPassword');
                  return null;
                },
                onFieldSubmitted: (_) => _submit(),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 10),
              _inlineNotice(_error!, danger: true),
            ],
            if (_notice != null) ...[
              const SizedBox(height: 10),
              _inlineNotice(_notice!),
            ],
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton(
                onPressed: _busy ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: BloomTheme.plumDark,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                ),
                child: _busy
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(_registering ? _t('register') : _t('signIn')),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  List<Widget> _signedInSections() {
    final sections = <Widget>[
      _accountCard(),
      const SizedBox(height: 14),
      if (_pendingRestore != null)
        _restoreReviewCard()
      else ...[
        if (widget.diary.hasDiary && _restoreAllowed)
          _uploadCard()
        else
          _uploadUnavailableCard(),
        if (_hasBackup && _restoreAllowed) ...[
          const SizedBox(height: 14),
          _restoreCard(),
        ] else if (_hasBackup && !_restoreAllowed) ...[
          const SizedBox(height: 14),
          _sectionCard(_t('restoreLocked')),
        ],
        const SizedBox(height: 14),
        _deletionCard(),
      ],
    ];
    if (_error != null) {
      sections.insert(1, _inlineNotice(_error!, danger: true));
      sections.insert(2, const SizedBox(height: 10));
    }
    if (_notice != null) {
      sections.insert(1, _inlineNotice(_notice!));
      sections.insert(2, const SizedBox(height: 10));
    }
    return sections;
  }

  Widget _accountCard() {
    final username = _user?['username']?.toString() ?? 'Bloom member';
    final updatedAt = _backupStatus?['updatedAt']?.toString();
    final dateLabel = updatedAt == null ? null : _formatDate(updatedAt);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.verified_user_outlined,
                  color: BloomTheme.plum,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${_t('signedIn')} $username',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: BloomTheme.ink,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: _hasBackup ? BloomTheme.sage : const Color(0xFFF7F4F8),
                borderRadius: BorderRadius.circular(13),
              ),
              child: Row(
                children: [
                  Icon(
                    _hasBackup
                        ? Icons.cloud_done_outlined
                        : Icons.cloud_outlined,
                    color: BloomTheme.plumDark,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _hasBackup ? _t('backupExists') : _t('noBackup'),
                      style: const TextStyle(
                        color: BloomTheme.ink,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Text('${_t('revision')}: $_revision'),
            if (dateLabel != null) Text('${_t('savedAt')}: $dateLabel'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                OutlinedButton.icon(
                  onPressed: _busy ? null : _refreshStatus,
                  icon: const Icon(Icons.refresh_rounded),
                  label: Text(_t('retry')),
                ),
                TextButton.icon(
                  onPressed: _busy ? null : _signOut,
                  icon: const Icon(Icons.logout_rounded),
                  label: Text(_t('logout')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _uploadUnavailableCard() => _sectionCard(
    widget.diary.hasDiary ? _t('restoreLocked') : _t('uploadNeedsDiary'),
  );

  Widget _uploadCard() => Card(
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('uploadTitle', Icons.cloud_upload_outlined),
          const SizedBox(height: 7),
          Text(
            _t('uploadHelp'),
            style: const TextStyle(color: BloomTheme.muted),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _backupPassphrase,
            obscureText: _obscurePassphrase,
            maxLength: 1024,
            decoration: InputDecoration(
              labelText: _t('passphrase'),
              counterText: '',
              suffixIcon: IconButton(
                tooltip: _obscurePassphrase
                    ? 'Show passphrase'
                    : 'Hide passphrase',
                onPressed: () =>
                    setState(() => _obscurePassphrase = !_obscurePassphrase),
                icon: Icon(
                  _obscurePassphrase
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _backupPassphraseConfirm,
            obscureText: true,
            maxLength: 1024,
            decoration: InputDecoration(
              labelText: _t('confirmPassphrase'),
              counterText: '',
            ),
          ),
          const SizedBox(height: 7),
          Text(
            _t('passphraseHelp'),
            style: const TextStyle(
              color: BloomTheme.muted,
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _busy ? null : _uploadEncryptedDiary,
              icon: const Icon(Icons.lock_outline_rounded),
              label: Text(_busy ? _t('busy') : _t('upload')),
            ),
          ),
        ],
      ),
    ),
  );

  Widget _restoreCard() => Card(
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('restoreTitle', Icons.cloud_download_outlined),
          const SizedBox(height: 7),
          Text(
            _t('restoreHelp'),
            style: const TextStyle(color: BloomTheme.muted),
          ),
          const SizedBox(height: 13),
          TextField(
            controller: _restorePassphrase,
            obscureText: true,
            maxLength: 1024,
            decoration: InputDecoration(
              labelText: _t('restorePassphrase'),
              counterText: '',
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _busy ? null : _decryptCloudDiary,
            icon: const Icon(Icons.lock_open_rounded),
            label: Text(_busy ? _t('busy') : _t('decrypt')),
          ),
        ],
      ),
    ),
  );

  Widget _restoreReviewCard() => Card(
    color: const Color(0xFFF4F0F7),
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('reviewTitle', Icons.fact_check_outlined),
          const SizedBox(height: 7),
          Text(_t('reviewHelp'), style: const TextStyle(height: 1.45)),
          const SizedBox(height: 12),
          Text(
            'Entries in backup: ${(_pendingRestore?['logs'] as Map?)?.length ?? 0}',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 13),
          Wrap(
            spacing: 8,
            children: [
              FilledButton(
                onPressed: _busy ? null : _confirmAndRestore,
                child: Text(_busy ? _t('busy') : _t('restore')),
              ),
              TextButton(
                onPressed: _busy
                    ? null
                    : () => setState(() {
                        _pendingRestore = null;
                        _error = null;
                      }),
                child: Text(_t('cancel')),
              ),
            ],
          ),
        ],
      ),
    ),
  );

  Widget _deletionCard() => Card(
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _t('deleteTitle'),
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(
            _t('deleteHelp'),
            style: const TextStyle(color: BloomTheme.muted),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            children: [
              if (_hasBackup)
                OutlinedButton.icon(
                  onPressed: _busy ? null : _confirmDeleteBackup,
                  icon: const Icon(Icons.delete_outline_rounded),
                  label: Text(_t('deleteBackup')),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: BloomTheme.coral,
                  ),
                ),
              OutlinedButton.icon(
                onPressed: _busy ? null : _confirmDeleteAccount,
                icon: const Icon(Icons.person_off_outlined),
                label: Text(_t('deleteAccount')),
                style: OutlinedButton.styleFrom(
                  foregroundColor: BloomTheme.coral,
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );

  Widget _sectionCard(String text) => Card(
    child: Padding(padding: const EdgeInsets.all(18), child: Text(text)),
  );

  Widget _sectionTitle(String key, IconData icon) => Row(
    children: [
      Expanded(
        child: Text(
          _t(key),
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
      ),
      Icon(icon, color: BloomTheme.plum),
    ],
  );

  Widget _inlineNotice(String text, {bool danger = false}) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: danger ? const Color(0xFFFFF0F0) : const Color(0xFFF4F0F7),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Text(
      text,
      style: TextStyle(
        color: danger ? const Color(0xFF9D3D47) : BloomTheme.ink,
        height: 1.4,
      ),
    ),
  );

  void _setMode(bool registering) {
    setState(() {
      _registering = registering;
      _error = null;
      _notice = null;
      _clearSecrets();
    });
  }

  Future<void> _loadSession() async {
    try {
      final session = await _api.session();
      final user = Map<String, dynamic>.from(session['user'] as Map);
      final status = await _api.backupStatus();
      if (!mounted) return;
      setState(() {
        _user = user;
        _backupStatus = status;
        _phase = 'signedIn';
        _loading = false;
        _error = null;
      });
    } on BloomApiException catch (error) {
      if (!mounted) return;
      if (error.statusCode == 401 || error.code == 'AUTH_REQUIRED') {
        setState(() {
          _phase = 'guest';
          _loading = false;
          _user = null;
          _backupStatus = null;
        });
      } else {
        setState(() {
          _phase = 'unavailable';
          _loading = false;
          _error = _friendlyError(error);
        });
      }
    } on Object catch (error) {
      if (!mounted) return;
      setState(() {
        _phase = 'unavailable';
        _loading = false;
        _error = _friendlyError(error);
      });
    }
  }

  Future<void> _retrySession() async {
    setState(() {
      _loading = true;
      _phase = 'loading';
      _error = null;
    });
    await _loadSession();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    if (_registering && !_restoreAllowed) {
      setState(() => _error = _t('registrationLocked'));
      return;
    }
    if (_registering && _password.text != _passwordConfirm.text) {
      setState(() => _error = _t('mismatchPassword'));
      return;
    }
    await _perform(() async {
      final alias = _username.text.trim().toLowerCase();
      final result = _registering
          ? await _api.register(username: alias, password: _password.text)
          : await _api.login(username: alias, password: _password.text);
      if (!mounted) return;
      setState(() {
        _user = Map<String, dynamic>.from(result['user'] as Map);
        _phase = 'signedIn';
        _username.clear();
      });
      if (_registering) {
        final saved = await widget.diary.registerProfile(_ageGroup ?? '');
        if (saved) {
          widget.onDiaryChanged?.call();
          if (mounted) setState(() => _notice = _t('accountCreated'));
        } else if (mounted) {
          setState(() => _error = _t('profileSaveFailed'));
        }
      }
      try {
        final status = await _api.backupStatus();
        if (mounted) setState(() => _backupStatus = status);
      } on Object {
        // A successful registration/login must not be presented as failed if a
        // follow-up status check is temporarily unavailable.
      }
    });
  }

  Future<void> _refreshStatus() => _perform(() async {
    final result = await _api.backupStatus();
    if (mounted) setState(() => _backupStatus = result);
  });

  Future<void> _uploadEncryptedDiary() async {
    final passphrase = _backupPassphrase.text;
    if (passphrase.length < 12 || passphrase.length > 1024) {
      setState(() => _error = _t('invalid'));
      return;
    }
    if (passphrase != _backupPassphraseConfirm.text) {
      setState(() => _error = _t('mismatch'));
      return;
    }
    await _perform(() async {
      final encryptedText = await widget.diary.exportEncryptedBackup(
        passphrase,
      );
      final decoded = jsonDecode(encryptedText);
      if (decoded is! Map) {
        throw const FormatException('invalidEncryptedBackup');
      }
      final result = await _api.uploadEncryptedBackup(
        backup: Map<String, dynamic>.from(decoded),
        expectedRevision: _revision,
      );
      if (mounted) {
        setState(() {
          _backupStatus = {...result, 'hasBackup': true};
          _notice = _t('saved');
        });
      }
    });
  }

  Future<void> _decryptCloudDiary() async {
    final passphrase = _restorePassphrase.text;
    if (passphrase.length < 12 || passphrase.length > 1024) {
      setState(() => _error = _t('invalid'));
      return;
    }
    await _perform(() async {
      final response = await _api.downloadBackup();
      final backup = response['backup'];
      if (backup is! Map) throw const FormatException('invalidEncryptedBackup');
      final restored = await widget.diary.decryptEncryptedBackup(
        jsonEncode(backup),
        passphrase,
      );
      if (mounted) {
        setState(() {
          _pendingRestore = restored;
          _notice = null;
        });
      }
    });
  }

  Future<void> _confirmAndRestore() async {
    final confirmed = await _confirm(
      _t('reviewTitle'),
      _t('reviewHelp'),
      _t('restore'),
    );
    if (!confirmed || !mounted) return;
    await _perform(() async {
      final snapshot = _pendingRestore;
      if (snapshot == null || !await widget.diary.importAndReplace(snapshot)) {
        throw const FormatException('requestFailed');
      }
      widget.onDiaryChanged?.call();
      if (mounted) {
        setState(() {
          _pendingRestore = null;
          _notice = _t('restored');
        });
      }
    });
  }

  Future<void> _confirmDeleteBackup() async {
    final confirmed = await _confirm(
      _t('confirmDeleteBackup'),
      _t('confirmDeleteBackupHelp'),
      _t('deleteBackup'),
      danger: true,
    );
    if (!confirmed || !mounted) return;
    await _perform(() async {
      final result = await _api.deleteBackup(_revision);
      if (mounted) {
        setState(() {
          _backupStatus = {...result, 'hasBackup': false};
          _notice = _t('deleted');
        });
      }
    });
  }

  Future<void> _confirmDeleteAccount() async {
    final passwordController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(_t('confirmDeleteAccount')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_t('confirmDeleteAccountHelp')),
            const SizedBox(height: 14),
            TextField(
              controller: passwordController,
              obscureText: true,
              maxLength: 128,
              decoration: InputDecoration(
                labelText: _t('password'),
                counterText: '',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(_t('cancel')),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: BloomTheme.coral),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(_t('deleteAccount')),
          ),
        ],
      ),
    );
    final password = passwordController.text;
    passwordController.dispose();
    if (confirmed != true || !mounted) return;
    if (password.isEmpty) {
      setState(() => _error = _t('invalid'));
      return;
    }
    await _perform(() async {
      await _api.deleteAccount(password);
      if (mounted) {
        setState(() {
          _user = null;
          _backupStatus = null;
          _pendingRestore = null;
          _phase = 'guest';
          _notice = _t('accountDeleted');
        });
      }
    });
  }

  Future<void> _signOut() async {
    await _perform(() async {
      try {
        await _api.logout();
      } finally {
        if (mounted) {
          setState(() {
            _user = null;
            _backupStatus = null;
            _pendingRestore = null;
            _phase = 'guest';
          });
        }
      }
    });
  }

  Future<bool> _confirm(
    String title,
    String message,
    String action, {
    bool danger = false,
  }) async =>
      await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: Text(_t('cancel')),
            ),
            FilledButton(
              style: danger
                  ? FilledButton.styleFrom(backgroundColor: BloomTheme.coral)
                  : null,
              onPressed: () => Navigator.pop(dialogContext, true),
              child: Text(action),
            ),
          ],
        ),
      ) ??
      false;

  Future<void> _perform(Future<void> Function() work) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
      _notice = null;
    });
    try {
      await work();
    } on Object catch (error) {
      if (!mounted) return;
      final code = _errorCode(error);
      if (code == 'BACKUP_CONFLICT' || code == 'BACKUP_NOT_FOUND') {
        try {
          final status = await _api.backupStatus();
          if (mounted) setState(() => _backupStatus = status);
        } on Object {
          // Preserve the original failure and never retry with a newer revision.
        }
      }
      setState(() => _error = _friendlyError(error));
    } finally {
      if (mounted) {
        _clearSecrets();
        setState(() => _busy = false);
      }
    }
  }

  String _errorCode(Object error) {
    if (error is BloomApiException) return error.code;
    if (error is FormatException) return error.message.toString();
    return error.toString();
  }

  String _friendlyError(Object error) {
    final key = switch (_errorCode(error)) {
      'INVALID_CREDENTIALS' => 'wrongPassword',
      'USERNAME_TAKEN' => 'aliasTaken',
      'BODY_INVALID' || 'VALIDATION_ERROR' => 'invalid',
      'BACKUP_CONFLICT' => 'conflict',
      'BACKUP_NOT_FOUND' => 'notFound',
      'CSRF_INVALID' => 'csrf',
      'RATE_LIMITED' => 'rateLimited',
      'AUTH_REQUIRED' => 'expired',
      'backupPassphraseWrong' => 'wrongPassphrase',
      'backupPassphraseFormat' => 'invalid',
      'backupCryptoUnavailable' => 'crypto',
      'invalidImport' ||
      'invalidEncryptedBackup' ||
      'backupUnsupported' => 'invalidBackup',
      'SERVER_UNAVAILABLE' || 'SERVICE_UNAVAILABLE' => 'unavailable',
      _ => 'requestFailed',
    };
    return _t(key);
  }

  String _formatDate(String value) {
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    final date = parsed.toLocal();
    String twoDigits(int number) => number.toString().padLeft(2, '0');
    return '${date.year}-${twoDigits(date.month)}-${twoDigits(date.day)} ${twoDigits(date.hour)}:${twoDigits(date.minute)}';
  }

  void _clearSecrets() {
    _password.clear();
    _passwordConfirm.clear();
    _backupPassphrase.clear();
    _backupPassphraseConfirm.clear();
    _restorePassphrase.clear();
  }
}

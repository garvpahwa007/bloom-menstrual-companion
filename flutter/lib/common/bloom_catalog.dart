import 'dart:convert';

import 'package:flutter/services.dart';

import 'phase_analysis_translations.dart';

class BloomCatalog {
  BloomCatalog._(this._data);
  final Map<String, dynamic> _data;
  static BloomCatalog? _instance;

  static Future<BloomCatalog> load() async {
    final decoded = jsonDecode(
      await rootBundle.loadString('assets/content/react_content.json'),
    ) as Map<String, dynamic>;
    return _instance = BloomCatalog._(decoded);
  }

  static BloomCatalog get instance {
    final value = _instance;
    if (value == null) {
      throw StateError('BloomCatalog.load() must complete before runApp().');
    }
    return value;
  }

  Map<String, dynamic> get data => Map.unmodifiable(_data);
  Map<String, dynamic> section(String key) =>
      Map<String, dynamic>.from(_data[key] as Map? ?? const {});
  List<dynamic> list(String key) =>
      List<dynamic>.from(_data[key] as List? ?? const []);
  dynamic get(String key) => _data[key];

  String t(
    String key,
    String language, [
    Map<String, Object?> variables = const {},
  ]) {
    final translations =
        _data['translations'] as Map<String, dynamic>? ?? const {};
    final selected =
        translations[language] as Map<String, dynamic>? ?? const {};
    final english = translations['en'] as Map<String, dynamic>? ?? const {};
    final value =
        selected[key] ??
        english[key] ??
        PhaseAnalysisTranslations.lookup(key, language) ??
        key;
    var output = value.toString();
    for (final entry in variables.entries) {
      output = output.replaceAll('{${entry.key}}', '${entry.value}');
    }
    return output;
  }

  String contentText(dynamic value, String language) {
    if (value is Map) {
      final selected =
          value[language] ?? value['en'] ?? value.values.firstOrNull;
      return selected?.toString() ?? '';
    }
    return value?.toString() ?? '';
  }
}

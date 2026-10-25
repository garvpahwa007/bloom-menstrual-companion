import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../log/services/diary_repository.dart';

class PrivacyPage extends StatefulWidget {
  const PrivacyPage({super.key, required this.diary, required this.onNavigate});
  final DiaryRepository diary;
  final ValueChanged<String> onNavigate;
  @override
  State<PrivacyPage> createState() => _PrivacyPageState();
}

class _PrivacyPageState extends State<PrivacyPage> {
  final _catalog = BloomCatalog.instance;
  bool _busy = false;
  String? _error;
  String get _lang => widget.diary.language;

  @override
  Widget build(BuildContext context) => FeatureScaffold(
    title: _catalog.t('privacyData.title', _lang),
    kicker: _catalog.t('privacyData.kicker', _lang),
    subtitle: _catalog.t('privacyData.subtitle', _lang),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        BloomCard(
          title: _catalog.t('privacyData.storageTitle', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _catalog.t('privacyData.storageBody', _lang),
                style: const TextStyle(height: 1.5),
              ),
              const SizedBox(height: 10),
              Text(
                _catalog.t(
                  widget.diary.isPinEnabled
                      ? 'privacyData.pinOn'
                      : 'privacyData.pinOff',
                  _lang,
                ),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              Text(
                _catalog.t(
                  widget.diary.isPinEnabled
                      ? 'privacyData.pinOnBody'
                      : 'privacyData.pinOffBody',
                  _lang,
                ),
              ),
              TextButton(
                onPressed: () => widget.onNavigate('settings'),
                child: Text(_catalog.t('privacyData.managePin', _lang)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('privacyData.backupTitle', _lang),
          subtitle: _catalog.t('privacyData.backupBody', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _export('json'),
                    icon: const Icon(Icons.data_object_rounded),
                    label: Text(_catalog.t('settings.exportJSON', _lang)),
                  ),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _export('csv'),
                    icon: const Icon(Icons.table_chart_outlined),
                    label: Text(_catalog.t('settings.exportCSV', _lang)),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: _busy ? null : _encryptedExport,
                    icon: const Icon(Icons.enhanced_encryption_outlined),
                    label: Text(_catalog.t('settings.exportEncrypted', _lang)),
                  ),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : _import,
                    icon: const Icon(Icons.file_open_outlined),
                    label: Text(_catalog.t('settings.import', _lang)),
                  ),
                ],
              ),
              if (_busy)
                const Padding(
                  padding: EdgeInsets.only(top: 10),
                  child: LinearProgressIndicator(),
                ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 9),
                  child: Text(
                    _catalog.t(_error!, _lang),
                    style: const TextStyle(color: Color(0xFF9D3D47)),
                  ),
                ),
              const SizedBox(height: 9),
              Text(
                _catalog.t('privacyData.restoreHelp', _lang),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('privacyData.cloudTitle', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_catalog.t('privacyData.cloudBody', _lang)),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => widget.onNavigate('cloud'),
                child: Text(_catalog.t('privacyData.cloudOpen', _lang)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('privacyData.deleteTitle', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_catalog.t('privacyData.deleteBody', _lang)),
              const SizedBox(height: 9),
              OutlinedButton.icon(
                onPressed: _delete,
                icon: const Icon(
                  Icons.delete_outline_rounded,
                  color: Color(0xFF9D3D47),
                ),
                label: Text(
                  _catalog.t('settings.delete', _lang),
                  style: const TextStyle(color: Color(0xFF9D3D47)),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );

  Future<void> _export(String kind) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final content = kind == 'csv'
          ? widget.diary.exportCsv()
          : await widget.diary.exportJson();
      await Share.share(
        content,
        subject:
            '${_catalog.t('app.name', _lang)} ${_catalog.t(kind == 'csv' ? 'settings.exportCSV' : 'settings.exportJSON', _lang)}',
      );
    } on Object {
      if (mounted) setState(() => _error = 'common.error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _encryptedExport() async {
    final pass = TextEditingController();
    final confirm = TextEditingController();
    final values = await showDialog<(String, String)?>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_catalog.t('settings.encryptedBackupActionExport', _lang)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_catalog.t('settings.encryptedBackupBody', _lang)),
            const SizedBox(height: 10),
            TextField(
              controller: pass,
              obscureText: true,
              decoration: InputDecoration(
                labelText: _catalog.t(
                  'settings.encryptedBackupPassword',
                  _lang,
                ),
              ),
            ),
            TextField(
              controller: confirm,
              obscureText: true,
              decoration: InputDecoration(
                labelText: _catalog.t('settings.encryptedBackupConfirm', _lang),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(_catalog.t('common.cancel', _lang)),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, (pass.text, confirm.text)),
            child: Text(_catalog.t('settings.exportEncrypted', _lang)),
          ),
        ],
      ),
    );
    if (values == null) {
      pass.dispose();
      confirm.dispose();
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (values.$1 != values.$2)
        throw const FormatException('backupPassphraseMismatch');
      final output = await widget.diary.exportEncryptedBackup(values.$1);
      await Share.share(
        output,
        subject: '${_catalog.t('app.name', _lang)} encrypted backup',
      );
    } on FormatException catch (error) {
      if (mounted)
        setState(
          () => _error = error.message == 'backupPassphraseMismatch'
              ? 'settings.encryptedBackupMismatch'
              : 'settings.encryptedBackupTooShort',
        );
    } on Object {
      if (mounted) setState(() => _error = 'settings.encryptedBackupError');
    } finally {
      pass.dispose();
      confirm.dispose();
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _import() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['json', 'csv', 'bloombackup'],
      withData: true,
    );
    final files = result?.files ?? const <PlatformFile>[];
    if (files.isEmpty || files.first.bytes == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final text = utf8.decode(files.first.bytes!);
      Object? decoded;
      try {
        decoded = jsonDecode(text);
      } on FormatException {
        decoded = null;
      }
      Map<String, dynamic> imported;
      if (decoded is Map && decoded['format'] == 'bloom-encrypted-backup') {
        final pass = await _askPassphrase();
        if (pass == null) return;
        imported = await widget.diary.decryptEncryptedBackup(text, pass);
      } else {
        imported = await widget.diary.importText(text);
      }
      if (!mounted) return;
      final accepted = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(_catalog.t('settings.importConfirm', _lang)),
          content: Text(_catalog.t('settings.importConfirm', _lang)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(_catalog.t('common.cancel', _lang)),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(_catalog.t('settings.import', _lang)),
            ),
          ],
        ),
      );
      if (accepted == true) {
        final saved = await widget.diary.importAndReplace(imported);
        if (!saved) throw const FormatException('invalidImport');
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(_catalog.t('settings.imported', _lang))),
          );
      }
    } on FormatException catch (error) {
      if (mounted)
        setState(
          () => _error = switch (error.message) {
            'backupPassphraseWrong' => 'settings.encryptedBackupWrongPassword',
            'backupUnsupported' => 'settings.encryptedBackupUnsupported',
            _ => 'settings.invalidImport',
          },
        );
    } on Object {
      if (mounted) setState(() => _error = 'settings.invalidImport');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<String?> _askPassphrase() async {
    final input = TextEditingController();
    final value = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_catalog.t('settings.encryptedBackupActionImport', _lang)),
        content: TextField(
          controller: input,
          obscureText: true,
          decoration: InputDecoration(
            labelText: _catalog.t('settings.encryptedBackupPassword', _lang),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(_catalog.t('common.cancel', _lang)),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, input.text),
            child: Text(_catalog.t('settings.import', _lang)),
          ),
        ],
      ),
    );
    input.dispose();
    return value;
  }

  Future<void> _delete() async {
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_catalog.t('privacyData.deleteTitle', _lang)),
        content: Text(_catalog.t('settings.deleteConfirm', _lang)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(_catalog.t('common.cancel', _lang)),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(_catalog.t('settings.delete', _lang)),
          ),
        ],
      ),
    );
    if (accepted == true) await widget.diary.deleteEverything();
  }
}

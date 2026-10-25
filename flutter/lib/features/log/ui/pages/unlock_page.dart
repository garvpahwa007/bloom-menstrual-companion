import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../services/diary_repository.dart';

class UnlockPage extends StatefulWidget {
  const UnlockPage({super.key, required this.diary});
  final DiaryRepository diary;
  @override
  State<UnlockPage> createState() => _UnlockPageState();
}

class _UnlockPageState extends State<UnlockPage> {
  final _pin = TextEditingController();
  bool _busy = false;
  bool _wrong = false;
  final _catalog = BloomCatalog.instance;
  String get _language => widget.diary.language;

  @override
  void dispose() {
    _pin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Image.asset(
                  'assets/images/bloom-mark.png',
                  width: 62,
                  height: 62,
                ),
                const SizedBox(height: 18),
                Text(
                  _catalog.t('lock.title', _language),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  _catalog.t('lock.body', _language),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 22),
                TextField(
                  controller: _pin,
                  autofocus: true,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 24,
                    letterSpacing: 12,
                    fontWeight: FontWeight.w700,
                  ),
                  decoration: InputDecoration(
                    labelText: _catalog.t('lock.pin', _language),
                    counterText: '',
                    errorText: _wrong
                        ? _catalog.t('lock.wrongPin', _language)
                        : null,
                  ),
                  onSubmitted: (_) => _unlock(),
                ),
                const SizedBox(height: 14),
                FilledButton(
                  onPressed: _busy ? null : _unlock,
                  style: FilledButton.styleFrom(
                    backgroundColor: BloomTheme.plumDark,
                    minimumSize: const Size.fromHeight(50),
                  ),
                  child: _busy
                      ? const CircularProgressIndicator()
                      : Text(_catalog.t('lock.unlock', _language)),
                ),
                const SizedBox(height: 14),
                Text(
                  _catalog.t('lock.forgot', _language),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall
                      ?.copyWith(color: BloomTheme.muted),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  Future<void> _unlock() async {
    if (_pin.text.length != 4) return;
    setState(() {
      _busy = true;
      _wrong = false;
    });
    final result = await widget.diary.unlockPin(_pin.text);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _wrong = !result;
      if (result) _pin.clear();
    });
  }
}

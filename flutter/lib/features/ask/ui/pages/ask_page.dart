import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../log/services/diary_repository.dart';
import '../../services/ask_service.dart';

class AskPage extends StatefulWidget {
  const AskPage({super.key, required this.diary, required this.onNavigate});
  final DiaryRepository diary;
  final ValueChanged<String> onNavigate;
  @override
  State<AskPage> createState() => _AskPageState();
}

class _AskPageState extends State<AskPage> {
  final _catalog = BloomCatalog.instance;
  final _question = TextEditingController();
  final _tts = FlutterTts();
  final _messages = <({String question, BloomAnswer answer})>[];
  bool _speaking = false;
  String get _lang => widget.diary.language;

  @override
  void dispose() {
    _question.dispose();
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final faq = _catalog.list('faq').whereType<Map>().toList();
    final suggestions = ['late', 'pcos', 'cramps', 'heavy']
        .map((id) => faq.where((e) => e['id'] == id).firstOrNull)
        .whereType<Map>()
        .toList();
    return FeatureScaffold(
      title: _catalog.t('ask.title', _lang),
      kicker: _catalog.t('ask.kicker', _lang),
      subtitle: _catalog.t('ask.subtitle', _lang),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          BloomCard(
            color: BloomTheme.lilac,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.shield_outlined, color: BloomTheme.plum),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _catalog.t('ask.local', _lang),
                    style: const TextStyle(height: 1.5),
                  ),
                ),
              ],
            ),
          ),
          if (_messages.isEmpty) ...[
            const SizedBox(height: 14),
            Text(
              _catalog.t('ask.suggestions', _lang),
              style: Theme.of(context).textTheme.labelLarge
                  ?.copyWith(color: BloomTheme.plum),
            ),
            const SizedBox(height: 8),
            ...suggestions.map((item) {
              final question = _catalog.contentText(item['question'], _lang);
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: OutlinedButton.icon(
                  onPressed: () => _ask(question),
                  icon: const Icon(Icons.arrow_outward_rounded),
                  label: Text(question, textAlign: TextAlign.start),
                ),
              );
            }),
          ],
          ..._messages.map(
            (message) => Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: Container(
                      padding: const EdgeInsets.all(13),
                      constraints: const BoxConstraints(maxWidth: 320),
                      decoration: BoxDecoration(
                        color: BloomTheme.lilac,
                        borderRadius: BorderRadius.circular(17),
                      ),
                      child: Text(message.question),
                    ),
                  ),
                  const SizedBox(height: 8),
                  BloomCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.spa_outlined,
                              color: BloomTheme.plum,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _catalog.t('ask.assistant', _lang),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Spacer(),
                            IconButton(
                              tooltip: _catalog.t(
                                _speaking ? 'learn.stop' : 'learn.listen',
                                _lang,
                              ),
                              onPressed: message.answer.text == null
                                  ? null
                                  : () => _speak(message.answer.text!),
                              icon: Icon(
                                _speaking
                                    ? Icons.stop_circle_outlined
                                    : Icons.volume_up_outlined,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          message.answer.text ??
                              _catalog.t('ask.unknown', _lang),
                          style: const TextStyle(height: 1.55),
                        ),
                        if (message.answer.safety == 'urgent')
                          Padding(
                            padding: const EdgeInsets.only(top: 10),
                            child: Wrap(
                              spacing: 8,
                              children: [
                                FilledButton.icon(
                                  onPressed: () =>
                                      launchUrl(Uri.parse('tel:112')),
                                  icon: const Icon(Icons.call, size: 18),
                                  label: Text(
                                    _catalog.t('doctor.call112', _lang),
                                  ),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () =>
                                      launchUrl(Uri.parse('tel:108')),
                                  icon: const Icon(
                                    Icons.call_outlined,
                                    size: 18,
                                  ),
                                  label: Text(
                                    _catalog.t('doctor.call108', _lang),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        if (message.answer.consult)
                          TextButton.icon(
                            onPressed: () => widget.onNavigate('visit'),
                            icon: const Icon(Icons.description_outlined),
                            label: Text(_catalog.t('ask.visit', _lang)),
                          ),
                        if (message.answer.sourceIds.isNotEmpty)
                          _SourceChips(
                            ids: message.answer.sourceIds,
                            language: _lang,
                            catalog: _catalog,
                          ),
                        const SizedBox(height: 7),
                        Text(
                          _catalog.t('common.notice', _lang),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _question,
            maxLength: 1500,
            minLines: 2,
            maxLines: 4,
            textInputAction: TextInputAction.send,
            decoration: InputDecoration(
              labelText: _catalog.t('ask.label', _lang),
              hintText: _catalog.t('ask.placeholder', _lang),
              counterText: '',
              suffixIcon: IconButton(
                tooltip: _catalog.t('ask.send', _lang),
                onPressed: _question.text.trim().isEmpty
                    ? null
                    : () => _ask(_question.text),
                icon: const Icon(Icons.arrow_upward_rounded),
              ),
            ),
            onSubmitted: (value) => _ask(value),
            onChanged: (_) => setState(() {}),
          ),
          if (_messages.isNotEmpty)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => setState(_messages.clear),
                child: Text(_catalog.t('ask.clear', _lang)),
              ),
            ),
          const SizedBox(height: 5),
          Text(
            _catalog.t('ask.fallback', _lang),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  void _ask(String text) {
    if (text.trim().isEmpty) return;
    final answer = answerQuestion(text, _lang);
    setState(() {
      _messages.add((question: text.trim(), answer: answer));
      _question.clear();
    });
    if (widget.diary.settings['readAloud'] == true && answer.text != null) {
      _speak(answer.text!);
    }
  }

  Future<void> _speak(String text) async {
    try {
      if (_speaking) {
        await _tts.stop();
        setState(() => _speaking = false);
        return;
      }
      await _tts.setLanguage(switch (_lang) {
        'hi' => 'hi-IN',
        'ta' => 'ta-IN',
        _ => 'en-IN',
      });
      _tts.setCompletionHandler(() {
        if (mounted) setState(() => _speaking = false);
      });
      setState(() => _speaking = true);
      await _tts.speak(text);
    } on Object {
      if (mounted) setState(() => _speaking = false);
    }
  }
}

class _SourceChips extends StatelessWidget {
  const _SourceChips({
    required this.ids,
    required this.language,
    required this.catalog,
  });
  final List<String> ids;
  final String language;
  final BloomCatalog catalog;
  @override
  Widget build(BuildContext context) {
    final sources = catalog.section('sources');
    return Padding(
      padding: const EdgeInsets.only(top: 9),
      child: Wrap(
        spacing: 6,
        children: ids.map((id) {
          final data = sources[id];
          final source = data is Map ? data : const {};
          final title = catalog.contentText(
            source['shortTitle'] ?? source['title'] ?? id,
            language,
          );
          final url = source['url']?.toString();
          return ActionChip(
            label: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
            onPressed: url == null ? null : () => launchUrl(Uri.parse(url)),
          );
        }).toList(),
      ),
    );
  }
}

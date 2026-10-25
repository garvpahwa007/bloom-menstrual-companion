import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../log/services/diary_repository.dart';

class LearnPage extends StatefulWidget {
  const LearnPage({super.key, required this.diary});
  final DiaryRepository diary;
  @override
  State<LearnPage> createState() => _LearnPageState();
}

class _LearnPageState extends State<LearnPage> {
  final _catalog = BloomCatalog.instance;
  final _tts = FlutterTts();
  String? _lessonId;
  bool _speaking = false;
  String get _lang => widget.diary.language;

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lessonMap = _catalog
        .list('lessons')
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
    final paths = _catalog.section('learningPaths');
    final order =
        (paths[widget.diary.profile['ageGroup'] == 'adult'
                        ? 'adult'
                        : 'under18']
                    as List? ??
                const [])
            .cast<String>();
    final lessons = order
        .map((id) => lessonMap.where((e) => e['id'] == id).firstOrNull)
        .whereType<Map<String, dynamic>>()
        .toList();
    final selected = lessonMap.where((e) => e['id'] == _lessonId).firstOrNull;
    if (selected != null) return _detail(selected);
    return FeatureScaffold(
      title: _catalog.t('learn.title', _lang),
      kicker: _catalog.t('learn.kicker', _lang),
      subtitle: _catalog.t('learn.subtitle', _lang),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (lessons.isNotEmpty) _featured(lessons.first),
          const SizedBox(height: 14),
          ...lessons.asMap().entries.map((entry) {
            final index = entry.key;
            final lesson = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () =>
                      setState(() => _lessonId = lesson['id'] as String),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: index.isEven
                                ? BloomTheme.lilac
                                : BloomTheme.peach,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            _iconFor(lesson['icon'] as String?),
                            color: BloomTheme.plum,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _text(lesson['title']),
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _text(lesson['summary']),
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _catalog.t('learn.read', _lang),
                                style: const TextStyle(
                                  color: BloomTheme.plum,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right_rounded,
                          color: BloomTheme.muted,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _featured(Map<String, dynamic> lesson) => Container(
    padding: const EdgeInsets.all(19),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [BloomTheme.heroStart, BloomTheme.heroEnd],
      ),
      borderRadius: BorderRadius.circular(23),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _catalog
              .t(
                widget.diary.profile['ageGroup'] == 'adult'
                    ? 'learn.pathAdult'
                    : 'learn.pathUnder18',
                _lang,
              )
              .toUpperCase(),
          style: const TextStyle(
            color: Color(0xFFE9DCEE),
            letterSpacing: 1,
            fontWeight: FontWeight.w700,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _text(lesson['title']),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _text(lesson['summary']),
          style: const TextStyle(color: Colors.white, height: 1.45),
        ),
        const SizedBox(height: 12),
        FilledButton.tonalIcon(
          onPressed: () => setState(() => _lessonId = lesson['id'] as String),
          icon: const Icon(Icons.menu_book_rounded),
          label: Text(_catalog.t('learn.read', _lang)),
        ),
      ],
    ),
  );

  Widget _detail(Map<String, dynamic> lesson) {
    final bodyMap = lesson['body'] as Map? ?? const {};
    final paragraphs = (bodyMap[_lang] ?? bodyMap['en'] ?? const [])
        .cast<String>();
    final diagrams = _catalog.section('lessonDiagrams');
    final diagram = diagrams[lesson['id']];
    final allText = [_text(lesson['title']), ...paragraphs].join('. ');
    final sourceIds = (lesson['sourceIds'] as List? ?? const [])
        .whereType<String>()
        .toList();
    return FeatureScaffold(
      title: _text(lesson['title']),
      kicker: _catalog.t('learn.kicker', _lang),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _text(lesson['summary']),
            style: Theme.of(context).textTheme.titleMedium
                ?.copyWith(color: BloomTheme.plumDark),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => _speak(allText),
            icon: Icon(
              _speaking ? Icons.stop_circle_outlined : Icons.volume_up_outlined,
            ),
            label: Text(
              _catalog.t(_speaking ? 'learn.stop' : 'learn.listen', _lang),
            ),
          ),
          if (diagram is Map) ...[
            _diagram(Map<String, dynamic>.from(diagram)),
            const SizedBox(height: 12),
          ],
          ...paragraphs.asMap().entries.map((entry) {
            final ids =
                ((lesson['paragraphSources'] as List?)?.elementAtOrNull(
                          entry.key,
                        ) as List? ??
                        lesson['sourceIds'] as List? ??
                        const [])
                    .whereType<String>()
                    .toList();
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: BloomCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.value, style: const TextStyle(height: 1.65)),
                    if (ids.isNotEmpty) _sources(ids),
                  ],
                ),
              ),
            );
          }),
          if (sourceIds.isNotEmpty) _sources(sourceIds),
          const SizedBox(height: 10),
          BloomInfoBanner(text: _catalog.t('common.notice', _lang)),
        ],
      ),
    );
  }

  Widget _diagram(Map<String, dynamic> diagram) {
    final steps = (diagram['steps'] as List? ?? const []).whereType<Map>();
    return BloomCard(
      title: _catalog.t('learn.diagram', _lang),
      child: Column(
        children: [
          ...steps.indexed.map((pair) {
            final index = pair.$1;
            final step = pair.$2;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: BloomTheme.lilac,
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: BloomTheme.plumDark,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Icon(
                    _iconFor(step['icon'] as String?),
                    color: BloomTheme.plum,
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _text(step['label']),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _text(step['text']),
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
          const Divider(),
          Text(
            _text(diagram['caption']),
            style: const TextStyle(color: BloomTheme.muted, height: 1.45),
          ),
          if (diagram['sourceIds'] is List)
            _sources(
              (diagram['sourceIds'] as List).whereType<String>().toList(),
            ),
        ],
      ),
    );
  }

  Widget _sources(List<String> ids) {
    final sources = _catalog.section('sources');
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Wrap(
        spacing: 6,
        runSpacing: 5,
        children: ids.map((id) {
          final raw = sources[id];
          final source = raw is Map ? raw : const {};
          final title = _catalog.contentText(
            source['shortTitle'] ?? source['title'] ?? id,
            _lang,
          );
          final url = source['url']?.toString();
          return ActionChip(
            avatar: const Icon(Icons.open_in_new_rounded, size: 15),
            label: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
            onPressed: url == null ? null : () => launchUrl(Uri.parse(url)),
          );
        }).toList(),
      ),
    );
  }

  String _text(dynamic value) => _catalog.contentText(value, _lang);

  IconData _iconFor(String? value) => switch (value) {
    'drop' => Icons.water_drop_outlined,
    'leaf' => Icons.eco_outlined,
    'sun' => Icons.wb_sunny_outlined,
    'calendar' => Icons.calendar_month_outlined,
    'book' => Icons.menu_book_outlined,
    'heart' => Icons.favorite_outline_rounded,
    'clipboard' => Icons.assignment_outlined,
    'shield' => Icons.shield_outlined,
    'cycle' => Icons.autorenew_rounded,
    _ => Icons.spa_outlined,
  };

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

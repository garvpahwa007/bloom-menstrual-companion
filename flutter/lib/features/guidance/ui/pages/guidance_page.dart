import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../log/services/diary_repository.dart';
import '../../services/guidance_service.dart';

class GuidancePage extends StatefulWidget {
  const GuidancePage({
    super.key,
    required this.diary,
    required this.onNavigate,
  });
  final DiaryRepository diary;
  final ValueChanged<String> onNavigate;
  @override
  State<GuidancePage> createState() => _GuidancePageState();
}

class _GuidancePageState extends State<GuidancePage> {
  final _catalog = BloomCatalog.instance;
  @override
  Widget build(BuildContext context) {
    final lang = widget.diary.language;
    final cards = evaluateGuidance(
      widget.diary.logs,
      widget.diary.profile,
      dismissals: widget.diary.dismissals,
    );
    final urgent = cards.any((c) => c['severity'] == 'urgent');
    return FeatureScaffold(
      title: _catalog.t('doctor.title', lang),
      kicker: _catalog.t('doctor.kicker', lang),
      subtitle: _catalog.t('doctor.subtitle', lang),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BloomInfoBanner(
            text: _catalog.t(urgent ? 'doctor.urgent' : 'doctor.prepare', lang),
            icon: urgent
                ? Icons.emergency_outlined
                : Icons.favorite_outline_rounded,
            color: urgent ? const Color(0xFFFBE7E5) : BloomTheme.lilac,
          ),
          const SizedBox(height: 12),
          if (urgent)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilledButton.icon(
                    onPressed: () => launchUrl(Uri.parse('tel:112')),
                    icon: const Icon(Icons.call_rounded),
                    label: Text(_catalog.t('doctor.call112', lang)),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => launchUrl(Uri.parse('tel:108')),
                    icon: const Icon(Icons.call_outlined),
                    label: Text(_catalog.t('doctor.call108', lang)),
                  ),
                ],
              ),
            ),
          if (cards.isEmpty)
            BloomCard(
              title: _catalog.t('doctor.noCards', lang),
              child: Text(
                _catalog.t('doctor.noCardsBody', lang),
                style: const TextStyle(height: 1.5),
              ),
            )
          else
            ...cards.map(
              (card) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _GuidanceCard(
                  card: card,
                  language: lang,
                  catalog: _catalog,
                  onDismiss: () async {
                    await widget.diary.dismiss(
                      card['id'] as String,
                      until: card['signature'] as String,
                    );
                    setState(() {});
                  },
                  onVisit: () => widget.onNavigate('visit'),
                ),
              ),
            ),
          const SizedBox(height: 4),
          OutlinedButton.icon(
            onPressed: () => widget.onNavigate('visit'),
            icon: const Icon(Icons.medical_information_outlined),
            label: Text(_catalog.t('doctor.prepare', lang)),
          ),
          const SizedBox(height: 12),
          BloomInfoBanner(
            text: _catalog.t('common.notice', lang),
            icon: Icons.info_outline_rounded,
          ),
        ],
      ),
    );
  }
}

class _GuidanceCard extends StatelessWidget {
  const _GuidanceCard({
    required this.card,
    required this.language,
    required this.catalog,
    required this.onDismiss,
    required this.onVisit,
  });
  final Map<String, dynamic> card;
  final String language;
  final BloomCatalog catalog;
  final VoidCallback onDismiss;
  final VoidCallback onVisit;

  @override
  Widget build(BuildContext context) {
    final id = card['id'] as String;
    final severity = card['severity'] as String? ?? 'consult';
    final color = severity == 'urgent'
        ? const Color(0xFF9D3D47)
        : severity == 'support'
        ? BloomTheme.coral
        : BloomTheme.plum;
    final dateList = (card['dates'] as List? ?? const []).join(' · ');
    final flags = catalog
        .list('redFlags')
        .whereType<Map>()
        .where((e) => e['id'] == id)
        .firstOrNull;
    final sourcesValue = card['source'] ?? flags?['source'];
    final sourceIds = sourcesValue is List
        ? sourcesValue.cast<String>()
        : sourcesValue is String
        ? [sourcesValue]
        : <String>[];
    final sources = catalog.section('sources');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  catalog.t(
                    'doctor.${severity == 'urgent'
                        ? 'urgent'
                        : severity == 'support'
                        ? 'supportBadge'
                        : 'consult'}',
                    language,
                  ),
                  style: TextStyle(
                    color: color,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: .3,
                  ),
                ),
                const Spacer(),
                IconButton(
                  tooltip: catalog.t('doctor.dismiss', language),
                  onPressed: onDismiss,
                  icon: const Icon(Icons.close_rounded),
                ),
              ],
            ),
            Text(
              catalog.t('guidance.$id.title', language),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 7),
            Text(
              catalog.t('guidance.$id.why', language),
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(height: 1.55),
            ),
            if (card['minimum'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  '${card['minimum']}–${card['maximum']} days',
                  style: const TextStyle(color: BloomTheme.muted, fontSize: 12),
                ),
              ),
            if (dateList.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 9),
                child: Text(
                  '${catalog.t('doctor.noticed', language)}: $dateList',
                  style: const TextStyle(color: BloomTheme.muted, fontSize: 12),
                ),
              ),
            if (sourceIds.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: sourceIds.map((id) {
                    final raw = sources[id];
                    final source = raw is Map ? raw : const {};
                    final title = source['shortTitle'] ?? source['title'] ?? id;
                    final url = source['url']?.toString();
                    return ActionChip(
                      label: Text(
                        title.toString(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onPressed: url == null
                          ? null
                          : () => launchUrl(Uri.parse(url)),
                    );
                  }).toList(),
                ),
              ),
            const SizedBox(height: 7),
            Text(
              catalog.t(
                severity == 'urgent' ? 'doctor.urgent' : 'doctor.next',
                language,
              ),
              style: const TextStyle(color: BloomTheme.ink, height: 1.45),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: onVisit,
                icon: const Icon(Icons.description_outlined),
                label: Text(catalog.t('ask.visit', language)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

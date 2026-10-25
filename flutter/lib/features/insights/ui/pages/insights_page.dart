import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/bloom_config.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../cycle/models/cycle_analysis.dart';
import '../../../cycle/services/cycle_service.dart';
import '../../../log/models/day_log.dart';
import '../../../log/services/diary_repository.dart';

class InsightsPage extends StatefulWidget {
  const InsightsPage({
    super.key,
    required this.diary,
    required this.onNavigate,
    required this.onLog,
  });
  final DiaryRepository diary;
  final ValueChanged<String> onNavigate;
  final ValueChanged<DateTime> onLog;
  @override
  State<InsightsPage> createState() => _InsightsPageState();
}

class _InsightsPageState extends State<InsightsPage> {
  bool _working = false;

  @override
  Widget build(BuildContext context) {
    final catalog = BloomCatalog.instance;
    final language = widget.diary.language;
    final profile = widget.diary.profile;
    final ageGroup = profile['ageGroup'] as String? ?? 'under18';
    final tracked = widget.diary.settings['trackedSymptoms'];
    final trackedSymptoms = tracked is List
        ? tracked.whereType<String>().toList()
        : null;
    final today = DateUtils.dateOnly(DateTime.now());
    final todayKey = _key(today);
    final analysis = analyzeCycles(
      widget.diary.logs,
      today: todayKey,
      ageGroup: ageGroup,
      pregnancyEnabled: profile['pregnancyEnabled'] == true,
      fertilityEnabled:
          ageGroup == 'adult' || profile['fertilityEnabled'] == true,
      trackedSymptoms: trackedSymptoms,
    );
    final cycles = analysis.cycles;
    final recent = analysis.recentCycles;
    final chartCycles = cycles.length <= BloomConfig.historyChartCycles
        ? cycles
        : cycles.sublist(cycles.length - BloomConfig.historyChartCycles);
    final maxLength = math.max(
      BloomConfig.adultMaximumCycleDays,
      chartCycles.fold<int>(0, (max, cycle) => math.max(max, cycle.length)),
    );
    final periodAverage = (analysis.periodStats['average'] as num?)?.toDouble();
    final periodCount = analysis.periodStats['count'] as int? ?? 0;
    final periodMin = analysis.periodStats['min'] as int?;
    final periodMax = analysis.periodStats['max'] as int?;
    final average = analysis.average == null
        ? null
        : _compactNumber(analysis.average!);
    final pregnancy = profile['pregnancyEnabled'] == true;
    final showFertility =
        !pregnancy &&
        (ageGroup == 'adult' || profile['fertilityEnabled'] == true);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      children: [
        Text(
          catalog.t('tracking.getToKnowYou', language).toUpperCase(),
          style: Theme.of(context).textTheme.labelLarge
              ?.copyWith(color: BloomTheme.plum, letterSpacing: 1.1),
        ),
        const SizedBox(height: 6),
        Text(
          catalog.t('tracking.insights', language),
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 6),
        Text(
          catalog.t('tracking.insightsDescription', language),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        if (analysis.suspectedGaps.isNotEmpty) ...[
          const SizedBox(height: 14),
          BloomCard(
            color: const Color(0xFFFFF6F2),
            title: catalog.t('tracking.missedLogQuestion', language),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  catalog.t('tracking.gapExplanation', language),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 9),
                ...analysis.suspectedGaps.map(
                  (gap) => _GapReview(
                    gap: gap,
                    catalog: catalog,
                    language: language,
                    working: _working,
                    onAddPeriod: () => widget.onLog(DateTime.parse(gap.end)),
                    onConfirm: () => _confirmGap(gap),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                icon: Icons.loop_rounded,
                color: BloomTheme.lilac,
                label: catalog.t('tracking.averageCycle', language),
                value: average == null
                    ? '—'
                    : catalog.t('tracking.daysCount', language, {
                        'count': average,
                      }),
                footnote: catalog.t('tracking.basedOnCycles', language, {
                  'count': recent.length,
                }),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _MetricCard(
                icon: Icons.swap_horiz_rounded,
                color: BloomTheme.peach,
                label: catalog.t('tracking.cycleRange', language),
                value: recent.isEmpty
                    ? '—'
                    : catalog.t('tracking.rangeDays', language, {
                        'from': analysis.minimum ?? 0,
                        'to': analysis.maximum ?? 0,
                      }),
                footnote: catalog.t('tracking.shortestToLongest', language),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        BloomCard(
          title: catalog.t('tracking.cyclePattern', language),
          child: Row(
            children: [
              Icon(
                analysis.irregular
                    ? Icons.sync_problem_rounded
                    : Icons.auto_awesome_rounded,
                color: BloomTheme.plum,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      recent.length < BloomConfig.minimumCompleteCycles
                          ? catalog.t('tracking.stillLearning', language)
                          : analysis.irregular
                          ? catalog.t('tracking.irregular', language)
                          : catalog.t('tracking.moreConsistent', language),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      catalog.t('tracking.patternIsNotDiagnosis', language),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: catalog.t('tracking.periodStats', language),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: _SmallStat(
                      label: catalog.t('tracking.averagePeriod', language),
                      value: periodAverage == null
                          ? '—'
                          : catalog.t('tracking.daysCount', language, {
                              'count': _compactNumber(periodAverage),
                            }),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SmallStat(
                      label: catalog.t('tracking.periodRange', language),
                      value: periodCount == 0
                          ? '—'
                          : catalog.t('tracking.rangeDays', language, {
                              'from': periodMin ?? 0,
                              'to': periodMax ?? 0,
                            }),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                catalog.t('tracking.periodStatsBasis', language, {
                  'count': periodCount,
                }),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: catalog.t('tracking.cycleHistory', language),
          subtitle: catalog.t('tracking.cycleDefinition', language),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      catalog.t('tracking.yourOwnPattern', language),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  Text(
                    catalog.t('tracking.cyclesCount', language, {
                      'count': cycles.length,
                    }),
                    style: Theme.of(context).textTheme.labelLarge
                        ?.copyWith(color: BloomTheme.plum),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (chartCycles.isEmpty)
                Text(
                  catalog.t('tracking.notEnoughData', language),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ...chartCycles.map(
                (cycle) => _CycleBar(
                  cycle: cycle,
                  maxLength: maxLength,
                  catalog: catalog,
                  language: language,
                ),
              ),
              if (chartCycles.isNotEmpty) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 14,
                  children: [
                    _Legend(
                      color: BloomTheme.plum,
                      label: catalog.t('tracking.cycleLength', language),
                    ),
                    _Legend(
                      color: BloomTheme.coral,
                      label: catalog.t('tracking.periodLengthLabel', language),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: catalog.t('tracking.symptomPatterns', language),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (analysis.patterns.isEmpty) ...[
                Text(
                  catalog.t('tracking.patternsTakeTime', language),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 5),
                Text(
                  catalog.t('tracking.patternMinimum', language),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ] else
                ...analysis.patterns.map(
                  (pattern) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.favorite_border_rounded,
                          color: BloomTheme.plum,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _patternText(catalog, language, pattern),
                                style: Theme.of(context).textTheme.bodyLarge,
                              ),
                              const SizedBox(height: 3),
                              Text(
                                catalog.t('tracking.patternBasedOn', language, {
                                  'count': pattern['count'] ?? 0,
                                  'total': pattern['total'] ?? recent.length,
                                }),
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 4),
              Text(
                catalog.t('tracking.patternNote', language),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: catalog.t('tracking.nextEstimate', language),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                analysis.prediction == null
                    ? catalog.t(
                        pregnancy
                            ? 'tracking.predictionsPaused'
                            : analysis.suspectedGaps.isNotEmpty
                            ? 'tracking.reviewGap'
                            : 'tracking.notEnoughData',
                        language,
                      )
                    : _range(context, analysis.prediction!),
                style: Theme.of(context).textTheme.titleLarge
                    ?.copyWith(color: BloomTheme.plumDark),
              ),
              const SizedBox(height: 8),
              Text(
                catalog.t('tracking.predictionMethod', language),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 7),
              ExpansionTile(
                title: Text(
                  catalog.t('tracking.explainEstimate', language),
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                tilePadding: EdgeInsets.zero,
                childrenPadding: const EdgeInsets.only(bottom: 10),
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      catalog.t('tracking.estimateRecords', language, {
                        'count': recent.length,
                        'limit': BloomConfig.recentCycleLimit,
                      }),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  if (recent.isNotEmpty)
                    ...recent.map(
                      (cycle) => Align(
                        alignment: Alignment.centerLeft,
                        child: Padding(
                          padding: const EdgeInsets.only(top: 5),
                          child: Text(
                            catalog.t('tracking.chartRecord', language, {
                              'date': _date(context, cycle.start),
                              'cycle': cycle.length,
                              'period': cycle.periodLength,
                            }),
                          ),
                        ),
                      ),
                    ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        analysis.prediction == null
                            ? catalog.t(
                                pregnancy
                                    ? 'tracking.predictionsPaused'
                                    : analysis.suspectedGaps.isNotEmpty
                                    ? 'tracking.reviewGap'
                                    : 'tracking.notEnoughData',
                                language,
                              )
                            : catalog.t('tracking.estimateMath', language, {
                                'median': _compactNumber(analysis.median ?? 0),
                                'margin': analysis.prediction!.margin ?? 0,
                              }),
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      catalog.t('tracking.estimateLimits', language),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
              if (analysis.irregular)
                Padding(
                  padding: const EdgeInsets.only(top: 5),
                  child: Text(
                    catalog.t('tracking.irregularExplanation', language),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              TextButton.icon(
                onPressed: () => widget.onNavigate('guidance'),
                icon: const Icon(Icons.arrow_forward_rounded),
                label: Text(catalog.t('tracking.whenDoctor', language)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          color: BloomTheme.lilac,
          title: catalog.t('tracking.noPerfectCycle', language),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                catalog.t('tracking.noPerfectCycleDescription', language),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              TextButton.icon(
                onPressed: () => widget.onNavigate('learn'),
                icon: const Icon(Icons.arrow_forward_rounded),
                label: Text(catalog.t('tracking.learnAboutCycles', language)),
              ),
            ],
          ),
        ),
        if (showFertility) ...[
          const SizedBox(height: 12),
          BloomCard(
            title: catalog.t('tracking.fertilityEstimates', language),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (analysis.irregular)
                  Text(
                    catalog.t('tracking.fertilityHidden', language),
                    style: Theme.of(context).textTheme.bodyMedium,
                  )
                else if (analysis.ovulation != null &&
                    analysis.fertile != null) ...[
                  Text(
                    '${catalog.t('tracking.ovulationEstimate', language)}: ${_range(context, analysis.ovulation!)}',
                  ),
                  const SizedBox(height: 5),
                  Text(
                    '${catalog.t('tracking.fertileEstimate', language)}: ${_range(context, analysis.fertile!)}',
                  ),
                  const SizedBox(height: 8),
                  BloomInfoBanner(
                    text: catalog.t('tracking.notContraception', language),
                    icon: Icons.info_outline_rounded,
                  ),
                ] else
                  Text(
                    catalog.t('tracking.notEnoughData', language),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                TextButton(
                  onPressed: () => widget.onNavigate('learn'),
                  child: Text(catalog.t('tracking.fertilitySource', language)),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 12),
        BloomInfoBanner(
          text: catalog.t('tracking.privacyNote', language),
          icon: Icons.lock_outline_rounded,
          color: BloomTheme.sage,
        ),
        const SizedBox(height: 4),
        Text(
          catalog.t('tracking.patternIsNotDiagnosis', language),
          style: Theme.of(context).textTheme.bodySmall,
          textAlign: TextAlign.center,
        ),
        if (_working) const LinearProgressIndicator(minHeight: 2),
      ],
    );
  }

  Future<void> _confirmGap(SuspectedGap gap) async {
    if (_working) return;
    setState(() => _working = true);
    final date = DateTime.parse(gap.nextStart);
    final current = widget.diary.forDate(date) ?? DayLog(date: date);
    final saved = await widget.diary.save(current.copyWith(confirmedGap: true));
    if (!mounted) return;
    setState(() => _working = false);
    final message = BloomCatalog.instance.t(
      saved ? 'common.saved' : 'common.error',
      widget.diary.language,
    );
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _GapReview extends StatelessWidget {
  const _GapReview({
    required this.gap,
    required this.catalog,
    required this.language,
    required this.working,
    required this.onAddPeriod,
    required this.onConfirm,
  });
  final SuspectedGap gap;
  final BloomCatalog catalog;
  final String language;
  final bool working;
  final VoidCallback onAddPeriod;
  final VoidCallback onConfirm;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 10),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${_date(context, gap.start)} – ${_date(context, gap.nextStart)} · ${catalog.t('tracking.daysCount', language, {'count': gap.length})}',
          style: Theme.of(context).textTheme.titleSmall,
        ),
        const SizedBox(height: 5),
        Wrap(
          spacing: 7,
          runSpacing: 4,
          children: [
            OutlinedButton(
              onPressed: working ? null : onAddPeriod,
              child: Text(catalog.t('tracking.addMissedPeriod', language)),
            ),
            OutlinedButton(
              onPressed: working ? null : onConfirm,
              child: Text(catalog.t('tracking.gapIsCorrect', language)),
            ),
          ],
        ),
      ],
    ),
  );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
    required this.footnote,
  });
  final IconData icon;
  final Color color;
  final String label;
  final String value;
  final String footnote;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, size: 18, color: BloomTheme.plum),
          ),
          const SizedBox(height: 9),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 3),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
          Text(footnote, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    ),
  );
}

class _SmallStat extends StatelessWidget {
  const _SmallStat({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: 4),
      Text(value, style: Theme.of(context).textTheme.titleMedium),
    ],
  );
}

class _CycleBar extends StatelessWidget {
  const _CycleBar({
    required this.cycle,
    required this.maxLength,
    required this.catalog,
    required this.language,
  });
  final CycleRecord cycle;
  final int maxLength;
  final BloomCatalog catalog;
  final String language;
  @override
  Widget build(BuildContext context) {
    final ratio = (cycle.length / maxLength).clamp(0.0, 1.0);
    final periodRatio = (cycle.periodLength / cycle.length).clamp(0.0, 1.0);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  _date(context, cycle.start),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              Text(
                catalog.t('tracking.daysCount', language, {
                  'count': cycle.length,
                }),
                style: Theme.of(context).textTheme.labelLarge,
              ),
            ],
          ),
          const SizedBox(height: 5),
          LayoutBuilder(
            builder: (context, constraints) => Container(
              height: 10,
              decoration: BoxDecoration(
                color: BloomTheme.lilac,
                borderRadius: BorderRadius.circular(8),
              ),
              alignment: Alignment.centerLeft,
              child: SizedBox(
                width: constraints.maxWidth * ratio,
                height: 10,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: periodRatio,
                    child: Container(
                      decoration: BoxDecoration(
                        color: BloomTheme.coral,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            catalog.t('tracking.periodLength', language, {
              'count': cycle.periodLength,
            }),
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend({required this.color, required this.label});
  final Color color;
  final String label;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 7,
        height: 7,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 5),
      Text(label, style: Theme.of(context).textTheme.bodySmall),
    ],
  );
}

String _patternText(
  BloomCatalog catalog,
  String language,
  Map<String, Object?> pattern,
) {
  final id = pattern['id'] as String? ?? '';
  final count = pattern['count'] ?? 0;
  final days = pattern['days'] is List
      ? (pattern['days'] as List).join('–')
      : '${pattern['days'] ?? ''}';
  if (id == 'loggedSymptomPattern') {
    final key = pattern['window'] == 'earlyCycle'
        ? 'loggedEarlySymptom'
        : 'loggedPrePeriodSymptom';
    final symptom = catalog.t(
      'tracking.symptom.${pattern['symptomId']}',
      language,
    );
    return catalog.t('tracking.pattern.$key', language, {
      'symptom': symptom,
      'count': count,
      'days': days,
    });
  }
  return catalog.t('tracking.pattern.$id', language, {
    'count': count,
    'days': days,
  });
}

String _date(BuildContext context, String iso) =>
    MaterialLocalizations.of(context).formatMediumDate(DateTime.parse(iso));
String _range(BuildContext context, DateSpan span) =>
    '${_date(context, span.from)} – ${_date(context, span.to)}';
String _compactNumber(double value) {
  final rounded = (value * 10).round() / 10;
  return rounded == rounded.roundToDouble()
      ? rounded.toStringAsFixed(0)
      : rounded.toStringAsFixed(1);
}

String _key(DateTime date) =>
    '${date.year.toString().padLeft(4, '0')}-'
    '${date.month.toString().padLeft(2, '0')}-'
    '${date.day.toString().padLeft(2, '0')}';

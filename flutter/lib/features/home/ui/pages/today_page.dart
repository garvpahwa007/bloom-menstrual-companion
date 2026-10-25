import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/bloom_config.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../cycle/models/cycle_analysis.dart';
import '../../../cycle/services/cycle_service.dart';
import '../../../log/services/diary_repository.dart';

class TodayPage extends StatelessWidget {
  const TodayPage({
    super.key,
    required this.diary,
    required this.onLog,
    required this.onQuickSymptom,
    required this.onNavigate,
  });
  final DiaryRepository diary;
  final ValueChanged<DateTime> onLog;
  final ValueChanged<String> onQuickSymptom;
  final ValueChanged<String> onNavigate;

  DateTime get _today => DateUtils.dateOnly(DateTime.now());

  @override
  Widget build(BuildContext context) {
    final catalog = BloomCatalog.instance;
    final language = diary.language;
    final today = _today;
    final todayKey = _key(today);
    final profile = diary.profile;
    final settings = diary.settings;
    final ageGroup = profile['ageGroup'] as String? ?? 'under18';
    final fertilityEnabled =
        ageGroup == 'adult' || profile['fertilityEnabled'] == true;
    final tracked = settings['trackedSymptoms'] is List
        ? (settings['trackedSymptoms'] as List).whereType<String>().toList()
        : null;
    final analysis = analyzeCycles(
      diary.logs,
      today: todayKey,
      ageGroup: ageGroup,
      pregnancyEnabled: profile['pregnancyEnabled'] == true,
      fertilityEnabled: fertilityEnabled,
      trackedSymptoms: tracked,
    );
    final currentLog = diary.forDate(today);
    final pregnancyMode = profile['pregnancyEnabled'] == true;
    final recentDays = List.generate(
      14,
      (index) => today.subtract(Duration(days: 13 - index)),
    );
    final recentPattern = analysis.patterns
        .where(
          (pattern) =>
              (pattern['count'] as int? ?? 0) >=
              BloomConfig.minimumPatternCycles,
        )
        .firstOrNull;
    final average = analysis.average == null
        ? null
        : _compactNumber(analysis.average!);
    final lastPeriod = analysis.periods.isEmpty ? null : analysis.periods.last;
    final fertilityVisible =
        !pregnancyMode &&
        fertilityEnabled &&
        analysis.fertile != null &&
        analysis.ovulation != null;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      children: [
        Text(
          MaterialLocalizations.of(context).formatFullDate(today),
          style: Theme.of(context).textTheme.labelLarge
              ?.copyWith(color: BloomTheme.plum),
        ),
        const SizedBox(height: 6),
        Text(
          catalog.t('tracking.greeting', language),
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 6),
        Text(
          catalog.t('tracking.greetingDescription', language),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        _CycleHero(
          catalog: catalog,
          language: language,
          cycleDay: analysis.cycleDay,
          phase: analysis.phase,
          periodToday: currentLog?.period == true,
          pregnancyMode: pregnancyMode,
          prediction: analysis.prediction,
          irregular: analysis.irregular,
          suspectedGap: analysis.suspectedGaps.isNotEmpty,
          onLog: () => pregnancyMode ? onNavigate('pregnancy') : onLog(today),
        ),
        if (!pregnancyMode &&
            analysis.prediction != null &&
            analysis.prediction!.to.compareTo(todayKey) < 0) ...[
          const SizedBox(height: 12),
          BloomInfoBanner(
            text: catalog.t('tracking.estimatePassed', language),
            icon: Icons.info_outline_rounded,
          ),
        ],
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                icon: Icons.calendar_month_rounded,
                tint: BloomTheme.lilac,
                label: catalog.t('tracking.averageCycle', language),
                value: average == null
                    ? '—'
                    : catalog.t('tracking.daysCount', language, {
                        'count': average,
                      }),
                footnote: catalog.t('tracking.basedOnCycles', language, {
                  'count': analysis.recentCycles.length,
                }),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _StatCard(
                icon: Icons.water_drop_outlined,
                tint: BloomTheme.peach,
                label: catalog.t('tracking.lastPeriod', language),
                value: lastPeriod == null
                    ? '—'
                    : _date(context, lastPeriod.start),
                footnote: lastPeriod == null
                    ? catalog.t('tracking.addFirstPeriod', language)
                    : catalog.t('tracking.daysLogged', language, {
                        'count': lastPeriod.length,
                      }),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _StatCard(
          icon: Icons.favorite_border_rounded,
          tint: BloomTheme.sage,
          label: catalog.t('tracking.yourCheckIn', language),
          value: currentLog?.mood == null
              ? catalog.t('tracking.howYouFeel', language)
              : catalog.t('tracking.mood.${currentLog!.mood}', language),
          footnote: currentLog == null
              ? catalog.t('tracking.takeAMoment', language)
              : catalog.t('tracking.savedForToday', language),
        ),
        const SizedBox(height: 14),
        BloomCard(
          title: catalog.t('tracking.recentDays', language),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      catalog.t('tracking.atAGlance', language),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  TextButton(
                    onPressed: () => onNavigate('calendar'),
                    child: Text(catalog.t('tracking.openCalendar', language)),
                  ),
                ],
              ),
              SizedBox(
                height: 76,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: recentDays.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 6),
                  itemBuilder: (context, index) {
                    final date = recentDays[index];
                    final log = diary.forDate(date);
                    final isToday = DateUtils.isSameDay(date, today);
                    final isPeriod = log?.period == true;
                    return InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => onLog(date),
                      child: Container(
                        width: 39,
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: isPeriod
                              ? const Color(0xFFF6DEDB)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isToday
                                ? BloomTheme.plum
                                : Colors.transparent,
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              MaterialLocalizations.of(context)
                                  .narrowWeekdays[date.weekday % 7],
                              style: Theme.of(context).textTheme.labelSmall,
                            ),
                            const SizedBox(height: 5),
                            Text(
                              '${date.day}',
                              style: TextStyle(
                                fontWeight: isToday
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: isPeriod
                                    ? BloomTheme.plumDark
                                    : BloomTheme.ink,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Icon(
                              Icons.circle,
                              size: 4,
                              color: (log?.symptoms.isNotEmpty ?? false)
                                  ? BloomTheme.plum
                                  : Colors.transparent,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 5),
              Wrap(
                spacing: 12,
                children: [
                  _LegendDot(
                    color: const Color(0xFF9F6259),
                    label: catalog.t('tracking.loggedPeriod', language),
                  ),
                  _LegendDot(
                    color: BloomTheme.plum,
                    label: catalog.t('tracking.symptoms', language),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: catalog.t(
            recentPattern == null
                ? 'tracking.yourBodyYourPace'
                : 'tracking.patternEmerging',
            language,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.auto_awesome_rounded,
                    color: BloomTheme.plum,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      recentPattern == null
                          ? (analysis.irregular
                                ? catalog.t(
                                    'tracking.irregularInsight',
                                    language,
                                  )
                                : catalog.t(
                                    'tracking.patternsNeedTime',
                                    language,
                                  ))
                          : _patternText(catalog, language, recentPattern),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => onNavigate('insights'),
                  icon: const Icon(Icons.arrow_forward_rounded),
                  label: Text(catalog.t('tracking.exploreInsights', language)),
                ),
              ),
            ],
          ),
        ),
        if (fertilityVisible) ...[
          const SizedBox(height: 12),
          BloomCard(
            title: catalog.t('tracking.fertilityEstimates', language),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${catalog.t('tracking.ovulationEstimate', language)}: ${_range(context, analysis.ovulation!)}',
                ),
                const SizedBox(height: 5),
                Text(
                  '${catalog.t('tracking.fertileEstimate', language)}: ${_range(context, analysis.fertile!)}',
                ),
                const SizedBox(height: 10),
                BloomInfoBanner(
                  text: catalog.t('tracking.notContraception', language),
                  icon: Icons.info_outline_rounded,
                ),
                TextButton(
                  onPressed: () => onNavigate('learn'),
                  child: Text(catalog.t('tracking.fertilitySource', language)),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 12),
        BloomCard(
          title: catalog.t('tracking.quickCheckIn', language),
          subtitle: catalog.t('tracking.smallCheckIn', language),
          child: Wrap(
            spacing: 7,
            runSpacing: 7,
            children: ['cramps', 'bloating', 'tiredness', 'acne']
                .map(
                  (id) => ActionChip(
                    avatar: const Icon(Icons.add_rounded, size: 16),
                    label: Text(catalog.t('tracking.symptom.$id', language)),
                    onPressed: () => onQuickSymptom(id),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 12),
        InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => onNavigate('learn'),
          child: BloomCard(
            color: BloomTheme.lilac,
            child: Row(
              children: [
                const Icon(
                  Icons.spa_outlined,
                  color: BloomTheme.plum,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        catalog.t('tracking.learnLittle', language),
                        style: Theme.of(context).textTheme.labelSmall
                            ?.copyWith(color: BloomTheme.plum),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        catalog.t('tracking.learnDescription', language),
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_rounded, color: BloomTheme.plum),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        BloomInfoBanner(
          text: catalog.t('tracking.privacyNote', language),
          icon: Icons.lock_outline_rounded,
          color: BloomTheme.sage,
        ),
      ],
    );
  }
}

class _CycleHero extends StatelessWidget {
  const _CycleHero({
    required this.catalog,
    required this.language,
    required this.cycleDay,
    required this.phase,
    required this.periodToday,
    required this.pregnancyMode,
    required this.prediction,
    required this.irregular,
    required this.suspectedGap,
    required this.onLog,
  });
  final BloomCatalog catalog;
  final String language;
  final int? cycleDay;
  final CyclePhase? phase;
  final bool periodToday;
  final bool pregnancyMode;
  final DateSpan? prediction;
  final bool irregular;
  final bool suspectedGap;
  final VoidCallback onLog;

  @override
  Widget build(BuildContext context) {
    final heading = pregnancyMode
        ? catalog.t('tracking.pregnancyWelcome', language)
        : cycleDay == null
        ? catalog.t('tracking.startJourney', language)
        : '${catalog.t('tracking.cycleDay', language)} $cycleDay';
    final description = pregnancyMode
        ? catalog.t('tracking.predictionsPaused', language)
        : periodToday
        ? catalog.t('tracking.periodToday', language)
        : phase != null
        ? catalog.t('tracking.phase.${phase!.id}', language)
        : irregular
        ? catalog.t('tracking.irregularPhase', language)
        : catalog.t('tracking.phaseUncertain', language);
    final estimate = prediction == null
        ? catalog.t(
            suspectedGap ? 'tracking.reviewGap' : 'tracking.notEnoughData',
            language,
          )
        : _range(context, prediction!);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [BloomTheme.heroStart, BloomTheme.plum, BloomTheme.heroEnd],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: Color(0xFFF0C9BD),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                catalog
                    .t(
                      pregnancyMode
                          ? 'tracking.pregnancyMode'
                          : 'tracking.yourCycle',
                      language,
                    )
                    .toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      heading,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 25,
                        height: 1.2,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      description,
                      style: const TextStyle(
                        color: Color(0xFFF6EFF8),
                        height: 1.45,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .1),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white24),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(13),
                  child: Image.asset(
                    'assets/images/bloom-mark.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.spa_rounded,
                      color: Color(0xFFEBC4C2),
                      size: 38,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          SizedBox(
            height: 46,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFFF6F2),
                foregroundColor: BloomTheme.plumDark,
              ),
              onPressed: onLog,
              icon: const Icon(Icons.edit_note_rounded, size: 20),
              label: Text(
                catalog.t(
                  pregnancyMode
                      ? 'tracking.viewPregnancy'
                      : 'tracking.logToday',
                  language,
                ),
              ),
            ),
          ),
          if (!pregnancyMode) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(
                  Icons.calendar_month_rounded,
                  color: Colors.white,
                  size: 19,
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        catalog.t('tracking.nextEstimate', language),
                        style: const TextStyle(
                          color: Color(0xFFF6EFF8),
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        estimate,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                if (irregular)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: .12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      catalog.t('tracking.irregular', language),
                      style: const TextStyle(color: Colors.white, fontSize: 11),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              catalog.t('tracking.estimateCaveat', language),
              style: const TextStyle(
                color: Color(0xFFF6EFF8),
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.tint,
    required this.label,
    required this.value,
    required this.footnote,
  });
  final IconData icon;
  final Color tint;
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
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: tint,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 19, color: BloomTheme.plum),
          ),
          const SizedBox(height: 10),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 2),
          Text(value, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 2),
          Text(footnote, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    ),
  );
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
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
    final window = pattern['window'] == 'earlyCycle'
        ? 'loggedEarlySymptom'
        : 'loggedPrePeriodSymptom';
    final symptom = catalog.t(
      'tracking.symptom.${pattern['symptomId']}',
      language,
    );
    return catalog.t('tracking.pattern.$window', language, {
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
String _key(DateTime date) =>
    '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
String _compactNumber(double value) {
  final rounded = (value * 10).round() / 10;
  return rounded == rounded.roundToDouble()
      ? rounded.toStringAsFixed(0)
      : rounded.toStringAsFixed(1);
}

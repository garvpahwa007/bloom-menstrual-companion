import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../cycle/services/cycle_service.dart';
import '../../../log/services/diary_repository.dart';

class CalendarPage extends StatefulWidget {
  const CalendarPage({
    super.key,
    required this.diary,
    required this.onSelectDate,
    required this.onNavigate,
  });
  final DiaryRepository diary;
  final ValueChanged<DateTime> onSelectDate;
  final ValueChanged<String> onNavigate;
  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  DateTime _month = DateUtils.dateOnly(DateTime.now());

  @override
  Widget build(BuildContext context) {
    final catalog = BloomCatalog.instance;
    final language = widget.diary.language;
    final profile = widget.diary.profile;
    final today = DateUtils.dateOnly(DateTime.now());
    final todayKey = _key(today);
    final ageGroup = profile['ageGroup'] as String? ?? 'under18';
    final fertilityEnabled =
        ageGroup == 'adult' || profile['fertilityEnabled'] == true;
    final tracked = widget.diary.settings['trackedSymptoms'];
    final trackedSymptoms = tracked is List
        ? tracked.whereType<String>().toList()
        : null;
    final pregnancy = profile['pregnancyEnabled'] == true;
    final analysis = analyzeCycles(
      widget.diary.logs,
      today: todayKey,
      ageGroup: ageGroup,
      pregnancyEnabled: pregnancy,
      fertilityEnabled: fertilityEnabled,
      trackedSymptoms: trackedSymptoms,
    );
    final showFertility =
        !pregnancy && fertilityEnabled && analysis.fertile != null;
    final first = DateTime(_month.year, _month.month, 1);
    final offset = first.weekday - 1;
    final dayCount = DateTime(_month.year, _month.month + 1, 0).day;
    final totalCells = ((offset + dayCount + 6) ~/ 7) * 7;
    final monthLogs = widget.diary.logs.values
        .where(
          (log) =>
              log.date.year == _month.year && log.date.month == _month.month,
        )
        .toList();
    final localizations = MaterialLocalizations.of(context);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      children: [
        Text(
          catalog.t('tracking.yourHistory', language).toUpperCase(),
          style: Theme.of(context).textTheme.labelLarge
              ?.copyWith(color: BloomTheme.plum, letterSpacing: 1.1),
        ),
        const SizedBox(height: 6),
        Text(
          catalog.t('tracking.calendar', language),
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 6),
        Text(
          catalog.t('tracking.calendarDescription', language),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 14),
        BloomCard(
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    tooltip: catalog.t('tracking.previousMonth', language),
                    onPressed: () => setState(
                      () => _month = DateTime(_month.year, _month.month - 1, 1),
                    ),
                    icon: const Icon(Icons.chevron_left_rounded),
                  ),
                  Expanded(
                    child: Center(
                      child: Text(
                        localizations.formatMonthYear(_month),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(
                      () => _month = DateTime(today.year, today.month, 1),
                    ),
                    child: Text(catalog.t('tracking.today', language)),
                  ),
                  IconButton(
                    tooltip: catalog.t('tracking.nextMonth', language),
                    onPressed: () => setState(
                      () => _month = DateTime(_month.year, _month.month + 1, 1),
                    ),
                    icon: const Icon(Icons.chevron_right_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 7),
              Row(
                children: List.generate(7, (index) {
                  return Expanded(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          localizations.narrowWeekdays[(index + 1) % 7],
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(color: BloomTheme.muted),
                        ),
                      ),
                    ),
                  );
                }),
              ),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: totalCells,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 7,
                  mainAxisSpacing: 5,
                  crossAxisSpacing: 5,
                ),
                itemBuilder: (context, index) {
                  final day = index - offset + 1;
                  if (day < 1 || day > dayCount) return const SizedBox.shrink();
                  final date = DateTime(_month.year, _month.month, day);
                  final dateKey = _key(date);
                  final log = widget.diary.logs[dateKey];
                  final isToday = DateUtils.isSameDay(date, today);
                  final isPredicted =
                      !pregnancy &&
                      analysis.prediction != null &&
                      dateKey.compareTo(analysis.prediction!.from) >= 0 &&
                      dateKey.compareTo(analysis.prediction!.to) <= 0;
                  final isFertile =
                      showFertility &&
                      dateKey.compareTo(analysis.fertile!.from) >= 0 &&
                      dateKey.compareTo(analysis.fertile!.to) <= 0;
                  final labels = <String>[
                    localizations.formatFullDate(date),
                    if (isToday) catalog.t('tracking.today', language),
                    if (log?.period == true)
                      catalog.t('tracking.loggedPeriod', language),
                    if (isPredicted)
                      catalog.t('tracking.predictedDay', language),
                    if (isFertile) catalog.t('tracking.fertileDay', language),
                    if (log?.symptoms.isNotEmpty == true)
                      catalog.t('tracking.symptomCount', language, {
                        'count': log!.symptoms.length,
                      }),
                  ].join(', ');
                  return Tooltip(
                    message: labels,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(13),
                      onTap: () => widget.onSelectDate(date),
                      child: Container(
                        decoration: BoxDecoration(
                          color: log?.period == true
                              ? const Color(0xFFF6DEDB)
                              : isFertile
                              ? BloomTheme.sage
                              : isPredicted
                              ? const Color(0xFFFFF6F2)
                              : null,
                          borderRadius: BorderRadius.circular(13),
                          border: Border.all(
                            color: isToday
                                ? BloomTheme.plum
                                : isPredicted
                                ? BloomTheme.coral
                                : Colors.transparent,
                            width: isToday || isPredicted ? 1.2 : 0,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              localizations.formatDecimal(day),
                              style: TextStyle(
                                fontWeight: isToday
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: log?.period == true
                                    ? BloomTheme.plumDark
                                    : BloomTheme.ink,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Wrap(
                              spacing: 2,
                              alignment: WrapAlignment.center,
                              children: [
                                if (log?.period == true)
                                  const Icon(
                                    Icons.water_drop_rounded,
                                    size: 8,
                                    color: Color(0xFF9F6259),
                                  ),
                                if (isPredicted)
                                  const Icon(
                                    Icons.circle_outlined,
                                    size: 8,
                                    color: BloomTheme.coral,
                                  ),
                                if (isFertile)
                                  const Icon(
                                    Icons.auto_awesome_rounded,
                                    size: 8,
                                    color: Color(0xFF70846F),
                                  ),
                                if (log?.symptoms.isNotEmpty == true)
                                  const Icon(
                                    Icons.circle,
                                    size: 6,
                                    color: BloomTheme.plum,
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 6,
                children: [
                  _Legend(
                    color: const Color(0xFF9F6259),
                    text: catalog.t('tracking.loggedPeriod', language),
                  ),
                  _Legend(
                    color: BloomTheme.coral,
                    text: catalog.t('tracking.estimatedPeriod', language),
                  ),
                  if (showFertility)
                    _Legend(
                      color: const Color(0xFF70846F),
                      text: catalog.t('tracking.fertileEstimate', language),
                    ),
                  _Legend(
                    color: BloomTheme.plum,
                    text: catalog.t('tracking.symptoms', language),
                  ),
                ],
              ),
              const SizedBox(height: 11),
              BloomInfoBanner(
                text: catalog.t('tracking.calendarEstimateNote', language),
                icon: Icons.info_outline_rounded,
              ),
              if (showFertility) ...[
                const SizedBox(height: 8),
                Text(
                  catalog.t('tracking.notContraception', language),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: catalog.t('tracking.monthSummary', language),
          subtitle: catalog.t('tracking.thisMonth', language),
          child: Column(
            children: [
              _SummaryRow(
                label: catalog.t('tracking.daysWithLogs', language),
                value: '${monthLogs.length}',
              ),
              _SummaryRow(
                label: catalog.t('tracking.periodDays', language),
                value: '${monthLogs.where((log) => log.period).length}',
              ),
              _SummaryRow(
                label: catalog.t('tracking.daysWithSymptoms', language),
                value:
                    '${monthLogs.where((log) => log.symptoms.isNotEmpty).length}',
              ),
              const Divider(height: 20),
              Text(
                catalog.t('tracking.calendarInsight', language),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => widget.onNavigate('insights'),
                  icon: const Icon(Icons.arrow_forward_rounded),
                  label: Text(catalog.t('tracking.exploreInsights', language)),
                ),
              ),
            ],
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

class _Legend extends StatelessWidget {
  const _Legend({required this.color, required this.text});
  final Color color;
  final String text;
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
      Text(text, style: Theme.of(context).textTheme.bodySmall),
    ],
  );
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      children: [
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ),
        Text(value, style: Theme.of(context).textTheme.titleMedium),
      ],
    ),
  );
}

String _key(DateTime date) =>
    '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

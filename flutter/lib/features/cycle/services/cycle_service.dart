import '../../../common/bloom_config.dart';
import '../../../common/date_utils.dart';
import '../../log/models/day_log.dart';
import '../models/cycle_analysis.dart';

List<PeriodEpisode> getPeriods(Map<String, DayLog> logs) {
  final result = <PeriodEpisode>[];
  final periodLogs = logs.entries.where((e) => e.value.period).toList()
    ..sort((a, b) => a.key.compareTo(b.key));
  for (final entry in periodLogs) {
    if (result.isNotEmpty && daysBetween(result.last.end, entry.key) == 1) {
      final last = result.removeLast();
      result.add(
        PeriodEpisode(
          start: last.start,
          end: entry.key,
          length: daysBetween(last.start, entry.key) + 1,
        ),
      );
    } else {
      result.add(PeriodEpisode(start: entry.key, end: entry.key, length: 1));
    }
  }
  return result;
}

double? median(List<num> values) {
  if (values.isEmpty) return null;
  final sorted = values.map((e) => e.toDouble()).toList()..sort();
  final middle = sorted.length ~/ 2;
  return sorted.length.isOdd
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
}

double? _mean(List<int> values) =>
    values.isEmpty ? null : values.reduce((a, b) => a + b) / values.length;

CycleAnalysis analyzeCycles(
  Map<String, DayLog> input, {
  String? today,
  String ageGroup = 'under18',
  bool pregnancyEnabled = false,
  bool? fertilityEnabled,
  List<String>? trackedSymptoms,
}) {
  final currentDay = today ?? todayIso();
  final logs = Map<String, DayLog>.fromEntries(
    input.entries.where((e) => e.key.compareTo(currentDay) <= 0),
  );
  final periods = getPeriods(logs);
  final cycles = <CycleRecord>[];
  final gaps = <SuspectedGap>[];
  final acceptedLengths = <int>[];
  final allLengths = <int>[];
  for (var i = 0; i < periods.length - 1; i++) {
    allLengths.add(daysBetween(periods[i].start, periods[i + 1].start));
  }

  for (var i = 0; i < periods.length - 1; i++) {
    final current = periods[i];
    final next = periods[i + 1];
    final length = daysBetween(current.start, next.start);
    final previousBaseline = median(
      acceptedLengths.takeLast(BloomConfig.recentCycleLimit).toList(),
    );
    final otherLengths = <int>[];
    for (var other = 0; other < allLengths.length; other++) {
      if (other != i) otherLengths.add(allLengths[other]);
    }
    final baseline =
        previousBaseline ??
        median(otherLengths.takeLast(BloomConfig.recentCycleLimit).toList());
    final unusuallyLong = baseline != null
        ? length >
              (baseline * BloomConfig.suspectedGapFactor >
                      baseline + BloomConfig.suspectedGapExtraDays
                  ? baseline * BloomConfig.suspectedGapFactor
                  : baseline + BloomConfig.suspectedGapExtraDays)
        : length > BloomConfig.suspectedGapWithoutHistoryDays;
    final confirmed = logs[next.start]?.confirmedGap ?? false;
    final cycle = CycleRecord(
      start: current.start,
      end: addDays(next.start, -1),
      length: length,
      periodLength: current.length,
      nextStart: next.start,
      confirmedGap: confirmed,
    );
    if (unusuallyLong && !confirmed) {
      gaps.add(
        SuspectedGap(
          start: cycle.start,
          end: cycle.end,
          length: cycle.length,
          periodLength: cycle.periodLength,
          nextStart: cycle.nextStart,
          id: '${current.start}_${next.start}',
        ),
      );
    } else {
      cycles.add(cycle);
      acceptedLengths.add(length);
    }
  }

  final recent = cycles.takeLast(BloomConfig.recentCycleLimit).toList();
  final periodStatsList = periods
      .where((p) => p.end.compareTo(currentDay) < 0)
      .toList()
      .takeLast(BloomConfig.recentCycleLimit)
      .toList();
  final periodLengths = periodStatsList.map((p) => p.length).toList();
  final lengths = recent.map((c) => c.length).toList();
  final med = median(lengths);
  final average = _mean(lengths);
  final min = lengths.isEmpty ? null : lengths.reduce((a, b) => a < b ? a : b);
  final max = lengths.isEmpty ? null : lengths.reduce((a, b) => a > b ? a : b);
  final spread = lengths.isEmpty ? 0 : max! - min!;
  final irregular =
      lengths.length >= BloomConfig.minimumCompleteCycles &&
      spread > BloomConfig.irregularSpreadDays;
  final lastPeriod = periods.isEmpty ? null : periods.last;
  final cycleDay = lastPeriod == null
      ? null
      : daysBetween(lastPeriod.start, currentDay) + 1;
  DateSpan? prediction;
  DateSpan? ovulation;
  DateSpan? fertile;
  CyclePhase? phase;

  if (!pregnancyEnabled &&
      lengths.length >= BloomConfig.minimumCompleteCycles &&
      gaps.isEmpty &&
      lastPeriod != null &&
      med != null) {
    final expected = addDays(lastPeriod.start, med.round());
    final margin =
        (BloomConfig.minimumPredictionMarginDays > spread
            ? BloomConfig.minimumPredictionMarginDays
            : spread) +
        (irregular ? BloomConfig.irregularExtraMarginDays : 0);
    prediction = DateSpan(
      addDays(expected, -margin),
      addDays(expected, margin),
      margin: margin,
    );
    if (!irregular) {
      final ovulationWindow = DateSpan(
        addDays(prediction.from, -BloomConfig.ovulationBeforePeriodDays),
        addDays(prediction.to, -BloomConfig.ovulationBeforePeriodDays),
      );
      if (fertilityEnabled ?? ageGroup == 'adult') {
        ovulation = ovulationWindow;
        fertile = DateSpan(
          addDays(ovulation.from, -BloomConfig.fertileDaysBeforeOvulation),
          addDays(ovulation.to, BloomConfig.fertileDaysAfterOvulation),
        );
      }
      if (currentDay.compareTo(prediction.to) <= 0) {
        phase = logs[currentDay]?.period == true
            ? const CyclePhase('menstrual', estimated: false)
            : CyclePhase(
                currentDay.compareTo(ovulationWindow.from) < 0
                    ? 'beforeOvulation'
                    : currentDay.compareTo(ovulationWindow.to) <= 0
                    ? 'aroundOvulation'
                    : 'afterOvulation',
                estimated: true,
              );
      }
    }
  }

  return CycleAnalysis(
    periods: periods,
    periodStats: {
      'count': periodLengths.length,
      'average': _mean(periodLengths),
      'min': periodLengths.isEmpty
          ? null
          : periodLengths.reduce((a, b) => a < b ? a : b),
      'max': periodLengths.isEmpty
          ? null
          : periodLengths.reduce((a, b) => a > b ? a : b),
    },
    cycles: cycles,
    recentCycles: recent,
    average: average,
    median: med,
    minimum: min,
    maximum: max,
    spread: spread,
    irregular: irregular,
    cycleDay: cycleDay,
    prediction: prediction,
    ovulation: ovulation,
    fertile: fertile,
    phase: phase,
    suspectedGaps: gaps,
    patterns: _findPatterns(logs, recent, trackedSymptoms),
  );
}

List<Map<String, Object?>> _findPatterns(
  Map<String, DayLog> logs,
  List<CycleRecord> cycles,
  List<String>? trackedSymptoms,
) {
  List<DayLog?> window(CycleRecord cycle, int days, {bool before = false}) =>
      List.generate(
        days,
        (i) => logs[addDays(before ? cycle.end : cycle.start, before ? -i : i)],
      );
  final observed = cycles
      .where(
        (c) => logs.keys.any(
          (date) => date.compareTo(c.start) >= 0 && date.compareTo(c.end) <= 0,
        ),
      )
      .toList();
  final periodCycles = observed.where((c) => c.periodLength > 0).toList();
  final early = periodCycles
      .map(
        (c) => (
          cycle: c,
          entries: window(c, BloomConfig.symptomPatternPeriodDays),
        ),
      )
      .where((x) => x.entries.any((e) => e != null))
      .toList();
  final pre = observed
      .map(
        (c) => (
          cycle: c,
          entries: window(c, BloomConfig.prePeriodPatternDays, before: true),
        ),
      )
      .where((x) => x.entries.any((e) => e != null))
      .toList();
  final ids = trackedSymptoms == null
      ? logs.values.expand((l) => l.symptoms).toSet().toList()
      : trackedSymptoms.toSet().toList();
  final result = <Map<String, Object?>>[];
  final cramps = early
      .where(
        (x) => x.entries
            .take(BloomConfig.earlyPeriodPatternDays)
            .any((l) => l?.symptoms.contains('cramps') ?? false),
      )
      .length;
  if (ids.contains('cramps') && cramps >= BloomConfig.minimumPatternCycles) {
    result.add({
      'id': 'earlyCramps',
      'count': cramps,
      'days': [1, BloomConfig.earlyPeriodPatternDays],
      'total': early.length,
    });
  }
  final lowEnergy = pre
      .where((x) => x.entries.any((l) => l?.energy == 'low'))
      .length;
  if (lowEnergy >= BloomConfig.minimumPatternCycles) {
    result.add({
      'id': 'prePeriodEnergy',
      'count': lowEnergy,
      'days': BloomConfig.prePeriodPatternDays,
      'total': pre.length,
    });
  }
  final lowMood = pre
      .where(
        (x) => x.entries.any(
          (l) => l != null && const ['low', 'veryLow'].contains(l.mood),
        ),
      )
      .length;
  if (lowMood >= BloomConfig.minimumPatternCycles) {
    result.add({
      'id': 'prePeriodMood',
      'count': lowMood,
      'days': BloomConfig.prePeriodPatternDays,
      'total': pre.length,
    });
  }
  final symptomIds = ids.where((id) => id != 'cramps').toList()..sort();
  for (final id in symptomIds) {
    final during = early
        .where(
          (x) => x.entries
              .take(BloomConfig.symptomPatternPeriodDays)
              .any((l) => l?.symptoms.contains(id) ?? false),
        )
        .length;
    if (during >= BloomConfig.minimumPatternCycles) {
      result.add({
        'id': 'loggedSymptomPattern',
        'window': 'earlyCycle',
        'symptomId': id,
        'count': during,
        'days': [1, BloomConfig.symptomPatternPeriodDays],
        'total': early.length,
      });
    }
    final before = pre
        .where((x) => x.entries.any((l) => l?.symptoms.contains(id) ?? false))
        .length;
    if (before >= BloomConfig.minimumPatternCycles) {
      result.add({
        'id': 'loggedSymptomPattern',
        'window': 'beforePeriod',
        'symptomId': id,
        'count': before,
        'days': BloomConfig.prePeriodPatternDays,
        'total': pre.length,
      });
    }
  }
  return result;
}

extension<T> on Iterable<T> {
  Iterable<T> takeLast(int count) {
    final all = toList();
    return all.length <= count ? all : all.sublist(all.length - count);
  }
}

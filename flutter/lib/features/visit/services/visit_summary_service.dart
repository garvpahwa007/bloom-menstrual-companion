import '../../../common/date_utils.dart';
import '../../cycle/services/cycle_service.dart';
import '../../guidance/services/guidance_service.dart';
import '../../log/models/day_log.dart';

Map<String, dynamic> buildVisitSummary(
  Map<String, dynamic> state, {
  String? today,
}) {
  final day = today ?? todayIso();
  final source = state['logs'] as Map? ?? const {};
  final entries = <MapEntry<String, DayLog>>[];
  for (final entry in source.entries) {
    if (entry.key is! String ||
        (entry.key as String).compareTo(day) > 0 ||
        entry.value is! Map)
      continue;
    try {
      final json = Map<String, dynamic>.from(entry.value as Map)
        ..['date'] ??= entry.key;
      entries.add(MapEntry(entry.key as String, DayLog.fromJson(json)));
    } on Object {
      continue;
    }
  }
  entries.sort((a, b) => a.key.compareTo(b.key));
  final logs = Map<String, DayLog>.fromEntries(entries);
  final profile = Map<String, dynamic>.from(
    state['profile'] as Map? ?? const {},
  );
  final analysis = analyzeCycles(
    logs,
    today: day,
    ageGroup: profile['ageGroup'] as String? ?? 'under18',
    pregnancyEnabled: profile['pregnancyEnabled'] == true,
    fertilityEnabled: profile['fertilityEnabled'] == true,
  );
  final symptomCounts = <String, int>{};
  final intensityCounts = <String, Map<String, int>>{};
  final medicines = <String, List<String>>{};
  var maxPain = 0.0;
  var daysDisrupted = 0;
  var daysUnrelieved = 0;
  for (final entry in entries) {
    final log = entry.value;
    for (final id in log.symptoms.toSet()) {
      symptomCounts.update(id, (value) => value + 1, ifAbsent: () => 1);
    }
    for (final intensity in log.symptomIntensity.entries) {
      if (!log.symptoms.contains(intensity.key) ||
          intensity.value < 1 ||
          intensity.value > 3)
        continue;
      final counts = intensityCounts.putIfAbsent(
        intensity.key,
        () => {'mild': 0, 'moderate': 0, 'strong': 0, 'ratedDays': 0},
      );
      counts[['mild', 'moderate', 'strong'][intensity.value - 1]] =
          counts[['mild', 'moderate', 'strong'][intensity.value - 1]]! + 1;
      counts['ratedDays'] = counts['ratedDays']! + 1;
    }
    if (log.pain > maxPain) maxPain = log.pain;
    if (log.painDisrupts) daysDisrupted++;
    if (log.painUnrelieved) daysUnrelieved++;
    final medicine = log.medicines.trim();
    if (medicine.isNotEmpty)
      medicines.putIfAbsent(medicine, () => []).add(entry.key);
  }
  final periods = analysis.periods
      .map(
        (period) => {
          ...period.toJson(),
          'ongoing': period.end == day && logs[day]?.period == true,
        },
      )
      .toList();
  final cycles = analysis.cycles
      .map(
        (cycle) => {
          'start': cycle.start,
          'end': cycle.end,
          'nextStart': cycle.nextStart,
          'length': cycle.length,
          'periodLength': cycle.periodLength,
        },
      )
      .toList();
  final symptoms =
      symptomCounts.entries.map((e) => {'id': e.key, 'count': e.value}).toList()
        ..sort(
          (a, b) => (b['count'] as int).compareTo(a['count'] as int) == 0
              ? (a['id'] as String).compareTo(b['id'] as String)
              : (b['count'] as int).compareTo(a['count'] as int),
        );
  final intensities =
      intensityCounts.entries.map((e) => {'id': e.key, ...e.value}).toList()
        ..sort(
          (a, b) => (b['ratedDays'] as int).compareTo(a['ratedDays'] as int),
        );
  final guidance =
      evaluateGuidance(logs, profile, today: day, dismissals: const {})
          .map(
            (card) => {
              'id': card['id'],
              'severity': card['severity'],
              'dates': card['dates'],
            },
          )
          .toList();
  return {
    'cycles': cycles,
    'periods': periods,
    'symptomCounts': symptoms,
    'symptomIntensityCounts': intensities,
    'pain': {
      'max': maxPain,
      'daysDisrupted': daysDisrupted,
      'daysUnrelieved': daysUnrelieved,
    },
    'medicines': medicines.entries
        .map((e) => {'name': e.key, 'dates': e.value})
        .toList(),
    'guidance': guidance,
    'dateRange': {
      'from': entries.isEmpty ? null : entries.first.key,
      'to': entries.isEmpty ? null : entries.last.key,
    },
    'loggedDays': entries.length,
  };
}

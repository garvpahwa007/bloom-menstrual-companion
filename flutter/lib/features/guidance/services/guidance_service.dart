import '../../../common/bloom_config.dart';
import '../../../common/date_utils.dart';
import '../../../common/bloom_catalog.dart';
import '../../cycle/services/cycle_service.dart';
import '../../log/models/day_log.dart';

bool _hasAny(DayLog log, List<String> ids) => ids.any(log.symptoms.contains);
bool _isHeavy(DayLog log) =>
    (log.period && log.flow == 'heavy') || log.padFrequent || log.largeClots;

List<Map<String, dynamic>> evaluateGuidance(
  Map<String, DayLog> logs,
  Map<String, dynamic> profile, {
  String? today,
  Map<String, dynamic> dismissals = const {},
}) {
  final day = today ?? todayIso();
  final entries = logs.entries.where((e) => e.key.compareTo(day) <= 0).toList()
    ..sort((a, b) => a.key.compareTo(b.key));
  final cards = <Map<String, dynamic>>[];
  final redFlags = BloomCatalog.instance.list('redFlags');
  Map<String, dynamic>? ruleFor(String id) {
    for (final raw in redFlags) {
      if (raw is Map && raw['id'] == id) return Map<String, dynamic>.from(raw);
    }
    return null;
  }

  void addCard(
    String id,
    Iterable<String> evidenceDates, [
    Map<String, dynamic> details = const {},
  ]) {
    final evidence = evidenceDates.toSet().toList()..sort();
    final rule = ruleFor(id);
    if (evidence.isEmpty || rule == null) return;
    final signature = '$id:${evidence.join(',')}';
    if (dismissals[id] == signature || dismissals[signature] == true) return;
    final source =
        profile['ageGroup'] == 'under18' && rule['adolescentSource'] != null
        ? rule['adolescentSource']
        : rule['source'];
    cards.add({
      'id': id,
      'severity': rule['severity'],
      'dates': evidence,
      'signature': signature,
      'source': source,
      ...details,
    });
  }

  final active = entries
      .where((e) => e.key.compareTo(addDays(day, -1)) >= 0)
      .toList();
  addCard(
    'urgentPain',
    active
        .where(
          (e) =>
              e.value.urgentPain ||
              (e.value.painUnrelieved &&
                  e.value.pain >= BloomConfig.severePainMinimum),
        )
        .map((e) => e.key),
  );
  addCard(
    'urgentBleeding',
    active
        .where(
          (e) =>
              _isHeavy(e.value) &&
              (e.value.fainting || _hasAny(e.value, ['dizziness'])),
        )
        .map((e) => e.key),
  );
  addCard(
    'pregnancyUrgent',
    active
        .where(
          (e) =>
              ((profile['pregnancyEnabled'] == true ||
                  e.value.pregnancyPossible) &&
              (e.value.period ||
                  e.value.betweenBleeding ||
                  e.value.afterSexBleeding ||
                  e.value.flow == 'spotting' ||
                  e.value.urgentPain ||
                  e.value.pain >= BloomConfig.severePainMinimum)),
        )
        .map((e) => e.key),
  );

  final periods = getPeriods(Map.fromEntries(entries));
  if (profile['pregnancyEnabled'] == true) {
    const dangerSymptoms = [
      'severeHeadache',
      'blurredVision',
      'swellingFaceHands',
      'fever',
      'fluidLeaking',
      'reducedMovement',
    ];
    addCard(
      'pregnancyDanger',
      active.where((e) => _hasAny(e.value, dangerSymptoms)).map((e) => e.key),
    );
  } else {
    final analysis = analyzeCycles(
      Map.fromEntries(entries),
      today: day,
      ageGroup: profile['ageGroup'] as String? ?? 'under18',
      fertilityEnabled: profile['fertilityEnabled'] == true,
    );
    addCard(
      'longPeriod',
      periods
          .where((p) => p.length > BloomConfig.maximumPeriodDays)
          .expand((p) => dateRange(p.start, p.end)),
    );
    addCard(
      'heavyFlow',
      entries
          .where((e) => e.value.padFrequent || e.value.largeClots)
          .map((e) => e.key),
    );
    final maximum = profile['ageGroup'] == 'adult'
        ? BloomConfig.adultMaximumCycleDays
        : BloomConfig.adolescentMaximumCycleDays;
    bool unusual(cycle) =>
        cycle.length < BloomConfig.minimumCycleDays || cycle.length > maximum;
    final unusualCycles = analysis.cycles.where(unusual).toList();
    addCard(
      'cycleVariation',
      unusualCycles.expand((c) => [c.start, c.nextStart]),
      {'minimum': BloomConfig.minimumCycleDays, 'maximum': maximum},
    );
    var run = <dynamic>[];
    final consecutive = <String>[];
    for (final cycle in analysis.cycles) {
      if (!unusual(cycle)) {
        run = [];
        continue;
      }
      if (run.isNotEmpty && run.last.nextStart != cycle.start) run = [];
      run.add(cycle);
      if (run.length >= BloomConfig.consecutiveUnusualCycles) {
        for (final item in run) {
          consecutive
            ..add(item.start)
            ..add(item.nextStart);
        }
      }
    }
    addCard('irregularConsecutive', consecutive, {
      'minimum': BloomConfig.minimumCycleDays,
      'maximum': maximum,
    });
    final last = periods.isEmpty ? null : periods.last;
    if (last != null &&
        daysBetween(last.start, day) >= BloomConfig.noPeriodDays)
      addCard('noPeriod', [last.start, day]);
    addCard(
      'betweenBleeding',
      entries
          .where((e) => e.value.betweenBleeding || e.value.afterSexBleeding)
          .map((e) => e.key),
    );
    addCard(
      'disruptivePain',
      entries
          .where((e) => e.value.painDisrupts || e.value.painUnrelieved)
          .map((e) => e.key),
    );
    final anemiaDates = <String>[];
    for (final period in periods) {
      final days = entries
          .where(
            (e) =>
                e.key.compareTo(period.start) >= 0 &&
                e.key.compareTo(period.end) <= 0,
          )
          .toList();
      final heavyDays = days.where((e) => _isHeavy(e.value)).toList();
      final symptomDays = days
          .where(
            (e) =>
                _hasAny(e.value, ['tiredness', 'breathlessness', 'dizziness']),
          )
          .toList();
      if (heavyDays.isNotEmpty && symptomDays.isNotEmpty)
        anemiaDates
          ..addAll(heavyDays.map((e) => e.key))
          ..addAll(symptomDays.map((e) => e.key));
    }
    for (final entry in entries) {
      if (_isHeavy(entry.value) &&
          _hasAny(entry.value, ['tiredness', 'breathlessness', 'dizziness']))
        anemiaDates.add(entry.key);
    }
    addCard('anemiaSymptoms', anemiaDates);
  }
  var lowRun = <String>[];
  final lowDates = <String>[];
  for (final entry in entries) {
    if (entry.value.mood != 'veryLow') {
      lowRun = [];
      continue;
    }
    if (lowRun.isNotEmpty && daysBetween(lowRun.last, entry.key) != 1)
      lowRun = [];
    lowRun.add(entry.key);
    if (lowRun.length >= BloomConfig.consecutiveVeryLowMoodDays)
      lowDates.addAll(lowRun);
  }
  addCard('veryLowMood', lowDates);
  const order = {'urgent': 0, 'support': 1, 'consult': 2};
  cards.sort(
    (a, b) => (order[a['severity']] ?? 3).compareTo(order[b['severity']] ?? 3),
  );
  return cards;
}

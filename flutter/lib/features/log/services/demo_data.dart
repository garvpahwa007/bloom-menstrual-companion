import '../../../common/bloom_catalog.dart';
import '../../../common/date_utils.dart';

Map<String, dynamic> createDemoData({String? today}) {
  final day = today ?? todayIso();
  final logs = <String, dynamic>{};
  final cycleLengths = [29, 31, 28, 39, 30, 27, 32];
  final lastStart = addDays(day, -11);
  final starts = <String>[lastStart];
  for (var index = cycleLengths.length - 1; index >= 0; index--) {
    starts.insert(0, addDays(starts.first, -cycleLengths[index]));
  }
  for (var periodIndex = 0; periodIndex < starts.length; periodIndex++) {
    final start = starts[periodIndex];
    final periodLength = periodIndex == 4
        ? 8
        : periodIndex % 3 == 0
        ? 6
        : 5;
    for (var dayIndex = 0; dayIndex < periodLength; dayIndex++) {
      final date = addDays(start, dayIndex);
      logs[date] = {
        ..._basicLog(date),
        'period': true,
        'flow': dayIndex < 2
            ? 'heavy'
            : dayIndex < 4
            ? 'medium'
            : 'light',
        'pain': dayIndex < 2
            ? 6
            : dayIndex < 4
            ? 3
            : 1,
        'symptoms': dayIndex < 2
            ? ['cramps', 'tiredness']
            : dayIndex < 4
            ? ['bloating']
            : <String>[],
        'painDisrupts': dayIndex == 0 && periodIndex >= 4,
        'padFrequent': dayIndex == 0 && periodIndex == 4,
        'largeClots': dayIndex == 1 && periodIndex == 4,
        'mood': dayIndex < 2 ? 'low' : 'okay',
        'energy': dayIndex < 2 ? 'low' : 'okay',
        'sleep': dayIndex < 2 ? 6.5 : 8,
      };
    }
    if (periodIndex > 0) {
      for (var before = 1; before <= 3; before++) {
        final date = addDays(start, -before);
        logs[date] = {
          ..._basicLog(date),
          'symptoms': ['moodChanges'],
          'energy': 'low',
          'mood': 'low',
          'sleep': 7,
        };
      }
    }
  }
  logs[day] = {..._basicLog(day), 'mood': 'good', 'energy': 'okay', 'sleep': 8};
  final symptoms = BloomCatalog.instance.list('symptoms');
  return {
    'version': 1,
    'demo': true,
    'profile': {
      'ageGroup': 'under18',
      'pregnancyEnabled': false,
      'pregnancyConfirmed': false,
      'lastPeriodDate': '',
      'fertilityEnabled': false,
    },
    'settings': {
      'language': 'en',
      'textSize': 'normal',
      'highContrast': false,
      'readAloud': false,
      'discreet': false,
      'trackedSymptoms': symptoms
          .take(12)
          .map((e) => (e as Map)['id'] as String)
          .toList(),
    },
    'logs': logs,
    'reminders': <dynamic>[],
    'dismissals': <String, dynamic>{},
  };
}

Map<String, dynamic> createFreshData({
  required String ageGroup,
  required String language,
}) {
  final data = createDemoData();
  data['demo'] = false;
  data['logs'] = <String, dynamic>{};
  (data['profile'] as Map<String, dynamic>)['ageGroup'] = ageGroup;
  (data['settings'] as Map<String, dynamic>)['language'] = language;
  return data;
}

Map<String, dynamic> _basicLog(String date) => {
  'date': date,
  'period': false,
  'flow': 'medium',
  'padFrequent': false,
  'largeClots': false,
  'pain': 0,
  'painDisrupts': false,
  'painUnrelieved': false,
  'symptoms': <String>[],
  'mood': 'okay',
  'energy': 'okay',
  'sleep': 8,
  'medicines': '',
  'note': '',
  'betweenBleeding': false,
  'afterSexBleeding': false,
  'pregnancyPossible': false,
  'urgentPain': false,
  'fainting': false,
  'confirmedGap': false,
};

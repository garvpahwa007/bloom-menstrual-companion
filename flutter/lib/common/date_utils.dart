import 'package:intl/intl.dart';

const _dayMillis = 86400000;
final _isoPattern = RegExp(r'^\d{4}-\d{2}-\d{2}$');

String todayIso([DateTime? now]) {
  final value = now ?? DateTime.now();
  return '${value.year.toString().padLeft(4, '0')}-'
      '${value.month.toString().padLeft(2, '0')}-'
      '${value.day.toString().padLeft(2, '0')}';
}

DateTime parseDateKey(String value) {
  if (!_isoPattern.hasMatch(value)) {
    throw const FormatException('Use a local date in YYYY-MM-DD format.');
  }
  final parts = value.split('-').map(int.parse).toList();
  final date = DateTime(parts[0], parts[1], parts[2]);
  if (date.year != parts[0] || date.month != parts[1] || date.day != parts[2]) {
    throw const FormatException('Invalid calendar date.');
  }
  return DateTime(date.year, date.month, date.day);
}

String dateKey(DateTime value) =>
    '${value.year.toString().padLeft(4, '0')}-'
    '${value.month.toString().padLeft(2, '0')}-'
    '${value.day.toString().padLeft(2, '0')}';

String addDays(String value, int days) {
  final d = parseDateKey(value);
  final ordinal =
      DateTime.utc(d.year, d.month, d.day).millisecondsSinceEpoch ~/ _dayMillis;
  final result = DateTime.fromMillisecondsSinceEpoch(
    (ordinal + days) * _dayMillis,
    isUtc: true,
  );
  return dateKey(result);
}

int daysBetween(String start, String end) {
  final a = parseDateKey(start);
  final b = parseDateKey(end);
  final first =
      DateTime.utc(a.year, a.month, a.day).millisecondsSinceEpoch ~/ _dayMillis;
  final last =
      DateTime.utc(b.year, b.month, b.day).millisecondsSinceEpoch ~/ _dayMillis;
  return last - first;
}

List<String> dateRange(String start, String end) {
  final count = daysBetween(start, end);
  if (count < 0) return const [];
  if (count > 20000) throw RangeError('Date range is too large.');
  return List.generate(count + 1, (index) => addDays(start, index));
}

String formatBloomDate(
  String value,
  String language, {
  bool withYear = false,
  bool longMonth = false,
}) {
  final date = parseDateKey(value);
  final locale = switch (language) {
    'hi' => 'hi_IN',
    'ta' => 'ta_IN',
    _ => 'en_IN',
  };
  final pattern = withYear
      ? (longMonth ? 'd MMMM y' : 'd MMM y')
      : (longMonth ? 'd MMMM' : 'd MMM');
  return DateFormat(
    pattern,
    locale,
  ).format(DateTime(date.year, date.month, date.day, 12));
}

String monthKey(DateTime value) =>
    '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}';

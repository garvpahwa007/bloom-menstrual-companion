import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../../common/bloom_catalog.dart';
import '../../../common/date_utils.dart';
import '../../cycle/models/cycle_analysis.dart';

const defaultReminders = <Map<String, dynamic>>[
  {
    'id': 'daily-checkin',
    'type': 'daily',
    'title': '',
    'time': '20:00',
    'enabled': false,
  },
  {
    'id': 'period-estimate',
    'type': 'period',
    'title': '',
    'time': '09:00',
    'enabled': false,
  },
];

bool isReminderDue(
  Map<String, dynamic> reminder, {
  required String today,
  required String time,
  required CycleAnalysis analysis,
  required Map<String, dynamic> profile,
}) {
  if (reminder['enabled'] != true ||
      ![
        'daily',
        'period',
        'medicine',
        'custom',
        'checkup',
      ].contains(reminder['type']))
    return false;
  final reminderTime = reminder['time'];
  if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(today) ||
      !RegExp(r'^(?:[01]\d|2[0-3]):[0-5]\d$').hasMatch(time) ||
      reminderTime is! String ||
      !RegExp(r'^(?:[01]\d|2[0-3]):[0-5]\d$').hasMatch(reminderTime))
    return false;
  final recurrence = reminder['recurrence'] is Map
      ? Map<String, dynamic>.from(reminder['recurrence'] as Map)
      : null;
  final frequency = recurrence?['frequency'];
  if (recurrence != null && !['once', 'daily', 'weekly'].contains(frequency))
    return false;
  if (frequency == 'once' || (reminder['date'] != null && recurrence == null)) {
    if (reminder['date'] != today) return false;
  } else {
    final startDate = reminder['date'];
    if (startDate is String && today.compareTo(startDate) < 0) return false;
    if (frequency == 'weekly') {
      final days = recurrence?['weekdays'];
      if (days is! List ||
          days.isEmpty ||
          days.any((v) => v is! int || v < 0 || v > 6) ||
          days.toSet().length != days.length)
        return false;
      final d = parseDateKey(today);
      if (!days.contains(DateTime(d.year, d.month, d.day, 12).weekday % 7))
        return false;
    }
  }
  if (time.compareTo(reminderTime) < 0) return false;
  if (reminder['type'] == 'period')
    return profile['pregnancyEnabled'] != true &&
        analysis.prediction?.from == today;
  return true;
}

({String title, String body}) reminderMessage(
  Map<String, dynamic> reminder,
  Map<String, dynamic> settings,
  String language,
) {
  final catalog = BloomCatalog.instance;
  if (settings['discreet'] == true)
    return (
      title: catalog.t('app.diary', language),
      body: catalog.t('reminders.neutral', language),
    );
  final key = switch (reminder['type']) {
    'period' => 'reminders.expected',
    'checkup' => 'reminders.checkupBody',
    'medicine' => 'reminders.medicineBody',
    _ => 'reminders.checkin',
  };
  final title = (reminder['title'] as String? ?? '').trim();
  return (
    title: catalog.t('app.name', language),
    body: title.isEmpty ? catalog.t(key, language) : title,
  );
}

class BloomNotifications {
  BloomNotifications._();
  static final BloomNotifications instance = BloomNotifications._();
  final FlutterLocalNotificationsPlugin plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );
    await plugin.initialize(settings);
    _initialized = true;
  }

  Future<bool> requestPermission() async {
    await initialize();
    final android = plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    final ios = plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >();
    final androidGranted = await android?.requestNotificationsPermission();
    final iosGranted = await ios?.requestPermissions(
      alert: true,
      badge: true,
      sound: true,
    );
    return (androidGranted ?? true) && (iosGranted ?? true);
  }

  Future<void> show({
    required String id,
    required String title,
    required String body,
  }) async {
    await initialize();
    final numericId = id.codeUnits.fold<int>(
      0,
      (sum, unit) => ((sum * 31) + unit) & 0x7fffffff,
    );
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'bloom-reminders',
        'Bloom reminders',
        channelDescription:
            'Opt-in reminders that are checked while Bloom is open',
        importance: Importance.defaultImportance,
        priority: Priority.defaultPriority,
      ),
      iOS: DarwinNotificationDetails(),
    );
    await plugin.show(numericId, title, body, details);
  }
}

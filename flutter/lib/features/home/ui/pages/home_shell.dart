import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/date_utils.dart';
import '../../../ask/ui/pages/ask_page.dart';
import '../../../calendar/ui/pages/calendar_page.dart';
import '../../../cloud/services/bloom_api_client.dart';
import '../../../cloud/ui/pages/cloud_page.dart';
import '../../../cycle/services/cycle_service.dart';
import '../../../guidance/ui/pages/guidance_page.dart';
import '../../../insights/ui/pages/insights_page.dart';
import '../../../learn/ui/pages/learn_page.dart';
import '../../../log/services/diary_repository.dart';
import '../../../log/ui/pages/log_page.dart';
import '../../../pregnancy/ui/pages/pregnancy_page.dart';
import '../../../privacy/ui/pages/privacy_page.dart';
import '../../../reminders/services/reminder_service.dart';
import '../../../reminders/ui/pages/reminders_page.dart';
import '../../../settings/ui/pages/settings_page.dart';
import '../../../visit/ui/pages/visit_page.dart';
import 'today_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.diary});
  final DiaryRepository diary;
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> with WidgetsBindingObserver {
  static const _primaryRoutes = ['today', 'log', 'calendar', 'insights'];
  String _route = 'today';
  DateTime _selectedDate = DateUtils.dateOnly(DateTime.now());
  DateTime _currentLocalDay = DateUtils.dateOnly(DateTime.now());
  int _logRevision = 0;
  String? _initialSymptom;
  Timer? _reminderTimer;
  final Set<String> _deliveredReminders = {};
  bool _checkingReminders = false;
  final _catalog = BloomCatalog.instance;
  late final BloomApiClient _cloudApi;

  String get _lang => widget.diary.language;

  @override
  void initState() {
    super.initState();
    _cloudApi = BloomApiClient();
    WidgetsBinding.instance.addObserver(this);
    _reminderTimer = Timer.periodic(
      const Duration(milliseconds: 30000),
      (_) {
        _refreshLocalDay();
        _checkReminders();
      },
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkReminders());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _reminderTimer?.cancel();
    _cloudApi.close();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshLocalDay();
      _checkReminders();
    }
  }

  void _refreshLocalDay() {
    final today = DateUtils.dateOnly(DateTime.now());
    if (!mounted || today == _currentLocalDay) return;
    setState(() => _currentLocalDay = today);
  }

  void _openLog(DateTime date) {
    _initialSymptom = null;
    setState(() {
      _selectedDate = DateUtils.dateOnly(date);
      _route = 'log';
      _logRevision++;
    });
  }

  void _openQuickSymptom(String symptom) {
    setState(() {
      _selectedDate = DateUtils.dateOnly(DateTime.now());
      _initialSymptom = symptom;
      _route = 'log';
      _logRevision++;
    });
  }

  void _navigate(String route) {
    if (route == 'pregnancy' &&
        widget.diary.profile['ageGroup'] != 'adult' &&
        widget.diary.profile['pregnancyFeatureEnabled'] != true &&
        widget.diary.profile['pregnancyEnabled'] != true) {
      setState(() => _route = 'settings');
      return;
    }
    setState(() => _route = route);
  }

  @override
  Widget build(BuildContext context) {
    final tabIndex = _primaryRoutes.indexOf(_route);
    final content = switch (_route) {
      'today' => TodayPage(
        diary: widget.diary,
        onLog: _openLog,
        onQuickSymptom: _openQuickSymptom,
        onNavigate: _navigate,
      ),
      'log' => LogPage(
        key: ValueKey('log-${_selectedDate.toIso8601String()}-$_logRevision'),
        date: _selectedDate,
        diary: widget.diary,
        initialSymptom: _initialSymptom,
        onSaved: () => setState(() {}),
        onDateChanged: _openLog,
        onNavigate: _navigate,
      ),
      'calendar' => CalendarPage(
        diary: widget.diary,
        onSelectDate: _openLog,
        onNavigate: _navigate,
      ),
      'insights' => InsightsPage(
        diary: widget.diary,
        onNavigate: _navigate,
        onLog: _openLog,
      ),
      'guidance' => GuidancePage(diary: widget.diary, onNavigate: _navigate),
      'learn' => LearnPage(diary: widget.diary),
      'ask' => AskPage(diary: widget.diary, onNavigate: _navigate),
      'reminders' => RemindersPage(diary: widget.diary),
      'pregnancy' => PregnancyPage(diary: widget.diary, onNavigate: _navigate),
      'visit' => VisitPage(diary: widget.diary),
      'settings' => SettingsPage(diary: widget.diary, onNavigate: _navigate),
      'privacy' => PrivacyPage(diary: widget.diary, onNavigate: _navigate),
      _ => TodayPage(
        diary: widget.diary,
        onLog: _openLog,
        onQuickSymptom: _openQuickSymptom,
        onNavigate: _navigate,
      ),
    };
    return Scaffold(
      appBar: AppBar(
        backgroundColor: BloomTheme.background,
        surfaceTintColor: Colors.transparent,
        titleSpacing: 0,
        leading: Builder(
          builder: (context) => IconButton(
            tooltip: _catalog.t('nav.menu', _lang),
            icon: const Icon(Icons.menu_rounded),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Row(
          children: [
            Image.asset(
              'assets/images/bloom-mark.png',
              width: 29,
              height: 29,
              errorBuilder: (_, _, _) =>
                  const Icon(Icons.spa_rounded, color: BloomTheme.plum),
            ),
            const SizedBox(width: 8),
            Text(
              _catalog.t(
                widget.diary.settings['discreet'] == true
                    ? 'app.diary'
                    : 'app.name',
                _lang,
              ),
              style: const TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.w700,
                letterSpacing: -.5,
                color: BloomTheme.ink,
              ),
            ),
          ],
        ),
        actions: [
          if (widget.diary.isPinEnabled)
            IconButton(
              tooltip: _catalog.t('header.lock', _lang),
              onPressed: widget.diary.lock,
              icon: const Icon(
                Icons.lock_outline_rounded,
                color: BloomTheme.plumDark,
              ),
            ),
          IconButton(
            tooltip: _catalog.t('nav.account', _lang),
            onPressed: () => Navigator.of(context).push<void>(
              MaterialPageRoute<void>(
                builder: (_) => CloudPage(
                  diary: widget.diary,
                  api: _cloudApi,
                  onDiaryChanged: () {
                    if (mounted) setState(() {});
                  },
                ),
              ),
            ),
            icon: const Icon(Icons.cloud_outlined, color: BloomTheme.plumDark),
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: _drawer(),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 180),
          child: KeyedSubtree(key: ValueKey(_route), child: content),
        ),
      ),
      bottomNavigationBar: tabIndex < 0
          ? null
          : NavigationBar(
              selectedIndex: tabIndex,
              onDestinationSelected: (value) =>
                  setState(() => _route = _primaryRoutes[value]),
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.home_outlined),
                  selectedIcon: const Icon(Icons.home_rounded),
                  label: _catalog.t('nav.today', _lang),
                ),
                NavigationDestination(
                  icon: const Icon(Icons.edit_note_outlined),
                  selectedIcon: const Icon(Icons.edit_note_rounded),
                  label: _catalog.t('nav.log', _lang),
                ),
                NavigationDestination(
                  icon: const Icon(Icons.calendar_month_outlined),
                  selectedIcon: const Icon(Icons.calendar_month_rounded),
                  label: _catalog.t('nav.calendar', _lang),
                ),
                NavigationDestination(
                  icon: const Icon(Icons.auto_graph_outlined),
                  selectedIcon: const Icon(Icons.auto_graph_rounded),
                  label: _catalog.t('nav.insightsShort', _lang),
                ),
              ],
            ),
    );
  }

  Widget _drawer() {
    final pregnantVisible =
        widget.diary.profile['ageGroup'] == 'adult' ||
        widget.diary.profile['pregnancyFeatureEnabled'] == true ||
        widget.diary.profile['pregnancyEnabled'] == true;
    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [BloomTheme.heroStart, BloomTheme.heroEnd],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Image.asset(
                    'assets/images/bloom-mark.png',
                    width: 38,
                    height: 38,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.spa_rounded,
                      color: Colors.white,
                      size: 34,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _catalog.t('app.name', _lang),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    _catalog.t('header.companion', _lang),
                    style: const TextStyle(color: Color(0xFFF6EFF8)),
                  ),
                ],
              ),
            ),
            _sectionLabel('nav.overview'),
            _destination('today', 'nav.today', Icons.home_outlined),
            _destination('log', 'nav.log', Icons.edit_note_outlined),
            _destination(
              'calendar',
              'nav.calendar',
              Icons.calendar_month_outlined,
            ),
            _destination('insights', 'nav.insights', Icons.auto_graph_outlined),
            const Divider(height: 20),
            _sectionLabel('nav.support'),
            _destination(
              'guidance',
              'nav.doctor',
              Icons.favorite_outline_rounded,
            ),
            _destination(
              'visit',
              'doctor.prepare',
              Icons.medical_information_outlined,
            ),
            _destination('learn', 'nav.learn', Icons.menu_book_outlined),
            _destination('ask', 'nav.ask', Icons.question_answer_outlined),
            _destination(
              'reminders',
              'nav.reminders',
              Icons.notifications_none_rounded,
            ),
            if (pregnantVisible)
              _destination(
                'pregnancy',
                'nav.pregnancy',
                Icons.pregnant_woman_outlined,
              ),
            const Divider(height: 20),
            _destination('settings', 'nav.settings', Icons.tune_rounded),
            _destination('privacy', 'nav.privacyData', Icons.shield_outlined),
            ListTile(
              leading: const Icon(Icons.cloud_outlined),
              title: Text(_catalog.t('nav.account', _lang)),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push<void>(
                  MaterialPageRoute<void>(
                    builder: (_) => CloudPage(
                      diary: widget.diary,
                      api: _cloudApi,
                      onDiaryChanged: () {
                        if (mounted) setState(() {});
                      },
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String key) => Padding(
    padding: const EdgeInsets.fromLTRB(18, 10, 18, 5),
    child: Text(
      _catalog.t(key, _lang).toUpperCase(),
      style: Theme.of(context).textTheme.labelSmall
          ?.copyWith(color: BloomTheme.plum, letterSpacing: 1.1),
    ),
  );
  Widget _destination(String route, String key, IconData icon) => ListTile(
    selected: _route == route,
    leading: Icon(icon),
    title: Text(_catalog.t(key, _lang)),
    onTap: () {
      Navigator.pop(context);
      _navigate(route);
    },
  );

  Future<void> _checkReminders() async {
    if (_checkingReminders || !widget.diary.hasDiary || widget.diary.locked)
      return;
    _checkingReminders = true;
    try {
      final now = DateTime.now();
      final today = todayIso(now);
      final time =
          '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
      final profile = widget.diary.profile;
      final analysis = analyzeCycles(
        widget.diary.logs,
        today: today,
        ageGroup: profile['ageGroup'] as String? ?? 'under18',
        pregnancyEnabled: profile['pregnancyEnabled'] == true,
        fertilityEnabled: profile['fertilityEnabled'] == true,
      );
      final all = [
        ...defaultReminders.where(
          (base) => !widget.diary.reminders.any((r) => r['id'] == base['id']),
        ),
        ...widget.diary.reminders,
      ];
      for (final reminder in all) {
        final id = '${reminder['id']}:$today';
        if (_deliveredReminders.contains(id) ||
            !isReminderDue(
              reminder,
              today: today,
              time: time,
              analysis: analysis,
              profile: profile,
            ))
          continue;
        _deliveredReminders.add(id);
        final message = reminderMessage(reminder, widget.diary.settings, _lang);
        await BloomNotifications.instance.show(
          id: id,
          title: message.title,
          body: message.body,
        );
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message.body),
              duration: const Duration(seconds: 4),
            ),
          );
      }
    } on Object {
      // Reminder delivery is best-effort and must never interrupt diary tracking.
    } finally {
      _checkingReminders = false;
    }
  }
}

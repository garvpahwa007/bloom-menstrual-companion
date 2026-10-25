import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/date_utils.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../log/services/diary_repository.dart';
import '../../services/reminder_service.dart';

class RemindersPage extends StatefulWidget {
  const RemindersPage({super.key, required this.diary});
  final DiaryRepository diary;
  @override
  State<RemindersPage> createState() => _RemindersPageState();
}

class _RemindersPageState extends State<RemindersPage> {
  final _catalog = BloomCatalog.instance;
  String _type = 'custom';
  String _title = '';
  String _time = '09:00';
  String _date = '';
  String _frequency = 'daily';
  final Set<int> _weekdays = {1, 2, 3, 4, 5};
  String? _error;
  String get _lang => widget.diary.language;

  List<Map<String, dynamic>> get _reminders {
    final current = widget.diary.reminders;
    return [
      ...defaultReminders.map(
        (base) =>
            current.where((row) => row['id'] == base['id']).firstOrNull ??
            Map<String, dynamic>.from(base),
      ),
      ...current.where(
        (row) => !defaultReminders.any((base) => base['id'] == row['id']),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) => FeatureScaffold(
    title: _catalog.t('reminders.title', _lang),
    kicker: _catalog.t('reminders.kicker', _lang),
    subtitle: _catalog.t('reminders.subtitle', _lang),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        BloomInfoBanner(
          text: _catalog.t('common.local', _lang),
          icon: Icons.shield_outlined,
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: _requestPermission,
          icon: const Icon(Icons.notifications_active_outlined),
          label: Text(_catalog.t('reminders.permission', _lang)),
        ),
        const SizedBox(height: 12),
        ..._reminders.map(_reminderCard),
        const SizedBox(height: 8),
        BloomCard(
          title: _catalog.t('reminders.add', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                maxLength: 100,
                decoration: InputDecoration(
                  labelText: _catalog.t('reminders.label', _lang),
                  counterText: '',
                ),
                onChanged: (value) => setState(() => _title = value),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: _type,
                decoration: InputDecoration(
                  labelText: _catalog.t('common.optional', _lang),
                ),
                items: ['custom', 'medicine']
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(_catalog.t('reminders.$value', _lang)),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _type = value ?? 'custom'),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: _frequency,
                decoration: InputDecoration(
                  labelText: _catalog.t('reminders.repeat', _lang),
                ),
                items: ['once', 'daily', 'weekly']
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(_frequencyLabel(value)),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() {
                  _frequency = value ?? 'daily';
                  _error = null;
                }),
              ),
              if (_frequency == 'once') ...[
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () => _pickDate(),
                  icon: const Icon(Icons.event_outlined),
                  label: Text(
                    _date.isEmpty
                        ? _catalog.t('reminders.dateRequired', _lang)
                        : _date,
                  ),
                ),
              ],
              if (_frequency == 'weekly') ...[
                const SizedBox(height: 10),
                _weekdayPicker(
                  _weekdays,
                  (days) => setState(() {
                    _weekdays
                      ..clear()
                      ..addAll(days);
                    _error = null;
                  }),
                ),
              ],
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: _pickTime,
                icon: const Icon(Icons.schedule_rounded),
                label: Text('${_catalog.t('reminders.time', _lang)} · $_time'),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    _catalog.t(_error!, _lang),
                    style: const TextStyle(color: Color(0xFF9D3D47)),
                  ),
                ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: _add,
                icon: const Icon(Icons.add_rounded),
                label: Text(_catalog.t('reminders.add', _lang)),
              ),
            ],
          ),
        ),
      ],
    ),
  );

  String _frequencyLabel(String value) => _catalog.t(
    value == 'daily' ? 'reminders.dailyRepeat' : 'reminders.$value',
    _lang,
  );

  Widget _reminderCard(Map<String, dynamic> reminder) {
    final id = reminder['id'] as String;
    final personal = !defaultReminders.any((item) => item['id'] == id);
    final frequency =
        (reminder['recurrence'] as Map?)?['frequency'] as String? ??
        (reminder['date'] == null ? 'daily' : 'once');
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: BloomCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: reminder['enabled'] == true,
              title: Text(
                (reminder['title'] as String?)?.trim().isNotEmpty == true
                    ? reminder['title'] as String
                    : _catalog.t('reminders.${reminder['type']}', _lang),
              ),
              onChanged: (value) => _update(id, {'enabled': value}),
            ),
            Row(
              children: [
                Text(_catalog.t('reminders.time', _lang)),
                const Spacer(),
                TextButton.icon(
                  onPressed: () =>
                      _pickTime(existing: reminder['time'] as String?, id: id),
                  icon: const Icon(Icons.schedule_rounded),
                  label: Text(reminder['time'] as String),
                ),
              ],
            ),
            if (personal) ...[
              DropdownButtonFormField<String>(
                value: frequency,
                decoration: InputDecoration(
                  labelText: _catalog.t('reminders.repeat', _lang),
                ),
                items: ['once', 'daily', 'weekly']
                    .map(
                      (value) => DropdownMenuItem(
                        value: value,
                        child: Text(_frequencyLabel(value)),
                      ),
                    )
                    .toList(),
                onChanged: (value) =>
                    _changeFrequency(reminder, value ?? 'daily'),
              ),
              if (reminder['date'] != null)
                TextButton.icon(
                  onPressed: () =>
                      _pickDate(existing: reminder['date'] as String, id: id),
                  icon: const Icon(Icons.event_outlined),
                  label: Text(
                    '${_catalog.t(frequency == 'once' ? 'reminders.scheduledFor' : 'reminders.startsOn', _lang, {'date': reminder['date']})}',
                  ),
                ),
              if (frequency == 'weekly')
                _weekdayPicker(
                  ((reminder['recurrence'] as Map?)?['weekdays'] as List? ??
                          const [])
                      .cast<int>()
                      .toSet(),
                  (days) {
                    if (days.isNotEmpty)
                      _update(id, {
                        'recurrence': {
                          'frequency': 'weekly',
                          'weekdays': days.toList()..sort(),
                        },
                      });
                  },
                ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () async {
                    await widget.diary.saveReminders(
                      _reminders.where((row) => row['id'] != id).toList(),
                    );
                    if (mounted) setState(() {});
                  },
                  icon: const Icon(Icons.delete_outline_rounded),
                  label: Text(_catalog.t('common.remove', _lang)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _weekdayPicker(Set<int> selected, ValueChanged<Set<int>> onChanged) {
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return Wrap(
      spacing: 5,
      runSpacing: 4,
      children: List.generate(
        7,
        (day) => FilterChip(
          label: Text(_catalog.t('reminders.weekday.${keys[day]}', _lang)),
          selected: selected.contains(day),
          onSelected: (value) {
            final next = selected.toSet();
            value ? next.add(day) : next.remove(day);
            onChanged(next);
          },
        ),
      ),
    );
  }

  Future<void> _requestPermission() async {
    final allowed = await BloomNotifications.instance.requestPermission();
    if (mounted)
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _catalog.t(
              allowed ? 'reminders.enabled' : 'reminders.denied',
              _lang,
            ),
          ),
        ),
      );
  }

  Future<void> _pickTime({String? existing, String? id}) async {
    final parts = (existing ?? _time).split(':').map(int.parse).toList();
    final chosen = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: parts[0], minute: parts[1]),
    );
    if (chosen == null) return;
    final formatted =
        '${chosen.hour.toString().padLeft(2, '0')}:${chosen.minute.toString().padLeft(2, '0')}';
    if (id == null)
      setState(() => _time = formatted);
    else
      await _update(id, {'time': formatted});
  }

  Future<void> _pickDate({String? existing, String? id}) async {
    final now = DateTime.now();
    final initial = DateTime.tryParse(existing ?? _date) ?? now;
    final chosen = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: DateTime(now.year + 5),
    );
    if (chosen == null) return;
    final value = dateKey(chosen);
    if (id == null) {
      setState(() {
        _date = value;
        _error = null;
      });
    } else {
      await _update(id, {'date': value});
    }
  }

  Future<void> _add() async {
    if (_title.trim().isEmpty) return;
    if (_frequency == 'once' && _date.isEmpty) {
      setState(() => _error = 'reminders.dateRequired');
      return;
    }
    if (_frequency == 'weekly' && _weekdays.isEmpty) {
      setState(() => _error = 'reminders.weekdayRequired');
      return;
    }
    final reminder = <String, dynamic>{
      'id': DateTime.now().microsecondsSinceEpoch.toString(),
      'type': _type,
      'title': _title.trim(),
      'time': _time,
      'enabled': false,
      'recurrence': {
        'frequency': _frequency,
        if (_frequency == 'weekly') 'weekdays': _weekdays.toList()..sort(),
      },
      if (_date.isNotEmpty) 'date': _date,
    };
    await widget.diary.saveReminders([..._reminders, reminder]);
    if (mounted)
      setState(() {
        _title = '';
        _date = '';
        _frequency = 'daily';
        _error = null;
      });
  }

  Future<void> _update(String id, Map<String, dynamic> patch) async {
    final rows = _reminders
        .map(
          (row) => row['id'] == id ? <String, dynamic>{...row, ...patch} : row,
        )
        .toList();
    await widget.diary.saveReminders(rows);
    if (mounted) setState(() {});
  }

  Future<void> _changeFrequency(
    Map<String, dynamic> reminder,
    String frequency,
  ) async {
    var date = reminder['date'] as String?;
    if (frequency == 'once' && date == null) {
      final now = DateTime.now();
      final picked = await showDatePicker(
        context: context,
        initialDate: now,
        firstDate: DateTime(now.year, now.month, now.day),
        lastDate: DateTime(now.year + 5),
      );
      if (picked == null) return;
      date = dateKey(picked);
    }
    await _update(reminder['id'] as String, {
      'recurrence': {
        'frequency': frequency,
        if (frequency == 'weekly') 'weekdays': [1, 2, 3, 4, 5],
      },
      if (date != null) 'date': date,
    });
  }
}

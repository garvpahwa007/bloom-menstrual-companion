import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/bloom_config.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/bloom_motion.dart';
import '../../../../common/date_utils.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../log/services/diary_repository.dart';

class PregnancyPage extends StatefulWidget {
  const PregnancyPage({
    super.key,
    required this.diary,
    required this.onNavigate,
  });
  final DiaryRepository diary;
  final ValueChanged<String> onNavigate;
  @override
  State<PregnancyPage> createState() => _PregnancyPageState();
}

class _PregnancyPageState extends State<PregnancyPage> {
  final _catalog = BloomCatalog.instance;
  bool _confirmed = false;
  String _lastDate = '';
  int? _selectedWeek;
  String? _error;
  String get _lang => widget.diary.language;

  @override
  void initState() {
    super.initState();
    _lastDate = widget.diary.profile['lastPeriodDate'] as String? ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.diary.profile['pregnancyEnabled'] == true;
    final weeks = _catalog.list('pregnancyWeeks').whereType<Map>().toList();
    final elapsed = active ? daysBetween(_lastDate, todayIso()) : 0;
    final week = elapsed < 0 ? 0 : elapsed ~/ BloomConfig.daysPerWeek;
    final displayWeek = (_selectedWeek ?? (week < 1 ? 1 : week)).clamp(
      1,
      BloomConfig.maximumPregnancyWeek,
    );
    final info = weeks
        .where(
          (item) =>
              displayWeek >= (item['from'] as int) &&
              displayWeek <= (item['to'] as int),
        )
        .firstOrNull;

    return FeatureScaffold(
      title: _catalog.t('pregnancy.title', _lang),
      kicker: _catalog.t('pregnancy.kicker', _lang),
      subtitle: _catalog.t('pregnancy.intro', _lang),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!active)
            BloomEntrance(child: _setup())
          else ...[
            BloomEntrance(child: _pregnancyHero(week)),
            const SizedBox(height: 12),
            BloomCard(
              title: _catalog.t('pregnancy.weekChoose', _lang),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DropdownButtonFormField<int>(
                    value: displayWeek,
                    items:
                        List.generate(
                              BloomConfig.maximumPregnancyWeek,
                              (i) => i + 1,
                            )
                            .map(
                              (value) => DropdownMenuItem(
                                value: value,
                                child: Text(
                                  _catalog.t('pregnancy.week', _lang, {
                                    'week': value,
                                  }),
                                ),
                              ),
                            )
                            .toList(),
                    onChanged: (value) => setState(() => _selectedWeek = value),
                  ),
                  if (info != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _catalog.contentText(info['title'], _lang),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _catalog.contentText(info['body'], _lang),
                      style: const TextStyle(height: 1.55),
                    ),
                    if (info['sourceIds'] is List)
                      _sources(
                        (info['sourceIds'] as List)
                            .whereType<String>()
                            .toList(),
                      ),
                  ] else
                    Text(_catalog.t('pregnancy.outOfRange', _lang)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _appointmentCard(),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => widget.onNavigate('reminders'),
              child: Text(_catalog.t('pregnancy.appointmentList', _lang)),
            ),
            TextButton(
              onPressed: _turnOff,
              child: Text(
                _catalog.t('pregnancy.turnOff', _lang),
                style: const TextStyle(color: Color(0xFF9D3D47)),
              ),
            ),
          ],
          const SizedBox(height: 12),
          _dangerCard(),
        ],
      ),
    );
  }

  Widget _pregnancyHero(int week) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [BloomTheme.heroStart, BloomTheme.heroEnd],
      ),
      borderRadius: BorderRadius.circular(22),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _catalog.t('pregnancy.title', _lang).toUpperCase(),
          style: const TextStyle(
            color: Color(0xFFE9DCEE),
            fontSize: 11,
            letterSpacing: 1,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _catalog.t('pregnancy.week', _lang, {'week': week}),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          _catalog.t('pregnancy.pause', _lang),
          style: const TextStyle(color: Colors.white, height: 1.5),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            const Icon(Icons.event_rounded, color: Color(0xFFF0C9BD)),
            const SizedBox(width: 9),
            Expanded(
              child: Text(
                '${_catalog.t('pregnancy.due', _lang)} · ${formatBloomDate(addDays(_lastDate, BloomConfig.pregnancyLengthDays), _lang, withYear: true)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          _catalog.t('pregnancy.dueNote', _lang),
          style: const TextStyle(color: Color(0xFFF6EFF8), height: 1.45),
        ),
        _sources(['dueDate']),
      ],
    ),
  );

  Widget _setup() => BloomCard(
    title: _catalog.t('pregnancy.enable', _lang),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _catalog.t('pregnancy.intro', _lang),
          style: const TextStyle(height: 1.5),
        ),
        const SizedBox(height: 10),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          value: _confirmed,
          onChanged: (value) => setState(() {
            _confirmed = value == true;
            _error = null;
          }),
          title: Text(_catalog.t('pregnancy.confirm', _lang)),
        ),
        OutlinedButton.icon(
          onPressed: _pickLastPeriod,
          icon: const Icon(Icons.calendar_month_outlined),
          label: Text(
            _lastDate.isEmpty
                ? _catalog.t('pregnancy.last', _lang)
                : '${_catalog.t('pregnancy.last', _lang)} · $_lastDate',
          ),
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
        FilledButton(
          onPressed: _confirmed && _lastDate.isNotEmpty ? _enable : null,
          child: Text(_catalog.t('pregnancy.enable', _lang)),
        ),
      ],
    ),
  );

  Widget _appointmentCard() {
    final existing = widget.diary.reminders
        .where((r) => r['id'] == 'pregnancy-checkup')
        .firstOrNull;
    return _AppointmentCard(
      diary: widget.diary,
      catalog: _catalog,
      existing: existing,
    );
  }

  Widget _dangerCard() {
    final signs = _catalog
        .list('pregnancyDangerSigns')
        .whereType<Map>()
        .toList();
    return BloomCard(
      title: _catalog.t('pregnancy.danger', _lang),
      color: const Color(0xFFFFF6F2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _catalog.contentText(_catalog.get('pregnancyHelp'), _lang),
            style: const TextStyle(height: 1.55),
          ),
          const SizedBox(height: 8),
          ...signs.map(
            (sign) => Padding(
              padding: const EdgeInsets.only(bottom: 7),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.circle, size: 7, color: BloomTheme.coral),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      _catalog.contentText(sign['text'], _lang),
                      style: const TextStyle(height: 1.45),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              FilledButton.icon(
                onPressed: () => launchUrl(Uri.parse('tel:112')),
                icon: const Icon(Icons.call_rounded),
                label: Text(_catalog.t('doctor.call112', _lang)),
              ),
              OutlinedButton.icon(
                onPressed: () => launchUrl(Uri.parse('tel:108')),
                icon: const Icon(Icons.call_outlined),
                label: Text(_catalog.t('doctor.call108', _lang)),
              ),
            ],
          ),
          _sources([
            'emergency',
            ...signs.expand(
              (s) => (s['sourceIds'] as List? ?? const []).whereType<String>(),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _sources(List<String> ids) {
    final sources = _catalog.section('sources');
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Wrap(
        spacing: 5,
        children: ids.toSet().map((id) {
          final raw = sources[id];
          final source = raw is Map ? raw : const {};
          final title = _catalog.contentText(
            source['shortTitle'] ?? source['title'] ?? id,
            _lang,
          );
          final url = source['url']?.toString();
          return ActionChip(
            label: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
            onPressed: url == null ? null : () => launchUrl(Uri.parse(url)),
          );
        }).toList(),
      ),
    );
  }

  Future<void> _pickLastPeriod() async {
    final now = DateTime.now();
    final last = DateTime.tryParse(_lastDate) ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: last.isAfter(now) ? now : last,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year, now.month, now.day),
    );
    if (picked != null)
      setState(() {
        _lastDate = dateKey(picked);
        _error = null;
      });
  }

  Future<void> _enable() async {
    final age = _lastDate.isEmpty ? -1 : daysBetween(_lastDate, todayIso());
    if (!_confirmed ||
        age < 0 ||
        age > BloomConfig.maximumPregnancyWeek * BloomConfig.daysPerWeek) {
      setState(() => _error = 'pregnancy.invalid');
      return;
    }
    await widget.diary.updateProfile({
      'pregnancyEnabled': true,
      'pregnancyConfirmed': true,
      'lastPeriodDate': _lastDate,
      'pregnancyFeatureEnabled': true,
    });
    if (mounted) setState(() {});
  }

  Future<void> _turnOff() async {
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_catalog.t('pregnancy.turnOff', _lang)),
        content: Text(_catalog.t('pregnancy.offConfirm', _lang)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(_catalog.t('common.cancel', _lang)),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(_catalog.t('pregnancy.turnOff', _lang)),
          ),
        ],
      ),
    );
    if (accepted != true) return;
    await widget.diary.updateProfile({
      'pregnancyEnabled': false,
      'pregnancyConfirmed': false,
    });
    final reminders = widget.diary.reminders
        .map(
          (r) => r['type'] == 'checkup'
              ? <String, dynamic>{...r, 'enabled': false}
              : r,
        )
        .toList();
    await widget.diary.saveReminders(reminders);
    if (mounted) setState(() {});
  }
}

class _AppointmentCard extends StatefulWidget {
  const _AppointmentCard({
    required this.diary,
    required this.catalog,
    this.existing,
  });
  final DiaryRepository diary;
  final BloomCatalog catalog;
  final Map<String, dynamic>? existing;
  @override
  State<_AppointmentCard> createState() => _AppointmentCardState();
}

class _AppointmentCardState extends State<_AppointmentCard> {
  late String _date;
  late String _time;
  late bool _enabled;
  bool _saved = false;
  @override
  void initState() {
    super.initState();
    _date = widget.existing?['date'] as String? ?? '';
    _time = widget.existing?['time'] as String? ?? '09:00';
    _enabled = widget.existing?['enabled'] == true;
  }

  @override
  Widget build(BuildContext context) {
    final lang = widget.diary.language;
    return BloomCard(
      title: widget.catalog.t('pregnancy.appointmentTitle', lang),
      subtitle: widget.catalog.t('pregnancy.appointmentNote', lang),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          OutlinedButton.icon(
            onPressed: _pickDate,
            icon: const Icon(Icons.event_outlined),
            label: Text(
              _date.isEmpty
                  ? widget.catalog.t('pregnancy.appointmentDate', lang)
                  : _date,
            ),
          ),
          OutlinedButton.icon(
            onPressed: _pickTime,
            icon: const Icon(Icons.schedule_rounded),
            label: Text(
              '${widget.catalog.t('pregnancy.appointmentTime', lang)} · $_time',
            ),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _enabled,
            onChanged: (value) => setState(() {
              _enabled = value;
              _saved = false;
            }),
            title: Text(widget.catalog.t('pregnancy.appointmentEnable', lang)),
          ),
          FilledButton(
            onPressed: _date.isEmpty ? null : _save,
            child: Text(widget.catalog.t('pregnancy.appointmentSave', lang)),
          ),
          if (_saved)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(widget.catalog.t('pregnancy.appointmentSaved', lang)),
            ),
        ],
      ),
    );
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final current = DateTime.tryParse(_date) ?? now;
    final chosen = await showDatePicker(
      context: context,
      initialDate: current.isBefore(now) ? now : current,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: DateTime(now.year + 5),
    );
    if (chosen != null)
      setState(() {
        _date = dateKey(chosen);
        _saved = false;
      });
  }

  Future<void> _pickTime() async {
    final p = _time.split(':').map(int.parse).toList();
    final chosen = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: p[0], minute: p[1]),
    );
    if (chosen != null)
      setState(() {
        _time =
            '${chosen.hour.toString().padLeft(2, '0')}:${chosen.minute.toString().padLeft(2, '0')}';
        _saved = false;
      });
  }

  Future<void> _save() async {
    final all = widget.diary.reminders
        .where((r) => r['id'] != 'pregnancy-checkup')
        .toList();
    all.add({
      'id': 'pregnancy-checkup',
      'type': 'checkup',
      'date': _date,
      'time': _time,
      'title': '',
      'enabled': _enabled,
    });
    await widget.diary.saveReminders(all);
    if (mounted) setState(() => _saved = true);
  }
}

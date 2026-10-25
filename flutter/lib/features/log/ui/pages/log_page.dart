import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/bloom_config.dart';
import '../../../../common/custom_theme.dart';
import '../../../../common/feature_scaffold.dart';
import '../../models/day_log.dart';
import '../../services/diary_repository.dart';

class LogPage extends StatefulWidget {
  const LogPage({
    super.key,
    required this.date,
    required this.diary,
    required this.onSaved,
    required this.onDateChanged,
    required this.onNavigate,
    this.initialSymptom,
  });
  final DateTime date;
  final DiaryRepository diary;
  final VoidCallback onSaved;
  final ValueChanged<DateTime> onDateChanged;
  final ValueChanged<String> onNavigate;
  final String? initialSymptom;
  @override
  State<LogPage> createState() => _LogPageState();
}

class _LogPageState extends State<LogPage> {
  final _catalog = BloomCatalog.instance;
  late DayLog _draft;
  late TextEditingController _medicine;
  late TextEditingController _note;
  bool _saving = false;
  bool _saved = false;
  String? _error;
  String get _lang => widget.diary.language;
  DateTime get _today => DateUtils.dateOnly(DateTime.now());

  @override
  void initState() {
    super.initState();
    _draft =
        widget.diary.forDate(widget.date) ??
        DayLog(date: DateUtils.dateOnly(widget.date));
    _draft = _draft.copyWith(mood: _normalizeMood(_draft.mood));
    final symptom = widget.initialSymptom;
    if (symptom != null && !_draft.symptoms.contains(symptom)) {
      _draft = _draft.copyWith(symptoms: [..._draft.symptoms, symptom]);
    }
    _medicine = TextEditingController(text: _draft.medicines);
    _note = TextEditingController(text: _draft.note);
  }

  @override
  void dispose() {
    _medicine.dispose();
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final allSymptoms = _catalog
        .list('symptoms')
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
    final configured = widget.diary.settings['trackedSymptoms'];
    final trackedIds = configured is List
        ? configured.whereType<String>().toSet()
        : allSymptoms.map((item) => item['id']).whereType<String>().toSet();
    const pregnancyOnly = {
      'swellingFaceHands',
      'fluidLeaking',
      'reducedMovement',
    };
    final symptoms = allSymptoms.where((item) {
      final id = item['id'] as String? ?? '';
      return trackedIds.contains(id) &&
          (widget.diary.profile['pregnancyEnabled'] == true ||
              !pregnancyOnly.contains(id));
    }).toList();
    final selectedSymptoms = symptoms
        .where((item) => _draft.symptoms.contains(item['id']))
        .toList();
    final fullDate = MaterialLocalizations.of(context)
        .formatFullDate(DateUtils.dateOnly(widget.date));

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
      children: [
        Text(
          _catalog.t('tracking.dailyCheckIn', _lang).toUpperCase(),
          style: Theme.of(context).textTheme.labelLarge
              ?.copyWith(color: BloomTheme.plum, letterSpacing: 1.1),
        ),
        const SizedBox(height: 6),
        Text(
          _catalog.t('tracking.logDay', _lang),
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 6),
        Text(
          _catalog.t('tracking.logDescription', _lang),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        if (DateUtils.dateOnly(widget.date).isAfter(_today)) ...[
          const SizedBox(height: 12),
          BloomInfoBanner(
            text: _catalog.t('tracking.futureDate', _lang),
            icon: Icons.info_outline_rounded,
          ),
        ],
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('tracking.date', _lang),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  fullDate,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              IconButton(
                tooltip: _catalog.t('tracking.date', _lang),
                onPressed: _pickDate,
                icon: const Icon(
                  Icons.calendar_month_outlined,
                  color: BloomTheme.plum,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('tracking.period', _lang),
          subtitle: _catalog.t('tracking.periodQuestion', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _choice(
                    'tracking.periodOn',
                    _draft.period,
                    Icons.water_drop_outlined,
                    () => _setPeriod(true),
                  ),
                  _choice(
                    'tracking.periodOff',
                    !_draft.period,
                    Icons.wb_sunny_outlined,
                    () => _setPeriod(false),
                  ),
                ],
              ),
              if (_draft.period) ...[
                const SizedBox(height: 13),
                Text(
                  _catalog.t('tracking.flow', _lang),
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: ['spotting', 'light', 'medium', 'heavy']
                      .map(
                        (flow) => ChoiceChip(
                          label: Text(_catalog.t('tracking.flow.$flow', _lang)),
                          selected: _draft.flow == flow,
                          onSelected: (_) => _setFlow(flow),
                        ),
                      )
                      .toList(),
                ),
                if (_draft.flow == 'heavy') ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(13),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF6F2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _catalog.t('tracking.heavyQuestions', _lang),
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 4),
                        _checkField(
                          'tracking.padFrequent',
                          _draft.padFrequent,
                          (value) =>
                              _update(_draft.copyWith(padFrequent: value)),
                        ),
                        _checkField(
                          'tracking.largeClots',
                          _draft.largeClots,
                          (value) =>
                              _update(_draft.copyWith(largeClots: value)),
                        ),
                        Text(
                          _catalog.t('tracking.heavyHelp', _lang),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('tracking.pain', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _catalog.t('tracking.painScale', _lang),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  Text(
                    '${_draft.pain.round()}/${BloomConfig.painScaleMaximum}',
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(color: BloomTheme.plumDark),
                  ),
                ],
              ),
              Slider(
                value: _draft.pain.clamp(
                  0,
                  BloomConfig.painScaleMaximum.toDouble(),
                ),
                min: 0,
                max: BloomConfig.painScaleMaximum.toDouble(),
                divisions: BloomConfig.painScaleMaximum,
                label: '${_draft.pain.round()}',
                onChanged: (value) => _update(_draft.copyWith(pain: value)),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _catalog.t('tracking.noPain', _lang),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text(
                    _catalog.t('tracking.worstPain', _lang),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 5),
              _checkField(
                'tracking.painDisrupts',
                _draft.painDisrupts,
                (value) => _update(_draft.copyWith(painDisrupts: value)),
              ),
              _checkField(
                'tracking.painUnrelieved',
                _draft.painUnrelieved,
                (value) => _update(_draft.copyWith(painUnrelieved: value)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('tracking.symptoms', _lang),
          subtitle: _catalog.t('tracking.symptomsDescription', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => widget.onNavigate('settings'),
                  child: Text(_catalog.t('tracking.customise', _lang)),
                ),
              ),
              Wrap(
                spacing: 7,
                runSpacing: 7,
                children: symptoms.map((item) {
                  final id = item['id'] as String;
                  final selected = _draft.symptoms.contains(id);
                  return FilterChip(
                    avatar: Icon(
                      _symptomIcon(item['icon'] as String?),
                      size: 17,
                      color: selected ? BloomTheme.plumDark : BloomTheme.muted,
                    ),
                    label: Text(_catalog.t('tracking.symptom.$id', _lang)),
                    selected: selected,
                    onSelected: (_) => _toggleSymptom(id),
                  );
                }).toList(),
              ),
              if (selectedSymptoms.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  _catalog.t('tracking.intensityOptional', _lang),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 8),
                ...selectedSymptoms.map((item) {
                  final id = item['id'] as String;
                  final selected = _draft.symptomIntensity[id];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 9),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _catalog.t('tracking.intensityFor', _lang, {
                            'symptom': _catalog.t(
                              'tracking.symptom.$id',
                              _lang,
                            ),
                          }),
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 5),
                        Wrap(
                          spacing: 6,
                          children: [
                            for (final entry in const [
                              (1, 'mild'),
                              (2, 'moderate'),
                              (3, 'strong'),
                            ])
                              ChoiceChip(
                                label: Text(
                                  _catalog.t(
                                    'tracking.intensity.${entry.$2}',
                                    _lang,
                                  ),
                                ),
                                selected: selected == entry.$1,
                                onSelected: (_) => _setIntensity(id, entry.$1),
                              ),
                            if (selected != null)
                              ActionChip(
                                label: Text(
                                  _catalog.t('tracking.clearIntensity', _lang),
                                ),
                                onPressed: () => _setIntensity(id, null),
                              ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('tracking.mood', _lang),
          subtitle: _catalog.t('tracking.moodQuestion', _lang),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 6,
                runSpacing: 7,
                children: ['veryLow', 'low', 'okay', 'good', 'great']
                    .map(
                      (mood) => ChoiceChip(
                        avatar: Icon(_moodIcon(mood), size: 18),
                        label: Text(_catalog.t('tracking.mood.$mood', _lang)),
                        selected: _draft.mood == mood,
                        onSelected: (_) => _update(_draft.copyWith(mood: mood)),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 12),
              Text(
                _catalog.t('tracking.energy', _lang),
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 7),
              Wrap(
                spacing: 7,
                children: ['low', 'okay', 'high']
                    .map(
                      (energy) => ChoiceChip(
                        label: Text(
                          _catalog.t('tracking.energy.$energy', _lang),
                        ),
                        selected: _draft.energy == energy,
                        onSelected: (_) =>
                            _update(_draft.copyWith(energy: energy)),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _catalog.t('tracking.sleep', _lang),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ),
                  Text(
                    '${_draft.sleep.toStringAsFixed(_draft.sleep == _draft.sleep.roundToDouble() ? 0 : 1)} h',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
              Slider(
                value: _draft.sleep.clamp(
                  0,
                  BloomConfig.maximumSleepHours.toDouble(),
                ),
                min: 0,
                max: BloomConfig.maximumSleepHours.toDouble(),
                divisions:
                    (BloomConfig.maximumSleepHours / BloomConfig.sleepInputStep)
                        .round(),
                onChanged: (value) => _update(_draft.copyWith(sleep: value)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          title: _catalog.t('tracking.moreDetails', _lang),
          subtitle: _catalog.t('tracking.detailsOptional', _lang),
          child: Column(
            children: [
              _checkField(
                'tracking.betweenBleeding',
                _draft.betweenBleeding,
                (value) => _update(_draft.copyWith(betweenBleeding: value)),
              ),
              _checkField(
                'tracking.afterSexBleeding',
                _draft.afterSexBleeding,
                (value) => _update(_draft.copyWith(afterSexBleeding: value)),
              ),
              _checkField(
                'tracking.pregnancyPossible',
                _draft.pregnancyPossible,
                (value) => _update(_draft.copyWith(pregnancyPossible: value)),
              ),
              _checkField(
                'tracking.urgentPain',
                _draft.urgentPain,
                (value) => _update(_draft.copyWith(urgentPain: value)),
              ),
              _checkField(
                'tracking.fainting',
                _draft.fainting,
                (value) => _update(_draft.copyWith(fainting: value)),
              ),
              if (_hasUrgentSigns) ...[
                const SizedBox(height: 8),
                BloomInfoBanner(
                  text:
                      '${_catalog.t('tracking.getHelpNow', _lang)}\n${_catalog.t('tracking.urgentNumbers', _lang)}',
                  icon: Icons.health_and_safety_outlined,
                  color: const Color(0xFFFFE8E5),
                ),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () => widget.onNavigate('guidance'),
                    icon: const Icon(Icons.arrow_forward_rounded),
                    label: Text(_catalog.t('tracking.viewGuidance', _lang)),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        BloomCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _medicine,
                maxLength: 300,
                decoration: InputDecoration(
                  labelText: _catalog.t('tracking.medicines', _lang),
                  hintText: _catalog.t('tracking.medicinesPlaceholder', _lang),
                  counterText: '',
                ),
                onChanged: (_) => _markChanged(),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _note,
                maxLength: 1000,
                minLines: 3,
                maxLines: 5,
                decoration: InputDecoration(
                  labelText: _catalog.t('tracking.privateNote', _lang),
                  hintText: _catalog.t('tracking.notePlaceholder', _lang),
                  alignLabelWithHint: true,
                  counterText: '',
                ),
                onChanged: (_) => _markChanged(),
              ),
              const SizedBox(height: 6),
              BloomInfoBanner(
                text: _catalog.t('privacyData.storageBody', _lang),
                icon: Icons.lock_outline_rounded,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              _catalog.t(_error!, _lang),
              style: const TextStyle(color: Color(0xFF9D3D47)),
            ),
          ),
        if (_saved)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              _catalog.t('tracking.saved', _lang),
              style: const TextStyle(
                color: BloomTheme.plumDark,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        FilledButton.icon(
          onPressed: _saving ? null : _save,
          icon: _saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.check_rounded),
          label: Text(
            _catalog.t(_saving ? 'tracking.saving' : 'tracking.saveLog', _lang),
          ),
          style: FilledButton.styleFrom(
            minimumSize: const Size.fromHeight(52),
            backgroundColor: BloomTheme.plumDark,
          ),
        ),
      ],
    );
  }

  bool get _hasUrgentSigns {
    final pregnancy = widget.diary.profile['pregnancyEnabled'] == true;
    final dizzinessWithHeavyFlow =
        (_draft.fainting || _draft.symptoms.contains('dizziness')) &&
        _draft.period &&
        _draft.flow == 'heavy';
    final pregnancyBleedingOrPain =
        (_draft.pregnancyPossible || pregnancy) &&
        (_draft.period ||
            _draft.betweenBleeding ||
            _draft.afterSexBleeding ||
            _draft.pain >= BloomConfig.severePainMinimum);
    return _draft.urgentPain ||
        (_draft.pain >= BloomConfig.severePainMinimum &&
            _draft.painUnrelieved) ||
        dizzinessWithHeavyFlow ||
        pregnancyBleedingOrPain;
  }

  Widget _checkField(String key, bool value, ValueChanged<bool> onChanged) =>
      CheckboxListTile(
        contentPadding: EdgeInsets.zero,
        controlAffinity: ListTileControlAffinity.leading,
        dense: true,
        value: value,
        onChanged: (next) => onChanged(next == true),
        title: Text(_catalog.t(key, _lang)),
      );

  Widget _choice(String key, bool active, IconData icon, VoidCallback onTap) =>
      ChoiceChip(
        avatar: Icon(
          icon,
          size: 17,
          color: active ? BloomTheme.plumDark : BloomTheme.muted,
        ),
        label: Text(_catalog.t(key, _lang)),
        selected: active,
        onSelected: (_) => onTap(),
      );

  void _update(DayLog next) {
    setState(() {
      _draft = next;
      _saved = false;
      _error = null;
    });
  }

  void _markChanged() {
    setState(() {
      _saved = false;
      _error = null;
    });
  }

  void _setPeriod(bool value) {
    _update(
      _draft.copyWith(
        period: value,
        padFrequent: value ? _draft.padFrequent : false,
        largeClots: value ? _draft.largeClots : false,
      ),
    );
  }

  void _setFlow(String value) {
    _update(
      _draft.copyWith(
        flow: value,
        padFrequent: value == 'heavy' ? _draft.padFrequent : false,
        largeClots: value == 'heavy' ? _draft.largeClots : false,
      ),
    );
  }

  void _toggleSymptom(String id) {
    final selected = _draft.symptoms.toSet();
    final intensities = Map<String, int>.from(_draft.symptomIntensity);
    if (!selected.add(id)) {
      selected.remove(id);
      intensities.remove(id);
    }
    _update(
      _draft.copyWith(
        symptoms: selected.toList(),
        symptomIntensity: intensities,
      ),
    );
  }

  void _setIntensity(String id, int? value) {
    final intensities = Map<String, int>.from(_draft.symptomIntensity);
    if (value == null) {
      intensities.remove(id);
    } else {
      intensities[id] = value;
    }
    _update(_draft.copyWith(symptomIntensity: intensities));
  }

  Future<void> _pickDate() async {
    final initial = DateUtils.dateOnly(widget.date).isAfter(_today)
        ? _today
        : DateUtils.dateOnly(widget.date);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(_today.year - 100),
      lastDate: _today,
    );
    if (picked != null) widget.onDateChanged(DateUtils.dateOnly(picked));
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    final clean = _draft.copyWith(
      date: DateUtils.dateOnly(widget.date),
      flow: _draft.period ? _draft.flow : 'medium',
      padFrequent:
          _draft.period && _draft.flow == 'heavy' && _draft.padFrequent,
      largeClots: _draft.period && _draft.flow == 'heavy' && _draft.largeClots,
      medicines: _medicine.text.trim(),
      note: _note.text.trim(),
    );
    final saved = await widget.diary.save(clean);
    if (!mounted) return;
    setState(() {
      _saving = false;
      _saved = saved;
      _error = saved ? null : 'tracking.saveError';
    });
    if (saved) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_catalog.t('tracking.saved', _lang))),
      );
      widget.onSaved();
    }
  }

  String _normalizeMood(String mood) => switch (mood.toLowerCase()) {
    'very low' || 'verylow' => 'veryLow',
    'great' => 'great',
    'good' => 'good',
    'low' => 'low',
    _ => 'okay',
  };

  IconData _moodIcon(String value) => switch (value) {
    'veryLow' => Icons.sentiment_very_dissatisfied_outlined,
    'low' => Icons.sentiment_dissatisfied_outlined,
    'good' => Icons.sentiment_satisfied_outlined,
    'great' => Icons.sentiment_very_satisfied_outlined,
    _ => Icons.sentiment_neutral_outlined,
  };

  IconData _symptomIcon(String? value) => switch (value) {
    'pain' || 'cramp' => Icons.bolt_outlined,
    'head' || 'headache' => Icons.psychology_alt_outlined,
    'tired' || 'sleep' => Icons.bedtime_outlined,
    'mood' => Icons.mood_outlined,
    'water' => Icons.water_drop_outlined,
    'skin' => Icons.face_retouching_natural_outlined,
    'heart' => Icons.favorite_border_rounded,
    _ => Icons.spa_outlined,
  };
}

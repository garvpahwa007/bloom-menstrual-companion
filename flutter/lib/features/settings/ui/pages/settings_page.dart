import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../log/services/diary_repository.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({
    super.key,
    required this.diary,
    required this.onNavigate,
  });
  final DiaryRepository diary;
  final ValueChanged<String> onNavigate;
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _catalog = BloomCatalog.instance;
  final _pin = TextEditingController();
  final _repeat = TextEditingController();
  bool _showPin = false;
  String? _error;
  String get _lang => widget.diary.language;
  @override
  void dispose() {
    _pin.dispose();
    _repeat.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = widget.diary.settings;
    final profile = widget.diary.profile;
    final symptoms = _catalog.list('symptoms').whereType<Map>().toList();
    final selected = (settings['trackedSymptoms'] as List? ?? const [])
        .whereType<String>()
        .toSet();
    return FeatureScaffold(
      title: _catalog.t('nav.settings', _lang),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BloomCard(
            title: _catalog.t('settings.access', _lang),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: settings['language'] as String? ?? 'en',
                  decoration: InputDecoration(
                    labelText: _catalog.t('settings.language', _lang),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'en', child: Text('English')),
                    DropdownMenuItem(value: 'hi', child: Text('हिन्दी')),
                    DropdownMenuItem(value: 'ta', child: Text('தமிழ்')),
                  ],
                  onChanged: (v) {
                    if (v != null) _setSetting('language', v);
                  },
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: settings['textSize'] as String? ?? 'normal',
                  decoration: InputDecoration(
                    labelText: _catalog.t('settings.text', _lang),
                  ),
                  items: ['normal', 'large', 'largest']
                      .map(
                        (v) => DropdownMenuItem(
                          value: v,
                          child: Text(_catalog.t('settings.$v', _lang)),
                        ),
                      )
                      .toList(),
                  onChanged: (v) {
                    if (v != null) _setSetting('textSize', v);
                  },
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings['highContrast'] == true,
                  onChanged: (v) => _setSetting('highContrast', v),
                  title: Text(_catalog.t('settings.contrast', _lang)),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings['readAloud'] == true,
                  onChanged: (v) => _setSetting('readAloud', v),
                  title: Text(_catalog.t('settings.readAloud', _lang)),
                ),
                Text(
                  _catalog.t('learn.noVoice', _lang),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          BloomCard(
            title: _catalog.t('settings.profile', _lang),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: profile['ageGroup'] as String? ?? 'under18',
                  decoration: InputDecoration(
                    labelText: _catalog.t('settings.age', _lang),
                  ),
                  items: ['under18', 'adult']
                      .map(
                        (v) => DropdownMenuItem(
                          value: v,
                          child: Text(_catalog.t('welcome.$v', _lang)),
                        ),
                      )
                      .toList(),
                  onChanged: (v) {
                    if (v != null) _setProfile('ageGroup', v);
                  },
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: profile['fertilityEnabled'] == true,
                  onChanged: (v) => _setProfile('fertilityEnabled', v),
                  title: Text(_catalog.t('settings.fertility', _lang)),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value:
                      profile['pregnancyFeatureEnabled'] == true ||
                      profile['pregnancyEnabled'] == true,
                  onChanged: (v) => _setProfile('pregnancyFeatureEnabled', v),
                  title: Text(_catalog.t('settings.pregnancy', _lang)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          BloomCard(
            title: _catalog.t('settings.symptoms', _lang),
            subtitle: _catalog.t('settings.symptomsNote', _lang),
            child: Wrap(
              spacing: 7,
              runSpacing: 5,
              children: symptoms.map((raw) {
                final id = raw['id'] as String;
                return FilterChip(
                  label: Text(_catalog.t('tracking.symptom.$id', _lang)),
                  selected: selected.contains(id),
                  onSelected: (value) {
                    final next = selected.toSet();
                    value ? next.add(id) : next.remove(id);
                    _setSetting('trackedSymptoms', next.toList());
                  },
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),
          BloomCard(
            title: _catalog.t('settings.privacy', _lang),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings['discreet'] == true,
                  onChanged: (v) => _setSetting('discreet', v),
                  title: Text(_catalog.t('settings.discreet', _lang)),
                  subtitle: Text(_catalog.t('settings.discreetNote', _lang)),
                ),
                const Divider(),
                Text(
                  _catalog.t('settings.pin', _lang),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  _catalog.t('settings.pinNote', _lang),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (widget.diary.isPinEnabled) ...[
                  const SizedBox(height: 10),
                  FilledButton.icon(
                    onPressed: widget.diary.lock,
                    icon: const Icon(Icons.lock_outline_rounded),
                    label: Text(_catalog.t('header.lock', _lang)),
                  ),
                  TextButton(
                    onPressed: _disablePin,
                    child: Text(_catalog.t('settings.disablePin', _lang)),
                  ),
                ] else if (!_showPin)
                  TextButton.icon(
                    onPressed: () => setState(() => _showPin = true),
                    icon: const Icon(Icons.lock_outline_rounded),
                    label: Text(_catalog.t('settings.enablePin', _lang)),
                  )
                else ...[
                  TextField(
                    controller: _pin,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    decoration: InputDecoration(
                      labelText: _catalog.t('settings.enterPin', _lang),
                      counterText: '',
                    ),
                  ),
                  TextField(
                    controller: _repeat,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    decoration: InputDecoration(
                      labelText: _catalog.t('settings.confirmPin', _lang),
                      counterText: '',
                    ),
                  ),
                  if (_error != null)
                    Text(
                      _catalog.t(_error!, _lang),
                      style: const TextStyle(color: Color(0xFF9D3D47)),
                    ),
                  Wrap(
                    spacing: 8,
                    children: [
                      FilledButton(
                        onPressed: _enablePin,
                        child: Text(_catalog.t('settings.enablePin', _lang)),
                      ),
                      TextButton(
                        onPressed: () => setState(() {
                          _showPin = false;
                          _pin.clear();
                          _repeat.clear();
                        }),
                        child: Text(_catalog.t('common.cancel', _lang)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
          BloomCard(
            title: _catalog.t('privacyData.title', _lang),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_catalog.t('privacyData.settingsIntro', _lang)),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () => widget.onNavigate('privacy'),
                  icon: const Icon(Icons.shield_outlined),
                  label: Text(_catalog.t('privacyData.open', _lang)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          BloomCard(
            title: _catalog.t('settings.about', _lang),
            child: Text(
              _catalog.t('settings.aboutBody', _lang),
              style: const TextStyle(height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _setSetting(String key, Object value) async {
    await widget.diary.updateSettings({key: value});
    if (mounted) setState(() {});
  }

  Future<void> _setProfile(String key, Object value) async {
    await widget.diary.updateProfile({key: value});
    if (mounted) setState(() {});
  }

  Future<void> _enablePin() async {
    if (_pin.text != _repeat.text) {
      setState(() => _error = 'settings.pinMismatch');
      return;
    }
    final result = await widget.diary.enablePin(_pin.text);
    if (!mounted) return;
    setState(() {
      _error = result ? null : 'common.error';
      if (result) {
        _showPin = false;
        _pin.clear();
        _repeat.clear();
      }
    });
  }

  Future<void> _disablePin() async {
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_catalog.t('settings.disablePin', _lang)),
        content: Text(_catalog.t('settings.pinWarning', _lang)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(_catalog.t('common.cancel', _lang)),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(_catalog.t('settings.disablePin', _lang)),
          ),
        ],
      ),
    );
    if (accepted == true) await widget.diary.disablePin();
  }
}

import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../../log/services/diary_repository.dart';

class WelcomePage extends StatefulWidget {
  const WelcomePage({super.key, required this.diary});
  final DiaryRepository diary;

  @override
  State<WelcomePage> createState() => _WelcomePageState();
}

class _WelcomePageState extends State<WelcomePage> {
  String _language = 'en';
  String _age = 'under18';
  bool _busy = false;
  final _catalog = BloomCatalog.instance;

  String _t(String key) => _catalog.t(key, _language);

  @override
  Widget build(BuildContext context) => Scaffold(
    body: DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFAF8FB), Color(0xFFF2EAF4), Color(0xFFFFF7F2)],
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 12, 22, 26),
          children: [
            Row(
              children: [
                Image.asset(
                  'assets/images/bloom-mark.png',
                  width: 36,
                  height: 36,
                ),
                const SizedBox(width: 9),
                Text(
                  _t('app.name'),
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                PopupMenuButton<String>(
                  initialValue: _language,
                  tooltip: _t('settings.language'),
                  onSelected: (value) => setState(() => _language = value),
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'en', child: Text('English')),
                    PopupMenuItem(value: 'hi', child: Text('हिन्दी')),
                    PopupMenuItem(value: 'ta', child: Text('தமிழ்')),
                  ],
                  child: Chip(
                    label: Text(_language.toUpperCase()),
                    avatar: const Icon(Icons.language_rounded, size: 18),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 26),
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                gradient: const LinearGradient(
                  colors: [BloomTheme.heroStart, BloomTheme.heroEnd],
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x22755486),
                    blurRadius: 24,
                    offset: Offset(0, 12),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.spa_rounded,
                    size: 34,
                    color: Color(0xFFF0C9BD),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    _t('welcome.kicker').toUpperCase(),
                    style: const TextStyle(
                      color: Color(0xFFEBD9EE),
                      letterSpacing: 1.1,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _t('welcome.title'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      height: 1.15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 11),
                  Text(
                    _t('welcome.body'),
                    style: const TextStyle(
                      color: Color(0xFFF7EEF9),
                      fontSize: 14,
                      height: 1.55,
                    ),
                  ),
                  const SizedBox(height: 19),
                  Row(
                    children: [
                      const Icon(
                        Icons.lock_outline_rounded,
                        size: 17,
                        color: Color(0xFFF0C9BD),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _t('welcome.note'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            _sectionLabel(context, _t('welcome.age')),
            const SizedBox(height: 9),
            Row(
              children: [
                Expanded(
                  child: _AgeChoice(
                    label: _t('welcome.under18'),
                    selected: _age == 'under18',
                    onTap: () => setState(() => _age = 'under18'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _AgeChoice(
                    label: _t('welcome.adult'),
                    selected: _age == 'adult',
                    onTap: () => setState(() => _age = 'adult'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _busy ? null : () => _start(true),
              icon: _busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome_rounded),
              label: Text(_t('welcome.demo')),
              style: FilledButton.styleFrom(
                backgroundColor: BloomTheme.plumDark,
                minimumSize: const Size.fromHeight(51),
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: _busy ? null : () => _start(false),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: Text(_t('welcome.fresh')),
            ),
            const SizedBox(height: 10),
            Text(
              _t('welcome.demoNote'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(color: BloomTheme.muted),
            ),
            const SizedBox(height: 13),
            Center(
              child: Text(
                _t('footer.note'),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall
                    ?.copyWith(color: BloomTheme.muted),
              ),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _sectionLabel(BuildContext context, String text) =>
      Text(text, style: Theme.of(context).textTheme.titleMedium);

  Future<void> _start(bool demo) async {
    setState(() => _busy = true);
    final saved = await widget.diary.start(
      demo: demo,
      ageGroup: _age,
      language: _language,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (!saved)
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(_t('common.error'))));
  }
}

class _AgeChoice extends StatelessWidget {
  const _AgeChoice({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    borderRadius: BorderRadius.circular(15),
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 17),
      decoration: BoxDecoration(
        color: selected ? BloomTheme.lilac : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: selected ? BloomTheme.plum : BloomTheme.line,
          width: selected ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            selected ? Icons.check_circle_rounded : Icons.circle_outlined,
            color: selected ? BloomTheme.plum : BloomTheme.muted,
            size: 19,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: BloomTheme.ink,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

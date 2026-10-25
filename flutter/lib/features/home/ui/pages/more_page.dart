import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/custom_theme.dart';
import '../../../log/services/diary_repository.dart';

class MorePage extends StatelessWidget {
  const MorePage({super.key, required this.diary, required this.onNavigate});
  final DiaryRepository diary;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    final lang = diary.language;
    final catalog = BloomCatalog.instance;
    final items = <(String, String, IconData)>[
      ('doctor', 'nav.doctor', Icons.favorite_outline_rounded),
      ('visit', 'visit.title', Icons.medical_information_outlined),
      ('learn', 'nav.learn', Icons.menu_book_outlined),
      ('ask', 'nav.ask', Icons.forum_outlined),
      ('reminders', 'nav.reminders', Icons.notifications_none_rounded),
      if (diary.profile['ageGroup'] == 'adult' ||
          diary.profile['pregnancyFeatureEnabled'] == true ||
          diary.profile['pregnancyEnabled'] == true)
        ('pregnancy', 'nav.pregnancy', Icons.child_friendly_outlined),
      ('settings', 'nav.settings', Icons.tune_rounded),
      ('privacy', 'nav.privacyData', Icons.shield_outlined),
      ('cloud', 'nav.account', Icons.cloud_outlined),
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 26),
      children: [
        Text(
          catalog.t('nav.menu', lang),
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 5),
        Text(
          catalog.t('nav.support', lang),
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        ...items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: Card(
              child: ListTile(
                onTap: () => onNavigate(item.$1),
                leading: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: BloomTheme.lilac,
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Icon(item.$3, color: BloomTheme.plum),
                ),
                title: Text(
                  catalog.t(item.$2, lang),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                trailing: const Icon(Icons.chevron_right_rounded),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

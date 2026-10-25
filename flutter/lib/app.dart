import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'common/bloom_catalog.dart';
import 'common/custom_theme.dart';
import 'features/home/ui/pages/home_shell.dart';
import 'features/home/ui/pages/welcome_page.dart';
import 'features/log/services/diary_repository.dart';
import 'features/log/ui/pages/unlock_page.dart';

class BloomApp extends StatelessWidget {
  const BloomApp({super.key, required this.diary});
  final DiaryRepository diary;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: diary,
    builder: (context, _) {
      final settings = diary.settings;
      final localeName = settings['language'] as String? ?? 'en';
      final scale = switch (settings['textSize']) {
        'large' => 1.12,
        'largest' => 1.25,
        _ => 1.0,
      };
      final baseTheme = BloomTheme.light;
      final contrast = settings['highContrast'] == true;
      final textTheme = baseTheme.textTheme.apply(fontSizeFactor: scale);
      final theme = baseTheme.copyWith(
        textTheme: textTheme,
        colorScheme: contrast
            ? baseTheme.colorScheme.copyWith(
                primary: BloomTheme.plumDark,
                onSurface: const Color(0xFF171119),
                outline: BloomTheme.ink,
              )
            : baseTheme.colorScheme,
        scaffoldBackgroundColor: contrast
            ? Colors.white
            : BloomTheme.background,
      );
      return MaterialApp(
        title: settings['discreet'] == true
            ? BloomCatalog.instance.t('app.diary', localeName)
            : BloomCatalog.instance.t('app.name', localeName),
        debugShowCheckedModeBanner: false,
        theme: theme,
        locale: Locale(localeName),
        supportedLocales: const [Locale('en'), Locale('hi'), Locale('ta')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        home: _home(),
      );
    },
  );

  Widget _home() {
    if (diary.storageError) return _StorageRecoveryPage(diary: diary);
    if (diary.locked) return UnlockPage(diary: diary);
    if (!diary.hasDiary) return WelcomePage(diary: diary);
    return HomeShell(diary: diary);
  }
}

class _StorageRecoveryPage extends StatelessWidget {
  const _StorageRecoveryPage({required this.diary});
  final DiaryRepository diary;
  @override
  Widget build(BuildContext context) {
    final lang = diary.language;
    final catalog = BloomCatalog.instance;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.shield_outlined,
                    color: BloomTheme.plum,
                    size: 48,
                  ),
                  const SizedBox(height: 18),
                  Text(
                    catalog.t('common.error', lang),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    catalog.t('privacyData.backupReminder', lang),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 20),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: Text(
                            catalog.t('settings.deleteConfirm', lang),
                          ),
                          content: Text(
                            catalog.t('settings.deleteConfirm', lang),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: Text(catalog.t('common.cancel', lang)),
                            ),
                            FilledButton(
                              onPressed: () => Navigator.pop(context, true),
                              child: Text(catalog.t('settings.delete', lang)),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) await diary.deleteEverything();
                    },
                    icon: const Icon(Icons.delete_outline_rounded),
                    label: Text(catalog.t('settings.delete', lang)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    catalog.t('privacyData.localOnly', lang),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

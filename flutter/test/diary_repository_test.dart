import 'dart:convert';

import 'package:bloom_companion/common/bloom_catalog.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:bloom_companion/features/log/services/diary_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('import keeps an enabled PIN vault encrypted', () async {
    SharedPreferences.setMockInitialValues({});
    await BloomCatalog.load();
    final diary = DiaryRepository();
    await diary.load();
    expect(
      await diary.start(demo: false, ageGroup: 'adult', language: 'en'),
      isTrue,
    );
    expect(await diary.enablePin('1234'), isTrue);

    const backupPassphrase = 'separate-private-backup-passphrase';
    final encrypted = await diary.exportEncryptedBackup(backupPassphrase);
    final incoming = await diary.decryptEncryptedBackup(
      encrypted,
      backupPassphrase,
    );
    final settings = Map<String, dynamic>.from(incoming['settings'] as Map);
    settings['discreet'] = true;
    incoming['settings'] = settings;
    expect(await diary.importAndReplace(incoming), isTrue);
    expect(diary.isPinEnabled, isTrue);

    final preferences = await SharedPreferences.getInstance();
    final envelope = jsonDecode(
      preferences.getString(DiaryRepository.storageKey)!,
    ) as Map<String, dynamic>;
    expect(envelope['encrypted'], isTrue);

    await diary.lock();
    final restored = DiaryRepository();
    await restored.load();
    expect(restored.locked, isTrue);
    expect(await restored.unlockPin('1234'), isTrue);
    expect(restored.settings['discreet'], isTrue);
  });
}

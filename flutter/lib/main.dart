import 'package:flutter/widgets.dart';

import 'app.dart';
import 'common/bloom_catalog.dart';
import 'features/log/services/diary_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await BloomCatalog.load();
  final diary = DiaryRepository();
  await diary.load();
  runApp(BloomApp(diary: diary));
}

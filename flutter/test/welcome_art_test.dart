import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:bloom_companion/common/bloom_catalog.dart';
import 'package:bloom_companion/features/home/ui/widgets/welcome_art.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late BloomCatalog catalog;

  setUpAll(() async {
    catalog = await BloomCatalog.load();
  });

  testWidgets('welcome art shows the bundled logo and localized tagline', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 340,
              child: WelcomeArt(catalog: catalog, language: 'ta'),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('welcome-full-logo')), findsOneWidget);
    expect(find.text(catalog.t('app.tagline', 'ta')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

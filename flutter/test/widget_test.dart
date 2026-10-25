import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:bloom_companion/common/custom_theme.dart';

void main() {
  testWidgets('Bloom theme renders its brand palette', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: BloomTheme.light,
        home: const Scaffold(body: Text('Bloom theme preview')),
      ),
    );

    final context = tester.element(find.text('Bloom theme preview'));
    final theme = Theme.of(context);
    expect(theme.colorScheme.primary, BloomTheme.plum);
    expect(theme.scaffoldBackgroundColor, BloomTheme.background);
  });
}

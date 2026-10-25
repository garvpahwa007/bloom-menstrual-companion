import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:bloom_companion/common/bloom_catalog.dart';
import 'package:bloom_companion/common/custom_theme.dart';
import 'package:bloom_companion/features/cycle/models/cycle_analysis.dart';
import 'package:bloom_companion/features/cycle/ui/widgets/phase_analysis_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late BloomCatalog catalog;

  setUpAll(() async {
    catalog = await BloomCatalog.load();
  });

  CycleAnalysis makeAnalysis({CyclePhase? phase, int? cycleDay = 11}) =>
      CycleAnalysis(
        periods: const [],
        periodStats: const {},
        cycles: const [],
        recentCycles: const [],
        average: null,
        median: 28,
        minimum: null,
        maximum: null,
        spread: 0,
        irregular: false,
        cycleDay: cycleDay,
        prediction: null,
        ovulation: null,
        fertile: null,
        phase: phase,
        suspectedGaps: const [],
        patterns: const [],
      );

  Widget host({required CycleAnalysis analysis, bool pregnancyMode = false}) =>
      MaterialApp(
        theme: BloomTheme.light,
        home: Scaffold(
          body: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: PhaseAnalysisCard(
                analysis: analysis,
                catalog: catalog,
                language: 'en',
                pregnancyMode: pregnancyMode,
              ),
            ),
          ),
        ),
      );

  test('phase-analysis labels exist in English, Hindi, and Tamil', () {
    const keys = [
      'tracking.phaseAnalysisKicker',
      'tracking.phaseAnalysisTitle',
      'tracking.currentPhase',
      'tracking.cycleDayNumber',
      'tracking.phaseAnalysisUnavailable',
      'tracking.phaseTimelineLabel',
      'tracking.phaseName.menstrual',
      'tracking.phaseName.beforeOvulation',
      'tracking.phaseName.aroundOvulation',
      'tracking.phaseName.afterOvulation',
      'tracking.phaseEducationTitle',
      'tracking.phaseEducationBody',
      'tracking.hormone.fsh',
      'tracking.hormone.lh',
      'tracking.hormone.pg',
      'tracking.hormone.e2',
      'tracking.phaseAnalysisNote',
    ];
    for (final language in ['en', 'hi', 'ta']) {
      for (final key in keys) {
        expect(
          catalog.t(key, language),
          isNot(key),
          reason: '$language / $key',
        );
      }
    }
  });

  testWidgets('Today phase card shows the estimated phase and safety note', (
    tester,
  ) async {
    await tester.pumpWidget(
      host(
        analysis: makeAnalysis(
          phase: const CyclePhase('beforeOvulation', estimated: true),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Cycle phase analysis'), findsOneWidget);
    expect(find.text('Follicular'), findsNWidgets(3));
    expect(
      find.textContaining('not measurements from your body'),
      findsOneWidget,
    );
    expect(
      find.bySemanticsLabel(
        'Estimated cycle phases from period start to the next estimated period',
      ),
      findsOneWidget,
    );
  });

  testWidgets('phase card is omitted in pregnancy mode', (tester) async {
    await tester.pumpWidget(
      host(
        analysis: makeAnalysis(
          phase: const CyclePhase('beforeOvulation', estimated: true),
        ),
        pregnancyMode: true,
      ),
    );

    expect(find.text('Cycle phase analysis'), findsNothing);
    expect(find.byType(PhaseAnalysisCard), findsOneWidget);
  });
}

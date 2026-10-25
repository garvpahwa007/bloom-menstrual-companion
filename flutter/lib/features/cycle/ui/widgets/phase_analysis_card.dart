import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/bloom_config.dart';
import '../../../../common/custom_theme.dart';
import '../../models/cycle_analysis.dart';

class PhaseAnalysisCard extends StatelessWidget {
  const PhaseAnalysisCard({
    super.key,
    required this.analysis,
    required this.catalog,
    required this.language,
    required this.pregnancyMode,
  });

  final CycleAnalysis analysis;
  final BloomCatalog catalog;
  final String language;
  final bool pregnancyMode;

  static const _colors = <String, Color>{
    'menstrual': Color(0xFFA34C68),
    'beforeOvulation': Color(0xFFB981A4),
    'aroundOvulation': Color(0xFF4E94A0),
    'afterOvulation': Color(0xFF4E9C8E),
  };

  @override
  Widget build(BuildContext context) {
    if (pregnancyMode) return const SizedBox.shrink();

    final cycleDay = analysis.cycleDay;
    final cycleLength = math.max(14, (analysis.median ?? 28).round()).toInt();
    final ovulationDay = math
        .max(6, cycleLength - BloomConfig.ovulationBeforePeriodDays)
        .toInt();
    final phaseId = analysis.phase?.id;
    final phaseName = catalog.t(
      phaseId == null
          ? 'tracking.phaseAnalysisUnavailable'
          : 'tracking.phaseName.$phaseId',
      language,
    );
    final segments = <_PhaseSegmentData>[
      _PhaseSegmentData(
        'menstrual',
        catalog.t('tracking.phaseName.menstrual', language),
        5,
      ),
      _PhaseSegmentData(
        'beforeOvulation',
        catalog.t('tracking.phaseName.beforeOvulation', language),
        math.max(1, ovulationDay - 5).toInt(),
      ),
      _PhaseSegmentData(
        'aroundOvulation',
        catalog.t('tracking.phaseName.aroundOvulation', language),
        1,
      ),
      _PhaseSegmentData(
        'afterOvulation',
        catalog.t('tracking.phaseName.afterOvulation', language),
        math.max(1, cycleLength - ovulationDay - 1).toInt(),
      ),
    ];
    final total = segments.fold<int>(0, (sum, segment) => sum + segment.days);
    final double? marker = phaseId != null && cycleDay != null
        ? math
              .min(98.0, math.max(2.0, ((cycleDay - .5) / total) * 100))
              .toDouble()
        : null;
    final reducedMotion = MediaQuery.of(context).disableAnimations;
    final duration = reducedMotion
        ? Duration.zero
        : const Duration(milliseconds: 500);

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, value, child) => Opacity(
        opacity: value,
        child: Transform.translate(
          offset: Offset(0, (1 - value) * 12),
          child: child,
        ),
      ),
      child: Container(
        padding: const EdgeInsets.all(17),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Colors.white, Color(0xFFFBF7FC)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(21),
          border: Border.all(color: BloomTheme.line),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        catalog.t('tracking.phaseAnalysisKicker', language),
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: BloomTheme.plum,
                          letterSpacing: 1,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        catalog.t('tracking.phaseAnalysisTitle', language),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 11,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0E8F4),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Text(
                    cycleDay == null
                        ? '—'
                        : catalog.t('tracking.cycleDayNumber', language, {
                            'count': MaterialLocalizations.of(context)
                                .formatDecimal(cycleDay),
                          }),
                    style: const TextStyle(
                      color: BloomTheme.plumDark,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Text(
              catalog.t('tracking.currentPhase', language),
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 3),
            Text(
              phaseName,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: BloomTheme.plumDark,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (phaseId != null) ...[
              const SizedBox(height: 4),
              Text(
                catalog.t('tracking.phase.$phaseId', language),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
            const SizedBox(height: 16),
            Semantics(
              image: true,
              label: catalog.t('tracking.phaseTimelineLabel', language),
              child: ExcludeSemantics(
                child: LayoutBuilder(
                  builder: (context, constraints) => SizedBox(
                    height: 108,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Positioned.fill(
                          child: Container(
                            padding: const EdgeInsets.fromLTRB(4, 13, 4, 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F0F6),
                              borderRadius: BorderRadius.circular(17),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                for (final segment in segments)
                                  Expanded(
                                    flex: segment.days,
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 3),
                                      child: AnimatedContainer(
                                        duration: reducedMotion
                                            ? Duration.zero
                                            : const Duration(milliseconds: 220),
                                        curve: Curves.easeOut,
                                        margin: EdgeInsets.only(
                                          top: phaseId == segment.id ? 0 : 4,
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 3,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _colors[segment.id]!
                                              .withValues(
                                                alpha: phaseId == segment.id
                                                    ? 1
                                                    : .78,
                                              ),
                                          borderRadius: const BorderRadius.only(
                                            topLeft: Radius.circular(13),
                                            topRight: Radius.circular(13),
                                            bottomLeft: Radius.circular(5),
                                            bottomRight: Radius.circular(5),
                                          ),
                                          boxShadow: phaseId == segment.id
                                              ? const [
                                                  BoxShadow(
                                                    color: Color(0x205B3A6A),
                                                    blurRadius: 10,
                                                    offset: Offset(0, 4),
                                                  ),
                                                ]
                                              : null,
                                        ),
                                        child: LayoutBuilder(
                                          builder: (context, box) =>
                                              box.maxWidth < 48
                                              ? const SizedBox.shrink()
                                              : Align(
                                                  alignment:
                                                      Alignment.bottomCenter,
                                                  child: Text(
                                                    segment.name,
                                                    maxLines: 3,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    textAlign: TextAlign.center,
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 9,
                                                      height: 1.2,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        if (marker != null)
                          AnimatedPositioned(
                            duration: duration,
                            curve: Curves.easeOutCubic,
                            left: constraints.maxWidth * marker / 100 - 1.5,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            child: Column(
                              children: [
                                Transform.translate(
                                  offset: const Offset(-5, -2),
                                  child: Container(
                                    width: 13,
                                    height: 13,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: BloomTheme.plum,
                                        width: 4,
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    width: 3,
                                    decoration: BoxDecoration(
                                      color: BloomTheme.plumDark,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 11),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                for (final segment in segments)
                  _PhaseLegend(
                    color: _colors[segment.id]!,
                    label: segment.name,
                  ),
              ],
            ),
            const SizedBox(height: 15),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFECE4EF)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    catalog.t('tracking.phaseEducationTitle', language),
                    style: const TextStyle(
                      color: BloomTheme.plumDark,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    catalog.t('tracking.phaseEducationBody', language),
                    style: Theme.of(context).textTheme.bodySmall
                        ?.copyWith(height: 1.5),
                  ),
                  const SizedBox(height: 11),
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      _HormoneLegend(
                        color: const Color(0xFFD5B85F),
                        label: catalog.t('tracking.hormone.fsh', language),
                      ),
                      _HormoneLegend(
                        color: const Color(0xFFD989A3),
                        label: catalog.t('tracking.hormone.lh', language),
                      ),
                      _HormoneLegend(
                        color: const Color(0xFF46BFA7),
                        label: catalog.t('tracking.hormone.pg', language),
                      ),
                      _HormoneLegend(
                        color: const Color(0xFF568FCE),
                        label: catalog.t('tracking.hormone.e2', language),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 11),
            Text(
              catalog.t('tracking.phaseAnalysisNote', language),
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(height: 1.5, color: BloomTheme.muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhaseSegmentData {
  const _PhaseSegmentData(this.id, this.name, this.days);
  final String id;
  final String name;
  final int days;
}

class _PhaseLegend extends StatelessWidget {
  const _PhaseLegend({required this.color, required this.label});
  final Color color;
  final String label;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 9,
        height: 9,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 5),
      Text(label, style: Theme.of(context).textTheme.bodySmall),
    ],
  );
}

class _HormoneLegend extends StatelessWidget {
  const _HormoneLegend({required this.color, required this.label});
  final Color color;
  final String label;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 19,
        height: 3,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(3),
        ),
      ),
      const SizedBox(width: 5),
      Flexible(
        child: Text(label, style: Theme.of(context).textTheme.bodySmall),
      ),
    ],
  );
}

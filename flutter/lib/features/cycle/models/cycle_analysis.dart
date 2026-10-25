class PeriodEpisode {
  const PeriodEpisode({
    required this.start,
    required this.end,
    required this.length,
  });
  final String start;
  final String end;
  final int length;
  Map<String, Object?> toJson() => {
    'start': start,
    'end': end,
    'length': length,
  };
}

class CycleRecord {
  const CycleRecord({
    required this.start,
    required this.end,
    required this.length,
    required this.periodLength,
    required this.nextStart,
    this.confirmedGap = false,
  });
  final String start;
  final String end;
  final int length;
  final int periodLength;
  final String nextStart;
  final bool confirmedGap;
  Map<String, Object?> toJson() => {
    'start': start,
    'end': end,
    'length': length,
    'periodLength': periodLength,
    'nextStart': nextStart,
    'confirmedGap': confirmedGap,
  };
}

class DateSpan {
  const DateSpan(this.from, this.to, {this.margin});
  final String from;
  final String to;
  final int? margin;
  Map<String, Object?> toJson() => {
    'from': from,
    'to': to,
    if (margin != null) 'margin': margin,
  };
}

class CyclePhase {
  const CyclePhase(this.id, {required this.estimated});
  final String id;
  final bool estimated;
  Map<String, Object?> toJson() => {'id': id, 'estimated': estimated};
}

class SuspectedGap extends CycleRecord {
  const SuspectedGap({
    required super.start,
    required super.end,
    required super.length,
    required super.periodLength,
    required super.nextStart,
    required this.id,
    super.confirmedGap,
  });
  final String id;
  @override
  Map<String, Object?> toJson() => {...super.toJson(), 'id': id};
}

class CycleAnalysis {
  const CycleAnalysis({
    required this.periods,
    required this.periodStats,
    required this.cycles,
    required this.recentCycles,
    required this.average,
    required this.median,
    required this.minimum,
    required this.maximum,
    required this.spread,
    required this.irregular,
    required this.cycleDay,
    required this.prediction,
    required this.ovulation,
    required this.fertile,
    required this.phase,
    required this.suspectedGaps,
    required this.patterns,
  });
  final List<PeriodEpisode> periods;
  final Map<String, Object?> periodStats;
  final List<CycleRecord> cycles;
  final List<CycleRecord> recentCycles;
  final double? average;
  final double? median;
  final int? minimum;
  final int? maximum;
  final int spread;
  final bool irregular;
  final int? cycleDay;
  final DateSpan? prediction;
  final DateSpan? ovulation;
  final DateSpan? fertile;
  final CyclePhase? phase;
  final List<SuspectedGap> suspectedGaps;
  final List<Map<String, Object?>> patterns;

  Map<String, Object?> toJson() => {
    'periods': periods.map((e) => e.toJson()).toList(),
    'periodStats': periodStats,
    'cycles': cycles.map((e) => e.toJson()).toList(),
    'recentCycles': recentCycles.map((e) => e.toJson()).toList(),
    'average': average,
    'median': median,
    'min': minimum,
    'max': maximum,
    'spread': spread,
    'irregular': irregular,
    'cycleDay': cycleDay,
    'prediction': prediction?.toJson(),
    'ovulation': ovulation?.toJson(),
    'fertile': fertile?.toJson(),
    'phase': phase?.toJson(),
    'suspectedGaps': suspectedGaps.map((e) => e.toJson()).toList(),
    'patterns': patterns,
  };
}

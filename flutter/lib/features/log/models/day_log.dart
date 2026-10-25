class DayLog {
  const DayLog({
    required this.date,
    this.period = false,
    this.flow = 'medium',
    this.padFrequent = false,
    this.largeClots = false,
    this.pain = 0,
    this.painDisrupts = false,
    this.painUnrelieved = false,
    this.symptoms = const <String>[],
    this.symptomIntensity = const <String, int>{},
    this.mood = 'fine',
    this.energy = 'okay',
    this.sleep = 8,
    this.medicines = '',
    this.note = '',
    this.betweenBleeding = false,
    this.afterSexBleeding = false,
    this.pregnancyPossible = false,
    this.urgentPain = false,
    this.fainting = false,
    this.confirmedGap = false,
  });

  final DateTime date;
  final bool period;
  final String flow;
  final bool padFrequent;
  final bool largeClots;
  final double pain;
  final bool painDisrupts;
  final bool painUnrelieved;
  final List<String> symptoms;
  final Map<String, int> symptomIntensity;
  final String mood;
  final String energy;
  final double sleep;
  final String medicines;
  final String note;
  final bool betweenBleeding;
  final bool afterSexBleeding;
  final bool pregnancyPossible;
  final bool urgentPain;
  final bool fainting;
  final bool confirmedGap;

  String get dateKey =>
      '${date.year.toString().padLeft(4, '0')}-'
      '${date.month.toString().padLeft(2, '0')}-'
      '${date.day.toString().padLeft(2, '0')}';

  DayLog copyWith({
    DateTime? date,
    bool? period,
    String? flow,
    bool? padFrequent,
    bool? largeClots,
    double? pain,
    bool? painDisrupts,
    bool? painUnrelieved,
    List<String>? symptoms,
    Map<String, int>? symptomIntensity,
    String? mood,
    String? energy,
    double? sleep,
    String? medicines,
    String? note,
    bool? betweenBleeding,
    bool? afterSexBleeding,
    bool? pregnancyPossible,
    bool? urgentPain,
    bool? fainting,
    bool? confirmedGap,
  }) => DayLog(
    date: date ?? this.date,
    period: period ?? this.period,
    flow: flow ?? this.flow,
    padFrequent: padFrequent ?? this.padFrequent,
    largeClots: largeClots ?? this.largeClots,
    pain: pain ?? this.pain,
    painDisrupts: painDisrupts ?? this.painDisrupts,
    painUnrelieved: painUnrelieved ?? this.painUnrelieved,
    symptoms: symptoms ?? this.symptoms,
    symptomIntensity: symptomIntensity ?? this.symptomIntensity,
    mood: mood ?? this.mood,
    energy: energy ?? this.energy,
    sleep: sleep ?? this.sleep,
    medicines: medicines ?? this.medicines,
    note: note ?? this.note,
    betweenBleeding: betweenBleeding ?? this.betweenBleeding,
    afterSexBleeding: afterSexBleeding ?? this.afterSexBleeding,
    pregnancyPossible: pregnancyPossible ?? this.pregnancyPossible,
    urgentPain: urgentPain ?? this.urgentPain,
    fainting: fainting ?? this.fainting,
    confirmedGap: confirmedGap ?? this.confirmedGap,
  );

  Map<String, Object?> toJson() => {
    'date': dateKey,
    'period': period,
    'flow': flow,
    'padFrequent': padFrequent,
    'largeClots': largeClots,
    'pain': pain,
    'painDisrupts': painDisrupts,
    'painUnrelieved': painUnrelieved,
    'symptoms': symptoms,
    'symptomIntensity': symptomIntensity,
    'mood': mood,
    'energy': energy,
    'sleep': sleep,
    'medicines': medicines,
    'note': note,
    'betweenBleeding': betweenBleeding,
    'afterSexBleeding': afterSexBleeding,
    'pregnancyPossible': pregnancyPossible,
    'urgentPain': urgentPain,
    'fainting': fainting,
    'confirmedGap': confirmedGap,
  };

  factory DayLog.fromJson(Map<String, dynamic> json) {
    final dateText = json['date'] as String;
    final parts = dateText.split('-').map(int.parse).toList();
    return DayLog(
      date: DateTime(parts[0], parts[1], parts[2]),
      period: json['period'] == true,
      flow: json['flow'] as String? ?? 'medium',
      padFrequent: json['padFrequent'] == true,
      largeClots: json['largeClots'] == true,
      pain: (json['pain'] as num?)?.toDouble() ?? 0,
      painDisrupts: json['painDisrupts'] == true,
      painUnrelieved: json['painUnrelieved'] == true,
      symptoms: (json['symptoms'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(),
      symptomIntensity: (json['symptomIntensity'] as Map? ?? const {}).map(
        (key, value) => MapEntry(key.toString(), (value as num).round()),
      ),
      mood: json['mood'] as String? ?? 'fine',
      energy: json['energy'] as String? ?? 'okay',
      sleep: (json['sleep'] as num?)?.toDouble() ?? 8,
      medicines: json['medicines'] as String? ?? '',
      note: json['note'] as String? ?? '',
      betweenBleeding: json['betweenBleeding'] == true,
      afterSexBleeding: json['afterSexBleeding'] == true,
      pregnancyPossible: json['pregnancyPossible'] == true,
      urgentPain: json['urgentPain'] == true,
      fainting: json['fainting'] == true,
      confirmedGap: json['confirmedGap'] == true,
    );
  }
}

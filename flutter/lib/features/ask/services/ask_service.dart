import 'dart:math' as math;

import '../../../common/bloom_catalog.dart';

class BloomAnswer {
  const BloomAnswer({
    required this.id,
    this.text,
    this.sourceIds = const [],
    this.consult = false,
    this.safety,
  });
  final String id;
  final String? text;
  final List<String> sourceIds;
  final bool consult;
  final String? safety;
}

String _normalize(String value) => value
    .toLowerCase()
    .replaceAll(RegExp(r'[?!.,।\-]'), ' ')
    .replaceAll(RegExp(r'\s+'), ' ')
    .trim();
bool _includes(String input, Iterable<dynamic> phrases) =>
    phrases.any((phrase) => input.contains(_normalize('$phrase')));

BloomAnswer answerQuestion(String question, String language) {
  final lang = const ['en', 'hi', 'ta'].contains(language) ? language : 'en';
  final input = _normalize(question);
  final catalog = BloomCatalog.instance;
  final support = catalog.section('support');
  final safety = catalog.section('safetyCopy');
  final pregnancyHelp = catalog.section('pregnancyHelp');
  final selfHarm = support['selfHarmKeywords'] as List? ?? const [];
  String safetyText(String key) => catalog.contentText(safety[key], lang);
  if (_includes(input, selfHarm)) {
    return BloomAnswer(
      id: 'selfHarm',
      text: safetyText('selfHarm'),
      sourceIds: const ['mentalHealth', 'emergency'],
      consult: true,
      safety: 'selfHarm',
    );
  }
  const pregnancyPhrases = [
    'pregnant',
    'pregnancy',
    'might be pregnant',
    'may be pregnant',
    'could be pregnant',
    'possibly pregnant',
    'pregnancy is possible',
    'pregnancy may be possible',
    'गर्भ',
    'गर्भवती',
    'गर्भ ठहर',
    'प्रेग्नेंट',
    'प्रेगनेंट',
    'प्रेग्नेंसी',
    'கர்ப்பம்',
    'கர்ப்பமாக',
    'கர்ப்பம் இருக்க',
  ];
  const bleedingPhrases = [
    'bleeding',
    'bleed',
    'spotting',
    'blood',
    'vaginal bleeding',
    'हल्का खून',
    'खून आना',
    'खून बह',
    'खून',
    'रक्तस्राव',
    'रक्त आना',
    'योनि से खून',
    'स्पॉटिंग',
    'ब्लीडिंग',
    'இரத்தப்போக்கு',
    'இரத்தம்',
  ];
  const severePhrases = [
    'severe pain',
    'severe belly',
    'severe abdominal',
    'severe lower',
    'severe stomach',
    'intense pain',
    'very bad pain',
    'really bad pain',
    'lower belly pain',
    'lower abdominal pain',
    'pain in my lower abdomen',
    'pain in my lower belly',
    'तेज दर्द',
    'बहुत तेज दर्द',
    'बहुत तेज़ दर्द',
    'तीव्र दर्द',
    'असहनीय दर्द',
    'निचले पेट में दर्द',
    'पेट के निचले हिस्से में दर्द',
    'கடுமையான வலி',
    'கீழ் வயிற்று வலி',
  ];
  const heavyPhrases = [
    'heavy bleeding',
    'very heavy bleeding',
    'bleeding heavily',
    'heavy period',
    'soaking a pad',
    'soak through a pad',
    'bleed through a pad',
    'pad every hour',
    'every hour',
    'every 1 to 2 hours',
    'change my pad every',
    'बहुत खून',
    'बहुत ज्यादा खून',
    'बहुत ज़्यादा खून',
    'बहुत अधिक खून',
    'हर घंटे पैड',
    'பெருமளவு இரத்தப்போக்கு',
  ];
  const dizzinessPhrases = [
    'dizzy',
    'dizziness',
    'lightheaded',
    'light headed',
    'feel faint',
    'feeling faint',
    'nearly fainted',
    'almost fainted',
    'about to faint',
    'fainting',
    'fainted',
    'passed out',
    'black out',
    'चक्कर',
    'सिर घूम',
    'बेहोशी',
    'बेहोश',
    'கருப்பு மயக்கம்',
  ];
  final pregnancy = _includes(input, pregnancyPhrases);
  final bleeding = _includes(input, bleedingPhrases);
  final severe = _includes(input, severePhrases);
  final dizzy = _includes(input, dizzinessPhrases);
  final heavy =
      _includes(input, heavyPhrases) ||
      (_includes(input, ['heavy', 'very heavy']) && bleeding);
  final noRelief = _includes(input, [
    'not helped',
    'no relief',
    'not helping',
    'not working',
    'has not helped',
    'have not helped',
    'आराम नहीं',
    'दवा से नहीं',
  ]);
  if (_includes(input, [
    'baby is moving less',
    'baby moving less',
    'baby has stopped moving',
    'baby not moving',
    'baby movements reduced',
    'बच्चा कम हिल',
    'बच्चे की हरकत कम',
    'பிஞ்சு அசைவு குறைவு',
  ])) {
    return BloomAnswer(
      id: 'urgent',
      text: catalog.contentText(pregnancyHelp, lang),
      sourceIds: const ['movements', 'emergency'],
      consult: true,
      safety: 'urgent',
    );
  }
  final urgentKeywords = support['urgentKeywords'] as List? ?? const [];
  if (_includes(input, [
        ...urgentKeywords,
        'sudden severe',
        'अचानक बहुत तेज',
      ]) ||
      (pregnancy && (bleeding || severe)) ||
      (heavy && dizzy) ||
      (severe && noRelief)) {
    return BloomAnswer(
      id: 'urgent',
      text: safetyText('urgent'),
      sourceIds: const ['emergency', 'heavy', 'ectopic', 'pain'],
      consult: true,
      safety: 'urgent',
    );
  }
  final ranked = <({Map item, double score})>[];
  for (final raw in catalog.list('faq').whereType<Map>()) {
    final item = Map<String, dynamic>.from(raw);
    final keywords = item['keywords'] as Map? ?? const {};
    final terms = [
      ...(keywords['en'] as List? ?? const []),
      ...(keywords['hi'] as List? ?? const []),
      ...(keywords['ta'] as List? ?? const []),
    ];
    final matches = terms.where((word) => input.contains(_normalize('$word')));
    final score = matches.fold<double>(
      0,
      (sum, word) => sum + math.pow(_normalize('$word').length, 1.4).toDouble(),
    );
    if (score > 0) ranked.add((item: item, score: score));
  }
  ranked.sort((a, b) => b.score.compareTo(a.score));
  if (ranked.isEmpty) return const BloomAnswer(id: 'unknown');
  final item = ranked.first.item;
  final answer = item['answer'] as Map? ?? const {};
  final sourceIds = item['sourceIds'] as List? ?? const [];
  return BloomAnswer(
    id: item['id'] as String? ?? 'unknown',
    text: answer[lang]?.toString() ?? answer['en']?.toString(),
    sourceIds: sourceIds.whereType<String>().toList(),
    consult: item['consult'] == true,
    safety: item['id'] == 'lowMood' ? 'support' : null,
  );
}

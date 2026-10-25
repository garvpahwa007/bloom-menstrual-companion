import { FAQ } from '../../content/faq.js';
import { SUPPORT, SAFETY_COPY } from '../../content/safety.js';
import { PREGNANCY_HELP } from '../../content/pregnancy.js';

const normalize = value => value.toLocaleLowerCase().replace(/[?!.,।\-]/g, ' ').replace(/\s+/g, ' ').trim();
const includesAny = (value, phrases) => phrases.some(phrase => value.includes(normalize(phrase)));

const pregnancyPhrases = [
  'pregnant', 'pregnancy', 'might be pregnant', 'may be pregnant', 'could be pregnant', 'possibly pregnant', 'pregnancy is possible', 'pregnancy may be possible',
  'गर्भ', 'गर्भवती', 'गर्भ ठहर', 'प्रेग्नेंट', 'प्रेगनेंट', 'प्रेग्नेंसी', 'கர்ப்பம்', 'கர்ப்பமாக', 'கர்ப்பம் இருக்க',
];
const bleedingPhrases = [
  'bleeding', 'bleed', 'spotting', 'blood', 'vaginal bleeding', 'हल्का खून', 'खून आना', 'खून बह', 'खून', 'रक्तस्राव', 'रक्त आना', 'योनि से खून', 'स्पॉटिंग', 'ब्लीडिंग', 'இரத்தப்போக்கு', 'இரத்தம்',
];
const severePainPhrases = [
  'severe pain', 'severe belly', 'severe abdominal', 'severe lower', 'severe stomach', 'severe pain low', 'intense pain', 'very bad pain', 'really bad pain', 'lower belly pain', 'lower abdominal pain', 'pain in my lower abdomen', 'pain low in my abdomen', 'pain in my lower belly',
  'तेज दर्द', 'बहुत तेज दर्द', 'बहुत तेज़ दर्द', 'तीव्र दर्द', 'असहनीय दर्द', 'निचले पेट में दर्द', 'पेट के निचले हिस्से में दर्द', 'पेट के नीचे दर्द', 'கடுமையான வலி', 'கீழ் வயிற்று வலி', 'निचले पेट में तेज', 'निचले पेट में बहुत', 'पेट के निचले हिस्से में तेज', 'पेट के निचले हिस्से में बहुत',
];
const heavyBleedingPhrases = [
  'heavy bleeding', 'very heavy bleeding', 'bleeding heavily', 'heavy period', 'soaking a pad', 'soak through a pad', 'soaking through a pad', 'bleed through a pad', 'pad every hour', 'every hour', 'every 1 to 2 hours', 'every 1 2 hours', 'change my pad every', 'changing pads every',
  'बहुत खून', 'बहुत ज्यादा खून', 'बहुत ज़्यादा खून', 'बहुत अधिक खून', 'बहुत रक्तस्राव', 'ज्यादा रक्तस्राव', 'ज़्यादा रक्तस्राव', 'हर घंटे पैड', 'एक घंटे में पैड', 'पैड हर घंटे', 'पैड जल्दी भर', 'पैड भर जाता', 'खून बहुत बह',
];
const dizzinessPhrases = [
  'dizzy', 'dizziness', 'lightheaded', 'light headed', 'feel faint', 'feeling faint', 'nearly fainted', 'almost fainted', 'about to faint', 'fainting', 'fainted', 'passed out', 'black out',
  'चक्कर', 'सिर घूम', 'हल्का सिर', 'बेहोशी', 'बेहोश', 'आंखों के आगे अंधेरा', 'आँखों के आगे अंधेरा', 'आंखों के सामने अंधेरा', 'आँखों के सामने अंधेरा', 'अंधेरा छा',
];

// This is an intentionally local library, not a generative medical chatbot.
export function answerQuestion(question, language = 'en') {
  const lang = ['en', 'hi', 'ta'].includes(language) ? language : 'en';
  const input = normalize(question);
  if (includesAny(input, SUPPORT.selfHarmKeywords)) return { text: SAFETY_COPY.selfHarm[lang], sourceIds: ['mentalHealth', 'emergency'], consult: true, safety: 'selfHarm', id: 'selfHarm' };
  const pregnancy = includesAny(input, pregnancyPhrases);
  const bleeding = includesAny(input, bleedingPhrases);
  const severe = includesAny(input, severePainPhrases);
  const dizzy = includesAny(input, dizzinessPhrases);
  const heavy = includesAny(input, heavyBleedingPhrases) || (includesAny(input, ['heavy', 'very heavy']) && bleeding);
  const noRelief = includesAny(input, ['not helped', 'no relief', 'not helping', 'not working', 'has not helped', 'have not helped', 'आराम नहीं', 'दवा से नहीं']);
  if (includesAny(input, ['baby is moving less', 'baby moving less', 'baby has stopped moving', 'baby not moving', 'baby movements reduced', 'बच्चा कम हिल', 'बच्चे की हरकत कम', 'बच्चा नहीं हिल'])) return { text: PREGNANCY_HELP[lang], sourceIds: ['movements', 'emergency'], consult: true, safety: 'urgent', id: 'urgent' };
  if (includesAny(input, [...SUPPORT.urgentKeywords, 'sudden severe', 'अचानक बहुत तेज']) || (pregnancy && (bleeding || severe)) || (heavy && dizzy) || (severe && noRelief)) return { text: SAFETY_COPY.urgent[lang], sourceIds: ['emergency', 'heavy', 'ectopic', 'pain'], consult: true, safety: 'urgent', id: 'urgent' };
  const ranked = FAQ.map(item => {
    const keywords = [...item.keywords.en, ...item.keywords.hi, ...(item.keywords.ta || [])];
    const matches = keywords.filter(keyword => input.includes(normalize(keyword)));
    const score = matches.reduce((sum, word) => sum + normalize(word).length ** 1.4, 0);
    return { item, score };
  }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score);
  if (!ranked.length) return { text: null, sourceIds: [], consult: false, id: 'unknown' };
  const item = ranked[0].item;
  return { id: item.id, text: item.answer[lang], sourceIds: item.sourceIds, consult: item.consult, safety: item.id === 'selfHarm' ? 'selfHarm' : item.id === 'lowMood' ? 'support' : null };
}

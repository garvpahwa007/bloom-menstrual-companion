import { FAQ } from '../content/faq.js';
import { SUPPORT, SAFETY_COPY } from '../content/safety.js';
import { PREGNANCY_HELP } from '../content/pregnancy.js';

const normalize = value => value.toLocaleLowerCase().replace(/[?!.,।\-]/g, ' ').replace(/\s+/g, ' ').trim();
const includesAny = (value, phrases) => phrases.some(phrase => value.includes(normalize(phrase)));

// This is an intentionally local library, not a generative medical chatbot.
export function answerQuestion(question, language = 'en') {
  const lang = language === 'hi' ? 'hi' : 'en';
  const input = normalize(question);
  if (includesAny(input, SUPPORT.selfHarmKeywords)) return { text: SAFETY_COPY.selfHarm[lang], sourceIds: ['mentalHealth', 'emergency'], consult: true, safety: 'selfHarm', id: 'selfHarm' };
  const pregnancy = includesAny(input, ['pregnant', 'pregnancy', 'गर्भ', 'प्रेग्नेंट']);
  const bleeding = includesAny(input, ['bleeding', 'bleed', 'खून', 'रक्तस्राव']);
  const severe = includesAny(input, ['severe pain', 'severe belly', 'तेज दर्द', 'तेज़ दर्द']);
  const dizzy = includesAny(input, ['dizzy', 'dizziness', 'faint', 'passed out', 'चक्कर', 'बेहोश']);
  const heavy = includesAny(input, ['heavy', 'every hour', 'pad an hour', 'बहुत खून', 'हर घंटे']);
  const noRelief = includesAny(input, ['not helped', 'no relief', 'not helping', 'not working', 'has not helped', 'have not helped', 'आराम नहीं', 'दवा से नहीं']);
  if (includesAny(input, ['baby is moving less', 'baby moving less', 'baby has stopped moving', 'baby not moving', 'baby movements reduced', 'बच्चा कम हिल', 'बच्चे की हरकत कम', 'बच्चा नहीं हिल'])) return { text: PREGNANCY_HELP[lang], sourceIds: ['movements', 'emergency'], consult: true, safety: 'urgent', id: 'urgent' };
  if (includesAny(input, [...SUPPORT.urgentKeywords, 'sudden severe', 'अचानक बहुत तेज']) || (pregnancy && (bleeding || severe)) || (heavy && dizzy) || (severe && noRelief)) return { text: SAFETY_COPY.urgent[lang], sourceIds: ['emergency', 'heavy', 'ectopic', 'pain'], consult: true, safety: 'urgent', id: 'urgent' };
  const ranked = FAQ.map(item => {
    const keywords = [...item.keywords.en, ...item.keywords.hi];
    const matches = keywords.filter(keyword => input.includes(normalize(keyword)));
    const score = matches.reduce((sum, word) => sum + normalize(word).length ** 1.4, 0);
    return { item, score };
  }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score);
  if (!ranked.length) return { text: null, sourceIds: [], consult: false, id: 'unknown' };
  const item = ranked[0].item;
  return { id: item.id, text: item.answer[lang], sourceIds: item.sourceIds, consult: item.consult, safety: item.id === 'selfHarm' ? 'selfHarm' : item.id === 'lowMood' ? 'support' : null };
}

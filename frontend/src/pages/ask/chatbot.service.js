import { answerQuestion } from './ask.service.js';
import { FAQ } from '../../content/faq.js';
import { translator } from '../../i18n/index.js';
import { analyzeCycles } from '../cycle/cycle.service.js';
import { daysBetween, formatDate, todayISO } from '../../utilities/date.helper.js';

// Shared with the textarea. Context is deliberately limited to the immediately
// preceding question and is used only to recognize a continuing urgent concern.
export const CHAT_MESSAGE_LIMIT = 1500;
const bounded = value => typeof value === 'string' ? value.slice(0, CHAT_MESSAGE_LIMIT) : '';
const normalize = value => value.toLocaleLowerCase().replace(/[?!.,।\-]/g, ' ').replace(/\s+/g, ' ').trim();
const faqById = new Map(FAQ.map(item => [item.id, item]));
const commonRelated = ['cycleStart', 'cramps', 'late'];
const relatedTopics = [
  ['pcos', 'pcosCare', 'pcodName', 'acne', 'weight', 'thyroid'],
  ['late', 'gap90', 'stress', 'travel', 'illness', 'pregnancyMode'],
  ['heavy', 'longPeriod', 'clots', 'between', 'suddenPain'],
  ['cramps', 'crampsMedicine', 'exercise', 'bloating'],
  ['mood', 'lowMood', 'selfHarm', 'tired'],
  ['cycleStart', 'first', 'noFirstPeriod', 'prediction'],
  ['pad', 'cup', 'cloth', 'firstSupplies', 'brownBlood'],
  ['ovulation', 'safeDays', 'prediction'],
  ['pregnancyMode', 'dueDate', 'pregnancyWarning', 'late'],
];

function relatedIds(id, suggestions) {
  const candidates = suggestions || relatedTopics.find(group => group.includes(id)) || commonRelated;
  return [...new Set(candidates)].filter(candidate => candidate !== id && faqById.has(candidate)).slice(0, 3);
}

function canonical(answer, { usedDiary = false, related } = {}) {
  return {
    id: answer.id,
    text: answer.text,
    sourceIds: [...(answer.sourceIds || [])],
    consult: answer.consult === true,
    safety: answer.safety || null,
    usedDiary,
    relatedIds: relatedIds(answer.id, related),
  };
}

function nonmedical(id, key, t, options) {
  return canonical({ id, text: t(key), sourceIds: [], consult: false }, options);
}

const greetings = new Set(['hi', 'hello', 'hey', 'hello there', 'hi there', 'good morning', 'good evening', 'namaste', 'नमस्ते', 'नमस्कार', 'हेलो', 'हैलो', 'வணக்கம்']);
const thanks = new Set(['thanks', 'thank you', 'thank you so much', 'thanks a lot', 'धन्यवाद', 'शुक्रिया', 'बहुत धन्यवाद', 'நன்றி']);
const helpRequests = new Set(['help', 'help me', 'can you help', 'can you help me', 'what can you do', 'how can you help', 'what can i ask', 'मदद', 'मदद करो', 'मदद करें', 'मेरी मदद करो', 'मेरी मदद करें', 'तुम क्या कर सकते हो', 'आप क्या कर सकते हैं', 'क्या पूछ सकती हूँ', 'क्या पूछ सकता हूँ', 'உதவி']);

function isDiaryRequest(input) {
  if (/^(?:please )?(?:my cycle|my periods?|my period history|my cycle history|my diary|मेरी डायरी|मेरा चक्र|मेरी माहवारी|मेरे पीरियड|என் நாட்குறிப்பு|என் சுழற்சி)(?: please)?$/.test(input)) return true;
  const summary = /\b(?:summari[sz]e|summary|summari[sz]ation)\b/.test(input);
  const personal = /\bmy (?:cycle|period|diary|logs|history)\b/.test(input);
  if (summary && personal) return true;
  if (/^(?:(?:please|can you|could you) )?(?:show(?: me)?|review) my (?:diary|period history|cycle history|cycles?|periods?|logs)\b/.test(input)) return true;
  if (/\bmy (?:period|cycle) history\b/.test(input)) return true;
  if (/(?:मेरी डायरी|मेरा चक्र|मेरे चक्र|मेरी माहवारी|मेरे पीरियड)/.test(input) && /(?:सारांश|इतिहास)/.test(input)) return true;
  if (/^(?:(?:कृपया|मुझे) )?(?:मेरी डायरी|मेरा चक्र|मेरे चक्र|मेरी माहवारी|मेरे पीरियड) (?:दिखाओ|दिखाएँ|दिखाएं|बताओ|बताएँ|बताएं)$/.test(input)) return true;
  if (/^(?:(?:தயவுசெய்து|தயவு செய்து) )?என் (?:நாட்குறிப்பின்|சுழற்சியின்) சுருக்க(?:ம்|த்தைக்)(?: (?:காட்டு|காட்டவும்|சொல்|சொல்லவும்))?$/.test(input)) return true;
  return /^(?:when is|when will|show me) my next period(?: start| come| date)?$/.test(input)
    || /^(?:मेरी अगली माहवारी|मेरे अगले पीरियड) (?:कब|कब आएगी|कब आएंगे|कब होंगे)$/.test(input);
}

function isEducationalPrior(input) {
  const prior = normalize(input);
  // Asking for a definition does not report that symptom. Personal concerns,
  // including questions about a possible pregnancy, remain eligible context.
  const personal = /\b(?:i|my|mine|me|we|our)\b/.test(prior)
    || /(?:^|\s)(?:मैं|मुझे|मेरा|मेरी|मेरे|நான்|எனக்கு|என்|எனது|என்னை)(?=\s|$)/.test(prior);
  if (personal) return false;
  return /^what (?:is|are) (?!wrong\b|happening\b|causing\b)/.test(prior)
    || /^what does .+ mean$/.test(prior)
    || /^(?:define|definition of|explain)\b/.test(prior)
    || /^how (?:to|do (?:people|you)|can (?:people|you)|should (?:people|you)) (?:use|wear|change|wash|clean|count|track|log|record|read)\b/.test(prior)
    || /(?:क्या है|क्या होता है|क्या होती है|किसे कहते हैं|का मतलब|की परिभाषा)/.test(prior)
    || /(?:कैसे (?:इस्तेमाल|उपयोग|साफ|धो|गिन|दर्ज|रिकॉर्ड)|(?:इस्तेमाल|उपयोग|गिनना|दर्ज करना|रिकॉर्ड) कैसे)/.test(prior)
    || /(?:என்றால் என்ன|என்பது என்ன|என்ன பொருள்|பற்றி விளக்க)/.test(prior)
    || /எப்படி(?:க்|ப்)? (?:பயன்படுத்த|அணிய|மாற்ற|சுத்தம்|எண்ண|பதிவுசெய்ய|பதிவு செய்ய)/.test(prior);
}

function continuingUrgentAnswer(input, previousQuestion, language, currentAnswer) {
  // Keep unrelated educational topics on their current sourced answer. Only
  // a symptom concern (or an unmatched new symptom) can continue prior context.
  if (!['unknown', 'late', 'heavy', 'cramps', 'crampsMedicine', 'longPeriod', 'gap90', 'between', 'suddenPain', 'clots', 'pregnancyWarning'].includes(currentAnswer.id)) return null;
  const normalized = normalize(input);
  const continuation = /^(?:and|also|now|still|in addition)\b/.test(normalized)
    || /\b(?:also|now|still|too)\b/.test(normalized)
    || /(?:^|\s)(?:और|भी|अब|साथ में|इसके अलावा|अभी भी|மேலும்|இப்போது|இன்னும்|கூட)(?=\s|$)/.test(normalized);
  // A conjunction inside an educational question is not a symptom followup.
  // Hindi markers need token boundaries so, for example, कभी is not भी.
  const statement = normalized.replace(/^(?:(?:and|also|now|still|in addition|और|भी|अब|साथ में|इसके अलावा|अभी भी|மேலும்|இப்போது|இன்னும்|கூட)\s+)+/, '');
  if (/^(?:what|why|how|when|where|who|which)\b/.test(statement)
    || /^(?:क्या|क्यों|कैसे|कब|कहाँ|कौन)(?=\s|$)/.test(statement)
    || /^(?:எப்படி(?:க்|ப்)?|ஏன்|எப்போது|என்ன)(?=\s|$)/.test(statement)
    || /\b(?:want to know|explain|tell me|learn|understand)\b/.test(statement)) return null;
  const danger = /\b(?:bleed\w*|blood|spotting|pad|dizz\w*|lightheaded|light headed|faint\w*|severe|pain|pregnan\w*|unrelieved|not helped|no relief|not helping|not working)\b/.test(normalized)
    || /(?:खून|रक्त|स्पॉटिंग|ब्लीडिंग|पैड|चक्कर|सिर घूम|बेहोश|दर्द|गर्भ|प्रेग्न|आराम नहीं)/.test(normalized)
    || /(?:இரத்தப்போக்கு|இரத்தம்|ரத்தப்போக்கு|ரத்தம்|கடுமையான வலி|கீழ் வயிற்று வலி|கர்ப்பம்|கர்ப்பமாக|தலைச்சுற்றல்|தலை சுற்றுகிறது|மயக்கம்|மயங்கி|மயக்கமாக|நிவாரணம் இல்லை|குறையவில்லை|உதவவில்லை)/.test(normalized);
  if (!continuation || !danger) return null;
  const previous = bounded(previousQuestion);
  if (isEducationalPrior(previous)) return null;
  // Keep the combined routing input within the same bound as one UI message.
  const prior = previous.slice(0, Math.max(0, CHAT_MESSAGE_LIMIT - input.length - 1));
  if (!prior.trim()) return null;
  const answer = answerQuestion(`${prior}\n${input}`, language);
  return answer.safety === 'urgent' ? answer : null;
}

const object = value => value && typeof value === 'object' && !Array.isArray(value);
const validDate = value => {
  try { return daysBetween(value, value) === 0; }
  catch { return false; }
};

function diarySummary(state, language, t) {
  const input = object(state) ? state : {};
  const today = todayISO();
  // Only the fields needed for calendar arithmetic enter analysis. Free text,
  // medicines, identity, settings, and symptom details are never read or copied.
  const logs = Object.fromEntries(Object.entries(object(input.logs) ? input.logs : {})
    .filter(([date, log]) => validDate(date) && date <= today && object(log))
    .map(([date, log]) => [date, { period: log.period === true, confirmedGap: log.confirmedGap === true }]));
  const profile = object(input.profile) ? input.profile : {};
  const pregnancyEnabled = profile.pregnancyEnabled === true;
  const analysis = analyzeCycles(logs, { today, pregnancyEnabled, fertilityEnabled: false, trackedSymptoms: [] });
  const number = value => new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN', { maximumFractionDigits: 1 }).format(value);
  const sentences = [];
  if (input.demo === true) sentences.push(t('ask.diaryDemo'));
  sentences.push(t('ask.diarySummaryIntro'));
  const lastPeriod = analysis.periods.at(-1);
  sentences.push(lastPeriod ? t('ask.diaryLastPeriod', { date: formatDate(lastPeriod.start, language, { year: 'numeric' }) }) : t('ask.diaryNoPeriod'));
  sentences.push(t('ask.diaryCompleteCycles', { count: number(analysis.recentCycles.length) }));
  if (analysis.average !== null) sentences.push(t('ask.diaryAverageCycle', { days: number(analysis.average) }));
  if (analysis.irregular) sentences.push(t('ask.diaryIrregular'));
  if (pregnancyEnabled) sentences.push(t('ask.diaryPregnancyPaused'));
  else if (analysis.suspectedGaps.length) sentences.push(t('ask.diaryGapsPaused'));
  else if (!analysis.prediction) sentences.push(t('ask.diaryInsufficient'));
  else if (analysis.prediction.to < today) sentences.push(t('ask.diaryExpiredEstimate'));
  else sentences.push(t('ask.diaryEstimate', {
    from: formatDate(analysis.prediction.from, language, { year: 'numeric' }),
    to: formatDate(analysis.prediction.to, language, { year: 'numeric' }),
  }));
  return canonical({
    id: 'diarySummary', text: sentences.join('\n'), consult: false,
    sourceIds: [...new Set(['cycleStart', 'prediction'].flatMap(id => faqById.get(id)?.sourceIds || []))],
  }, { usedDiary: true, related: ['cycleStart', 'prediction', 'late'] });
}

/** Deterministic, offline conversation around the established sourced FAQ. */
export function answerOfflineChat(question, { language = 'en', state = null, useDiary = false, previousQuestion = '' } = {}) {
  const lang = ['en', 'hi', 'ta'].includes(language) ? language : 'en';
  const t = translator(lang);
  const input = bounded(question).trim();
  const normalized = normalize(input);
  const answer = answerQuestion(input, lang);
  if (answer.safety) return canonical(answer);
  const continuing = continuingUrgentAnswer(input, previousQuestion, lang, answer);
  if (continuing) return canonical(continuing);

  // Specific health questions keep their sourced answer even if a diary phrase
  // appears alongside them (for example, "my cycle is late").
  const diaryOnlyMatch = answer.id === 'unknown' || ['cycleStart', 'prediction', 'privacy'].includes(answer.id);
  if (diaryOnlyMatch && (normalized === normalize(t('ask.diaryPrompt')) || isDiaryRequest(normalized))) {
    return useDiary === true
      ? diarySummary(state, lang, t)
      : nonmedical('diaryOptIn', 'ask.diaryOptIn', t, { related: ['cycleStart', 'prediction', 'privacy'] });
  }
  if (answer.id !== 'unknown') return canonical(answer);
  if (greetings.has(normalized)) return nonmedical('greeting', 'ask.chatGreeting', t);
  if (thanks.has(normalized)) return nonmedical('thanks', 'ask.chatThanks', t);
  if (helpRequests.has(normalized)) return nonmedical('help', 'ask.chatHelp', t);
  return canonical(answer);
}

export default answerOfflineChat;

import test from 'node:test';
import assert from 'node:assert/strict';
import { answerOfflineChat, CHAT_MESSAGE_LIMIT } from '../src/pages/ask/chatbot.service.js';
import { answerQuestion } from '../src/pages/ask/ask.service.js';
import { analyzeCycles } from '../src/pages/cycle/cycle.service.js';
import { FAQ } from '../src/content/faq.js';
import { SOURCES } from '../src/content/sources.js';
import { translator } from '../src/i18n/index.js';
import { createDemoData } from '../src/data/demo.js';
import { addDays, formatDate, todayISO } from '../src/utilities/date.helper.js';

const ids = new Set(FAQ.map(item => item.id));
const t = translator('en');
const number = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);
function makeState(lengths, { daysSinceLast = 10, pregnancyEnabled = false } = {}) {
  const today = todayISO();
  let start = addDays(today, -daysSinceLast - lengths.reduce((sum, length) => sum + length, 0));
  const starts = [start];
  for (const length of lengths) { start = addDays(start, length); starts.push(start); }
  return {
    starts,
    state: { demo: false, logs: Object.fromEntries(starts.map(date => [date, { period: true }])), profile: { pregnancyEnabled } },
    today,
  };
}
function assertCanonical(answer) {
  assert.deepEqual(Object.keys(answer).sort(), ['id', 'text', 'sourceIds', 'consult', 'safety', 'usedDiary', 'relatedIds'].sort());
  assert.equal(typeof answer.id, 'string');
  assert.equal(typeof answer.consult, 'boolean');
  assert.equal(typeof answer.usedDiary, 'boolean');
  assert.ok([null, 'urgent', 'selfHarm', 'support'].includes(answer.safety));
  for (const id of answer.sourceIds) assert.ok(SOURCES[id], `Source ${id} must resolve`);
  for (const id of answer.relatedIds) assert.ok(ids.has(id), `Related FAQ ${id} must resolve`);
  assert.ok(!answer.relatedIds.includes(answer.id));
  assert.ok(answer.relatedIds.length <= 3);
  assert.equal(new Set(answer.relatedIds).size, answer.relatedIds.length);
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

test('offline chat retains every established bilingual FAQ answer and source verbatim', () => {
  for (const language of ['en', 'hi']) for (const faq of FAQ) {
    const expected = answerQuestion(faq.question[language], language);
    const answer = answerOfflineChat(faq.question[language], { language });
    assert.equal(answer.id, expected.id, `${language}: ${faq.id}`);
    assert.equal(answer.text, expected.text, `${language}: ${faq.id}`);
    assert.deepEqual(answer.sourceIds, expected.sourceIds);
    assert.equal(answer.consult, expected.consult);
    assert.equal(answer.safety, expected.safety || null);
    assert.equal(answer.usedDiary, false);
    assertCanonical(answer);
  }
});

const safetyCases = [
  ['I might be pregnant and I have spotting', 'en', 'urgent'],
  ['I am soaking a pad every hour and I feel light-headed', 'en', 'urgent'],
  ['I have sudden severe lower belly pain', 'en', 'urgent'],
  ['Severe pain and painkillers have not helped', 'en', 'urgent'],
  ['My baby is moving less', 'en', 'urgent'],
  ['I feel like hurting myself', 'en', 'selfHarm'],
  ['I feel very low', 'en', 'support'],
  ['गर्भ की संभावना है और खून आ रहा है', 'hi', 'urgent'],
  ['बहुत खून आ रहा है और सिर घूम रहा है', 'hi', 'urgent'],
  ['पेट में अचानक तेज दर्द है', 'hi', 'urgent'],
  ['मुझे खुद को नुकसान पहुँचाने का मन है', 'hi', 'selfHarm'],
  ['मैं बहुत उदास हूँ', 'hi', 'support'],
];
for (const [question, language, safety] of safetyCases) {
  test(`offline safety: ${question}`, () => {
    const expected = answerQuestion(question, language);
    const answer = answerOfflineChat(`Summarise my diary. ${question}`, { language, useDiary: true, state: createDemoData() });
    assert.equal(answer.safety, safety);
    assert.equal(answer.text, expected.text);
    assert.deepEqual(answer.sourceIds, expected.sourceIds);
    assert.equal(answer.usedDiary, false);
    assertCanonical(answer);
  });
}

test('explicit immediate followups combine only for established urgent safety routing', () => {
  const cases = [
    ['I have heavy bleeding', 'I also feel dizzy', 'en'],
    ['I have heavy bleeding', 'I feel dizzy now', 'en'],
    ['I might be pregnant', 'And I have spotting', 'en'],
    ['I have severe pain', 'And painkillers have not helped', 'en'],
    ['बहुत खून आ रहा है', 'अब चक्कर भी आ रहे हैं', 'hi'],
    ['मैं गर्भवती हो सकती हूँ', 'और हल्का खून आ रहा है', 'hi'],
  ];
  for (const [previousQuestion, question, language] of cases) {
    const answer = answerOfflineChat(question, { previousQuestion, language });
    assert.equal(answer.safety, 'urgent', `${previousQuestion} → ${question}`);
    assert.equal(answer.text, answerQuestion(`${previousQuestion}\n${question}`, language).text);
    assert.equal(answer.usedDiary, false);
    assertCanonical(answer);
  }
});

test('previous danger cannot contaminate unrelated topics, greetings, or noncontinuing messages', () => {
  const previousQuestion = 'I might be pregnant and have very heavy bleeding and feel dizzy';
  for (const question of [
    'Hi', 'Thank you', 'What is PCOS?', 'And what is ovulation?', 'Explain quantum entanglement', 'I feel dizzy',
    'What is pregnancy mode and when should I use it?', 'How do I use a pad and a cup?',
    'Also, what is pregnancy mode?', 'And why is blood sometimes brown?', 'I also want to know about pregnancy mode',
    'क्या कभी पैड पहनना चाहिए?', 'और पैड कैसे इस्तेमाल करते हैं?', 'और गर्भावस्था मोड कैसे इस्तेमाल करूँ?',
  ]) {
    const answer = answerOfflineChat(question, { previousQuestion });
    assert.notEqual(answer.safety, 'urgent', question);
    assert.equal(answer.id, answerOfflineChat(question).id);
  }
  assert.equal(answerOfflineChat('Also, I feel like hurting myself', { previousQuestion }).safety, 'selfHarm');
  assert.equal(answerOfflineChat('Also I feel very low', { previousQuestion }).safety, 'support');
  assert.equal(answerOfflineChat('Also I feel dizzy', { previousQuestion: 'I want to die' }).safety, null);
});

test('greeting, thanks and help are bilingual nonmedical replies', () => {
  for (const [question, language, id, key] of [
    ['Hello!', 'en', 'greeting', 'ask.chatGreeting'],
    ['नमस्ते', 'hi', 'greeting', 'ask.chatGreeting'],
    ['Thank you.', 'en', 'thanks', 'ask.chatThanks'],
    ['शुक्रिया', 'hi', 'thanks', 'ask.chatThanks'],
    ['What can you do?', 'en', 'help', 'ask.chatHelp'],
    ['मदद करें', 'hi', 'help', 'ask.chatHelp'],
  ]) {
    const answer = answerOfflineChat(question, { language });
    assert.equal(answer.id, id);
    assert.equal(answer.text, translator(language)(key));
    assert.notEqual(answer.text, key, `Translation ${key} must exist`);
    if (language === 'hi') assert.match(answer.text, /[\u0900-\u097f]/);
    assert.equal(answer.consult, false);
    assert.equal(answer.safety, null);
    assert.deepEqual(answer.sourceIds, []);
    assertCanonical(answer);
  }
  assert.equal(answerOfflineChat('Hi, do I have PCOS?').id, 'pcos');
  assert.equal(answerOfflineChat('Thanks, my period is late').id, 'late');
});

test('unknown questions keep the canonical unknown sentinel and safe common related topics', () => {
  for (const question of ['Explain quantum entanglement', 'चाँद पर चाय बनाना', '', null, {}, undefined]) {
    const answer = answerOfflineChat(question);
    assert.equal(answer.id, 'unknown');
    assert.equal(answer.text, null);
    assert.deepEqual(answer.sourceIds, []);
    assert.equal(answer.usedDiary, false);
    assert.deepEqual(answer.relatedIds, ['cycleStart', 'cramps', 'late']);
    assertCanonical(answer);
  }
  assert.equal(answerOfflineChat('Hello', { language: 'invalid-language' }).text, t('ask.chatGreeting'));
});

test('diary summaries require explicit opt-in and do not touch diary state while off', () => {
  const state = new Proxy({}, { get() { throw new Error('Diary must not be read'); } });
  for (const [question, language] of [
    ['my cycle', 'en'], ['My period history', 'en'], ['Summarise my diary', 'en'],
    ['Summarize my cycle length', 'en'], ['मेरी डायरी का सारांश दिखाओ', 'hi'], ['मेरी डायरी', 'hi'],
  ]) {
    const answer = answerOfflineChat(question, { state, language });
    assert.equal(answer.id, 'diaryOptIn', question);
    assert.equal(answer.text, translator(language)('ask.diaryOptIn'));
    assert.equal(answer.usedDiary, false);
    assert.deepEqual(answer.sourceIds, []);
    assertCanonical(answer);
  }
  assert.equal(answerOfflineChat('my cycle', { state, useDiary: 'true' }).id, 'diaryOptIn');
});

test('health questions retain their FAQ answer despite personal diary phrases', () => {
  for (const question of [
    'My cycle is late', 'My cycle: do I have PCOS?', 'Summarize my diary, I have heavy bleeding', 'Why is my cycle prediction a date range?',
    'Show me how to count my cycle days', 'Show me how to estimate my cycle length',
    'मेरी माहवारी के दिन कैसे गिनूँ बताओ', 'मेरी डायरी का डेटा सर्वर पर जाता है बताओ',
  ]) {
    const answer = answerOfflineChat(question, { useDiary: true, state: makeState([28, 28, 28]).state });
    assert.equal(answer.id, answerQuestion(question).id, question);
    assert.equal(answer.text, answerQuestion(question).text, question);
    assert.equal(answer.usedDiary, false);
  }
});

test('opted-in diary summary uses the existing analysis counts, average and labelled date range', () => {
  const { state, today, starts } = makeState([27, 29, 28, 28]);
  const analysis = analyzeCycles(state.logs, { today, fertilityEnabled: false });
  const answer = answerOfflineChat('Summarise my diary', { state, useDiary: true });
  assert.equal(answer.id, 'diarySummary');
  assert.equal(answer.usedDiary, true);
  assert.ok(answer.text.includes(t('ask.diaryLastPeriod', { date: formatDate(starts.at(-1), 'en', { year: 'numeric' }) })));
  assert.ok(answer.text.includes(t('ask.diaryCompleteCycles', { count: number(analysis.cycles.length) })));
  assert.ok(answer.text.includes(t('ask.diaryAverageCycle', { days: number(analysis.average) })));
  assert.ok(answer.text.includes(t('ask.diaryEstimate', {
    from: formatDate(analysis.prediction.from, 'en', { year: 'numeric' }),
    to: formatDate(analysis.prediction.to, 'en', { year: 'numeric' }),
  })));
  assert.doesNotMatch(answer.text, /ask\.[A-Za-z]|\{(?:date|count|days|from|to)\}/);
  assertCanonical(answer);
});

test('summary count and average use the same recent-cycle window when history has over six cycles', () => {
  const { state, today } = makeState([21, 24, 26, 35, 28, 34, 27, 33]);
  const analysis = analyzeCycles(state.logs, { today });
  const answer = answerOfflineChat('my cycle', { state, useDiary: true });
  assert.ok(analysis.cycles.length > analysis.recentCycles.length);
  assert.ok(answer.text.includes(t('ask.diaryCompleteCycles', { count: number(analysis.recentCycles.length) })));
  assert.ok(!answer.text.includes(t('ask.diaryCompleteCycles', { count: number(analysis.cycles.length) })));
  assert.ok(answer.text.includes(t('ask.diaryAverageCycle', { days: number(analysis.average) })));
  assert.ok(answer.text.includes(t('ask.diaryIrregular')));
});

test('diary summary is Hindi when selected', () => {
  const { state, starts } = makeState([28, 28, 28]);
  const answer = answerOfflineChat('मेरी डायरी का सारांश बताओ', { state, useDiary: true, language: 'hi' });
  assert.equal(answer.id, 'diarySummary');
  assert.match(answer.text, /[\u0900-\u097f]/);
  assert.ok(answer.text.includes(formatDate(starts.at(-1), 'hi', { year: 'numeric' })));
  assert.doesNotMatch(answer.text, /ask\.[A-Za-z]|\{(?:date|count|days|from|to)\}/);
});

test('summary never reads or exposes notes, medicines, identity, PIN, DOB or unrelated profile fields', () => {
  const { state } = makeState([28, 28, 28]);
  const forbidden = () => { throw new Error('Forbidden private field was accessed'); };
  for (const log of Object.values(state.logs)) {
    for (const key of ['note', 'medicines', 'symptoms', 'mood', 'energy']) Object.defineProperty(log, key, { enumerable: true, get: forbidden });
  }
  for (const key of ['alias', 'DOB', 'dateOfBirth', 'PIN', 'account', 'settings', 'vault']) Object.defineProperty(state, key, { enumerable: true, get: forbidden });
  for (const key of ['name', 'dob', 'lastPeriodDate', 'accountAlias']) Object.defineProperty(state.profile, key, { enumerable: true, get: forbidden });
  assert.equal(answerOfflineChat('my cycle', { state, useDiary: true }).id, 'diarySummary');
  const plain = makeState([28, 28, 28]).state;
  plain.logs[Object.keys(plain.logs)[0]].note = 'SECRET-NOTE';
  plain.logs[Object.keys(plain.logs)[0]].medicines = 'SECRET-MEDICINE';
  plain.profile.accountAlias = 'SECRET-ALIAS';
  plain.profile.dob = 'SECRET-DOB';
  plain.PIN = 'SECRET-PIN';
  assert.doesNotMatch(JSON.stringify(answerOfflineChat('my cycle', { state: plain, useDiary: true })), /SECRET-/);
});

test('missing, invalid, future-only and insufficient diary histories cannot produce a prediction', () => {
  const insufficient = makeState([28, 28]).state;
  const future = addDays(todayISO(), 10);
  const cases = [null, {}, { logs: null }, { logs: { '2026-02-30': { period: true }, [future]: { period: true }, broken: {}, [todayISO()]: null } }, insufficient];
  for (const state of cases) {
    const answer = answerOfflineChat('my cycle', { state, useDiary: true });
    assert.equal(answer.usedDiary, true);
    assert.ok(answer.text.includes(t('ask.diaryInsufficient')));
    assert.doesNotMatch(answer.text, /ask\.[A-Za-z]/);
    assertCanonical(answer);
  }
  assert.ok(answerOfflineChat('my cycle', { useDiary: true }).text.includes(t('ask.diaryNoPeriod')));
});

test('pregnancy mode, unresolved gaps and expired estimates withhold the next date range', () => {
  for (const [fixture, key] of [
    [makeState([28, 28, 28], { pregnancyEnabled: true }), 'ask.diaryPregnancyPaused'],
    [makeState([28, 28, 58, 28]), 'ask.diaryGapsPaused'],
    [makeState([28, 28, 28], { daysSinceLast: 60 }), 'ask.diaryExpiredEstimate'],
  ]) {
    const answer = answerOfflineChat('my cycle', { state: fixture.state, useDiary: true });
    assert.ok(answer.text.includes(t(key)), key);
    assert.ok(!answer.text.includes(t('ask.diaryEstimate').split('{from}')[0]));
    assert.equal(answer.safety, null);
  }
});

test('fictional demo is labelled and summary never fabricates a more precise date', () => {
  const state = createDemoData();
  const analysis = analyzeCycles(state.logs);
  const answer = answerOfflineChat('my cycle', { state, useDiary: true });
  assert.ok(answer.text.startsWith(t('ask.diaryDemo')));
  assert.match(answer.text, /fictional/i);
  assert.ok(answer.text.includes(t('ask.diaryIrregular')));
  assert.ok(answer.text.includes(formatDate(analysis.prediction.from, 'en', { year: 'numeric' })));
  assert.ok(answer.text.includes(formatDate(analysis.prediction.to, 'en', { year: 'numeric' })));
  const hindi = answerOfflineChat('मेरी डायरी', { state, useDiary: true, language: 'hi' });
  assert.ok(hindi.text.startsWith(translator('hi')('ask.diaryDemo')));
  assert.match(hindi.text, /काल्पनिक/);
});

test('input, context and diary data remain immutable and returned arrays do not alias the FAQ', () => {
  const state = freeze(makeState([28, 28, 28]).state);
  const before = JSON.stringify(state);
  assert.equal(answerOfflineChat('my cycle', { state, useDiary: true }).id, 'diarySummary');
  assert.equal(JSON.stringify(state), before);
  const answer = answerOfflineChat('Do I have PCOS?');
  const original = [...FAQ.find(item => item.id === 'pcos').sourceIds];
  answer.sourceIds.push('made-up-source');
  answer.relatedIds.push('made-up-topic');
  assert.deepEqual(FAQ.find(item => item.id === 'pcos').sourceIds, original);
  assertCanonical(answerOfflineChat('Do I have PCOS?'));
});

test('the shared limit bounds current messages and the total previous-question safety context', () => {
  assert.equal(CHAT_MESSAGE_LIMIT, 1500);
  assert.equal(answerOfflineChat(`${'x'.repeat(CHAT_MESSAGE_LIMIT)} I have heavy bleeding and feel dizzy`).id, 'unknown');
  assert.equal(answerOfflineChat('Also I feel dizzy', { previousQuestion: `${'x'.repeat(CHAT_MESSAGE_LIMIT)} heavy bleeding` }).safety, null);
  const question = `Also ${'x'.repeat(CHAT_MESSAGE_LIMIT - 11)} dizzy`;
  assert.equal(question.length, CHAT_MESSAGE_LIMIT);
  assert.equal(answerOfflineChat(question, { previousQuestion: 'I have heavy bleeding' }).safety, null);
});

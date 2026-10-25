import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { handleAskRequest, sanitizeCycleSummary } from './ask.js';

const url = 'https://bloom-period-companion.vercel.app/api/ask';
const makeRequest = (body, { method = 'POST', origin = 'https://bloom-period-companion.vercel.app' } = {}) => new Request(url, {
  method,
  headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const providerReply = text => new Response(JSON.stringify({ output_text: text }), { status: 200, headers: { 'content-type': 'application/json' } });
function capture(reply = providerReply('A cycle can vary for several reasons. A log cannot diagnose one.')) {
  const calls = [];
  const fetcher = async (target, options) => {
    calls.push({ target, options, payload: JSON.parse(options.body) });
    return typeof reply === 'function' ? reply(target, options) : reply;
  };
  return { calls, fetcher };
}
const env = { OPENAI_API_KEY: 'synthetic-server-secret', OPENAI_MODEL: 'gpt-4.1-mini' };

test('route rejects non-POST and cross-origin requests without provider calls', async () => {
  const { calls, fetcher } = capture();
  assert.equal((await handleAskRequest(makeRequest(undefined, { method: 'GET' }), { env, fetcher })).status, 405);
  assert.equal((await handleAskRequest(makeRequest({ question: 'Do I have PCOS?', aiConsent: true }, { origin: 'https://evil.example' }), { env, fetcher })).status, 403);
  assert.equal(calls.length, 0);
});

test('AI consent is required at the API boundary even when a server key exists', async () => {
  const { calls, fetcher } = capture();
  const response = await handleAskRequest(makeRequest({ question: 'Do I have PCOS?', privateNote: 'never forward', personId: 'secret-id' }), { env, fetcher });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(calls.length, 0);
  assert.equal(result.localOnly, true);
  assert.match(result.answer, /app cannot tell/i);
});

test('opted-in request includes only the question, curated lessons, server key, and store:false', async () => {
  const { calls, fetcher } = capture();
  const question = 'Do I have PCOS?';
  const response = await handleAskRequest(makeRequest({ question, aiConsent: true, privateNote: 'PRIVATE', account: { id: 'secret' }, chatHistory: ['old turn'] }), { env, fetcher });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].target, 'https://api.openai.com/v1/responses');
  assert.equal(calls[0].options.headers.authorization, 'Bearer synthetic-server-secret');
  assert.equal(calls[0].payload.model, 'gpt-4.1-mini');
  assert.equal(calls[0].payload.store, false);
  assert.equal(calls[0].payload.input, question);
  assert.match(calls[0].payload.instructions, /never diagnose/i);
  assert.match(calls[0].payload.instructions, /PCOS and the term PCOD/);
  assert.doesNotMatch(JSON.stringify(calls[0].payload), /PRIVATE|synthetic-server-secret|secret-id|old turn/);
  assert.ok(result.sourceIds.includes('pcos'));
  assert.equal(result.answer, 'A cycle can vary for several reasons. A log cannot diagnose one.');
  assert.equal(result.localOnly, false);
});

test('cycle summary requires separate consent and only four allowlisted fields reach the model', async () => {
  const { calls, fetcher } = capture();
  await handleAskRequest(makeRequest({
    question: 'What could explain my cycle?', aiConsent: true, shareCycleSummary: true,
    cycleSummary: {
      averageCycleLength: 28, regularity: 'regular', lastPeriodDate: '2026-06-24', symptoms: ['cramps', 'unknown-symptom', 'cramps'],
      privateNote: 'PRIVATE-LINE', medicines: ['PRIVATE-MEDICINE'], personName: 'PRIVATE-NAME', accountId: 'PRIVATE-ID',
    },
    privateNote: 'PRIVATE-LINE',
  }), { env, fetcher });
  assert.equal(calls.length, 1);
  assert.match(calls[0].payload.input, /What could explain my cycle\?/);
  assert.match(calls[0].payload.input, /Average cycle length: 28 days/);
  assert.match(calls[0].payload.input, /Regularity: regular/);
  assert.match(calls[0].payload.input, /2026-06-24/);
  assert.match(calls[0].payload.input, /cramps/);
  assert.doesNotMatch(calls[0].payload.input, /PRIVATE|unknown-symptom|accountId|medicines/);
});

test('summary sanitizer accepts only supported values and recognized symptom IDs', () => {
  assert.deepEqual(sanitizeCycleSummary({
    averageCycleLength: 28, regularity: 'irregular', lastPeriodDate: '2026-02-30', symptoms: ['cramps', 'personName', 'cramps'], privateNote: 'not allowed',
  }), { averageCycleLength: 28, regularity: 'irregular', lastPeriodDate: null, symptoms: ['cramps'] });
  assert.deepEqual(sanitizeCycleSummary({ averageCycleLength: 999, regularity: 'private', symptoms: [] }), {
    averageCycleLength: null, regularity: 'notEnoughData', lastPeriodDate: null, symptoms: [],
  });
});

test('urgent, self-harm and very-low-mood prompts stay local before OpenAI', async () => {
  const { calls, fetcher } = capture();
  for (const [question, pattern] of [
    ['I have sudden severe lower-belly pain', /112/],
    ['I feel like hurting myself', /14416/],
    ['I feel very low', /14416/],
  ]) {
    const response = await handleAskRequest(makeRequest({ question, aiConsent: true }), { env, fetcher });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.localOnly, true);
    assert.match(result.answer, pattern);
  }
  assert.equal(calls.length, 0);
});

test('identifier questions are blocked before provider call', async () => {
  const { calls, fetcher } = capture();
  const response = await handleAskRequest(makeRequest({ question: 'My name is Test Person. Why is my period late?', aiConsent: true }), { env, fetcher });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'remove_identifiers' });
  assert.equal(calls.length, 0);
});

test('unsupported questions, safe-days claims and forecasts remain local', async () => {
  const { calls, fetcher } = capture();
  for (const question of ['Explain quantum entanglement', 'Are there safe days to prevent pregnancy?', 'When will my next period start?']) {
    const response = await handleAskRequest(makeRequest({ question, aiConsent: true }), { env, fetcher });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).localOnly, true);
  }
  assert.equal(calls.length, 0);
});

test('Hindi question receives Hindi response instructions and source context', async () => {
  const { calls, fetcher } = capture(providerReply('देर से माहवारी आने से गर्भ की पुष्टि नहीं होती।'));
  const response = await handleAskRequest(makeRequest({ question: 'क्या मुझे पीसीओएस है?', aiConsent: true }), { env, fetcher });
  assert.equal(response.status, 200);
  assert.match(calls[0].payload.instructions, /Answer in Hindi/);
  assert.match(calls[0].payload.input, /क्या मुझे पीसीओएस है/);
});

test('Tamil questions remain local and never call the English/Hindi AI provider', async () => {
  const { calls, fetcher } = capture();
  const response = await handleAskRequest(makeRequest({ question: 'PCOS என்றால் என்ன?', aiConsent: true }), { env, fetcher });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.localOnly, true);
  assert.match(result.answer, /[\u0b80-\u0bff]/);
  assert.equal(calls.length, 0);
});

test('unsafe model output is replaced by local sourced guidance', async () => {
  const { calls, fetcher } = capture(providerReply('You have PCOS. Take ibuprofen 200 mg.'));
  const response = await handleAskRequest(makeRequest({ question: 'Do I have PCOS?', aiConsent: true }), { env, fetcher });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(result.localOnly, true);
  assert.match(result.answer, /app cannot tell/i);
  assert.doesNotMatch(result.answer, /ibuprofen|200 mg/i);
});

test('provider errors are generic; missing key does not call upstream', async () => {
  const { calls, fetcher } = capture(new Response('provider detail and secret', { status: 429 }));
  const failed = await handleAskRequest(makeRequest({ question: 'Do I have PCOS?', aiConsent: true }), { env, fetcher });
  assert.equal(failed.status, 502);
  assert.deepEqual(await failed.json(), { error: 'ai_unavailable' });
  assert.equal(calls.length, 1);
  const unavailable = await handleAskRequest(makeRequest({ question: 'Do I have PCOS?', aiConsent: true }), { env: {}, fetcher: async () => assert.fail('must not call provider without key') });
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { error: 'ai_unavailable' });
});

test('source contains no question/answer logging or persistence', () => {
  const source = fs.readFileSync(new URL('./ask.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /console\.(?:log|info|warn|error)|localStorage|sessionStorage|indexedDB|appendFile|\.insert\(|\.save\(/i);
  assert.match(source, /store: false/);
  assert.match(source, /['"]cache-control['"]:\s*['"]no-store, private['"]/);
});

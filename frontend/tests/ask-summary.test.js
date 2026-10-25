import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCycleSummary } from '../src/pages/ask/ask-summary.service.js';
import { containsDirectIdentifier } from '../src/pages/ask/ask-privacy.service.js';

test('cycle summary contains only approved fields and recognized symptoms from the latest completed cycle', () => {
  const logs = {};
  for (const start of ['2026-04-01', '2026-04-29', '2026-05-27', '2026-06-24']) {
    logs[start] = { period: true, note: 'PRIVATE-DIARY-NOTE', medicines: 'PRIVATE-MEDICINE' };
  }
  logs['2026-05-31'] = { symptoms: ['cramps', 'headache', 'unrecognized'], note: 'PRIVATE-ENTRY' };
  const state = { profile: { ageGroup: 'adult', accountName: 'PRIVATE-NAME', pin: 'PRIVATE-PIN' }, logs };
  const summary = buildCycleSummary(state, '2026-10-24');
  assert.deepEqual(Object.keys(summary).sort(), ['averageCycleLength', 'lastPeriodDate', 'regularity', 'symptoms'].sort());
  assert.deepEqual(summary, { averageCycleLength: 28, regularity: 'regular', lastPeriodDate: '2026-06-24', symptoms: ['cramps', 'headache'] });
  assert.doesNotMatch(JSON.stringify(summary), /PRIVATE|unrecognized|note|medicine|pin|account/i);
});

test('without enough completed cycles summary does not guess an average', () => {
  assert.deepEqual(buildCycleSummary({ profile: {}, logs: {} }, '2026-10-24'), {
    averageCycleLength: null, regularity: 'notEnoughData', lastPeriodDate: null, symptoms: [],
  });
});

test('common direct identifiers are conservatively detected before AI requests', () => {
  for (const question of [
    'My name is Test Person. Why am I late?', 'Contact me at someone@example.com',
    'My phone is 9876543210', 'मेरा नाम सीमा है। माहवारी देर से है।',
  ]) assert.equal(containsDirectIdentifier(question), true, question);
  assert.equal(containsDirectIdentifier('I am 14 and my periods are irregular.'), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays } from '../src/utilities/date.helper.js';
import { evaluateGuidance } from '../src/pages/guidance/guidance.service.js';
import { createDemoData } from '../src/data/demo.js';

const today = '2026-10-22';
const adult = { ageGroup: 'adult', pregnancyEnabled: false };
const has = (logs, id, profile = adult, options = {}) => evaluateGuidance(logs, profile, { today, ...options }).find(card => card.id === id);
function periodLogs(start, length = 5, props = {}) {
  return Object.fromEntries(Array.from({ length }, (_, index) => {
    const date = addDays(start, index);
    return [date, { date, period: true, flow: 'medium', symptoms: [], ...props }];
  }));
}
function cycleLogs(lengths) {
  let start = '2026-01-01';
  let logs = periodLogs(start);
  for (const length of lengths) { start = addDays(start, length); logs = { ...logs, ...periodLogs(start, 5, { confirmedGap: true }) }; }
  return logs;
}

test('period longer than seven days triggers exact evidence; seven does not', () => {
  assert.equal(has(periodLogs('2026-10-01', 7), 'longPeriod'), undefined);
  assert.equal(has(periodLogs('2026-10-01', 8), 'longPeriod').dates.length, 8);
});

test('future bleeding logs cannot extend today’s period or become evidence', () => {
  const logs = periodLogs(today, 9);
  assert.equal(has(logs, 'longPeriod'), undefined);
  for (const card of evaluateGuidance(logs, adult, { today })) {
    assert.ok(card.dates.every(date => date <= today));
  }
});

test('explicitly switching period off does not treat a retained flow choice as heavy bleeding', () => {
  const log = { period: false, flow: 'heavy', symptoms: ['dizziness', 'tiredness'] };
  assert.equal(has({ [today]: log }, 'urgentBleeding'), undefined);
  assert.equal(has({ [today]: log }, 'anemiaSymptoms'), undefined);
  assert.ok(has({ [today]: { ...log, padFrequent: true } }, 'urgentBleeding'));
});

test('frequent product changes and large clots each trigger heavy-flow guidance', () => {
  assert.ok(has(periodLogs('2026-10-01', 1, { padFrequent: true }), 'heavyFlow'));
  assert.ok(has(periodLogs('2026-10-01', 1, { largeClots: true }), 'heavyFlow'));
  assert.equal(has(periodLogs('2026-10-01', 1), 'heavyFlow'), undefined);
});

test('single out-of-range cycle gets care information without waiting for three', () => {
  assert.ok(has(cycleLogs([40]), 'cycleVariation'));
  assert.equal(has(cycleLogs([40]), 'irregularConsecutive'), undefined);
});

test('three out-of-range cycles must be consecutive and age thresholds differ', () => {
  assert.ok(has(cycleLogs([40, 39, 40]), 'irregularConsecutive'));
  assert.equal(has(cycleLogs([40, 28, 40, 40]), 'irregularConsecutive'), undefined);
  assert.equal(has(cycleLogs([40, 40, 40]), 'irregularConsecutive', { ageGroup: 'under18' }), undefined);
  assert.ok(has(cycleLogs([46, 46, 46]), 'irregularConsecutive', { ageGroup: 'under18' }));
  assert.ok(has(cycleLogs([20, 20, 20]), 'irregularConsecutive', { ageGroup: 'under18' }));
});

test('cycle thresholds are strictly outside the inclusive stated limits', () => {
  assert.equal(has(cycleLogs([21, 35, 21]), 'cycleVariation'), undefined);
  assert.equal(has(cycleLogs([21, 45, 21]), 'cycleVariation', { ageGroup: 'under18' }), undefined);
});

test('ninety days since a period triggers guidance; eighty-nine does not', () => {
  assert.ok(has(periodLogs(addDays(today, -90)), 'noPeriod'));
  assert.equal(has(periodLogs(addDays(today, -89)), 'noPeriod'), undefined);
});

test('between-period or after-sex bleeding has dated evidence', () => {
  const logs = { [today]: { period: false, betweenBleeding: true } };
  assert.deepEqual(has(logs, 'betweenBleeding').dates, [today]);
  assert.ok(has({ [today]: { afterSexBleeding: true } }, 'betweenBleeding'));
});

test('pain disrupting life or not relieved triggers consult guidance', () => {
  assert.ok(has({ [today]: { painDisrupts: true } }, 'disruptivePain'));
  assert.ok(has({ [today]: { painUnrelieved: true } }, 'disruptivePain'));
  assert.equal(has({ [today]: { pain: 3 } }, 'disruptivePain'), undefined);
});

test('heavy bleeding plus tiredness/breathlessness/dizziness is identified without diagnosis', () => {
  for (const symptom of ['tiredness', 'breathlessness', 'dizziness']) {
    assert.ok(has(periodLogs(today, 1, { flow: 'heavy', symptoms: [symptom] }), 'anemiaSymptoms'));
  }
  assert.equal(has(periodLogs(today, 1, { flow: 'medium', symptoms: ['tiredness'] }), 'anemiaSymptoms'), undefined);
});

test('sudden severe pain, heavy bleeding with dizziness/fainting and pregnancy bleeding are urgent', () => {
  assert.equal(has({ [today]: { urgentPain: true } }, 'urgentPain').severity, 'urgent');
  assert.equal(has({ [today]: { flow: 'heavy', symptoms: ['dizziness'] } }, 'urgentBleeding').severity, 'urgent');
  assert.ok(has({ [today]: { flow: 'heavy', fainting: true } }, 'urgentBleeding'));
  assert.equal(has({ [today]: { pregnancyPossible: true, betweenBleeding: true } }, 'pregnancyUrgent').severity, 'urgent');
  assert.equal(has({ '2026-01-01': { urgentPain: true } }, 'urgentPain'), undefined);
});

test('three very-low mood dates must be consecutive', () => {
  const logs = Object.fromEntries([-2, -1, 0].map(offset => [addDays(today, offset), { mood: 'veryLow' }]));
  assert.equal(has(logs, 'veryLowMood').dates.length, 3);
  delete logs[addDays(today, -1)];
  assert.equal(has(logs, 'veryLowMood'), undefined);
});

test('pregnancy pauses period rules while preserving urgent danger and mental-health rules', () => {
  const profile = { ageGroup: 'adult', pregnancyEnabled: true, lastPeriodDate: addDays(today, -210) };
  const logs = periodLogs(addDays(today, -200), 8, { padFrequent: true });
  logs[today] = { symptoms: ['severeHeadache', 'reducedMovement'] };
  const cards = evaluateGuidance(logs, profile, { today });
  assert.equal(cards.some(card => card.id === 'longPeriod' || card.id === 'noPeriod' || card.id === 'heavyFlow'), false);
  assert.ok(cards.some(card => card.id === 'pregnancyDanger'));
});

test('reported reduced movement gets urgent guidance without a 28-week gate', () => {
  const logs = { [today]: { symptoms: ['reducedMovement'] } };
  assert.ok(has(logs, 'pregnancyDanger', { pregnancyEnabled: true, lastPeriodDate: addDays(today, -140) }));
  assert.ok(has(logs, 'pregnancyDanger', { pregnancyEnabled: true, lastPeriodDate: addDays(today, -196) }));
});

test('severe pain in possible pregnancy is urgent even without disruption checkboxes', () => {
  const logs = { [today]: { pregnancyPossible: true, pain: 7 } };
  assert.equal(has(logs, 'pregnancyUrgent').severity, 'urgent');
  assert.equal(has({ [today]: { pregnancyPossible: true, pain: 3, painDisrupts: true } }, 'pregnancyUrgent'), undefined);
});

test('after-sex bleeding with pregnancy possible is urgent', () => {
  assert.equal(has({ [today]: { pregnancyPossible: true, afterSexBleeding: true } }, 'pregnancyUrgent').severity, 'urgent');
});

test('severe pain unrelieved by pain relief is urgent; mild unrelieved pain is a consult', () => {
  assert.equal(has({ [today]: { pain: 8, painUnrelieved: true } }, 'urgentPain').severity, 'urgent');
  assert.equal(has({ [today]: { pain: 3, painUnrelieved: true } }, 'urgentPain'), undefined);
  assert.ok(has({ [today]: { pain: 3, painUnrelieved: true } }, 'disruptivePain'));
});

test('dismissal signature stays hidden until a new trigger date is logged', () => {
  const logs = { [addDays(today, -1)]: { painDisrupts: true } };
  const initial = has(logs, 'disruptivePain');
  assert.equal(has(logs, 'disruptivePain', adult, { dismissals: { disruptivePain: initial.signature } }), undefined);
  logs[today] = { painDisrupts: true };
  assert.ok(has(logs, 'disruptivePain', adult, { dismissals: { disruptivePain: initial.signature } }));
});

test('demo triggers at least two sourced consult cards with evidence dates', () => {
  const state = createDemoData(today);
  const cards = evaluateGuidance(state.logs, state.profile, { today });
  assert.ok(cards.filter(card => card.severity === 'consult').length >= 2);
  for (const card of cards) { assert.ok(card.dates.length); assert.match(card.source.url, /^https:\/\//); }
});

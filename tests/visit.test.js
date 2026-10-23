import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVisitSummary } from '../src/lib/visit.js';
import { createDemoData } from '../src/data/demo.js';
import { addDays } from '../src/lib/dates.js';

const today = '2026-10-22';
const log = (date, props = {}) => ({ date, period: false, symptoms: [], mood: 'okay', energy: 'okay', pain: 0, medicines: '', note: '', ...props });

test('visit summary aggregates older symptoms, pain and medicines from all logs', () => {
  const logs = {};
  logs['2026-01-01'] = log('2026-01-01', { symptoms: ['headache', 'headache'], symptomIntensity: { headache: 3 }, pain: 8, painDisrupts: true, medicines: 'An older recorded medicine', note: 'SECRET_OLD_NOTE' });
  logs['2026-01-02'] = log('2026-01-02', { symptoms: ['headache'], symptomIntensity: { headache: 2 }, painUnrelieved: true, medicines: 'An older recorded medicine' });
  for (let day = 0; day < 20; day++) {
    const date = addDays(today, -day);
    logs[date] = log(date, { symptoms: ['bloating'], pain: 2 });
  }
  const summary = buildVisitSummary({ logs, profile: { ageGroup: 'adult' } }, { today });
  assert.equal(summary.loggedDays, 22);
  assert.deepEqual(summary.dateRange, { from: '2026-01-01', to: today });
  assert.deepEqual(summary.symptomCounts.find(item => item.id === 'headache'), { id: 'headache', count: 2 });
  assert.deepEqual(summary.symptomCounts.find(item => item.id === 'bloating'), { id: 'bloating', count: 20 });
  assert.deepEqual(summary.symptomIntensityCounts, [{ id: 'headache', mild: 0, moderate: 1, strong: 1, ratedDays: 2 }]);
  assert.deepEqual(summary.pain, { max: 8, daysDisrupted: 1, daysUnrelieved: 1 });
  assert.deepEqual(summary.medicines, [{ name: 'An older recorded medicine', dates: ['2026-01-01', '2026-01-02'] }]);
  assert.equal(JSON.stringify(summary).includes('SECRET_OLD_NOTE'), false);
  assert.ok(summary.guidance.some(card => card.id === 'disruptivePain' && card.dates.includes('2026-01-01')));
});

test('visit summary retains every accepted cycle and the current period rather than only six cycles', () => {
  const logs = {};
  let start = '2026-01-01';
  for (let index = 0; index < 9; index++) {
    for (let day = 0; day < 5; day++) {
      const date = addDays(start, day);
      logs[date] = log(date, { period: true });
    }
    start = addDays(start, 28);
  }
  const ongoing = addDays('2026-01-01', 8 * 28 + 4);
  const summary = buildVisitSummary({ logs }, { today: ongoing });
  assert.equal(summary.cycles.length, 8);
  assert.equal(summary.periods.length, 9);
  assert.equal(summary.periods.at(-1).ongoing, true);
  assert.equal(summary.periods.at(-1).end, ongoing);
});

test('visit summary includes dismissed guidance, and excludes unrelated PIN, settings and private fields', () => {
  const state = createDemoData(today);
  state.logs[today].painDisrupts = true;
  state.logs[today].note = 'SECRET_CURRENT_NOTE';
  state.profile.privateField = 'PRIVATE_PROFILE';
  state.settings.pin = '9876';
  state.vault = { key: 'SECRET_VAULT_KEY' };
  state.dismissals = { disruptivePain: 'disruptivePain:anything' };
  const summary = buildVisitSummary(state, { today });
  const serialized = JSON.stringify(summary);
  assert.ok(summary.guidance.some(card => card.id === 'disruptivePain'));
  for (const secret of ['SECRET_CURRENT_NOTE', 'PRIVATE_PROFILE', '9876', 'SECRET_VAULT_KEY']) assert.equal(serialized.includes(secret), false);
  assert.deepEqual(Object.keys(summary).sort(), ['cycles', 'periods', 'symptomCounts', 'symptomIntensityCounts', 'pain', 'medicines', 'guidance', 'dateRange', 'loggedDays'].sort());
});

test('visit summary is empty and well formed for zero logs or absent state', () => {
  const empty = { cycles: [], periods: [], symptomCounts: [], symptomIntensityCounts: [], pain: { max: 0, daysDisrupted: 0, daysUnrelieved: 0 }, medicines: [], guidance: [], dateRange: { from: null, to: null }, loggedDays: 0 };
  assert.deepEqual(buildVisitSummary({ logs: {}, profile: {} }, { today }), empty);
  assert.deepEqual(buildVisitSummary(undefined, { today }), empty);
});

test('visit summary skips malformed and future entries without exposing arbitrary log fields', () => {
  const logs = { 'not-a-date': log('not-a-date'), '2026-02-30': log('2026-02-30'), '2026-10-23': log('2026-10-23'), [today]: log(today, { symptoms: null, medicines: { invalid: 'object' }, extra: 'SECRET_EXTRA' }), '2026-10-21': null };
  const summary = buildVisitSummary({ logs }, { today });
  assert.equal(summary.loggedDays, 1);
  assert.deepEqual(summary.dateRange, { from: today, to: today });
  assert.deepEqual(summary.symptomCounts, []);
  assert.deepEqual(summary.medicines, []);
  assert.equal(JSON.stringify(summary).includes('SECRET_EXTRA'), false);
});

test('visit summary ignores intensity values unless they match a selected symptom and allowed level', () => {
  const logs = { [today]: log(today, { symptoms: ['headache'], symptomIntensity: { headache: 2, cramps: 3, nausea: 4, dizziness: '1' } }) };
  const summary = buildVisitSummary({ logs }, { today });
  assert.deepEqual(summary.symptomIntensityCounts, [{ id: 'headache', mild: 0, moderate: 1, strong: 0, ratedDays: 1 }]);
});

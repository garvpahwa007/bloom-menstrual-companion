import test from 'node:test';
import assert from 'node:assert/strict';
import CONFIG from '../src/config.js';
import { addDays, daysBetween, todayISO } from '../src/lib/dates.js';
import { getPeriods, analyzeCycles } from '../src/lib/cycle.js';
import { createDemoData } from '../src/data/demo.js';

function makeLogs(lengths, { start = '2026-01-01', periodLength = 5 } = {}) {
  let date = start;
  const starts = [start];
  for (const length of lengths) { date = addDays(date, length); starts.push(date); }
  const logs = {};
  starts.forEach(first => {
    for (let day = 0; day < periodLength; day++) {
      const date = addDays(first, day);
      logs[date] = { date, period: true, symptoms: [], mood: 'okay', energy: 'okay' };
    }
  });
  return { logs, starts, today: addDays(starts.at(-1), 10) };
}

test('calendar date arithmetic survives leap days, month edges and daylight-saving boundaries', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2026-03-08', 1), '2026-03-09');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(daysBetween('2026-03-01', '2026-03-31'), 30);
  assert.equal(todayISO(new Date(2026, 9, 22, 23, 59)), '2026-10-22');
  assert.throws(() => addDays('2026-02-30', 1));
});

test('28-day regular cycles use first day to first day and omit unfinished cycle', () => {
  const { logs, today, starts } = makeLogs([28, 28, 28, 28]);
  const result = analyzeCycles(logs, { today, ageGroup: 'adult' });
  assert.equal(result.cycles.length, 4);
  assert.deepEqual(result.cycles.map(cycle => cycle.length), [28, 28, 28, 28]);
  assert.equal(result.cycleDay, 11);
  assert.equal(result.median, 28);
  assert.equal(result.prediction.expected, addDays(starts.at(-1), 28));
  assert.equal(result.prediction.from, addDays(starts.at(-1), 26));
  assert.equal(result.prediction.to, addDays(starts.at(-1), 30));
  assert.equal(result.irregular, false);
  assert.equal(result.ovulation.from, addDays(result.prediction.from, -14));
  assert.equal(result.fertile.from, addDays(result.ovulation.from, -5));
  assert.equal(result.fertile.to, addDays(result.ovulation.to, CONFIG.fertileDaysAfterOvulation));
  assert.equal(CONFIG.fertileDaysAfterOvulation, 1);
});

test('variable cycles compute median, spread and widen the labelled-estimate range', () => {
  const { logs, today } = makeLogs([26, 31, 29, 35, 27, 30]);
  const result = analyzeCycles(logs, { today, ageGroup: 'adult' });
  assert.equal(result.median, 29.5);
  assert.equal(result.min, 26);
  assert.equal(result.max, 35);
  assert.equal(result.spread, 9);
  assert.equal(result.irregular, true);
  assert.equal(result.prediction.margin, 11);
  assert.equal(result.ovulation, null);
  assert.equal(result.fertile, null);
});

test('only two completed cycles gives no estimate', () => {
  const { logs, today } = makeLogs([28, 28]);
  const result = analyzeCycles(logs, { today, ageGroup: 'adult' });
  assert.equal(result.prediction, null);
  assert.equal(result.ovulation, null);
});

test('only six most recent complete cycles are used', () => {
  const { logs, today } = makeLogs([25, 27, 28, 29, 30, 31, 32, 33]);
  const result = analyzeCycles(logs, { today });
  assert.equal(result.cycles.length, 8);
  assert.equal(result.recentCycles.length, 6);
  assert.deepEqual(result.recentCycles.map(cycle => cycle.length), [28, 29, 30, 31, 32, 33]);
});

test('a 58-day possible missed log is surfaced and not silently counted', () => {
  const { logs, today, starts } = makeLogs([28, 28, 28, 58, 28]);
  let result = analyzeCycles(logs, { today });
  assert.equal(result.suspectedGaps.length, 1);
  assert.equal(result.suspectedGaps[0].length, 58);
  assert.equal(result.prediction, null);
  assert.equal(result.cycles.some(cycle => cycle.length === 58), false);
  logs[starts[4]].confirmedGap = true;
  result = analyzeCycles(logs, { today });
  assert.equal(result.suspectedGaps.length, 0);
  assert.equal(result.cycles.some(cycle => cycle.length === 58), true);
  assert.ok(result.prediction);
});

test('an older missed-log gap is checked against later history too', () => {
  const { logs, today } = makeLogs([58, 28, 28, 28]);
  const result = analyzeCycles(logs, { today });
  assert.equal(result.suspectedGaps.length, 1);
  assert.equal(result.suspectedGaps[0].length, 58);
  assert.equal(result.prediction, null);
});

test('spotting outside a marked period does not create a period', () => {
  const logs = { '2026-01-01': { period: false, flow: 'spotting' }, '2026-01-02': { period: true, flow: 'light' }, '2026-01-03': { period: true, flow: 'light' } };
  assert.deepEqual(getPeriods(logs), [{ start: '2026-01-02', end: '2026-01-03', length: 2 }]);
});

test('period-duration summaries exclude active bleeding and future records', () => {
  const logs = {};
  for (const [start, length] of [['2026-01-01', 3], ['2026-02-01', 5], ['2026-03-01', 2], ['2026-04-01', 7]]) {
    for (let i = 0; i < length; i++) logs[addDays(start, i)] = { period: true };
  }
  const result = analyzeCycles(logs, { today: '2026-03-02' });
  assert.deepEqual(result.periodStats, { count: 2, average: 4, min: 3, max: 5 });
  assert.deepEqual(analyzeCycles({}, { today: '2026-03-02' }).periodStats, { count: 0, average: null, min: null, max: null });
});

test('period-duration statistics use the recent window independently of cycle-gap review', () => {
  const logs = {};
  for (let month = 1; month <= 8; month++) {
    const start = `2026-${String(month).padStart(2, '0')}-01`;
    for (let i = 0; i < month; i++) logs[addDays(start, i)] = { period: true };
  }
  const result = analyzeCycles(logs, { today: '2026-09-01' });
  assert.deepEqual(result.periodStats, { count: 6, average: 5.5, min: 3, max: 8 });
});

test('under-18 fertility is opt-in and pregnancy suppresses all cycle estimates', () => {
  const { logs, today } = makeLogs([28, 28, 28]);
  assert.equal(analyzeCycles(logs, { today, ageGroup: 'under18' }).ovulation, null);
  const optedIn = analyzeCycles(logs, { today, ageGroup: 'under18', fertilityEnabled: true });
  assert.ok(optedIn.ovulation);
  assert.ok(optedIn.fertile);
  const pregnant = analyzeCycles(logs, { today, pregnancyEnabled: true });
  assert.equal(pregnant.prediction, null);
  assert.equal(pregnant.ovulation, null);
  assert.equal(pregnant.fertile, null);
});

test('symptom patterns appear only after at least three distinct cycles', () => {
  const { logs, starts, today } = makeLogs([28, 28, 28, 28]);
  logs[starts[0]].symptoms = ['cramps'];
  logs[starts[1]].symptoms = ['cramps'];
  assert.equal(analyzeCycles(logs, { today }).patterns.length, 0);
  logs[starts[2]].symptoms = ['cramps'];
  const pattern = analyzeCycles(logs, { today }).patterns.find(item => item.id === 'earlyCramps');
  assert.equal(pattern.count, 3);
  assert.deepEqual(pattern.days, [1, 2]);
});

test('symptom-pattern summaries use distinct logged cycles, respect tracking choices, and preserve missing-day positions', () => {
  const { logs, starts, today } = makeLogs([28, 28, 28, 28]);
  for (let index = 0; index < 3; index++) {
    logs[addDays(starts[index], 2)].symptoms = ['headache', 'cramps'];
    const beforePeriod = addDays(starts[index + 1], -1);
    logs[beforePeriod] = { date: beforePeriod, period: false, symptoms: ['headache'], mood: 'okay', energy: 'okay' };
  }
  const analysis = analyzeCycles(logs, { today, trackedSymptoms: ['headache', 'cramps'] });
  const early = analysis.patterns.find(item => item.id === 'loggedSymptomPattern' && item.window === 'earlyCycle' && item.symptomId === 'headache');
  assert.deepEqual({ count: early.count, days: early.days, total: early.total }, { count: 3, days: [1, 5], total: 4 });
  const before = analysis.patterns.find(item => item.id === 'loggedSymptomPattern' && item.window === 'beforePeriod' && item.symptomId === 'headache');
  assert.deepEqual({ count: before.count, days: before.days, total: before.total }, { count: 3, days: 5, total: 3 });
  assert.equal(analysis.patterns.some(item => item.id === 'earlyCramps'), false, 'a logged symptom on day 3 must not be reported as a day 1–2 pattern');
  const crampsOnly = analyzeCycles(logs, { today, trackedSymptoms: ['cramps'] });
  assert.equal(crampsOnly.patterns.some(item => item.symptomId === 'headache'), false);
});

test('demo has enough history, uncertain irregular prediction and reproducible local dates', () => {
  const state = createDemoData('2026-10-22');
  const result = analyzeCycles(state.logs, { ...state.profile, today: '2026-10-22' });
  assert.equal(result.periods.length, 8);
  assert.equal(result.irregular, true);
  assert.ok(result.prediction?.from < result.prediction?.to);
  assert.equal(result.ovulation, null);
  assert.equal(result.cycleDay, 12);
  assert.equal(result.recentCycles.length, CONFIG.recentCycleLimit);
});

test('regular 28-day cycle phase uses the uncertainty window and labels estimates', () => {
  const { logs, starts } = makeLogs([28, 28, 28]);
  const start = starts.at(-1);
  assert.deepEqual(analyzeCycles(logs, { today: addDays(start, 2) }).phase, { id: 'menstrual', estimated: false });
  assert.deepEqual(analyzeCycles(logs, { today: addDays(start, 8) }).phase, { id: 'beforeOvulation', estimated: true });
  assert.deepEqual(analyzeCycles(logs, { today: addDays(start, 12) }).phase, { id: 'aroundOvulation', estimated: true });
  assert.deepEqual(analyzeCycles(logs, { today: addDays(start, 16) }).phase, { id: 'aroundOvulation', estimated: true });
  assert.deepEqual(analyzeCycles(logs, { today: addDays(start, 20) }).phase, { id: 'afterOvulation', estimated: true });
});

test('phase education does not enable hidden under-18 fertility dates', () => {
  const { logs, today } = makeLogs([28, 28, 28]);
  const result = analyzeCycles(logs, { today, ageGroup: 'under18', fertilityEnabled: false });
  assert.equal(result.ovulation, null);
  assert.equal(result.fertile, null);
  assert.equal(result.phase?.id, 'beforeOvulation');
  assert.equal(result.phase?.estimated, true);
});

test('phase is withheld for irregular, pregnancy, suspected gap, overdue, and insufficient history', () => {
  const irregular = makeLogs([26, 31, 29, 35, 27, 30]);
  assert.equal(analyzeCycles(irregular.logs, { today: irregular.today }).phase, null);
  const regular = makeLogs([28, 28, 28]);
  assert.equal(analyzeCycles(regular.logs, { today: regular.today, pregnancyEnabled: true }).phase, null);
  const gap = makeLogs([28, 28, 58, 28]);
  assert.equal(analyzeCycles(gap.logs, { today: gap.today }).phase, null);
  assert.equal(analyzeCycles(regular.logs, { today: addDays(regular.starts.at(-1), 31) }).phase, null);
  const insufficient = makeLogs([28, 28]);
  assert.equal(analyzeCycles(insufficient.logs, { today: insufficient.today }).phase, null);
  assert.equal(analyzeCycles({}, { today: '2026-10-22' }).phase, null);
});

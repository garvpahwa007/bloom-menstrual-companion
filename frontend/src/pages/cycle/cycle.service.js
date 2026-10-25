import CONFIG from '../../config/app.config.js';
import { addDays, daysBetween, todayISO } from '../../utilities/date.helper.js';

const mean = values => values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null;
export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
const sortedLogs = logs => Object.entries(logs || {}).map(([date, log]) => ({ ...log, date })).sort((a, b) => a.date.localeCompare(b.date));

/** Consecutive explicitly logged period days form one episode. Spotting alone is not counted. */
export function getPeriods(logs = {}) {
  const periods = [];
  for (const log of sortedLogs(logs).filter(log => log.period === true)) {
    const last = periods.at(-1);
    if (last && daysBetween(last.end, log.date) === 1) {
      last.end = log.date;
      last.length = daysBetween(last.start, last.end) + 1;
    } else {
      periods.push({ start: log.date, end: log.date, length: 1 });
    }
  }
  return periods;
}

function findPatterns(logs, cycles, trackedSymptoms) {
  const windowLogs = (cycle, days, beforePeriod = false) => Array.from({ length: days }, (_, index) =>
    logs[addDays(beforePeriod ? cycle.end : cycle.start, beforePeriod ? -index : index)]);
  const observed = cycles.filter(cycle => Object.keys(logs).some(date => date >= cycle.start && date <= cycle.end));
  const periodCycles = observed.filter(cycle => (cycle.periodLength || 0) > 0);
  const earlyWindows = periodCycles.map(cycle => ({ cycle, entries: windowLogs(cycle, CONFIG.symptomPatternPeriodDays) })).filter(item => item.entries.some(Boolean));
  const prePeriodWindows = observed.map(cycle => ({ cycle, entries: windowLogs(cycle, CONFIG.prePeriodPatternDays, true) })).filter(item => item.entries.some(Boolean));
  const symptomIds = Array.isArray(trackedSymptoms)
    ? [...new Set(trackedSymptoms.filter(id => typeof id === 'string'))]
    : [...new Set(Object.values(logs).flatMap(log => Array.isArray(log?.symptoms) ? log.symptoms : []))];
  const patterns = [];
  const earlyCramps = earlyWindows.filter(item => item.entries.slice(0, CONFIG.earlyPeriodPatternDays).some(log => log?.symptoms?.includes('cramps')));
  if (symptomIds.includes('cramps') && earlyCramps.length >= CONFIG.minimumPatternCycles) patterns.push({ id: 'earlyCramps', count: earlyCramps.length, days: [1, CONFIG.earlyPeriodPatternDays], total: earlyWindows.length });
  const lowEnergy = prePeriodWindows.filter(item => item.entries.some(log => log?.energy === 'low'));
  if (lowEnergy.length >= CONFIG.minimumPatternCycles) patterns.push({ id: 'prePeriodEnergy', count: lowEnergy.length, days: CONFIG.prePeriodPatternDays, total: prePeriodWindows.length });
  const lowMood = prePeriodWindows.filter(item => item.entries.some(log => ['low', 'veryLow'].includes(log?.mood)));
  if (lowMood.length >= CONFIG.minimumPatternCycles) patterns.push({ id: 'prePeriodMood', count: lowMood.length, days: CONFIG.prePeriodPatternDays, total: prePeriodWindows.length });
  for (const symptomId of symptomIds.filter(id => id !== 'cramps').sort()) {
    const early = earlyWindows.filter(item => item.entries.slice(0, CONFIG.symptomPatternPeriodDays).some(log => log?.symptoms?.includes(symptomId)));
    if (early.length >= CONFIG.minimumPatternCycles) patterns.push({ id: 'loggedSymptomPattern', window: 'earlyCycle', symptomId, count: early.length, days: [1, CONFIG.symptomPatternPeriodDays], total: earlyWindows.length });
    const before = prePeriodWindows.filter(item => item.entries.some(log => log?.symptoms?.includes(symptomId)));
    if (before.length >= CONFIG.minimumPatternCycles) patterns.push({ id: 'loggedSymptomPattern', window: 'beforePeriod', symptomId, count: before.length, days: CONFIG.prePeriodPatternDays, total: prePeriodWindows.length });
  }
  return patterns;
}

export function analyzeCycles(logs = {}, options = {}) {
  const { today = todayISO(), ageGroup = 'under18', pregnancyEnabled = false, fertilityEnabled = ageGroup === 'adult', trackedSymptoms } = options;
  const visibleLogs = Object.fromEntries(Object.entries(logs).filter(([date]) => date <= today));
  const periods = getPeriods(visibleLogs);
  const cycles = [];
  const suspectedGaps = [];
  const acceptedLengths = [];
  const allLengths = periods.slice(0, -1).map((period, index) => daysBetween(period.start, periods[index + 1].start));
  for (let index = 0; index < periods.length - 1; index++) {
    const current = periods[index];
    const next = periods[index + 1];
    const length = daysBetween(current.start, next.start);
    const previousBaseline = median(acceptedLengths.slice(-CONFIG.recentCycleLimit));
    const otherLengths = allLengths.filter((_, otherIndex) => otherIndex !== index).slice(-CONFIG.recentCycleLimit);
    const baseline = previousBaseline ?? median(otherLengths);
    const unusuallyLong = baseline !== null
      ? length > Math.max(baseline * CONFIG.suspectedGapFactor, baseline + CONFIG.suspectedGapExtraDays)
      : length > CONFIG.suspectedGapWithoutHistoryDays;
    const confirmed = logs[next.start]?.confirmedGap === true;
    const cycle = { start: current.start, end: addDays(next.start, -1), length, periodLength: current.length, nextStart: next.start, confirmedGap: confirmed };
    if (unusuallyLong && !confirmed) {
      suspectedGaps.push({ ...cycle, id: `${current.start}_${next.start}` });
      continue;
    }
    cycles.push(cycle);
    acceptedLengths.push(length);
  }
  const recentCycles = cycles.slice(-CONFIG.recentCycleLimit);
  // The current episode is excluded if bleeding was logged today. Missing days
  // can split an episode: these are diary summaries, not measured durations.
  const recordedPeriods = periods.filter(period => period.end < today).slice(-CONFIG.recentCycleLimit);
  const periodLengths = recordedPeriods.map(period => period.length);
  const periodStats = {
    count: periodLengths.length,
    average: mean(periodLengths),
    min: periodLengths.length ? Math.min(...periodLengths) : null,
    max: periodLengths.length ? Math.max(...periodLengths) : null,
  };
  const lengths = recentCycles.map(cycle => cycle.length);
  const middle = median(lengths);
  const average = mean(lengths);
  const min = lengths.length ? Math.min(...lengths) : null;
  const max = lengths.length ? Math.max(...lengths) : null;
  const spread = lengths.length ? max - min : 0;
  const irregular = lengths.length >= CONFIG.minimumCompleteCycles && spread > CONFIG.irregularSpreadDays;
  const lastPeriod = periods.at(-1);
  const cycleDay = lastPeriod ? daysBetween(lastPeriod.start, today) + 1 : null;
  let prediction = null;
  let ovulation = null;
  let fertile = null;
  let phase = null;
  // An unresolved possible missed log blocks estimates rather than quietly treating it as a long cycle.
  if (!pregnancyEnabled && lengths.length >= CONFIG.minimumCompleteCycles && !suspectedGaps.length && lastPeriod) {
    const expected = addDays(lastPeriod.start, Math.round(middle));
    const margin = Math.max(CONFIG.minimumPredictionMarginDays, spread) + (irregular ? CONFIG.irregularExtraMarginDays : 0);
    prediction = { expected, from: addDays(expected, -margin), to: addDays(expected, margin), margin };
    if (!irregular) {
      const ovulationWindow = { from: addDays(prediction.from, -CONFIG.ovulationBeforePeriodDays), to: addDays(prediction.to, -CONFIG.ovulationBeforePeriodDays) };
      if (fertilityEnabled) {
        ovulation = ovulationWindow;
        fertile = { from: addDays(ovulation.from, -CONFIG.fertileDaysBeforeOvulation), to: addDays(ovulation.to, CONFIG.fertileDaysAfterOvulation) };
      }
      // A calendar phase is educational context, not evidence that ovulation
      // occurred. Do not extrapolate it beyond an expired prediction window.
      if (today <= prediction.to) {
        if (visibleLogs[today]?.period === true) phase = { id: 'menstrual', estimated: false };
        else phase = { id: today < ovulationWindow.from ? 'beforeOvulation' : today <= ovulationWindow.to ? 'aroundOvulation' : 'afterOvulation', estimated: true };
      }
    }
  }
  return { periods, periodStats, cycles, recentCycles, median: middle, average, min, max, spread, irregular, cycleDay, prediction, ovulation, fertile, phase, suspectedGaps, patterns: findPatterns(visibleLogs, recentCycles, trackedSymptoms) };
}
export default analyzeCycles;

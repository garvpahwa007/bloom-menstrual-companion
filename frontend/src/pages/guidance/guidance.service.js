import CONFIG from '../../config/app.config.js';
import { RED_FLAGS } from '../../constants/redflag.constant.js';
import { analyzeCycles, getPeriods } from '../cycle/cycle.service.js';
import { addDays, dateRange, daysBetween, todayISO } from '../../utilities/date.helper.js';

const hasAny = (log, ids) => ids.some(id => log.symptoms?.includes(id));
const isHeavy = log => (log.period !== false && log.flow === 'heavy') || log.padFrequent === true || log.largeClots === true;
const unique = dates => [...new Set(dates)].sort();

export function evaluateGuidance(logs = {}, profile = {}, { today = todayISO(), dismissals = {} } = {}) {
  const entries = Object.entries(logs).filter(([date]) => date <= today).map(([date, log]) => ({ ...log, date })).sort((a, b) => a.date.localeCompare(b.date));
  const cards = [];
  const addCard = (id, dates, details = {}) => {
    const rule = RED_FLAGS.find(item => item.id === id);
    const evidence = unique(dates);
    if (!evidence.length || !rule) return;
    const signature = `${id}:${evidence.join(',')}`;
    if (dismissals[id] === signature || dismissals[signature] === true) return;
    const source = profile.ageGroup === 'under18' && rule.adolescentSource ? rule.adolescentSource : rule.source;
    cards.push({ id, severity: rule.severity, dates: evidence, signature, source, ...details });
  };

  // Immediate help is for symptoms marked today or yesterday. Historical entries
  // remain in the visit summary rather than being presented as a current crisis.
  const active = entries.filter(log => log.date >= addDays(today, -1));
  addCard('urgentPain', active.filter(log => log.urgentPain || (log.painUnrelieved && Number(log.pain) >= CONFIG.severePainMinimum)).map(log => log.date));
  addCard('urgentBleeding', active.filter(log => isHeavy(log) && (log.fainting || hasAny(log, ['dizziness']))).map(log => log.date));
  addCard('pregnancyUrgent', active.filter(log => (profile.pregnancyEnabled || log.pregnancyPossible) && (log.period || log.betweenBleeding || log.afterSexBleeding || log.flow === 'spotting' || log.urgentPain || Number(log.pain) >= CONFIG.severePainMinimum)).map(log => log.date));

  if (profile.pregnancyEnabled) {
    // If a person notices reduced movement, they should not be told to wait for
    // an arbitrary pregnancy-week threshold before contacting maternity care.
    const dangerSymptoms = ['severeHeadache', 'blurredVision', 'swellingFaceHands', 'fever', 'fluidLeaking', 'reducedMovement'];
    addCard('pregnancyDanger', active.filter(log => hasAny(log, dangerSymptoms)).map(log => log.date));
  } else {
    const periods = getPeriods(Object.fromEntries(entries.map(log => [log.date, log])));
    const analysis = analyzeCycles(logs, { ...profile, today });
    addCard('longPeriod', periods.filter(period => period.length > CONFIG.maximumPeriodDays).flatMap(period => dateRange(period.start, period.end)));
    addCard('heavyFlow', entries.filter(log => log.padFrequent || log.largeClots).map(log => log.date));
    const max = profile.ageGroup === 'adult' ? CONFIG.adultMaximumCycleDays : CONFIG.adolescentMaximumCycleDays;
    const unusual = cycle => cycle.length < CONFIG.minimumCycleDays || cycle.length > max;
    const unusualCycles = analysis.cycles.filter(unusual);
    addCard('cycleVariation', unusualCycles.flatMap(cycle => [cycle.start, cycle.nextStart]), { minimum: CONFIG.minimumCycleDays, maximum: max });
    let run = [];
    const consecutive = [];
    for (const cycle of analysis.cycles) {
      if (!unusual(cycle)) { run = []; continue; }
      if (run.length && run.at(-1).nextStart !== cycle.start) run = [];
      run.push(cycle);
      if (run.length >= CONFIG.consecutiveUnusualCycles) consecutive.push(...run.flatMap(item => [item.start, item.nextStart]));
    }
    addCard('irregularConsecutive', consecutive, { minimum: CONFIG.minimumCycleDays, maximum: max });
    const last = periods.at(-1);
    if (last && daysBetween(last.start, today) >= CONFIG.noPeriodDays) addCard('noPeriod', [last.start, today]);
    addCard('betweenBleeding', entries.filter(log => log.betweenBleeding || log.afterSexBleeding).map(log => log.date));
    addCard('disruptivePain', entries.filter(log => log.painDisrupts || log.painUnrelieved).map(log => log.date));
    const anemiaDates = [];
    for (const period of periods) {
      const days = entries.filter(log => log.date >= period.start && log.date <= period.end);
      const heavyDays = days.filter(isHeavy);
      const symptomDays = days.filter(log => hasAny(log, ['tiredness', 'breathlessness', 'dizziness']));
      if (heavyDays.length && symptomDays.length) anemiaDates.push(...heavyDays.map(log => log.date), ...symptomDays.map(log => log.date));
    }
    for (const log of entries) if (isHeavy(log) && hasAny(log, ['tiredness', 'breathlessness', 'dizziness'])) anemiaDates.push(log.date);
    addCard('anemiaSymptoms', anemiaDates);
  }

  let lowRun = [];
  const lowDays = [];
  for (const log of entries) {
    if (log.mood !== 'veryLow') { lowRun = []; continue; }
    if (lowRun.length && daysBetween(lowRun.at(-1), log.date) !== 1) lowRun = [];
    lowRun.push(log.date);
    if (lowRun.length >= CONFIG.consecutiveVeryLowMoodDays) lowDays.push(...lowRun);
  }
  addCard('veryLowMood', lowDays);
  const order = { urgent: 0, support: 1, consult: 2 };
  return cards.sort((a, b) => order[a.severity] - order[b.severity]);
}
export default evaluateGuidance;

import { analyzeCycles } from './cycle.js';
import { evaluateGuidance } from './guidance.js';
import { daysBetween, todayISO } from './dates.js';

const object = value => value && typeof value === 'object' && !Array.isArray(value);
const validDate = value => {
  try { return typeof value === 'string' && daysBetween(value, value) === 0; }
  catch { return false; }
};

/**
 * A compact, all-history clinical-visit overview. Only explicit, useful fields
 * cross this boundary: private diary notes, PIN state and settings never do.
 * Symptom counts are numbers of logged days, not diagnoses or prevalence.
 */
export function buildVisitSummary(state, { today = todayISO() } = {}) {
  const input = object(state) ? state : {};
  const sourceLogs = object(input.logs) ? input.logs : {};
  const entries = Object.entries(sourceLogs)
    .filter(([date, log]) => validDate(date) && date <= today && object(log))
    .sort(([left], [right]) => left.localeCompare(right));
  const logs = Object.fromEntries(entries.map(([date, log]) => [date, { ...log, date, symptoms: Array.isArray(log.symptoms) ? log.symptoms.filter(id => typeof id === 'string') : [] }]));
  const profile = object(input.profile) ? input.profile : {};
  const analysis = analyzeCycles(logs, { ...profile, today });
  const symptoms = new Map();
  const symptomIntensity = new Map();
  const medicines = new Map();
  let maxPain = 0;
  let daysDisrupted = 0;
  let daysUnrelieved = 0;
  for (const [date] of entries) {
    const log = logs[date];
    for (const id of new Set(log.symptoms)) symptoms.set(id, (symptoms.get(id) || 0) + 1);
    if (object(log.symptomIntensity)) for (const [id, level] of Object.entries(log.symptomIntensity)) {
      if (!log.symptoms.includes(id) || !Number.isInteger(level) || level < 1 || level > 3) continue;
      const counts = symptomIntensity.get(id) || { mild: 0, moderate: 0, strong: 0, ratedDays: 0 };
      counts[['mild', 'moderate', 'strong'][level - 1]]++;
      counts.ratedDays++;
      symptomIntensity.set(id, counts);
    }
    if (Number.isFinite(log.pain)) maxPain = Math.max(maxPain, log.pain);
    if (log.painDisrupts === true) daysDisrupted++;
    if (log.painUnrelieved === true) daysUnrelieved++;
    const medicine = typeof log.medicines === 'string' ? log.medicines.trim() : '';
    if (medicine) medicines.set(medicine, [...(medicines.get(medicine) || []), date]);
  }
  return {
    cycles: analysis.cycles.map(({ start, end, nextStart, length, periodLength }) => ({ start, end, nextStart, length, periodLength })),
    periods: analysis.periods.map(period => ({ ...period, ongoing: period.end === today && logs[today]?.period === true })),
    symptomCounts: [...symptoms].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id)),
    symptomIntensityCounts: [...symptomIntensity].map(([id, counts]) => ({ id, ...counts })).sort((a, b) => b.ratedDays - a.ratedDays || a.id.localeCompare(b.id)),
    pain: { max: maxPain, daysDisrupted, daysUnrelieved },
    medicines: [...medicines].map(([name, dates]) => ({ name, dates })),
    // Dismissal only changes the app view. The visit overview retains evidence.
    guidance: evaluateGuidance(logs, profile, { today, dismissals: {} }).map(({ id, severity, dates }) => ({ id, severity, dates })),
    dateRange: { from: entries[0]?.[0] || null, to: entries.at(-1)?.[0] || null },
    loggedDays: entries.length,
  };
}
export default buildVisitSummary;

import CONFIG from '../../config/app.config.js';
import { SYMPTOMS } from '../../constants/symptom.constant.js';
import { analyzeCycles } from '../cycle/cycle.service.js';
import { todayISO } from '../../utilities/date.helper.js';

const symptomIds = new Set(SYMPTOMS.map(item => item.id));

/** Return only the four fields the user can separately choose to share with AI. */
export function buildCycleSummary(state, today = todayISO()) {
  const profile = state?.profile || {};
  const logs = state?.logs || {};
  const analysis = analyzeCycles(logs, {
    today,
    ageGroup: profile.ageGroup === 'adult' ? 'adult' : 'under18',
    pregnancyEnabled: profile.pregnancyEnabled === true,
    fertilityEnabled: false,
    trackedSymptoms: [],
  });
  const latestCompletedCycle = analysis.recentCycles.at(-1) || null;
  const symptoms = new Set();
  if (latestCompletedCycle) {
    for (const [date, log] of Object.entries(logs)) {
      if (date < latestCompletedCycle.start || date > latestCompletedCycle.end) continue;
      for (const id of Array.isArray(log?.symptoms) ? log.symptoms : []) {
        if (symptomIds.has(id)) symptoms.add(id);
      }
    }
  }
  return {
    averageCycleLength: analysis.average === null ? null : Math.round(analysis.average),
    regularity: analysis.recentCycles.length < CONFIG.minimumCompleteCycles
      ? 'notEnoughData'
      : analysis.irregular ? 'irregular' : 'regular',
    lastPeriodDate: analysis.periods.at(-1)?.start || null,
    symptoms: [...symptoms].sort(),
  };
}

import { addDays, todayISO } from '../utilities/date.helper.js';
import { SYMPTOMS } from '../constants/symptom.constant.js';

const basicLog = date => ({ date, period: false, flow: 'medium', padFrequent: false, largeClots: false, pain: 0, painDisrupts: false, painUnrelieved: false, symptoms: [], mood: 'okay', energy: 'okay', sleep: 8, medicines: '', note: '', betweenBleeding: false, afterSexBleeding: false, pregnancyPossible: false, urgentPain: false, fainting: false, confirmedGap: false });

/** Eight months of clearly labelled, fictional logs, anchored to the local demo day. */
export function createDemoData(today = todayISO()) {
  const lengths = [29, 31, 28, 39, 30, 27, 32];
  const lastStart = addDays(today, -11);
  const starts = [lastStart];
  for (let index = lengths.length - 1; index >= 0; index--) starts.unshift(addDays(starts[0], -lengths[index]));
  const logs = {};
  starts.forEach((start, periodIndex) => {
    const periodLength = periodIndex === 4 ? 8 : periodIndex % 3 === 0 ? 6 : 5;
    for (let day = 0; day < periodLength; day++) {
      const date = addDays(start, day);
      const log = basicLog(date);
      log.period = true;
      log.flow = day < 2 ? 'heavy' : day < 4 ? 'medium' : 'light';
      log.pain = day < 2 ? 6 : day < 4 ? 3 : 1;
      log.symptoms = day < 2 ? ['cramps', 'tiredness'] : day < 4 ? ['bloating'] : [];
      log.painDisrupts = day === 0 && periodIndex >= 4;
      log.padFrequent = day === 0 && periodIndex === 4;
      log.largeClots = day === 1 && periodIndex === 4;
      log.mood = day < 2 ? 'low' : 'okay';
      log.energy = day < 2 ? 'low' : 'okay';
      log.sleep = day < 2 ? 6.5 : 8;
      logs[date] = log;
    }
    if (periodIndex > 0) {
      for (let before = 1; before <= 3; before++) {
        const date = addDays(start, -before);
        logs[date] = { ...basicLog(date), symptoms: ['moodChanges'], energy: 'low', mood: 'low', sleep: 7 };
      }
    }
  });
  logs[today] = { ...basicLog(today), mood: 'good', energy: 'okay', sleep: 8 };
  return {
    version: 1,
    demo: true,
    profile: { ageGroup: 'under18', pregnancyEnabled: false, pregnancyConfirmed: false, lastPeriodDate: '', fertilityEnabled: false },
    settings: { language: 'en', textSize: 'normal', highContrast: false, readAloud: false, discreet: false, trackedSymptoms: SYMPTOMS.slice(0, 12).map(symptom => symptom.id) },
    logs,
    reminders: [],
    dismissals: {},
  };
}
export default createDemoData;

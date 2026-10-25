/** Product thresholds are kept together. These support reflection, not diagnosis.
 * Medical sources for guidance are attached to each rule in data/redflags.js.
 * Prediction thresholds are prototype design choices, not clinical cut-offs.
 */
export const CONFIG = Object.freeze({
  version: 1,
  recentCycleLimit: 6,
  minimumCompleteCycles: 3,
  minimumPredictionMarginDays: 2,
  irregularSpreadDays: 7,
  irregularExtraMarginDays: 2,
  ovulationBeforePeriodDays: 14,
  fertileDaysBeforeOvulation: 5,
  fertileDaysAfterOvulation: 1,
  symptomPatternPeriodDays: 5,
  suspectedGapFactor: 1.7,
  suspectedGapExtraDays: 14,
  suspectedGapWithoutHistoryDays: 60,
  minimumCycleDays: 21,
  adultMaximumCycleDays: 35,
  adolescentMaximumCycleDays: 45,
  consecutiveUnusualCycles: 3,
  maximumPeriodDays: 7,
  noPeriodDays: 90,
  consecutiveVeryLowMoodDays: 3,
  minimumPatternCycles: 3,
  prePeriodPatternDays: 5,
  earlyPeriodPatternDays: 2,
  pregnancyLengthDays: 280,
  maximumPregnancyWeek: 42,
  pregnancyMovementWeek: 28,
  daysPerWeek: 7,
  painScaleMaximum: 10,
  // Product trigger for a user-reported severe numeric pain score, not a diagnosis.
  severePainMinimum: 7,
  pinLength: 4,
  pbkdf2Iterations: 310000,
  encryptionSaltBytes: 16,
  encryptionIvBytes: 12,
  maximumImportBytes: 5000000,
  maximumEncryptedBackupBytes: 6800000,
  maximumSleepHours: 24,
  sleepInputStep: 0.5,
  historyChartCycles: 8,
  reminderPollMilliseconds: 30000
});
export default CONFIG;

/** Rules are signals to seek care, never diagnoses. Copy is translated in i18n.
 * Three-cycle aggregation is a product display choice; cycleVariation also offers
 * care after a single unusual completed cycle so advice is never withheld.
 */
const sources = {
  heavy: { name: 'NHS — Heavy periods', url: 'https://www.nhs.uk/conditions/heavy-periods/' },
  irregular: { name: 'NHS — Irregular periods', url: 'https://www.nhs.uk/symptoms/irregular-periods/' },
  adolescent: { name: 'ACOG — Menstruation in Girls and Adolescents: Using the Menstrual Cycle as a Vital Sign', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign' },
  absent: { name: 'NHS — Stopped or missed periods', url: 'https://www.nhs.uk/conditions/stopped-or-missed-periods/' },
  bleeding: { name: 'NHS — Vaginal bleeding between periods or after sex', url: 'https://www.nhs.uk/symptoms/vaginal-bleeding-between-periods-or-after-sex/' },
  pain: { name: 'NHS — Period pain', url: 'https://www.nhs.uk/conditions/period-pain/' },
  pelvic: { name: 'NHS — Pelvic pain', url: 'https://www.nhs.uk/conditions/pelvic-pain/' },
  pregnancy: { name: 'NHS — Stomach pain in pregnancy', url: 'https://www.nhs.uk/pregnancy/related-conditions/common-symptoms/stomach-pain/' },
  pregnancyUrgent: { name: 'NHS — Pregnancy symptoms you need to get help for', url: 'https://www.nhs.uk/pregnancy/common-symptoms/pregnancy-symptoms-you-need-to-get-help-for/' },
  movements: { name: 'Newcastle Hospitals NHS — Reduced fetal movements', url: 'https://www.newcastle-hospitals.nhs.uk/services/maternity/during-pregnancy/maternity-assessment-unit/reduced-fetal-movements/' },
  lowMood: { name: 'Ministry of Health and Family Welfare — Tele-MANAS', url: 'https://telemanas.mohfw.gov.in/' },
};
export const RED_FLAGS = [
  { id: 'longPeriod', severity: 'consult', threshold: 'maximumPeriodDays', source: sources.heavy },
  { id: 'heavyFlow', severity: 'consult', source: sources.heavy },
  { id: 'cycleVariation', severity: 'consult', thresholds: ['minimumCycleDays', 'adultMaximumCycleDays', 'adolescentMaximumCycleDays'], source: sources.irregular, adolescentSource: sources.adolescent },
  { id: 'irregularConsecutive', severity: 'consult', threshold: 'consecutiveUnusualCycles', source: sources.irregular, adolescentSource: sources.adolescent },
  { id: 'noPeriod', severity: 'consult', threshold: 'noPeriodDays', source: sources.adolescent },
  { id: 'betweenBleeding', severity: 'consult', source: sources.bleeding },
  { id: 'disruptivePain', severity: 'consult', source: sources.pain },
  { id: 'anemiaSymptoms', severity: 'consult', source: sources.heavy },
  { id: 'urgentPain', severity: 'urgent', threshold: 'severePainMinimum', source: sources.pelvic, additionalSources: [sources.pain] },
  { id: 'urgentBleeding', severity: 'urgent', source: sources.pelvic },
  { id: 'pregnancyUrgent', severity: 'urgent', source: sources.pregnancy },
  { id: 'pregnancyDanger', severity: 'urgent', source: sources.pregnancyUrgent, additionalSources: [sources.movements] },
  { id: 'veryLowMood', severity: 'support', threshold: 'consecutiveVeryLowMoodDays', source: sources.lowMood },
];
export default RED_FLAGS;

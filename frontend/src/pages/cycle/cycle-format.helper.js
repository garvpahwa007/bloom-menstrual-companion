export const locale = lang => lang === 'hi' ? 'hi-IN' : 'en-IN';
export const dateObject = value => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const dateText = (value, lang, options = { day: 'numeric', month: 'short' }) => value ? new Intl.DateTimeFormat(locale(lang), options).format(dateObject(value)) : '—';
export const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const isLocalDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && localDate(dateObject(value)) === value;
export const rangeText = (range, lang) => range ? `${dateText(range.from, lang)} – ${dateText(range.to, lang)}` : '—';
export const dayNumbers = (days, lang) => (Array.isArray(days) ? days : [days]).map(day => new Intl.NumberFormat(locale(lang)).format(day)).join('–');
export const getPatternText = (pattern, t) => pattern.id === 'loggedSymptomPattern'
  ? t(`tracking.pattern.${pattern.window === 'earlyCycle' ? 'loggedEarlySymptom' : 'loggedPrePeriodSymptom'}`, { symptom: t(`tracking.symptom.${pattern.symptomId}`), count: pattern.count, days: Array.isArray(pattern.days) ? pattern.days.join('–') : pattern.days })
  : t(`tracking.pattern.${pattern.id}`, { count: pattern.count, days: Array.isArray(pattern.days) ? pattern.days.join('–') : pattern.days });

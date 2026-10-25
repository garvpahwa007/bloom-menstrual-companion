const DAY_MS = 86400000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Converts a calendar date to an ordinal only for arithmetic. No saved date is a timestamp. */
function ordinal(value) {
  if (typeof value !== 'string' || !ISO.test(value)) throw new TypeError('Use a local date in YYYY-MM-DD format.');
  const [year, month, day] = value.split('-').map(Number);
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new RangeError('Invalid calendar date.');
  return time / DAY_MS;
}

export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function addDays(value, number) {
  const d = new Date((ordinal(value) + Number(number)) * DAY_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function daysBetween(start, end) { return ordinal(end) - ordinal(start); }

export function formatDate(value, language = 'en', options = {}) {
  if (!value) return '';
  ordinal(value);
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', ...options }).format(new Date(year, month - 1, day, 12));
}

export function monthLabel(value, language = 'en') {
  return formatDate(value.length === 7 ? `${value}-01` : value, language, { month: 'long', year: 'numeric', day: undefined });
}

/** Inclusive dates for a calendar span. A defensive limit prevents accidental huge arrays. */
export function dateRange(start, end) {
  const count = daysBetween(start, end);
  if (count < 0) return [];
  if (count > 20000) throw new RangeError('Date range is too large.');
  return Array.from({ length: count + 1 }, (_, index) => addDays(start, index));
}

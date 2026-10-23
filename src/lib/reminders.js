/**
 * Reminders are local and opt-in. They are checked only while the app runs.
 * A reminder can catch up later on its scheduled day (time >= reminder.time).
 * The caller must keep a per-day fired set so repeated checks do not repeat it.
 * No background delivery, timer accuracy, or closed-browser alarm is promised.
 */
export const DEFAULT_REMINDERS = Object.freeze([
  Object.freeze({ id: 'daily-checkin', type: 'daily', title: '', time: '20:00', enabled: false }),
  Object.freeze({ id: 'period-estimate', type: 'period', title: '', time: '09:00', enabled: false }),
]);

const TYPES = new Set(['daily', 'period', 'medicine', 'custom', 'checkup']);
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function buildReminderMessage(reminder = {}, settings = {}, t) {
  if (settings.discreet) return { title: t('app.diary'), body: t('reminders.neutral') };
  const fallback = reminder.type === 'period' ? 'reminders.expected'
    : reminder.type === 'checkup' ? 'reminders.checkupBody'
      : reminder.type === 'medicine' ? 'reminders.medicineBody'
        : 'reminders.checkin';
  return { title: t('app.name'), body: reminder.title?.trim() || t(fallback) };
}

export function isReminderDue(reminder, { today, time, analysis, profile } = {}) {
  if (!reminder || reminder.enabled !== true || !TYPES.has(reminder.type)) return false;
  if (!DATE.test(today || '') || !TIME.test(time || '') || !TIME.test(reminder.time || '')) return false;
  const recurrence = reminder.recurrence;
  if (recurrence && !['once', 'daily', 'weekly'].includes(recurrence.frequency)) return false;
  if (recurrence?.frequency === 'once' || (reminder.date && !recurrence)) {
    if (!DATE.test(reminder.date || '') || reminder.date !== today) return false;
  } else {
    if (reminder.date && today < reminder.date) return false;
    if (recurrence?.frequency === 'weekly') {
      if (!Array.isArray(recurrence.weekdays) || !recurrence.weekdays.length || recurrence.weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(recurrence.weekdays).size !== recurrence.weekdays.length) return false;
      const [year, month, day] = today.split('-').map(Number);
      if (!recurrence.weekdays.includes(new Date(year, month - 1, day, 12).getDay())) return false;
    }
  }
  if (time < reminder.time) return false;
  if (reminder.type === 'period') return !profile?.pregnancyEnabled && analysis?.prediction?.from === today;
  return true;
}

export function deliverReminder(reminder, { settings = {}, t, onBanner, NotificationClass = globalThis.Notification } = {}) {
  const message = buildReminderMessage(reminder, settings, t);
  // The in-app banner is always shown, even when browser notifications work.
  // Keeping it first also preserves fallback if a browser constructor throws.
  if (typeof onBanner !== 'function') throw new TypeError('An in-app banner handler is required.');
  onBanner(message.body);
  let browser = false;
  try {
    if (typeof NotificationClass === 'function' && NotificationClass.permission === 'granted') {
      new NotificationClass(message.title, { body: message.body });
      browser = true;
    }
  } catch {
    // Some browsers expose the API but do not permit page-created notices.
    // The banner above remains the supported, local fallback.
  }
  return { banner: true, browser, message };
}

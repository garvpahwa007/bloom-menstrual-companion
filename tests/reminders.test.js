import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_REMINDERS, buildReminderMessage, isReminderDue, deliverReminder } from '../src/lib/reminders.js';
import { translator } from '../src/i18n/index.js';

const t = key => ({
  'app.name': 'Bloom', 'app.diary': 'Diary', 'reminders.neutral': 'Time to check in',
  'reminders.expected': 'Your estimated period window begins today.',
  'reminders.checkupBody': 'A reminder for the appointment you chose.',
  'reminders.medicineBody': 'Time for your chosen medicine reminder.',
  'reminders.checkin': 'Take a moment for your daily check-in.',
}[key] || key);
const today = '2026-10-22';
const reminder = (patch = {}) => ({ id: 'test-reminder', type: 'daily', title: '', time: '09:00', enabled: true, ...patch });
const context = (patch = {}) => ({ today, time: '09:00', profile: { pregnancyEnabled: false }, analysis: { prediction: { from: today, to: '2026-10-28' } }, ...patch });

test('all offered default reminders start disabled', () => {
  assert.ok(DEFAULT_REMINDERS.length >= 2);
  for (const item of DEFAULT_REMINDERS) {
    assert.equal(item.enabled, false);
    assert.equal(isReminderDue(item, context()), false);
  }
});

test('disabled, missing and unsupported reminders never fire', () => {
  assert.equal(isReminderDue(reminder({ enabled: false }), context()), false);
  assert.equal(isReminderDue(null, context()), false);
  assert.equal(isReminderDue(reminder({ type: 'unknown' }), context()), false);
});

test('a local reminder is due at its time and catches up later while the app is open', () => {
  assert.equal(isReminderDue(reminder(), context({ time: '08:59' })), false);
  assert.equal(isReminderDue(reminder(), context({ time: '09:00' })), true);
  assert.equal(isReminderDue(reminder(), context({ time: '13:20' })), true);
});

test('date-specific check-up and medicine reminders apply only on their chosen day', () => {
  for (const type of ['checkup', 'medicine']) {
    assert.equal(isReminderDue(reminder({ type, date: today }), context()), true);
    assert.equal(isReminderDue(reminder({ type, date: '2026-10-21' }), context()), false);
    assert.equal(isReminderDue(reminder({ type, date: '2026-10-23' }), context()), false);
  }
});

test('personal reminders support one-time dates, daily repeats from a start date, and selected weekdays', () => {
  const once = reminder({ type: 'custom', date: today, recurrence: { frequency: 'once' } });
  assert.equal(isReminderDue(once, context()), true);
  assert.equal(isReminderDue(once, context({ today: '2026-10-23' })), false);

  const daily = reminder({ type: 'medicine', date: '2026-10-21', recurrence: { frequency: 'daily' } });
  assert.equal(isReminderDue(daily, context()), true);
  assert.equal(isReminderDue(daily, context({ today: '2026-10-20' })), false);

  const weekday = new Date(2026, 9, 22, 12).getDay();
  const weekly = reminder({ type: 'custom', date: '2026-10-20', recurrence: { frequency: 'weekly', weekdays: [weekday] } });
  assert.equal(isReminderDue(weekly, context()), true);
  assert.equal(isReminderDue(weekly, context({ today: '2026-10-23' })), false);
  assert.equal(isReminderDue(weekly, context({ today: '2026-10-22', profile: { pregnancyEnabled: true } })), true);
});

test('malformed recurrence rules never make a reminder due', () => {
  const invalid = [
    { frequency: 'once' },
    { frequency: 'weekly', weekdays: [] },
    { frequency: 'weekly', weekdays: [7] },
    { frequency: 'weekly', weekdays: [1, 1] },
    { frequency: 'monthly' },
  ];
  for (const recurrence of invalid) assert.equal(isReminderDue(reminder({ type: 'custom', recurrence }), context()), false);
});

test('malformed reminder and clock times are rejected', () => {
  for (const time of ['9:00', '24:00', '09:60', '', null]) assert.equal(isReminderDue(reminder({ time }), context()), false);
  for (const time of ['9:00', '24:00', '09:60', '', null]) assert.equal(isReminderDue(reminder(), context({ time })), false);
});

test('period notices depend on the estimate start and pause in pregnancy mode', () => {
  const item = reminder({ type: 'period' });
  assert.equal(isReminderDue(item, context()), true);
  assert.equal(isReminderDue(item, context({ profile: { pregnancyEnabled: true } })), false);
  assert.equal(isReminderDue(item, context({ analysis: { prediction: null } })), false);
  assert.equal(isReminderDue(item, context({ analysis: { prediction: { from: '2026-10-21' } } })), false);
});

test('non-period personal reminders remain available in pregnancy mode', () => {
  assert.equal(isReminderDue(reminder({ type: 'checkup', date: today }), context({ profile: { pregnancyEnabled: true } })), true);
});

test('reminder wording chooses the appropriate local fallback for each type', () => {
  assert.deepEqual(buildReminderMessage(reminder(), {}, t), { title: 'Bloom', body: t('reminders.checkin') });
  assert.equal(buildReminderMessage(reminder({ type: 'period' }), {}, t).body, t('reminders.expected'));
  assert.equal(buildReminderMessage(reminder({ type: 'medicine' }), {}, t).body, t('reminders.medicineBody'));
  assert.equal(buildReminderMessage(reminder({ type: 'checkup' }), {}, t).body, t('reminders.checkupBody'));
});

test('non-discreet wording can use the user-selected label', () => {
  assert.equal(buildReminderMessage(reminder({ type: 'custom', title: '  My appointment  ' }), {}, t).body, 'My appointment');
});

test('discreet mode replaces every custom, medicine and pregnancy label', () => {
  for (const type of ['daily', 'period', 'medicine', 'custom', 'checkup']) {
    const message = buildReminderMessage(reminder({ type, title: 'Private period medicine and pregnancy appointment' }), { discreet: true }, t);
    assert.deepEqual(message, { title: 'Diary', body: 'Time to check in' });
    assert.doesNotMatch(JSON.stringify(message), /period|medicine|pregnancy|appointment/i);
  }
});

test('discreet wording is translated without a custom label leaking into Hindi', () => {
  const hi = translator('hi');
  assert.deepEqual(buildReminderMessage(reminder({ title: 'Private medicine name' }), { discreet: true }, hi), { title: hi('app.diary'), body: hi('reminders.neutral') });
});

test('granted browser notifications also keep the in-app banner', () => {
  const banners = []; const notifications = [];
  class Granted { static permission = 'granted'; constructor(title, options) { notifications.push({ title, ...options }); } }
  const result = deliverReminder(reminder(), { t, onBanner: body => banners.push(body), NotificationClass: Granted });
  assert.deepEqual(banners, [t('reminders.checkin')]);
  assert.deepEqual(notifications, [{ title: 'Bloom', body: t('reminders.checkin') }]);
  assert.equal(result.banner, true); assert.equal(result.browser, true);
});

test('denied or default permission uses the banner without constructing a notification', () => {
  for (const permission of ['denied', 'default']) {
    const banners = []; let calls = 0;
    class Blocked { static permission = permission; constructor() { calls++; } }
    const result = deliverReminder(reminder(), { t, onBanner: body => banners.push(body), NotificationClass: Blocked });
    assert.equal(calls, 0); assert.equal(result.browser, false); assert.equal(result.banner, true); assert.equal(banners.length, 1);
  }
});

test('an unavailable or throwing browser notification API preserves the banner', () => {
  class Throwing { static permission = 'granted'; constructor() { throw new Error('Unsupported page notification'); } }
  class Restricted { static get permission() { throw new Error('Unavailable permission API'); } }
  for (const NotificationClass of [null, Throwing, Restricted]) {
    const banners = [];
    const result = deliverReminder(reminder(), { t, onBanner: body => banners.push(body), NotificationClass });
    assert.equal(result.browser, false); assert.equal(result.banner, true); assert.deepEqual(banners, [t('reminders.checkin')]);
  }
});

test('discreet browser delivery and banner both contain only neutral text', () => {
  const banners = []; let shown;
  class Granted { static permission = 'granted'; constructor(title, options) { shown = { title, ...options }; } }
  const result = deliverReminder(reminder({ type: 'medicine', title: 'Sensitive medicine name' }), { settings: { discreet: true }, t, onBanner: body => banners.push(body), NotificationClass: Granted });
  assert.deepEqual(shown, { title: 'Diary', body: 'Time to check in' });
  assert.deepEqual(banners, ['Time to check in']);
  assert.deepEqual(result.message, { title: 'Diary', body: 'Time to check in' });
});

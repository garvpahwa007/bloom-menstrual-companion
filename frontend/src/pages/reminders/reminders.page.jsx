import React, { useState } from 'react';
import { Bell, Plus, ShieldCheck, X } from 'lucide-react';
import PageHeading from '../../components/layout/page-heading.component.jsx';
import Toggle from '../../components/form/toggle.component.jsx';
import WeekdayPicker from './weekday-picker.component.jsx';
import { formatDate, todayISO } from '../../utilities/date.helper.js';
import { DEFAULT_REMINDERS, deliverReminder } from './reminder.service.js';

const defaultReminders = DEFAULT_REMINDERS;
const WEEKDAY_DEFAULT = [1, 2, 3, 4, 5];
const scheduleOf = reminder => reminder.recurrence?.frequency || (reminder.date ? 'once' : 'daily');

export function RemindersScreen({ state, t, lang, onUpdateState, notify }) {
  const [type, setType] = useState('custom');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [date, setDate] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [weekdays, setWeekdays] = useState(WEEKDAY_DEFAULT);
  const [scheduleError, setScheduleError] = useState('');
  const reminders = [...defaultReminders.filter(item => !state.reminders.some(r => r.id === item.id)), ...state.reminders];
  const update = (id, patch) => onUpdateState(s => ({ ...s, reminders: reminders.map(r => r.id === id ? { ...r, ...patch } : r) }));
  const request = async () => { if (!('Notification' in window)) { notify(t('reminders.denied')); return; } try { const result = await Notification.requestPermission(); notify(t(result === 'granted' ? 'reminders.enabled' : 'reminders.denied')); } catch { notify(t('reminders.denied')); } };
  const changeReminderSchedule = (reminder, frequency) => {
    if (frequency === 'once' && !reminder.date) { notify(t('reminders.chooseDateFirst')); return; }
    const selected = frequency === 'weekly' ? (reminder.recurrence?.weekdays?.length ? reminder.recurrence.weekdays : WEEKDAY_DEFAULT) : undefined;
    update(reminder.id, { recurrence: { frequency, ...(frequency === 'weekly' ? { weekdays: selected } : {}) } });
  };
  const add = async event => {
    event.preventDefault();
    if (schedule === 'once' && !date) { setScheduleError(t('reminders.dateRequired')); return; }
    if (schedule === 'weekly' && !weekdays.length) { setScheduleError(t('reminders.weekdayRequired')); return; }
    setScheduleError('');
    const recurrence = { frequency: schedule, ...(schedule === 'weekly' ? { weekdays: [...weekdays].sort((a, b) => a - b) } : {}) };
    await onUpdateState(s => ({ ...s, reminders: [...reminders, { id: crypto.randomUUID(), type, title: title.trim(), time, ...(date ? { date } : {}), recurrence, enabled: false }] }));
    setTitle(''); setDate(''); setSchedule('daily'); setWeekdays(WEEKDAY_DEFAULT);
  };
  const test = () => deliverReminder({ type: 'custom', title: t('reminders.testSent') }, { settings: state.settings, t, onBanner: notify, NotificationClass: window.Notification });
  return <div className="stack"><PageHeading t={t} section="reminders" /><div className="notice"><ShieldCheck size={22} /><p>{t('reminders.subtitle')}</p></div><div className="button-row"><button className="button secondary" onClick={request}><Bell size={17} />{t('reminders.permission')}</button><button className="button secondary" onClick={test}>{t('reminders.test')}</button></div>
    <div className="reminders-grid">{reminders.map(reminder => {
      const frequency = scheduleOf(reminder);
      const selectedDays = reminder.recurrence?.weekdays || WEEKDAY_DEFAULT;
      const personal = ['custom', 'medicine'].includes(reminder.type);
      return <section className="card reminder-card" key={reminder.id}><span className="lesson-icon tone-0"><Bell size={25} /></span><Toggle checked={reminder.enabled} onChange={value => update(reminder.id, { enabled: value })} label={reminder.title || t(`reminders.${reminder.type}`)} />
        {personal && <label className="field"><span>{t('reminders.repeat')}</span><select className="input" value={frequency} onChange={event => changeReminderSchedule(reminder, event.target.value)}><option value="once">{t('reminders.once')}</option><option value="daily">{t('reminders.dailyRepeat')}</option><option value="weekly">{t('reminders.weekly')}</option></select></label>}
        <label className="field"><span>{t('reminders.time')}</span><input className="input" type="time" value={reminder.time} onChange={event => event.target.value && update(reminder.id, { time: event.target.value })} required /></label>
        <label className="field"><span>{frequency === 'once' ? t('reminders.dateRequired') : t('reminders.date')}</span><input className="input" type="date" value={reminder.date || ''} min={frequency === 'once' ? todayISO() : undefined} required={frequency === 'once'} onChange={event => { if (!event.target.value && frequency === 'once') { notify(t('reminders.chooseDateFirst')); return; } update(reminder.id, { date: event.target.value }); }} /></label>
        {reminder.date && <p className="muted">{frequency === 'once' ? t('reminders.scheduledFor', { date: formatDate(reminder.date, lang, { year: 'numeric' }) }) : t('reminders.startsOn', { date: formatDate(reminder.date, lang, { year: 'numeric' }) })}</p>}
        {personal && frequency === 'weekly' && <WeekdayPicker value={selectedDays} t={t} onChange={value => { if (!value.length) { notify(t('reminders.weekdayRequired')); return; } update(reminder.id, { recurrence: { frequency: 'weekly', weekdays: value } }); }} />}
        {!defaultReminders.some(item => item.id === reminder.id) && <button className="text-link" onClick={() => onUpdateState(s => ({ ...s, reminders: s.reminders.filter(item => item.id !== reminder.id) }))}><X size={16} />{t('common.remove')}</button>}
      </section>;
    })}</div>
    <form className="card reminder-add" onSubmit={add}><h2>{t('reminders.add')}</h2><div className="grid-2">
      <label className="field"><span>{t('reminders.label')}</span><input className="input" maxLength={100} value={title} onChange={event => setTitle(event.target.value)} required /></label>
      <label className="field"><span>{t('reminders.time')}</span><input className="input" type="time" required value={time} onChange={event => setTime(event.target.value)} /></label>
      <label className="field"><span>{t('common.optional')}</span><select className="input" value={type} onChange={event => setType(event.target.value)}><option value="custom">{t('reminders.custom')}</option><option value="medicine">{t('reminders.medicine')}</option></select></label>
      <label className="field"><span>{schedule === 'once' ? t('reminders.dateRequired') : t('reminders.date')}</span><input className="input" type="date" value={date} min={todayISO()} required={schedule === 'once'} onChange={event => { setDate(event.target.value); setScheduleError(''); }} /></label>
      <label className="field"><span>{t('reminders.repeat')}</span><select className="input" value={schedule} onChange={event => { setSchedule(event.target.value); setScheduleError(''); }}>{['once', 'daily', 'weekly'].map(value => <option key={value} value={value}>{t(`reminders.${value === 'daily' ? 'dailyRepeat' : value}`)}</option>)}</select></label>
      {schedule === 'weekly' && <WeekdayPicker value={weekdays} t={t} onChange={value => { setWeekdays(value); setScheduleError(''); }} />}
    </div>{scheduleError && <p role="alert">{scheduleError}</p>}<button className="button primary" type="submit"><Plus size={18} />{t('reminders.add')}</button></form>
  </div>;
}

export default RemindersScreen;

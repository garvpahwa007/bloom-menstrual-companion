import React, { useState } from 'react';
import { Bell, CalendarDays, Check, Download, EyeOff, Heart, LockKeyhole, Plus, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { PageHeading, Sources } from './CareAndLearn.jsx';
import { SYMPTOMS } from '../data/symptoms.js';
import { PREGNANCY_WEEKS, PREGNANCY_DANGER_SIGNS, PREGNANCY_HELP } from '../content/pregnancy.js';
import { addDays, daysBetween, formatDate, todayISO } from '../lib/dates.js';
import CONFIG from '../config.js';
import { DEFAULT_REMINDERS, deliverReminder } from '../lib/reminders.js';

export function Toggle({ checked, onChange, label, description }) {
  return <label className="toggle-row"><span><strong>{label}</strong>{description && <small className="muted">{description}</small>}</span><input className="toggle-input" type="checkbox" checked={!!checked} onChange={event => onChange(event.target.checked)} /><span className="toggle-track" aria-hidden="true"><span /></span></label>;
}

export function SettingsScreen({ state, t, vaultEnabled, onUpdateState, onEnablePIN, onDisablePIN, onLock, onExport, onImport, onDelete, onNavigate }) {
  const [showPIN, setShowPIN] = useState(false); const [pin, setPin] = useState(''); const [repeat, setRepeat] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const setting = (key, value) => onUpdateState(s => ({ ...s, settings: { ...s.settings, [key]: value } }));
  const profile = (key, value) => onUpdateState(s => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const enable = async e => { e.preventDefault(); setError(''); if (pin !== repeat) { setError(t('settings.pinMismatch')); return; } setBusy(true); try { await onEnablePIN(pin); setShowPIN(false); setPin(''); setRepeat(''); } catch (e) { setError(t(e.message === 'secureContext' ? 'lock.secureContext' : 'common.error')); } finally { setBusy(false); } };
  return <div className="stack"><PageHeading t={t} section="settings" /><div className="settings-grid"><div className="stack"><section className="card"><h2>{t('settings.access')}</h2><div className="settings-fields"><label className="field"><span>{t('settings.language')}</span><select className="input" value={state.settings.language} onChange={e => setting('language', e.target.value)}><option value="en">{t('common.english')}</option><option value="hi">{t('common.hindi')}</option></select></label><label className="field"><span>{t('settings.text')}</span><select className="input" value={state.settings.textSize} onChange={e => setting('textSize', e.target.value)}>{['normal', 'large', 'largest'].map(value => <option key={value} value={value}>{t(`settings.${value}`)}</option>)}</select></label></div><Toggle checked={state.settings.highContrast} onChange={v => setting('highContrast', v)} label={t('settings.contrast')} /><Toggle checked={state.settings.readAloud} onChange={v => setting('readAloud', v)} label={t('settings.readAloud')} /><p className="muted text-small">{t('learn.noVoice')}</p></section>
      <section className="card"><h2>{t('settings.profile')}</h2><label className="field"><span>{t('settings.age')}</span><select className="input" value={state.profile.ageGroup} onChange={e => profile('ageGroup', e.target.value)}><option value="under18">{t('welcome.under18')}</option><option value="adult">{t('welcome.adult')}</option></select></label><Toggle checked={state.profile.fertilityEnabled} onChange={v => profile('fertilityEnabled', v)} label={t('settings.fertility')} /><Toggle checked={state.profile.pregnancyFeatureEnabled || state.profile.pregnancyEnabled} onChange={v => profile('pregnancyFeatureEnabled', v)} label={t('settings.pregnancy')} /></section>
      <section className="card"><h2>{t('settings.symptoms')}</h2><p className="muted">{t('settings.symptomsNote')}</p><div className="settings-symptoms">{SYMPTOMS.map(symptom => <label key={symptom.id} className="check-chip"><input type="checkbox" checked={state.settings.trackedSymptoms.includes(symptom.id)} onChange={e => setting('trackedSymptoms', e.target.checked ? [...state.settings.trackedSymptoms, symptom.id] : state.settings.trackedSymptoms.filter(id => id !== symptom.id))} /><span>{t(`tracking.symptom.${symptom.id}`)}</span></label>)}</div></section></div>
      <div className="stack"><section className="card"><div className="section-heading"><h2>{t('settings.privacy')}</h2><ShieldCheck size={23} /></div><Toggle checked={state.settings.discreet} onChange={v => setting('discreet', v)} label={t('settings.discreet')} description={t('settings.discreetNote')} /><div className="pin-section"><h3><LockKeyhole size={18} />{t('settings.pin')}</h3><p className="muted">{t('settings.pinNote')}</p>{vaultEnabled ? <><p className="success-text"><Check size={16} />{t('settings.pinEnabled')}</p><div className="button-row"><button className="button secondary" onClick={onLock}>{t('header.lock')}</button><button className="text-link" onClick={onDisablePIN}>{t('settings.disablePin')}</button></div></> : <><p className="notice compact">{t('settings.pinWarning')}</p><button className="text-link export-first" onClick={() => onExport('json')}><Download size={16} />{t('settings.exportJSON')}</button>{showPIN ? <form className="stack pin-form" onSubmit={enable}><label className="field"><span>{t('settings.enterPin')}</span><input className="input" type="password" inputMode="numeric" pattern={`[0-9]{${CONFIG.pinLength}}`} maxLength={CONFIG.pinLength} required autoComplete="new-password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} /></label><label className="field"><span>{t('settings.confirmPin')}</span><input className="input" type="password" inputMode="numeric" pattern={`[0-9]{${CONFIG.pinLength}}`} maxLength={CONFIG.pinLength} required autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value.replace(/\D/g, ''))} /></label>{error && <p role="alert">{error}</p>}<div className="button-row"><button className="button primary" type="submit" disabled={busy}>{t(busy ? 'common.loading' : 'settings.enablePin')}</button><button className="button secondary" type="button" onClick={() => { setShowPIN(false); setPin(''); setRepeat(''); }}>{t('common.cancel')}</button></div></form> : <button className="button secondary" onClick={() => setShowPIN(true)}><LockKeyhole size={18} />{t('settings.enablePin')}</button>}</>}</div></section>
      <section className="card"><h2>{t('privacyData.title')}</h2><p className="muted">{t('privacyData.settingsIntro')}</p><button className="button secondary" onClick={() => onNavigate('/privacy')}><ShieldCheck size={17} />{t('privacyData.open')}</button></section><div className="card soft-card"><Heart size={24} /><h3>{t('settings.about')}</h3><p className="muted">{t('settings.aboutBody')}</p></div></div></div></div>;
}

export function PrivacyDataScreen({ t, vaultEnabled, onNavigate, onExport, onImport, onDelete }) {
  return <div className="stack privacy-data-screen">
    <div className="page-heading"><div><p className="eyebrow">{t('privacyData.kicker')}</p><h1>{t('privacyData.title')}</h1><p className="muted">{t('privacyData.subtitle')}</p></div></div>
    <section className="card">
      <div className="section-heading"><h2>{t('privacyData.storageTitle')}</h2><ShieldCheck size={23} aria-hidden="true" /></div>
      <p className="muted">{t('privacyData.storageBody')}</p>
      <div className="notice privacy-data-status"><LockKeyhole size={20} aria-hidden="true" /><p><strong>{t(vaultEnabled ? 'privacyData.pinOn' : 'privacyData.pinOff')}</strong><br />{t(vaultEnabled ? 'privacyData.pinOnBody' : 'privacyData.pinOffBody')}</p></div>
      <button className="text-link" onClick={() => onNavigate('/settings')}>{t('privacyData.managePin')}</button>
    </section>
    <section className="card">
      <h2>{t('privacyData.backupTitle')}</h2>
      <p className="muted">{t('privacyData.backupBody')}</p>
      <div className="data-actions">
        <button className="button secondary" onClick={() => onExport('json')}><Download size={17} />{t('settings.exportJSON')}</button>
        <button className="button secondary" onClick={() => onExport('csv')}><Download size={17} />{t('settings.exportCSV')}</button>
        <label className="button secondary import-button"><Upload size={17} />{t('settings.import')}<input type="file" accept=".json,.csv,application/json,text/csv" aria-label={t('settings.import')} onChange={async event => { const file = event.target.files?.[0]; if (file) await onImport(file); event.target.value = ''; }} /></label>
      </div>
      <p className="muted text-small privacy-data-restore-help">{t('privacyData.restoreHelp')}</p>
    </section>
    <section className="card">
      <h2>{t('privacyData.deleteTitle')}</h2>
      <p className="muted text-small">{t('privacyData.deleteBody')}</p>
      <button className="button danger" onClick={onDelete}><Trash2 size={17} />{t('settings.delete')}</button>
    </section>
  </div>;
}

const defaultReminders = DEFAULT_REMINDERS;
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAY_DEFAULT = [1, 2, 3, 4, 5];
const scheduleOf = reminder => reminder.recurrence?.frequency || (reminder.date ? 'once' : 'daily');

function WeekdayPicker({ value, onChange, t }) {
  return <fieldset className="reminder-weekdays"><legend>{t('reminders.weekdays')}</legend><div className="settings-symptoms">{WEEKDAY_KEYS.map((key, day) => <label key={key} className="check-chip"><input type="checkbox" checked={value.includes(day)} onChange={event => onChange(event.target.checked ? [...value, day].sort((a, b) => a - b) : value.filter(item => item !== day))} /><span>{t(`reminders.weekday.${key}`)}</span></label>)}</div></fieldset>;
}

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
export function PregnancyScreen({ state, t, lang, onUpdateState, onNavigate }) {
  const existing = state.reminders.find(r => r.id === 'pregnancy-checkup');
  const [confirmed, setConfirmed] = useState(false); const [date, setDate] = useState(state.profile.lastPeriodDate || ''); const [error, setError] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(existing?.date || ''); const [appointmentTime, setAppointmentTime] = useState(existing?.time || '09:00'); const [appointmentEnabled, setAppointmentEnabled] = useState(existing?.enabled || false); const [appointmentSaved, setAppointmentSaved] = useState(false); const [selectedWeek, setSelectedWeek] = useState(null);
  const enable = async e => { e.preventDefault(); const age = date ? daysBetween(date, todayISO()) : -1; if (!confirmed || age < 0 || age > CONFIG.maximumPregnancyWeek * CONFIG.daysPerWeek) { setError(t('pregnancy.invalid')); return; } await onUpdateState(s => ({ ...s, profile: { ...s.profile, pregnancyEnabled: true, pregnancyConfirmed: true, lastPeriodDate: date, pregnancyFeatureEnabled: true } })); };
  const week = state.profile.pregnancyEnabled ? Math.floor(daysBetween(state.profile.lastPeriodDate, todayISO()) / CONFIG.daysPerWeek) : 0;
  const displayWeek = selectedWeek || Math.max(1, week);
  const info = PREGNANCY_WEEKS.find(item => displayWeek >= item.from && displayWeek <= item.to);
  const saveAppointment = async e => { e.preventDefault(); const reminder = { id: 'pregnancy-checkup', type: 'checkup', date: appointmentDate, time: appointmentTime, title: '', enabled: appointmentEnabled }; const saved = await onUpdateState(s => ({ ...s, reminders: [...s.reminders.filter(r => r.id !== reminder.id), reminder] })); if (saved !== false) setAppointmentSaved(true); };
  return <div className="stack"><div className="page-heading"><div><p className="eyebrow">{t('pregnancy.kicker')}</p><h1>{t('pregnancy.title')}</h1></div></div>{!state.profile.pregnancyEnabled ? <form className="card pregnancy-setup stack" onSubmit={enable}><span className="lesson-icon tone-1"><Heart size={30} /></span><p>{t('pregnancy.intro')}</p><label className="check-chip"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} required /><span>{t('pregnancy.confirm')}</span></label><label className="field"><span>{t('pregnancy.last')}</span><input className="input" type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} required /></label>{error && <p role="alert">{error}</p>}<button className="button primary" type="submit" disabled={!confirmed || !date}>{t('pregnancy.enable')}</button></form> : <><section className="pregnancy-hero"><span className="eyebrow">{t('pregnancy.title')}</span><h2>{t('pregnancy.week', { week })}</h2><p>{t('pregnancy.pause')}</p><div className="pregnancy-date"><CalendarDays size={25} /><div><span>{t('pregnancy.due')}</span><strong>{formatDate(addDays(state.profile.lastPeriodDate, CONFIG.pregnancyLengthDays), lang, { year: 'numeric' })}</strong></div></div><p>{t('pregnancy.dueNote')}</p><Sources ids={['dueDate']} t={t} /></section><section className="card stack"><label className="field"><span>{t('pregnancy.weekChoose')}</span><select className="input" value={Math.min(CONFIG.maximumPregnancyWeek, displayWeek)} onChange={e => setSelectedWeek(Number(e.target.value))}>{PREGNANCY_WEEKS.map(item => <option key={item.from} value={item.from}>{t('pregnancy.week', { week: item.from })}</option>)}</select></label>{!info ? <p>{t('pregnancy.outOfRange')}</p> : <div><p className="eyebrow">{t('pregnancy.week', { week: displayWeek })}</p><h2>{info.title[lang]}</h2><p>{info.body[lang]}</p><Sources ids={info.sourceIds} t={t} /></div>}</section><form className="card stack" onSubmit={saveAppointment}><h2>{t('pregnancy.appointmentTitle')}</h2><p className="muted">{t('pregnancy.appointmentNote')}</p><div className="grid-2"><label className="field"><span>{t('pregnancy.appointmentDate')}</span><input className="input" type="date" min={todayISO()} required value={appointmentDate} onChange={e => { setAppointmentDate(e.target.value); setAppointmentSaved(false); }} /></label><label className="field"><span>{t('pregnancy.appointmentTime')}</span><input className="input" type="time" required value={appointmentTime} onChange={e => { setAppointmentTime(e.target.value); setAppointmentSaved(false); }} /></label></div><Toggle checked={appointmentEnabled} onChange={setAppointmentEnabled} label={t('pregnancy.appointmentEnable')} /><button className="button primary" type="submit">{t('pregnancy.appointmentSave')}</button>{appointmentSaved && <p role="status">{t('pregnancy.appointmentSaved')}</p>}<button className="text-link" type="button" onClick={() => onNavigate('/reminders')}>{t('pregnancy.appointmentList')}</button><Sources ids={['antenatal']} t={t} /></form><button className="text-link fit-content" onClick={() => window.confirm(t('pregnancy.offConfirm')) && onUpdateState(s => ({ ...s, profile: { ...s.profile, pregnancyEnabled: false, pregnancyConfirmed: false }, reminders: s.reminders.map(r => r.type === 'checkup' ? { ...r, enabled: false } : r) }))}>{t('pregnancy.turnOff')}</button></>}
    <section className="card pregnancy-warning"><h2>{t('pregnancy.danger')}</h2><p>{PREGNANCY_HELP[lang]}</p><ul>{PREGNANCY_DANGER_SIGNS.map(sign => <li key={sign.id}>{sign.text[lang]}</li>)}</ul><div className="button-row"><a className="button primary" href="tel:112">{t('doctor.call112')}</a><a className="button secondary" href="tel:108">{t('doctor.call108')}</a></div><Sources ids={[...PREGNANCY_DANGER_SIGNS.flatMap(sign => sign.sourceIds), 'emergency']} t={t} /></section></div>;
}

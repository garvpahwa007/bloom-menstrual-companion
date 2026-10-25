import React from 'react';

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function WeekdayPicker({ value, onChange, t }) {
  return <fieldset className="reminder-weekdays"><legend>{t('reminders.weekdays')}</legend><div className="settings-symptoms">{WEEKDAY_KEYS.map((key, day) => <label key={key} className="check-chip"><input type="checkbox" checked={value.includes(day)} onChange={event => onChange(event.target.checked ? [...value, day].sort((a, b) => a - b) : value.filter(item => item !== day))} /><span>{t(`reminders.weekday.${key}`)}</span></label>)}</div></fieldset>;
}

export default WeekdayPicker;

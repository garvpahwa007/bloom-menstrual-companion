import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Droplets, Info, Plus, Sparkles } from 'lucide-react';
import { todayISO, addDays } from '../../utilities/date.helper.js';
import { locale, dateObject, dateText, localDate } from '../cycle/cycle-format.helper.js';
import PageHeading from '../../components/layout/page-heading.component.jsx';
import PrivacyNote from '../../components/tracking/privacy-note.component.jsx';

export function CalendarScreen({ state, analysis, t, lang, onNavigate }) {
  const [month, setMonth] = useState(() => { const now = dateObject(todayISO()); return new Date(now.getFullYear(), now.getMonth(), 1, 12); });
  const today = todayISO();
  const showFertility = !state.profile.pregnancyEnabled && (state.profile.ageGroup === 'adult' || state.profile.fertilityEnabled) && !!analysis.fertile;
  const firstOffset = (month.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstOffset).fill(null), ...Array.from({ length: totalDays }, (_, i) => localDate(new Date(month.getFullYear(), month.getMonth(), i + 1, 12)))];
  while (cells.length % 7) cells.push(null);
  const shift = delta => setMonth(value => new Date(value.getFullYear(), value.getMonth() + delta, 1, 12));
  const weekdays = Array.from({ length: 7 }, (_, i) => dateText(addDays('2026-10-19', i), lang, { weekday: 'short' }));
  const monthLogs = Object.values(state.logs).filter(log => log.date?.slice(0, 7) === localDate(month).slice(0, 7));
  return <div className="stack tracking-calendar-page"><PageHeading tracking eyebrow={t('tracking.yourHistory')} title={t('tracking.calendar')} description={t('tracking.calendarDescription')}><button className="button primary" onClick={() => onNavigate('/log')}><Plus size={18} aria-hidden="true" />{t('tracking.logDay')}</button></PageHeading>
    <section className="card tracking-calendar-card"><div className="tracking-calendar-toolbar"><h2>{new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric' }).format(month)}</h2><div><button className="icon-button" onClick={() => shift(-1)} aria-label={t('tracking.previousMonth')}><ChevronLeft size={21} aria-hidden="true" /></button><button className="button secondary" onClick={() => { const now = dateObject(today); setMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12)); }}>{t('tracking.today')}</button><button className="icon-button" onClick={() => shift(1)} aria-label={t('tracking.nextMonth')}><ChevronRight size={21} aria-hidden="true" /></button></div></div>
      <div className="tracking-calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>{weekdays.map((day, index) => <div key={index} className="tracking-calendar-weekday">{day}</div>)}{cells.map((date, index) => {
        if (!date) return <div key={`empty-${index}`} aria-hidden="true" />;
        const log = state.logs[date];
        const predicted = !state.profile.pregnancyEnabled && analysis.prediction && date >= analysis.prediction.from && date <= analysis.prediction.to;
        const fertile = showFertility && date >= analysis.fertile.from && date <= analysis.fertile.to;
        const labels = [dateText(date, lang, { day: 'numeric', month: 'long', year: 'numeric' }), date === today ? t('tracking.today') : '', log?.period ? t('tracking.loggedPeriod') : '', predicted ? t('tracking.predictedDay') : '', fertile ? t('tracking.fertileDay') : '', log?.symptoms?.length ? t('tracking.symptomCount', { count: log.symptoms.length }) : ''].filter(Boolean).join(', ');
        return <button key={date} className={`tracking-calendar-day ${log?.period ? 'logged' : ''} ${predicted ? 'predicted' : ''} ${fertile ? 'fertile' : ''} ${date === today ? 'is-today' : ''} ${log ? 'has-log' : ''}`} aria-label={labels} aria-current={date === today ? 'date' : undefined} onClick={() => onNavigate(`/log?date=${date}`)}><span className="tracking-calendar-number">{new Intl.NumberFormat(locale(lang)).format(dateObject(date).getDate())}</span><span className="tracking-calendar-mark" aria-hidden="true">{log?.period && <span className="tracking-calendar-marker logged"><Droplets size={8} /></span>}{predicted && <span className="tracking-calendar-marker predicted">◌</span>}{fertile && <span className="tracking-calendar-marker fertile">✦</span>}{log?.symptoms?.length > 0 && <span className="tracking-calendar-marker symptom">•</span>}</span></button>;
      })}</div>
      <div className="tracking-legend"><span><i className="legend-dot logged" />{t('tracking.loggedPeriod')}</span><span><i className="legend-dot predicted" />{t('tracking.estimatedPeriod')}</span>{showFertility && <span><i className="legend-dot fertile" />{t('tracking.fertileEstimate')}</span>}<span><i className="legend-dot symptom" />{t('tracking.symptoms')}</span></div>
      <p className="muted tracking-calendar-footnote"><Info size={16} aria-hidden="true" />{t('tracking.calendarEstimateNote')}</p>{showFertility && <p className="muted tracking-calendar-footnote">{t('tracking.notContraception')}</p>}
    </section>
    <div className="grid-2"><section className="card"><p className="eyebrow">{t('tracking.thisMonth')}</p><h2>{t('tracking.monthSummary')}</h2><div className="tracking-summary-row"><span className="muted">{t('tracking.daysWithLogs')}</span><strong>{monthLogs.length}</strong></div><div className="tracking-summary-row"><span className="muted">{t('tracking.periodDays')}</span><strong>{monthLogs.filter(log => log.period).length}</strong></div><div className="tracking-summary-row"><span className="muted">{t('tracking.daysWithSymptoms')}</span><strong>{monthLogs.filter(log => log.symptoms?.length).length}</strong></div></section><section className="card tracking-insight-card"><Sparkles size={24} aria-hidden="true" /><h2>{t('tracking.patternsTakeTime')}</h2><p>{t('tracking.calendarInsight')}</p><button className="tracking-text-link" onClick={() => onNavigate('/insights')}>{t('tracking.exploreInsights')}<ArrowRight size={16} aria-hidden="true" /></button></section></div><PrivacyNote t={t} /></div>;
}

export default CalendarScreen;

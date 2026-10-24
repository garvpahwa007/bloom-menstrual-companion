import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Droplets, Frown, Heart, Info, Leaf, Meh, Moon, Plus, ShieldCheck, Smile, Sparkles, Sun, Wind, Zap } from 'lucide-react';
import { todayISO, addDays } from '../lib/dates.js';
import { SYMPTOMS } from '../data/symptoms.js';
import CONFIG from '../config.js';
import { SOURCES } from '../content/sources.js';

const locale = lang => lang === 'hi' ? 'hi-IN' : 'en-IN';
const dateObject = value => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const dateText = (value, lang, options = { day: 'numeric', month: 'short' }) => value ? new Intl.DateTimeFormat(locale(lang), options).format(dateObject(value)) : '—';
const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const isLocalDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && localDate(dateObject(value)) === value;
const rangeText = (range, lang) => range ? `${dateText(range.from, lang)} – ${dateText(range.to, lang)}` : '—';
const dayNumbers = (days, lang) => (Array.isArray(days) ? days : [days]).map(day => new Intl.NumberFormat(locale(lang)).format(day)).join('–');
const symptomIcons = { cramps: Wind, headache: Sun, acne: Sparkles, bloating: Wind, fatigue: Moon, tiredness: Moon, moodChanges: Heart, mood: Heart, insomnia: Moon, sleep: Moon, troubleSleeping: Moon, dizziness: Wind, breathlessness: Wind, backache: Leaf, backPain: Leaf, nausea: Leaf, breastTenderness: Heart, discharge: Droplets };
const SymptomIcon = ({ id, size = 22 }) => { const Icon = symptomIcons[id] || Leaf; return <Icon size={size} aria-hidden="true" />; };
const getPatternText = (pattern, t) => pattern.id === 'loggedSymptomPattern'
  ? t(`tracking.pattern.${pattern.window === 'earlyCycle' ? 'loggedEarlySymptom' : 'loggedPrePeriodSymptom'}`, { symptom: t(`tracking.symptom.${pattern.symptomId}`), count: pattern.count, days: Array.isArray(pattern.days) ? pattern.days.join('–') : pattern.days })
  : t(`tracking.pattern.${pattern.id}`, { count: pattern.count, days: Array.isArray(pattern.days) ? pattern.days.join('–') : pattern.days });

function PageHeading({ eyebrow, title, description, children }) {
  return <div className="page-heading tracking-page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{children}</div>;
}

function EmptyState({ t, onNavigate, text }) {
  return <div className="empty-state"><CalendarDays size={32} aria-hidden="true" /><h3>{t('tracking.everyLogHelps')}</h3><p>{text || t('tracking.noHistory')}</p><button className="button primary" onClick={() => onNavigate('/log')}>{t('tracking.logToday')}<Plus size={18} aria-hidden="true" /></button></div>;
}

function PrivacyNote({ t }) {
  return <p className="tracking-privacy muted"><ShieldCheck size={15} aria-hidden="true" />{t('tracking.privacyNote')}</p>;
}

export function TodayScreen({ state, analysis, t, lang, onNavigate }) {
  const today = todayISO();
  const currentLog = state.logs[today];
  const periodToday = currentLog?.period;
  const recentDays = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const pattern = (analysis.patterns || []).find(item => item.count >= CONFIG.minimumPatternCycles);
  const recentCycles = analysis.recentCycles || [];
  const average = Number.isFinite(analysis.average) ? Math.round(analysis.average * 10) / 10 : null;
  return <div className="tracking-today stack">
    <PageHeading eyebrow={dateText(today, lang, { weekday: 'long', day: 'numeric', month: 'long' })} title={t('tracking.greeting')} description={t('tracking.greetingDescription')}>
      <button className="button secondary tracking-heading-log" onClick={() => onNavigate('/log')}><Plus size={18} aria-hidden="true" />{t('tracking.logToday')}</button>
    </PageHeading>
    <section className="tracking-hero" aria-labelledby="cycle-heading">
      <div className="tracking-hero-copy"><span className="tracking-hero-label"><span className="tracking-hero-dot" />{state.profile.pregnancyEnabled ? t('tracking.pregnancyMode') : t('tracking.yourCycle')}</span>
        <h2 id="cycle-heading">{state.profile.pregnancyEnabled ? t('tracking.pregnancyWelcome') : analysis.cycleDay ? <>{t('tracking.cycleDay')} <strong>{new Intl.NumberFormat(locale(lang)).format(analysis.cycleDay)}</strong></> : t('tracking.startJourney')}</h2>
        <p>{state.profile.pregnancyEnabled ? t('tracking.predictionsPaused') : periodToday ? t('tracking.periodToday') : analysis.phase ? t(`tracking.phase.${analysis.phase.id}`) : analysis.irregular ? t('tracking.irregularPhase') : t('tracking.phaseUncertain')}</p>
        <button className="button tracking-hero-button" onClick={() => onNavigate(state.profile.pregnancyEnabled ? '/pregnancy' : '/log')}>{state.profile.pregnancyEnabled ? t('tracking.viewPregnancy') : currentLog ? t('tracking.editToday') : t('tracking.logToday')}<ArrowUpRight size={20} aria-hidden="true" /></button>
      </div>
      <div className="tracking-cycle-orbit" aria-hidden="true"><div className="tracking-orbit-ring tracking-orbit-ring-one" /><div className="tracking-orbit-ring tracking-orbit-ring-two" /><div className="tracking-orbit-center"><FlowerMark /><span>{t('tracking.withYou')}</span></div><div className="tracking-orbit-small"><Heart size={20} /></div></div>
      {!state.profile.pregnancyEnabled && <div className="tracking-hero-estimate"><CalendarDays size={21} aria-hidden="true" /><div><span>{t('tracking.nextEstimate')}</span><strong>{analysis.prediction ? rangeText(analysis.prediction, lang) : t(analysis.suspectedGaps?.length ? 'tracking.reviewGap' : 'tracking.notEnoughData')}</strong></div>{analysis.irregular && <span className="badge tracking-irregular-badge">{t('tracking.irregular')}</span>}</div>}
    </section>
    {analysis.prediction?.to < today && !state.profile.pregnancyEnabled && <div className="notice"><Info size={20} /><p>{t('tracking.estimatePassed')}</p></div>}
    <div className="grid-3 tracking-stats">
      <article className="card tracking-stat"><span className="tracking-stat-icon lilac"><CalendarDays size={20} aria-hidden="true" /></span><span className="muted">{t('tracking.averageCycle')}</span><strong>{average === null ? '—' : t('tracking.daysCount', { count: average })}</strong><small className="muted">{t('tracking.basedOnCycles', { count: recentCycles.length })}</small></article>
      <article className="card tracking-stat"><span className="tracking-stat-icon peach"><Droplets size={20} aria-hidden="true" /></span><span className="muted">{t('tracking.lastPeriod')}</span><strong>{analysis.periods?.length ? dateText(analysis.periods.at(-1).start, lang) : '—'}</strong><small className="muted">{analysis.periods?.length ? t('tracking.daysLogged', { count: analysis.periods.at(-1).length }) : t('tracking.addFirstPeriod')}</small></article>
      <article className="card tracking-stat"><span className="tracking-stat-icon sage"><Heart size={20} aria-hidden="true" /></span><span className="muted">{t('tracking.yourCheckIn')}</span><strong>{currentLog?.mood ? t(`tracking.mood.${currentLog.mood}`) : t('tracking.howYouFeel')}</strong><small className="muted">{currentLog ? t('tracking.savedForToday') : t('tracking.takeAMoment')}</small></article>
    </div>
    <div className="tracking-dashboard-grid">
      <section className="card tracking-recent-card"><div className="section-heading"><div><p className="eyebrow">{t('tracking.atAGlance')}</p><h2>{t('tracking.recentDays')}</h2></div><button className="icon-button" aria-label={t('tracking.openCalendar')} onClick={() => onNavigate('/calendar')}><ArrowUpRight size={21} aria-hidden="true" /></button></div>
        <div className="tracking-day-strip">{recentDays.map(date => <div key={date} className={`tracking-strip-day ${state.logs[date]?.period ? 'logged' : ''} ${date === today ? 'today' : ''}`}><span>{dateText(date, lang, { weekday: 'narrow' })}</span><button onClick={() => onNavigate(`/log?date=${date}`)} aria-label={`${dateText(date, lang, { day: 'numeric', month: 'long' })}${state.logs[date]?.period ? `, ${t('tracking.loggedPeriod')}` : ''}`}>{dateObject(date).getDate()}</button><i aria-hidden="true">{state.logs[date]?.symptoms?.length ? '•' : '\u00a0'}</i></div>)}</div>
        <div className="tracking-legend"><span><i className="legend-dot logged" />{t('tracking.loggedPeriod')}</span><span><i className="legend-dot symptom" />{t('tracking.symptoms')}</span></div>
      </section>
      <section className="card tracking-insight-card"><span className="tracking-insight-spark"><Sparkles size={22} aria-hidden="true" /></span><p className="eyebrow">{t('tracking.personalInsight')}</p><h2>{pattern ? t('tracking.patternEmerging') : t('tracking.yourBodyYourPace')}</h2><p>{pattern ? getPatternText(pattern, t) : analysis.irregular ? t('tracking.irregularInsight') : t('tracking.patternsNeedTime')}</p><button className="tracking-text-link" onClick={() => onNavigate('/insights')}>{t('tracking.exploreInsights')}<ArrowRight size={17} aria-hidden="true" /></button></section>
    </div>
    {!state.profile.pregnancyEnabled && (state.profile.ageGroup === 'adult' || state.profile.fertilityEnabled) && analysis.ovulation && analysis.fertile && <section className="card tracking-fertility"><h2>{t('tracking.fertilityEstimates')}</h2><p><strong>{t('tracking.ovulationEstimate')}: </strong>{rangeText(analysis.ovulation, lang)}</p><p><strong>{t('tracking.fertileEstimate')}: </strong>{rangeText(analysis.fertile, lang)}</p><p className="tracking-soft-box">{t('tracking.notContraception')}</p><a href={SOURCES.fertilityWindow.url} target="_blank" rel="noreferrer" aria-label={`${t('tracking.fertilitySource')}: ${SOURCES.fertilityWindow.name}`}>{t('tracking.fertilitySource')}<ArrowUpRight size={15} aria-hidden="true" /></a><button className="tracking-text-link" onClick={() => onNavigate('/insights')}>{t('tracking.exploreInsights')}<ArrowRight size={16} aria-hidden="true" /></button></section>}
    <section className="card tracking-quick-log"><div className="section-heading"><div><h2>{t('tracking.howAreYou')}</h2><p className="muted">{t('tracking.smallCheckIn')}</p></div><span className="badge">{t('tracking.justAMinute')}</span></div><div className="tracking-quick-symptoms">{['cramps', 'bloating', 'tiredness', 'acne'].map(id => <button key={id} className="tracking-symptom-button" onClick={() => onNavigate(`/log?date=${today}&symptom=${id}`)}><span><SymptomIcon id={id} /></span>{t(`tracking.symptom.${id}`)}<Plus size={15} aria-hidden="true" /></button>)}</div></section>
    <button className="tracking-learn-banner" onClick={() => onNavigate('/learn')}><span className="tracking-learn-art" aria-hidden="true"><Leaf size={30} /></span><span><span className="eyebrow">{t('tracking.learnLittle')}</span><strong>{t('tracking.understandIrregular')}</strong><span className="muted">{t('tracking.learnDescription')}</span></span><ArrowUpRight size={24} aria-hidden="true" /></button>
    <PrivacyNote t={t} />
  </div>;
}

function FlowerMark() {
  return <svg width="64" height="64" viewBox="0 0 80 80" fill="none"><path d="M40 42C12 30 23 8 40 29C57 8 68 30 40 42Z" fill="currentColor" opacity=".8" /><path d="M40 42C67 28 75 51 48 50C58 75 32 79 40 42Z" fill="currentColor" opacity=".6" /><path d="M40 42C43 72 17 69 29 48C2 49 12 25 40 42Z" fill="currentColor" opacity=".95" /><circle cx="40" cy="42" r="6" fill="#f9eff5" /></svg>;
}

const defaultLog = date => ({ date, period: false, flow: 'medium', padFrequent: false, largeClots: false, pain: 0, painDisrupts: false, painUnrelieved: false, symptoms: [], symptomIntensity: {}, mood: 'okay', energy: 'okay', sleep: 8, medicines: '', note: '', betweenBleeding: false, afterSexBleeding: false, pregnancyPossible: false, urgentPain: false, fainting: false });

function Choice({ active, onClick, icon: Icon, label, className = '' }) {
  return <button type="button" className={`tracking-choice ${active ? 'selected' : ''} ${className}`} aria-pressed={!!active} onClick={onClick}>{Icon && <Icon size={24} aria-hidden="true" />}<span>{label}</span>{active && <Check size={14} className="tracking-choice-check" aria-hidden="true" />}</button>;
}

function CheckField({ checked, onChange, children }) {
  return <label className="tracking-check-row"><input type="checkbox" checked={!!checked} onChange={event => onChange(event.target.checked)} /><span>{children}</span></label>;
}

export function LogScreen({ state, t, lang, onSaveLog, onNavigate }) {
  const [params, setParams] = useSearchParams();
  const paramDate = params.get('date');
  const symptomParam = params.get('symptom');
  const date = isLocalDate(paramDate) ? paramDate : todayISO();
  const [log, setLog] = useState(() => ({ ...defaultLog(date), ...state.logs[date] }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const initial = { ...defaultLog(date), ...state.logs[date] };
    const symptom = symptomParam;
    if (SYMPTOMS.some(item => item.id === symptom) && !initial.symptoms.includes(symptom)) initial.symptoms = [...initial.symptoms, symptom];
    setLog(initial); setSaved(false); setError('');
  }, [date, symptomParam]);
  const set = (key, value) => { setLog(old => ({ ...old, [key]: value })); setSaved(false); };
  const toggleSymptom = id => {
    setLog(old => {
      const selected = old.symptoms.includes(id);
      const symptoms = selected ? old.symptoms.filter(item => item !== id) : [...old.symptoms, id];
      const symptomIntensity = { ...(old.symptomIntensity || {}) };
      if (selected) delete symptomIntensity[id];
      return { ...old, symptoms, symptomIntensity };
    });
    setSaved(false);
  };
  const pregnancyOnly = ['swellingFaceHands', 'fluidLeaking', 'reducedMovement'];
  const tracked = SYMPTOMS.filter(symptom => (state.settings.trackedSymptoms || []).includes(symptom.id) && (state.profile.pregnancyEnabled || !pregnancyOnly.includes(symptom.id)));
  const selectedTracked = tracked.filter(symptom => log.symptoms.includes(symptom.id));
  const setIntensity = (id, value) => { const next = { ...(log.symptomIntensity || {}) }; if (value === null) delete next[id]; else next[id] = value; set('symptomIntensity', next); };
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await onSaveLog(date, { ...log, date, pain: Number(log.pain), sleep: Number(log.sleep), flow: log.period ? log.flow : 'medium', padFrequent: log.period && log.flow === 'heavy' && log.padFrequent, largeClots: log.period && log.flow === 'heavy' && log.largeClots });
      setSaved(true);
    } catch { setError(t('tracking.saveError')); }
    finally { setSaving(false); }
  };
  return <div className="stack tracking-log-page">
    <PageHeading eyebrow={t('tracking.dailyCheckIn')} title={t('tracking.logDay')} description={t('tracking.logDescription')} />
    <form onSubmit={save} className="stack">{date > todayISO() && <div className="notice"><p>{t('tracking.futureDate')}</p></div>}
      <section className="card tracking-log-date"><label className="field"><span>{t('tracking.date')}</span><input className="input" type="date" value={date} max={todayISO()} onChange={event => { if (event.target.value) setParams({ date: event.target.value }); }} required /></label><span className="muted">{dateText(date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></section>
      <section className="card"><div className="section-heading"><h2>{t('tracking.period')}</h2><Droplets size={22} aria-hidden="true" /></div><p className="muted">{t('tracking.periodQuestion')}</p><div className="tracking-choice-row two"><Choice active={log.period} onClick={() => set('period', true)} icon={Droplets} label={t('tracking.periodOn')} /><Choice active={!log.period} onClick={() => set('period', false)} icon={Sun} label={t('tracking.periodOff')} /></div>
        {log.period && <div className="tracking-form-section"><h3>{t('tracking.flow')}</h3><div className="tracking-choice-row four">{['spotting', 'light', 'medium', 'heavy'].map(flow => <Choice key={flow} active={log.flow === flow} onClick={() => set('flow', flow)} icon={Droplets} label={t(`tracking.flow.${flow}`)} className={`flow-${flow}`} />)}</div>{log.flow === 'heavy' && <div className="tracking-soft-box stack"><h3>{t('tracking.heavyQuestions')}</h3><CheckField checked={log.padFrequent} onChange={value => set('padFrequent', value)}>{t('tracking.padFrequent')}</CheckField><CheckField checked={log.largeClots} onChange={value => set('largeClots', value)}>{t('tracking.largeClots')}</CheckField><p className="muted">{t('tracking.heavyHelp')}</p></div>}</div>}
      </section>
      <section className="card"><div className="section-heading"><h2>{t('tracking.pain')}</h2><span className="tracking-pain-number">{log.pain}<small>/{CONFIG.painScaleMaximum}</small></span></div><label className="field"><span>{t('tracking.painScale')}</span><input className="tracking-pain-range" type="range" min="0" max={CONFIG.painScaleMaximum} step="1" value={log.pain} onChange={event => set('pain', Number(event.target.value))} /></label><div className="tracking-range-labels muted"><span>{t('tracking.noPain')}</span><span>{t('tracking.worstPain')}</span></div><div className="stack tracking-form-section"><CheckField checked={log.painDisrupts} onChange={value => set('painDisrupts', value)}>{t('tracking.painDisrupts')}</CheckField><CheckField checked={log.painUnrelieved} onChange={value => set('painUnrelieved', value)}>{t('tracking.painUnrelieved')}</CheckField></div></section>
      <section className="card"><div className="section-heading"><h2>{t('tracking.symptoms')}</h2><button type="button" className="tracking-text-link" onClick={() => onNavigate('/settings')}>{t('tracking.customise')}</button></div><p className="muted">{t('tracking.symptomsDescription')}</p><div className="tracking-symptom-grid">{tracked.map(symptom => <button key={symptom.id} type="button" className={`tracking-symptom-choice ${log.symptoms.includes(symptom.id) ? 'selected' : ''}`} aria-pressed={log.symptoms.includes(symptom.id)} onClick={() => toggleSymptom(symptom.id)}><SymptomIcon id={symptom.id} /><span>{t(`tracking.symptom.${symptom.id}`)}</span>{log.symptoms.includes(symptom.id) && <Check size={14} aria-hidden="true" />}</button>)}</div>{selectedTracked.length > 0 && <div className="tracking-intensity-list"><p className="muted">{t('tracking.intensityOptional')}</p>{selectedTracked.map(symptom => { const name = t(`tracking.symptom.${symptom.id}`); const intensity = log.symptomIntensity?.[symptom.id]; return <fieldset className="tracking-intensity-field" key={symptom.id}><legend>{t('tracking.intensityFor', { symptom: name })}</legend><div className="tracking-choice-row three" role="group" aria-label={t('tracking.intensityFor', { symptom: name })}>{['mild', 'moderate', 'strong'].map((level, index) => <Choice key={level} active={intensity === index + 1} onClick={() => setIntensity(symptom.id, index + 1)} label={t(`tracking.intensity.${level}`)} />)}</div>{intensity && <button type="button" className="text-link" onClick={() => setIntensity(symptom.id, null)}>{t('tracking.clearIntensity')}</button>}</fieldset>; })}</div>}</section>
      <section className="card"><h2>{t('tracking.mood')}</h2><p className="muted">{t('tracking.moodQuestion')}</p><div className="tracking-choice-row five">{[['veryLow', Frown], ['low', Frown], ['okay', Meh], ['good', Smile], ['great', Sun]].map(([mood, Icon]) => <Choice key={mood} active={log.mood === mood} onClick={() => set('mood', mood)} icon={Icon} label={t(`tracking.mood.${mood}`)} />)}</div><div className="tracking-form-section"><h3>{t('tracking.energy')}</h3><div className="tracking-choice-row three">{['low', 'okay', 'high'].map(energy => <Choice key={energy} active={log.energy === energy} onClick={() => set('energy', energy)} icon={Zap} label={t(`tracking.energy.${energy}`)} />)}</div></div><div className="tracking-form-section"><label className="field"><span><Moon size={17} aria-hidden="true" /> {t('tracking.sleep')}</span><input className="input" type="number" min="0" max={CONFIG.maximumSleepHours} step={CONFIG.sleepInputStep} value={log.sleep} onChange={event => set('sleep', event.target.value)} required /></label></div></section>
      <section className="card stack"><h2>{t('tracking.moreDetails')}</h2><p className="muted">{t('tracking.detailsOptional')}</p><CheckField checked={log.betweenBleeding} onChange={value => set('betweenBleeding', value)}>{t('tracking.betweenBleeding')}</CheckField><CheckField checked={log.afterSexBleeding} onChange={value => set('afterSexBleeding', value)}>{t('tracking.afterSexBleeding')}</CheckField><CheckField checked={log.pregnancyPossible} onChange={value => set('pregnancyPossible', value)}>{t('tracking.pregnancyPossible')}</CheckField><CheckField checked={log.urgentPain} onChange={value => set('urgentPain', value)}>{t('tracking.urgentPain')}</CheckField><CheckField checked={log.fainting} onChange={value => set('fainting', value)}>{t('tracking.fainting')}</CheckField>{(log.urgentPain || (log.pain >= CONFIG.severePainMinimum && log.painUnrelieved) || ((log.fainting || log.symptoms.includes('dizziness')) && log.period && log.flow === 'heavy') || ((log.pregnancyPossible || state.profile.pregnancyEnabled) && (log.period || log.betweenBleeding || log.afterSexBleeding || log.pain >= CONFIG.severePainMinimum))) && <div className="tracking-help-now" role="alert"><Info size={20} aria-hidden="true" /><div><strong>{t('tracking.getHelpNow')}</strong><p>{t('tracking.urgentNumbers')}</p><button type="button" className="tracking-text-link" onClick={() => onNavigate('/guidance')}>{t('tracking.viewGuidance')}<ArrowRight size={16} aria-hidden="true" /></button></div></div>}</section>
      <section className="card stack"><label className="field"><span>{t('tracking.medicines')}</span><input className="input" type="text" maxLength="300" value={log.medicines} placeholder={t('tracking.medicinesPlaceholder')} onChange={event => set('medicines', event.target.value)} /></label><label className="field"><span>{t('tracking.privateNote')}</span><textarea className="input" rows="3" maxLength="1000" value={log.note} placeholder={t('tracking.notePlaceholder')} onChange={event => set('note', event.target.value)} /></label><PrivacyNote t={t} /></section>
      <div className="tracking-save-bar"><div aria-live="polite">{saved && <p className="tracking-save-message"><Check size={18} aria-hidden="true" />{t('tracking.saved')}</p>}{error && <p role="alert">{error}</p>}</div><button className="button primary" disabled={saving} type="submit">{saving ? t('tracking.saving') : t('tracking.saveLog')}<Check size={18} aria-hidden="true" /></button></div>
    </form>
  </div>;
}

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
  return <div className="stack tracking-calendar-page"><PageHeading eyebrow={t('tracking.yourHistory')} title={t('tracking.calendar')} description={t('tracking.calendarDescription')}><button className="button primary" onClick={() => onNavigate('/log')}><Plus size={18} aria-hidden="true" />{t('tracking.logDay')}</button></PageHeading>
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

export function InsightsScreen({ state, analysis, t, lang, onNavigate, onUpdateState }) {
  const cycles = analysis.cycles || [];
  const recent = analysis.recentCycles || [];
  const patterns = (analysis.patterns || []).filter(pattern => pattern.count >= CONFIG.minimumPatternCycles);
  const chartCycles = cycles.slice(-CONFIG.historyChartCycles);
  const maxLength = Math.max(CONFIG.adultMaximumCycleDays, ...chartCycles.map(cycle => cycle.length));
  const average = Number.isFinite(analysis.average) ? Math.round(analysis.average * 10) / 10 : null;
  const periodStats = analysis.periodStats || { count: 0 };
  const periodAverage = periodStats.average == null ? null : Math.round(periodStats.average * 10) / 10;
  const confirmGap = gap => onUpdateState(old => ({ ...old, logs: { ...old.logs, [gap.nextStart]: { ...old.logs[gap.nextStart], confirmedGap: true } } }));
  return <div className="stack tracking-insights-page"><PageHeading eyebrow={t('tracking.getToKnowYou')} title={t('tracking.insights')} description={t('tracking.insightsDescription')} />
    {!!analysis.suspectedGaps?.length && <section className="card tracking-gap-card"><Info size={24} aria-hidden="true" /><div><h2>{t('tracking.missedLogQuestion')}</h2><p>{t('tracking.gapExplanation')}</p>{analysis.suspectedGaps.map(gap => <div key={gap.id || gap.nextStart} className="tracking-gap-item"><strong>{dateText(gap.start, lang)} – {dateText(gap.nextStart, lang)} · {t('tracking.daysCount', { count: gap.length })}</strong><div className="tracking-gap-actions"><button className="button secondary" onClick={() => onNavigate(`/log?date=${gap.end}`)}>{t('tracking.addMissedPeriod')}</button><button className="button secondary" onClick={() => confirmGap(gap)}>{t('tracking.gapIsCorrect')}</button></div></div>)}</div></section>}
    <div className="grid-3 tracking-stats"><article className="card tracking-stat"><span className="muted">{t('tracking.averageCycle')}</span><strong>{average === null ? '—' : t('tracking.daysCount', { count: average })}</strong><small className="muted">{t('tracking.basedOnCycles', { count: recent.length })}</small></article><article className="card tracking-stat"><span className="muted">{t('tracking.cycleRange')}</span><strong>{recent.length ? t('tracking.rangeDays', { from: analysis.min, to: analysis.max }) : '—'}</strong><small className="muted">{t('tracking.shortestToLongest')}</small></article><article className="card tracking-stat"><span className="muted">{t('tracking.cyclePattern')}</span><strong>{recent.length < CONFIG.minimumCompleteCycles ? t('tracking.stillLearning') : analysis.irregular ? t('tracking.irregular') : t('tracking.moreConsistent')}</strong><small className="muted">{t('tracking.patternIsNotDiagnosis')}</small></article></div>
    <section className="card period-statistics"><h2>{t('tracking.periodStats')}</h2><div className="grid-2"><div><p className="muted">{t('tracking.averagePeriod')}</p><strong>{periodAverage === null ? '—' : t('tracking.daysCount', { count: periodAverage })}</strong></div><div><p className="muted">{t('tracking.periodRange')}</p><strong>{periodStats.count ? t('tracking.rangeDays', { from: periodStats.min, to: periodStats.max }) : '—'}</strong></div></div><p className="muted">{t('tracking.periodStatsBasis', { count: periodStats.count })}</p></section>
    <section className="card"><div className="section-heading"><div><p className="eyebrow">{t('tracking.yourOwnPattern')}</p><h2>{t('tracking.cycleHistory')}</h2></div><span className="badge">{t('tracking.cyclesCount', { count: cycles.length })}</span></div>{!chartCycles.length ? <EmptyState t={t} onNavigate={onNavigate} /> : <><div className="tracking-chart" role="img" aria-label={[t('tracking.cycleChartLabel'), ...chartCycles.map(cycle => t('tracking.chartRecord', { date: dateText(cycle.start, lang), cycle: cycle.length, period: cycle.periodLength || 0 }))].join('. ')}><div className="tracking-chart-scale muted"><span>0</span><span>{t('tracking.daysCount', { count: maxLength })}</span></div>{chartCycles.map(cycle => <div className="tracking-chart-row" key={cycle.start}><div className="tracking-chart-label"><span>{dateText(cycle.start, lang)}</span><strong>{t('tracking.daysCount', { count: cycle.length })}</strong></div><div className="tracking-chart-track"><div className="tracking-chart-cycle" style={{ width: `${100 * cycle.length / maxLength}%` }} /><div className="tracking-chart-period" style={{ width: `${100 * (cycle.periodLength || 0) / maxLength}%` }} /></div><span className="muted tracking-chart-period-label">{t('tracking.periodLength', { count: cycle.periodLength || 0 })}</span></div>)}</div><div className="tracking-legend"><span><i className="legend-dot cycle" />{t('tracking.cycleLength')}</span><span><i className="legend-dot logged" />{t('tracking.periodLengthLabel')}</span></div><p className="muted">{t('tracking.cycleDefinition')}</p></>}</section>
    <section className="card"><div className="section-heading"><div><p className="eyebrow">{t('tracking.connectingDots')}</p><h2>{t('tracking.symptomPatterns')}</h2></div><Sparkles size={24} aria-hidden="true" /></div>{patterns.length ? <div className="stack">{patterns.map(pattern => <article key={`${pattern.id}-${pattern.window || ""}-${pattern.symptomId || ""}`} className="tracking-pattern"><span className="tracking-stat-icon lilac"><Heart size={22} aria-hidden="true" /></span><div><h3>{getPatternText(pattern, t)}</h3><p className="muted">{t('tracking.patternBasedOn', { count: pattern.count, total: pattern.total || recent.length })}</p></div></article>)}</div> : <div className="tracking-soft-box"><h3>{t('tracking.patternsTakeTime')}</h3><p>{t('tracking.patternMinimum')}</p></div>}<p className="muted">{t('tracking.patternNote')}</p></section>
    <div className="grid-2"><section className="card tracking-estimate-card"><CalendarDays size={24} aria-hidden="true" /><h2>{t('tracking.nextEstimate')}</h2><strong className="tracking-estimate-dates">{analysis.prediction ? rangeText(analysis.prediction, lang) : state.profile.pregnancyEnabled ? t('tracking.predictionsPaused') : t('tracking.notEnoughData')}</strong><p className="muted">{t('tracking.predictionMethod')}</p><details className="estimate-explanation"><summary>{t('tracking.explainEstimate')}</summary><p>{t('tracking.estimateRecords', { count: recent.length, limit: CONFIG.recentCycleLimit })}</p>{recent.length > 0 && <ul>{recent.map(cycle => <li key={cycle.start}>{t('tracking.chartRecord', { date: dateText(cycle.start, lang), cycle: cycle.length, period: cycle.periodLength })}</li>)}</ul>}{analysis.prediction ? <p>{t('tracking.estimateMath', { median: analysis.median, margin: analysis.prediction.margin })}</p> : <p>{t(state.profile.pregnancyEnabled ? 'tracking.predictionsPaused' : analysis.suspectedGaps?.length ? 'tracking.reviewGap' : 'tracking.notEnoughData')}</p>}<p>{t('tracking.estimateLimits')}</p></details>{analysis.irregular && <p>{t('tracking.irregularExplanation')}</p>}<button className="tracking-text-link" onClick={() => onNavigate('/guidance')}>{t('tracking.whenDoctor')}<ArrowRight size={16} aria-hidden="true" /></button></section><section className="card tracking-insight-card"><Leaf size={24} aria-hidden="true" /><h2>{t('tracking.noPerfectCycle')}</h2><p>{t('tracking.noPerfectCycleDescription')}</p><button className="tracking-text-link" onClick={() => onNavigate('/learn')}>{t('tracking.learnAboutCycles')}<ArrowRight size={16} aria-hidden="true" /></button></section></div>
    {(state.profile.ageGroup === 'adult' || state.profile.fertilityEnabled) && !state.profile.pregnancyEnabled && <section className="card tracking-fertility"><h2>{t('tracking.fertilityEstimates')}</h2>{analysis.irregular ? <p>{t('tracking.fertilityHidden')}</p> : analysis.ovulation ? <><p><strong>{t('tracking.ovulationEstimate')}: </strong>{rangeText(analysis.ovulation, lang)}</p><p><strong>{t('tracking.fertileEstimate')}: </strong>{rangeText(analysis.fertile, lang)}</p><p className="tracking-soft-box">{t('tracking.notContraception')}</p></> : <p className="muted">{t('tracking.notEnoughData')}</p>}</section>}
    <PrivacyNote t={t} />
  </div>;
}

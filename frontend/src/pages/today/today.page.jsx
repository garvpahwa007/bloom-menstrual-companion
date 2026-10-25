import React from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, Droplets, Heart, Info, Leaf, Plus, Sparkles } from 'lucide-react';
import { todayISO, addDays } from '../../utilities/date.helper.js';
import CONFIG from '../../config/app.config.js';
import { SOURCES } from '../../content/sources.js';
import { locale, dateObject, dateText, rangeText, getPatternText } from '../cycle/cycle-format.helper.js';
import SymptomIcon from '../../components/tracking/symptom-icon.component.jsx';
import PageHeading from '../../components/layout/page-heading.component.jsx';
import PrivacyNote from '../../components/tracking/privacy-note.component.jsx';

function PhaseAnalysis({ analysis, state, t, today = todayISO(), lang = 'en' }) {
  if (state.profile.pregnancyEnabled) return null;
  const cycleDay = analysis.cycleDay;
  const cycleLength = Math.max(14, Math.round(analysis.median || 28));
  const ovulationDay = Math.max(6, cycleLength - CONFIG.ovulationBeforePeriodDays);
  const phaseId = analysis.phase?.id;
  const phaseName = phaseId ? t(`tracking.phaseName.${phaseId}`) : t('tracking.phaseAnalysisUnavailable');
  const segments = [
    { id: 'menstrual', name: t('tracking.phaseName.menstrual'), days: 5 },
    { id: 'beforeOvulation', name: t('tracking.phaseName.beforeOvulation'), days: Math.max(1, ovulationDay - 5) },
    { id: 'aroundOvulation', name: t('tracking.phaseName.aroundOvulation'), days: 1 },
    { id: 'afterOvulation', name: t('tracking.phaseName.afterOvulation'), days: Math.max(1, cycleLength - ovulationDay - 1) },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.days, 0);
  const marker = phaseId && cycleDay ? Math.min(98, Math.max(2, ((cycleDay - .5) / total) * 100)) : null;
  return <section className="card phase-analysis-card" aria-labelledby="phase-analysis-title">
    <div className="section-heading"><div><p className="eyebrow">{t('tracking.phaseAnalysisKicker')} · <time dateTime={today}>{dateText(today, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</time></p><h2 id="phase-analysis-title">{t('tracking.phaseAnalysisTitle')}</h2></div><span className="phase-analysis-day">{cycleDay ? t('tracking.cycleDayNumber', { count: cycleDay }) : '—'}</span></div>
    <div className="phase-analysis-summary"><div><p className="muted">{t('tracking.currentPhase')}</p><strong>{phaseName}</strong></div>{phaseId && <p>{t(`tracking.phase.${phaseId}`)}</p>}</div>
    <div className="phase-timeline" role="img" aria-label={t('tracking.phaseTimelineLabel')}>
      {segments.map(segment => <div key={segment.id} className={`phase-timeline-segment phase-${segment.id} ${phaseId === segment.id ? 'active' : ''}`} style={{ flexGrow: segment.days }}><span>{segment.name}</span></div>)}
      {marker !== null && <span className="phase-timeline-marker" style={{ left: `${marker}%` }} aria-hidden="true"><i /></span>}
    </div>
    <div className="phase-analysis-legend"><span><i className="phase-dot menstrual" />{t('tracking.phaseName.menstrual')}</span><span><i className="phase-dot follicular" />{t('tracking.phaseName.beforeOvulation')}</span><span><i className="phase-dot ovulation" />{t('tracking.phaseName.aroundOvulation')}</span><span><i className="phase-dot luteal" />{t('tracking.phaseName.afterOvulation')}</span></div>
    <div className="phase-hormone-note"><strong>{t('tracking.phaseEducationTitle')}</strong><p>{t('tracking.phaseEducationBody')}</p><div className="phase-hormone-list"><span><i className="hormone-line fsh" />{t('tracking.hormone.fsh')}</span><span><i className="hormone-line lh" />{t('tracking.hormone.lh')}</span><span><i className="hormone-line pg" />{t('tracking.hormone.pg')}</span><span><i className="hormone-line e2" />{t('tracking.hormone.e2')}</span></div></div>
    <p className="muted phase-analysis-note">{t('tracking.phaseAnalysisNote')}</p>
  </section>;
}

export function TodayScreen({ state, analysis, today: currentDate, t, lang, onNavigate }) {
  const today = currentDate || todayISO();
  const currentLog = state.logs[today];
  const periodToday = currentLog?.period;
  const recentDays = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const pattern = (analysis.patterns || []).find(item => item.count >= CONFIG.minimumPatternCycles);
  const recentCycles = analysis.recentCycles || [];
  const average = Number.isFinite(analysis.average) ? Math.round(analysis.average * 10) / 10 : null;
  return <div className="tracking-today stack">
    <PageHeading tracking eyebrow={dateText(today, lang, { weekday: 'long', day: 'numeric', month: 'long' })} title={t('tracking.greeting')} description={t('tracking.greetingDescription')} />
    <section className="tracking-hero" aria-labelledby="cycle-heading">
      <div className="tracking-hero-copy"><span className="tracking-hero-label"><span className="tracking-hero-dot" />{state.profile.pregnancyEnabled ? t('tracking.pregnancyMode') : t('tracking.yourCycle')}</span>
        <h2 id="cycle-heading">{state.profile.pregnancyEnabled ? t('tracking.pregnancyWelcome') : analysis.cycleDay ? <>{t('tracking.cycleDay')} <strong>{new Intl.NumberFormat(locale(lang)).format(analysis.cycleDay)}</strong></> : t('tracking.startJourney')}</h2>
        <p>{state.profile.pregnancyEnabled ? t('tracking.predictionsPaused') : periodToday ? t('tracking.periodToday') : analysis.phase ? t(`tracking.phase.${analysis.phase.id}`) : analysis.irregular ? t('tracking.irregularPhase') : t('tracking.phaseUncertain')}</p>
        <button className="button tracking-hero-button" onClick={() => onNavigate(state.profile.pregnancyEnabled ? '/pregnancy' : '/log')}>{state.profile.pregnancyEnabled ? t('tracking.viewPregnancy') : currentLog ? t('tracking.editToday') : t('tracking.logToday')}<ArrowUpRight size={20} aria-hidden="true" /></button>
      </div>
      <div className="tracking-cycle-orbit" aria-hidden="true"><div className="tracking-orbit-ring tracking-orbit-ring-one" /><div className="tracking-orbit-ring tracking-orbit-ring-two" /><div className="tracking-orbit-center"><img className="tracking-cycle-logo" src="/bloom-mark.png" alt="" /><span>{t('tracking.withYou')}</span></div><div className="tracking-orbit-small"><Heart size={20} /></div></div>
      {!state.profile.pregnancyEnabled && <><div className="tracking-hero-estimate"><CalendarDays size={21} aria-hidden="true" /><div><span>{t('tracking.nextEstimate')}</span><strong>{analysis.prediction ? rangeText(analysis.prediction, lang) : t(analysis.suspectedGaps?.length ? 'tracking.reviewGap' : 'tracking.notEnoughData')}</strong></div>{analysis.irregular && <span className="badge tracking-irregular-badge">{t('tracking.irregular')}</span>}</div><p className="tracking-hero-caveat">{t('tracking.estimateCaveat')}</p></>}
    </section>
    {analysis.prediction?.to < today && !state.profile.pregnancyEnabled && <div className="notice"><Info size={20} /><p>{t('tracking.estimatePassed')}</p></div>}
    <PhaseAnalysis analysis={analysis} state={state} t={t} today={today} lang={lang} />
    <details className="today-collapsible"><summary><span>{t('tracking.overview')}</span><ChevronDown size={19} aria-hidden="true" /></summary><div className="today-disclosure-body"><div className="grid-3 tracking-stats">
      <article className="card tracking-stat"><span className="tracking-stat-icon lilac"><CalendarDays size={20} aria-hidden="true" /></span><span className="muted">{t('tracking.averageCycle')}</span><strong>{average === null ? '—' : t('tracking.daysCount', { count: average })}</strong><small className="muted">{t('tracking.basedOnCycles', { count: recentCycles.length })}</small></article>
      <article className="card tracking-stat"><span className="tracking-stat-icon peach"><Droplets size={20} aria-hidden="true" /></span><span className="muted">{t('tracking.lastPeriod')}</span><strong>{analysis.periods?.length ? dateText(analysis.periods.at(-1).start, lang) : '—'}</strong><small className="muted">{analysis.periods?.length ? t('tracking.daysLogged', { count: analysis.periods.at(-1).length }) : t('tracking.addFirstPeriod')}</small></article>
      <article className="card tracking-stat"><span className="tracking-stat-icon sage"><Heart size={20} aria-hidden="true" /></span><span className="muted">{t('tracking.yourCheckIn')}</span><strong>{currentLog?.mood ? t(`tracking.mood.${currentLog.mood}`) : t('tracking.howYouFeel')}</strong><small className="muted">{currentLog ? t('tracking.savedForToday') : t('tracking.takeAMoment')}</small></article>
    </div></div></details>
    <details className="today-collapsible"><summary><span>{t('tracking.recentAndInsights')}</span><ChevronDown size={19} aria-hidden="true" /></summary><div className="today-disclosure-body"><div className="tracking-dashboard-grid">
      <section className="card tracking-recent-card"><div className="section-heading"><div><p className="eyebrow">{t('tracking.atAGlance')}</p><h2>{t('tracking.recentDays')}</h2></div><button className="icon-button" aria-label={t('tracking.openCalendar')} onClick={() => onNavigate('/calendar')}><ArrowUpRight size={21} aria-hidden="true" /></button></div>
        <div className="tracking-day-strip">{recentDays.map(date => <div key={date} className={`tracking-strip-day ${state.logs[date]?.period ? 'logged' : ''} ${date === today ? 'today' : ''}`}><span>{dateText(date, lang, { weekday: 'narrow' })}</span><button onClick={() => onNavigate(`/log?date=${date}`)} aria-label={`${dateText(date, lang, { day: 'numeric', month: 'long' })}${state.logs[date]?.period ? `, ${t('tracking.loggedPeriod')}` : ''}`}>{dateObject(date).getDate()}</button><i aria-hidden="true">{state.logs[date]?.symptoms?.length ? '•' : '\u00a0'}</i></div>)}</div>
        <div className="tracking-legend"><span><i className="legend-dot logged" />{t('tracking.loggedPeriod')}</span><span><i className="legend-dot symptom" />{t('tracking.symptoms')}</span></div>
      </section>
      <section className="card tracking-insight-card"><span className="tracking-insight-spark"><Sparkles size={22} aria-hidden="true" /></span><p className="eyebrow">{t('tracking.personalInsight')}</p><h2>{pattern ? t('tracking.patternEmerging') : t('tracking.yourBodyYourPace')}</h2><p>{pattern ? getPatternText(pattern, t) : analysis.irregular ? t('tracking.irregularInsight') : t('tracking.patternsNeedTime')}</p><button className="tracking-text-link" onClick={() => onNavigate('/insights')}>{t('tracking.exploreInsights')}<ArrowRight size={17} aria-hidden="true" /></button></section>
    </div>{!state.profile.pregnancyEnabled && (state.profile.ageGroup === 'adult' || state.profile.fertilityEnabled) && analysis.ovulation && analysis.fertile && <section className="card tracking-fertility"><h2>{t('tracking.fertilityEstimates')}</h2><p><strong>{t('tracking.ovulationEstimate')}: </strong>{rangeText(analysis.ovulation, lang)}</p><p><strong>{t('tracking.fertileEstimate')}: </strong>{rangeText(analysis.fertile, lang)}</p><p className="tracking-soft-box">{t('tracking.notContraception')}</p><a href={SOURCES.fertilityWindow.url} target="_blank" rel="noreferrer" aria-label={`${t('tracking.fertilitySource')}: ${SOURCES.fertilityWindow.name}`}>{t('tracking.fertilitySource')}<ArrowUpRight size={15} aria-hidden="true" /></a><button className="tracking-text-link" onClick={() => onNavigate('/insights')}>{t('tracking.exploreInsights')}<ArrowRight size={16} aria-hidden="true" /></button></section>}</div></details>
    <details className="today-collapsible"><summary><span>{t('tracking.quickCheckIn')}</span><ChevronDown size={19} aria-hidden="true" /></summary><div className="today-disclosure-body"><section className="card tracking-quick-log"><div className="section-heading"><div><h2>{t('tracking.howAreYou')}</h2><p className="muted">{t('tracking.smallCheckIn')}</p></div><span className="badge">{t('tracking.justAMinute')}</span></div><div className="tracking-quick-symptoms">{['cramps', 'bloating', 'tiredness', 'acne'].map(id => <button key={id} className="tracking-symptom-button" onClick={() => onNavigate(`/log?date=${today}&symptom=${id}`)}><span><SymptomIcon id={id} /></span>{t(`tracking.symptom.${id}`)}<Plus size={15} aria-hidden="true" /></button>)}</div></section></div></details>
    <details className="today-collapsible"><summary><span>{t('tracking.learnAndPrivacy')}</span><ChevronDown size={19} aria-hidden="true" /></summary><div className="today-disclosure-body"><button className="tracking-learn-banner" onClick={() => onNavigate('/learn')}><span className="tracking-learn-art" aria-hidden="true"><Leaf size={30} /></span><span><span className="eyebrow">{t('tracking.learnLittle')}</span><strong>{t('tracking.understandIrregular')}</strong><span className="muted">{t('tracking.learnDescription')}</span></span><ArrowUpRight size={24} aria-hidden="true" /></button><PrivacyNote t={t} /></div></details>
  </div>;
}

export default TodayScreen;

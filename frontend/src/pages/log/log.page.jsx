import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, CircleDashed, Cloud, CloudLightning, CloudRain, CloudSun, Droplets, Frown, Heart, Info, Meh, Minus, Moon, ShieldAlert, ShieldCheck, Smile, Sparkles, Sun, Waves, Wind, Zap } from 'lucide-react';
import { todayISO } from '../../utilities/date.helper.js';
import { SYMPTOMS } from '../../constants/symptom.constant.js';
import { MOOD_IDS, LEGACY_MOOD_IDS } from '../../constants/mood.constant.js';
import CONFIG from '../../config/app.config.js';
import { dateText, isLocalDate } from '../cycle/cycle-format.helper.js';
import SymptomIcon from '../../components/tracking/symptom-icon.component.jsx';
import Choice from '../../components/tracking/choice.component.jsx';
import CheckField from '../../components/tracking/check-field.component.jsx';
import PageHeading from '../../components/layout/page-heading.component.jsx';
import PrivacyNote from '../../components/tracking/privacy-note.component.jsx';

const defaultLog = date => ({ date, period: false, flow: 'medium', padFrequent: false, largeClots: false, pain: 0, painDisrupts: false, painUnrelieved: false, symptoms: [], symptomIntensity: {}, mood: 'fine', energy: 'okay', sleep: 8, medicines: '', note: '', betweenBleeding: false, afterSexBleeding: false, pregnancyPossible: false, urgentPain: false, fainting: false });
const MOOD_ICONS = { moodSwings: CloudSun, notInControl: CircleDashed, fine: Cloud, happy: Sun, sad: CloudRain, sensitive: Wind, angry: CloudLightning, confident: ShieldCheck, excited: Sparkles, irritable: Zap, anxious: Waves, insecure: ShieldAlert, grateful: Heart, indifferent: Minus };
const LEGACY_MOOD_ICONS = { veryLow: Frown, low: Frown, okay: Meh, good: Smile, great: Sun };

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
  const set = (key, value) => { setLog(old => { const next = { ...old, [key]: value }; if ((key === 'flow' && value !== 'heavy') || (key === 'period' && value === false)) { next.padFrequent = false; next.largeClots = false; } return next; }); setSaved(false); };
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
    <PageHeading tracking eyebrow={t('tracking.dailyCheckIn')} title={t('tracking.logDay')} description={t('tracking.logDescription')} />
    <form onSubmit={save} className="stack">{date > todayISO() && <div className="notice"><p>{t('tracking.futureDate')}</p></div>}
      <section className="card tracking-log-date"><label className="field"><span>{t('tracking.date')}</span><input className="input" type="date" value={date} max={todayISO()} onChange={event => { if (event.target.value) setParams({ date: event.target.value }); }} required /></label><span className="muted">{dateText(date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></section>
      <section className="card"><div className="section-heading"><h2>{t('tracking.period')}</h2><Droplets size={22} aria-hidden="true" /></div><p className="muted">{t('tracking.periodQuestion')}</p><div className="tracking-choice-row two"><Choice active={log.period} onClick={() => set('period', true)} icon={Droplets} label={t('tracking.periodOn')} /><Choice active={!log.period} onClick={() => set('period', false)} icon={Sun} label={t('tracking.periodOff')} /></div>
        {log.period && <div className="tracking-form-section"><h3>{t('tracking.flow')}</h3><div className="tracking-choice-row four">{['spotting', 'light', 'medium', 'heavy'].map(flow => <Choice key={flow} active={log.flow === flow} onClick={() => set('flow', flow)} icon={Droplets} label={t(`tracking.flow.${flow}`)} className={`flow-${flow}`} />)}</div>{log.flow === 'heavy' && <div className="tracking-soft-box stack"><h3>{t('tracking.heavyQuestions')}</h3><CheckField checked={log.padFrequent} onChange={value => set('padFrequent', value)}>{t('tracking.padFrequent')}</CheckField><CheckField checked={log.largeClots} onChange={value => set('largeClots', value)}>{t('tracking.largeClots')}</CheckField><p className="muted">{t('tracking.heavyHelp')}</p></div>}</div>}
      </section>
      <section className="card"><div className="section-heading"><h2>{t('tracking.pain')}</h2><span className="tracking-pain-number">{log.pain}<small>/{CONFIG.painScaleMaximum}</small></span></div><label className="field"><span>{t('tracking.painScale')}</span><input className="tracking-pain-range" type="range" min="0" max={CONFIG.painScaleMaximum} step="1" value={log.pain} onChange={event => set('pain', Number(event.target.value))} /></label><div className="tracking-range-labels muted"><span>{t('tracking.noPain')}</span><span>{t('tracking.worstPain')}</span></div><div className="stack tracking-form-section"><CheckField checked={log.painDisrupts} onChange={value => set('painDisrupts', value)}>{t('tracking.painDisrupts')}</CheckField><CheckField checked={log.painUnrelieved} onChange={value => set('painUnrelieved', value)}>{t('tracking.painUnrelieved')}</CheckField></div></section>
      <section className="card"><div className="section-heading"><h2>{t('tracking.symptoms')}</h2><button type="button" className="tracking-text-link" onClick={() => onNavigate('/settings')}>{t('tracking.customise')}</button></div><p className="muted">{t('tracking.symptomsDescription')}</p><div className="tracking-symptom-grid">{tracked.map(symptom => <button key={symptom.id} type="button" className={`tracking-symptom-choice ${log.symptoms.includes(symptom.id) ? 'selected' : ''}`} aria-pressed={log.symptoms.includes(symptom.id)} onClick={() => toggleSymptom(symptom.id)}><SymptomIcon id={symptom.id} /><span>{t(`tracking.symptom.${symptom.id}`)}</span>{log.symptoms.includes(symptom.id) && <Check size={14} aria-hidden="true" />}</button>)}</div>{selectedTracked.length > 0 && <div className="tracking-intensity-list"><p className="muted">{t('tracking.intensityOptional')}</p>{selectedTracked.map(symptom => { const name = t(`tracking.symptom.${symptom.id}`); const intensity = log.symptomIntensity?.[symptom.id]; return <fieldset className="tracking-intensity-field" key={symptom.id}><legend>{t('tracking.intensityFor', { symptom: name })}</legend><div className="tracking-choice-row three" role="group" aria-label={t('tracking.intensityFor', { symptom: name })}>{['mild', 'moderate', 'strong'].map((level, index) => <Choice key={level} active={intensity === index + 1} onClick={() => setIntensity(symptom.id, index + 1)} label={t(`tracking.intensity.${level}`)} />)}</div>{intensity && <button type="button" className="text-link" onClick={() => setIntensity(symptom.id, null)}>{t('tracking.clearIntensity')}</button>}</fieldset>; })}</div>}</section>
      <section className="card"><h2>{t('tracking.mood')}</h2><p className="muted">{t('tracking.moodQuestion')}</p><div className="tracking-mood-grid" role="group" aria-label={t('tracking.mood')}>{MOOD_IDS.map(mood => <Choice key={mood} className="tracking-mood-choice" active={log.mood === mood} onClick={() => set('mood', mood)} icon={MOOD_ICONS[mood]} label={t(`tracking.mood.${mood}`)} />)}</div><details className="tracking-legacy-moods" open={LEGACY_MOOD_IDS.includes(log.mood)}><summary>{t('tracking.moodLegacyScale')}</summary><div className="tracking-choice-row five">{LEGACY_MOOD_IDS.map(mood => <Choice key={mood} active={log.mood === mood} onClick={() => set('mood', mood)} icon={LEGACY_MOOD_ICONS[mood]} label={t(`tracking.mood.${mood}`)} />)}</div></details><div className="tracking-form-section"><h3>{t('tracking.energy')}</h3><div className="tracking-choice-row three">{['low', 'okay', 'high'].map(energy => <Choice key={energy} active={log.energy === energy} onClick={() => set('energy', energy)} icon={Zap} label={t(`tracking.energy.${energy}`)} />)}</div></div><div className="tracking-form-section"><label className="field"><span><Moon size={17} aria-hidden="true" /> {t('tracking.sleep')}</span><input className="input" type="number" min="0" max={CONFIG.maximumSleepHours} step={CONFIG.sleepInputStep} value={log.sleep} onChange={event => set('sleep', event.target.value)} required /></label></div></section>
      <section className="card stack"><h2>{t('tracking.moreDetails')}</h2><p className="muted">{t('tracking.detailsOptional')}</p><CheckField checked={log.betweenBleeding} onChange={value => set('betweenBleeding', value)}>{t('tracking.betweenBleeding')}</CheckField><CheckField checked={log.afterSexBleeding} onChange={value => set('afterSexBleeding', value)}>{t('tracking.afterSexBleeding')}</CheckField><CheckField checked={log.pregnancyPossible} onChange={value => set('pregnancyPossible', value)}>{t('tracking.pregnancyPossible')}</CheckField><CheckField checked={log.urgentPain} onChange={value => set('urgentPain', value)}>{t('tracking.urgentPain')}</CheckField><CheckField checked={log.fainting} onChange={value => set('fainting', value)}>{t('tracking.fainting')}</CheckField>{(log.urgentPain || (log.pain >= CONFIG.severePainMinimum && log.painUnrelieved) || ((log.fainting || log.symptoms.includes('dizziness')) && log.period && log.flow === 'heavy') || ((log.pregnancyPossible || state.profile.pregnancyEnabled) && (log.period || log.betweenBleeding || log.afterSexBleeding || log.pain >= CONFIG.severePainMinimum))) && <div className="tracking-help-now" role="alert"><Info size={20} aria-hidden="true" /><div><strong>{t('tracking.getHelpNow')}</strong><p>{t('tracking.urgentNumbers')}</p><button type="button" className="tracking-text-link" onClick={() => onNavigate('/guidance')}>{t('tracking.viewGuidance')}<ArrowRight size={16} aria-hidden="true" /></button></div></div>}</section>
      <section className="card stack"><label className="field"><span>{t('tracking.medicines')}</span><input className="input" type="text" maxLength="300" value={log.medicines} placeholder={t('tracking.medicinesPlaceholder')} onChange={event => set('medicines', event.target.value)} /></label><label className="field"><span>{t('tracking.privateNote')}</span><textarea className="input" rows="3" maxLength="1000" value={log.note} placeholder={t('tracking.notePlaceholder')} onChange={event => set('note', event.target.value)} /></label><PrivacyNote t={t} /></section>
      <div className="tracking-save-bar"><div aria-live="polite">{saved && <p className="tracking-save-message"><Check size={18} aria-hidden="true" />{t('tracking.saved')}</p>}{error && <p role="alert">{error}</p>}</div><button className="button primary" disabled={saving} type="submit">{saving ? t('tracking.saving') : t('tracking.saveLog')}<Check size={18} aria-hidden="true" /></button></div>
    </form>
  </div>;
}

export default LogScreen;

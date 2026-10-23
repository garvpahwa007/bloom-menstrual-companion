import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUp, BookOpen, Check, ChevronRight, CalendarDays, ClipboardList, Download, Droplets, Flower2, Heart, Leaf, MessageCircle, Phone, Printer, ShieldCheck, Sparkles, Sun, Volume2, X } from 'lucide-react';
import { LESSONS, LESSON_DIAGRAMS } from '../content/lessons.js';
import { lessonsForAge } from '../content/learning-paths.js';
import { FAQ } from '../content/faq.js';
import { SOURCES, RED_FLAG_SOURCE_LABELS } from '../content/sources.js';
import { RED_FLAGS } from '../data/redflags.js';
import { buildVisitSummary } from '../lib/visit.js';
import { createVisitPDF } from '../lib/visit-pdf.js';
import { downloadFile } from '../lib/storage.js';
import { SAFETY_COPY, SUPPORT } from '../content/safety.js';
import { formatDate, todayISO } from '../lib/dates.js';
import { answerQuestion } from '../lib/ask.js';

export function PageHeading({ t, section, children }) {
  return <div className="page-heading"><div><p className="eyebrow">{t(`${section}.kicker`)}</p><h1>{t(`${section}.title`)}</h1><p className="muted">{t(`${section}.subtitle`)}</p></div>{children}</div>;
}

export function Sources({ ids = [], t }) {
  const hindi = t.language === 'hi';
  return <div className="sources"><span>{t('common.sources')}</span>{[...new Set(ids)].map(id => SOURCES[id] ? <a href={SOURCES[id].url} key={id} target="_blank" rel="noreferrer">{hindi ? SOURCES[id].nameHi || SOURCES[id].name : SOURCES[id].name}<ArrowRight size={13} aria-hidden="true" /></a> : null)}</div>;
}

export function useLocalSpeech(lang) {
  const [voice, setVoice] = useState(null); const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const update = () => setVoice(speechSynthesis.getVoices().find(v => v.localService && v.lang.toLowerCase().startsWith(lang === 'hi' ? 'hi' : 'en')) || null);
    update(); speechSynthesis.addEventListener('voiceschanged', update);
    return () => { speechSynthesis.cancel(); speechSynthesis.removeEventListener('voiceschanged', update); };
  }, [lang]);
  const stop = () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); setSpeaking(false); };
  const speak = text => { if (!voice) return; stop(); const utterance = new SpeechSynthesisUtterance(text); utterance.voice = voice; utterance.lang = voice.lang; utterance.onend = () => setSpeaking(false); utterance.onerror = () => setSpeaking(false); setSpeaking(true); speechSynthesis.speak(utterance); };
  return { available: !!voice, speaking, speak, stop };
}

export function GuidanceScreen({ cards, t, lang, onNavigate, onUpdateState }) {
  return <div className="stack"><PageHeading t={t} section="doctor"><button className="button primary" onClick={() => onNavigate('/visit')}><ClipboardList size={19} />{t('doctor.prepare')}</button></PageHeading>
    <div className="notice"><Heart size={21} aria-hidden="true" /><p>{t('doctor.early')}</p></div>
    {!cards.length && <div className="card empty-state"><ShieldCheck size={36} /><h2>{t('doctor.noCards')}</h2><p>{t('doctor.noCardsBody')}</p></div>}
    <div className="guidance-grid">{cards.map(card => <article key={card.id} className={`card guidance-card ${card.severity}`}><div className="section-heading"><span className="badge"><Heart size={14} aria-hidden="true" />{t(card.severity === 'urgent' ? 'doctor.urgent' : card.severity === 'support' ? 'doctor.supportBadge' : 'doctor.consult')}</span>{card.severity !== 'urgent' && <button className="icon-button" aria-label={t('doctor.dismiss')} onClick={() => onUpdateState(s => ({ ...s, dismissals: { ...s.dismissals, [card.id]: card.signature } }))}><X size={18} /></button>}</div><h2>{t(`guidance.${card.id}.title`)}</h2><span className="small-label">{t('doctor.noticed')}</span><p className="evidence-dates">{card.dates.map(date => formatDate(date, lang, { year: 'numeric' })).join(' · ')}</p><span className="small-label">{t('doctor.why')}</span><p>{t(`guidance.${card.id}.why`)}</p>{card.minimum && <p className="muted">{t('tracking.rangeDays', { from: card.minimum, to: card.maximum })}</p>}
      {card.severity === 'urgent' ? <div className="stack"><p>{SAFETY_COPY.urgent[lang]}</p><div className="button-row"><a className="button primary" href="tel:112"><Phone size={16} />{t('doctor.call112')}</a><a className="button secondary" href="tel:108">{t('doctor.call108')}</a></div></div> : card.id === 'veryLowMood' ? <div className="stack"><p>{SAFETY_COPY.lowMood[lang]}</p><a className="button secondary" href={SUPPORT.mentalHealth.phoneUrl}><Phone size={16} />{t('doctor.support')}</a></div> : <><span className="small-label">{t('doctor.next')}</span><p>{t('doctor.options')}</p><a className="text-link" href="https://esanjeevani.mohfw.gov.in/" target="_blank" rel="noreferrer">{t('doctor.teleconsult')}<ArrowRight size={16} /></a></>}
      <div className="sources">{[card.source, ...(RED_FLAGS.find(rule => rule.id === card.id)?.additionalSources || [])].map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{RED_FLAG_SOURCE_LABELS[source.url]?.[lang] || t('common.source')}<ArrowRight size={13} /></a>)}</div></article>)}</div>
    <section className="card soft-card"><h2>{t('doctor.otherTitle')}</h2><p>{t('doctor.otherBody')}</p><Sources ids={['firstPeriod', 'irregular', 'menopause']} t={t} /></section>
  </div>;
}

export function VisitScreen({ state, t, lang }) {
  const summary = useMemo(() => buildVisitSummary(state), [state]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const span = dates => dates.map(date => formatDate(date, lang, { year: 'numeric' })).join(' · ');
  const pdf = async () => { setBusy(true); setError(''); try { const blob = await createVisitPDF(summary, t, lang); downloadFile(`saheli-visit-${todayISO()}.pdf`, blob, 'application/pdf'); } catch { setError(t('visit.pdfError')); } finally { setBusy(false); } };
  const fullRecord = () => downloadFile(`saheli-visit-${todayISO()}.json`, JSON.stringify(summary, null, 2), 'application/json');
  return <div className="stack"><div className="page-heading no-print"><div><p className="eyebrow">{t('doctor.prepare')}</p><h1>{t('visit.title')}</h1></div><div className="button-row"><button className="button primary" disabled={busy} onClick={pdf}><Download size={18} />{t(busy ? 'common.loading' : 'visit.pdf')}</button><button className="button secondary" onClick={() => window.print()}><Printer size={18} />{t('visit.print')}</button></div></div>{error && <p role="alert">{error}</p>}<p className="notice no-print">{t('visit.overview')}</p><article className="card visit-sheet"><header><div className="visit-brand"><Flower2 size={24} /><strong>{t('app.name')}</strong></div><h2>{t('visit.title')}</h2><p>{t('visit.subtitle')}</p><p>{t('visit.coverage', { count: summary.loggedDays, from: formatDate(summary.dateRange.from, lang, { year: 'numeric' }) || '—', to: formatDate(summary.dateRange.to, lang, { year: 'numeric' }) || '—' })}</p></header><div className="visit-columns"><section><h3>{t('visit.history')}</h3>{summary.cycles.length ? <p>{summary.cycles.map(cycle => t('visit.cycleLine', { from: formatDate(cycle.start, lang, { year: 'numeric' }), count: cycle.length })).join(' · ')}</p> : <p>{t('visit.none')}</p>}<h3>{t('visit.periods')}</h3>{summary.periods.length ? <p>{summary.periods.map(period => `${t('visit.periodLine', { from: formatDate(period.start, lang), to: formatDate(period.end, lang), count: period.length })}${period.ongoing ? ` (${t('visit.ongoing')})` : ''}`).join(' · ')}</p> : <p>{t('visit.none')}</p>}<h3>{t('visit.painSummary')}</h3><ul><li>{t('visit.maxPain', { pain: summary.pain.max })}</li><li>{t('visit.disrupted', { count: summary.pain.daysDisrupted })}</li><li>{t('visit.unrelieved', { count: summary.pain.daysUnrelieved })}</li></ul><h3>{t('visit.symptomCounts')}</h3><p>{summary.symptomCounts.map(item => t('visit.symptomCount', { symptom: t(`tracking.symptom.${item.id}`), count: item.count })).join(' · ') || t('visit.none')}</p><h3>{t('visit.symptomIntensity')}</h3>{summary.symptomIntensityCounts.length ? <ul>{summary.symptomIntensityCounts.map(item => <li key={item.id}>{t('visit.symptomIntensityCount', { symptom: t(`tracking.symptom.${item.id}`), mild: item.mild, moderate: item.moderate, strong: item.strong, ratedDays: item.ratedDays })}</li>)}</ul> : <p>{t('visit.none')}</p>}</section><section><h3>{t('visit.medicineHistory')}</h3>{summary.medicines.length ? <ul>{summary.medicines.map(item => <li key={item.name}>{t('visit.medicineDates', { name: item.name, dates: span(item.dates) })}</li>)}</ul> : <p>{t('visit.none')}</p>}<h3>{t('visit.careEvidence')}</h3>{summary.guidance.length ? <ul>{summary.guidance.map(card => <li key={card.id}><strong>{t(`guidance.${card.id}.title`)}</strong><span className="visit-evidence">{span(card.dates)}</span></li>)}</ul> : <p>{t('visit.none')}</p>}<h3>{t('visit.questions')}</h3><ul>{['q1', 'q2', 'q3'].map(id => <li key={id}>{t(`visit.${id}`)}</li>)}</ul></section></div><footer>{t('visit.note')}</footer></article><button className="text-link fit-content no-print" onClick={fullRecord}><Download size={18} />{t('visit.fullRecord')}</button></div>;
}

const diagramIcons = { drop: Droplets, leaf: Leaf, sun: Sun, calendar: CalendarDays, book: BookOpen, heart: Heart, clipboard: ClipboardList, shield: ShieldCheck };
function LessonDiagram({ diagram, t, lang }) {
  if (!diagram) return null;
  return <figure className="lesson-diagram" aria-label={t('learn.diagram')}><ol className="diagram-grid">{diagram.steps.map((step, index) => { const Icon = diagramIcons[step.icon] || Leaf; return <li className="diagram-step" key={index}><span className="diagram-step-number" aria-hidden="true">{index + 1}</span><Icon size={30} aria-hidden="true" /><h2>{step.label[lang]}</h2><p>{step.text[lang]}</p></li>; })}</ol><figcaption className="diagram-caption">{diagram.caption[lang]}</figcaption><Sources ids={diagram.sourceIds} t={t} /></figure>;
}

const lessonIcons = [Flower2, CalendarIcon, Leaf, Heart, ShieldCheck, BookOpen, Sparkles];
function CalendarIcon(props) { return <ClipboardList {...props} />; }
export function LearnScreen({ state, t, lang }) {
  const orderedLessons = lessonsForAge(LESSONS, state?.profile.ageGroup);
  const featuredLesson = orderedLessons[0];
  const [params, setParams] = useSearchParams(); const speech = useLocalSpeech(lang);
  const lesson = LESSONS.find(item => item.id === params.get('lesson'));
  useEffect(() => { speech.stop(); }, [params.get('lesson')]);
  if (lesson) return <div className="stack lesson-detail"><button className="text-link" onClick={() => setParams({})}><ArrowLeft size={18} />{t('learn.back')}</button><article className="card prose-card"><p className="eyebrow">{t('learn.kicker')}</p><h1>{lesson.title[lang]}</h1><p className="lesson-summary">{lesson.summary[lang]}</p>{speech.available ? <button className="button secondary" onClick={() => speech.speaking ? speech.stop() : speech.speak([lesson.title[lang], ...lesson.body[lang]].join('. '))}><Volume2 size={18} />{t(speech.speaking ? 'learn.stop' : 'learn.listen')}</button> : <p className="muted text-small">{t('learn.noVoice')}</p>}<LessonDiagram diagram={LESSON_DIAGRAMS[lesson.id]} t={t} lang={lang} /><div className="prose">{lesson.body[lang].map((p, i) => <div className="lesson-paragraph" key={i}><p>{p}</p><Sources ids={lesson.paragraphSources?.[i] || lesson.sourceIds} t={t} /></div>)}</div><Sources ids={lesson.sourceIds} t={t} /><p className="muted text-small">{t('common.notice')}</p></article></div>;
  return <div className="stack"><PageHeading t={t} section="learn" /><div className="learn-feature"><div><span className="eyebrow">{t(state?.profile.ageGroup === 'adult' ? 'learn.pathAdult' : 'learn.pathUnder18')}</span><h2>{featuredLesson.title[lang]}</h2><p>{featuredLesson.summary[lang]}</p><button className="button primary" onClick={() => setParams({ lesson: featuredLesson.id })}>{t('learn.read')}<ArrowRight size={18} /></button></div><div className="learn-flower" aria-hidden="true"><Flower2 size={125} strokeWidth={.7} /></div></div><div className="learn-grid">{orderedLessons.map((item, index) => { const Icon = lessonIcons[index % lessonIcons.length]; return <button key={item.id} className="card lesson-card" onClick={() => setParams({ lesson: item.id })}><span className={`lesson-icon tone-${index % 3}`}><Icon size={27} aria-hidden="true" /></span><h2>{item.title[lang]}</h2><p className="muted">{item.summary[lang]}</p><span className="text-link">{t('learn.read')}<ArrowRight size={17} /></span></button>; })}</div></div>;
}

export function AskScreen({ state, t, lang, onNavigate }) {
  const [question, setQuestion] = useState(''); const [messages, setMessages] = useState([]); const speech = useLocalSpeech(lang);
  useEffect(() => { setMessages([]); }, [lang]);
  const ask = value => {
    if (!value.trim()) return;
    const answer = answerQuestion(value, lang);
    setMessages(old => [...old, { question: value, answer }]); setQuestion('');
    if (state.settings.readAloud) speech.speak(answer.text || t('ask.unknown'));
  };
  const suggested = ['late', 'pcos', 'cramps', 'heavy'].map(id => FAQ.find(item => item.id === id)).filter(Boolean);
  return <div className="stack ask-page"><PageHeading t={t} section="ask" /><div className="card ask-shell"><div className="ask-intro"><span className="ask-flower"><Flower2 size={36} /></span><h2>{t('ask.title')}</h2><p className="muted">{t('ask.local')}</p><div className="local-pill"><ShieldCheck size={15} />{t('common.local')}</div></div>{!messages.length && <div className="ask-suggestions"><span className="eyebrow">{t('ask.suggestions')}</span>{suggested.map(item => <button className="suggestion" onClick={() => ask(item.question[lang])} key={item.id}>{item.question[lang]}<ArrowUp size={16} /></button>)}</div>}<div className="messages" aria-live="polite">{messages.map(({ question: q, answer }, index) => <div className="message-pair" key={index}><div className="question-bubble"><span className="small-label">{t('ask.you')}</span><p>{q}</p></div><div className={`answer-bubble ${answer.safety ? 'support-answer' : ''}`}><span className="small-label"><Flower2 size={15} />{t('ask.assistant')}</span><p>{answer.text || t('ask.unknown')}</p>{answer.safety === 'selfHarm' || answer.safety === 'support' ? <a className="button secondary" href={SUPPORT.mentalHealth.phoneUrl}><Phone size={16} />{t('doctor.support')}</a> : answer.safety === 'urgent' ? <div className="button-row"><a className="button primary" href="tel:112">{t('doctor.call112')}</a><a className="button secondary" href="tel:108">{t('doctor.call108')}</a></div> : null}{answer.consult && <button className="text-link" onClick={() => onNavigate('/visit')}>{t('ask.visit')}<ArrowRight size={16} /></button>}<Sources ids={answer.sourceIds} t={t} /><p className="text-small muted">{t('common.notice')}</p></div></div>)}</div><form className="ask-form" onSubmit={e => { e.preventDefault(); ask(question); }}><label className="sr-only" htmlFor="question">{t('ask.label')}</label><textarea id="question" maxLength={1500} value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('ask.placeholder')} rows={2} required /><button className="icon-button send-button" type="submit" disabled={!question.trim()} aria-label={t('ask.send')}><ArrowUp size={22} /></button></form><div className="ask-bottom"><span>{t('ask.fallback')}</span>{!!messages.length && <button className="text-link" onClick={() => setMessages([])}>{t('ask.clear')}</button>}</div></div></div>;
}

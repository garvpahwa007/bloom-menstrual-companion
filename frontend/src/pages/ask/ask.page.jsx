import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUp, Flower2, Phone, ShieldCheck } from 'lucide-react';
import PageHeading from '../../components/layout/page-heading.component.jsx';
import Sources from '../../components/content/sources.component.jsx';
import { FAQ } from '../../content/faq.js';
import { SUPPORT } from '../../content/safety.js';
import { useLocalSpeech } from '../../hooks/use-local-speech.js';
import { answerQuestion } from './ask.service.js';

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
  return <div className="stack ask-page"><PageHeading t={t} section="ask" /><div className="card ask-shell"><div className="ask-intro"><span className="ask-flower"><Flower2 size={36} /></span><h2>{t('ask.title')}</h2><p className="muted">{t('ask.local')}</p><div className="local-pill"><ShieldCheck size={15} />{t('common.local')}</div></div>{!messages.length && <div className="ask-suggestions"><span className="eyebrow">{t('ask.suggestions')}</span>{suggested.map(item => <button className="suggestion" onClick={() => ask(item.question[lang])} key={item.id}>{item.question[lang]}<ArrowUp size={16} /></button>)}</div>}<div className="messages" aria-live="polite">{messages.map(({ question: q, answer }, index) => <div className="message-pair" key={index}><div className="question-bubble"><span className="small-label">{t('ask.you')}</span><p>{q}</p></div><div className={`answer-bubble ${answer.safety ? 'support-answer' : ''}`}><span className="small-label"><Flower2 size={15} />{t(state.settings.discreet ? 'app.diary' : 'ask.assistant')}</span><p>{answer.text || t('ask.unknown')}</p>{answer.safety === 'selfHarm' || answer.safety === 'support' ? <a className="button secondary" href={SUPPORT.mentalHealth.phoneUrl}><Phone size={16} />{t('doctor.support')}</a> : answer.safety === 'urgent' ? <div className="button-row"><a className="button primary" href="tel:112">{t('doctor.call112')}</a><a className="button secondary" href="tel:108">{t('doctor.call108')}</a></div> : null}{answer.consult && <button className="text-link" onClick={() => onNavigate('/visit')}>{t('ask.visit')}<ArrowRight size={16} /></button>}<Sources ids={answer.sourceIds} t={t} /><p className="text-small muted">{t('common.notice')}</p><p className="text-small muted">{t('ask.worryLine')}</p></div></div>)}</div><form className="ask-form" onSubmit={e => { e.preventDefault(); ask(question); }}><label className="sr-only" htmlFor="question">{t('ask.label')}</label><textarea id="question" maxLength={1500} value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('ask.placeholder')} rows={2} required /><button className="icon-button send-button" type="submit" disabled={!question.trim()} aria-label={t('ask.send')}><ArrowUp size={22} /></button></form><div className="ask-bottom"><span>{t('ask.fallback')}</span>{!!messages.length && <button className="text-link" onClick={() => setMessages([])}>{t('ask.clear')}</button>}</div></div></div>;
}

export default AskScreen;

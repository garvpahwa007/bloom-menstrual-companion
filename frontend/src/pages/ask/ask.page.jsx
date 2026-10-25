import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, Flower2, Phone, ShieldCheck } from 'lucide-react';
import PageHeading from '../../components/layout/page-heading.component.jsx';
import Sources from '../../components/content/sources.component.jsx';
import { FAQ } from '../../content/faq.js';
import { SUPPORT } from '../../content/safety.js';
import CONFIG from '../../config/app.config.js';
import { useLocalSpeech } from '../../hooks/use-local-speech.js';
import { answerOfflineChat, CHAT_MESSAGE_LIMIT } from './chatbot.service.js';

export function AskScreen({ state, t, lang, onNavigate }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [useDiary, setUseDiary] = useState(false);
  const [historyTrimmed, setHistoryTrimmed] = useState(false);
  const nextId = useRef(0);
  const speech = useLocalSpeech(lang);
  useEffect(() => {
    setMessages([]); setQuestion(''); setUseDiary(false); setHistoryTrimmed(false);
    speech.stop();
  }, [lang]);
  const ask = value => {
    const text = value.trim().slice(0, CHAT_MESSAGE_LIMIT);
    if (!text) return;
    const answer = answerOfflineChat(text, { language: lang, state, useDiary, previousQuestion: messages.at(-1)?.question || '' });
    const pair = { id: nextId.current++, question: text, answer };
    if (messages.length >= CONFIG.maximumChatTurns) setHistoryTrimmed(true);
    setMessages(old => [...old, pair].slice(-CONFIG.maximumChatTurns));
    setQuestion('');
    if (state.settings.readAloud) speech.speak(answer.text || t('ask.unknown'));
  };
  const clear = () => {
    speech.stop(); setMessages([]); setQuestion(''); setUseDiary(false); setHistoryTrimmed(false);
  };
  const toggleDiary = enabled => {
    setUseDiary(enabled);
    if (!enabled) { speech.stop(); setMessages(old => old.filter(message => !message.answer.usedDiary)); }
  };
  const suggested = ['late', 'pcos', 'cramps', 'heavy'].map(id => FAQ.find(item => item.id === id)).filter(Boolean);
  const latest = messages.at(-1)?.answer;
  const related = latest && !['urgent', 'selfHarm'].includes(latest.safety)
    ? [...new Set(latest.relatedIds || [])].map(id => FAQ.find(item => item.id === id)).filter(Boolean)
    : [];
  return <div className="stack ask-page">
    <PageHeading t={t} section="ask" />
    <div className="card ask-shell">
      <div className="ask-intro"><span className="ask-flower"><Flower2 size={36} /></span><h2>{t('ask.title')}</h2><p className="muted">{t('ask.local')}</p><div className="local-pill"><ShieldCheck size={15} />{t('common.local')}</div></div>
      <div className="chat-privacy-controls">
        <p className="muted text-small">{t('ask.privacyDetail')}</p>
        <label className="chat-diary-toggle" htmlFor="ask-use-diary"><input id="ask-use-diary" type="checkbox" checked={useDiary} onChange={event => toggleDiary(event.target.checked)} aria-describedby="ask-diary-help" /><span>{t('ask.useDiary')}</span></label>
        <p id="ask-diary-help" className="muted text-small">{t('ask.diaryHelp')}</p>
        {useDiary && <button className="button secondary" onClick={() => ask(t('ask.diaryPrompt'))}>{t('ask.diaryPrompt')}</button>}
      </div>
      {!messages.length && <div className="ask-suggestions"><span className="eyebrow">{t('ask.suggestions')}</span>{suggested.map(item => <button className="suggestion" onClick={() => ask(item.question[lang])} key={item.id}>{item.question[lang]}<ArrowUp size={16} /></button>)}</div>}
      <div className="messages" role="log" aria-label={t('ask.conversation')} aria-live="polite" aria-relevant="additions">
        {messages.map(({ id, question: q, answer }) => <div className="message-pair" key={id}>
          <div className="question-bubble"><span className="small-label">{t('ask.you')}</span><p>{q}</p></div>
          <div className={`answer-bubble ${answer.safety ? 'support-answer' : ''}`} data-diary-summary={answer.usedDiary || undefined}>
            <span className="small-label"><Flower2 size={15} />{t(state.settings.discreet ? 'app.diary' : 'ask.assistant')}</span>
            {answer.usedDiary && <span className="badge">{t('ask.diaryOnly')}</span>}
            <p className="chat-answer-text">{answer.text || t('ask.unknown')}</p>
            {answer.safety === 'selfHarm' || answer.safety === 'support' ? <a className="button secondary" href={SUPPORT.mentalHealth.phoneUrl}><Phone size={16} />{t('doctor.support')}</a> : answer.safety === 'urgent' ? <div className="button-row"><a className="button primary" href="tel:112">{t('doctor.call112')}</a><a className="button secondary" href="tel:108">{t('doctor.call108')}</a></div> : null}
            {answer.consult && <button className="text-link" onClick={() => onNavigate('/visit')}>{t('ask.visit')}<ArrowRight size={16} /></button>}
            {answer.usedDiary && <button className="text-link" onClick={() => onNavigate('/insights')}>{t('tracking.exploreInsights')}<ArrowRight size={16} /></button>}
            {!!answer.sourceIds?.length && <Sources ids={answer.sourceIds} t={t} />}
            <p className="text-small muted">{t('common.notice')}</p><p className="text-small muted">{t('ask.worryLine')}</p>
          </div>
        </div>)}
      </div>
      {!!related.length && <div className="ask-followups"><span className="eyebrow">{t('ask.followups')}</span>{related.map(item => <button className="suggestion" key={item.id} onClick={() => ask(item.question[lang])}>{item.question[lang]}<ArrowUp size={16} /></button>)}</div>}
      {historyTrimmed && <p className="muted text-small" role="status">{t('ask.historyLimit', { count: CONFIG.maximumChatTurns })}</p>}
      <form className="ask-form" onSubmit={event => { event.preventDefault(); ask(question); }}><label className="sr-only" htmlFor="question">{t('ask.label')}</label><textarea id="question" maxLength={CHAT_MESSAGE_LIMIT} value={question} onChange={event => setQuestion(event.target.value)} placeholder={t('ask.placeholder')} rows={2} required /><button className="icon-button send-button" type="submit" disabled={!question.trim()} aria-label={t('ask.send')}><ArrowUp size={22} /></button></form>
      <div className="ask-bottom"><span>{t('ask.fallback')}</span>{!!messages.length && <button className="text-link" onClick={clear}>{t('ask.clear')}</button>}</div>
    </div>
  </div>;
}

export default AskScreen;

import React from 'react';
import { ArrowRight, ClipboardList, Heart, Phone, ShieldCheck, X } from 'lucide-react';
import PageHeading from '../../components/layout/page-heading.component.jsx';
import Sources from '../../components/content/sources.component.jsx';
import { RED_FLAG_SOURCE_LABELS } from '../../content/sources.js';
import { RED_FLAGS } from '../../constants/redflag.constant.js';
import { SAFETY_COPY, SUPPORT } from '../../content/safety.js';
import { formatDate } from '../../utilities/date.helper.js';

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

export default GuidanceScreen;

import React, { useState } from 'react';
import { ArrowRight, Flower2, Heart, Languages, ShieldCheck } from 'lucide-react';

function Welcome({ t, lang, setLang, onCloud, onStart, hasDiary = false, onContinue }) {
  const [age, setAge] = useState('under18');
  const [busy, setBusy] = useState(false);
  const start = async demo => {
    setBusy(true);
    await onStart(demo, age);
    setBusy(false);
  };
  const changeLanguage = () => setLang(lang === 'en' ? 'hi' : lang === 'hi' ? 'ta' : 'en');

  return <main className={`welcome-screen${hasDiary ? ' welcome-returning' : ''}`}>
    <div className="welcome-top">
      <div className="brand">
        <span className="brand-mark"><img className="bloom-brand-mark" src="/bloom-mark.png" alt="" /></span>
        <strong>{t('app.name')}</strong>
      </div>
      <button className="language-button" onClick={changeLanguage}>
        <Languages size={18} />
        {t(lang === 'en' ? 'common.hindi' : lang === 'hi' ? 'common.tamil' : 'common.english')}
      </button>
    </div>

    <div className="welcome-content">
      <div className="welcome-copy">
        <p className="eyebrow">{t(hasDiary ? 'welcome.returningKicker' : 'welcome.kicker')}</p>
        <h1>{t(hasDiary ? 'welcome.returningTitle' : 'welcome.title')}</h1>
        <p>{t(hasDiary ? 'welcome.returningBody' : 'welcome.body')}</p>

        {hasDiary ? <div className="welcome-actions welcome-returning-actions">
          <button className="button primary" onClick={onContinue}>
            {t('welcome.resume')}<ArrowRight size={20} />
          </button>
          {onCloud && <button className="button secondary" onClick={onCloud}>{t('welcome.cloud')}</button>}
        </div> : <>
          <fieldset className="welcome-age">
            <legend>{t('welcome.age')}</legend>
            {['under18', 'adult'].map(value => <label key={value}>
              <input type="radio" name="age" value={value} checked={age === value} onChange={() => setAge(value)} />
              <span>{t(`welcome.${value}`)}</span>
            </label>)}
          </fieldset>
          <div className="welcome-actions">
            <button className="button primary" disabled={busy} onClick={() => start(true)}>
              {t('welcome.demo')}<ArrowRight size={20} />
            </button>
            <button className="button secondary" disabled={busy} onClick={() => start(false)}>{t('welcome.fresh')}</button>
          </div>
          <small className="muted">{t('welcome.demoNote')}</small>
          {onCloud && <p><button className="text-link" onClick={onCloud}>{t('welcome.cloud')}</button></p>}
        </>}

        <p className="welcome-private"><ShieldCheck size={17} />{t('welcome.note')}</p>
      </div>
      <div className="welcome-art" aria-hidden="true">
        <div className="art-orbit one" />
        <div className="art-orbit two" />
        <div className="art-orbit three" />
        <img className="welcome-logo-art" src="/bloom-logo.png" alt="" />
        <span className="art-leaf leaf-one"><Heart /></span>
        <span className="art-leaf leaf-two"><Flower2 /></span>
        <span className="art-caption">{t('app.tagline')}</span>
      </div>
    </div>
    <footer>{t('footer.note')}</footer>
  </main>;
}

export default Welcome;

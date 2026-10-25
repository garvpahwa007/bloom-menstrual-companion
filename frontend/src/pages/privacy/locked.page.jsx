import CONFIG from '../../config/app.config.js';
import React, { useState } from 'react';
import { Languages, LockKeyhole } from 'lucide-react';
function Locked({
  t,
  lang,
  setLang,
  onUnlock,
  onDelete,
  onCloud
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onUnlock(pin);
    } catch (e) {
      setError(t(e.message === 'secureContext' ? 'lock.secureContext' : 'lock.wrongPin'));
      setPin('');
    } finally {
      setBusy(false);
    }
  };
  return <main className="lock-screen"><div className="card lock-card"><span className="lock-icon"><LockKeyhole size={34} /></span><h1>{t('lock.title')}</h1><p className="muted">{t('lock.body')}</p><form onSubmit={submit} className="stack"><label className="field"><span>{t('settings.enterPin')}</span><input className="input pin-input" type="password" inputMode="numeric" maxLength={CONFIG.pinLength} pattern={`[0-9]{${CONFIG.pinLength}}`} autoComplete="current-password" required value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} /></label>{error && <p role="alert">{error}</p>}<button className="button primary" disabled={busy || pin.length !== CONFIG.pinLength}>{t(busy ? 'common.loading' : 'lock.unlock')}</button></form><p className="text-small muted">{t('lock.forgot')}</p><button className="text-link" onClick={onDelete}>{t('settings.delete')}</button>{onCloud && <button className="text-link" onClick={onCloud}>{t('welcome.cloud')}</button>}<button className="language-button" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}><Languages size={16} />{t(lang === 'en' ? 'common.hindi' : 'common.english')}</button></div></main>;
}
export default Locked;

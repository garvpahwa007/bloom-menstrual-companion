import React, { useEffect, useRef, useState } from 'react';
import { Cloud, ShieldCheck } from 'lucide-react';
import { cloudClient } from '../../services/http.service.js';
import { uploadEncryptedDiary, decryptCloudDiary } from './cloud.service.js';
import { cloudCopy, cloudErrorKey } from './cloud.copy.js';

export function CloudScreen({ state, lang = 'en', onRestore, onRegisterProfile, restoreAllowed = true, client = cloudClient }) {
  const copy = cloudCopy(lang);
  const [phase, setPhase] = useState('loading');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('login');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [ageGroup, setAgeGroup] = useState(state?.profile.ageGroup || '');
  const [passphrase, setPassphrase] = useState('');
  const [passphraseConfirm, setPassphraseConfirm] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [pendingRestore, setPendingRestore] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState('');
  const [noticeKey, setNoticeKey] = useState('');
  const [retry, setRetry] = useState(0);
  const active = useRef(false);
  const reviewRef = useRef(null);
  const clearSecrets = () => {
    setPassword(''); setPasswordConfirm(''); setPassphrase(''); setPassphraseConfirm(''); setRestorePassphrase(''); setAccountPassword('');
  };

  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    setPhase('loading'); setErrorKey('');
    (async () => {
      try {
        const session = await client.session({ signal: controller.signal });
        const backupStatus = await client.status({ signal: controller.signal });
        if (!controller.signal.aborted) { setUser(session.user); setStatus(backupStatus); setPhase('signedIn'); }
      } catch (error) {
        if (controller.signal.aborted) return;
        setUser(null); setStatus(null);
        if (error.status === 401) setPhase('guest');
        else { setPhase('unavailable'); setErrorKey(cloudErrorKey(error)); }
      }
    })();
    return () => { active.current = false; controller.abort(); };
  }, [client, retry]);
  useEffect(() => {
    if (pendingRestore || confirmation) reviewRef.current?.focus();
  }, [pendingRestore, confirmation]);

  async function run(work) {
    if (busy) return;
    setBusy(true); setErrorKey(''); setNoticeKey('');
    try { await work(); }
    catch (error) {
      if (!active.current) return;
      if (error.code === 'BACKUP_CONFLICT' || error.code === 'BACKUP_NOT_FOUND') {
        try { setStatus(await client.status()); } catch { /* Keep original failure; no automatic overwrite. */ }
      }
      if (error.status === 401 && error.code !== 'INVALID_CREDENTIALS') {
        if (user?.username) setAlias(user.username);
        setMode('login');
        setUser(null); setStatus(null); setPhase('guest'); setConfirmation(null); setPendingRestore(null);
      }
      setErrorKey(cloudErrorKey(error));
    } finally {
      if (active.current) { clearSecrets(); setBusy(false); }
    }
  }
  async function authenticate(event) {
    event.preventDefault();
    if (mode === 'register' && !restoreAllowed) { setErrorKey('registrationLocked'); return; }
    if (mode === 'register' && !['under18', 'adult'].includes(ageGroup)) { setErrorKey('selectAge'); return; }
    if (mode === 'register' && password !== passwordConfirm) { setErrorKey('mismatchPassword'); return; }
    await run(async () => {
      const session = await client[mode]({ username: alias.trim(), password });
      // A new account has no backup. Do not turn a successful registration
      // into an apparent signup failure if a follow-up status read is offline.
      const backupStatus = mode === 'register' ? { hasBackup: false, revision: 0, updatedAt: null } : await client.status();
      if (!active.current) return;
      setUser(session.user); setStatus(backupStatus); setPhase('signedIn'); setAlias('');
      if (mode === 'register') {
        let saved = false;
        try { saved = typeof onRegisterProfile === 'function' && await onRegisterProfile(ageGroup); }
        catch { /* Account creation succeeded; preserve sign-in even if local storage fails. */ }
        if (!active.current) return;
        if (saved) setNoticeKey('accountCreated');
        else setErrorKey('profileSaveFailed');
      }
    });
  }
  async function upload(event) {
    event.preventDefault();
    if (!state) return;
    if (passphrase !== passphraseConfirm) { setErrorKey('mismatch'); return; }
    await run(async () => {
      const result = await uploadEncryptedDiary(client, state, passphrase, status.revision);
      if (active.current) { setStatus({ ...result, hasBackup: true }); setNoticeKey('saved'); }
    });
  }
  async function decrypt(event) {
    event.preventDefault();
    if (!restoreAllowed) return;
    await run(async () => {
      const imported = await decryptCloudDiary(client, restorePassphrase);
      if (active.current) { setPendingRestore(imported); setConfirmation(null); }
    });
  }
  async function restore() {
    if (!restoreAllowed) return;
    const imported = pendingRestore;
    await run(async () => {
      if (await onRestore(imported)) {
        if (active.current) { setPendingRestore(null); setNoticeKey('restored'); }
      } else if (active.current) setErrorKey('requestFailed');
    });
  }
  async function deleteCloud(event) {
    event?.preventDefault();
    await run(async () => {
      if (confirmation === 'backup') {
        const result = await client.deleteBackup(status.revision);
        if (active.current) { setStatus({ ...result, hasBackup: false }); setNoticeKey('deleted'); }
      } else {
        await client.deleteAccount(accountPassword);
        if (active.current) { setUser(null); setStatus(null); setPhase('guest'); setNoticeKey('accountDeleted'); }
      }
      if (active.current) setConfirmation(null);
    });
  }
  const cancelConfirmation = () => { setConfirmation(null); setPendingRestore(null); clearSecrets(); setErrorKey(''); };

  return <div className="stack cloud-backup-screen">
    <div className="page-heading"><div><p className="eyebrow">{copy.kicker}</p><h1>{copy.title}</h1><p className="muted">{copy.intro}</p></div></div>
    <section className="card"><div className="section-heading"><h2>{copy.title}</h2><ShieldCheck aria-hidden="true" size={23} /></div><p>{copy.privacy}</p><p className="muted">{copy.limits}</p><p className="muted">{copy.local}</p></section>
    {errorKey && <p className="notice" role="alert">{copy[errorKey]}</p>}
    {noticeKey && <p className="notice" role="status">{copy[noticeKey]}</p>}
    {phase === 'loading' && <p role="status">{copy.loading}</p>}
    {phase === 'unavailable' && <section className="card"><p>{copy.unavailable}</p><button className="button secondary" onClick={() => setRetry(value => value + 1)}>{copy.retry}</button></section>}
    {phase === 'guest' && <section className="card stack">
      <h2>{mode === 'register' ? copy.register : copy.signIn}</h2>
      <p className="muted">{copy.sessionHelp}</p>
      {!restoreAllowed && <p className="notice">{copy.registrationLocked}</p>}
      <div className="button-row"><button className={`button ${mode === 'login' ? 'primary' : 'secondary'}`} type="button" aria-pressed={mode === 'login'} disabled={busy} onClick={() => { setMode('login'); clearSecrets(); setErrorKey(''); }}>{copy.signIn}</button><button className={`button ${mode === 'register' ? 'primary' : 'secondary'}`} type="button" aria-pressed={mode === 'register'} disabled={busy || !restoreAllowed} onClick={() => { setMode('register'); clearSecrets(); setErrorKey(''); }}>{copy.register}</button></div>
      <form className="stack" onSubmit={authenticate}>
        <label className="field"><span>{copy.alias}</span><input className="input" autoCapitalize="none" autoCorrect="off" spellCheck="false" autoComplete="username" name="username" required minLength={3} maxLength={32} pattern="[a-z0-9_]{3,32}" aria-describedby="cloud-alias-help" value={alias} onChange={e => setAlias(e.target.value)} disabled={busy} /></label>
        <p className="muted text-small" id="cloud-alias-help">{copy.aliasHelp}</p>
        {mode === 'register' && <><label className="field"><span>{copy.ageGroup}</span><select className="input" name="ageGroup" required value={ageGroup} aria-describedby="cloud-age-help" onChange={e => setAgeGroup(e.target.value)} disabled={busy || !restoreAllowed}><option value="" disabled>{copy.selectAge}</option><option value="under18">{copy.under18}</option><option value="adult">{copy.adult}</option></select></label><p className="muted text-small" id="cloud-age-help">{copy.ageHelp}</p></>}
        <label className="field"><span>{copy.password}</span><input className="input" type="password" name="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={12} maxLength={128} aria-describedby="cloud-password-help" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>
        <p className="muted text-small" id="cloud-password-help">{copy.passwordHelp}</p>
        {mode === 'register' && <label className="field"><span>{copy.confirmPassword}</span><input className="input" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} disabled={busy} /></label>}
        <button className="button primary" type="submit" disabled={busy || (mode === 'register' && !restoreAllowed)}>{busy ? copy.busy : mode === 'register' ? copy.register : copy.signIn}</button>
      </form>
    </section>}
    {phase === 'signedIn' && user && status && <>
      <section className="card"><h2>{copy.account}</h2><p>{copy.signedIn} <strong>{user.username}</strong></p><p>{status.hasBackup ? copy.backupExists : copy.noBackup}</p><p className="muted">{copy.revision}: {status.revision}{status.updatedAt && <> · {copy.savedAt}: {new Date(status.updatedAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</>}</p><button className="button secondary" disabled={busy} onClick={() => run(async () => { await client.logout(); if (active.current) { setUser(null); setStatus(null); setPhase('guest'); setConfirmation(null); setPendingRestore(null); } })}>{busy ? copy.busy : copy.logout}</button></section>
      {!confirmation && !pendingRestore && <>
        {state ? <section className="card stack"><div className="section-heading"><h2>{copy.uploadTitle}</h2><Cloud aria-hidden="true" size={23} /></div><p className="muted">{copy.uploadHelp}</p><form className="stack" onSubmit={upload}>
          <label className="field"><span>{copy.passphrase}</span><input className="input" type="password" autoComplete="off" required minLength={12} maxLength={1024} aria-describedby="cloud-passphrase-help" value={passphrase} onChange={e => setPassphrase(e.target.value)} disabled={busy} /></label>
          <label className="field"><span>{copy.confirmPassphrase}</span><input className="input" type="password" autoComplete="off" required minLength={12} maxLength={1024} value={passphraseConfirm} onChange={e => setPassphraseConfirm(e.target.value)} disabled={busy} /></label>
          <p className="muted text-small" id="cloud-passphrase-help">{copy.passphraseHelp}</p><button className="button primary" type="submit" disabled={busy}>{busy ? copy.busy : copy.upload}</button>
        </form></section> : <section className="card"><p>{copy.uploadNeedsDiary}</p></section>}
        {!restoreAllowed && <section className="card"><p>{copy.restoreLocked}</p></section>}
        {status.hasBackup && restoreAllowed && <section className="card stack"><h2>{copy.restoreTitle}</h2><p className="muted">{copy.restoreHelp}</p><form className="stack" onSubmit={decrypt}><label className="field"><span>{copy.restorePassphrase}</span><input className="input" type="password" autoComplete="off" required minLength={12} maxLength={1024} value={restorePassphrase} onChange={e => setRestorePassphrase(e.target.value)} disabled={busy} /></label><button className="button secondary" type="submit" disabled={busy}>{busy ? copy.busy : copy.decrypt}</button></form></section>}
        <section className="card stack"><h2>{copy.deleteTitle}</h2><p className="muted">{copy.deleteHelp}</p><div className="button-row">{status.hasBackup && <button className="button danger" disabled={busy} onClick={() => setConfirmation('backup')}>{copy.deleteBackup}</button>}<button className="button danger" disabled={busy} onClick={() => setConfirmation('account')}>{copy.deleteAccount}</button></div></section>
      </>}
      {pendingRestore && restoreAllowed && <section className="card stack" aria-labelledby="cloud-review-title"><h2 id="cloud-review-title" tabIndex={-1} ref={reviewRef}>{copy.reviewTitle}</h2><p>{copy.reviewHelp}</p><div className="button-row"><button className="button primary" disabled={busy} onClick={restore}>{busy ? copy.busy : copy.restore}</button><button className="button secondary" disabled={busy} onClick={cancelConfirmation}>{copy.cancel}</button></div></section>}
      {confirmation && <section className="card stack" aria-labelledby="cloud-delete-title"><h2 id="cloud-delete-title" tabIndex={-1} ref={reviewRef}>{confirmation === 'account' ? copy.confirmDeleteAccount : copy.confirmDeleteBackup}</h2><p>{confirmation === 'account' ? copy.confirmDeleteAccountHelp : copy.confirmDeleteBackupHelp}</p><form className="stack" onSubmit={deleteCloud}>{confirmation === 'account' && <label className="field"><span>{copy.password}</span><input className="input" type="password" autoComplete="current-password" required minLength={12} maxLength={128} value={accountPassword} onChange={e => setAccountPassword(e.target.value)} disabled={busy} /></label>}<div className="button-row"><button className="button danger" type="submit" disabled={busy}>{busy ? copy.busy : confirmation === 'account' ? copy.deleteAccount : copy.deleteBackup}</button><button className="button secondary" type="button" disabled={busy} onClick={cancelConfirmation}>{copy.cancel}</button></div></form></section>}
    </>}
  </div>;
}

export default CloudScreen;

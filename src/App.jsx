import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronRight, Flower2, Heart, Home, Languages, LockKeyhole, Menu, MessageCircle, NotebookPen, Settings, ShieldCheck, X } from 'lucide-react';
import { TodayScreen, LogScreen, CalendarScreen, InsightsScreen } from './components/Tracking.jsx';
import { AskScreen, GuidanceScreen, LearnScreen, VisitScreen } from './components/CareAndLearn.jsx';
import { PregnancyScreen, PrivacyDataScreen, RemindersScreen, SettingsScreen } from './components/Preferences.jsx';
import { createDemoData } from './data/demo.js';
import { analyzeCycles } from './lib/cycle.js';
import { evaluateGuidance } from './lib/guidance.js';
import { todayISO } from './lib/dates.js';
import { deleteEverything, downloadFile, disablePIN, enablePIN, exportCSV, exportJSON, importText, readEnvelope, saveState, unlockPIN, validateState } from './lib/storage.js';
import { translator } from './i18n/index.js';
import CONFIG from './config.js';
import { isReminderDue, deliverReminder } from './lib/reminders.js';

function initialState() {
  try { const envelope = readEnvelope(); return { state: envelope && !envelope.encrypted ? validateState(envelope.data) : null, locked: !!envelope?.encrypted, error: false }; }
  catch { return { state: null, locked: false, error: true }; }
}

export function Lotus({ size = 36 }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 49C11 48 8 28 17 18c10-1 15 12 15 31Z" fill="currentColor" opacity=".65" /><path d="M32 49c21-1 24-21 15-31-10-1-15 12-15 31Z" fill="currentColor" opacity=".8" /><path d="M32 49C20 34 21 17 32 9c11 8 12 25 0 40Z" fill="currentColor" /><path d="M15 47c10 9 24 9 34 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
}

class ScreenBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { const t = this.props.t; return this.state.failed ? <div className="card empty-state"><Heart size={32} /><h1>{t('error.title')}</h1><p>{t('error.body')}</p><button className="button primary" onClick={() => location.reload()}>{t('error.reload')}</button></div> : this.props.children; }
}

function Welcome({ t, lang, setLang, onStart }) {
  const [age, setAge] = useState('under18'); const [busy, setBusy] = useState(false);
  const start = async demo => { setBusy(true); await onStart(demo, age); setBusy(false); };
  return <main className="welcome-screen"><div className="welcome-top"><div className="brand"><span className="brand-mark"><img className="bloom-brand-mark" src="/bloom-mark.png" alt="" /></span><strong>{t('app.name')}</strong></div><button className="language-button" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}><Languages size={18} />{t(lang === 'en' ? 'common.hindi' : 'common.english')}</button></div><div className="welcome-content"><div className="welcome-copy"><p className="eyebrow">{t('welcome.kicker')}</p><h1>{t('welcome.title')}</h1><p>{t('welcome.body')}</p><fieldset className="welcome-age"><legend>{t('welcome.age')}</legend>{['under18', 'adult'].map(value => <label key={value}><input type="radio" name="age" value={value} checked={age === value} onChange={() => setAge(value)} /><span>{t(`welcome.${value}`)}</span></label>)}</fieldset><div className="welcome-actions"><button className="button primary" disabled={busy} onClick={() => start(true)}>{t('welcome.demo')}<ArrowRight size={20} /></button><button className="button secondary" disabled={busy} onClick={() => start(false)}>{t('welcome.fresh')}</button></div><small className="muted">{t('welcome.demoNote')}</small><p className="welcome-private"><ShieldCheck size={17} />{t('welcome.note')}</p></div><div className="welcome-art" aria-hidden="true"><div className="art-orbit one" /><div className="art-orbit two" /><div className="art-orbit three" /><img className="welcome-logo-art" src="/bloom-logo.png" alt="" /><span className="art-leaf leaf-one"><Heart /></span><span className="art-leaf leaf-two"><Flower2 /></span><span className="art-caption">{t('app.tagline')}</span></div></div><footer>{t('footer.note')}</footer></main>;
}

function Locked({ t, lang, setLang, onUnlock, onDelete }) {
  const [pin, setPin] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); setBusy(true); setError(''); try { await onUnlock(pin); } catch (e) { setError(t(e.message === 'secureContext' ? 'lock.secureContext' : 'lock.wrongPin')); setPin(''); } finally { setBusy(false); } };
  return <main className="lock-screen"><div className="card lock-card"><span className="lock-icon"><LockKeyhole size={34} /></span><h1>{t('lock.title')}</h1><p className="muted">{t('lock.body')}</p><form onSubmit={submit} className="stack"><label className="field"><span>{t('settings.enterPin')}</span><input className="input pin-input" type="password" inputMode="numeric" maxLength={CONFIG.pinLength} pattern={`[0-9]{${CONFIG.pinLength}}`} autoComplete="current-password" required value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} /></label>{error && <p role="alert">{error}</p>}<button className="button primary" disabled={busy || pin.length !== CONFIG.pinLength}>{t(busy ? 'common.loading' : 'lock.unlock')}</button></form><p className="text-small muted">{t('lock.forgot')}</p><button className="text-link" onClick={onDelete}>{t('settings.delete')}</button><button className="language-button" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}><Languages size={16} />{t(lang === 'en' ? 'common.hindi' : 'common.english')}</button></div></main>;
}

const primaryNav = [{ path: '/', key: 'today', Icon: Home }, { path: '/log', key: 'log', Icon: NotebookPen }, { path: '/calendar', key: 'calendar', Icon: CalendarDays }, { path: '/insights', key: 'insights', Icon: Activity }];
const supportNav = [{ path: '/guidance', key: 'doctor', Icon: Heart }, { path: '/learn', key: 'learn', Icon: BookOpen }, { path: '/ask', key: 'ask', Icon: MessageCircle }, { path: '/reminders', key: 'reminders', Icon: Bell }, { path: '/privacy', key: 'privacyData', Icon: ShieldCheck }];

export default function App() {
  const [boot] = useState(initialState); const [state, setState] = useState(boot.state); const stateRef = useRef(boot.state); const [locked, setLocked] = useState(boot.locked); const [storageError, setStorageError] = useState(boot.error); const [vault, setVault] = useState(null); const vaultRef = useRef(null); const [preLang, setPreLang] = useState('en'); const [menuOpen, setMenuOpen] = useState(false); const [toast, setToast] = useState(''); const [confirmation, setConfirmation] = useState(null); const queue = useRef(Promise.resolve()); const fired = useRef(new Set());
  useEffect(() => { const sync = event => { if (event.key === 'saheli.v1' || event.key === null) window.location.reload(); }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
  const navigate = useNavigate(); const location = useLocation();
  const lang = state?.settings.language || preLang; const t = useMemo(() => translator(lang), [lang]);
  const analysis = useMemo(() => state ? analyzeCycles(state.logs, { ...state.profile, trackedSymptoms: state.settings.trackedSymptoms }) : null, [state]);
  const cards = useMemo(() => state ? evaluateGuidance(state.logs, state.profile, { dismissals: state.dismissals }) : [], [state]);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dataset.size = state?.settings.textSize || 'normal'; document.documentElement.dataset.contrast = state?.settings.highContrast ? 'high' : 'normal'; document.title = state?.settings.discreet || locked ? t('app.diary') : `${t('app.name')} · ${t('app.tagline')}`; const link = document.querySelector('link[rel="icon"]'); if (link) link.href = state?.settings.discreet || locked ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='12' y='6' width='40' height='52' rx='7' fill='%23716a7a'/%3E%3Cpath d='M24 22h18M24 32h18M24 42h12' stroke='white' stroke-width='3'/%3E%3C/svg%3E" : '/bloom-mark.png'; }, [lang, state?.settings.textSize, state?.settings.highContrast, state?.settings.discreet, locked]);
  useEffect(() => { setMenuOpen(false); window.scrollTo({ top: 0 }); }, [location.pathname]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 7000); return () => clearTimeout(id); }, [toast]);
  useEffect(() => {
    if (!confirmation) return;
    const keyboard = event => {
      if (event.key === 'Escape') { confirmation.resolve(false); setConfirmation(null); }
      if (event.key === 'Tab') {
        const buttons = [...document.querySelectorAll('[role="alertdialog"] button')]; const first = buttons[0]; const last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }; document.addEventListener('keydown', keyboard); return () => document.removeEventListener('keydown', keyboard);
  }, [confirmation]);
  useEffect(() => {
    if (!menuOpen) return;
    const menu = document.getElementById('primary-navigation');
    menu?.querySelector('button')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') { setMenuOpen(false); document.querySelector('[aria-controls="primary-navigation"]')?.focus(); }
      if (event.key === 'Tab') {
        const controls = [...menu.querySelectorAll('a[href],button:not([disabled])')].filter(el => getComputedStyle(el).display !== 'none');
        const first = controls[0]; const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }; document.addEventListener('keydown', keyboard); return () => document.removeEventListener('keydown', keyboard);
  }, [menuOpen]);
  const confirm = message => new Promise(resolve => setConfirmation({ message, resolve }));
  const finishConfirm = accepted => { confirmation.resolve(accepted); setConfirmation(null); };

  const updateState = updater => {
    const task = queue.current.catch(() => {}).then(async () => {
      const current = stateRef.current; if (!current) return false;
      const next = typeof updater === 'function' ? updater(current) : updater;
      try { validateState(next); await saveState(next, vaultRef.current); stateRef.current = next; setState(next); return true; }
      catch (error) { setToast(t(error.message === 'storageChanged' ? 'common.storageChanged' : 'common.error')); return false; }
    }); queue.current = task; return task;
  };
  const start = async (demo, age) => {
    const data = createDemoData(); data.settings.language = preLang; data.profile.ageGroup = age;
    if (!demo) { data.logs = {}; data.demo = false; }
    try { await saveState(data); stateRef.current = data; setState(data); setLocked(false); navigate('/'); } catch { setToast(t('common.error')); }
  };
  const lock = async () => { await queue.current.catch(() => {}); if (!vaultRef.current) return; stateRef.current = null; setState(null); vaultRef.current = null; setVault(null); setLocked(true); setToast(''); navigate('/'); };
  const removeAll = async () => { if (!await confirm(t('settings.deleteConfirm'))) return; try { await queue.current.catch(() => {}); await deleteEverything(); stateRef.current = null; setState(null); vaultRef.current = null; setVault(null); setLocked(false); setStorageError(false); setToast(''); fired.current.clear(); navigate('/'); } catch { setToast(t('common.error')); } };
  const setPIN = pin => { const task = queue.current.catch(() => {}).then(async () => { const nextVault = await enablePIN(stateRef.current, pin); vaultRef.current = nextVault; setVault(nextVault); setToast(t('settings.pinEnabled')); }); queue.current = task; return task; };
  const removePIN = () => { const task = queue.current.catch(() => {}).then(async () => { await disablePIN(stateRef.current, vaultRef.current); vaultRef.current = null; setVault(null); setToast(t('settings.pinDisabled')); }); queue.current = task; return task.catch(() => { setToast(t('common.error')); return false; }); };
  const exportData = type => { const data = stateRef.current; if (!data) return; downloadFile(`${data.settings.discreet ? 'diary' : 'bloom'}-backup-${todayISO()}.${type}`, type === 'csv' ? exportCSV(data) : exportJSON(data), type === 'csv' ? 'text/csv;charset=utf-8' : 'application/json'); };
  const importData = async file => { try { if (file.size > CONFIG.maximumImportBytes) throw Error(); const data = importText(await file.text()); if (!await confirm(t('settings.importConfirm'))) return; if (await updateState(data)) setToast(t('settings.imported')); } catch { setToast(t('settings.invalidImport')); } };

  useEffect(() => {
    if (!state) return;
    const check = () => {
      const now = new Date(); const day = todayISO(now); const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const r of state.reminders) {
        if (!isReminderDue(r, { today: day, time, analysis, profile: state.profile })) continue;
        const key = `${day}:${r.id}`; if (fired.current.has(key)) continue; fired.current.add(key);
        deliverReminder(r, { settings: state.settings, t, onBanner: setToast, NotificationClass: window.Notification });
      }
    }; check(); const id = setInterval(check, CONFIG.reminderPollMilliseconds); return () => clearInterval(id);
  }, [state, analysis, t]);

  const common = { state, analysis, t, lang, onUpdateState: updateState, onNavigate: navigate };
  const renderNav = (items, mobile = false) => items.map(({ path, key, Icon, mobileKey }) => <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-item ${mobile ? 'mobile-nav-item' : ''} ${isActive ? 'active' : ''}`}><Icon size={20} aria-hidden="true" /><span>{t(`nav.${mobile && mobileKey ? mobileKey : key}`)}</span>{key === 'doctor' && cards.length > 0 && <span className="nav-count">{cards.length}</span>}</NavLink>);
  const dialog = confirmation && <div className="modal-overlay" onClick={() => finishConfirm(false)}><div className="card confirmation-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text" onClick={e => e.stopPropagation()}><h2 id="confirm-title">{t('confirm.title')}</h2><p id="confirm-text">{confirmation.message}</p><div className="button-row"><button className="button secondary" autoFocus onClick={() => finishConfirm(false)}>{t('common.cancel')}</button><button className="button primary" onClick={() => finishConfirm(true)}>{t('common.continue')}</button></div></div></div>;
  const feedback = toast && <div className="toast" role="status"><Check size={19} /><span>{toast}</span><button className="icon-button" aria-label={t('common.close')} onClick={() => setToast('')}><X size={16} /></button></div>;
  if (storageError) return <><main className="lock-screen"><div className="card lock-card"><h1>{t('error.title')}</h1><p>{t('error.storage')}</p><button className="button primary" onClick={() => window.location.reload()}>{t('error.reload')}</button><button className="button secondary" onClick={removeAll}>{t('settings.delete')}</button></div></main>{dialog}{feedback}</>;
  if (locked) return <><Locked t={t} lang={lang} setLang={setPreLang} onDelete={removeAll} onUnlock={async pin => { const result = await unlockPIN(pin); stateRef.current = result.state; vaultRef.current = result.vault; setVault(result.vault); setState(result.state); setLocked(false); }} />{dialog}{feedback}</>;
  if (!state) return <><Welcome t={t} lang={lang} setLang={setPreLang} onStart={start} />{dialog}{feedback}</>;

  return <div className="app-shell"><a className="skip-link" href="#main-content">{t('common.skip')}</a>{menuOpen && <button className="mobile-scrim" aria-label={t('nav.close')} onClick={() => setMenuOpen(false)} />}<aside id="primary-navigation" className={`sidebar ${menuOpen ? 'open' : ''}`}><button className="icon-button sidebar-close" aria-label={t('nav.close')} onClick={() => setMenuOpen(false)}><X size={22} aria-hidden="true" /></button><NavLink className="brand" to="/"><span className="brand-mark">{state.settings.discreet ? <NotebookPen size={31} /> : <img className="bloom-brand-mark" src="/bloom-mark.png" alt="" />}</span><strong>{t(state.settings.discreet ? 'app.diary' : 'app.name')}</strong></NavLink><p className="brand-tagline">{t('app.tagline')}</p><nav aria-label={t('nav.overview')}><span className="nav-group-label">{t('nav.overview')}</span>{renderNav(primaryNav)}<span className="nav-group-label support-label">{t('nav.support')}</span>{renderNav(supportNav)}{(state.profile.ageGroup === 'adult' || state.profile.pregnancyFeatureEnabled || state.profile.pregnancyEnabled) && renderNav([{ path: '/pregnancy', key: 'pregnancy', Icon: Heart }])}</nav><div className="sidebar-bottom"><div className="privacy-card"><ShieldCheck size={25} /><h3>{t('privacy.title')}</h3><p>{t('privacy.body')}</p><button className="text-link" onClick={() => navigate('/privacy')}>{t('privacy.link')}<ArrowRight size={15} /></button></div>{renderNav([{ path: '/settings', key: 'settings', Icon: Settings }])}</div></aside><div className="app-content"><header className="topbar"><div className="topbar-left"><button className="icon-button menu-button" aria-label={t('nav.menu')} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={22} /></button><NavLink className="topbar-brand" to="/"><span className="brand-mark">{state.settings.discreet ? <NotebookPen size={25} /> : <img className="bloom-brand-mark" src="/bloom-mark.png" alt="" />}</span><strong>{t(state.settings.discreet ? 'app.diary' : 'app.name')}</strong></NavLink><span className="header-caption">{t('header.companion')}</span></div><div className="header-actions">{state.demo && <button type="button" className="demo-data-pill" aria-label={t('demo.clear')} title={t('demo.clear')} onClick={removeAll}>{t('header.demoData')}</button>}<span className="private-badge"><ShieldCheck size={16} />{t('common.private')}</span><button className="language-button" aria-label={t(lang === 'en' ? 'common.hindi' : 'common.english')} onClick={() => updateState(s => ({ ...s, settings: { ...s.settings, language: lang === 'en' ? 'hi' : 'en' } }))}><Languages size={17} /><span className="language-label">{t(lang === 'en' ? 'common.hindi' : 'common.english')}</span></button>{vault && <button className="icon-button lock-shortcut" aria-label={t('header.lock')} onClick={lock}><LockKeyhole size={20} /></button>}<button className="icon-button notification-button" aria-label={t('header.notifications')} onClick={() => navigate('/reminders')}><Bell size={20} /></button><button className="icon-button ask-shortcut" aria-label={t('nav.ask')} onClick={() => navigate('/ask')}><MessageCircle size={20} /></button></div></header><main id="main-content" className="main-content" tabIndex={-1}>{state.demo && <div className="demo-banner"><span><SparkleIcon />{t('demo.banner')}</span><button onClick={removeAll}>{t('demo.clear')}<ArrowRight size={14} /></button></div>}<ScreenBoundary key={location.pathname} t={t}><Routes><Route path="/" element={<TodayScreen {...common} />} /><Route path="/log" element={<LogScreen {...common} onSaveLog={async (date, log) => { if (!await updateState(s => ({ ...s, logs: { ...s.logs, [date]: log } }))) throw Error('save'); const nextCards = evaluateGuidance(stateRef.current.logs, stateRef.current.profile, { dismissals: stateRef.current.dismissals }); if (nextCards.some(card => card.severity !== 'consult' && card.dates.includes(date))) navigate('/guidance'); }} />} /><Route path="/calendar" element={<CalendarScreen {...common} />} /><Route path="/insights" element={<InsightsScreen {...common} />} /><Route path="/guidance" element={<GuidanceScreen {...common} cards={cards} />} /><Route path="/doctor" element={<Navigate to="/guidance" replace />} /><Route path="/visit" element={<VisitScreen {...common} />} /><Route path="/learn" element={<LearnScreen {...common} />} /><Route path="/ask" element={<AskScreen {...common} />} /><Route path="/reminders" element={<RemindersScreen {...common} notify={setToast} />} /><Route path="/pregnancy" element={state.profile.ageGroup === 'adult' || state.profile.pregnancyFeatureEnabled || state.profile.pregnancyEnabled ? <PregnancyScreen {...common} /> : <Navigate to="/settings" replace />} /><Route path="/privacy" element={<PrivacyDataScreen {...common} vaultEnabled={!!vault} onExport={exportData} onImport={importData} onDelete={removeAll} />} /><Route path="/settings" element={<SettingsScreen {...common} vaultEnabled={!!vault} onEnablePIN={setPIN} onDisablePIN={removePIN} onLock={lock} onExport={exportData} onImport={importData} onDelete={removeAll} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></ScreenBoundary><footer className="app-footer"><Lotus size={18} />{t('footer.note')}</footer></main><nav className="mobile-bottom" aria-label={t('nav.quick')}>{renderNav([{ ...primaryNav[0], mobileKey: 'today' }, { ...primaryNav[2], mobileKey: 'calendar' }, { ...primaryNav[3], mobileKey: 'insightsShort' }, { ...supportNav[1], mobileKey: 'learn' }, { path: '/settings', key: 'settings', mobileKey: 'you', Icon: Settings }], true)}</nav></div>{dialog}{feedback}</div>;
}
function SparkleIcon() { return <Flower2 size={16} aria-hidden="true" />; }

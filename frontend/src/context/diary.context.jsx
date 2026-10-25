import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDemoData } from '../data/demo.js';
import { analyzeCycles } from '../pages/cycle/cycle.service.js';
import { evaluateGuidance } from '../pages/guidance/guidance.service.js';
import { todayISO } from '../utilities/date.helper.js';
import { deleteEverything, downloadFile, disablePIN, enablePIN, exportCSV, exportJSON, exportEncryptedBackup, importEncryptedBackup, isEncryptedBackupText, importText, readEnvelope, saveState, unlockPIN, validateState } from '../services/storage.service.js';
import { translator } from '../i18n/index.js';
import CONFIG from '../config/app.config.js';
import { cloudClient } from '../services/http.service.js';
import { isReminderDue, deliverReminder } from '../pages/reminders/reminder.service.js';
function initialState() {
  try {
    const envelope = readEnvelope();
    return {
      state: envelope && !envelope.encrypted ? validateState(envelope.data) : null,
      locked: !!envelope?.encrypted,
      error: false
    };
  } catch {
    return {
      state: null,
      locked: false,
      error: true
    };
  }
}
const DiaryContext = createContext(null);
export function DiaryProvider({
  children
}) {
  const [backupPrompt, setBackupPrompt] = useState(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [backupError, setBackupError] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [boot] = useState(initialState);
  const [state, setState] = useState(boot.state);
  const stateRef = useRef(boot.state);
  const [locked, setLocked] = useState(boot.locked);
  const [storageError, setStorageError] = useState(boot.error);
  const [vault, setVault] = useState(null);
  const vaultRef = useRef(null);
  const [preLang, setPreLang] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const queue = useRef(Promise.resolve());
  const fired = useRef(new Set());
  useEffect(() => {
    const sync = event => {
      if (event.key === 'saheli.v1' || event.key === null) window.location.reload();
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const lang = state?.settings.language || preLang;
  const t = useMemo(() => translator(lang), [lang]);
  const analysis = useMemo(() => state ? analyzeCycles(state.logs, {
    ...state.profile,
    trackedSymptoms: state.settings.trackedSymptoms
  }) : null, [state]);
  const cards = useMemo(() => state ? evaluateGuidance(state.logs, state.profile, {
    dismissals: state.dismissals
  }) : [], [state]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.size = state?.settings.textSize || 'normal';
    document.documentElement.dataset.contrast = state?.settings.highContrast ? 'high' : 'normal';
    document.title = state?.settings.discreet || locked ? t('app.diary') : `${t('app.name')} · ${t('app.tagline')}`;
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = state?.settings.discreet || locked ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='12' y='6' width='40' height='52' rx='7' fill='%23716a7a'/%3E%3Cpath d='M24 22h18M24 32h18M24 42h12' stroke='white' stroke-width='3'/%3E%3C/svg%3E" : '/bloom-mark.png';
  }, [lang, state?.settings.textSize, state?.settings.highContrast, state?.settings.discreet, locked]);
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({
      top: 0
    });
  }, [location.pathname]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 7000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!confirmation) return;
    const keyboard = event => {
      if (event.key === 'Escape') {
        confirmation.resolve(false);
        setConfirmation(null);
      }
      if (event.key === 'Tab') {
        const buttons = [...document.querySelectorAll('[role="alertdialog"] button')];
        const first = buttons[0];
        const last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, [confirmation]);
  useEffect(() => {
    if (!menuOpen) return;
    const menu = document.getElementById('primary-navigation');
    menu?.querySelector('button')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        document.querySelector('[aria-controls="primary-navigation"]')?.focus();
      }
      if (event.key === 'Tab') {
        const controls = [...menu.querySelectorAll('a[href],button:not([disabled])')].filter(el => getComputedStyle(el).display !== 'none');
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, [menuOpen]);
  const confirm = message => new Promise(resolve => setConfirmation({
    message,
    resolve
  }));
  const finishConfirm = accepted => {
    confirmation.resolve(accepted);
    setConfirmation(null);
  };
  const updateState = (updater, { allowEmpty = false } = {}) => {
    const task = queue.current.catch(() => {}).then(async () => {
      const current = stateRef.current;
      if (!current && (!allowEmpty || locked)) return false;
      const next = typeof updater === 'function' ? updater(current) : updater;
      try {
        validateState(next);
        await saveState(next, vaultRef.current);
        stateRef.current = next;
        setState(next);
        return true;
      } catch (error) {
        setToast(t(error.message === 'storageChanged' ? 'common.storageChanged' : 'common.error'));
        return false;
      }
    });
    queue.current = task;
    return task;
  };
  const start = async (demo, age) => {
    const data = createDemoData();
    data.settings.language = preLang;
    data.profile.ageGroup = age;
    if (!demo) {
      data.logs = {};
      data.demo = false;
    }
    try {
      await saveState(data);
      stateRef.current = data;
      setState(data);
      setLocked(false);
      navigate('/');
    } catch {
      setToast(t('common.error'));
    }
  };
  const registerProfile = async ageGroup => {
    if (!['under18', 'adult'].includes(ageGroup) || locked || storageError) return false;
    const saved = await updateState(current => {
      // Account signup creates a real empty diary, never synthetic history.
      const data = current || { ...createDemoData(), demo: false, logs: {} };
      return {
        ...data,
        profile: { ...data.profile, ageGroup },
        settings: current ? data.settings : { ...data.settings, language: preLang },
      };
    }, { allowEmpty: true });
    if (saved) setToast(t('cloud.accountCreated'));
    return saved;
  };
  const lock = async () => {
    await queue.current.catch(() => {});
    if (!vaultRef.current) return;
    void cloudClient.lockSession();
    stateRef.current = null;
    setState(null);
    vaultRef.current = null;
    setVault(null);
    setLocked(true);
    setToast('');
    navigate('/');
  };
  const removeAll = async () => {
    if (!(await confirm(t('settings.deleteConfirm')))) return;
    try {
      await queue.current.catch(() => {});
      void cloudClient.lockSession();
      await deleteEverything();
      stateRef.current = null;
      setState(null);
      vaultRef.current = null;
      setVault(null);
      setLocked(false);
      setStorageError(false);
      setToast('');
      fired.current.clear();
      navigate('/');
    } catch {
      setToast(t('common.error'));
    }
  };
  const setPIN = pin => {
    const task = queue.current.catch(() => {}).then(async () => {
      const nextVault = await enablePIN(stateRef.current, pin);
      vaultRef.current = nextVault;
      setVault(nextVault);
      setToast(t('settings.pinEnabled'));
    });
    queue.current = task;
    return task;
  };
  const removePIN = () => {
    const task = queue.current.catch(() => {}).then(async () => {
      await disablePIN(stateRef.current, vaultRef.current);
      vaultRef.current = null;
      setVault(null);
      setToast(t('settings.pinDisabled'));
    });
    queue.current = task;
    return task.catch(() => {
      setToast(t('common.error'));
      return false;
    });
  };
  const exportData = type => {
    const data = stateRef.current;
    if (!data) return;
    downloadFile(`${data.settings.discreet ? 'diary' : 'bloom'}-backup-${todayISO()}.${type}`, type === 'csv' ? exportCSV(data) : exportJSON(data), type === 'csv' ? 'text/csv;charset=utf-8' : 'application/json');
  };
  const openEncryptedExport = () => {
    setBackupError('');
    setBackupPassword('');
    setBackupPasswordConfirm('');
    setBackupPrompt({
      mode: 'export'
    });
  };
  const closeBackupPrompt = () => {
    setBackupPrompt(null);
    setBackupPassword('');
    setBackupPasswordConfirm('');
    setBackupError('');
  };
  const importData = async file => {
    try {
      if (file.size > CONFIG.maximumEncryptedBackupBytes) throw new Error('invalidImport');
      const text = await file.text();
      if (isEncryptedBackupText(text)) {
        setBackupError('');
        setBackupPassword('');
        setBackupPasswordConfirm('');
        setBackupPrompt({
          mode: 'import',
          text
        });
        return;
      }
      if (file.size > CONFIG.maximumImportBytes) throw new Error('invalidImport');
      const data = importText(text);
      if (!(await confirm(t('settings.importConfirm')))) return;
      if (await updateState(data)) setToast(t('settings.imported'));
    } catch {
      setToast(t('settings.invalidImport'));
    }
  };
  const submitEncryptedBackup = async event => {
    event.preventDefault();
    setBackupError('');
    if (Array.from(backupPassword).length < 12) {
      setBackupError(t('settings.encryptedBackupTooShort'));
      return;
    }
    if (backupPrompt.mode === 'export' && backupPassword !== backupPasswordConfirm) {
      setBackupError(t('settings.encryptedBackupMismatch'));
      return;
    }
    const mode = backupPrompt.mode;
    const text = backupPrompt.text;
    const passphrase = backupPassword;
    setBackupPassword('');
    setBackupPasswordConfirm('');
    setBackupBusy(true);
    try {
      if (mode === 'export') {
        const data = stateRef.current;
        const encrypted = await exportEncryptedBackup(data, passphrase);
        const filename = `${data.settings.discreet ? 'diary' : 'bloom'}-encrypted-backup-${todayISO()}.bloombackup`;
        downloadFile(filename, encrypted, 'application/vnd.bloom.encrypted-backup+json;charset=utf-8');
        closeBackupPrompt();
        setToast(t('settings.encryptedBackupSaved'));
      } else {
        const restored = await importEncryptedBackup(text, passphrase);
        closeBackupPrompt();
        if (!(await confirm(t('settings.importConfirm')))) return;
        if (await updateState(restored)) setToast(t('settings.imported'));
      }
    } catch (error) {
      const key = {
        backupCryptoUnavailable: 'settings.encryptedBackupCryptoUnavailable',
        backupPassphraseWrong: 'settings.encryptedBackupWrongPassword',
        backupPassphraseFormat: 'settings.encryptedBackupTooShort',
        invalidEncryptedBackup: 'settings.encryptedBackupInvalid',
        backupUnsupported: 'settings.encryptedBackupUnsupported',
        invalidImport: 'settings.invalidImport'
      }[error.message] || 'settings.encryptedBackupError';
      setBackupError(t(key));
    } finally {
      setBackupBusy(false);
    }
  };
  useEffect(() => {
    if (!backupPrompt) return;
    document.getElementById('backup-passphrase')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') {
        closeBackupPrompt();
        return;
      }
      if (event.key === 'Tab') {
        const controls = [...document.querySelectorAll('.backup-password-dialog input:not([disabled]), .backup-password-dialog button:not([disabled])')];
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, [backupPrompt]);
  useEffect(() => {
    if (!state) return;
    const check = () => {
      const now = new Date();
      const day = todayISO(now);
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const r of state.reminders) {
        if (!isReminderDue(r, {
          today: day,
          time,
          analysis,
          profile: state.profile
        })) continue;
        const key = `${day}:${r.id}`;
        if (fired.current.has(key)) continue;
        fired.current.add(key);
        deliverReminder(r, {
          settings: state.settings,
          t,
          onBanner: setToast,
          NotificationClass: window.Notification
        });
      }
    };
    check();
    const id = setInterval(check, CONFIG.reminderPollMilliseconds);
    return () => clearInterval(id);
  }, [state, analysis, t]);
  const unlock = async pin => {
    const result = await unlockPIN(pin);
    stateRef.current = result.state;
    vaultRef.current = result.vault;
    setVault(result.vault);
    setState(result.state);
    setLocked(false);
  };
  const saveLog = async (date, log) => {
    if (!(await updateState(s => ({
      ...s,
      logs: {
        ...s.logs,
        [date]: log
      }
    })))) throw Error('save');
    const nextCards = evaluateGuidance(stateRef.current.logs, stateRef.current.profile, {
      dismissals: stateRef.current.dismissals
    });
    if (nextCards.some(card => card.severity !== 'consult' && card.dates.includes(date))) navigate('/guidance');
  };
  return <DiaryContext.Provider value={{
    state,
    analysis,
    cards,
    t,
    lang,
    location,
    navigate,
    updateState,
    restoreFromCloud: imported => updateState(imported, { allowEmpty: true }),
    registerProfile,
    locked,
    storageError,
    preLang,
    setPreLang,
    menuOpen,
    setMenuOpen,
    toast,
    setToast,
    lock,
    removeAll,
    start,
    setPIN,
    removePIN,
    exportData,
    openEncryptedExport,
    importData,
    confirmation,
    finishConfirm,
    backupPrompt,
    backupPassword,
    setBackupPassword,
    backupPasswordConfirm,
    setBackupPasswordConfirm,
    backupError,
    backupBusy,
    closeBackupPrompt,
    submitEncryptedBackup,
    unlock,
    saveLog,
    vault: !!vault
  }}>{children}</DiaryContext.Provider>;
}
export function useDiary() {
  const context = useContext(DiaryContext);
  if (!context) throw new Error('useDiary must be used inside DiaryProvider.');
  return context;
}

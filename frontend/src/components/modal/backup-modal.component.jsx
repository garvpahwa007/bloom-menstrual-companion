import React from 'react';
import { useDiary } from '../../context/diary.context.jsx';
export default function BackupModal() {
  const {
    backupPrompt,
    closeBackupPrompt,
    t,
    submitEncryptedBackup,
    backupPassword,
    setBackupPassword,
    backupPasswordConfirm,
    setBackupPasswordConfirm,
    backupError,
    backupBusy
  } = useDiary();
  return backupPrompt && <div className="modal-overlay" onClick={closeBackupPrompt}><section className="card confirmation-card backup-password-dialog" role="dialog" aria-modal="true" aria-labelledby="backup-dialog-title" aria-describedby="backup-dialog-description" onClick={event => event.stopPropagation()}><h2 id="backup-dialog-title">{t(backupPrompt.mode === 'export' ? 'settings.encryptedBackupTitle' : 'settings.encryptedBackupImportTitle')}</h2><p id="backup-dialog-description">{t('settings.encryptedBackupBody')}</p><form className="stack" onSubmit={submitEncryptedBackup}><label className="field"><span>{t('settings.encryptedBackupPassword')}</span><input id="backup-passphrase" className="input" type="password" autoComplete={backupPrompt.mode === 'export' ? 'new-password' : 'current-password'} minLength={12} maxLength={1024} required value={backupPassword} onChange={event => setBackupPassword(event.target.value)} /></label>{backupPrompt.mode === 'export' && <label className="field"><span>{t('settings.encryptedBackupConfirm')}</span><input className="input" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required value={backupPasswordConfirm} onChange={event => setBackupPasswordConfirm(event.target.value)} /></label>}{backupError && <p role="alert">{backupError}</p>}<div className="button-row"><button className="button secondary" type="button" disabled={backupBusy} onClick={closeBackupPrompt}>{t('common.cancel')}</button><button className="button primary" type="submit" disabled={backupBusy}>{t(backupBusy ? 'common.loading' : backupPrompt.mode === 'export' ? 'settings.encryptedBackupActionExport' : 'settings.encryptedBackupActionImport')}</button></div></form></section></div>;
}

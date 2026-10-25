import React from 'react';
import { Download, LockKeyhole, ShieldCheck, Trash2, Upload } from 'lucide-react';

export function PrivacyDataScreen({ t, vaultEnabled, onNavigate, onExport, onEncryptedExport, onImport, onDelete }) {
  return <div className="stack privacy-data-screen">
    <div className="page-heading"><div><p className="eyebrow">{t('privacyData.kicker')}</p><h1>{t('privacyData.title')}</h1><p className="muted">{t('privacyData.subtitle')}</p></div></div>
    <section className="card">
      <div className="section-heading"><h2>{t('privacyData.storageTitle')}</h2><ShieldCheck size={23} aria-hidden="true" /></div>
      <p className="muted">{t('privacyData.storageBody')}</p>
      <div className="notice privacy-data-status"><LockKeyhole size={20} aria-hidden="true" /><p><strong>{t(vaultEnabled ? 'privacyData.pinOn' : 'privacyData.pinOff')}</strong><br />{t(vaultEnabled ? 'privacyData.pinOnBody' : 'privacyData.pinOffBody')}</p></div>
      <button className="text-link" onClick={() => onNavigate('/settings')}>{t('privacyData.managePin')}</button>
    </section>
    <section className="card">
      <h2>{t('privacyData.backupTitle')}</h2>
      <p className="muted">{t('privacyData.backupBody')}</p>
      <div className="data-actions">
        <button className="button secondary" onClick={() => onExport('json')}><Download size={17} />{t('settings.exportJSON')}</button>
        <button className="button secondary" onClick={() => onExport('csv')}><Download size={17} />{t('settings.exportCSV')}</button>
        <button className="button secondary" onClick={onEncryptedExport}><ShieldCheck size={17} />{t('settings.exportEncrypted')}</button>
        <label className="button secondary import-button"><Upload size={17} />{t('settings.import')}<input type="file" accept=".json,.csv,.bloombackup,application/json,text/csv,application/vnd.bloom.encrypted-backup+json" aria-label={t('settings.import')} onChange={async event => { const file = event.target.files?.[0]; if (file) await onImport(file); event.target.value = ''; }} /></label>
      </div>
      <p className="muted text-small privacy-data-restore-help">{t('privacyData.restoreHelp')}</p>
    </section>
    <section className="card">
      <h2>{t('privacyData.cloudTitle')}</h2>
      <p className="muted">{t('privacyData.cloudBody')}</p>
      <button className="button secondary" onClick={() => onNavigate('/cloud')}>{t('privacyData.cloudOpen')}</button>
    </section>
    <section className="card">
      <h2>{t('privacyData.deleteTitle')}</h2>
      <p className="muted text-small">{t('privacyData.deleteBody')}</p>
      <button className="button danger" onClick={onDelete}><Trash2 size={17} />{t('settings.delete')}</button>
    </section>
  </div>;
}

export default PrivacyDataScreen;

import React from 'react';
import { useDiary } from '../../context/diary.context.jsx';
export default function ConfirmationModal() {
  const {
    confirmation,
    finishConfirm,
    t
  } = useDiary();
  return confirmation && <div className="modal-overlay" onClick={() => finishConfirm(false)}><div className="card confirmation-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text" onClick={e => e.stopPropagation()}><h2 id="confirm-title">{t('confirm.title')}</h2><p id="confirm-text">{confirmation.message}</p><div className="button-row"><button className="button secondary" autoFocus onClick={() => finishConfirm(false)}>{t('common.cancel')}</button><button className="button primary" onClick={() => finishConfirm(true)}>{t('common.continue')}</button></div></div></div>;
}

import React from 'react';
import ConfirmationModal from '../modal/confirmation-modal.component.jsx';
import BackupModal from '../modal/backup-modal.component.jsx';
import Toast from './toast.component.jsx';
export default function GlobalFeedback() {
  return <><ConfirmationModal /><BackupModal /><Toast /></>;
}

import React from 'react';
import { Check, X } from 'lucide-react';
import { useDiary } from '../../context/diary.context.jsx';
export default function Toast() {
  const {
    toast,
    t,
    setToast
  } = useDiary();
  return toast && <div className="toast" role="status"><Check size={19} /><span>{toast}</span><button className="icon-button" aria-label={t('common.close')} onClick={() => setToast('')}><X size={16} /></button></div>;
}

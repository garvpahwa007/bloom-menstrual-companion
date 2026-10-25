import React from 'react';
import { CalendarDays, Plus } from 'lucide-react';
export function EmptyState({
  t,
  onNavigate,
  text
}) {
  return <div className="empty-state"><CalendarDays size={32} aria-hidden="true" /><h3>{t('tracking.everyLogHelps')}</h3><p>{text || t('tracking.noHistory')}</p><button className="button primary" onClick={() => onNavigate('/log')}>{t('tracking.logToday')}<Plus size={18} aria-hidden="true" /></button></div>;
}
export default EmptyState;

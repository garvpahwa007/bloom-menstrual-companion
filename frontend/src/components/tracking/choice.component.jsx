import React from 'react';
import { Check } from 'lucide-react';
export function Choice({
  active,
  onClick,
  icon: Icon,
  label,
  className = ''
}) {
  return <button type="button" className={`tracking-choice ${active ? 'selected' : ''} ${className}`} aria-pressed={!!active} onClick={onClick}>{Icon && <Icon size={24} aria-hidden="true" />}<span>{label}</span>{active && <Check size={14} className="tracking-choice-check" aria-hidden="true" />}</button>;
}
export default Choice;

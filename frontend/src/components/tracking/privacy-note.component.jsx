import React from 'react';
import { ShieldCheck } from 'lucide-react';
export function PrivacyNote({
  t
}) {
  return <p className="tracking-privacy muted"><ShieldCheck size={15} aria-hidden="true" />{t('tracking.privacyNote')}</p>;
}
export default PrivacyNote;

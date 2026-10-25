import React from 'react';
export function Toggle({
  checked,
  onChange,
  label,
  description
}) {
  return <label className="toggle-row"><span><strong>{label}</strong>{description && <small className="muted">{description}</small>}</span><input className="toggle-input" type="checkbox" checked={!!checked} onChange={event => onChange(event.target.checked)} /><span className="toggle-track" aria-hidden="true"><span /></span></label>;
}
export default Toggle;

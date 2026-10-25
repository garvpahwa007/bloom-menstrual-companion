import React from 'react';
export function CheckField({
  checked,
  onChange,
  children
}) {
  return <label className="tracking-check-row"><input type="checkbox" checked={!!checked} onChange={event => onChange(event.target.checked)} /><span>{children}</span></label>;
}
export default CheckField;

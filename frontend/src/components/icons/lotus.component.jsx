import React from 'react';
export function Lotus({
  size = 36
}) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 49C11 48 8 28 17 18c10-1 15 12 15 31Z" fill="currentColor" opacity=".65" /><path d="M32 49c21-1 24-21 15-31-10-1-15 12-15 31Z" fill="currentColor" opacity=".8" /><path d="M32 49C20 34 21 17 32 9c11 8 12 25 0 40Z" fill="currentColor" /><path d="M15 47c10 9 24 9 34 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
}
export default Lotus;

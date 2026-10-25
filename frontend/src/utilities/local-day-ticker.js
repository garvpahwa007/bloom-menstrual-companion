import { todayISO } from './date.helper.js';

/** Notify only when the device's local calendar day changes. */
export function subscribeToLocalDay(onChange, {
  readToday = todayISO,
  intervalMs = 60_000,
  windowTarget = globalThis.window,
  documentTarget = globalThis.document,
  setTimer = globalThis.setInterval,
  clearTimer = globalThis.clearInterval,
} = {}) {
  let currentDay = readToday();
  const refresh = () => {
    const nextDay = readToday();
    if (nextDay === currentDay) return;
    currentDay = nextDay;
    onChange(nextDay);
  };
  const onVisibility = () => {
    if (!documentTarget?.hidden) refresh();
  };
  const timer = setTimer(refresh, intervalMs);
  windowTarget?.addEventListener?.('focus', refresh);
  documentTarget?.addEventListener?.('visibilitychange', onVisibility);

  return () => {
    clearTimer(timer);
    windowTarget?.removeEventListener?.('focus', refresh);
    documentTarget?.removeEventListener?.('visibilitychange', onVisibility);
  };
}

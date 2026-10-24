export function registerPWA() {
  if (!import.meta.env?.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const secure = globalThis.isSecureContext || ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);
  if (!secure) return;
  globalThis.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Service-worker failure must not prevent Bloom from opening or saving locally.
    });
  }, { once: true });
}

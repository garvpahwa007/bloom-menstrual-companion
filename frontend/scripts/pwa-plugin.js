import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PUBLIC_FILES = [
  'manifest.webmanifest',
  'favicon.svg',
  'bloom-mark.png',
  'bloom-logo.png',
  'bloom-app-192.png',
  'bloom-app-512.png',
  'bloom-app-maskable-512.png',
];
const BUNDLE_FILE = /^(?:index\.html|assets\/.+\.(?:js|css|woff2?|ttf|otf))$/i;

export function createBloomServiceWorker(precacheUrls, version) {
  const urls = [...new Set(precacheUrls)];
  return `/* Bloom static app-shell worker. No user or diary data is cached. */
const CACHE_PREFIX = 'bloom-app-shell-';
const CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(version)};
const PRECACHE_URLS = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(url.pathname)).then(hit => hit || fetch(request)));
  }
});
`;
}

export function bloomPwaPlugin() {
  return {
    name: 'bloom-static-pwa',
    apply: 'build',
    generateBundle(_options, bundle) {
      const bundleFiles = Object.keys(bundle).filter(name => BUNDLE_FILE.test(name));
      const precache = [...new Set([
        '/index.html',
        ...bundleFiles.map(name => `/${name}`),
        ...PUBLIC_FILES.map(name => `/${name}`),
      ])];
      const digest = createHash('sha256');
      for (const url of precache) {
        const name = url.slice(1);
        const emitted = bundle[name];
        let body;
        if (emitted?.type === 'chunk') body = emitted.code;
        else if (emitted?.type === 'asset') body = emitted.source;
        else body = readFileSync(name === 'index.html' ? path.resolve('index.html') : path.resolve('public', name));
        digest.update(name).update(Buffer.isBuffer(body) ? body : String(body));
      }
      const version = digest.digest('hex').slice(0, 16);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: createBloomServiceWorker(precache, version) });
    },
  };
}

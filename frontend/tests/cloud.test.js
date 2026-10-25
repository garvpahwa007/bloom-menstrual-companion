import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { build } from 'esbuild';
import { createCloudClient, ApiError } from '../src/services/http.service.js';
import { uploadEncryptedDiary, decryptCloudDiary } from '../src/pages/cloud/cloud.service.js';
import { cloudCopy } from '../src/pages/cloud/cloud.copy.js';
import { createDemoData } from '../src/data/demo.js';
import { exportEncryptedBackup } from '../src/services/storage.service.js';

Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
const reply = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, async json() { return status >= 400 ? { error: data } : { data }; } });

test('cookie client keeps CSRF in memory and sends it only on authenticated mutations', async () => {
  const calls = [];
  const client = createCloudClient(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/login')) return reply({ user: { id: 'test-user', username: 'fictional' }, csrfToken: 'csrf-value' });
    return reply({ revision: 1 });
  });
  await client.login({ username: 'fictional', password: 'synthetic-password' });
  await client.status();
  await client.upload({ ciphertext: 'encrypted-fixture' }, 0);
  assert.equal(calls[0].options.headers['X-CSRF-Token'], undefined);
  assert.equal(calls[1].options.headers['X-CSRF-Token'], undefined);
  assert.equal(calls[2].options.headers['X-CSRF-Token'], 'csrf-value');
  assert.equal(calls.every(call => call.options.credentials === 'same-origin' && call.options.cache === 'no-store'), true);
  assert.deepEqual(JSON.parse(calls[2].options.body), { backup: { ciphertext: 'encrypted-fixture' }, expectedRevision: 0 });
});

test('expired sessions clear CSRF and API errors expose only error codes', async () => {
  const calls = [];
  const client = createCloudClient(async (url, options) => {
    calls.push(options);
    if (url.endsWith('/auth/session')) return reply({ user: { username: 'fictional' }, csrfToken: 'old-token' });
    return reply({ code: 'AUTH_REQUIRED', message: 'Do not reflect private server messages' }, 401);
  });
  await client.session();
  await assert.rejects(client.deleteBackup(0), error => error instanceof ApiError && error.code === 'AUTH_REQUIRED' && !error.message.includes('private'));
  await assert.rejects(client.deleteBackup(0));
  assert.equal(calls[1].headers['X-CSRF-Token'], 'old-token');
  assert.equal(calls[2].headers['X-CSRF-Token'], undefined);
});

test('a static SPA or network failure produces a recoverable server-unavailable error', async () => {
  const offline = createCloudClient(async () => { throw new Error('offline'); });
  await assert.rejects(offline.session(), { code: 'SERVER_UNAVAILABLE' });
  const html = createCloudClient(async () => ({ ok: true, status: 200, json: async () => { throw new Error('HTML'); } }));
  await assert.rejects(html.session(), { code: 'SERVER_UNAVAILABLE' });
});

test('the upload boundary sends a decryptable envelope without diary plaintext or its passphrase', async () => {
  const diary = createDemoData('2026-10-25');
  diary.logs['2026-10-25'].note = 'synthetic-private-health-note';
  const passphrase = 'synthetic-backup-passphrase';
  let payload;
  await uploadEncryptedDiary({ async upload(backup, expectedRevision) { payload = { backup, expectedRevision }; return { revision: 4 }; } }, diary, passphrase, 3);
  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes('synthetic-private-health-note'), false);
  assert.equal(serialized.includes(passphrase), false);
  assert.equal(serialized.includes('logs'), false);
  assert.equal(payload.expectedRevision, 3);
  assert.equal(payload.backup.format, 'bloom-encrypted-backup');
  const restored = await decryptCloudDiary({ download: async () => payload }, passphrase);
  assert.deepEqual(restored, diary);
  await assert.rejects(decryptCloudDiary({ download: async () => payload }, 'wrong-backup-passphrase'), { message: 'backupPassphraseWrong' });
});

await build({ entryPoints: [new URL('../src/pages/cloud/cloud.page.jsx', import.meta.url).pathname], outfile: new URL('../.test-cache/Cloud.mjs', import.meta.url).pathname, bundle: true, platform: 'node', format: 'esm', packages: 'external', target: 'node20', jsx: 'automatic', logLevel: 'warning' });
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>Cloud backup test</title></head><body></body></html>', { url: 'http://localhost:3000/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Event', 'MouseEvent', 'localStorage', 'sessionStorage']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { default: CloudScreen } = await import('../.test-cache/Cloud.mjs');
const { default: axe } = await import('axe-core');
window.HTMLCanvasElement.prototype.getContext = function () { return { canvas: this, measureText: text => ({ width: String(text).length * 8 }) }; };
const copy = cloudCopy('en');
let root;
const button = text => [...document.querySelectorAll('button')].find(node => node.textContent === text);
const input = text => [...document.querySelectorAll('label')].find(node => node.querySelector('span')?.textContent === text)?.querySelector('input');
async function click(text) { await act(async () => { assert.ok(button(text), `Missing button: ${text}`); button(text).click(); }); }
async function fill(label, value) {
  const field = input(label); assert.ok(field, `Missing input: ${label}`);
  await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function submit(label) { const form = input(label)?.closest('form'); assert.ok(form); await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); }
async function waitFor(check) {
  for (let count = 0; count < 100; count++) { if (check()) return; await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); }
  assert.fail('Cloud UI did not reach the expected state.');
}
async function mount(client, extra = {}) {
  document.body.innerHTML = '<main id="test-root"></main>';
  root = createRoot(document.getElementById('test-root'));
  await act(async () => { root.render(React.createElement(CloudScreen, { state: createDemoData('2026-10-25'), client, onRestore: async () => true, ...extra })); });
}
const signedClient = extra => ({ session: async () => ({ user: { username: 'fictional' }, csrfToken: 'csrf' }), status: async () => ({ hasBackup: false, revision: 0 }), ...extra });
afterEach(async () => { if (root) { await act(async () => root.unmount()); root = null; } localStorage.clear(); sessionStorage.clear(); });
after(() => dom.window.close());

test('cloud UI offers an optional account in both languages without auto-uploading', async () => {
  let uploads = 0;
  const guest = { session: async () => { throw new ApiError('AUTH_REQUIRED', 401); }, upload: async () => { uploads++; } };
  await mount(guest);
  assert.ok(document.body.textContent.includes(copy.intro));
  assert.ok(button(copy.signIn));
  assert.equal(uploads, 0);
  const result = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
  assert.deepEqual(result.violations.map(v => v.id), []);
  await act(async () => root.unmount()); root = null;
  await mount(guest, { lang: 'hi' });
  assert.ok(document.body.textContent.includes(cloudCopy('hi').intro));
  assert.equal(localStorage.length, 0); assert.equal(sessionStorage.length, 0);
});

test('cloud UI recovers from an unavailable server without creating an account', async () => {
  await mount({ session: async () => { throw new ApiError('SERVER_UNAVAILABLE'); } });
  assert.ok(document.body.textContent.includes(copy.unavailable));
  assert.ok(button(copy.retry));
  assert.equal(input(copy.password), undefined);
});

test('cloud UI handles revision conflicts without a retry upload and clears passphrases', async () => {
  let uploads = 0; let statusCalls = 0;
  await mount(signedClient({
    status: async () => ({ hasBackup: false, revision: ++statusCalls - 1 }),
    upload: async () => { uploads++; throw new ApiError('BACKUP_CONFLICT', 409); },
  }));
  await fill(copy.passphrase, 'synthetic-passphrase'); await fill(copy.confirmPassphrase, 'synthetic-passphrase');
  await submit(copy.passphrase);
  await waitFor(() => document.body.textContent.includes(copy.conflict));
  assert.equal(uploads, 1); assert.equal(statusCalls, 2);
  assert.equal(input(copy.passphrase).value, '');
  assert.equal(input(copy.confirmPassphrase).value, '');
  assert.equal(localStorage.length, 0); assert.equal(sessionStorage.length, 0);
});

test('decrypting a backup requires a separate confirmation before replacing local data', async () => {
  const diary = createDemoData('2026-10-25');
  const encrypted = JSON.parse(await exportEncryptedBackup(diary, 'synthetic-restore-passphrase'));
  let restored = null;
  await mount(signedClient({ status: async () => ({ hasBackup: true, revision: 1 }), download: async () => ({ backup: encrypted }) }), { onRestore: async state => { restored = state; return true; } });
  await fill(copy.restorePassphrase, 'synthetic-restore-passphrase');
  await submit(copy.restorePassphrase);
  await waitFor(() => !!button(copy.restore));
  assert.equal(restored, null);
  assert.ok(document.body.textContent.includes(copy.reviewHelp));
  assert.equal(document.activeElement.id, 'cloud-review-title');
  await click(copy.restore);
  assert.deepEqual(restored, diary);
  assert.ok(document.body.textContent.includes(copy.restored));
});

test('account deletion requests the current password only after an explicit review', async () => {
  let deleted = 0;
  await mount(signedClient({ deleteAccount: async password => { assert.equal(password, 'synthetic-account-password'); deleted++; } }));
  await click(copy.deleteAccount);
  assert.equal(deleted, 0);
  assert.ok(document.body.textContent.includes(copy.confirmDeleteAccountHelp));
  await fill(copy.password, 'synthetic-account-password');
  await submit(copy.password);
  assert.equal(deleted, 1);
  assert.ok(document.body.textContent.includes(copy.accountDeleted));
  assert.ok(button(copy.signIn));
  assert.equal(localStorage.length, 0); assert.equal(sessionStorage.length, 0);
});

test('an incorrect account-deletion password preserves the current session CSRF for retry', async () => {
  const csrf = []; let attempts = 0;
  const client = createCloudClient(async (url, options) => {
    if (url.endsWith('/auth/session')) return reply({ user: { username: 'fictional' }, csrfToken: 'valid-session-csrf' });
    csrf.push(options.headers['X-CSRF-Token']);
    return ++attempts === 1 ? reply({ code: 'INVALID_CREDENTIALS' }, 401) : reply({ deleted: true });
  });
  await client.session();
  await assert.rejects(client.deleteAccount('incorrect-synthetic-password'), { code: 'INVALID_CREDENTIALS' });
  await client.deleteAccount('correct-synthetic-password');
  assert.deepEqual(csrf, ['valid-session-csrf', 'valid-session-csrf']);
});

test('a fresh device can restore its cloud diary without uploading an empty local state', async () => {
  await mount(signedClient({ status: async () => ({ hasBackup: true, revision: 2 }) }), { state: null });
  assert.equal(input(copy.passphrase), undefined);
  assert.ok(document.body.textContent.includes(copy.uploadNeedsDiary));
  assert.ok(input(copy.restorePassphrase));
  assert.ok(button(copy.decrypt));
});

test('a PIN-locked device can manage its account while restore waits for local unlock', async () => {
  await mount(signedClient({ status: async () => ({ hasBackup: true, revision: 2 }) }), { state: null, restoreAllowed: false });
  assert.ok(document.body.textContent.includes(copy.restoreLocked));
  assert.equal(input(copy.passphrase), undefined);
  assert.equal(input(copy.restorePassphrase), undefined);
  assert.equal(button(copy.decrypt), undefined);
  assert.ok(button(copy.deleteBackup));
  assert.ok(button(copy.deleteAccount));
  assert.ok(button(copy.logout));
});

test('locking clears in-memory cloud authorization immediately even when remote sign-out fails', async () => {
  const requests = [];
  let finishSignOut;
  const client = createCloudClient(async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith('/auth/session')) return reply({ user: { username: 'fictional' }, csrfToken: 'lock-session-csrf' });
    if (url.endsWith('/auth/logout')) return new Promise(resolve => { finishSignOut = () => resolve(reply({ code: 'SERVER_UNAVAILABLE' }, 503)); });
    return reply({ code: 'AUTH_REQUIRED' }, 401);
  });
  await client.session();
  const locking = client.lockSession();
  await assert.rejects(client.deleteBackup(0));
  assert.equal(requests[1].options.headers['X-CSRF-Token'], 'lock-session-csrf');
  assert.equal(requests[2].options.headers['X-CSRF-Token'], undefined);
  finishSignOut();
  assert.equal(await locking, false);
  const calls = requests.length;
  assert.equal(await client.lockSession(), false);
  assert.equal(requests.length, calls, 'a local-only lock must not contact the account server');
});

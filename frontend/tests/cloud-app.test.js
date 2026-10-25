import test, { beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import React, { act } from 'react';
import en from '../src/i18n/en.js';
import { createDemoData } from '../src/data/demo.js';
import { cloudCopy } from '../src/pages/cloud/cloud.copy.js';
import { enablePIN, exportEncryptedBackup, STORAGE_KEY } from '../src/services/storage.service.js';

// Full application/context regression checks use synthetic cookies and a
// disposable DOM. They never contact an account server or use a real diary.
const virtualConsole = new VirtualConsole();
const runtimeErrors = [];
virtualConsole.on('jsdomError', error => runtimeErrors.push(error.message));
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>Cloud application test</title><link rel="icon" href="/favicon.svg"></head><body></body></html>', { url: 'http://localhost:3000/', pretendToBeVisual: true, virtualConsole });
for (const key of ['window', 'document', 'navigator', 'location', 'history', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'MutationObserver', 'getComputedStyle', 'localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key] });
}
Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.confirm = () => { throw new Error('Unexpected native confirmation.'); };
await build({ entryPoints: [new URL('../src/App.jsx', import.meta.url).pathname], outfile: new URL('../.test-cache/CloudApp.mjs', import.meta.url).pathname, bundle: true, platform: 'node', format: 'esm', packages: 'external', target: 'node20', jsx: 'automatic', logLevel: 'warning' });
const { createRoot } = await import('react-dom/client');
const { BrowserRouter } = await import('react-router-dom');
const { default: App } = await import('../.test-cache/CloudApp.mjs');
const copy = cloudCopy('en');
const normalized = value => String(value || '').replace(/\s+/g, ' ').trim();
const button = label => [...document.querySelectorAll('button')].find(node => normalized(node.textContent) === normalized(label));
const input = label => [...document.querySelectorAll('label')].find(node => normalized(node.querySelector('span')?.textContent) === normalized(label))?.querySelector('input');
let root;
let requests;
const originalFetch = globalThis.fetch;
const response = data => ({ status: 200, ok: true, json: async () => ({ data }) });
const diary = createDemoData('2026-10-25');
diary.logs['2026-10-25'].note = 'Synthetic full-app cloud restore';
const backup = JSON.parse(await exportEncryptedBackup(diary, 'synthetic-restore-passphrase'));
function useSyntheticAccount() {
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    assert.equal(options.credentials, 'same-origin');
    if (url === '/api/v1/auth/session') return response({ user: { id: 'synthetic', username: 'fictional' }, csrfToken: 'synthetic-csrf' });
    if (url === '/api/v1/diary/status') return response({ hasBackup: true, revision: 3, updatedAt: '2026-10-25T10:00:00.000Z' });
    if (url === '/api/v1/diary/backup' && options.method === 'GET') return response({ backup, revision: 3 });
    if (url === '/api/v1/auth/account' && options.method === 'DELETE') {
      assert.equal(options.headers['X-CSRF-Token'], 'synthetic-csrf');
      assert.deepEqual(JSON.parse(options.body), { password: 'synthetic-account-password' });
      return response({ deleted: true });
    }
    assert.fail(`Unexpected synthetic API request: ${options.method} ${url}`);
  };
}
async function click(label) {
  const element = button(label); assert.ok(element, `Missing button: ${label}`);
  assert.equal(element.disabled, false);
  await act(async () => element.click());
}
async function fill(label, value) {
  const field = input(label); assert.ok(field, `Missing input: ${label}`);
  await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function submit(label) {
  const form = input(label)?.closest('form'); assert.ok(form);
  await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}
async function waitFor(check) {
  for (let count = 0; count < 200; count++) { if (check()) return; await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); }
  assert.fail('The full application did not reach the expected state.');
}
async function mount(path = '/') {
  window.history.replaceState({}, '', path);
  const container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(React.createElement(BrowserRouter, null, React.createElement(App))));
}
beforeEach(() => { requests = []; runtimeErrors.length = 0; localStorage.clear(); sessionStorage.clear(); document.body.innerHTML = ''; useSyntheticAccount(); });
afterEach(async () => {
  if (root) { await act(async () => root.unmount()); root = null; }
  globalThis.fetch = originalFetch;
  assert.deepEqual(runtimeErrors, []);
});
after(() => dom.window.close());

test('full App: fresh Welcome opens Cloud only by choice and confirmation persists a restored diary', async () => {
  await mount();
  assert.ok(button(en['welcome.fresh']));
  assert.ok(button(en['welcome.cloud']));
  assert.equal(requests.length, 0, 'Account-free onboarding makes no server request.');
  await click(en['welcome.cloud']);
  assert.equal(window.location.pathname, '/cloud');
  assert.ok(document.body.textContent.includes(copy.uploadNeedsDiary));
  assert.equal(input(copy.passphrase), undefined, 'An empty browser cannot overwrite its cloud backup.');
  await fill(copy.restorePassphrase, 'synthetic-restore-passphrase');
  await submit(copy.restorePassphrase);
  await waitFor(() => !!button(copy.restore));
  assert.equal(localStorage.getItem(STORAGE_KEY), null, 'Decryption alone must not alter the local diary.');
  assert.equal(document.activeElement.id, 'cloud-review-title');
  await click(copy.restore);
  await waitFor(() => !!document.querySelector('.app-shell'));
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(saved.encrypted, false);
  assert.deepEqual(saved.data, diary, 'Restoring into a fresh browser must persist through the real context/storage service.');
  assert.equal(requests.some(request => request.options.method === 'PUT'), false);
  assert.equal(requests.some(request => request.options.body?.includes('synthetic-restore-passphrase')), false);
  assert.equal(sessionStorage.length, 0);
});

test('full App: cancelling a fresh-device restore keeps local storage empty', async () => {
  await mount('/cloud');
  await fill(copy.restorePassphrase, 'synthetic-restore-passphrase');
  await submit(copy.restorePassphrase);
  await waitFor(() => !!button(copy.restore));
  await click(copy.cancel);
  assert.equal(localStorage.getItem(STORAGE_KEY), null);
  assert.equal(document.querySelector('.app-shell'), null);
  assert.ok(input(copy.restorePassphrase));
});

test('full App: PIN-locked cloud management blocks restoration and preserves the local vault during account deletion', async () => {
  await enablePIN(diary, '4826');
  const originalVault = localStorage.getItem(STORAGE_KEY);
  await mount('/cloud');
  assert.ok(document.body.textContent.includes(copy.restoreLocked));
  assert.equal(input(copy.restorePassphrase), undefined);
  assert.equal(input(copy.passphrase), undefined);
  assert.equal(button(copy.decrypt), undefined);
  assert.ok(button(copy.deleteAccount));
  await click(copy.deleteAccount);
  await fill(copy.password, 'synthetic-account-password');
  await submit(copy.password);
  assert.ok(document.body.textContent.includes(copy.accountDeleted));
  assert.equal(localStorage.getItem(STORAGE_KEY), originalVault, 'Account deletion must not remove or replace a PIN-protected local diary.');
  assert.equal(requests.some(request => request.url === '/api/v1/diary/backup'), false);
  await click(en['cloud.back']);
  assert.ok(button(en['lock.unlock']), 'Returning from cloud management must return to the PIN lock.');
  assert.equal(document.querySelector('.app-shell'), null);
});

test('full App: Privacy opens optional Cloud without any account request from local diary screens', async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, encrypted: false, data: diary }));
  await mount('/privacy');
  assert.ok(button(en['privacyData.cloudOpen']));
  assert.equal(requests.length, 0);
  await click(en['privacyData.cloudOpen']);
  assert.equal(window.location.pathname, '/cloud');
  assert.ok(input(copy.passphrase));
  assert.ok(document.body.textContent.includes(copy.backupExists));
  assert.equal(requests.filter(request => request.url === '/api/v1/auth/session').length, 1);
});

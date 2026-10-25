import test, { beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import React, { act } from 'react';
import en from '../src/i18n/en.js';
import { createDemoData } from '../src/data/demo.js';
import { cloudCopy } from '../src/pages/cloud/cloud.copy.js';
import { enablePIN, unlockPIN, exportEncryptedBackup, STORAGE_KEY } from '../src/services/storage.service.js';

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

test('full App: returning user can reopen the start screen and continue without deleting the saved diary', async () => {
  const stored = JSON.stringify({ version: 1, encrypted: false, data: diary });
  localStorage.setItem(STORAGE_KEY, stored);
  await mount('/');
  assert.ok(button(en['welcome.resume']));
  assert.ok(button(en['welcome.cloud']));
  assert.equal(localStorage.getItem(STORAGE_KEY), stored);
  await click(en['welcome.resume']);
  await waitFor(() => !!document.querySelector('.app-shell'));
  assert.equal(localStorage.getItem(STORAGE_KEY), stored, 'Continuing must retain every saved diary entry.');
});

test('full App: PIN-protected diary keeps its unlock screen ahead of the returning-user start screen', async () => {
  await enablePIN(diary, '4826');
  const stored = localStorage.getItem(STORAGE_KEY);
  await mount('/');
  assert.ok(button(en['lock.unlock']));
  assert.equal(button(en['welcome.resume']), undefined);
  assert.equal(localStorage.getItem(STORAGE_KEY), stored);
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

const signedOut = () => ({ status: 401, ok: false, json: async () => ({ error: { code: 'AUTH_REQUIRED' } }) });
function signupServer() {
  let registered = false;
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (url === '/api/v1/auth/register') {
      assert.deepEqual(JSON.parse(options.body), { username: 'fictional_new', password: 'synthetic-signup-password' });
      registered = true;
      return response({ user: { id: 'new-account', username: 'fictional_new' }, csrfToken: 'new-account-csrf' });
    }
    if (url === '/api/v1/auth/session') return registered ? response({ user: { id: 'new-account', username: 'fictional_new' }, csrfToken: 'new-account-csrf' }) : signedOut();
    if (url === '/api/v1/diary/status') return response({ hasBackup: false, revision: 0 });
    assert.fail(`Unexpected account signup request: ${options.method} ${url}`);
  };
}
async function chooseSignupAge(value) {
  const select = document.querySelector('select[name="ageGroup"]'); assert.ok(select);
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
async function registerWithAge(value) {
  await click(copy.register);
  await chooseSignupAge(value);
  await fill(copy.alias, 'fictional_new');
  await fill(copy.password, 'synthetic-signup-password');
  await fill(copy.confirmPassword, 'synthetic-signup-password');
  await submit(copy.password);
}

test('full App: optional signup from /login saves selected age in an empty diary without uploading it', async () => {
  signupServer();
  await mount('/login');
  await registerWithAge('adult');
  await waitFor(() => !!document.querySelector('.app-shell'));
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(stored.data.profile.ageGroup, 'adult');
  assert.equal(stored.data.demo, false);
  assert.deepEqual(stored.data.logs, {}, 'Signup must create a real empty diary.');
  assert.ok(document.body.textContent.includes(copy.accountCreated));
  assert.equal(requests.filter(item => item.url === '/api/v1/auth/register').length, 1);
  assert.equal(requests.some(item => item.url === '/api/v1/diary/backup'), false, 'Age and diary require an explicit encrypted upload.');
  assert.equal(JSON.stringify(stored).includes('synthetic-signup-password'), false);
  assert.equal(JSON.stringify(stored).includes('fictional_new'), false, 'The login alias belongs to the account, not a duplicate local identity record.');
});

test('full App: signup updates an unlocked PIN diary age while retaining its encrypted logs', async () => {
  await enablePIN(diary, '4826');
  signupServer();
  await mount('/');
  await fill(en['settings.enterPin'], '4826');
  await submit(en['settings.enterPin']);
  await waitFor(() => !!document.querySelector('.app-shell'));
  const privacyLink = document.querySelector('a[href="/privacy"]'); assert.ok(privacyLink);
  await act(async () => privacyLink.click());
  await click(en['privacyData.cloudOpen']);
  await registerWithAge('adult');
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(stored.encrypted, true);
  assert.equal(stored.data, undefined);
  assert.equal(JSON.stringify(stored).includes('Synthetic full-app cloud restore'), false);
  const unlocked = await unlockPIN('4826');
  assert.equal(unlocked.state.profile.ageGroup, 'adult');
  assert.deepEqual(unlocked.state.logs, diary.logs);
  assert.equal(requests.some(item => item.options.method === 'PUT'), false);
});

test('full App: session expiry and returning login retain the saved device age and diary', async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, encrypted: false, data: diary }));
  const original = localStorage.getItem(STORAGE_KEY);
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (url === '/api/v1/auth/session' || url === '/api/v1/auth/login') {
      if (url.endsWith('/login')) assert.deepEqual(JSON.parse(options.body), { username: 'fictional', password: 'synthetic-returning-password' });
      return response({ user: { id: 'same-account', username: 'fictional' }, csrfToken: 'refreshed-csrf' });
    }
    if (url === '/api/v1/diary/status') return response({ hasBackup: true, revision: 3 });
    if (url === '/api/v1/diary/backup') return signedOut();
    assert.fail(`Unexpected expiry request: ${url}`);
  };
  await mount('/cloud');
  await fill(copy.restorePassphrase, 'synthetic-restore-passphrase');
  await submit(copy.restorePassphrase);
  assert.ok(document.body.textContent.includes(copy.expired));
  assert.equal(input(copy.alias).value, 'fictional');
  assert.equal(input(copy.password).value, '');
  assert.equal(document.querySelector('select[name="ageGroup"]'), null, 'A returning login does not ask for age again.');
  await fill(copy.password, 'synthetic-returning-password');
  await submit(copy.password);
  assert.ok(document.body.textContent.includes(copy.backupExists));
  assert.equal(localStorage.getItem(STORAGE_KEY), original);
  assert.equal(requests.some(item => item.url.endsWith('/register')), false);
});

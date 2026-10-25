import test, { beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { Blob as NodeBlob } from 'node:buffer';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import React, { act } from 'react';
import { createDemoData } from '../src/data/demo.js';
import { dictionaries, translator } from '../src/i18n/index.js';
import { FAQ } from '../src/content/faq.js';
import { SOURCES } from '../src/content/sources.js';
import { answerQuestion } from '../src/pages/ask/ask.service.js';
import { importEncryptedBackup, STORAGE_KEY } from '../src/services/storage.service.js';

// Real App/context/rendering with fictional diary data. These tests do not
// contact a server, provider, OS voice, or a real browser's storage.
const runtimeErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => runtimeErrors.push(error.message));
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>Offline chat regression</title><link rel="icon" href="/favicon.svg"></head><body></body></html>', {
  url: 'http://localhost:3000/', pretendToBeVisual: true, virtualConsole,
});
for (const key of ['window', 'document', 'navigator', 'location', 'history', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLAnchorElement', 'Event', 'MouseEvent', 'MutationObserver', 'getComputedStyle', 'localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key] });
}
Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
globalThis.Blob = NodeBlob;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.confirm = () => { throw new Error('Unexpected native confirmation in offline chat.'); };
window.HTMLCanvasElement.prototype.getContext = function () { return { canvas: this, measureText: value => ({ width: String(value).length * 8 }) }; };

const style = document.createElement('style');
style.textContent = (await readFile(new URL('../src/assets/css/styles.css', import.meta.url), 'utf8')).replace(/^\s*@import\s+[^;]+;/m, '');
document.head.append(style);

// Each full-App suite owns its bundle so parallel test processes cannot
// overwrite the module this suite imports.
await build({
  entryPoints: [new URL('../src/App.jsx', import.meta.url).pathname],
  outfile: new URL('../.test-cache/OfflineChatApp.mjs', import.meta.url).pathname,
  bundle: true, platform: 'node', format: 'esm', packages: 'external', target: 'node20', jsx: 'automatic', logLevel: 'warning',
});
const { default: axe } = await import('axe-core');
const { createRoot } = await import('react-dom/client');
const { BrowserRouter } = await import('react-router-dom');
const { default: App } = await import('../.test-cache/OfflineChatApp.mjs');

const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
const findButton = label => [...document.querySelectorAll('button')].find(node => normalize(node.getAttribute('aria-label')) === normalize(label) || normalize(node.textContent) === normalize(label));
const answers = () => [...document.querySelectorAll('.answer-bubble')];
const lastAnswer = () => answers().at(-1);
const questions = () => [...document.querySelectorAll('.question-bubble p')].map(node => node.textContent);
const snapshot = storage => Object.fromEntries([...Array(storage.length)].map((_, index) => storage.key(index)).sort().map(key => [key, storage.getItem(key)]));
const originalFetch = globalThis.fetch;
const originalCreateURL = URL.createObjectURL;
const originalRevokeURL = URL.revokeObjectURL;
const originalAnchorClick = window.HTMLAnchorElement.prototype.click;
const greetings = { en: 'Hello', hi: 'नमस्ते', ta: 'வணக்கம்' };
let root;
let requests;
let downloads;
let objectURLs;
let speech;

function denyNetwork() {
  globalThis.fetch = async (...args) => {
    requests.push(args);
    throw new Error('Offline chat must never call fetch.');
  };
  window.fetch = globalThis.fetch;
}

async function click(node) {
  assert.ok(node, 'Expected an actionable control.');
  assert.notEqual(node.disabled, true, 'Expected the action to be enabled.');
  await act(async () => node.click());
}

async function setValue(node, value) {
  assert.ok(node, 'Expected an editable form field.');
  const prototype = node.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value);
    node.dispatchEvent(new Event('input', { bubbles: true }));
    if (node.tagName === 'SELECT') node.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function waitFor(predicate, message) {
  for (let attempt = 0; attempt < 300; attempt++) {
    if (predicate()) return;
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
  }
  assert.fail(message || 'The offline chat UI did not reach the expected state.');
}

async function mount(path = '/ask') {
  window.history.replaceState({}, '', path);
  const container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(React.createElement(BrowserRouter, null, React.createElement(App))));
}

async function unmount() {
  if (root) { await act(async () => root.unmount()); root = null; }
  document.body.innerHTML = '';
}

async function navigate(path) {
  const link = document.querySelector(`aside a[href="${path}"]`);
  assert.ok(link, `Expected the application's ${path} navigation link.`);
  await click(link);
  assert.equal(window.location.pathname, path);
}

async function changeLanguage(language) {
  const select = [...document.querySelectorAll('header select')].find(node => [...node.options].some(option => option.value === language));
  if (select) await setValue(select, language);
  else {
    for (let attempt = 0; attempt < 3 && document.documentElement.lang !== language; attempt++) {
      await click(document.querySelector('header .language-button'));
    }
  }
  await waitFor(() => document.documentElement.lang === language, 'The real language setting must update the App.');
}

async function ask(value, language = 'en') {
  const t = translator(language);
  const count = answers().length;
  await setValue(document.querySelector('#question'), value);
  const submit = document.querySelector('.ask-form button[type="submit"]');
  assert.equal(submit?.getAttribute('aria-label'), t('ask.send'));
  await click(submit);
  assert.equal(answers().length, count + 1, 'Submitting must add an actual question/answer turn.');
  assert.equal(document.querySelector('#question').value, '');
}

function diaryConsent(language = 'en') {
  const checkbox = document.querySelector('.ask-page input[type="checkbox"]');
  assert.ok(checkbox, 'Diary access must require its own checkbox.');
  const label = checkbox.labels?.[0];
  assert.ok(label?.textContent.includes(translator(language)('ask.useDiary')), 'The checkbox must have a translated accessible label.');
  return checkbox;
}

function seed(language = 'en', { readAloud = false } = {}) {
  const state = createDemoData();
  state.demo = false;
  state.settings.language = language;
  state.settings.readAloud = readAloud;
  const lastDate = Object.keys(state.logs).sort().at(-1);
  state.logs[lastDate].note = 'PRIVATE_DIARY_NOTE_never_repeat_this_in_chat';
  state.logs[lastDate].medicines = 'PRIVATE_MEDICINE_never_repeat_this_in_chat';
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, encrypted: false, data: state }));
  return state;
}

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); document.body.innerHTML = '';
  document.documentElement.lang = 'en'; runtimeErrors.length = 0;
  requests = []; downloads = []; objectURLs = new Map();
  denyNetwork();
  speech = { spoken: [], cancellations: 0, getVoices: () => [{ localService: true, lang: 'en-IN' }, { localService: true, lang: 'hi-IN' }, { localService: true, lang: 'ta-IN' }], addEventListener() {}, removeEventListener() {}, cancel() { this.cancellations++; }, speak(utterance) { this.spoken.push(utterance); } };
  Object.defineProperty(globalThis, 'speechSynthesis', { configurable: true, value: speech });
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  const Utterance = class { constructor(text) { this.text = text; } };
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: Utterance });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: Utterance });
  URL.createObjectURL = blob => { const url = `blob:offline-chat-${objectURLs.size + 1}`; objectURLs.set(url, blob); return url; };
  URL.revokeObjectURL = url => objectURLs.delete(url);
  window.HTMLAnchorElement.prototype.click = function () {
    if (this.download) { downloads.push({ name: this.download, blob: objectURLs.get(this.href) }); return; }
    return originalAnchorClick.call(this);
  };
});

afterEach(async () => {
  await unmount();
  globalThis.fetch = originalFetch;
  URL.createObjectURL = originalCreateURL;
  URL.revokeObjectURL = originalRevokeURL;
  window.HTMLAnchorElement.prototype.click = originalAnchorClick;
  assert.deepEqual(runtimeErrors, [], 'The full React application must not crash.');
});
after(() => dom.window.close());

test('offline chat: a signed-in App keeps literal questions out of storage, JSON and encrypted backups', async () => {
  const state = seed();
  const t = translator('en');
  // Establish an actual in-memory cookie/CSRF account session on the cloud
  // screen, then make every subsequent network request fail the test.
  globalThis.fetch = async (url, options = {}) => {
    requests.push([url, options]);
    const data = url === '/api/v1/auth/session'
      ? { user: { id: 'offline-test', username: 'fictional_offline_account' }, csrfToken: 'synthetic-csrf' }
      : url === '/api/v1/diary/status' ? { hasBackup: true, revision: 1 } : null;
    assert.ok(data, `Unexpected account bootstrap request: ${url}`);
    return { status: 200, ok: true, json: async () => ({ data }) };
  };
  await mount('/cloud');
  await waitFor(() => !!findButton(t('cloud.logout')), 'The synthetic account should finish signing in.');
  assert.deepEqual(requests.map(([url]) => url), ['/api/v1/auth/session', '/api/v1/diary/status']);
  requests = []; denyNetwork();
  await navigate('/ask');
  const localBefore = snapshot(localStorage);
  const sessionBefore = snapshot(sessionStorage);
  const sentinel = '<img src=x onerror="globalThis.XSS_TEST=true"> QZ_CONVERSATION_SENTINEL Do I have PCOS?';
  await ask(sentinel);
  assert.equal(questions().at(-1), sentinel, 'React must display the original question as text.');
  assert.equal(document.querySelector('.question-bubble img'), null, 'Question HTML must never become DOM.');
  assert.equal(globalThis.XSS_TEST, undefined);
  assert.ok(lastAnswer().textContent.includes(answerQuestion('PCOS', 'en').text), 'Health answers must retain the sourced library wording.');
  assert.ok(lastAnswer().querySelector(`.sources a[href="${SOURCES.pcos.url}"]`), 'The canonical PCOS source must be a real link.');
  assert.deepEqual(snapshot(localStorage), localBefore, 'Chat must not write a question or preference to the diary or another storage key.');
  assert.deepEqual(snapshot(sessionStorage), sessionBefore, 'Chat must not persist through sessionStorage.');

  await navigate('/privacy');
  await click(findButton(t('settings.exportJSON')));
  assert.equal(downloads.length, 1);
  const json = await downloads[0].blob.text();
  assert.deepEqual(JSON.parse(json), state, 'The real context JSON export must contain the diary alone.');
  assert.equal(json.includes('QZ_CONVERSATION_SENTINEL'), false);
  await click(findButton(t('settings.exportEncrypted')));
  const fields = document.querySelectorAll('.backup-password-dialog input[type="password"]');
  await setValue(fields[0], 'synthetic-offline-backup-passphrase');
  await setValue(fields[1], 'synthetic-offline-backup-passphrase');
  await click(findButton(t('settings.encryptedBackupActionExport')));
  await waitFor(() => downloads.length === 2, 'The real encrypted backup export should complete locally.');
  const encrypted = await downloads[1].blob.text();
  const restored = await importEncryptedBackup(encrypted, 'synthetic-offline-backup-passphrase');
  assert.deepEqual(restored, state, 'Decrypting the context backup must reveal no chat state.');
  assert.equal(JSON.stringify(restored).includes('QZ_CONVERSATION_SENTINEL'), false);
  assert.deepEqual(snapshot(localStorage), localBefore);
  assert.deepEqual(snapshot(sessionStorage), sessionBefore);
  assert.deepEqual(requests, [], 'A signed-in account must not turn offline chat or local export into a server call.');
});

test('offline chat: conversation supports greetings, sourced related questions and urgent follow-up context', async () => {
  seed(); const t = translator('en');
  await mount();
  await ask('Hello');
  assert.ok(lastAnswer().textContent.includes(t('ask.chatGreeting')));
  await ask('What can help period cramps?');
  const cramps = FAQ.find(item => item.id === 'cramps');
  assert.ok(lastAnswer().textContent.includes(cramps.answer.en));
  for (const id of cramps.sourceIds) assert.ok(lastAnswer().querySelector(`.sources a[href="${SOURCES[id].url}"]`));
  const related = [...document.querySelectorAll('.ask-page button')].find(node => FAQ.some(item => item.id !== 'cramps' && normalize(node.textContent) === normalize(item.question.en)));
  assert.ok(related, 'A sourced answer should expose a related question from the bilingual FAQ.');
  const relatedQuestion = related.textContent;
  await click(related);
  assert.equal(questions().at(-1), relatedQuestion);
  await ask('I have heavy bleeding');
  await ask('I feel dizzy now');
  const urgent = answerQuestion('heavy bleeding and dizzy', 'en');
  assert.ok(lastAnswer().textContent.includes(urgent.text), 'A danger signal in a follow-up must escalate the preceding heavy bleeding.');
  assert.ok(lastAnswer().querySelector('a[href="tel:112"]'));
  assert.ok(lastAnswer().querySelector('a[href="tel:108"]'));
  assert.ok(lastAnswer().querySelector(`.sources a[href="${SOURCES.emergency.url}"]`));
  assert.deepEqual(requests, []);
});

for (const language of ['en', 'hi', 'ta']) {
  test(`offline chat: ${language} diary summaries require temporary consent and revoking it removes diary turns`, async () => {
    seed(language); const t = translator(language);
    const before = snapshot(localStorage);
    await mount();
    assert.equal(diaryConsent(language).checked, false, 'Diary use must start off.');
    await ask(t('ask.diaryPrompt'), language);
    assert.ok(lastAnswer().textContent.includes(t('ask.diaryOptIn')));
    assert.equal(lastAnswer().getAttribute('data-diary-summary'), null);
    await click(diaryConsent(language));
    assert.equal(diaryConsent(language).checked, true);
    await click(findButton(t('ask.diaryPrompt')));
    assert.equal(lastAnswer().getAttribute('data-diary-summary'), 'true');
    assert.ok(lastAnswer().textContent.includes(t('ask.diarySummaryIntro')), 'Consent allows a computed diary summary in the selected language.');
    assert.equal(document.querySelector('.messages').textContent.includes('PRIVATE_DIARY_NOTE'), false);
    assert.equal(document.querySelector('.messages').textContent.includes('PRIVATE_MEDICINE'), false);
    await click(diaryConsent(language));
    assert.equal(diaryConsent(language).checked, false);
    assert.equal(document.querySelector('.messages [data-diary-summary="true"]'), null, 'Revoking consent must remove the diary-derived response from the current thread.');
    await ask(greetings[language], language);
    assert.ok(lastAnswer().textContent.includes(t('ask.chatGreeting')));
    assert.deepEqual(snapshot(localStorage), before, 'Consent and derived summaries must remain in component memory.');
    assert.deepEqual(snapshot(sessionStorage), {});
    assert.deepEqual(requests, []);
  });
}

test('offline chat: clear, reload and changing language erase RAM conversation, consent and local speech', async () => {
  seed('en', { readAloud: true });
  const t = translator('en');
  await mount();
  await ask('PRIVATE_CLEAR_SENTINEL PCOS');
  await click(diaryConsent());
  assert.ok(speech.spoken.length > 0, 'Read-aloud must use the installed local voice stub.');
  const cancellations = speech.cancellations;
  await click(findButton(t('ask.clear')));
  assert.equal(answers().length, 0);
  assert.equal(questions().length, 0);
  assert.equal(document.querySelector('#question').value, '');
  assert.equal(diaryConsent().checked, false);
  assert.ok(speech.cancellations > cancellations, 'Clear must stop speaking the erased conversation.');

  await ask('PRIVATE_RELOAD_SENTINEL PCOS');
  await click(diaryConsent());
  await unmount();
  await mount();
  assert.equal(answers().length, 0, 'Recreating the actual App must not reload the previous conversation.');
  assert.equal(diaryConsent().checked, false);
  assert.equal(document.body.textContent.includes('PRIVATE_RELOAD_SENTINEL'), false);

  await ask('PRIVATE_LANGUAGE_SENTINEL PCOS');
  await click(diaryConsent());
  await setValue(document.querySelector('#question'), 'PRIVATE_DRAFT_SENTINEL');
  const beforeLanguage = speech.cancellations;
  await changeLanguage('hi');
  assert.equal(answers().length, 0, 'Language changes must clear the conversation instead of reusing stale-language answers.');
  assert.equal(document.querySelector('#question').value, '');
  assert.equal(diaryConsent('hi').checked, false);
  assert.ok(speech.cancellations > beforeLanguage);
  assert.equal(JSON.stringify(snapshot(localStorage)).includes('PRIVATE_LANGUAGE_SENTINEL'), false);
  assert.equal(JSON.stringify(snapshot(localStorage)).includes('PRIVATE_DRAFT_SENTINEL'), false);
  assert.deepEqual(requests, []);
});

for (const language of ['en', 'hi', 'ta']) {
  test(`offline chat: populated ${language} thread and diary controls have translated accessible semantics`, async () => {
    seed(language, { readAloud: true }); const t = translator(language);
    await mount();
    const textarea = document.querySelector('#question');
    for (const key of ['ask.label', 'ask.useDiary', 'ask.chatGreeting', 'ask.diaryPrompt', 'ask.diarySummaryIntro']) {
      assert.equal(typeof dictionaries[language][key], 'string', `${language} must define ${key} without English fallback.`);
      if (language !== 'en') assert.notEqual(dictionaries[language][key], dictionaries.en[key], `${key} should use the selected language.`);
    }
    assert.ok(textarea.labels?.[0]?.textContent.includes(t('ask.label')));
    assert.equal(document.querySelector('.ask-form button[type="submit"]').getAttribute('aria-label'), t('ask.send'));
    diaryConsent(language);
    await ask(greetings[language], language);
    assert.ok(lastAnswer().textContent.includes(t('ask.chatGreeting')));
    const pcos = FAQ.find(item => item.id === 'pcos');
    await ask(pcos.question[language], language);
    assert.ok(lastAnswer().textContent.includes(pcos.answer[language]), 'The FAQ response must use the selected language.');
    assert.ok(lastAnswer().querySelector(`.sources a[href="${SOURCES.pcos.url}"]`));
    assert.equal(speech.spoken.at(-1)?.lang, `${language}-IN`, 'Read-aloud must select a local voice for the current language.');
    await click(diaryConsent(language));
    await click(findButton(t('ask.diaryPrompt')));
    assert.equal(lastAnswer().getAttribute('data-diary-summary'), 'true');
    const thread = document.querySelector('.messages');
    assert.equal(thread.getAttribute('role'), 'log');
    assert.equal(thread.getAttribute('aria-live'), 'polite');
    assert.equal(thread.getAttribute('aria-label'), t('ask.conversation'));
    assert.ok(findButton(t('ask.clear')));
    const result = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
      // JSDOM has no layout/raster engine; palette and physical target size
      // require separate browser verification, not a false automated claim.
      rules: { 'color-contrast': { enabled: false } },
    });
    assert.deepEqual(result.violations.map(item => ({ rule: item.id, nodes: item.nodes.map(node => node.target) })), []);
    assert.deepEqual(requests, []);
  });
}

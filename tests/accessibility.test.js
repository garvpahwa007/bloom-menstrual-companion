import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { JSDOM, VirtualConsole } from 'jsdom';
import React, { act } from 'react';
import { createDemoData } from '../src/data/demo.js';
import { addDays, todayISO } from '../src/lib/dates.js';
import { translator } from '../src/i18n/index.js';

// This is an automated semantic audit of the actual React application. JSDOM
// has no physical rendering/layout engine: it cannot reliably measure rendered
// contrast, responsive layout, touch target geometry or screen-reader behavior.
// Only axe's color-contrast rule is disabled for that technical reason. The
// real rendered palette/layout need their separate browser checks and report.
const runtimeErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => runtimeErrors.push(error.message));
const dom = new JSDOM('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Saheli</title><link rel="icon" href="/favicon.svg"></head><body></body></html>', {
  url: 'http://localhost:3000/', pretendToBeVisual: true, virtualConsole,
});
for (const key of ['window', 'document', 'navigator', 'location', 'history', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'MutationObserver', 'getComputedStyle', 'localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key],
  });
}
Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.print = () => {};
// axe probes canvas for text ligatures even with contrast disabled. JSDOM has
// no raster engine: provide measurement only; no pixel/contrast claim is made.
window.HTMLCanvasElement.prototype.getContext = function () { return { canvas: this, measureText: text => ({ width: String(text).length * 8 }) }; };
window.confirm = () => { throw new Error('Unexpected native confirmation during the semantic audit.'); };

// Include the application's local styles so desktop-hidden alternatives are
// not treated as simultaneously visible. No resources are fetched. JSDOM does
// not evaluate responsive media conditions as a real browser does.
const style = document.createElement('style');
style.textContent = (await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')).replace(/^\s*@import\s+[^;]+;/m, '');
document.head.append(style);

// axe must be imported after window and document exist; it keeps that initial
// document. Every case therefore reuses this one DOM and unmounts cleanly.
const { default: axe } = await import('axe-core');
const { createRoot } = await import('react-dom/client');
const { BrowserRouter } = await import('react-router-dom');
const { default: App } = await import('../.test-cache/App.mjs');
const { enablePIN, STORAGE_KEY } = await import('../src/lib/storage.js');

let root;
let reactErrors = [];
let originalConsoleError;
const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();

async function mount(path, state, { locked = false, language = 'en' } = {}) {
  localStorage.clear(); sessionStorage.clear(); runtimeErrors.length = 0;
  document.body.innerHTML = '';
  document.documentElement.lang = 'en';
  window.history.replaceState({}, '', path);
  if (locked) await enablePIN(state, '4826');
  else if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, encrypted: false, data: state }));
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  reactErrors = []; originalConsoleError = console.error;
  console.error = (...args) => reactErrors.push(args.map(String).join(' '));
  await act(async () => { root.render(React.createElement(BrowserRouter, null, React.createElement(App))); });
  if ((!state || locked) && language === 'hi') {
    const languageButton = document.querySelector('.language-button');
    assert.ok(languageButton, 'The welcome/locked screen must expose a language control.');
    await act(async () => { languageButton.click(); });
  }
}

async function audit(label) {
  assert.ok(document.querySelector('h1'), `${label}: a page heading must render`);
  assert.equal(document.querySelectorAll('main').length, 1, `${label}: exactly one main landmark`);
  const result = await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  const violations = result.violations.map(violation => ({
    rule: violation.id,
    impact: violation.impact,
    description: violation.help,
    nodes: violation.nodes.map(node => ({ target: node.target, failure: node.failureSummary })),
  }));
  assert.deepEqual(violations, [], `${label}: axe semantic accessibility violations`);
}

afterEach(async () => {
  if (root) { await act(async () => { root.unmount(); }); root = null; }
  if (originalConsoleError) { console.error = originalConsoleError; originalConsoleError = null; }
  assert.deepEqual(runtimeErrors, [], 'The actual React screen must not fail in the synthetic DOM.');
  assert.deepEqual(reactErrors, [], 'React must not report errors during the accessibility audit.');
});
after(() => dom.window.close());

const screens = [
  { name: 'Today', path: '/', selector: '#cycle-heading' },
  { name: 'Log with heavy-flow follow-up questions', path: '/log', selector: '.tracking-log-page', heavy: true },
  { name: 'Calendar', path: '/calendar', selector: '.tracking-calendar-grid' },
  { name: 'Insights', path: '/insights', selector: '.tracking-chart' },
  { name: 'Care guidance with evidence cards', path: '/guidance', selector: '.guidance-card' },
  { name: 'Visit summary', path: '/visit', selector: '.visit-sheet' },
  { name: 'Lesson index', path: '/learn', selector: '.learn-grid' },
  { name: 'PCOS lesson with instructional diagram', path: '/learn?lesson=pcos', selector: '.lesson-detail' },
  { name: 'Ask with a real local answer', path: '/ask', selector: '.ask-page', answer: true },
  { name: 'Reminders', path: '/reminders', selector: '.reminder-add' },
  { name: 'Pregnancy confirmation setup', path: '/pregnancy', selector: '.pregnancy-setup' },
  { name: 'Confirmed pregnancy education', path: '/pregnancy', selector: '.pregnancy-hero', pregnancy: true },
  { name: 'Settings', path: '/settings', selector: '.settings-grid' },
  { name: 'Privacy & Data', path: '/privacy', selector: '.privacy-data-screen' },
  { name: 'PIN setup form', path: '/settings', selector: '.pin-form', pin: true },
];

for (const language of ['en', 'hi']) {
  test(`Accessibility: onboarding (${language})`, async () => {
    await mount('/', null, { language });
    assert.ok(document.querySelector('.welcome-screen'));
    assert.equal(document.documentElement.lang, language);
    await audit(`Onboarding ${language}`);
  });

  for (const screen of screens) {
    test(`Accessibility: ${screen.name} (${language})`, async () => {
      const state = createDemoData();
      state.profile.ageGroup = 'adult';
      state.settings.language = language;
      if (screen.heavy) state.logs[todayISO()] = { ...state.logs[todayISO()], period: true, flow: 'heavy' };
      if (screen.pregnancy) Object.assign(state.profile, {
        pregnancyEnabled: true, pregnancyConfirmed: true, pregnancyFeatureEnabled: true,
        lastPeriodDate: addDays(todayISO(), -140),
      });
      await mount(screen.path, state);
      if (screen.answer) {
        const suggestion = [...document.querySelectorAll('.suggestion')].find(button => button.textContent.includes('PCOS'));
        assert.ok(suggestion, 'Ask must offer the actual PCOS question.');
        await act(async () => { suggestion.click(); });
        assert.ok(document.querySelector('.answer-bubble'), 'The local answer must render before auditing.');
      }
      if (screen.pin) {
        const button = [...document.querySelectorAll('button')].find(element => normalize(element.textContent) === (language === 'hi' ? 'PIN बनाएँ' : 'Set a PIN'));
        assert.ok(button, 'Settings must expose PIN setup.');
        await act(async () => { button.click(); });
      }
      assert.ok(document.querySelector(screen.selector), `${screen.name} must render its own content, not a crash fallback.`);
      assert.equal(document.documentElement.lang, language);
      await audit(`${screen.name} ${language}`);
    });
  }

  test(`Accessibility: encrypted-backup password dialog (${language})`, async () => {
    const state = createDemoData(); state.settings.language = language;
    await mount('/privacy', state);
    const t = translator(language);
    const button = [...document.querySelectorAll('button')].find(element => normalize(element.textContent) === t('settings.exportEncrypted'));
    assert.ok(button, 'Privacy & Data must expose encrypted backup creation.');
    await act(async () => { button.click(); });
    assert.ok(document.querySelector('.backup-password-dialog'));
    assert.ok(document.querySelector('#backup-passphrase'));
    await audit(`Encrypted backup dialog ${language}`);
  });

  test(`Accessibility: encrypted locked diary (${language})`, async () => {
    const state = createDemoData(); state.settings.language = language;
    await mount('/', state, { locked: true, language });
    assert.ok(document.querySelector('.lock-screen .pin-input'), 'The encrypted fixture must show the real unlock form.');
    assert.equal(document.documentElement.lang, language);
    await audit(`Locked diary ${language}`);
  });
}

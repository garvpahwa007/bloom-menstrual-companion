import test, { beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import { JSDOM, VirtualConsole } from 'jsdom';
import React, { act } from 'react';
import en from '../src/i18n/en.js';
import { addDays, todayISO } from '../src/lib/dates.js';
import { analyzeCycles } from '../src/lib/cycle.js';

// A disposable DOM only: no browser, network, OS notifications or real diary.
const virtualConsole = new VirtualConsole();
const domErrors = [];
virtualConsole.on('jsdomError', error => domErrors.push(error.message));
const dom = new JSDOM('<!doctype html><html><head><link rel="icon" href="/favicon.svg"></head><body></body></html>', { url: 'http://localhost:3000/', pretendToBeVisual: true, virtualConsole });
for (const key of ['window', 'document', 'navigator', 'location', 'history', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLAnchorElement', 'Event', 'MouseEvent', 'CustomEvent', 'MutationObserver', 'getComputedStyle', 'localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key] });
}
Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
globalThis.Blob = NodeBlob;
globalThis.File = NodeFile;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.print = () => {};
window.confirm = () => { throw new Error('An unexpected native confirmation was opened in the synthetic UI test.'); };
const { createRoot } = await import('react-dom/client');
const { BrowserRouter } = await import('react-router-dom');
const { default: App } = await import('../.test-cache/App.mjs');

const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
const text = key => en[key];
const downloads = [];
const objectURLs = new Map();
const originalCreateURL = URL.createObjectURL;
const originalRevokeURL = URL.revokeObjectURL;
URL.createObjectURL = blob => { const url = `blob:synthetic-saheli-${objectURLs.size + 1}`; objectURLs.set(url, blob); return url; };
URL.revokeObjectURL = url => objectURLs.delete(url);
const originalAnchorClick = window.HTMLAnchorElement.prototype.click;
window.HTMLAnchorElement.prototype.click = function () {
  if (this.download) { downloads.push({ name: this.download, blob: objectURLs.get(this.href) }); return; }
  return originalAnchorClick.call(this);
};

let root;
let consoleErrors;
let originalConsoleError;
const envelope = () => {
  const value = localStorage.getItem('saheli.v1');
  return value ? JSON.parse(value) : null;
};
const bodyText = () => normalize(document.body.textContent);
const findButton = label => [...document.querySelectorAll('button')].find(element => normalize(element.getAttribute('aria-label')) === normalize(label) || normalize(element.textContent) === normalize(label));
const findControl = label => {
  const explicit = [...document.querySelectorAll('input, select, textarea')].find(element => normalize(element.getAttribute('aria-label')) === normalize(label));
  if (explicit) return explicit;
  const field = [...document.querySelectorAll('label')].find(element => [...element.querySelectorAll('span,strong')].some(child => normalize(child.textContent) === normalize(label)) || normalize(element.textContent) === normalize(label));
  return field?.querySelector('input, select, textarea');
};
async function waitFor(predicate, message, timeout = 4000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    let result;
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); result = predicate(); });
    if (result) return result;
  }
  assert.fail(message || 'Timed out waiting for the React UI.');
}
async function click(element) {
  assert.ok(element, 'The expected clickable UI element must exist.');
  if ('disabled' in element) assert.equal(element.disabled, false, 'The expected UI action must be enabled.');
  await act(async () => { element.click(); });
}
async function clickButton(label) { return click(findButton(label)); }
async function inputValue(element, value) {
  assert.ok(element, 'The expected form control must exist.');
  const prototype = element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
  await act(async () => { setter.call(element, value); element.dispatchEvent(new window.Event('input', { bubbles: true })); element.dispatchEvent(new window.Event('change', { bubbles: true })); });
}
async function navigate(path) {
  const link = [...document.querySelectorAll('aside a')].find(element => element.getAttribute('href') === path);
  assert.ok(link, `A real navigation link for ${path} must exist.`);
  await click(link);
  await waitFor(() => window.location.pathname === path, `Navigation to ${path} should finish.`);
}
async function mount() {
  const container = document.createElement('div'); container.id = 'synthetic-root'; document.body.append(container);
  root = createRoot(container);
  await act(async () => { root.render(React.createElement(BrowserRouter, null, React.createElement(App))); });
}
async function remount() {
  await act(async () => { root.unmount(); }); root = null; document.body.innerHTML = '';
  await mount();
}
async function startDemo({ adult = false } = {}) {
  if (adult) await click(document.querySelector('input[name="age"][value="adult"]'));
  await clickButton(text('welcome.demo'));
  await waitFor(() => !!document.querySelector('.app-shell'), 'The demo should open the app.');
}
async function captureExport(type) {
  const previous = downloads.length;
  await clickButton(text(type === 'csv' ? 'settings.exportCSV' : 'settings.exportJSON'));
  assert.equal(downloads.length, previous + 1, 'Export must create a download.');
  const file = downloads.at(-1);
  assert.ok(file.blob instanceof NodeBlob);
  assert.match(file.name, new RegExp(`\\.${type}$`));
  return { name: file.name, content: await file.blob.text() };
}
async function importBackup(file) {
  const control = findControl(text('settings.import'));
  assert.ok(control, 'The import file input must have its visible label.');
  Object.defineProperty(control, 'files', { configurable: true, value: [new NodeFile([file.content], file.name, { type: file.name.endsWith('.csv') ? 'text/csv' : 'application/json' })] });
  await act(async () => { control.dispatchEvent(new window.Event('change', { bubbles: true })); });
  await waitFor(() => document.querySelector('[role="alertdialog"], [role="dialog"]'), 'Import should ask for a passphrase or replacement confirmation.');
}

beforeEach(async () => {
  localStorage.clear(); sessionStorage.clear(); window.history.replaceState({}, '', '/'); document.body.innerHTML = '';
  downloads.length = 0; objectURLs.clear(); domErrors.length = 0;
  delete window.speechSynthesis; delete globalThis.speechSynthesis;
  consoleErrors = []; originalConsoleError = console.error; console.error = (...args) => consoleErrors.push(args.map(String).join(' '));
  await mount();
});
afterEach(async () => {
  if (root) { await act(async () => { root.unmount(); }); root = null; }
  console.error = originalConsoleError;
  assert.deepEqual(domErrors, [], 'The synthetic DOM should report no runtime errors.');
  assert.deepEqual(consoleErrors, [], 'React should report no errors or unwrapped state updates.');
});
after(() => { URL.createObjectURL = originalCreateURL; URL.revokeObjectURL = originalRevokeURL; window.HTMLAnchorElement.prototype.click = originalAnchorClick; dom.window.close(); });

test('React UI: fresh onboarding creates an empty private diary', async () => {
  assert.ok(findButton(text('welcome.demo')));
  assert.ok(findButton(text('welcome.fresh')));
  assert.equal(normalize(document.querySelector('.welcome-top .brand strong')?.textContent), text('app.name'));
  assert.equal(document.querySelector('.welcome-top .bloom-brand-mark')?.getAttribute('src'), '/bloom-mark.png');
  assert.equal(document.querySelector('.welcome-logo-art')?.getAttribute('src'), '/bloom-logo.png');
  assert.equal(localStorage.length, 0);
  await clickButton(text('welcome.fresh'));
  await waitFor(() => !!document.querySelector('.app-shell'), 'Fresh onboarding should open Today.');
  assert.equal(envelope().encrypted, false);
  assert.deepEqual(envelope().data.logs, {});
  assert.equal(envelope().data.demo, false);
  assert.ok(bodyText().includes(text('tracking.notEnoughData')));
});

test('React UI: demo onboarding shows fictional history, irregularity and an estimate', async () => {
  await startDemo();
  assert.ok(bodyText().includes(text('demo.banner')));
  assert.ok(bodyText().includes(text('tracking.irregular')));
  assert.ok(bodyText().includes(text('tracking.nextEstimate')));
  assert.match(document.querySelector('#cycle-heading').textContent, /12/);
  assert.ok(Object.keys(envelope().data.logs).length > 30);
});

test('React UI: compact Today uses the Bloom mark and keeps essential estimate status and details available', async () => {
  await startDemo();
  assert.equal(document.querySelector('.tracking-cycle-logo')?.getAttribute('src'), '/bloom-mark.png');
  assert.equal(document.querySelector('.tracking-cycle-orbit')?.getAttribute('aria-hidden'), 'true');
  assert.ok(document.querySelector('.tracking-cycle-orbit .tracking-cycle-logo'));
  assert.ok(bodyText().includes(text('tracking.estimateCaveat')));
  assert.ok(bodyText().includes(text('tracking.nextEstimate')));
  assert.equal(document.querySelectorAll('.today-collapsible').length, 4);
  assert.deepEqual([...document.querySelectorAll('.today-collapsible > summary')].map(item => normalize(item.textContent)), [text('tracking.overview'), text('tracking.recentAndInsights'), text('tracking.quickCheckIn'), text('tracking.learnAndPrivacy')]);
  assert.equal(document.querySelector('.tracking-learn-banner')?.closest('details')?.open, false);
  const overview = document.querySelector('.today-collapsible');
  await click(overview.querySelector('summary'));
  assert.equal(overview.open, true);
  assert.ok(overview.textContent.includes(text('tracking.averageCycle')));
  assert.ok(document.querySelector('.mobile-bottom'));
});

test('React UI: compact app shell provides the five reference-style mobile destinations', async () => {
  await startDemo();
  assert.equal(document.querySelector('.topbar-brand')?.getAttribute('href'), '/');
  assert.equal(normalize(document.querySelector('.topbar-brand strong')?.textContent), text('app.name'));
  assert.equal(document.querySelector('.topbar-brand .bloom-brand-mark')?.getAttribute('src'), '/bloom-mark.png');
  assert.equal(normalize(document.querySelector('.demo-data-pill')?.textContent), text('header.demoData'));
  assert.equal(findButton(text('nav.ask'))?.classList.contains('ask-shortcut'), true);
  const tabs = [...document.querySelectorAll('.mobile-bottom .nav-item')];
  assert.deepEqual(tabs.map(link => link.getAttribute('href')), ['/', '/calendar', '/insights', '/learn', '/settings']);
  assert.deepEqual(tabs.map(link => normalize(link.querySelector('span:not(.nav-count)')?.textContent)), [
    text('nav.today'), text('nav.calendar'), text('nav.insightsShort'), text('nav.learn'), text('nav.you'),
  ]);
  await clickButton(text('nav.ask'));
  await waitFor(() => window.location.pathname === '/ask', 'The compact Ask shortcut should navigate to Ask Bloom.');
});

test('React UI: Privacy & Data explains local storage and exposes backup controls from navigation and Settings', async () => {
  await startDemo();
  await navigate('/privacy');
  assert.ok(bodyText().includes(text('privacyData.title')));
  assert.ok(bodyText().includes(text('privacyData.storageBody')));
  assert.ok(bodyText().includes(text('privacyData.backupBody')), 'The screen should warn about sensitive, unencrypted JSON and CSV exports.');
  assert.ok(bodyText().includes(text('privacyData.pinOff')));
  assert.ok(findButton(text('settings.exportJSON')));
  assert.ok(findButton(text('settings.exportCSV')));
  assert.ok(findControl(text('settings.import')));
  await navigate('/settings');
  await clickButton(text('privacyData.open'));
  await waitFor(() => window.location.pathname === '/privacy', 'Settings should link to the Privacy & Data screen.');
});

test('React UI: encrypted backup prompts protect export and restore only after decryption and explicit confirmation', async () => {
  await startDemo(); await navigate('/privacy');
  assert.ok(findButton(text('settings.exportEncrypted')));
  await clickButton(text('settings.exportEncrypted'));
  assert.ok(document.querySelector('[role="dialog"]'));
  assert.ok(bodyText().includes(text('settings.encryptedBackupBody')));
  await inputValue(document.getElementById('backup-passphrase'), 'A unique passphrase for backup 2026');
  await inputValue(findControl(text('settings.encryptedBackupConfirm')), 'A unique passphrase for backup 2026');
  await clickButton(text('settings.encryptedBackupActionExport'));
  await waitFor(() => downloads.some(file => file.name.endsWith('.bloombackup')), 'Encrypted backup should download.');
  const file = downloads.at(-1);
  const encryptedText = await file.blob.text();
  assert.equal(encryptedText.includes('PRIVATE_NOTE_MARKER'), false);
  const original = localStorage.getItem('saheli.v1');
  await importBackup({ name: file.name, content: encryptedText });
  assert.ok(document.querySelector('[role="dialog"]'));
  await inputValue(document.getElementById('backup-passphrase'), 'Wrong unique phrase length ok');
  await clickButton(text('settings.encryptedBackupActionImport'));
  await waitFor(() => document.querySelector('[role="alert"]')?.textContent === text('settings.encryptedBackupWrongPassword'), 'Wrong passphrase should give a non-destructive error.');
  assert.equal(localStorage.getItem('saheli.v1'), original);
  await inputValue(document.getElementById('backup-passphrase'), 'A unique passphrase for backup 2026');
  await clickButton(text('settings.encryptedBackupActionImport'));
  await waitFor(() => document.querySelector('[role="alertdialog"]'), 'A successfully decrypted backup must still ask before replacing the diary.');
  await clickButton(text('common.cancel'));
  assert.equal(localStorage.getItem('saheli.v1'), original, 'Cancel must preserve current stored diary bytes.');
  await importBackup({ name: file.name, content: encryptedText });
  await inputValue(document.getElementById('backup-passphrase'), 'A unique passphrase for backup 2026');
  await clickButton(text('settings.encryptedBackupActionImport'));
  await waitFor(() => document.querySelector('[role="alertdialog"]'));
  await clickButton(text('common.continue'));
  await waitFor(() => bodyText().includes(text('settings.imported')), 'Confirmed encrypted restore should complete.');
  assert.deepEqual(JSON.parse((await captureExport('json')).content), JSON.parse(original).data);
});

test('React UI: PIN form encrypts, lock survives reload, wrong PIN preserves data and correct PIN restores it', async () => {
  await startDemo(); await navigate('/settings');
  const original = envelope().data;
  await clickButton(text('settings.enablePin'));
  await inputValue(findControl(text('settings.enterPin')), '4826');
  await inputValue(findControl(text('settings.confirmPin')), '4826');
  await clickButton(text('settings.enablePin'));
  await waitFor(() => envelope()?.encrypted === true && bodyText().includes(text('settings.pinEnabled')), 'Enabling the PIN should finish encryption.');
  assert.equal(localStorage.length, 1);
  assert.equal(Object.hasOwn(envelope(), 'data'), false);
  const encrypted = localStorage.getItem('saheli.v1');
  assert.equal(encrypted.includes('trackedSymptoms'), false);
  assert.equal(encrypted.includes('"logs"'), false);
  await clickButton(text('header.lock'));
  await waitFor(() => bodyText().includes(text('lock.title')), 'Lock now should close the diary.');
  assert.equal(document.title, text('app.diary'));
  await remount();
  assert.ok(bodyText().includes(text('lock.title')));
  await inputValue(findControl(text('settings.enterPin')), '1357');
  await clickButton(text('lock.unlock'));
  await waitFor(() => bodyText().includes(text('lock.wrongPin')), 'A wrong PIN should show a safe error.');
  assert.equal(localStorage.getItem('saheli.v1'), encrypted);
  await inputValue(findControl(text('settings.enterPin')), '4826');
  await clickButton(text('lock.unlock'));
  await waitFor(() => !!document.querySelector('.app-shell'), 'The correct PIN should restore the diary.');
  await navigate('/privacy');
  assert.ok(bodyText().includes(text('privacyData.pinOn')), 'The Privacy & Data screen should reflect the unlocked encrypted vault.');
  const restored = await captureExport('json');
  assert.deepEqual(JSON.parse(restored.content), original);
});

test('React UI: actual JSON and CSV downloads can each be imported with confirmation and restore identical data', async () => {
  await startDemo(); await navigate('/privacy');
  const initial = await captureExport('json');
  const initialState = JSON.parse(initial.content);
  await navigate('/settings');
  await click(findControl(text('settings.discreet')));
  await waitFor(() => document.title === text('app.diary'), 'The diary should visibly change before import.');
  await navigate('/privacy');
  const beforeConfirmation = localStorage.getItem('saheli.v1');
  await importBackup(initial);
  assert.equal(document.querySelectorAll('[role="alertdialog"]').length, 1);
  assert.equal(localStorage.getItem('saheli.v1'), beforeConfirmation, 'Import must wait for confirmation.');
  await clickButton(text('common.continue'));
  await waitFor(() => envelope()?.data?.settings.discreet === false, 'JSON import should restore the original settings.');
  assert.deepEqual(JSON.parse((await captureExport('json')).content), initialState);
  const csv = await captureExport('csv');
  await navigate('/settings');
  await click(findControl(text('settings.contrast')));
  await waitFor(() => document.documentElement.dataset.contrast === 'high', 'The second test change should save.');
  await navigate('/privacy');
  await importBackup(csv);
  await clickButton(text('common.continue'));
  await waitFor(() => document.documentElement.dataset.contrast === 'normal', 'CSV import should restore the settings.');
  assert.deepEqual(JSON.parse((await captureExport('json')).content), initialState);
});

test('React UI: Delete everything uses one confirmation and clears both browser stores', async () => {
  await startDemo(); await navigate('/privacy');
  sessionStorage.setItem('synthetic-private-cache', 'fictional');
  await clickButton(text('settings.delete'));
  assert.equal(document.querySelectorAll('[role="alertdialog"]').length, 1);
  assert.equal(localStorage.length, 1);
  await clickButton(text('common.cancel'));
  assert.equal(localStorage.length, 1, 'Cancel must preserve the diary.');
  await clickButton(text('settings.delete'));
  assert.equal(document.querySelectorAll('[role="alertdialog"]').length, 1);
  await clickButton(text('common.continue'));
  await waitFor(() => !!findButton(text('welcome.fresh')), 'Deletion should return to onboarding.');
  assert.equal(localStorage.length, 0);
  assert.equal(sessionStorage.length, 0);
  assert.equal(document.querySelector('[role="alertdialog"]'), null, 'A second confirmation must not be required.');
});

test('React UI: discreet mode persists the Diary title and neutral favicon', async () => {
  await startDemo(); await navigate('/settings');
  await click(findControl(text('settings.discreet')));
  await waitFor(() => document.title === text('app.diary'), 'Discreet mode should change the tab title.');
  const favicon = document.querySelector('link[rel="icon"]').getAttribute('href');
  assert.match(favicon, /^data:image\/svg\+xml,/);
  assert.match(decodeURIComponent(favicon), /<rect/);
  assert.equal(document.querySelector('aside .brand strong').textContent, text('app.diary'));
  await remount();
  assert.equal(document.title, text('app.diary'));
  assert.equal(document.querySelector('link[rel="icon"]').getAttribute('href'), favicon);
});

test('React UI: Learn remains usable without any local speech voice', async () => {
  await startDemo(); await navigate('/learn');
  await clickButton(text('learn.read'));
  await waitFor(() => !!document.querySelector('.lesson-detail'), 'A lesson should open.');
  assert.ok(bodyText().includes(text('learn.noVoice')));
  assert.equal(findButton(text('learn.listen')), undefined);
  assert.ok(document.querySelector('.lesson-detail .sources a[href^="https:"]'));
  assert.equal(bodyText().includes(text('error.title')), false);
});

test('React UI: confirmed pregnancy pauses estimates and saves an optional dated check-up reminder', async () => {
  await startDemo({ adult: true }); await navigate('/pregnancy');
  const enable = findButton(text('pregnancy.enable'));
  assert.ok(enable?.disabled, 'Pregnancy mode must require confirmation and a date.');
  await inputValue(findControl(text('pregnancy.last')), addDays(todayISO(), -70));
  assert.ok(findButton(text('pregnancy.enable')).disabled, 'A date alone must not confirm pregnancy.');
  await click(findControl(text('pregnancy.confirm')));
  await clickButton(text('pregnancy.enable'));
  await waitFor(() => bodyText().includes(text('pregnancy.pause')), 'Confirmed pregnancy should pause period estimates.');
  assert.equal(envelope().data.profile.pregnancyEnabled, true);
  assert.equal(envelope().data.profile.pregnancyConfirmed, true);
  await navigate('/');
  assert.ok(bodyText().includes(text('tracking.predictionsPaused')));
  assert.equal(document.querySelector('.tracking-hero-estimate'), null);
  await navigate('/calendar');
  assert.equal(document.querySelectorAll('.tracking-calendar-day.fertile').length, 0, 'Pregnancy mode must suppress fertile-day markers.');
  await navigate('/pregnancy');
  const appointmentDate = addDays(todayISO(), 7);
  await inputValue(findControl('Appointment date'), appointmentDate);
  await inputValue(findControl('Reminder time'), '10:30');
  const checkup = findControl('Turn on this check-up reminder');
  assert.ok(checkup, 'The dated antenatal reminder must be available.');
  assert.equal(checkup.checked, false, 'A check-up reminder must start off.');
  await click(checkup);
  await clickButton('Save check-up reminder');
  await waitFor(() => envelope()?.data?.reminders.some(reminder => reminder.id === 'pregnancy-checkup'), 'The check-up reminder should save.');
  const saved = envelope().data.reminders.find(reminder => reminder.id === 'pregnancy-checkup');
  assert.deepEqual({ type: saved.type, date: saved.date, time: saved.time, enabled: saved.enabled }, { type: 'checkup', date: appointmentDate, time: '10:30', enabled: true });
});


test('React UI: symptom intensity stays optional, persists after reload, and reaches the clinician visit sheet', async () => {
  await startDemo({ adult: true });
  const today = todayISO();
  const tracked = envelope().data.settings.trackedSymptoms;
  const existing = envelope().data.logs[today]?.symptoms || [];
  const symptomId = tracked.find(id => !existing.includes(id));
  assert.ok(symptomId, 'The demo should have at least one unselected tracked symptom.');
  await navigate('/log');
  assert.equal(bodyText().includes(text('tracking.intensityOptional')), false, 'Intensity must not be demanded before a symptom is selected.');
  await clickButton(text(`tracking.symptom.${symptomId}`));
  await waitFor(() => bodyText().includes(text('tracking.intensityOptional')), 'Selecting a symptom should reveal optional intensity choices.');
  await clickButton(text('tracking.intensity.strong'));
  await clickButton(text('tracking.saveLog'));
  await waitFor(() => envelope()?.data?.logs?.[today]?.symptomIntensity?.[symptomId] === 3, 'The selected intensity should save locally.');
  await remount();
  assert.ok(findButton(text('tracking.intensity.strong'))?.classList.contains('selected'), 'The selected intensity should return after reload.');
  await navigate('/guidance');
  await clickButton(text('doctor.prepare'));
  await waitFor(() => window.location.pathname === '/visit', 'The Guidance action should open the clinician visit sheet.');
  assert.ok(bodyText().includes(text('visit.symptomIntensity')));
  assert.ok(bodyText().includes(text(`tracking.symptom.${symptomId}`)));
  assert.match(bodyText().toLowerCase(), /strong 1/);
});

test('React UI: a same-date Ask/log shortcut query selects the newly requested symptom', async () => {
  await clickButton(text('welcome.fresh'));
  await waitFor(() => !!document.querySelector('.app-shell'), 'Fresh diary should open.');
  const tracked = envelope().data.settings.trackedSymptoms;
  assert.ok(tracked.length >= 2, 'At least two symptoms should be available for shortcut navigation.');
  await navigate('/log');
  const date = todayISO();
  const openShortcut = async symptom => {
    await act(async () => {
      window.history.pushState({}, '', `/log?date=${date}&symptom=${symptom}`);
      window.dispatchEvent(new window.PopStateEvent('popstate'));
    });
    await waitFor(() => findButton(text(`tracking.symptom.${symptom}`))?.getAttribute('aria-pressed') === 'true', `Shortcut ${symptom} should be selected.`);
  };
  await openShortcut(tracked[0]);
  assert.equal(findButton(text(`tracking.symptom.${tracked[0]}`)).getAttribute('aria-pressed'), 'true');
  await openShortcut(tracked[1]);
  assert.equal(findButton(text(`tracking.symptom.${tracked[0]}`)).getAttribute('aria-pressed'), 'false', 'Changing only the shortcut query should reload the saved date before adding the new symptom.');
  assert.equal(findButton(text(`tracking.symptom.${tracked[1]}`)).getAttribute('aria-pressed'), 'true');
});

test('React UI: a complete dated log survives reload, opens from Calendar, and edits only that date', async () => {
  await startDemo({ adult: true });
  const date = addDays(todayISO(), -2);
  const neighborDate = addDays(date, -1);
  const neighborBefore = structuredClone(envelope().data.logs[neighborDate] || null);
  const symptomId = envelope().data.settings.trackedSymptoms[0];
  assert.ok(symptomId, 'At least one symptom should be enabled for tracking.');

  await navigate('/log');
  await inputValue(findControl(text('tracking.date')), date);
  await waitFor(() => new URLSearchParams(window.location.search).get('date') === date, 'The log date should update in the URL.');
  await clickButton(text('tracking.periodOn'));
  await clickButton(text('tracking.flow.heavy'));
  await click(findControl(text('tracking.padFrequent')));
  await click(findControl(text('tracking.largeClots')));
  await inputValue(findControl(text('tracking.painScale')), '6');
  await click(findControl(text('tracking.painDisrupts')));
  await clickButton(text(`tracking.symptom.${symptomId}`));
  await clickButton(text('tracking.intensity.moderate'));
  await clickButton(text('tracking.mood.good'));
  await clickButton(text('tracking.energy.high'));
  await inputValue(findControl(text('tracking.sleep')), '6');
  await inputValue(findControl(text('tracking.medicines')), 'Paracetamol');
  const originalNote = 'Pain started at lunch.\nI had a quiet evening.';
  await inputValue(findControl(text('tracking.privateNote')), originalNote);
  await clickButton(text('tracking.saveLog'));
  await waitFor(() => envelope()?.data?.logs?.[date]?.note === originalNote, 'The complete day should persist before reload.');
  const stored = envelope().data.logs[date];
  assert.deepEqual({ period: stored.period, flow: stored.flow, padFrequent: stored.padFrequent, largeClots: stored.largeClots, pain: stored.pain, painDisrupts: stored.painDisrupts, symptom: stored.symptoms.includes(symptomId), intensity: stored.symptomIntensity[symptomId], mood: stored.mood, energy: stored.energy, sleep: stored.sleep, medicines: stored.medicines, note: stored.note }, { period: true, flow: 'heavy', padFrequent: true, largeClots: true, pain: 6, painDisrupts: true, symptom: true, intensity: 2, mood: 'good', energy: 'high', sleep: 6, medicines: 'Paracetamol', note: originalNote });

  await remount();
  if (window.location.pathname !== '/log') await navigate('/log');
  assert.equal(findControl(text('tracking.date')).value, date);
  assert.ok(findButton(text('tracking.periodOn')).classList.contains('selected'));
  assert.ok(findButton(text('tracking.flow.heavy')).classList.contains('selected'));
  assert.equal(findControl(text('tracking.padFrequent')).checked, true);
  assert.equal(findControl(text('tracking.largeClots')).checked, true);
  assert.equal(findControl(text('tracking.painScale')).value, '6');
  assert.equal(findControl(text('tracking.painDisrupts')).checked, true);
  assert.equal(findButton(text(`tracking.symptom.${symptomId}`)).getAttribute('aria-pressed'), 'true');
  assert.ok(findButton(text('tracking.intensity.moderate')).classList.contains('selected'));
  assert.ok(findButton(text('tracking.mood.good')).classList.contains('selected'));
  assert.ok(findButton(text('tracking.energy.high')).classList.contains('selected'));
  assert.equal(findControl(text('tracking.sleep')).value, '6');
  assert.equal(findControl(text('tracking.medicines')).value, 'Paracetamol');
  assert.equal(findControl(text('tracking.privateNote')).value, originalNote);

  await navigate('/calendar');
  const monthTitle = () => document.querySelector('.tracking-calendar-toolbar h2').textContent;
  const shownMonth = monthTitle();
  const [year, month] = date.split('-').map(Number);
  const previousMonth = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, month - 2, 1, 12));
  await clickButton(text('tracking.previousMonth'));
  assert.equal(monthTitle(), previousMonth, 'Previous month should render its own month grid.');
  await clickButton(text('tracking.nextMonth'));
  assert.equal(monthTitle(), shownMonth, 'Next month should restore the current month.');
  await clickButton(text('tracking.today'));
  assert.equal(monthTitle(), shownMonth, 'Today should return the calendar to the current month.');
  const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  const dayButton = [...document.querySelectorAll('.tracking-calendar-day')].find(button => button.getAttribute('aria-label')?.startsWith(dateLabel));
  assert.ok(dayButton, 'The logged date should have a selectable calendar cell.');
  await click(dayButton);
  await waitFor(() => window.location.pathname === '/log' && new URLSearchParams(window.location.search).get('date') === date, 'Calendar selection should open that exact dated log.');
  assert.equal(findControl(text('tracking.date')).value, date);
  assert.equal(findControl(text('tracking.privateNote')).value, originalNote);
  const editedNote = 'Edited from Calendar: saved to this date.';
  await inputValue(findControl(text('tracking.privateNote')), editedNote);
  await clickButton(text('tracking.saveLog'));
  await waitFor(() => envelope()?.data?.logs?.[date]?.note === editedNote, 'The edited calendar date should save.');
  assert.deepEqual(envelope().data.logs[neighborDate] || null, neighborBefore, 'Editing one date must not overwrite its neighbor.');
});

test('React UI: regular adult history shows cautious fertile estimates and marks estimated days in the calendar', async () => {
  await startDemo({ adult: true });
  const wrapper = envelope();
  const state = wrapper.data;
  const today = todayISO();
  const template = { date: today, period: false, flow: 'medium', padFrequent: false, largeClots: false, pain: 0, painDisrupts: false, painUnrelieved: false, symptoms: [], symptomIntensity: {}, mood: 'okay', energy: 'okay', sleep: 8, medicines: '', note: '', betweenBleeding: false, afterSexBleeding: false, pregnancyPossible: false, urgentPain: false, fainting: false };
  state.profile.ageGroup = 'adult';
  state.profile.fertilityEnabled = true;
  state.profile.pregnancyEnabled = false;
  state.profile.pregnancyConfirmed = false;
  state.logs = {};
  for (let index = 4; index >= 0; index--) {
    const start = addDays(today, -28 * index);
    const periodLength = index === 0 ? 1 : 5;
    for (let day = 0; day < periodLength; day++) {
      const date = addDays(start, day);
      state.logs[date] = { ...template, date, period: true };
    }
  }
  state.logs[today].symptoms = ['cramps'];
  const predictedDate = analyzeCycles(state.logs, { ...state.profile, trackedSymptoms: state.settings.trackedSymptoms, today }).prediction.from;
  state.logs[predictedDate] = { ...template, date: predictedDate, symptoms: ['cramps'] };
  localStorage.setItem('saheli.v1', JSON.stringify(wrapper));
  await remount();
  await waitFor(() => !!document.querySelector('.tracking-fertility'), 'Regular adult cycles should expose the opt-in fertility estimate card.');
  assert.ok(bodyText().includes(text('tracking.ovulationEstimate')));
  assert.ok(bodyText().includes(text('tracking.fertileEstimate')));
  assert.ok(bodyText().includes(text('tracking.notContraception')));
  await navigate('/calendar');
  const fertileDays = [...document.querySelectorAll('.tracking-calendar-day.fertile')];
  assert.ok(fertileDays.length > 0, 'The predicted fertile range should be visibly marked in the current calendar.');
  assert.ok(fertileDays.some(day => day.getAttribute('aria-label')?.includes(text('tracking.fertileDay'))), 'Fertile markers need an accessible text label.');
  assert.ok(fertileDays.some(day => day.querySelector('.tracking-calendar-marker.fertile')), 'Eligible fertile days need their own visible marker, including when another state overlaps.');
  const todayCell = document.querySelector('.tracking-calendar-day[aria-current="date"]');
  assert.ok(todayCell.classList.contains('logged'));
  assert.ok(todayCell.querySelector('.tracking-calendar-marker.logged'), 'Logged period days need a visible droplet marker.');
  assert.ok(todayCell.querySelector('.tracking-calendar-marker.symptom'), 'Symptom days need a separate visible marker even when logged as period days.');
  assert.ok(todayCell.getAttribute('aria-label').includes(text('tracking.loggedPeriod')));
  assert.ok(todayCell.getAttribute('aria-label').includes(text('tracking.symptomCount').replace('{count}', '1')));
  if (predictedDate.slice(0, 7) !== today.slice(0, 7)) await clickButton(text('tracking.nextMonth'));
  const predictedCell = [...document.querySelectorAll('.tracking-calendar-day')].find(day => day.getAttribute('aria-label')?.startsWith(new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${predictedDate}T12:00:00`))));
  assert.ok(predictedCell, 'The estimated date should appear in its month.');
  assert.ok(predictedCell.querySelector('.tracking-calendar-marker.predicted'), 'Predicted days need their own visible marker.');
  assert.ok(predictedCell.querySelector('.tracking-calendar-marker.symptom'), 'Predicted and symptom markers must both remain visible.');
  assert.ok(predictedCell.getAttribute('aria-label').includes(text('tracking.predictedDay')));
  assert.ok(predictedCell.getAttribute('aria-label').includes(text('tracking.symptomCount').replace('{count}', '1')));
});

test('React UI: a custom weekly reminder saves selected weekdays and stays opt-in', async () => {
  await startDemo();
  await navigate('/reminders');
  await inputValue(findControl(text('reminders.label')), 'Weekly diary walk');
  const scheduleLabel = [...document.querySelectorAll('.reminder-add label')].find(label => normalize(label.querySelector('span')?.textContent) === normalize(text('reminders.repeat')));
  await inputValue(scheduleLabel?.querySelector('select'), 'weekly');
  await waitFor(() => !!document.querySelector('.reminder-add .reminder-weekdays'), 'Weekly mode should ask which days to use.');
  await click(findControl(text('reminders.weekday.fri')));
  await clickButton(text('reminders.add'));
  await waitFor(() => envelope()?.data?.reminders?.some(item => item.title === 'Weekly diary walk'), 'The weekly reminder should save.');
  const saved = envelope().data.reminders.find(item => item.title === 'Weekly diary walk');
  assert.deepEqual(saved.recurrence, { frequency: 'weekly', weekdays: [1, 2, 3, 4] });
  assert.equal(saved.enabled, false, 'New personal reminders must remain off until the user enables them.');
});

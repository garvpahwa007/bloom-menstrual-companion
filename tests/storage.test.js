import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createDemoData } from '../src/data/demo.js';
import CONFIG from '../src/config.js';
import { STORAGE_KEY, disablePIN, readEnvelope, saveState, enablePIN, unlockPIN, validateState, exportJSON, exportCSV, exportEncryptedBackup, importEncryptedBackup, importText, deleteEverything } from '../src/lib/storage.js';

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
    clear() { values.clear(); },
  };
}
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
globalThis.localStorage = memoryStorage();
globalThis.sessionStorage = memoryStorage();

const sample = () => {
  const state = createDemoData('2026-10-22');
  state.logs['2026-10-22'].note = 'PRIVATE_NOTE_MARKER: "quiet, please"\nA second line, with a comma.\r\nHindi: मेरी निजी बात';
  state.logs['2026-10-22'].medicines = 'Recorded only, no dose advice';
  return state;
};
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); delete globalThis.caches; delete globalThis.indexedDB; });

test('plaintext state uses exactly one envelope and round-trips unchanged', async () => {
  const state = sample();
  await saveState(state);
  assert.equal(localStorage.length, 1);
  assert.equal(localStorage.key(0), STORAGE_KEY);
  const envelope = readEnvelope();
  assert.equal(envelope.encrypted, false);
  assert.deepEqual(envelope.data, state);
});

test('enabling a PIN replaces plaintext, leaves no duplicate, and stores no PIN or private text', async () => {
  const state = sample();
  await saveState(state);
  await enablePIN(state, '0042');
  assert.equal(localStorage.length, 1);
  assert.equal(sessionStorage.length, 0);
  const raw = localStorage.getItem(STORAGE_KEY);
  const envelope = readEnvelope();
  assert.equal(envelope.encrypted, true);
  assert.deepEqual(Object.keys(envelope).sort(), ['version', 'encrypted', 'kdf', 'iterations', 'salt', 'iv', 'ciphertext'].sort());
  assert.equal(Object.values(envelope).some(value => value === '0042'), false);
  assert.equal(raw.includes('PRIVATE_NOTE_MARKER'), false);
  assert.equal(raw.includes('trackedSymptoms'), false);
  assert.equal(Object.hasOwn(envelope, 'data'), false);
  assert.equal(Object.hasOwn(envelope, 'pin'), false);
  assert.equal(envelope.kdf, 'PBKDF2-SHA256');
  assert.equal(envelope.iterations >= 300000, true);
  assert.equal(atob(envelope.salt).length, 16);
  assert.equal(atob(envelope.iv).length, 12);
});

test('an incorrect PIN rejects without changing or wiping stored data', async () => {
  await enablePIN(sample(), '2468');
  const original = localStorage.getItem(STORAGE_KEY);
  await assert.rejects(unlockPIN('1357'), { message: 'wrongPin' });
  assert.equal(localStorage.getItem(STORAGE_KEY), original);
  assert.equal(localStorage.length, 1);
  assert.deepEqual((await unlockPIN('2468')).state, sample());
});

test('a fresh module after reload unlocks the same state without a persisted key', async () => {
  const state = sample();
  await enablePIN(state, '4826');
  const reloadedStorage = await import(`../src/lib/storage.js?reload=${Date.now()}`);
  const unlocked = await reloadedStorage.unlockPIN('4826');
  assert.deepEqual(unlocked.state, state);
  assert.equal(unlocked.vault.key.extractable, false);
  assert.deepEqual([...unlocked.vault.key.usages].sort(), ['decrypt', 'encrypt']);
});

test('each encrypted save has a fresh IV and serialized concurrent writes preserve the newest snapshot', async () => {
  const state = sample();
  const vault = await enablePIN(state, '9876');
  const first = readEnvelope();
  state.logs['2026-10-22'].note = 'Second private snapshot';
  const secondSave = saveState(state, vault);
  state.logs['2026-10-22'].note = 'Newest private snapshot';
  const thirdSave = saveState(state, vault);
  await Promise.all([secondSave, thirdSave]);
  const third = readEnvelope();
  assert.notEqual(first.iv, third.iv);
  assert.equal(first.salt, third.salt);
  assert.notEqual(first.ciphertext, third.ciphertext);
  assert.equal((await unlockPIN('9876')).state.logs['2026-10-22'].note, 'Newest private snapshot');
  await saveState(state, vault);
  assert.notEqual(readEnvelope().iv, third.iv);
});

test('setting PIN again generates a new random salt', async () => {
  await enablePIN(sample(), '1234');
  const firstSalt = readEnvelope().salt;
  await enablePIN(sample(), '1234');
  assert.notEqual(readEnvelope().salt, firstSalt);
});

test('a malformed PIN is rejected without changing storage', async () => {
  await saveState(sample());
  const original = localStorage.getItem(STORAGE_KEY);
  for (const pin of ['12', 'abc4', '12345', '12 4']) await assert.rejects(enablePIN(sample(), pin), { message: 'pinFormat' });
  assert.equal(localStorage.getItem(STORAGE_KEY), original);
});

test('ciphertext tampering is rejected and does not destroy the encrypted backup', async () => {
  await enablePIN(sample(), '2468');
  const envelope = readEnvelope();
  const bytes = Uint8Array.from(atob(envelope.ciphertext), character => character.charCodeAt(0));
  bytes[Math.floor(bytes.length / 2)] ^= 1;
  envelope.ciphertext = btoa(String.fromCharCode(...bytes));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  const tampered = localStorage.getItem(STORAGE_KEY);
  await assert.rejects(unlockPIN('2468'), { message: 'wrongPin' });
  assert.equal(localStorage.getItem(STORAGE_KEY), tampered);
});

test('JSON backup restores all profile, settings, reminders, and private-note data', () => {
  const state = sample();
  state.logs['2026-10-22'].symptoms = ['cramps', 'headache'];
  state.logs['2026-10-22'].symptomIntensity = { cramps: 1, headache: 3 };
  state.reminders.push({ id: 'medicine-1', enabled: false, type: 'medicine', time: '18:30', title: 'Evening check-in', date: '2026-10-22', recurrence: { frequency: 'once' } });
  assert.deepEqual(importText(exportJSON(state)), state);
});

test('CSV backup is lossless for commas, newlines, quotes, Unicode, and metadata', () => {
  const state = sample();
  state.settings.discreet = true;
  state.dismissals = { disruptivePain: 'disruptivePain:2026-10-01' };
  state.logs['2026-10-22'].symptoms = ['headache'];
  state.logs['2026-10-22'].symptomIntensity = { headache: 2 };
  state.reminders = [{ id: 'custom', enabled: false, type: 'custom', time: '09:15', title: 'Water, rest, and a "pause"\nToday', date: '2026-10-20', recurrence: { frequency: 'weekly', weekdays: [1, 3, 5] } }];
  const backup = exportCSV(state);
  assert.match(backup, /^"record_type","date"/);
  assert.match(backup, /\r\n/);
  assert.deepEqual(importText(backup), state);
  assert.deepEqual(importText(`\uFEFF${backup}`), state);
});

test('encrypted backup round-trips complete Unicode/private state without exposing plaintext and uses fresh randomness', async () => {
  const state = sample();
  state.logs['2026-10-22'].symptoms = ['cramps', 'headache'];
  state.logs['2026-10-22'].symptomIntensity = { cramps: 1, headache: 3 };
  const password = 'a-long and unique backup phrase!';
  const firstText = await exportEncryptedBackup(state, password);
  const secondText = await exportEncryptedBackup(state, password);
  const first = JSON.parse(firstText); const second = JSON.parse(secondText);
  assert.equal(first.format, 'bloom-encrypted-backup');
  assert.equal(first.version, 1);
  assert.equal(first.cipher, 'AES-GCM-256');
  assert.equal(first.kdf, 'PBKDF2-SHA256');
  assert.equal(first.iterations, CONFIG.pbkdf2Iterations);
  assert.equal(atob(first.salt).length, CONFIG.encryptionSaltBytes);
  assert.equal(atob(first.iv).length, CONFIG.encryptionIvBytes);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.iv, second.iv);
  assert.equal(firstText.includes('PRIVATE_NOTE_MARKER'), false);
  assert.equal(firstText.includes('trackedSymptoms'), false);
  assert.equal(JSON.stringify(await importEncryptedBackup(firstText, password)), JSON.stringify(state));
});

test('encrypted backup wrong passphrase and damaged or extreme wrapper inputs never touch local diary storage', async () => {
  const state = sample(); await saveState(state);
  const original = localStorage.getItem(STORAGE_KEY);
  const text = await exportEncryptedBackup(state, 'another unique backup passphrase');
  await assert.rejects(importEncryptedBackup(text, 'incorrect unique phrase'), { message: 'backupPassphraseWrong' });
  const wrapper = JSON.parse(text); wrapper.ciphertext = `${wrapper.ciphertext.slice(0, -4)}AAAA`;
  await assert.rejects(importEncryptedBackup(JSON.stringify(wrapper), 'another unique backup passphrase'));
  const unsupported = JSON.parse(text); unsupported.iterations = 999999999;
  await assert.rejects(importEncryptedBackup(JSON.stringify(unsupported), 'another unique backup passphrase'), { message: 'backupUnsupported' });
  for (const invalid of ['{', JSON.stringify({ format: 'bloom-encrypted-backup', version: 7 })]) await assert.rejects(importEncryptedBackup(invalid, 'another unique backup passphrase'));
  await assert.rejects(exportEncryptedBackup(state, 'short'));
  assert.equal(localStorage.getItem(STORAGE_KEY), original);
});

test('invalid backup formats, versions, dates, and required fields are rejected', () => {
  const state = sample();
  const invalid = [
    '',
    'not a backup',
    '{not-json}',
    JSON.stringify({ ...state, version: 2 }),
    JSON.stringify({ ...state, logs: [] }),
    JSON.stringify({ ...state, profile: null }),
    JSON.stringify({ ...state, settings: { language: 'xx' } }),
    JSON.stringify({ ...state, profile: { ageGroup: 'unknown' } }),
    JSON.stringify({ ...state, reminders: {} }),
    JSON.stringify({ ...state, logs: { '2026-02-30': { symptoms: [] } } }),
    JSON.stringify({ ...state, logs: { '10/22/2026': { symptoms: [] } } }),
    JSON.stringify({ ...state, logs: { '2026-10-22': { symptoms: 'cramps' } } }),
    '"record_type","date"\r\n"day","2026-10-22"',
    '"record_type","date"\r\n"metadata","unterminated',
  ];
  for (const input of invalid) assert.throws(() => importText(input));
  assert.deepEqual(validateState(state), state);
});

test('delete waits for pending saves and clears localStorage and sessionStorage completely', async () => {
  localStorage.setItem('unrelated-on-this-origin', 'value');
  sessionStorage.setItem('temporary', 'private');
  const vault = await enablePIN(sample(), '2746');
  const write = saveState(sample(), vault);
  await deleteEverything();
  await write;
  assert.equal(localStorage.length, 0);
  assert.equal(sessionStorage.length, 0);
  assert.equal(readEnvelope(), null);
});

test('delete removes Bloom-owned caches and IndexedDB databases without deleting unrelated origin caches', async () => {
  const cached = new Set(['bloom-app-shell-old', 'saheli-v1', 'other-app-cache']);
  const databases = new Set(['saheli', 'legacy']);
  globalThis.caches = {
    keys: async () => [...cached],
    delete: async key => cached.delete(key),
  };
  globalThis.indexedDB = {
    databases: async () => [...databases].map(name => ({ name })),
    deleteDatabase: name => {
      const request = {};
      queueMicrotask(() => { databases.delete(name); request.onsuccess?.(); });
      return request;
    },
  };
  await saveState(sample());
  await deleteEverything();
  assert.deepEqual([...cached], ['saheli-v1', 'other-app-cache']);
  assert.equal(databases.size, 0);
  assert.equal(localStorage.length, 0);
});


test('nested backup values reject unsafe types, enums, ranges, and inconsistent dates', () => {
  const mutations = [
    state => { state.logs = null; },
    state => { state.logs['2026-10-22'].note = { text: 'Object notes are unsafe to render' }; },
    state => { state.logs['2026-10-22'].medicines = 123; },
    state => { state.logs['2026-10-22'].pain = 11; },
    state => { state.logs['2026-10-22'].pain = -1; },
    state => { state.logs['2026-10-22'].pain = '8'; },
    state => { state.logs['2026-10-22'].sleep = 25; },
    state => { state.logs['2026-10-22'].flow = 'flood'; },
    state => { state.logs['2026-10-22'].mood = 'unknown'; },
    state => { state.logs['2026-10-22'].energy = 'infinite'; },
    state => { state.logs['2026-10-22'].period = 'true'; },
    state => { state.logs['2026-10-22'].symptoms = [{ id: 'cramps' }]; },
    state => { state.logs['2026-10-22'].symptoms = ['headache']; state.logs['2026-10-22'].symptomIntensity = { cramps: 2 }; },
    state => { state.logs['2026-10-22'].symptoms = ['headache']; state.logs['2026-10-22'].symptomIntensity = { headache: 0 }; },
    state => { state.logs['2026-10-22'].symptoms = ['headache']; state.logs['2026-10-22'].symptomIntensity = { headache: 1.5 }; },
    state => { state.logs['2026-10-22'].symptomIntensity = []; },
    state => { state.logs['2026-10-22'].date = '2026-10-21'; },
    state => { state.settings.trackedSymptoms = 'cramps'; },
    state => { state.settings.trackedSymptoms = [null]; },
    state => { state.settings.highContrast = 'false'; },
    state => { state.settings.textSize = 'huge'; },
    state => { state.profile.pregnancyEnabled = 'false'; },
    state => { state.profile.lastPeriodDate = '2026-02-30'; },
    state => { state.profile.pregnancyEnabled = true; state.profile.pregnancyConfirmed = false; state.profile.lastPeriodDate = '2026-09-01'; },
    state => { state.reminders = [null]; },
    state => { state.reminders = [{ id: 'one', type: 'custom', enabled: true, time: '24:00' }]; },
    state => { state.reminders = [{ id: 'one', type: 'unknown', enabled: true, time: '12:00' }]; },
    state => { state.reminders = [{ id: 1, type: 'daily', enabled: true, time: '12:00' }]; },
    state => { state.reminders = [{ id: 'one', type: 'custom', enabled: true, time: '12:00', title: {} }]; },
    state => { state.reminders = [{ id: 'one', type: 'custom', enabled: true, time: '12:00', recurrence: { frequency: 'once' } }]; },
    state => { state.reminders = [{ id: 'one', type: 'custom', enabled: true, time: '12:00', recurrence: { frequency: 'weekly', weekdays: [] } }]; },
    state => { state.reminders = [{ id: 'one', type: 'medicine', enabled: true, time: '12:00', recurrence: { frequency: 'weekly', weekdays: [1, 1] } }]; },
    state => { state.reminders = [{ id: 'one', type: 'daily', enabled: true, time: '12:00', recurrence: { frequency: 'daily' } }]; },
    state => { state.dismissals = null; },
    state => { state.dismissals = { disruptivePain: { signature: 'bad' } }; },
  ];
  for (const mutate of mutations) {
    const state = sample(); mutate(state);
    assert.throws(() => importText(JSON.stringify(state)), { message: 'invalidImport' });
  }
});

test('import rejects non-text and oversized backups using byte length, not character count', () => {
  assert.throws(() => importText(null), { message: 'invalidImport' });
  assert.throws(() => importText(new Uint8Array([1, 2])), { message: 'invalidImport' });
  assert.throws(() => importText('x'.repeat(CONFIG.maximumImportBytes + 1)), { message: 'invalidImport' });
  const multibyte = 'म'.repeat(Math.ceil(CONFIG.maximumImportBytes / 3) + 1);
  assert.ok(multibyte.length < CONFIG.maximumImportBytes);
  assert.throws(() => importText(multibyte), { message: 'invalidImport' });
});

test('CSV rejects prototype keys without mutating the object prototype', () => {
  const csv = exportCSV(sample());
  const malicious = csv.replace('"day","2026-10-22"', '"day","__proto__"');
  assert.notEqual(csv, malicious);
  assert.throws(() => importText(malicious), { message: 'invalidImport' });
  assert.equal(Object.prototype.polluted, undefined);
});


test('an older plaintext tab cannot remove another tab PIN protection', async () => {
 const state=sample(); await saveState(state); await enablePIN(state,'1234'); const raw=localStorage.getItem(STORAGE_KEY);
 await assert.rejects(saveState(state), {message:'storageChanged'}); assert.equal(localStorage.getItem(STORAGE_KEY),raw);
});
test('large encrypted backups round trip without an argument-limit failure', async () => {
 const state=sample(); for(const date of Object.keys(state.logs).slice(0,30)) state.logs[date].note='निजी '.repeat(1000);
 validateState(state); await enablePIN(state,'1234'); assert.deepEqual((await unlockPIN('1234')).state,state);
});
test('PIN removal needs the current authenticated vault', async () => {
 const state=sample(); const vault=await enablePIN(state,'1234'); await assert.rejects(disablePIN(state,null));
 await disablePIN(state,vault); assert.equal(readEnvelope().encrypted,false); assert.deepEqual(readEnvelope().data,state);
});
test('a stale encrypted tab cannot overwrite a newer save', async () => {
 const state=sample(); const first=await enablePIN(state,'1234'); const second=(await unlockPIN('1234')).vault;
 await saveState(state,first); const raw=localStorage.getItem(STORAGE_KEY);
 await assert.rejects(saveState(state,second),{message:'storageChanged'}); assert.equal(localStorage.getItem(STORAGE_KEY),raw);
});

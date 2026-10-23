import CONFIG from '../config.js';
import { todayISO } from './dates.js';
export const STORAGE_KEY = 'saheli.v1';
const ITERATIONS = CONFIG.pbkdf2Iterations;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const to64 = bytes => { const data = new Uint8Array(bytes); let binary = ''; for (let i = 0; i < data.length; i += 8192) binary += String.fromCharCode(...data.subarray(i, i + 8192)); return btoa(binary); };
const from64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));

export function readEnvelope() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const envelope = JSON.parse(raw);
  if (envelope.version !== 1) throw new Error('storageVersion');
  return envelope;
}

async function deriveKey(pin, salt) {
  if (!new RegExp(`^[0-9]{${CONFIG.pinLength}}$`).test(pin)) throw new Error('pinFormat');
  if (!globalThis.crypto?.subtle) throw new Error('secureContext');
  const material = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

let pendingWrite = Promise.resolve();
export function saveState(state, vault = null, { previousVault = null } = {}) {
  const snapshot = JSON.stringify(state);
  const task = pendingWrite.catch(() => {}).then(async () => {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const current = currentRaw ? JSON.parse(currentRaw) : null;
    const authority = previousVault || vault;
    if (current?.encrypted) {
      if (!authority || to64(authority.salt) !== current.salt || (authority.raw && authority.raw !== currentRaw)) throw new Error('storageChanged');
      if (!vault || previousVault) await crypto.subtle.decrypt({ name: 'AES-GCM', iv: from64(current.iv) }, authority.key, from64(current.ciphertext));
    } else if (vault?.raw) throw new Error('storageChanged');
    let envelope;
    if (vault) {
      const iv = crypto.getRandomValues(new Uint8Array(CONFIG.encryptionIvBytes));
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, vault.key, encoder.encode(snapshot));
      envelope = { version: 1, encrypted: true, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: to64(vault.salt), iv: to64(iv), ciphertext: to64(ciphertext) };
    } else envelope = { version: 1, encrypted: false, data: JSON.parse(snapshot) };
    if (localStorage.getItem(STORAGE_KEY) !== currentRaw) throw new Error('storageChanged');
    const raw = JSON.stringify(envelope);
    localStorage.setItem(STORAGE_KEY, raw);
    if (vault) vault.raw = raw;
  });
  pendingWrite = task;
  return task;
}

export async function disablePIN(state, vault) { if (!vault) throw new Error('storageChanged'); await saveState(state, null, { previousVault: vault }); }

export async function enablePIN(state, pin) {
  const previousVault = readEnvelope()?.encrypted ? (await unlockPIN(pin)).vault : null;
  const salt = crypto.getRandomValues(new Uint8Array(CONFIG.encryptionSaltBytes));
  const key = await deriveKey(pin, salt);
  const vault = { key, salt };
  await saveState(state, vault, { previousVault });
  return vault;
}

export async function unlockPIN(pin) {
  const envelope = readEnvelope();
  if (!envelope?.encrypted) throw new Error('notEncrypted');
  try {
    const salt = from64(envelope.salt);
    const key = await deriveKey(pin, salt);
    const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: from64(envelope.iv) }, key, from64(envelope.ciphertext));
    return { state: validateState(JSON.parse(decoder.decode(bytes))), vault: { key, salt, raw: localStorage.getItem(STORAGE_KEY) } };
  } catch (error) {
    if (error.message === 'secureContext' || error.message === 'pinFormat') throw error;
    throw new Error('wrongPin');
  }
}

export function validateState(input) {
  const invalid = () => { throw new Error('invalidImport'); };
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const validDate = date => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const [y, m, d] = date.split('-').map(Number); const check = new Date(y, m - 1, d, 12);
    return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d;
  };
  if (!object(input) || input.version !== 1 || !object(input.logs) || !object(input.profile) || !object(input.settings) || !Array.isArray(input.reminders)) invalid();
  if (!['en', 'hi'].includes(input.settings.language) || !['adult', 'under18'].includes(input.profile.ageGroup)) throw new Error('invalidImport');
  for (const key of ['pregnancyEnabled', 'pregnancyConfirmed', 'fertilityEnabled', 'pregnancyFeatureEnabled']) if (key in input.profile && typeof input.profile[key] !== 'boolean') invalid();
  if (input.profile.lastPeriodDate && !validDate(input.profile.lastPeriodDate)) invalid();
  if (input.profile.pregnancyEnabled && (!input.profile.pregnancyConfirmed || !validDate(input.profile.lastPeriodDate) || input.profile.lastPeriodDate > todayISO())) invalid();
  for (const key of ['highContrast', 'readAloud', 'discreet']) if (typeof input.settings[key] !== 'boolean') invalid();
  if (!['normal', 'large', 'largest'].includes(input.settings.textSize)) invalid();
  if (!Array.isArray(input.settings.trackedSymptoms) || input.settings.trackedSymptoms.some(id => typeof id !== 'string' || id.length > 80)) invalid();
  for (const [date, log] of Object.entries(input.logs)) {
    if (!validDate(date) || !object(log) || !Array.isArray(log.symptoms)) invalid();
    if (log.date !== undefined && log.date !== date) invalid();
    if (log.symptoms.some(id => typeof id !== 'string' || id.length > 80)) invalid();
    if ('symptomIntensity' in log) {
      if (!object(log.symptomIntensity)) invalid();
      for (const [id, value] of Object.entries(log.symptomIntensity)) {
        if (id.length > 80 || !log.symptoms.includes(id) || !Number.isInteger(value) || value < 1 || value > 3) invalid();
      }
    }
    for (const key of ['note', 'medicines']) if (key in log && (typeof log[key] !== 'string' || log[key].length > 10000)) invalid();
    for (const key of ['period', 'padFrequent', 'largeClots', 'painDisrupts', 'painUnrelieved', 'betweenBleeding', 'afterSexBleeding', 'pregnancyPossible', 'urgentPain', 'fainting', 'confirmedGap']) if (key in log && typeof log[key] !== 'boolean') invalid();
    if ('pain' in log && (!Number.isFinite(log.pain) || log.pain < 0 || log.pain > CONFIG.painScaleMaximum)) invalid();
    if ('sleep' in log && (!Number.isFinite(log.sleep) || log.sleep < 0 || log.sleep > CONFIG.maximumSleepHours)) invalid();
    if ('flow' in log && !['spotting', 'light', 'medium', 'heavy'].includes(log.flow)) invalid();
    if ('mood' in log && !['veryLow', 'low', 'okay', 'good', 'great'].includes(log.mood)) invalid();
    if ('energy' in log && !['low', 'okay', 'high'].includes(log.energy)) invalid();
  }
  for (const reminder of input.reminders) {
    if (!object(reminder) || typeof reminder.id !== 'string' || !['daily', 'period', 'medicine', 'custom', 'checkup'].includes(reminder.type) || typeof reminder.enabled !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder.time) || (reminder.title !== undefined && typeof reminder.title !== 'string') || (reminder.date && !validDate(reminder.date))) invalid();
    if ('recurrence' in reminder) {
      const recurrence = reminder.recurrence;
      if (!object(recurrence) || !['once', 'daily', 'weekly'].includes(recurrence.frequency) || !['custom', 'medicine'].includes(reminder.type)) invalid();
      if (recurrence.frequency === 'once' && !validDate(reminder.date)) invalid();
      if (recurrence.frequency === 'weekly' && (!Array.isArray(recurrence.weekdays) || !recurrence.weekdays.length || recurrence.weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(recurrence.weekdays).size !== recurrence.weekdays.length)) invalid();
      if (recurrence.frequency !== 'weekly' && 'weekdays' in recurrence) invalid();
    }
  }
  if (input.dismissals !== undefined && (!object(input.dismissals) || Object.values(input.dismissals).some(value => typeof value !== 'string' && value !== true))) invalid();
  return { ...input, logs: { ...input.logs }, dismissals: input.dismissals || {} };
}

export async function deleteEverything() {
  await pendingWrite.catch(() => {});
  localStorage.clear();
  sessionStorage.clear();
  if (globalThis.caches) await Promise.all((await caches.keys()).map(key => caches.delete(key)));
  if (globalThis.indexedDB?.databases) {
    const databases = await indexedDB.databases();
    await Promise.all(databases.filter(db => db.name).map(db => new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(db.name);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('databaseBlocked'));
    })));
  }
}

export function exportJSON(state) { return JSON.stringify(state, null, 2); }
const quoteCSV = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
export function exportCSV(state) {
  const { logs, ...meta } = state;
  const rows = [['record_type', 'date', 'flow', 'pain', 'mood', 'symptoms', 'data_json'], ['metadata', '', '', '', '', '', JSON.stringify(meta)]];
  for (const [date, log] of Object.entries(logs).sort(([a], [b]) => a.localeCompare(b))) rows.push(['day', date, log.flow, log.pain, log.mood, log.symptoms.join(';'), JSON.stringify(log)]);
  return rows.map(row => row.map(quoteCSV).join(',')).join('\r\n');
}

function parseCSV(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(value); rows.push(row); row = []; value = ''; }
    else value += c;
  }
  if (quoted) throw new Error('invalidImport');
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}
export function importText(text) {
  if (typeof text !== 'string' || encoder.encode(text).length > CONFIG.maximumImportBytes) throw new Error('invalidImport');
  if (text.trimStart().startsWith('{')) return validateState(JSON.parse(text));
  const rows = parseCSV(text.replace(/^\uFEFF/, ''));
  if (rows[0]?.[0] !== 'record_type') throw new Error('invalidImport');
  const meta = rows.find(row => row[0] === 'metadata');
  if (!meta) throw new Error('invalidImport');
  const state = JSON.parse(meta[6]); state.logs = Object.create(null);
  for (const row of rows.filter(row => row[0] === 'day')) state.logs[row[1]] = JSON.parse(row[6]);
  return validateState(state);
}

export function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

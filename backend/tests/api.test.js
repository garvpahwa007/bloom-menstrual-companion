import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { withTestDatabase } from '../scripts/test-database.mjs';
import { createDemoData } from '../../frontend/src/data/demo.js';
import { exportEncryptedBackup, importEncryptedBackup } from '../../frontend/src/services/storage.service.js';

const config = { isProduction: false, sessionDays: 7, allowedOrigins: ['http://localhost:5173'], authLimit: 1000 };
const password = 'Synthetic-account-password-123';
const passphrase = 'Synthetic-backup-passphrase-456';

async function serve(connection, overrides = {}) {
  const app = await createApp({ config: { ...config, ...overrides }, connection, serveFrontend: false });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { app, server, base: `http://127.0.0.1:${server.address().port}/api/v1` };
}

function client(base) {
  let cookie = '';
  let csrf = '';
  const request = async (path, { method = 'GET', body, rawBody, headers = {}, skipCsrf = false } = {}) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body !== undefined || rawBody !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(!skipCsrf && csrf ? { 'X-CSRF-Token': csrf } : {}),
        ...headers,
      },
      body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await response.text();
    let json;
    try { json = JSON.parse(text); } catch { throw new Error(`Expected JSON for ${method} ${path}, got ${response.status}: ${text.slice(0, 100)}`); }
    if (json.data?.csrfToken) csrf = json.data.csrfToken;
    return { response, status: response.status, json, text, setCookie };
  };
  return { request, get cookie() { return cookie; }, get csrf() { return csrf; } };
}

async function account(base) {
  const api = client(base);
  const username = `test_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
  const registration = await api.request('/auth/register', { method: 'POST', body: { username, password } });
  assert.equal(registration.status, 201, registration.text);
  return { ...api, request: api.request, username, id: registration.json.data.user.id, registration, api };
}

test('Express API against a disposable real MongoDB', { timeout: 180_000 }, async t => {
  await withTestDatabase(async connection => {
    const { app, server, base } = await serve(connection);
    try {
      await t.test('health and security headers, safe JSON errors and body limits', async () => {
        const api = client(base);
        const health = await api.request('/health');
        assert.equal(health.status, 200);
        assert.equal(health.json.data.status, 'ok');
        assert.equal(health.json.data.database, 'connected');
        assert.match(health.response.headers.get('cache-control'), /no-store/);
        assert.equal(health.response.headers.get('x-content-type-options'), 'nosniff');
        const unknown = await api.request('/does-not-exist');
        assert.equal(unknown.status, 404);
        assert.equal(typeof unknown.json.error.code, 'string');
        assert.equal(unknown.json.error.stack, undefined);
        const malformed = await api.request('/auth/login', { method: 'POST', rawBody: '{"password":"SENSITIVE_TEST_MARKER",' });
        assert.equal(malformed.status, 400);
        assert.equal(malformed.json.error.code, 'BODY_INVALID');
        assert.doesNotMatch(malformed.text, /SENSITIVE_TEST_MARKER|SyntaxError|stack/);
        const oversized = await api.request('/auth/login', { method: 'POST', body: { username: 'large_body', password: 'x'.repeat(7_200_000) } });
        assert.equal(oversized.status, 413);
        assert.equal(oversized.json.error.code, 'PAYLOAD_TOO_LARGE');
      });

      await t.test('strict account validation, generic login failure and cookie session', async () => {
        const anonymous = client(base);
        for (const body of [
          { username: 'aa', password },
          { username: 'valid_alias', password: 'short' },
          { username: { $ne: null }, password },
          { username: 'valid_alias', password, email: 'not-collected@example.invalid' },
          { username: 'valid_alias', password, phone: '+910000000000' },
          { username: 'valid_alias', password, dateOfBirth: '2009-01-01' },
          { username: 'valid_alias', password, ageGroup: 'under18' },
        ]) {
          const invalid = await anonymous.request('/auth/register', { method: 'POST', body });
          assert.equal(invalid.status, 400, invalid.text);
          assert.equal(invalid.json.error.code, 'BODY_INVALID');
          assert.doesNotMatch(invalid.text, /not-collected|Synthetic-account/);
        }
        const user = await account(base);
        assert.match(user.registration.setCookie, /HttpOnly/i);
        assert.match(user.registration.setCookie, /SameSite=Strict/i);
        assert.match(user.registration.setCookie, /Path=\/api(?:;|$)/i);
        assert.equal(user.registration.json.data.password, undefined);
        assert.equal(user.registration.json.data.token, undefined);
        assert.equal(user.registration.json.data.user.username, user.username);
        const duplicate = await anonymous.request('/auth/register', { method: 'POST', body: { username: user.username, password } });
        assert.equal(duplicate.status, 409);
        assert.equal(duplicate.json.error.code, 'USERNAME_TAKEN');
        const missingUser = await anonymous.request('/auth/login', { method: 'POST', body: { username: 'never_registered_alias', password } });
        const wrongPassword = await anonymous.request('/auth/login', { method: 'POST', body: { username: user.username, password: 'Wrong-synthetic-password' } });
        assert.equal(missingUser.status, 401);
        assert.equal(wrongPassword.status, 401);
        assert.deepEqual(missingUser.json, wrongPassword.json);
        const session = await user.request('/auth/session');
        assert.equal(session.status, 200);
        assert.equal(session.json.data.user.id, user.id);
        assert.equal(session.json.data.csrfToken, user.registration.json.data.csrfToken);
        const stored = await app.locals.models.User.findById(user.id).select('+passwordHash +salt +passwordSalt').lean();
        assert.ok(stored.passwordHash);
        assert.notEqual(stored.passwordHash, password);
        assert.doesNotMatch(JSON.stringify(stored), new RegExp(password));
        const storedSession = await app.locals.models.Session.findOne({ userId: user.id }).select('+tokenHash').lean();
        const token = user.api.cookie.slice(user.api.cookie.indexOf('=') + 1);
        assert.equal(storedSession.tokenHash, createHash('sha256').update(token).digest('hex'));
        assert.doesNotMatch(JSON.stringify(storedSession), new RegExp(token));
      });

      await t.test('untrusted origins and absent or incorrect CSRF cannot mutate data', async () => {
        const user = await account(base);
        const missing = await user.request('/diary/backup', { method: 'DELETE', body: { expectedRevision: 0 }, skipCsrf: true });
        assert.equal(missing.status, 403);
        assert.equal(missing.json.error.code, 'CSRF_INVALID');
        const incorrect = await user.request('/diary/backup', { method: 'DELETE', body: { expectedRevision: 0 }, headers: { 'X-CSRF-Token': 'wrong-token' } });
        assert.equal(incorrect.status, 403);
        const crossOrigin = await user.request('/auth/logout', { method: 'POST', headers: { Origin: 'https://untrusted.example.invalid' } });
        assert.equal(crossOrigin.status, 403);
        assert.equal(crossOrigin.json.error.code, 'ORIGIN_FORBIDDEN');
        assert.equal((await user.request('/auth/session')).status, 200);
        const forbidden = await fetch(`${base}/auth/session`, { headers: { Origin: 'https://untrusted.example.invalid' } });
        assert.notEqual(forbidden.headers.get('access-control-allow-origin'), 'https://untrusted.example.invalid');
        const allowed = await fetch(`${base}/auth/session`, { headers: { Origin: 'http://localhost:5173' } });
        assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
        assert.equal(allowed.headers.get('access-control-allow-credentials'), 'true');
      });

      await t.test('only encrypted envelopes are accepted and round-trip decrypts in the client', async () => {
        const user = await account(base);
        const state = createDemoData('2026-10-25');
        state.logs['2026-10-25'].note = 'SYNTHETIC_PRIVATE_NOTE_NEVER_IN_MONGODB';
        const backup = JSON.parse(await exportEncryptedBackup(state, passphrase));
        const status = await user.request('/diary/status');
        assert.equal(status.json.data.hasBackup, false);
        assert.equal(status.json.data.revision, 0);
        assert.equal((await user.request('/diary/backup')).status, 404);
        const candidates = [
          { backup: state, expectedRevision: 0 },
          { backup: { ...backup, plaintext: state }, expectedRevision: 0 },
          { backup: { ...backup, salt: 'invalid' }, expectedRevision: 0 },
          { backup: { ...backup, iv: Buffer.alloc(4).toString('base64') }, expectedRevision: 0 },
          { backup: { ...backup, iterations: 2 }, expectedRevision: 0 },
          { backup, expectedRevision: { $ne: 0 } },
          { backup, expectedRevision: 0, userId: 'another-user' },
        ];
        for (const body of candidates) {
          const invalid = await user.request('/diary/backup', { method: 'PUT', body });
          assert.equal(invalid.status, 400, invalid.text);
          assert.equal(invalid.json.error.code, 'BODY_INVALID');
          assert.doesNotMatch(invalid.text, /SYNTHETIC_PRIVATE_NOTE/);
        }
        const uploaded = await user.request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision: 0 } });
        assert.ok([200, 201].includes(uploaded.status), uploaded.text);
        assert.equal(uploaded.json.data.revision, 1);
        const download = await user.request('/diary/backup');
        assert.equal(download.status, 200);
        assert.equal(download.json.data.revision, 1);
        assert.deepEqual(download.json.data.backup, backup);
        assert.deepEqual(await importEncryptedBackup(JSON.stringify(download.json.data.backup), passphrase), state);
        await assert.rejects(importEncryptedBackup(JSON.stringify(download.json.data.backup), 'Incorrect-backup-passphrase'), /backupPassphraseWrong/);
        const stored = await app.locals.models.User.findById(user.id).select('+backup').lean();
        const serialized = JSON.stringify(stored);
        assert.ok(serialized.includes(backup.ciphertext));
        assert.doesNotMatch(serialized, /SYNTHETIC_PRIVATE_NOTE|Synthetic-backup-passphrase|"logs"|"profile"/);
      });

      await t.test('each session can read and change only its own backup', async () => {
        const a = await account(base);
        const b = await account(base);
        const backup = JSON.parse(await exportEncryptedBackup(createDemoData('2026-10-25'), passphrase));
        assert.equal((await a.request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision: 0 } })).json.data.revision, 1);
        assert.equal((await b.request('/diary/status')).json.data.hasBackup, false);
        assert.equal((await b.request('/diary/backup')).status, 404);
        assert.equal((await b.request('/diary/backup', { method: 'DELETE', body: { expectedRevision: 1 } })).status, 409);
        const injected = await b.request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision: 0, userId: a.id } });
        assert.equal(injected.status, 400);
        assert.equal((await a.request('/diary/backup')).status, 200);
        assert.equal((await a.request(`/diary/backup/${b.id}`)).status, 404);
      });

      await t.test('concurrent uploads have one winner and revision remains monotonic after deletion', async () => {
        const user = await account(base);
        const backup = JSON.parse(await exportEncryptedBackup(createDemoData('2026-10-25'), passphrase));
        const writes = await Promise.all([0, 1].map(() => user.request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision: 0 } })));
        assert.deepEqual(writes.map(result => result.status).sort(), [200, 409]);
        const conflict = writes.find(result => result.status === 409);
        assert.equal(conflict.json.error.code, 'BACKUP_CONFLICT');
        assert.equal((await user.request('/diary/backup', { method: 'DELETE', body: { expectedRevision: 0 } })).status, 409);
        const deleted = await user.request('/diary/backup', { method: 'DELETE', body: { expectedRevision: 1 } });
        assert.equal(deleted.status, 200);
        assert.equal(deleted.json.data.revision, 2);
        const status = await user.request('/diary/status');
        assert.equal(status.json.data.revision, 2);
        assert.equal(status.json.data.hasBackup, false);
        assert.equal((await user.request('/diary/backup')).status, 404);
        assert.equal((await user.request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision: 0 } })).status, 409);
        assert.equal((await user.request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision: 2 } })).json.data.revision, 3);
      });

      await t.test('logout revokes the session; authenticated account deletion removes backup and all sessions', async () => {
        const user = await account(base);
        const firstCookie = user.api.cookie;
        assert.equal((await user.request('/auth/logout', { method: 'POST' })).status, 200);
        assert.equal((await user.request('/auth/session')).status, 401);
        assert.equal((await user.request('/diary/status')).status, 401);
        const reused = await fetch(`${base}/auth/session`, { headers: { Cookie: firstCookie } });
        assert.equal(reused.status, 401);
        const login = await user.request('/auth/login', { method: 'POST', body: { username: user.username, password } });
        assert.equal(login.status, 200);
        const second = client(base);
        assert.equal((await second.request('/auth/login', { method: 'POST', body: { username: user.username, password } })).status, 200);
        const backup = JSON.parse(await exportEncryptedBackup(createDemoData('2026-10-25'), passphrase));
        await user.request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision: 0 } });
        const wrong = await user.request('/auth/account', { method: 'DELETE', body: { password: 'Wrong-password-123' } });
        assert.equal(wrong.status, 401);
        assert.ok(await app.locals.models.User.findById(user.id));
        const deleted = await user.request('/auth/account', { method: 'DELETE', body: { password } });
        assert.equal(deleted.status, 200);
        assert.equal(await app.locals.models.User.findById(user.id), null);
        assert.equal(await app.locals.models.Session.countDocuments({ userId: user.id }), 0);
        assert.equal((await second.request('/auth/session')).status, 401);
        assert.equal((await second.request('/diary/backup')).status, 401);
        assert.equal((await user.request('/auth/login', { method: 'POST', body: { username: user.username, password } })).status, 401);
      });

      await t.test('an expired session can sign in again without losing its account or encrypted age group', async () => {
        const user = await account(base);
        const state = createDemoData('2026-10-25');
        state.profile.ageGroup = 'under18';
        const backup = JSON.parse(await exportEncryptedBackup(state, passphrase));
        const uploaded = await user.request('/diary/backup', { method: 'PUT', body: { backup, expectedRevision: 0 } });
        assert.equal(uploaded.status, 200);
        const originalCookie = user.api.cookie;
        const originalCsrf = user.api.csrf;
        const originalAccount = await app.locals.models.User.findById(user.id).select('+passwordHash +passwordSalt').lean();
        const accountCount = await app.locals.models.User.countDocuments();
        await app.locals.models.Session.updateMany({ userId: user.id }, { $set: { expiresAt: new Date(Date.now() - 60_000) } });
        assert.equal((await user.request('/auth/session')).status, 401);
        assert.equal((await user.request('/diary/backup')).status, 401);
        assert.equal((await user.request('/diary/status')).status, 401);
        const login = await user.request('/auth/login', { method: 'POST', body: { username: user.username, password } });
        assert.equal(login.status, 200, login.text);
        assert.equal(login.json.data.user.id, user.id);
        assert.equal(login.json.data.user.username, user.username);
        assert.deepEqual(Object.keys(login.json.data.user).sort(), ['id', 'username']);
        assert.notEqual(user.api.cookie, originalCookie);
        assert.notEqual(user.api.csrf, originalCsrf);
        assert.equal(await app.locals.models.User.countDocuments(), accountCount, 'signing in must not recreate the account');
        const oldSession = await fetch(`${base}/auth/session`, { headers: { Cookie: originalCookie } });
        assert.equal(oldSession.status, 401, 'the expired cookie must stay revoked after signing in again');
        const session = await user.request('/auth/session');
        assert.equal(session.status, 200);
        assert.deepEqual(session.json.data.user, login.json.data.user);
        assert.equal(session.json.data.csrfToken, login.json.data.csrfToken);
        const restored = await user.request('/diary/backup');
        assert.equal(restored.status, 200);
        assert.equal(restored.json.data.revision, 1);
        assert.deepEqual(restored.json.data.backup, backup);
        const diary = await importEncryptedBackup(JSON.stringify(restored.json.data.backup), passphrase);
        assert.deepEqual(diary, state);
        assert.equal(diary.profile.ageGroup, 'under18');
        const storedAccount = await app.locals.models.User.findById(user.id).select('+passwordHash +passwordSalt').lean();
        assert.equal(storedAccount.passwordHash, originalAccount.passwordHash);
        assert.equal(storedAccount.passwordSalt, originalAccount.passwordSalt);
        for (const field of ['age', 'ageGroup', 'dateOfBirth', 'dob', 'email', 'phone']) {
          assert.equal(Object.hasOwn(storedAccount, field), false, `${field} must not be a plaintext account field`);
          assert.equal(Object.hasOwn(session.json.data.user, field), false);
        }
      });

      await t.test('authentication rate limiting returns a bounded retry response', async () => {
        const limited = await serve(connection, { authLimit: 2 });
        try {
          const api = client(limited.base);
          const body = { username: 'never_registered_alias', password };
          await api.request('/auth/login', { method: 'POST', body });
          await api.request('/auth/login', { method: 'POST', body });
          const result = await api.request('/auth/login', { method: 'POST', body });
          assert.equal(result.status, 429);
          assert.ok(result.response.headers.get('retry-after'));
          assert.equal(typeof result.json.error.code, 'string');
        } finally { await new Promise(resolve => limited.server.close(resolve)); }
      });
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
});

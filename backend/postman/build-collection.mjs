// Rebuild only when changing the collection. This fixture contains fictional data.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createDemoData } from '../../frontend/src/data/demo.js';
import { exportEncryptedBackup } from '../../frontend/src/services/storage.service.js';

const backup = await exportEncryptedBackup(createDemoData('2026-10-25'), 'Postman fictional fixture passphrase');
const items = [];
const test = lines => ({ listen: 'test', script: { type: 'text/javascript', exec: lines } });
function request(name, method, path, status, { body, csrf = true, checks = [], headers = [] } = {}) {
  const header = [...headers];
  if (body !== undefined) header.push({ key: 'Content-Type', value: 'application/json' });
  if (csrf && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) header.push({ key: 'X-CSRF-Token', value: '{{csrfToken}}' });
  const request = { method, header, url: '{{baseUrl}}' + path };
  if (body !== undefined) request.body = { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } };
  items.push({
    name,
    request,
    event: [test([
      `pm.test('HTTP ${status}', () => pm.response.to.have.status(${status}));`,
      'const body = pm.response.json();',
      "pm.test('API response is not cached', () => pm.expect(pm.response.headers.get('Cache-Control')).to.include('no-store'));",
      ...(status >= 400 ? ["pm.test('Safe error envelope', () => { pm.expect(body.error.code).to.be.a('string'); pm.expect(body.error).not.to.have.property('stack'); });"] : []),
      ...checks,
    ])],
  });
}
const credentials = alias => ({ username: `{{${alias}}}`, password: '{{accountPassword}}' });
const authCapture = [
  "pm.test('Alias only in user profile', () => { pm.expect(body.data.user.id).to.be.a('string'); pm.expect(body.data.user).not.to.have.property('password'); pm.expect(body.data).not.to.have.property('token'); });",
  "pm.collectionVariables.set('csrfToken', body.data.csrfToken);",
  "pm.test('HttpOnly session cookie', () => { const c = pm.response.headers.get('Set-Cookie'); pm.expect(c).to.include('HttpOnly'); pm.expect(c).to.match(/SameSite=Strict/i); pm.expect(c).to.include('Path=/api'); });",
];
const noBackup = ["pm.test('No backup stored', () => pm.expect(body.data.hasBackup).to.equal(false));"];
const revision = n => `pm.test('Revision ${n}', () => pm.expect(body.data.revision).to.equal(${n}));`;
const putBody = n => `{"backup": {{encryptedBackup}}, "expectedRevision": ${n}}`;

request('01 Health: Express and MongoDB', 'GET', '/health', 200, { checks: ["pm.test('Database connected', () => { pm.expect(body.data.status).to.equal('ok'); pm.expect(body.data.database).to.equal('connected'); });"] });
request('02 Anonymous diary is blocked', 'GET', '/diary/status', 401);
request('03 Reject short account password', 'POST', '/auth/register', 400, { body: { username: '{{userA}}', password: 'short' }, csrf: false });
request('04 Reject account injection', 'POST', '/auth/login', 400, { body: { username: { $ne: null }, password: '{{accountPassword}}' }, csrf: false });
request('05 Register fictional account A', 'POST', '/auth/register', 201, { body: credentials('userA'), csrf: false, checks: [...authCapture, "pm.collectionVariables.set('userAId', body.data.user.id);"] });
request('06 Duplicate alias is rejected', 'POST', '/auth/register', 409, { body: credentials('userA'), csrf: false });
request('07 Wrong password is rejected', 'POST', '/auth/login', 401, { body: { username: '{{userA}}', password: 'Wrong-fictional-password-123' }, csrf: false, checks: ["pm.test('Generic login failure', () => pm.expect(body.error.code).to.equal('INVALID_CREDENTIALS'));"] });
request('08 Session survives request boundary', 'GET', '/auth/session', 200, { checks: ["pm.test('Account A session', () => pm.expect(body.data.user.id).to.equal(pm.collectionVariables.get('userAId')));", "pm.collectionVariables.set('csrfToken', body.data.csrfToken);"] });
request('09 Empty cloud status', 'GET', '/diary/status', 200, { checks: [...noBackup, revision(0)] });
request('10 Missing cloud backup returns 404', 'GET', '/diary/backup', 404);
request('11 Mutation requires CSRF', 'DELETE', '/diary/backup', 403, { body: { expectedRevision: 0 }, csrf: false, checks: ["pm.test('CSRF error', () => pm.expect(body.error.code).to.equal('CSRF_INVALID'));"] });
request('12 Reject plain diary upload', 'PUT', '/diary/backup', 400, { body: { backup: { logs: { note: 'fictional plaintext must not be accepted' } }, expectedRevision: 0 } });
request('13 Reject extra plaintext fields', 'PUT', '/diary/backup', 400, { body: '{"backup": {{encryptedBackup}}, "expectedRevision": 0, "note": "fictional private note"}' });
request('14 Reject unsafe encryption metadata', 'PUT', '/diary/backup', 400, { body: '{"backup": {"format":"bloom-encrypted-backup","version":1,"cipher":"AES-GCM-256","kdf":"PBKDF2-SHA256","iterations":1,"salt":"AA==","iv":"AA==","ciphertext":"AA=="},"expectedRevision":0}' });
request('15 Upload browser-encrypted backup A', 'PUT', '/diary/backup', 200, { body: putBody(0), checks: [revision(1)] });
request('16 Download opaque encrypted backup A', 'GET', '/diary/backup', 200, { checks: [revision(1), "pm.test('Ciphertext round trip', () => pm.expect(body.data.backup).to.deep.equal(JSON.parse(pm.collectionVariables.get('encryptedBackup'))));", "pm.test('Raw diary absent', () => { pm.expect(body.data).not.to.have.property('logs'); pm.expect(body.data.backup).not.to.have.property('profile'); });"] });
request('17 Stale upload cannot overwrite backup', 'PUT', '/diary/backup', 409, { body: putBody(0), checks: ["pm.test('Conflict reported', () => pm.expect(body.error.code).to.equal('BACKUP_CONFLICT'));"] });
request('18 Reject an untrusted origin', 'POST', '/auth/logout', 403, { headers: [{ key: 'Origin', value: 'https://untrusted.example.invalid' }], checks: ["pm.test('Origin refused', () => pm.expect(body.error.code).to.equal('ORIGIN_FORBIDDEN'));"] });
request('19 Register fictional account B', 'POST', '/auth/register', 201, { body: credentials('userB'), csrf: false, checks: authCapture });
request('20 Account B cannot see account A backup', 'GET', '/diary/status', 200, { checks: [...noBackup, revision(0)] });
request('21 Account B has no downloadable backup', 'GET', '/diary/backup', 404);
request('22 Account B cannot delete account A revision', 'DELETE', '/diary/backup', 409, { body: { expectedRevision: 1 } });
request('23 Delete fictional account B', 'DELETE', '/auth/account', 200, { body: { password: '{{accountPassword}}' }, checks: ["pm.test('Account deleted', () => pm.expect(body.data.deleted).to.equal(true));"] });
request('24 Deleted account B session is revoked', 'GET', '/auth/session', 401);
request('25 Sign back in as account A', 'POST', '/auth/login', 200, { body: credentials('userA'), csrf: false, checks: authCapture });
request('26 Account A backup remains isolated', 'GET', '/diary/backup', 200, { checks: [revision(1)] });
request('27 Wrong password cannot delete account', 'DELETE', '/auth/account', 401, { body: { password: 'Wrong-fictional-password-123' } });
request('28 Stale deletion is refused', 'DELETE', '/diary/backup', 409, { body: { expectedRevision: 0 } });
request('29 Delete cloud backup only', 'DELETE', '/diary/backup', 200, { body: { expectedRevision: 1 }, checks: [revision(2)] });
request('30 Deleted backup returns 404', 'GET', '/diary/backup', 404);
request('31 Deletion preserves monotonic revision', 'GET', '/diary/status', 200, { checks: [...noBackup, revision(2)] });
request('32 Old upload cannot resurrect deleted backup', 'PUT', '/diary/backup', 409, { body: putBody(0) });
request('33 Explicit new encrypted upload succeeds', 'PUT', '/diary/backup', 200, { body: putBody(2), checks: [revision(3)] });
request('34 Logout revokes session', 'POST', '/auth/logout', 200, { checks: ["pm.test('Logged out', () => pm.expect(body.data.loggedOut).to.equal(true));"] });
request('35 Logged out session is rejected', 'GET', '/auth/session', 401);
request('36 Logged out backup access is rejected', 'GET', '/diary/backup', 401);
request('37 Sign in for account deletion', 'POST', '/auth/login', 200, { body: credentials('userA'), csrf: false, checks: authCapture });
request('38 Delete account A and its encrypted backup', 'DELETE', '/auth/account', 200, { body: { password: '{{accountPassword}}' }, checks: ["pm.test('Account deleted', () => pm.expect(body.data.deleted).to.equal(true));"] });
request('39 Deleted account A session is rejected', 'GET', '/auth/session', 401);
request('40 Deleted account A cannot log in', 'POST', '/auth/login', 401, { body: credentials('userA'), csrf: false });

const collection = {
  info: {
    name: 'Bloom Express API — private optional cloud backup',
    description: 'Runs locally with fictional aliases and an actual browser-encrypted fictional diary. No real health data or personal credentials belong in this collection. Collection order matters: register two disposable users, verify isolation and revisions, then delete both accounts. Run against a disposable test database whenever possible. The server validates the encrypted envelope shape; only the browser can verify/decrypt its content.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://127.0.0.1:3000/api/v1' },
    { key: 'encryptedBackup', value: backup },
    { key: 'csrfToken', value: '' },
  ],
  event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: [
    'if (pm.info.requestName.startsWith("01 ")) {',
    "  const suffix = pm.variables.replaceIn('{{$guid}}').replace(/-/g, '').slice(0, 20);",
    "  pm.collectionVariables.set('userA', 'pm_a_' + suffix);",
    "  pm.collectionVariables.set('userB', 'pm_b_' + suffix);",
    "  pm.collectionVariables.set('accountPassword', 'Postman-fictional-' + suffix);",
    "  pm.collectionVariables.set('csrfToken', '');",
    '}',
  ] } }],
  item: items,
};
await writeFile(fileURLToPath(new URL('./Bloom.postman_collection.json', import.meta.url)), JSON.stringify(collection, null, 2) + '\n');
await writeFile(fileURLToPath(new URL('./Local.postman_environment.json', import.meta.url)), JSON.stringify({
  name: 'Bloom — local synthetic testing',
  values: [{ key: 'baseUrl', value: 'http://127.0.0.1:3000/api/v1', type: 'default', enabled: true }],
  _postman_variable_scope: 'environment',
}, null, 2) + '\n');
console.log(`Wrote ${items.length} requests with an encrypted fictional diary fixture.`);

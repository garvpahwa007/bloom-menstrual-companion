import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config/environment.config.js';
import { withTestDatabase } from '../scripts/test-database.mjs';

const password = 'Synthetic-security-password-123';

test('production origin configuration requires exact HTTPS site origins', () => {
  const production = { NODE_ENV: 'production', MONGODB_URI: 'mongodb://127.0.0.1:27018/config_test' };
  for (const PUBLIC_ORIGIN of ['http://bloom.example', 'https://bloom.example/', 'https://bloom.example/cloud', 'https://user:password@bloom.example', 'https://bloom.example?query=1', 'null']) {
    assert.throws(() => readConfig({ ...production, PUBLIC_ORIGIN }), /PUBLIC_ORIGIN|Invalid URL/);
  }
  assert.throws(() => readConfig(production), /PUBLIC_ORIGIN or ALLOWED_ORIGINS/);
  assert.equal(readConfig({ ...production, PUBLIC_ORIGIN: 'https://bloom.example' }).publicOrigin, 'https://bloom.example');
  assert.equal(readConfig({ ...production, ALLOWED_ORIGINS: 'https://bloom.example' }).allowedOrigins[0], 'https://bloom.example');
  assert.equal(readConfig({ PUBLIC_ORIGIN: 'http://localhost:3000' }).publicOrigin, 'http://localhost:3000');
});

async function serve(connection, overrides = {}) {
  const app = await createApp({ connection, config: { authLimit: 1000, allowedOrigins: [], isProduction: false, ...overrides } });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { app, base: `http://127.0.0.1:${server.address().port}/api/v1`, close: () => new Promise(resolve => server.close(resolve)) };
}

async function send(base, path, { method = 'POST', body, cookie, csrf, rawBody } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
    ...(['GET', 'HEAD'].includes(method) ? {} : { body: rawBody ?? JSON.stringify(body ?? {}) }),
  });
  const text = await response.text();
  return { response, json: JSON.parse(text), text, status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

test('authentication and CSRF run before expensive backup parsing; auth route aliases stay rate-limited', { timeout: 180_000 }, async t => {
  await withTestDatabase(async connection => {
    await t.test('login case and trailing slash variants share the authentication limiter', async () => {
      const service = await serve(connection, { authLimit: 2 });
      try {
        const body = { username: 'not_registered_security_test', password };
        assert.equal((await send(service.base, '/auth/login', { body })).status, 401);
        assert.equal((await send(service.base, '/AUTH/LOGIN/', { body })).status, 401);
        const limited = await send(service.base, '/auth/login/', { body });
        assert.equal(limited.status, 429);
        assert.equal(limited.json.error.code, 'RATE_LIMITED');
      } finally { await service.close(); }
    });

    await t.test('registration case and trailing slash variants share the authentication limiter', async () => {
      const service = await serve(connection, { authLimit: 2 });
      try {
        assert.equal((await send(service.base, '/auth/register', { body: {} })).status, 400);
        assert.equal((await send(service.base, '/AUTH/REGISTER/', { body: {} })).status, 400);
        assert.equal((await send(service.base, '/auth/register/', { body: {} })).status, 429);
      } finally { await service.close(); }
    });

    await t.test('password verification for account deletion is limited while session reads and logout stay available', async () => {
      const service = await serve(connection, { authLimit: 2 });
      try {
        const username = `sec_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
        const registered = await send(service.base, '/auth/register', { body: { username, password } });
        assert.equal(registered.status, 201);
        const credentials = { cookie: registered.cookie, csrf: registered.json.data.csrfToken };
        const wrong = await send(service.base, '/auth/account', { ...credentials, method: 'DELETE', body: { password: 'Incorrect-synthetic-password' } });
        assert.equal(wrong.status, 401);
        const limited = await send(service.base, '/AUTH/ACCOUNT/', { ...credentials, method: 'DELETE', body: { password } });
        assert.equal(limited.status, 429);
        assert.ok(await service.app.locals.models.User.findOne({ username }));
        assert.equal((await send(service.base, '/auth/session', { ...credentials, method: 'GET' })).status, 200);
        assert.equal((await send(service.base, '/auth/logout', credentials)).status, 200);
      } finally { await service.close(); }
    });

    await t.test('an unauthenticated oversized upload returns AUTH_REQUIRED before body parsing', async () => {
      const service = await serve(connection);
      try {
        const rejected = await send(service.base, '/diary/backup', { method: 'PUT', rawBody: `{"plaintext":"SYNTHETIC_UNAUTHENTICATED_MARKER${'x'.repeat(6_900_000)}` });
        assert.equal(rejected.status, 401);
        assert.equal(rejected.json.error.code, 'AUTH_REQUIRED');
        assert.doesNotMatch(rejected.text, /SYNTHETIC_UNAUTHENTICATED_MARKER/);
      } finally { await service.close(); }
    });

    await t.test('a missing CSRF header rejects an oversized authenticated upload before body parsing', async () => {
      const service = await serve(connection);
      try {
        const username = `sec_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
        const registered = await send(service.base, '/auth/register', { body: { username, password } });
        assert.equal(registered.status, 201);
        const rejected = await send(service.base, '/diary/backup', { method: 'PUT', cookie: registered.cookie, rawBody: `{"plaintext":"SYNTHETIC_CSRF_MARKER${'x'.repeat(6_900_000)}` });
        assert.equal(rejected.status, 403);
        assert.equal(rejected.json.error.code, 'CSRF_INVALID');
        assert.doesNotMatch(rejected.text, /SYNTHETIC_CSRF_MARKER/);
        const status = await send(service.base, '/diary/status', { method: 'GET', cookie: registered.cookie });
        assert.equal(status.json.data.hasBackup, false);
        assert.equal(status.json.data.revision, 0);
      } finally { await service.close(); }
    });
  });
});

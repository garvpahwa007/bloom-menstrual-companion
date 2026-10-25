import { mkdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createApp } from '../src/app.js';
import { withTestDatabase } from './test-database.mjs';

// This runner never connects to MONGODB_URI, a Postman account, or a cloud collection.
// Its API and real MongoDB process use random local ports and a disposable database.
const collection = fileURLToPath(new URL('../postman/Bloom.postman_collection.json', import.meta.url));
const resultsFolder = fileURLToPath(new URL('../test-results/', import.meta.url));
const report = fileURLToPath(new URL('../test-results/postman-results.json', import.meta.url));
const executableName = process.platform === 'win32' ? 'postman.cmd' : 'postman';
const candidates = [
  fileURLToPath(new URL(`../../node_modules/.bin/${executableName}`, import.meta.url)),
  fileURLToPath(new URL(`../node_modules/.bin/${executableName}`, import.meta.url)),
];
const binary = candidates.find(existsSync);
if (!binary) throw new Error('Postman CLI is missing. Run npm ci from the project root.');
await mkdir(resultsFolder, { recursive: true });
await rm(report, { force: true });

await withTestDatabase(async connection => {
  const app = await createApp({ connection, config: { isProduction: false, authLimit: 1000, allowedOrigins: [], sessionDays: 7 }, serveFrontend: false });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  try {
    const env = { ...process.env };
    // Do not inherit cloud authentication into a local synthetic test run.
    delete env.POSTMAN_API_KEY;
    const args = [
      'collection', 'run', collection,
      '--env-var', `baseUrl=${baseUrl}`,
      '--reporters', 'cli,json',
      '--reporter-json-export', report,
      '--no-report-events',
      '--timeout', '90000',
      '--timeout-request', '5000',
      '--disable-unicode',
    ];
    console.log('Running the local Postman collection against a disposable Express + MongoDB instance.');
    const child = spawn(binary, args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
    const [code, signal] = await once(child, 'exit');
    if (signal) throw new Error(`Postman CLI terminated with ${signal}.`);
    if (code !== 0) throw new Error(`Postman CLI failed with exit code ${code}. See backend/test-results/postman-results.json.`);
    const reportData = JSON.parse(await readFile(report, 'utf8'));
    const run = reportData.run;
    const stats = run?.stats;
    const summary = run?.summary;
    // Postman CLI 1.76 uses summary; older v2.1 reporters expose Newman-style stats.
    const requestCount = summary?.executedRequests?.executed ?? stats?.requests?.total;
    const assertionCount = summary?.tests?.executed ?? stats?.assertions?.total;
    const assertionFailures = summary?.tests?.failed ?? stats?.assertions?.failed;
    const expectedRequests = JSON.parse(await readFile(collection, 'utf8')).item.length;
    const executionErrors = summary
      ? Object.values(summary).reduce((count, value) => count + (value?.errors || 0), 0)
      : Object.values(stats || {}).reduce((count, value) => count + (value?.failed || 0), 0);
    if (run?.runError || run?.failures?.length || executionErrors || assertionFailures !== 0 ||
        requestCount !== expectedRequests || !Number.isInteger(assertionCount) || assertionCount < 1) {
      throw new Error('Postman report contains failures or an incomplete run. See backend/test-results/postman-results.json.');
    }
    console.log(`Postman: ${requestCount} requests, ${assertionCount} assertions, ${assertionFailures} failed assertions.`);
    const remaining = await app.locals.models.User.countDocuments();
    if (remaining !== 0) throw new Error(`Collection did not clean up ${remaining} synthetic account(s). The disposable database will still be removed.`);
    console.log('Both synthetic accounts were deleted. Local JSON report: backend/test-results/postman-results.json');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

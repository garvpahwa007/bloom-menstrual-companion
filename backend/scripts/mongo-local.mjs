import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { backendRoot, mongoBinaryOptions } from './mongo-options.mjs';

const dbPath = path.join(backendRoot, '.local-mongo');
await mkdir(dbPath, { recursive: true });
let server;
try {
  server = await MongoMemoryServer.create({
    binary: mongoBinaryOptions(),
    instance: { port: 27018, ip: '127.0.0.1', dbName: 'bloom', dbPath, storageEngine: 'wiredTiger' },
  });
  console.info('Local development MongoDB ready at mongodb://127.0.0.1:27018/bloom');
  console.info('Development data is in backend/.local-mongo. Stop with Ctrl+C; it persists between runs.');
  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  console.error('Cannot start local MongoDB. Check port 27018 and download access, or set MONGOMS_SYSTEM_BINARY to a compatible mongod executable.');
  process.exitCode = 1;
}

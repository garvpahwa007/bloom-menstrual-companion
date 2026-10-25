import { randomUUID } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { connectDatabase } from '../src/config/database.config.js';
import { mongoBinaryOptions } from './mongo-options.mjs';

export async function withTestDatabase(callback) {
  // A disposable real MongoDB process, with a random port and database name.
  // Never use MONGODB_URI here: tests cannot erase a configured cloud database.
  const server = await MongoMemoryServer.create({ binary: mongoBinaryOptions(), instance: { dbName: `bloom_test_${randomUUID().replaceAll('-', '')}` } });
  let connection;
  try {
    connection = await connectDatabase(server.getUri());
    return await callback(connection);
  } finally {
    if (connection) await connection.close();
    await server.stop();
  }
}

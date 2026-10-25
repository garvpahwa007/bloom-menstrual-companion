import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const backendRoot = fileURLToPath(new URL('../', import.meta.url));
export function mongoBinaryOptions() {
  return {
    version: '8.0.17', downloadDir: path.join(backendRoot, '.cache/mongodb-binaries'),
    ...(process.env.MONGOMS_SYSTEM_BINARY ? { systemBinary: process.env.MONGOMS_SYSTEM_BINARY } : {}),
  };
}

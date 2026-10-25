import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const backendDirectory = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(backendDirectory, '.env'), quiet: true });

export function readConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
  const allowedOrigins = (env.ALLOWED_ORIGINS || (isProduction ? '' : `http://localhost:5173,http://127.0.0.1:5173,http://localhost:${port},http://127.0.0.1:${port}`))
    .split(',').map(value => value.trim()).filter(Boolean);
  for (const origin of allowedOrigins) {
    const url = new URL(origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol) || (isProduction && url.protocol !== 'https:')) throw new Error('ALLOWED_ORIGINS must contain exact HTTPS origins in production.');
  }
  const publicOrigin = env.PUBLIC_ORIGIN || '';
  if (publicOrigin) {
    const url = new URL(publicOrigin);
    if (url.origin !== publicOrigin || !['http:', 'https:'].includes(url.protocol) || (isProduction && url.protocol !== 'https:')) throw new Error('PUBLIC_ORIGIN must be an exact HTTPS origin in production.');
  }
  if (isProduction && !publicOrigin && !allowedOrigins.length) throw new Error('Configure PUBLIC_ORIGIN or ALLOWED_ORIGINS for the production site.');
  return {
    isProduction, port, host: env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1'), allowedOrigins, sessionDays: 7, authLimit: 100,
    mongoUri: env.MONGODB_URI || (isProduction ? '' : 'mongodb://127.0.0.1:27018/bloom'),
    publicOrigin,
    // Keep this at zero unless the deployment uses a known reverse proxy.
    trustProxy: env.TRUST_PROXY === '1' ? 1 : false,
  };
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createAuthModels } from './modules/auth/auth.model.js';
import { createAuthRouter } from './modules/auth/auth.router.js';
import { createDiaryRouter } from './modules/diary/diary.router.js';
import { originGuard } from './middlewares/origin.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { ApiError } from './utilities/api-error.js';

export async function createApp({ config = {}, connection, serveFrontend = false } = {}) {
  if (!connection || connection.readyState !== 1) throw new Error('createApp requires a connected MongoDB connection.');
  const settings = { sessionDays: 7, authLimit: 100, allowedOrigins: [], isProduction: false, ...config };
  const models = createAuthModels(connection);
  await Promise.all(Object.values(models).map(model => model.init()));
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', settings.trustProxy || false);
  app.locals.models = models;
  app.use(helmet({ contentSecurityPolicy: false, hsts: settings.isProduction ? undefined : false }));
  const api = express.Router();
  api.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  api.use(originGuard(settings));
  api.use(cors({
    origin: (origin, callback) => callback(null, !origin || settings.allowedOrigins.includes(origin) || origin === settings.publicOrigin),
    credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  }));
  api.use(cookieParser());
  api.get('/health', (_req, res) => {
    const connected = connection.readyState === 1;
    res.status(connected ? 200 : 503).json({ data: { status: connected ? 'ok' : 'unavailable', database: connected ? 'connected' : 'disconnected' } });
  });
  api.use('/auth', rateLimit({
    windowMs: 15 * 60 * 1000, limit: settings.authLimit,
    standardHeaders: 'draft-8', legacyHeaders: false,
    // Session reads and logout remain available when password attempts are rate-limited.
    skip: req => {
      const route = req.path.toLowerCase().replace(/\/+$/, '');
      return !((req.method === 'POST' && ['/register', '/login'].includes(route)) || (req.method === 'DELETE' && route === '/account'));
    },
    handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Please try again later.' } }),
  }), express.json({ limit: '16kb', strict: true }), createAuthRouter({ config: settings, models }));
  api.use('/diary', createDiaryRouter({ config: settings, models }));
  api.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'API endpoint not found.')));
  app.use('/api/v1', api);
  app.use('/api', (_req, res) => res.status(404).set('Cache-Control', 'no-store').json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } }));
  if (serveFrontend) {
    const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
    if (!existsSync(path.join(dist, 'index.html'))) throw new Error('Run npm run build before starting the production server.');
    app.use(express.static(dist, { dotfiles: 'deny', setHeaders(res, file) {
      if (file.endsWith('sw.js') || file.endsWith('index.html')) res.set('Cache-Control', 'no-cache');
    } }));
    app.get('/{*path}', (req, res, next) => {
      if (path.extname(req.path) || req.path.includes('/.')) return next();
      res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'index.html'));
    });
  }
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found.' } }));
  app.use(errorMiddleware);
  return app;
}

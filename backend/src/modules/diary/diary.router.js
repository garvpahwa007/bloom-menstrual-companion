import { Router, json } from 'express';
import rateLimit from 'express-rate-limit';
import { requireSession, requireCsrf } from '../auth/auth.middleware.js';
import { createDiaryController } from './diary.controller.js';

export function createDiaryRouter(dependencies) {
  const router = Router();
  const controller = createDiaryController(dependencies);
  router.use(requireSession(dependencies));
  router.use((req, res, next) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? next() : requireCsrf(req, res, next));
  router.use(rateLimit({
    windowMs: 15 * 60 * 1000, limit: dependencies.config.backupLimit || 100,
    standardHeaders: 'draft-8', legacyHeaders: false,
    skip: req => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
    keyGenerator: req => String(req.auth.user._id),
    handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many backup changes. Please try again later.' } }),
  }));
  // Authenticate before accepting an up-to-6.8MB encrypted upload.
  router.use(json({ limit: 6801000, strict: true }));
  router.get('/status', controller.status);
  router.get('/backup', controller.get);
  router.put('/backup', requireCsrf, controller.put);
  router.delete('/backup', requireCsrf, controller.delete);
  return router;
}

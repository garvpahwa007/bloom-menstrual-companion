import { Router } from 'express';
import { createAuthController } from './auth.controller.js';
import { requireSession, requireCsrf } from './auth.middleware.js';

export function createAuthRouter(dependencies) {
  const router = Router();
  const controller = createAuthController(dependencies);
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.get('/session', requireSession(dependencies), controller.session);
  router.post('/logout', requireSession(dependencies), requireCsrf, controller.logout);
  router.delete('/account', requireSession(dependencies), requireCsrf, controller.deleteAccount);
  return router;
}

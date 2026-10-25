import { timingSafeEqual } from 'node:crypto';
import { ApiError } from '../../utilities/api-error.js';
import { hashToken, readSessionToken } from './auth.service.js';

export function requireSession({ models }) {
  return async function authenticated(req, _res, next) {
    const token = readSessionToken(req);
    if (!token) throw new ApiError(401, 'AUTH_REQUIRED', 'Sign in to use cloud backup.');
    const session = await models.Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
    if (!session) throw new ApiError(401, 'AUTH_REQUIRED', 'Sign in to use cloud backup.');
    const user = await models.User.findById(session.userId);
    if (!user) {
      await models.Session.deleteOne({ _id: session._id });
      throw new ApiError(401, 'AUTH_REQUIRED', 'Sign in to use cloud backup.');
    }
    req.auth = { user, session };
    next();
  };
}

export function requireCsrf(req, _res, next) {
  const token = req.get('X-CSRF-Token');
  const expected = req.auth?.session.csrfToken;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof expected !== 'string' ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    throw new ApiError(403, 'CSRF_INVALID', 'Refresh your cloud session and try again.');
  }
  next();
}

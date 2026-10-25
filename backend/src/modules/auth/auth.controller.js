import { ApiError } from '../../utilities/api-error.js';
import { credentialsSchema, deleteAccountSchema, emptySchema, validateBody } from './auth.request.js';
import { checkPassword, cookieOptions, login, register, sessionData, SESSION_COOKIE } from './auth.service.js';

export function createAuthController(dependencies) {
  const { models, config } = dependencies;
  return {
    async register(req, res) { res.status(201).json({ data: await register(req, res, validateBody(credentialsSchema, req.body), dependencies) }); },
    async login(req, res) { res.json({ data: await login(req, res, validateBody(credentialsSchema, req.body), dependencies) }); },
    async session(req, res) { res.json({ data: sessionData(req.auth.user, req.auth.session) }); },
    async logout(req, res) {
      validateBody(emptySchema, req.body || {});
      await models.Session.deleteOne({ _id: req.auth.session._id });
      res.clearCookie(SESSION_COOKIE, cookieOptions(config));
      res.json({ data: { loggedOut: true } });
    },
    async deleteAccount(req, res) {
      const { password } = validateBody(deleteAccountSchema, req.body);
      const user = await models.User.findById(req.auth.user._id).select('+passwordHash +passwordSalt');
      if (!await checkPassword(password, user)) throw new ApiError(401, 'INVALID_CREDENTIALS', 'The password is incorrect.');
      // The account and its ciphertext live in one document, so deletion is atomic.
      await models.User.deleteOne({ _id: user._id });
      await models.Session.deleteMany({ userId: user._id });
      res.clearCookie(SESSION_COOKIE, cookieOptions(config));
      res.json({ data: { deleted: true } });
    },
  };
}

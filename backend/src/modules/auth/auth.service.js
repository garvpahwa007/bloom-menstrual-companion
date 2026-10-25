import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ApiError } from '../../utilities/api-error.js';

const scryptAsync = promisify(scrypt);
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
export const SESSION_COOKIE = 'bloom.sid';
const FAKE_SALT = '00000000000000000000000000000000';

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const key = await scryptAsync(password, salt, 64, SCRYPT_OPTIONS);
  return { passwordSalt: salt, passwordHash: key.toString('hex') };
}

export async function checkPassword(password, user) {
  const { passwordHash } = await hashPassword(password, user?.passwordSalt || FAKE_SALT);
  const expected = user?.passwordHash ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(64);
  const actual = Buffer.from(passwordHash, 'hex');
  return Boolean(user && expected.length === actual.length && timingSafeEqual(expected, actual));
}

export function hashToken(token) { return createHash('sha256').update(token).digest('hex'); }

export function cookieOptions(config) {
  return { path: '/api', httpOnly: true, sameSite: 'strict', secure: Boolean(config.isProduction) };
}

export function readSessionToken(req) {
  const cookies = req.headers.cookie?.split(';') || [];
  const matches = cookies.map(value => value.trim()).filter(value => value.startsWith(`${SESSION_COOKIE}=`));
  if (matches.length !== 1) return null;
  const value = matches[0].slice(SESSION_COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export function sessionData(user, session) {
  return { user: { id: String(user._id), username: user.username }, csrfToken: session.csrfToken };
}

export async function startSession(req, res, user, { models, config }) {
  const token = randomBytes(32).toString('hex');
  const days = config.sessionDays || 7;
  const session = await models.Session.create({
    tokenHash: hashToken(token), userId: user._id, csrfToken: randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });
  // Replacing a browser session must not leave its old cookie usable.
  const oldToken = readSessionToken(req);
  if (oldToken) await models.Session.deleteOne({ tokenHash: hashToken(oldToken) });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(config), maxAge: days * 24 * 60 * 60 * 1000 });
  return sessionData(user, session);
}

export async function register(req, res, credentials, dependencies) {
  const passwordFields = await hashPassword(credentials.password);
  let user;
  try { user = await dependencies.models.User.create({ username: credentials.username, ...passwordFields }); }
  catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'USERNAME_TAKEN', 'That username is unavailable.');
    throw error;
  }
  return startSession(req, res, user, dependencies);
}

export async function login(req, res, credentials, dependencies) {
  const user = await dependencies.models.User.findOne({ username: credentials.username }).select('+passwordHash +passwordSalt');
  if (!await checkPassword(credentials.password, user)) throw new ApiError(401, 'INVALID_CREDENTIALS', 'The username or password is incorrect.');
  return startSession(req, res, user, dependencies);
}

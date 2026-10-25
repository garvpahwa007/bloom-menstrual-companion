import Joi from 'joi';
import { validateBody } from '../auth/auth.request.js';

function base64Bytes(min, max) {
  return Joi.string().max(Math.ceil(max / 3) * 4).custom((value, helpers) => {
    if (!value || value.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return helpers.error('any.invalid');
    const decoded = Buffer.from(value, 'base64');
    if (decoded.length < min || decoded.length > max || decoded.toString('base64') !== value) return helpers.error('any.invalid');
    return value;
  }).required();
}

export const encryptedBackupSchema = Joi.object({
  format: Joi.string().valid('bloom-encrypted-backup').required(),
  version: Joi.number().valid(1).required(),
  cipher: Joi.string().valid('AES-GCM-256').required(),
  kdf: Joi.string().valid('PBKDF2-SHA256').required(),
  iterations: Joi.number().integer().min(100000).max(500000).required(),
  salt: base64Bytes(16, 16),
  iv: base64Bytes(12, 12),
  ciphertext: base64Bytes(16, 5000016),
}).required().unknown(false).custom((value, helpers) =>
  Buffer.byteLength(JSON.stringify(value), 'utf8') <= 6800000 ? value : helpers.error('any.invalid'));

const expectedRevision = Joi.number().integer().min(0).max(Number.MAX_SAFE_INTEGER - 1).required();
export const uploadBackupSchema = Joi.object({ backup: encryptedBackupSchema, expectedRevision }).required().unknown(false);
export const deleteBackupSchema = Joi.object({ expectedRevision }).required().unknown(false);
export { validateBody };

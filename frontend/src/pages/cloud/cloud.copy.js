import en from '../../i18n/en.js';
import hi from '../../i18n/hi.js';

export const cloudCopy = language => Object.fromEntries(Object.entries(language === 'hi' ? hi : en).filter(([key]) => key.startsWith('cloud.')).map(([key, value]) => [key.slice(6), value]));
export function cloudErrorKey(error) {
  if (error.status === 401 && error.code !== 'INVALID_CREDENTIALS') return 'expired';
  return ({ INVALID_CREDENTIALS: 'wrongPassword', USERNAME_TAKEN: 'aliasTaken', BODY_INVALID: 'invalid', VALIDATION_ERROR: 'invalid', BACKUP_CONFLICT: 'conflict', BACKUP_NOT_FOUND: 'notFound', CSRF_INVALID: 'csrf', RATE_LIMITED: 'rateLimited', SERVER_UNAVAILABLE: 'unavailable', backupPassphraseWrong: 'wrongPassphrase', invalidImport: 'invalidBackup', invalidEncryptedBackup: 'invalidBackup', backupUnsupported: 'invalidBackup', backupCryptoUnavailable: 'crypto', backupPassphraseFormat: 'invalid' })[error.code || error.message] || 'requestFailed';
}

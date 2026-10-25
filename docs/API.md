# Bloom Express API

Base path: `/api/v1`. Successful responses use `{ "data": ... }`. Failures use `{ "error": { "code": "...", "message": "..." } }`; credentials, submitted values and stack traces are never reflected. All API responses have `Cache-Control: no-store`.

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| GET | `/health` | — | API and MongoDB connection status |
| POST | `/auth/register` | `{username,password}` | 201, alias profile and CSRF token; sets session cookie |
| POST | `/auth/login` | `{username,password}` | Alias profile and CSRF token; rotates this browser session |
| GET | `/auth/session` | — | Current alias profile and CSRF token, or 401 |
| POST | `/auth/logout` | Empty | Revokes current session and clears cookie |
| DELETE | `/auth/account` | `{password}` | Deletes account and its encrypted backup, revokes sessions |
| GET | `/diary/status` | — | `{hasBackup,revision,updatedAt}` |
| GET | `/diary/backup` | — | `{backup,revision,updatedAt}`, or 404 |
| PUT | `/diary/backup` | `{backup,expectedRevision}` | Saves encrypted snapshot; returns new status |
| DELETE | `/diary/backup` | `{expectedRevision}` | Removes encrypted snapshot; returns new status |

All diary routes and session/logout/account routes require the `bloom.sid` cookie. Authenticated mutations also require `X-CSRF-Token` from the current session response. The cookie is HttpOnly, SameSite=Strict, scoped to `/api`, expires after seven days, and is Secure in production. Only its SHA-256 hash is stored in MongoDB. The frontend keeps CSRF in memory; it stores neither session tokens nor passwords in browser storage.

Age group is selected in the React signup form and saved only inside the device diary and encrypted snapshots. The account endpoints continue to accept only alias/password. Plaintext `ageGroup`, date-of-birth, email and phone registration fields are rejected. On expiry, the existing account can sign in again; the server rotates session/CSRF credentials and retains the encrypted backup.

Aliases use `/^[a-z0-9_]{3,32}$/`; passwords use 12–128 characters and are salted scrypt hashes (`N=32768, r=8, p=3`). Password verification and registration share a limit of 100 requests per 15 minutes per IP, including account-deletion password checks. Reads and logout remain available when that limit is reached. Backup mutations allow 100 changes per 15 minutes per account. Counters are in-process. The password cost follows one configuration listed in the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt).

## Encrypted envelope

Generate this with `exportEncryptedBackup` in `frontend/src/services/storage.service.js`, before calling the API. The matching import function decrypts and validates the restored diary on the device.

```json
{
  "backup": {
    "format": "bloom-encrypted-backup",
    "version": 1,
    "cipher": "AES-GCM-256",
    "kdf": "PBKDF2-SHA256",
    "iterations": 310000,
    "salt": "<canonical base64: 16 bytes>",
    "iv": "<canonical base64: 12 bytes>",
    "ciphertext": "<canonical base64: ciphertext and authentication tag>"
  },
  "expectedRevision": 0
}
```

The JSON above describes the shape; its placeholders are not an uploadable fixture. The Postman collection contains a real encrypted synthetic diary.

No other envelope fields are accepted. Supported iteration counts are 100000–500000, ciphertext length is 16–5000016 bytes, and the serialized envelope is at most 6800000 bytes. Plain diary objects, extra plaintext fields, malformed Base64, unsupported algorithms and unsafe revision values are rejected. The server validates the envelope shape; it cannot authenticate/decrypt ciphertext or prove it contains a valid diary without the passphrase. The browser performs authenticated decryption and full state validation before restore.

Each account holds one encrypted snapshot in the same MongoDB document as the account. Clients do not supply a target user ID: ownership comes solely from the verified session. A write must match `expectedRevision`; saving/deleting increments that revision atomically. Deleting a snapshot retains the revision so an old upload cannot recreate a deleted backup. On 409, fetch status and require an explicit retry after review. Account deletion atomically removes the account and its payload; any residual session is unusable because authentication rechecks the account.

## Error codes

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `BODY_INVALID` | Invalid JSON/body, unsupported encryption metadata or extra fields |
| 401 | `AUTH_REQUIRED` | Missing, expired or revoked session |
| 401 | `INVALID_CREDENTIALS` | Incorrect sign-in or account-deletion password |
| 403 | `CSRF_INVALID` | Missing/wrong session CSRF header |
| 403 | `ORIGIN_FORBIDDEN` | Browser origin not explicitly allowed |
| 404 | `BACKUP_NOT_FOUND` / `NOT_FOUND` | No saved backup / unknown API route |
| 409 | `USERNAME_TAKEN` / `BACKUP_CONFLICT` | Alias unavailable / stale revision |
| 413 | `PAYLOAD_TOO_LARGE` | Request exceeds JSON limit |
| 429 | `RATE_LIMITED` | Wait for Retry-After before trying again |
| 503 | `SERVICE_UNAVAILABLE` | Database temporarily unavailable |

Auth JSON is limited to 16KB. Diary authentication and CSRF run before the large JSON parser. Browser origins must exactly match configured site origins; cookie authentication must use the same public origin as the frontend. Public local tracking does not call these APIs. No diagnosis, online AI, diary analysis upload or community endpoint was introduced.

# Express API validation

Bloom has two separate automated checks for the optional account/cloud-backup API. Both use fictional accounts and a disposable real MongoDB process on a random local port. They never use the application's configured `MONGODB_URI`.

From the repository root:

```sh
npm ci
npm run test:backend
npm run test:postman
```

The Node suite uses native HTTP requests against the Express application. The Postman suite uses the official Postman CLI and the importable `backend/postman/Bloom.postman_collection.json` collection. A Postman account is not required for the local collection run. Its results remain local and reporting events are disabled.

Verified locally on **25 October 2026** with Postman CLI **1.76.0** and real MongoDB **8.0.17**: **40 requests, 133 assertions, 0 failures**. Both generated accounts were removed at the end of the collection run. The companion Node API suite also passed; its detailed checks are listed below.

## Coverage

| Area | Node integration tests | Postman collection |
| --- | --- | --- |
| Connected health endpoint | Yes | Yes |
| Safe errors, security headers, malformed JSON and payload limit | Yes | Safe errors and no-store |
| Strict alias/password validation and injection rejection | Yes | Yes |
| Password hashing and session-token hashing in MongoDB | Yes | Cookie/session behavior |
| HttpOnly/SameSite cookie, current session and logout revocation | Yes | Yes |
| CSRF and origin enforcement | Yes | Yes |
| Encrypted-envelope validation; raw diary rejection | Yes | Yes |
| Encrypted upload/download and exact browser decryption | Yes | Opaque ciphertext round trip |
| Account isolation | Two independent HTTP clients | Two sequential cookie sessions |
| Optimistic revision conflicts | Concurrent and sequential writes | Sequential writes |
| Backup deletion and monotonic revision | Yes | Yes |
| Password-confirmed account deletion and session cleanup | Yes | Yes |
| Expired sessions and authentication rate limit | Yes | Covered by Node suite |

The API validates the envelope's format, supported encryption parameters, canonical Base64 encodings, and size. It cannot prove that an authenticated client's ciphertext represents a valid diary, because the server never receives the decryption passphrase. Decryption and diary validation happen in the browser.

## Local artifacts

The Postman CLI writes its detailed JSON report to `backend/test-results/postman-results.json`. This folder is ignored by Git. Reports contain fictional request bodies and ephemeral session cookies; do not publish production test reports containing real credentials.

To run the same collection in the Postman app, see `backend/postman/README.md`. The collection contains 40 ordered requests and deletes both generated accounts after its checks. The automatic runner independently verifies that no synthetic accounts remain before shutting down its disposable database.

## Scope of verification

These tests validate a local Express server and real local MongoDB. A deployed environment still needs its own HTTPS origin, private database credentials, and hosting configuration. These checks do not establish that a deployment or external database has been configured.

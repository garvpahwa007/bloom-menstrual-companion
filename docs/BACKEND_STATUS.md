# Backend progress and verification

Verified locally on **25 October 2026**, using Node.js 24.14.1, npm 11.11.0, MongoDB 8.0.17 and Postman CLI 1.76.0. The earlier backend/refactor is merged into `main`. The age-group signup and returning-login update is prepared on `feature/signup-age-relogin` for review.

| Step | Status | Delivered |
| --- | --- | --- |
| 1. Check the brief and choose the privacy boundary | Complete | Local essentials remain free/account-free; cloud is an explicitly requested exception to the original no-account/no-server rule |
| 2. Add the backend workspace and BloodLink-style modules | Complete | Express routes → controllers → services → Mongoose models/request validation |
| 3. Implement optional accounts | Complete | Alias/password registration, login, cookie sessions, CSRF, logout and password-confirmed account deletion |
| 4. Add private server persistence | Complete | One browser-encrypted snapshot per account; revision checks, ownership, backup deletion and account cleanup |
| 5. Connect React | Complete | English/Hindi cloud UI, explicit uploads, fresh-device restore with confirmation, locked-diary protection, deletion and recoverable errors |
| 6. Test the APIs in Postman | Complete | Importable collection/environment and official local CLI runner; 43 requests and 148 assertions passed |
| 7. Verify safety and regression behavior | Complete | 223 frontend tests and 17 backend tests passed; build, clean install and whitespace checks passed |
| 8. Document and package the source | Complete | Setup, endpoint reference, testing instructions and updated privacy descriptions |

The account screen now includes age-group selection at signup, a direct `/login` entry, and a returning-user flow after session expiry. Age remains in the diary/encrypted snapshot; aliases persist in MongoDB.

## Actual results

| Check | Result |
| --- | --- |
| Clean `npm ci` | Passed; audit reported zero known vulnerabilities at verification time |
| Frontend tests | **223 passed, 0 failed, 0 skipped** |
| Backend HTTP/MongoDB/security tests | **17 passed, 0 failed, 0 skipped**, including parent test groups |
| Official Postman CLI collection | **43 requests, 148 assertions, 0 failures**; both synthetic accounts deleted |
| Production frontend build | Passed |
| `git diff --check` | Passed |
| Full `npm start` server with MongoDB Atlas | Started successfully at port 3000; authenticated Atlas database connection verified |
| Live Atlas integration | 8 API requests passed: account persistence, encrypted backup, session expiry/re-login and cleanup; temporary synthetic account removed |
| HTTP routes/assets | `/`, `/cloud`, `/privacy`, `/calendar`, `/ask`, manifest, worker and mark returned 200 |
| API/static boundaries | Connected health 200; anonymous backup 401 JSON/no-store; private source/environment paths 404; same-origin request reached validation |

The Postman report is generated at `backend/test-results/postman-results.json` and deliberately excluded from Git and the source ZIP because detailed reports contain synthetic passwords and temporary session cookies. Human-readable coverage and import instructions are in [API_TESTING.md](API_TESTING.md) and [the Postman folder](../backend/postman/README.md).

## What was checked

Account validation rejects injection-shaped values and extra identifiers. Passwords and session tokens are hashed in MongoDB. Cookie/CSRF/origin checks, expired and revoked sessions, ownership between two accounts, wrong deletion passwords, malformed JSON, body limits, rate-limit route variants and early rejection of unauthenticated large uploads were exercised against a real MongoDB process.

Encrypted snapshots round-trip through the API and decrypt back to the exact synthetic diary. Tests inspect MongoDB for absence of its plaintext note/passphrase. Concurrent writes produce one success and one revision conflict; revisions remain monotonic after deletion. Full React tests verify explicit opt-in, no account-server calls in ordinary local use, cancellation without replacement, actual restore into an empty browser, and account management without replacing a PIN-locked diary. Local locking clears in-memory cloud authorization even if remote sign-out fails. Signup is tested through the full React context into an empty diary and an unlocked PIN-encrypted diary, preserving existing logs. Actual MongoDB session expiry followed by same-account sign-in preserves the exact encrypted backup and its age group; Postman covers the revoked-session/sign-in-again boundary.

## Boundaries

Browser visual inspection was unavailable because local browser use was disabled in Work settings. Frontend checks used React/JSDOM and automated accessibility checks.

This is a completed **local backend implementation and API test run**, not a production deployment or independent security audit. Atlas is configured for the local backend through ignored `backend/.env`; no live-site deployment was performed. Existing static hosting remains frontend-only; hosted cloud access needs the Node application, HTTPS and a private Atlas URI in that host’s environment. In-process rate limits need a shared store for multiple production instances, and hosting/database backup retention belongs to the operator.

The original no-server requirement is not literally satisfied by the combined optional-cloud version; the user explicitly chose that extension. Core account-free local behavior and the original medical safety rules remain. Independent clinical/native-Hindi review and the earlier real-device accessibility/PWA review remain outside this backend change; their existing limits are recorded in [VALIDATION.md](VALIDATION.md).

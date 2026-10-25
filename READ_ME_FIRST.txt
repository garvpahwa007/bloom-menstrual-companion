Bloom — Express backend and optional encrypted cloud backup, 25 October 2026

Use Node.js >=20.19 and npm. Run all commands from this project root.

Install:
  npm ci

The current private local environment uses MongoDB Atlas. With Atlas, run only
Express and React (or npm start for the built app); the db:dev helper is unnecessary.
See docs/BACKEND_SETUP.md for Atlas setup, credential handling and migration boundaries.

Three development terminals when using local MongoDB instead:
  npm run db:dev          MongoDB at 127.0.0.1:27018 (persistent development data)
  npm run dev:backend     Express API at localhost:3000/api/v1
  npm run dev:frontend    React/Vite at localhost:5173, proxies /api to Express

Open Privacy & Data -> Open Cloud Backup. Tracking and education still work without an account.
Cloud Backup uses an optional alias/password account. Open /login or Account & sign in.
Signup asks for an age group and saves it in the diary, not in the account request.
After session expiry, sign in with the same alias/password; the diary and backup remain. Uploads happen only when selected.
The browser encrypts the complete diary before upload. Keep a separate backup passphrase;
the server cannot recover it. Download, decrypt, then confirm before restoring local data.
Delete local data, cloud backup, and cloud account using their separate controls.

Checks:
  npm test
  npm run test:postman
  npm run build

Serve the built app + API with MongoDB running:
  npm start
  Open http://localhost:3000

Frontend-only development: npm run dev
Frontend-only production preview: npm run preview

The original brief required no accounts/server. Optional cloud backup is the user-requested
exception. Core local tracking, free access, Hindi/English and health safety remain intact.
The service worker caches only static app files, never account APIs or diary backups.
The legacy saheli.v1 local-storage key and local PIN encryption remain compatible.

See docs/BACKEND_SETUP.md, docs/API.md, docs/API_TESTING.md, docs/BACKEND_STATUS.md.
The local branch remains refactor/bloodlink-structure. Review this branch before merging. Backend deployment is separate.
Existing static Vercel/Netlify settings deploy local tracking only; full cloud hosting needs
the Node server, HTTPS, and an authenticated private MongoDB configured by its operator.

Health content still needs independent clinical and native-Hindi review before public health
use. Earlier device/accessibility review limits remain in docs/VALIDATION.md.

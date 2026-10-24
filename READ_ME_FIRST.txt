Bloom latest working source — 24 October 2026

Requires Node.js >=20.19 and npm. Verification used Node.js v22.13.0 and npm 10.9.2.

From this folder:
  npm ci
  npm run dev
Open http://localhost:5173

Latest automated checks:
  npm test       192 passed, 0 failed, 0 skipped
  npm run build  passed (Vite production build)
  git diff --check passed

To preview the production build, run `npm start`. Bloom now builds a production-only installable app-shell PWA and has offline shell fallback; the worker caches static app files only, never diary data or backups. External source links and reminders are not promised offline.

The privacy screen retains plaintext-compatible JSON/CSV and also offers a passphrase-encrypted backup. The backup passphrase is not recoverable if forgotten and is separate from the app’s four-digit PIN. The local-storage key `saheli.v1` remains unchanged intentionally, so existing saved diaries continue to work.

Primary public URL: https://bloom-period-companion.vercel.app/ (Vercel), configured by the user. The old https://saheli-menstrual-companion.vercel.app/ URL remains available as an alias. Both serve the Bloom app; the source canonical/Open Graph tags are being updated to the new primary URL. The private GitHub repository slug remains `garvpahwa007/saheli-menstrual-companion`.

A qualified clinician and native-Hindi medical/plain-language reviewer still need to check the health content and translations. Physical-device installation, screen-reader/VoiceOver/TalkBack, extensive focus/keyboard testing and actual production offline behavior remain to be checked. See `VALIDATION.md`, `MEDICAL_SOURCE_REVIEW.md`, `CLINICIAN_REVIEW_NOTE_PCOD.md` and `DEVICE_CHECKLIST.md`.

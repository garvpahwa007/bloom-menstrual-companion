Saheli latest working source — 23 October 2026

Requires Node.js >=20.19 and npm. Final verification used Node.js v22.13.0 and npm 10.9.2.

From this folder:
  npm ci
  npm run dev
Open http://localhost:5173

Final automated checks:
  npm test       173 passed, 0 failed, 0 skipped
  npm run build  passed (Vite production build)

To preview the production build, stop the development server, then run `npm start`.
The app is a static React/Vite frontend; there is no health-data API or server-side diary storage.

Production: https://saheli-menstrual-companion.vercel.app/ (Vercel). The homepage and direct /calendar and /privacy routes were verified. Core views had limited 360px checks in English/Hindi, including largest text and high contrast; the new Privacy & Data screen separately rendered at 360px in English/default text without horizontal overflow. The screen passed automated EN/HI semantic accessibility audits. These checks do not replace physical-device, screen-reader or clinical review. The project is connected to the private GitHub repository garvpahwa007/saheli-menstrual-companion; pushes to main trigger production builds. Vercel’s setting is Node 22.x, but the latest build selected Node 24.x because the package engine allows >=20.19; the build passed with a warning.

The FOGSI TOG Algorithms 4 booklet uses and expands both PCOD and PCOS but does not clearly resolve their relationship. The unavailable FOGSI adolescent FAQ is not cited. Qualified clinician and native-Hindi medical/plain-language reviews remain pending. See VALIDATION.md, MEDICAL_SOURCE_REVIEW.md, CLINICIAN_REVIEW_NOTE_PCOD.md and DEVICE_CHECKLIST.md.

This is source code, not an installable phone app. Logs remain in browser storage; the Privacy & Data screen offers JSON backup, CSV export, restore and deletion. JSON/CSV files are plaintext. There is no automatic cloud backup. See README.md for privacy limits and the three-minute demo.

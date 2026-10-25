# Bloom current progress

The user chose a fully offline chatbot in English, Hindi and Tamil. The Ask upgrade keeps questions out of servers, account storage and backups; see [OFFLINE_CHATBOT.md](OFFLINE_CHATBOT.md) for its features, tests and limits.

25 October 2026 backend extension: see [BACKEND_STATUS.md](BACKEND_STATUS.md) for the current checklist and actual validation. The dated frontend history below remains a record of the earlier build. Accounts/server storage are an optional, user-authorized change to the original no-server rule; the existing local essentials remain account-free.


> This report preserves the validation date and results of the earlier build. The source is now in `frontend/`, build output is `frontend/dist`, and this report is in `docs/`. See [STRUCTURE.md](STRUCTURE.md) and [REFACTOR_VALIDATION.md](REFACTOR_VALIDATION.md) for the local folder refactor; its results are recorded separately.

Updated 24 October 2026. Source uses Bloom branding, the supplied Bloom mark on Today, bilingual disclosures, Web Crypto encrypted backup/restore alongside compatible plaintext JSON/CSV, and a static-app-shell PWA. Build 2 added an Ask clinician reminder, cleared stale heavy-flow answers, strengthened date/Insights/Learn/reminder/settings UI regressions, and verified every app route at 1280px with largest text/high contrast. Current checks: **197/197 automated tests passed**, Vite production build passed, and `git diff --check` passed. See `BUILD_2_AUDIT.md` and `VALIDATION.md` for the user checklist, evidence and boundaries.

## Completed

The React/Vite app includes bilingual cycle tracking and cautious predictions; diary-derived observations; opt-in fertile-window estimates with uncertainty and non-contraception warnings; optional symptom ratings; clinician visit summaries; opt-in personal reminders; sourced pregnancy education and care guidance; privacy controls; local-only storage; bilingual Privacy & Data; backward-compatible JSON/CSV export and validated restore; and deletion controls. Ask covers common English/Hindi urgent paraphrases. Log/Calendar interactions have acceptance tests. Learn citations remain underlined. Welcome, headers, Today hero, page title, package metadata and visible lesson brand now use Bloom.

Encrypted backup files use a separate user-selected passphrase and PBKDF2-SHA-256/AES-GCM-256; passphrases are not stored or sent, and failed decrypt/cancel does not replace current data. Existing PIN encryption/storage key and legacy plaintext formats remain compatible. The production-only service worker precaches an allowlist of static app-shell assets only; its offline navigation fallback loaded the app at `/calendar` in Chromium. Cache inspection showed HTML, JS/CSS, manifest and generic icons only. Cache cleanup now removes only Bloom-owned service-worker caches.

## Deployment and remaining review

The primary public URL is https://bloom-period-companion.vercel.app/, configured by the user; https://saheli-menstrual-companion.vercel.app/ remains available as an alias. Production checks confirmed the new primary canonical/Open Graph metadata on both hosts and direct `/calendar` routing. Build 2 commit `05bf602` is pushed to `main`; the deployed bundle containing the new Ask clinician copy was verified on both hosts, and `/calendar` and `/ask` returned HTTP 200. The Vercel project name and private GitHub repository slug remain `saheli-menstrual-companion`; legacy local-storage key `saheli.v1` remains intentionally unchanged to preserve existing diaries. Build 1 production/PWA checks and their limitations remain recorded in `VALIDATION.md`. The Build 2 browser walkthrough was local Vite at 1280px, not a production or real-device test.

A qualified clinician must review PCOD/PCOS terminology, fertility-estimate wording and health content; a native-Hindi medical reviewer must check the Hindi health copy. Real Android/iPhone installation, TalkBack/VoiceOver, screen-reader behavior, extensive keyboard/focus checks, large-text/contrast review, multi-tab behavior, notifications and external links offline remain unverified. Automated axe/Chromium checks are not human or device review. See `DEVICE_CHECKLIST.md`, `MEDICAL_SOURCE_REVIEW.md`, and `CLINICIAN_REVIEW_NOTE_PCOD.md`.

Vercel is configured for Node 22.x but prior production builds selected Node 24.x under the `>=20.19` package range; consider pinning an upper major if required. Bloom does not diagnose, guarantee predictions, provide contraception advice, or promise background notifications. Offline support covers the static app shell only, not arbitrary external sources or reminder delivery.

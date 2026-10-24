# Saheli current progress

Updated 24 October 2026. The repaired lockfile supports a clean `npm ci`; the latest automated suite passes **183/183 tests**, and the Vite production build succeeds. The current evidence and boundaries are recorded in `VALIDATION.md`.

## Completed

The React/Vite app includes bilingual cycle tracking and cautious predictions; diary-derived cycle-pattern observations; opt-in fertile-window estimates with a clear uncertainty and non-contraception warning; optional mild/moderate/strong symptom ratings; clinician visit summaries; once, daily and selected-weekday personal reminders; sourced pregnancy education; medical guidance; privacy controls and local-only health-data handling, including the bilingual Privacy & Data screen with JSON backup, CSV export, validated restore and deletion controls. The latest update broadens English/Hindi urgent phrase routing in Ask and adds acceptance-level tests for complete log persistence/editing, calendar navigation and distinct overlapping markers. The feature extension and handoff record is in `TODO.md`.

Production is live at https://saheli-menstrual-companion.vercel.app/. The homepage and direct `/calendar` and `/privacy` routes were verified. Earlier production Chromium spot checks used synthetic data at 360 CSS pixels in English and Hindi, including core views at largest text and high contrast. The new Privacy & Data screen was separately opened live at 360 CSS pixels in English/default text; its local-data status and backup/restore/delete controls rendered without horizontal overflow. The screen passed automated English/Hindi semantic accessibility audits. Intensity persistence, selected-weekday reminders and no-third-party-request behavior were also checked. These are limited browser checks, not full acceptance testing or screen-reader review.

## Still outstanding

A qualified clinician must review the PCOD/PCOS explanation, fertility-estimate wording and broader triage/health content. A native-Hindi medical/plain-language reviewer should review the translations. Physical-phone testing, TalkBack/VoiceOver, exhaustive keyboard/focus checks, real two-tab shared-device behavior, actual notification delivery and local voice availability have not been verified. See `DEVICE_CHECKLIST.md`, `MEDICAL_SOURCE_REVIEW.md` and `CLINICIAN_REVIEW_NOTE_PCOD.md`.

Vercel is configured for Node 22.x, but this deployment used Node 24.x because the package engine range is `>=20.19`; Vercel logged an auto-upgrade warning and the build passed. Pin an upper major if a stable build runtime is required. The project uses the Vite preset, `npm ci`, `npm run build`, `dist`, and SPA routing, and is connected to the private GitHub repository; pushes to `main` trigger production builds. Optional live AI, community and Tamil remain deferred. The app does not claim diagnosis, contraception advice, clinical validation, full accessibility certification or background reminders.

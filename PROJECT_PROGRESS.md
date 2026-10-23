# Saheli current progress

Updated 23 October 2026. The repaired lockfile supports a clean `npm ci`; the final automated suite passes **173/173 tests**, and the Vite production build succeeds. The current evidence and boundaries are recorded in `VALIDATION.md`.

## Completed

The React/Vite app includes bilingual cycle tracking and cautious predictions; diary-derived cycle-pattern observations; opt-in fertile-window estimates with a clear uncertainty and non-contraception warning; optional mild/moderate/strong symptom ratings; clinician visit summaries; once, daily and selected-weekday personal reminders; sourced pregnancy education; medical guidance; privacy controls and local-only health-data handling, including the new bilingual Privacy & Data screen with JSON backup, CSV export, validated restore and deletion controls. The feature extension and handoff record is in `TODO.md`.

Production is live at https://saheli-menstrual-companion.vercel.app/. The homepage and direct `/calendar` and `/privacy` routes were verified. Production headless Chromium spot checks used synthetic data at 360 CSS pixels in English and Hindi; the tested views had no horizontal overflow, including largest text and high contrast. The inspected keyboard controls had accessible names, intensity persisted after reload, the selected-weekday reminder flow worked, and the tested interactions generated no third-party resource requests. These checks are limited browser evidence, not full acceptance testing.

## Still outstanding

A qualified clinician must review the PCOD/PCOS explanation, fertility-estimate wording and broader triage/health content. A native-Hindi medical/plain-language reviewer should review the translations. Physical-phone testing, TalkBack/VoiceOver, exhaustive keyboard/focus checks, real two-tab shared-device behavior, actual notification delivery and local voice availability have not been verified. See `DEVICE_CHECKLIST.md`, `MEDICAL_SOURCE_REVIEW.md` and `CLINICIAN_REVIEW_NOTE_PCOD.md`.

The Vercel project uses the Vite preset, Node 22.x, `npm ci`, `npm run build`, `dist`, and SPA routing. It is connected to the private GitHub repository; pushes to `main` trigger production builds. Optional live AI, community and Tamil remain deferred. The app does not claim diagnosis, contraception advice, clinical validation, full accessibility certification or background reminders.

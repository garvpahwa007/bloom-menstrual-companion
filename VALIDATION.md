# Bloom validation — 24 October 2026

## Automated results

- Environment: Node.js v22.13.0, npm 10.9.2.
- A clean `npm ci` succeeds after repairing the lockfile entries for `@emnapi/core@1.11.3` and `@emnapi/runtime@1.11.3`; npm reported 0 vulnerabilities in its audit output.
- Latest `npm test`: **184 passed, 0 failed, 0 skipped**. Coverage includes cycle-date calculations and prediction edge cases; cycle-pattern timing thresholds; fertility visibility safeguards; medical-guidance rules and regressions; pregnancy-mode separation and future-date behavior; symptom-intensity compatibility and aggregation; recurring reminders; storage, PIN encryption/reload and encrypted writes; concurrent writes; backup round trips; deletion; bilingual terminology matching; and the Privacy & Data screen’s navigation, EN/HI accessibility, PIN-status copy, export, restore and deletion controls. New Ask tests cover common English/Hindi pregnancy-plus-bleeding or severe lower-abdominal-pain phrasing and heavy-bleeding-plus-dizziness/light-headedness/fainting phrasing, including source IDs. New UI tests save, reload and edit a complete dated log; check month navigation, selected-date opening and protection of neighboring dates; exercise same-date symptom shortcuts; verify separate visible and accessible calendar markers for overlapping logged, predicted, fertile-window and symptom states; and confirm the Bloom logo/name appears in the Welcome and main app headers.
- Final `npm run build`: passed with Vite 6.4.5.

Automated tests validate implemented logic, not clinical accuracy, real-phone behavior, or full accessibility.

## Browser and deployment verification

- The Vercel production deployment is live at https://saheli-menstrual-companion.vercel.app/. The homepage, direct `/calendar` route and `/privacy` route returned HTTP 200; direct SPA refreshes work.
- Production headless Chromium smoke checks at a 360 CSS-pixel viewport exercised English and Hindi, the Today estimate and safety/source information, Calendar, diary-derived Insights, a symptom-intensity selection, and a selected-weekday reminder. Intensity remained selected after reload. These checks used synthetic data.
- The core pages tested at 360 CSS pixels showed no horizontal overflow in English or Hindi, including largest text and high contrast. A limited keyboard-tab smoke reached ten controls with non-empty accessible names. These are spot checks, not exhaustive rendered measurements or screen-reader testing.
- The new live `/privacy` screen was separately checked at 360 CSS pixels in English with synthetic data and default text: local-storage/PIN status, backup/export, restore and deletion controls rendered, with `scrollWidth` equal to the 360px viewport. The new screen also passed automated English/Hindi semantic accessibility audits; this is not a screen-reader test.
- A built Vite preview of the Learn lesson “Your cycle, in plain words” was rendered with synthetic data at 360px in English and Hindi. All five source anchors were computed as underlined, their existing destination URLs remained unchanged, and neither render had horizontal overflow. This verifies styling, not medical source validity.
- During the tested production interactions, the browser showed no third-party resource requests; external source links were not opened. This is a bounded check, not a guarantee against ordinary host access logs or a comprehensive security audit.
- Vercel’s project setting is Node 22.x, but this production build used Node 24.x because `package.json` permits `>=20.19`; Vercel emitted an auto-upgrade warning. The build succeeded. Consider bounding the package engine range if a fixed major version is required. The project uses the Vite preset, install command `npm ci`, build command `npm run build`, output directory `dist`, and SPA routing. It is connected to the private GitHub repository `garvpahwa007/saheli-menstrual-companion`; pushes to `main` trigger production builds.

## Coverage and remaining limits

- **Implemented and automated coverage:** local-date cycle calculations; irregular-cycle and fertility-estimate caveats; logs, calendar and insights; diary-derived symptom patterns; English/Hindi urgent Ask phrase coverage; medical guidance and support pathways; bilingual lessons and the 41-answer offline Ask library; complete-day persistence and calendar-to-log editing; distinct overlapping calendar markers; optional symptom intensity; once/daily/selected-weekday reminders; pregnancy-mode separation and 42 sourced weekly education cards; settings, PIN encryption, discreet mode, the bilingual Privacy & Data screen, backup/import/deletion; and static SPA routing.
- **Still requires real devices or people:** physical Android/iPhone testing; TalkBack/VoiceOver or other screen-reader review; exhaustive keyboard and focus-order testing; real two-tab shared-session behavior; actual notification delivery and local speech-voice availability; independent qualified clinical review; and native-Hindi medical/plain-language review. Browser emulation does not stand in for these checks.
- **Medical review caveat:** the cited FOGSI TOG Algorithms 4 booklet expands and uses both PCOD and PCOS but does not clearly settle whether the terms are synonymous or distinct, or how commonly PCOD is used. Bloom now reports that source boundary, uses PCOS as its main clinical term, and directs users with a PCOD-labelled report to ask the issuing clinician. The original FOGSI adolescent FAQ remains unavailable and is not cited. Independent review remains pending; see `MEDICAL_SOURCE_REVIEW.md` and `CLINICIAN_REVIEW_NOTE_PCOD.md`.
- Live AI, community, Tamil, reliable closed-browser reminders, full PWA/offline reopening, and clinical/accessibility certification are not part of this version.

Bloom does not diagnose, guarantee predictions, provide contraception advice, replace professional care, or promise background notifications. PIN protection has limits, exports are plaintext, and deleting in-app data does not delete downloaded backups.

## Reproduce local checks

From the project root, run `npm ci`, `npm test`, and `npm run build`. Use `npm run dev` for development or `npm start` to preview the Vite production build.

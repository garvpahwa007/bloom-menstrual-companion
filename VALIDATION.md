# Saheli validation — 23 October 2026

## Automated results

- Environment: Node.js v22.13.0, npm 10.9.2.
- A clean `npm ci` succeeds after repairing the lockfile entries for `@emnapi/core@1.11.3` and `@emnapi/runtime@1.11.3`; npm reported 0 vulnerabilities in its audit output.
- Final `npm test`: **170 passed, 0 failed, 0 skipped**. Coverage includes cycle-date calculations and prediction edge cases; cycle-pattern timing thresholds; fertility visibility safeguards; medical-guidance rules and regressions; pregnancy-mode separation and future-date behavior; symptom-intensity compatibility and aggregation; recurring reminders; storage, PIN encryption/reload and encrypted writes; concurrent writes; backup round trips; deletion; and bilingual terminology matching.
- Final `npm run build`: passed with Vite 6.4.5.

Automated tests validate implemented logic, not clinical accuracy, real-phone behavior, or full accessibility.

## Browser and deployment verification

- The Vercel production deployment is live at https://saheli-menstrual-companion.vercel.app/. The homepage and direct `/calendar` route returned HTTP 200; direct Calendar navigation/refresh was checked.
- Production headless Chromium smoke checks at a 360 CSS-pixel viewport exercised English and Hindi, the Today estimate and safety/source information, Calendar, diary-derived Insights, a symptom-intensity selection, and a selected-weekday reminder. Intensity remained selected after reload. These checks used synthetic data.
- At 360 CSS pixels, the tested pages showed no horizontal document overflow in English or Hindi, including the largest text setting and high-contrast setting. A limited keyboard-tab smoke reached ten controls; each inspected control had a non-empty accessible name. These are spot checks, not exhaustive rendered accessibility measurements or screen-reader testing.
- During the tested production interactions, the browser showed no third-party resource requests; external source links were not opened. This is a bounded check, not a guarantee against ordinary host access logs or a comprehensive security audit.
- The Vercel project uses the Vite preset, Node 22.x, install command `npm ci`, build command `npm run build`, output directory `dist`, and SPA routing for nested paths. It is not linked to a Git repository, so automatic deploy-on-push is not configured.

## Coverage and remaining limits

- **Implemented and automated coverage:** local-date cycle calculations; irregular-cycle and fertility-estimate caveats; logs, calendar and insights; diary-derived symptom patterns; medical guidance and support pathways; bilingual lessons and the 41-answer offline Ask library; optional symptom intensity; once/daily/selected-weekday reminders; pregnancy-mode separation and 42 sourced weekly education cards; settings, PIN encryption, discreet mode, backup/import/deletion; and static SPA routing.
- **Still requires real devices or people:** physical Android/iPhone testing; TalkBack/VoiceOver or other screen-reader review; exhaustive keyboard and focus-order testing; real two-tab shared-session behavior; actual notification delivery and local speech-voice availability; independent qualified clinical review; and native-Hindi medical/plain-language review. Browser emulation does not stand in for these checks.
- **Medical review caveat:** the cited FOGSI TOG Algorithms 4 booklet expands and uses both PCOD and PCOS but does not clearly settle whether the terms are synonymous or distinct, or how commonly PCOD is used. Saheli now reports that source boundary, uses PCOS as its main clinical term, and directs users with a PCOD-labelled report to ask the issuing clinician. The original FOGSI adolescent FAQ remains unavailable and is not cited. Independent review remains pending; see `MEDICAL_SOURCE_REVIEW.md` and `CLINICIAN_REVIEW_NOTE_PCOD.md`.
- Live AI, community, Tamil, reliable closed-browser reminders, full PWA/offline reopening, and clinical/accessibility certification are not part of this version.

Saheli does not diagnose, guarantee predictions, provide contraception advice, replace professional care, or promise background notifications. PIN protection has limits, exports are plaintext, and deleting in-app data does not delete downloaded backups.

## Reproduce local checks

From the project root, run `npm ci`, `npm test`, and `npm run build`. Use `npm run dev` for development or `npm start` to preview the Vite production build.

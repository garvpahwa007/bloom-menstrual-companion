# Bloom Build 2 checklist audit

Updated 24 October 2026. This audit checks the user's Build 2 requirements against the source and automated tests. “Done” means the requested behavior is implemented and covered where practical; “Partly done” identifies a remaining human, platform, or viewport limitation. Health-content correctness is not certified by software tests.

## Checklist results

| Requirement | Status | Evidence and remaining work |
|---|---|---|
| Safety: no diagnosis; menstrual predictions are labelled estimates and shown as ranges; the “can't be used to prevent pregnancy” warning; health sources; calm doctor cards; “Get medical help now” with 112/108; Tele-MANAS 14416 for very low mood/self-harm | **Partly done** | These safeguards, translated copy and source links are present in the app and tested. Source/FAQ/lesson/pregnancy facts are backed by source records; urgent response and mood/self-harm routes are present. A qualified clinician must still verify clinical accuracy and local appropriateness. Pregnancy mode separately displays an NHS-sourced estimated due date as one date, not a range; confirm with the clinician whether the user's “every prediction a range” rule is intended to include this distinct pregnancy due-date estimate. |
| Privacy: no account or app backend storing diary data; no third-party resources loaded by the app shell; PIN lock with encryption and forgotten-PIN warning; discreet mode; export, import and delete | **Done (code-side)** | Local storage/IndexedDB only for diary data, no account, same-origin app assets, PIN vault encryption and warning, neutral discreet title/reminders, plaintext JSON/CSV and encrypted backup, validated import and confirmed delete are implemented and covered. Browser inspection found zero cross-origin scripts/styles/images/fonts. External health-source links are ordinary links and load only if selected. This is not an independent security audit. |
| Local dates only; demo data or start fresh | **Done** | Date-only utilities and fresh/demo onboarding are present. Added regression coverage in `America/Los_Angeles`, `Asia/Kolkata` and `Pacific/Kiritimati`, including DST-boundary arithmetic and display. |
| Predictions: median of last six cycles; none before three cycles; range at least two days either side; irregular label; hide ovulation estimate for irregular cycles; “did you forget to log?” check | **Done** | Existing cycle-analysis rules and UI contain these safeguards; the suite exercises median/range/insufficient-history/irregularity and suspected missing-log cases. |
| Today, Log a day (including heavy-flow questions), Calendar with predicted days drawn differently | **Done** | Screens and marker distinctions are present. Added a UI transition test and fix: heavy-flow answers now clear when flow changes away from heavy or period is turned off, so stale answers cannot return or be saved when re-enabled. |
| Insights: cycle-history chart, average/range/regularity; patterns only after three cycles and with sample count | **Done** | Analysis has the threshold; added a UI regression for chart accessibility, summary cards and per-pattern “recorded in N of M cycles” sample counts. |
| When to see a doctor: all `redflags.js` rules, signs logs cannot show, cards with days/options, “Prepare for my visit” printout | **Partly done** | All rules and relevant source links are evaluated; general signs that cannot be logged, actionable cards and visit-preparation/print view are present. Qualified clinician review of thresholds, wording and options remains outstanding. |
| Learn: every lesson listed with Listen and a source | **Partly done** | All seven lessons expose a sourced detail view and a visible Listen control. Listening uses an available local browser speech voice; if none exists, the control is disabled with an explanation. Fully offline audio is not provided, so actual listening depends on the browser/OS voice availability. |
| Ask: 30+ answers in English/Hindi, suggestions, clinician line on worrying symptoms, “I don't know that one” | **Done (code-side)** | FAQ catalog and parity/source tests cover 30+ bilingual answers; suggested questions, unknown-answer fallback and safety routing are present. Added a localized clinician reminder directly with answers. Native-Hindi review remains a separate open item. |
| Reminders: all off by default and follow discreet mode | **Done (code-side)** | Daily/period defaults are off; custom/medicine and pregnancy check-up creation paths remain opt-in; reminder copy is neutral in discreet mode. Reminders are checked only while the app is open; browser/device delivery and background alarms are not promised. |
| Pregnancy mode separate from cycle predictions, with danger signs | **Done (code-side)** | Pregnancy is a separate opt-in mode; cycle/fertility estimates pause; sourced warning signs and 112/108 are shown. Clinician review remains open. |
| Settings: language, text size, contrast, read aloud, age group, tracked symptoms, privacy controls | **Done (code-side)** | Controls are present and persisted. Added a reload/remount regression across Hindi, largest text, high contrast, read aloud, age group, tracked symptoms and discreet mode. |
| All UI copy in translation files; 360px width at largest text; reload; no console errors | **Partly done** | English/Hindi dictionaries have equal keys; source scan found no literal user-facing JSX copy bypassing translation; state/reload tests pass; local browser console showed no runtime errors. The final browser route sweep was only available at 1280px (largest text/high contrast) and showed no horizontal overflow or controls outside the viewport. This run could not set that browser to exactly 360px with largest text. Earlier Build 1 localhost checks were recorded at 320px and 390px, but do not replace this requested exact-state check. |
| Revisit every screen for consistent spacing, buttons and wording | **Partly done** | Today, Log, Calendar, Insights, Guidance, Visit, Learn (catalog and lesson), Ask, Reminders, Pregnancy, Settings and Privacy were traversed at 1280px in largest-text/high-contrast mode; headings and controls rendered with no horizontal overflow/out-of-viewport controls. Exact 360px visual review and physical-device testing remain open. |

## Build 2 code changes in this audit

- Added the localized Ask-answer clinician reminder in English and Hindi.
- Prevented stale heavy-flow answers from resurfacing across flow/period state changes.
- Added cross-timezone local-date regression coverage.
- Added direct UI coverage for Insights history/statistics/pattern counts.
- Expanded Learn regression coverage across all seven lesson cards, their sources and Listen fallback.
- Extended reminder creation coverage for medicine/custom opt-in and check-up default-off.
- Added a Settings persistence/remount test spanning the requested controls.

## Verification

- `npm test`: **197 passed, 0 failed, 0 skipped**.
- `npm run build`: passed (Vite 6.4.5).
- `git diff --check`: passed.
- Browser route sweep at 1280×1100, largest text and high contrast: no horizontal overflow and no visible controls outside the viewport on all traversed screens.
- Browser console: React DevTools informational notice only; no runtime errors observed.
- Browser resource inspection: zero cross-origin scripts, stylesheets, images or font resources.
- Commit `05bf602` was pushed to `main`; Vercel served the Build 2 bundle and primary canonical/Open Graph metadata on both the primary Bloom domain and legacy alias. Direct `/calendar` and `/ask` returned HTTP 200.

## Still not finished

1. Obtain qualified clinician sign-off for safety thresholds, source selection, pregnancy content, PCOD/PCOS wording and prediction language; clarify whether pregnancy's estimated due date also needs a date range.
2. Obtain native-Hindi medical/plain-language review.
3. Perform the exact 360px viewport check with largest text enabled, then test real Android/iPhone installation, offline behavior, keyboard/focus, TalkBack/VoiceOver, contrast, notification behavior and source links.
4. Confirm local browser voice availability on target devices; Listen remains unavailable when the OS/browser supplies no local speech voice.

Automated checks and this browser walkthrough do not substitute for those reviews.

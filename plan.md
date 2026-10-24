# Bloom feature-extension plan

## Scope and behavior

Extend the existing React/Vite single-page app; do not duplicate its current cycle tracker, period estimates, diary, reminders, privacy screen, or health guidance.

1. **Cycle-pattern observations:** generalize existing summaries to other selected symptoms, using positive diary entries timed near period days or before a logged period. Require at least three distinct cycles. Describe repeated entries only—not causes, diagnoses, or predictions—and limit the denominator to cycles with entries in the relevant timing window.
2. **Fertility estimate visibility:** expose estimates on Today and Calendar while preserving age/opt-in, irregular-cycle, insufficient-history, pregnancy-mode, and suspected-gap safeguards. Use a broad estimated range supported by ACOG/NHS sources, label it uncertain, and state it cannot be used to prevent pregnancy.
3. **Detailed symptom tracking:** add optional per-symptom intensity (mild, moderate, strong), preserve existing symptom IDs and legacy unrated logs, keep values local, and include rated-day counts in visit summaries without inferring ratings.
4. **Reminder options:** allow custom/medicine reminders to be one-time, daily, or weekly on selected days; preserve existing records and default-disabled behavior. Explain reminders are checked only while Bloom is open.
5. **Privacy & Data screen:** retain bilingual device-local storage/PIN status, JSON/CSV export, validated restore and explicit delete confirmation. Explain plain exports are readable and unencrypted, data is not automatically uploaded or cloud-backed-up, and browser storage can be cleared.
6. **Learn source-link visibility:** keep all lesson and diagram citations visibly underlined with original destinations and keyboard-focus indicators in both languages.
7. **Compact Today and Bloom logo:** keep date/period logging, current cycle state, next estimate and uncertainty/irregularity caveat near the top. Replace the Today hero’s decorative flower with the supplied Bloom mark. Move history, optional check-ins and secondary insights into keyboard-accessible collapsible groups without removing guidance, estimates, or navigation.
8. **Encrypted backups:** add an explicit encrypted full-state backup/restore format alongside unchanged JSON/CSV. Use browser Web Crypto with versioned AES-GCM-256/PBKDF2-SHA-256 parameters and bounded import validation. Use a user-chosen passphrase distinct from the four-digit device PIN; do not store or transmit it. Authenticate, decrypt and validate before the existing replace confirmation. Wrong passphrase, corruption, cancel, or unsupported crypto must leave local state unchanged. Clearly warn that losing the passphrase makes that backup unrecoverable.
9. **Installable offline app shell:** provide a valid Bloom manifest, square icons and a same-origin service worker that precaches only the static application shell and content-addressed app code/assets. Offline navigation may fall back to the static SPA shell. Never cache diary state, backups, API/data responses, or arbitrary external content. Do not add background sync or push notifications. Update the worker without interrupting an in-progress diary.
10. **Accessibility and validation:** add semantic/keyboard/axe tests in English and Hindi for the new disclosures and encrypted-backup dialogs; test real-browser reflow, focus and contrast. Automated tests do not replace human screen-reader, clinician, native-Hindi, or physical-device review.
11. **Bloom identity and public URL:** use Bloom in visible app metadata and package documentation, preserve the legacy local-storage key to avoid stranding diaries, and rename the public project URL only when Vercel settings are available. Keep the current URL as an alias if the platform allows it.

## Implementation approach

Reuse `src/lib/cycle.js` for diary-derived observations and estimates; `src/components/Tracking.jsx` and `src/tracking.css` for Today and Calendar; `src/lib/storage.js` for state validation, local PIN vault and encrypted-file backup primitives; `src/App.jsx` and `src/components/Preferences.jsx` for dialogs/actions; `src/main.jsx`, `vite.config.js`, `index.html`, `public/`, and `vercel.json` for PWA registration and hosting; and `src/i18n/en.js`/`hi.js` for every new string. Preserve existing JSON/CSV compatibility. Diary data stays in browser storage and never enters service-worker caches or requests. No backend or remote analytics is introduced. A Git push alone does not prove a public URL or production deployment changed.

## Design and safety

Use Bloom’s calm, privacy-first style and English/Hindi voice. Backup passphrases are separate from the device PIN, never stored, and never sent anywhere. Validate wrapper version, algorithm, lengths and bounded KDF work before decrypting. A failed decrypt must never fall back to plaintext or write state. Continue to disclose that legacy JSON/CSV exports remain readable. The service worker may cache only fixed static files; avoid broad same-origin runtime caching. Clear only Bloom-owned caches on delete. The supplied Today logo is decorative and cannot replace status text. Collapsed details must keep every current feature, caveat, safety notice and action available to keyboard and touch users. Fertility estimates are uncertain, not evidence ovulation occurred, and not contraception advice. Human clinical/native-Hindi review and real-device/assistive-technology checks remain open until actually performed.

## Project structure

- `src/lib/`: cycle analysis, storage and backup crypto, reminder scheduling, visit-summary aggregation and PDF text model.
- `src/components/`: Today, Calendar, Insights, daily log, Learn, Reminders, Privacy & Data and Settings.
- `src/i18n/`: parallel English and Hindi labels and safety copy.
- `public/`: Bloom logo, PWA icons, manifest and static-host files.
- `tests/`: Node unit tests, synthetic React UI/accessibility tests and hosting configuration assertions.

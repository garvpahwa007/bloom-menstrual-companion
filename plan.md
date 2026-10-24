# Saheli feature-extension plan

## Scope and behavior

Extend the existing React/Vite single-page app; do not duplicate its current cycle tracker, basic period estimates, symptom selection, three diary-derived patterns, or local reminders.

1. **Cycle-pattern observations:** generalize the existing pattern summaries to other selected symptoms, using only positive diary entries timed near period days or in the five days before a logged period. Require at least three distinct cycles. Describe these as repeated entries, not causes, diagnoses, or predictions; keep the denominator limited to cycles with a diary entry in the relevant window.
2. **Fertility estimate visibility:** make the existing estimate easier to find on Today and Calendar while preserving age/opt-in, irregular-cycle, insufficient-history, pregnancy-mode, and suspected-gap safeguards. Use a broad estimated range that covers five days before through one day after the estimated ovulation range, supported by ACOG/NHS source links. Label it uncertain and explicitly not usable to prevent pregnancy.
3. **Detailed symptom tracking:** add optional per-symptom intensity values (mild, moderate, strong) to each day log. Preserve the existing symptom ID array and accept legacy records without ratings. Keep severity entries local and include rated-day counts in the clinician summary without inferring values for unrated logs.
4. **Reminder options:** let custom and medicine reminders be one-time, daily, or weekly on selected weekdays. Preserve existing reminder records and default-disabled behavior. Keep the existing limitation: delivery is checked only while Saheli is open, with no background alarm promise.
5. **Privacy & Data screen:** add a dedicated bilingual screen for device-local storage status, PIN-lock state and a link to its existing Settings controls. Provide JSON backup download, CSV export, and JSON/CSV restore using existing validation and confirmation behavior. Explain that exports are readable and unencrypted, diary records are not automatically uploaded, there is no automatic cloud backup, and browser storage may be cleared. Preserve the existing explicit delete confirmation.
6. **Learn source-link visibility:** persistently underline all source citation links within Learn lessons and lesson diagrams in both languages. Keep existing source destinations, palette, hover behavior and keyboard-focus indication.

## Implementation approach

Reuse existing modules: `src/lib/cycle.js` for diary-derived pattern observations and estimated date ranges; `src/components/Tracking.jsx` for Today, Calendar, Insights and daily-log UI; `src/lib/storage.js` for backward-compatible validation and JSON/CSV export/import; `src/lib/visit.js`, `src/lib/visit-pdf.js` and the visit screen for rated-day summaries; `src/lib/reminders.js` and `src/components/Preferences.jsx` for recurring schedules and the Privacy & Data screen; `src/App.jsx` for route/navigation; `src/i18n/en.js` and `src/i18n/hi.js` for all user-facing copy; existing component styles in `src/tracking.css`. Preserve JSON/CSV backup compatibility and encrypted local storage. No new server, dependency, remote analytics, or network transfer of diary data is introduced.

## Design and safety

Use Saheli’s existing calm, privacy-first visual style and English/Hindi voice. Prefer existing cards, buttons, and form conventions, with fieldsets/legends and accessible pressed states for intensity and weekday choices. The new data screen uses those same card and button patterns and makes local-only, unencrypted-export caveats visible beside the actions. Within Learn lessons and diagrams, source links are persistently underlined while retaining existing destinations and keyboard-focus indication. No new imagery is needed. Fertility estimates are calendar-based and uncertain, never a statement that ovulation occurred, and never contraception advice. Pattern summaries report only what the user logged. Reminder controls are opt-in and explain app-open-only delivery.

## Project structure

- `src/lib/`: pure cycle analysis, state validation, local reminder scheduling, visit-summary aggregation and PDF text model.
- `src/components/`: user-facing Today, Calendar, Insights, daily-log, Reminders, Privacy & Data, Settings, and visit summary views.
- `src/i18n/`: parallel English and Hindi labels and safety copy.
- `src/content/`: source catalogue used for links in the app.
- `tests/`: Node unit tests and synthetic React UI tests; existing tests remain authoritative for privacy, date, and pregnancy safeguards.

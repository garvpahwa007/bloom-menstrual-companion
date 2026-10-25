# BloodLink-style structure refactor — 25 October 2026

The team repository was cloned from `garvpahwa007/saheli-menstrual-companion` at `2cf1382` into a separate local checkout. The folder refactor is on `refactor/bloodlink-structure` and has not been pushed or deployed.

## Result

- The React application, public files, build helpers and tests live in the `frontend` npm workspace.
- Feature pages, feature services, shared UI, routing, diary context, constants, utilities, hooks and CSS assets follow the BloodLink frontend convention.
- Root commands remain `npm ci`, `npm run dev`, `npm test`, `npm run build` and `npm start`.
- Production output and the Vercel output directory are `frontend/dist`.
- Bloom's routes, existing browser-storage key, encryption, health content and feature behavior are retained. No health-data backend or new remote dependency was introduced.

See [STRUCTURE.md](STRUCTURE.md) for the folder map and ownership rules.

## Completed checks

| Check | Result |
| --- | --- |
| Clean root `npm ci` with the workspace lockfile | Passed; installation reported zero known audit vulnerabilities |
| Root `npm test` after that clean install | **197 passed, 0 failed, 0 skipped** |
| Root `npm run build` | Passed; Vite 6.4.5 emitted the application, static assets, manifest and PWA worker into `frontend/dist` |
| `git diff --check` | Passed |
| Local production HTTP checks | HTTP 200 for `/`, `/calendar`, `/ask`, `/privacy`, `/manifest.webmanifest`, `/sw.js` and `/bloom-mark.png` |
| Static asset identity and content | Served manifest matches `frontend/public/manifest.webmanifest`; worker response contains the expected Bloom app-shell worker |
| README and documentation local Markdown links | Passed |

The full suite includes React interaction and bilingual axe semantic checks, cycle/date/content tests, encryption and backup checks, reminders, visit summaries/PDFs and static-hosting/PWA configuration checks.

## Baseline calendar-test correction

The untouched clone initially passed 196 of 197 tests on 25 October. A regular-cycle UI fixture predicted its fertile window in the following month while the test asserted markers in the current month. The test now navigates to the estimated window's month and returns to Today before checking today's markers. Existing marker, accessibility and overlap assertions remain. No cycle-calculation or calendar product rule changed.

Other test edits update source paths and the expected hosting output for the new folder structure. Existing behavioral assertions were retained. The suite also detected missing imports while the shell was being split; those imports were corrected before the final clean-install run.

## Scope and verification limits

This refactor reorganizes the current team app; it does not add medical features or certify health content. Prior clinician/native-Hindi, physical-device, real notification, screen-reader and production PWA review limits remain in [BUILD_2_AUDIT.md](BUILD_2_AUDIT.md) and [VALIDATION.md](VALIDATION.md).

This turn's production checks were local HTTP smoke tests and automated React checks. They do not imply a fresh live-host deployment or a new physical-device/browser visual audit.

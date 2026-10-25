# Bloom

A free, private menstrual-health companion for women and girls, with a particular focus on people trying to understand irregular periods. It turns daily logs into clear estimates, useful questions and guidance on when to seek professional care.

The working prototype is designed for a student such as Ananya, 17, who prefers Hindi and may share a phone. It uses plain language and a mobile layout. Essential tracking, education and guidance work without an account. An optional Express/MongoDB extension provides accounts and browser-encrypted cloud backups.

## Project flow and status

**25 October 2026:** the local project now includes an Express API, MongoDB accounts, optional encrypted cloud backup, and a tested Postman collection. Start with [BACKEND_SETUP.md](docs/BACKEND_SETUP.md), [API.md](docs/API.md), and [API_TESTING.md](docs/API_TESTING.md). The original brief explicitly said no accounts or server; cloud backup is the user-requested exception to that rule. Account-free local tracking and the medical safety rules remain in place. Backend validation was local; the existing live site does not include this backend. Signup includes an age-group choice saved in the diary, while returning sign-in uses the same alias/password after session expiry. Open `/login` or Account & sign in; age is never sent as plaintext account metadata.

Historical verification on 24 October 2026 (before the folder refactor): after the lockfile repair, `npm ci` succeeded; **197/197 automated tests passed**, the production build succeeded, and `git diff --check` was clean. Coverage includes English/Hindi urgent Ask phrasing, dated diary save/reload/edit flows, calendar and Insights behavior, settings persistence, heavy-flow state transitions, encrypted backups and static-only PWA hosting/offline checks. The primary production address is [bloom-period-companion.vercel.app](https://bloom-period-companion.vercel.app/), and production checks confirmed its canonical/Open Graph tags; the previous Saheli address remains an alias. See [VALIDATION.md](docs/VALIDATION.md) for evidence and limits, and [BUILD_2_AUDIT.md](docs/BUILD_2_AUDIT.md) for the user's feature-by-feature Build 2 status and remaining reviews.

The project is now an npm workspace with the React app in `frontend/`, Express API in `backend/`, and supporting reports in `docs/`. The structural refactor is on the local branch `refactor/bloodlink-structure`; the published branch can be reviewed before merging into `main`. The 24 October results and production evidence above describe the earlier build. See [STRUCTURE.md](docs/STRUCTURE.md) for the code layout and [REFACTOR_VALIDATION.md](docs/REFACTOR_VALIDATION.md) for the refactor checks and their limits.

Follow the step-by-step checklist in [PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md). That file records implementation and actual validation results; this README does not imply that an unrecorded browser check or deployment has passed.

The user flow is:

1. Choose English or हिंदी and try the demo, or start fresh.
2. Open Today to see the current logged cycle and uncertain next-period range.
3. Log a day, including flow, symptoms, optional mild/moderate/strong intensity per selected symptom, pain, mood and private notes.
4. Review the calendar and insights for actual entries, cautious estimates, and repeated symptoms in diary-recorded timing windows.
5. Open doctor guidance and prepare a visit summary when useful.
6. Read a lesson or ask an offline question.
7. Open Privacy & Data to review local storage, export readable JSON/CSV or a passphrase-encrypted backup, restore a validated backup, or delete the diary.
8. Choose language, accessibility, PIN and reminder settings.
9. Optionally open Cloud Backup from Privacy & Data, create an alias-based account, and explicitly encrypt/upload a snapshot. Restore or delete it separately; daily logs never upload automatically.

## Stack and running locally

Bloom is the app identity. The root `bloom-workspace` package delegates to the `bloom-menstrual-companion` package in `frontend/`. The app uses React, Vite, Tailwind CSS and React Router, with plain JavaScript throughout. A production-only worker precaches static application files for offline shell access; it never caches diary records or backup files. The service worker does not make external links or reminder delivery available offline. Vite serves the development UI and proxies `/api` to Express on port 3000. Express can serve both the built frontend and API from one origin. Use Node.js **20.19 or later** and npm.

Run these commands from the project root, which contains the workspace `package.json` and shared `package-lock.json`:

```sh
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). This command is enough for account-free local tracking. For cloud backup, run `npm run db:dev` and `npm run dev:backend` in two additional terminals. The old `saheli.v1` local-storage key remains for existing diaries. See [the full setup](docs/BACKEND_SETUP.md).

Run automated checks (backend checks start a disposable real MongoDB):

```sh
npm test
npm run test:postman
```

Build and serve the production app:

```sh
npm run build
npm start
```

With MongoDB running, `npm start` serves the built app and API at port 3000. For a frontend-only static preview, use `npm run preview` at port 5173 and stop Vite development first. Web Crypto requires **localhost or HTTPS**; a plain HTTP LAN address may not support the PIN feature.

## Screens

| Screen | What it does |
| --- | --- |
| Today | Cycle day, next-period estimate, cautiously estimated phase when supported, recent context and quick logging. |
| Log a day | Period, flow, heavy-flow questions, symptoms, pain, mood, energy, sleep, medicines and private notes. |
| Calendar | Actual logged days, visually distinct estimated period dates and any supported fertile-range estimate; select a date to edit. |
| Insights | Cycle and period lengths, plus selected symptom observations near period days or before the next logged period, shown only after three distinct cycles with check-ins in that timing window. |
| When to see a doctor | Calm cards describing relevant logged dates, why a check may help and care options. |
| Prepare for my visit | Full-history cycles, symptom counts and rated-day intensity aggregates, pain and medicines, with a compact one-page PDF, complete summary JSON and print support. |
| Learn | Seven bilingual lessons, including PCOS/PCOD and first periods, with instructional diagrams and paragraph-level source attribution. |
| Ask | An offline chatbot with 41 sourced English/Hindi answers, greetings, related questions, bounded safety follow-ups and an optional diary summary calculated on the device. |
| Reminders | Optional check-ins and period estimates; custom/medicine reminders can repeat once, daily or on selected weekdays; dated check-up reminder. |
| Pregnancy | Confirmation-gated mode, estimated weeks/due date, 42 individual sourced week cards, warning signs and a check-up reminder flow. |
| Privacy & Data | Local-storage and PIN status, JSON backup download, CSV export, validated JSON/CSV restore and confirmed deletion. |
| Settings | Language, text size, contrast, age group, tracked symptoms, discreet mode and PIN controls. |
| Cloud Backup (optional) | Alias/password account, manual encrypted snapshot upload, confirmed restore, sign-out, backup deletion and account deletion. |

## Estimates and uncertainty

All stored dates use local `YYYY-MM-DD` strings. Cycle length runs from the first day of one period to the first day of the next. The current unfinished cycle is excluded.

The estimator uses at most the last **six complete cycles**. At least **three complete cycles** are required, which means four recorded period starts. Until then it asks for more history.

The centre is the median cycle length added to the latest period start. The margin is at least two days on either side and otherwise uses the recent spread (longest minus shortest cycle). A spread over seven days receives the prototype’s “irregular” label and two extra days of margin. These are product rules for presenting uncertainty, not diagnostic criteria.

An unusually long gap is checked as a possible missing log before being counted. Unresolved gaps pause estimates. Users can correct missing records or confirm that the long interval happened.

Ovulation is only an estimate around 14 days before the estimated next period. When the history supports it, the app shows an estimated fertile-range projection spanning five days before through one day after that ovulation range, consistent with ACOG's patient explanation. These dates do not confirm ovulation and cannot be used to prevent pregnancy. Fertility estimates are hidden for irregular cycles, insufficient history, unresolved long gaps and confirmed pregnancy; under-18 users need explicit opt-in. See [FERTILITY_FEATURE_SOURCE_REVIEW.md](docs/FERTILITY_FEATURE_SOURCE_REVIEW.md) for source-boundary notes.

Cycle-phase descriptions are also estimates. A logged period can establish a bleeding day; other phases are described cautiously only when the available history supports an estimate. Irregular or insufficient history does not receive a confident phase label. The app cannot confirm ovulation or a hormonal state.

Algorithm settings live in `frontend/src/config/app.config.js`; calculations live in `frontend/src/pages/cycle/cycle.service.js` and `frontend/src/utilities/date.helper.js`.

## Guidance and medical sources

This prototype does **not diagnose**, choose a medicine or dose, confirm pregnancy, or guarantee predictions. Missing alerts do not mean that a symptom is safe. People can seek care whenever they are worried; they should not wait for enough logs to produce a pattern.

The rule definitions and source links are in `frontend/src/constants/redflag.constant.js`. The main checks cover:

| Logged change | Guidance basis |
| --- | --- |
| Bleeding over seven days; frequent soaked products; large clots | [NHS heavy periods](https://www.nhs.uk/conditions/heavy-periods/) and [ACOG adolescent menstruation](https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign). |
| Short or long cycles, and a 90-day gap | [NHS irregular periods](https://www.nhs.uk/symptoms/irregular-periods/) and ACOG guidance. Adult range uses 21–35 days; under-18 range uses 21–45. Repeated patterns are highlighted without requiring users to wait before seeking care. |
| Bleeding between periods or after sex | [NHS unusual bleeding](https://www.nhs.uk/symptoms/vaginal-bleeding-between-periods-or-after-sex/). |
| Pain interrupting daily life or not relieved | [NHS period pain](https://www.nhs.uk/symptoms/period-pain/). Severe or worsening pain needs prompt assessment. |
| Heavy bleeding with tiredness, breathlessness or dizziness | NHS heavy-period guidance; this warrants assessment, not an app diagnosis of anaemia. |
| Sudden severe pain; very heavy bleeding with dizziness/fainting; concerning pain or bleeding when pregnancy is possible | [NHS ectopic pregnancy](https://www.nhs.uk/conditions/ectopic-pregnancy/) and [pregnancy bleeding](https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/). Emergency help: 112, or 108 where available. |
| Several consecutive very-low-mood logs or self-harm language | Support guidance with [Tele MANAS](https://telemanas.mohfw.gov.in/home?oai_link_source=model_response_hotline), [14416](tel:+9114416?oai_link_source=model_response_hotline). Help remains appropriate before any logging threshold. |

The guidance page also explains concerns logs cannot establish, such as no first period by 15, a changed longstanding pattern and any bleeding after menopause. It offers a government health centre, a gynaecologist or [eSanjeevani](https://esanjeevani.mohfw.gov.in/); choosing an external link opens that service separately.

All educational content and attribution are in `frontend/src/content/`. Important sources include [WHO PCOS guidance](https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome), the [RCOG/Monash international PCOS guideline](https://www.rcog.org.uk/guidance/browse-all-guidance/other-guidelines-and-reports/international-evidence-based-guideline-on-polycystic-ovary-syndrome/), FOGSI’s [Update in Managing PCOS in Women](https://www.fogsi.org/wp-content/uploads/2024/08/Binder_Update-in-Managing-PCOS-in-Women.pdf) and [TOG Algorithms 4 booklet](https://www.fogsi.org/wp-content/uploads/2024/11/TOG_4_Algorithm_Booklet.pdf), [National Health Mission menstrual-hygiene material](https://www.nhm.gov.in/images/pdf/programmes/mhs/Training_Materials/PDF_English/flipbook.pdf), and NHS/ACOG patient information. Lessons have an indexed source list for each paragraph and a short sourced instructional diagram. Source titles, lessons, questions and answers have English and Hindi versions. The TOG booklet expands PCOD and PCOS separately and uses both terms, but does not clearly establish whether they are synonymous or distinct, or how common PCOD use is. The blocked FOGSI adolescent FAQ is not cited. The lesson now presents this narrow source finding and tells users with a PCOD-labelled report to ask the issuing clinician. Content was researched on 22–23 October 2026; it has **not received independent qualified clinical or native-Hindi medical review**.

The late-period lesson discusses illness, travel and thyroid problems alongside the other possible contexts. It does not assume a journey or an illness explains a missed period. Travel is discussed as possible sleep/routine/stress context; a clinician assesses continuing changes.

The visit overview aggregates the complete logged history instead of selecting only the newest symptoms. Intensity counts include only days on which a selected symptom was rated; unrated days are not treated as mild. Its compact PDF and printable view may condense long lists for readability; the complete summary JSON retains all cycle, period, symptom-count, intensity, medicine-date and guidance-evidence data. Private diary notes and PIN information are excluded from the visit summary. The separate Settings backup export includes private notes.

## Privacy and practical limits

- Logs, calculations and questions are handled in the browser. Only the optional Cloud Backup page contacts the account API; choosing an upload encrypts the diary in the browser before sending it. MongoDB stores an alias, a salted password hash, hashed session tokens, timestamps and encrypted backup data. The backup passphrase and plaintext diary are never sent by this client. Server/hosting access logs can contain connection metadata.
- There are no third-party fonts, images, analytics or AI requests. Hosting still receives normal page/asset requests, and the host may retain access logs. External medical-source links make a request only when the user opens them.
- The optional four-digit PIN derives an AES-256-GCM key through PBKDF2-SHA-256, with a random salt and a fresh IV for each saved encryption. The PIN itself is not stored. A forgotten PIN cannot be recovered. Four digits provide limited resistance to offline guessing; this is not a hardened shared-device security product.
- JSON and CSV exports contain **unencrypted** personal data, including private notes. Store them privately. The Privacy & Data screen offers JSON backup, CSV export and confirmed restore. Import restores the exported application data; a file does not restore a forgotten encryption PIN. There is no automatic cloud backup, and browser storage may be cleared.
- Device deletion clears browser diary/app storage after confirmation. It does not delete cloud backups/accounts, downloaded exports, printouts, browser backups or another browser’s data. Delete cloud data separately in Cloud Backup. Sign out before leaving a shared device; local PIN protection does not guarantee server sign-out when offline.
- Discreet mode changes the visible name to “Diary”, uses a neutral icon and neutral reminder wording. It cannot hide browser history or an already shared screenshot.
- Listen uses available local browser speech voices. A suitable local voice may be unavailable, particularly for Hindi; the app should not use a remote voice as a silent fallback.
- Notifications require permission and an open running app. This prototype does not promise background or closed-browser delivery.

Custom and medicine reminders can be set for one date, every day from an optional start date, or selected weekdays; new personal reminders are off until enabled. Checks and notifications run only while Bloom is open, not as background alarms. Check-up reminders use a date and time chosen by the user; they do not invent an appointment schedule or book a consultation. Discreet mode uses neutral wording.

## Deploy from GitHub

Push this project folder to a GitHub repository, excluding `node_modules`, `.env` and generated local files. `package-lock.json` should be committed.

### Vercel: static frontend (local tracking only)

1. Import the GitHub repository as a new Vercel project.
2. Set the root directory to the folder containing this `package.json`.
3. Choose the **Vite** framework preset. Use build command `npm run build` and output directory `frontend/dist`. The root command builds the frontend workspace.
4. Keep `vercel.json` committed. Its rewrite serves `index.html` for app routes, including a direct visit or refresh on `/calendar`.
5. Deploy, open the HTTPS URL and check a nested route directly.

The frontend does not need API keys. These settings deploy the static `frontend/dist` output. See [Vercel’s Vite documentation](https://vercel.com/docs/frameworks/frontend/vite).

### Netlify: static frontend (local tracking only)

1. Import the GitHub repository as a new Netlify project.
2. Select this project folder as the base directory if the repo contains multiple projects.
3. Set build command `npm run build` and publish directory `frontend/dist`.
4. Keep `frontend/public/_redirects` committed. Vite copies it to `frontend/dist`; `/* /index.html 200` handles React Router refreshes.
5. Deploy and check the HTTPS URL and `/calendar` refresh.

See [Netlify’s SPA routing documentation](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).

These static hosting settings publish local tracking only; Cloud Backup reports the account server as unavailable. To host cloud backup, deploy the Node server and frontend together with HTTPS and a private MongoDB URI as described in [BACKEND_SETUP.md](docs/BACKEND_SETUP.md). The existing Vercel configuration does not deploy this backend.

## Simulated, limited and next

The demo profile is synthetic and generated relative to the device date. Predictions and pattern cards are exploratory summaries, not clinical validation. Ask is an offline chatbot built around 41 sourced bilingual answers, **not a generative AI model**. It adds greetings, related questions and cautious safety checks on explicit follow-ups. A diary-summary switch starts off; enabling it calculates a small summary locally without private notes or account details. Questions/replies stay in screen memory and are excluded from both exports and encrypted cloud backups. See [OFFLINE_CHATBOT.md](docs/OFFLINE_CHATBOT.md).

Pregnancy education has 42 separately authored weekly cards. Weeks 4–41 use the corresponding NHS week guides; weeks 1–3 use NHS Wales’ early-pregnancy information, and week 42 uses NHS overdue-pregnancy guidance. These describe typical stages and care topics, not an individual baby’s confirmed development or a prescribed local appointment schedule.

Real AI, moderated community and Tamil remain intentionally optional extensions from the original brief. A static-shell installable PWA is now implemented; production installation/offline behavior still needs real-device review. Robust closed-app background reminders are outside this version. Optional cloud backup now has an explicit upload flow and updated privacy descriptions. Before public health use, seek clinical review, native-language review, accessibility testing and a security assessment. The prototype does not claim clinical or full accessibility certification.

The primary Vercel URL is [bloom-period-companion.vercel.app](https://bloom-period-companion.vercel.app/); the previous [saheli-menstrual-companion.vercel.app](https://saheli-menstrual-companion.vercel.app/) also remains available as an alias. Both serve the Bloom app. The Vercel project remains connected to the GitHub repository `garvpahwa007/saheli-menstrual-companion`. See [VALIDATION.md](docs/VALIDATION.md) for evidence and limits.

See [DEMO.md](docs/DEMO.md) for a three-minute judge walkthrough and rehearsal checks.

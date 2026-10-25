# Bloom: brief alignment and differentiation

Based on the Problem Statement 5 and Build 1 material supplied in this chat, not an independently obtained event rulebook. The challenge explicitly permits a focused prototype and simulated data; the suggested features are not all compulsory. The detailed Build 1 is a more demanding implementation checklist. No point weights, judging guarantees or claims of worldwide uniqueness are assumed.

## Current brief alignment

| Area | Current project | Remaining evidence or improvement |
| --- | --- | --- |
| Tracking and insights | Local dates, uncertain cycle ranges, gap review, diary-derived symptom patterns, optional intensity ratings, and guarded fertile-window estimates | Target-device usability and clinical review; do not claim prediction accuracy |
| Responsible guidance | Dated guidance rules, care options, sourced lessons and offline FAQ; no live AI needed for the baseline | Clinician review, broader phrasing/safety evaluation; do not advertise diagnostic accuracy |
| Education and language | Seven bilingual lessons, diagrams, source references, 41 FAQ entries and 42 weekly pregnancy cards | Native-Hindi review and local voice availability |
| Privacy | No account, local logs, PIN encryption, discreet mode, backups and deletion | More robust shared-phone handling and usability testing; the PIN remains only four digits |
| Accessibility | Three text sizes, contrast, semantic tests and 360px Hindi checks | Screen readers, real devices, full rendered contrast and touch-target audit |
| Visit preparation | Full-history summary, PDF, JSON and source evidence; notes excluded | Let the user edit their questions and choose what to share |
| Reminders | Opt-in open-app notifications/banner fallback | Device delivery; do not promise closed-browser reminders |
| Submission | README, three-minute demo, static route configuration and live Vercel HTTPS deployment | Git connection for automatic deploy-on-push; external clinical and language review |

Bloom is a static frontend. Build from the project root with `npm run build` and deploy `frontend/dist`; no Express server or health-data backend is required. Loading static assets contacts the host, while diary records stay in browser storage.

## What competitors already offer

Do not pitch privacy, predictions or a PDF alone as a new invention:

- Clue offers cycle reports and controls over included cycles: https://support.helloclue.com/hc/en-us/articles/37230251880605-Which-cycles-are-shown-in-my-report-Can-I-adjust-this
- Flo describes an Anonymous Mode that separates identity from health data: https://flo.health/anonymous-mode
- drip describes on-device-only storage and open-source tracking: https://dripapp.org/privacy-policy.html and https://dripapp.org/

These are vendor-described capabilities checked on 22 October 2026, not independent audits or a complete competitor survey. The opportunity is the combination and execution for a specific user, not claiming none of these features exists elsewhere.

## Recommended product focus

**A free Hindi/English companion that helps someone with irregular cycles understand what their diary can show and prepare for a healthcare conversation, including when they share a phone.**

### 1. Explain the estimate — highest priority

Already present: ranges, irregularity and missing-log review. Add an explanation drawer showing the actual recent cycle lengths, which records were excluded, how the median and margin produced the range, and how a missing entry changes the result. Show observations separately from unknowns. Use a data-quality explanation rather than a medical risk score or unsupported numerical confidence percentage.

Why it helps: turns a broad range into an understandable result, supports irregular-cycle users, and gives judges a clear technical demonstration. Fits cycle tracking, responsible guidance, usability and technical execution criteria.

Acceptance: works identically in Hindi/English, remains local, shows no estimate below the minimum history, updates after a corrected missing period, and never implies diagnosis, fertility safety or certainty.

### 2. Make the visit summary belong to the user

Already present: full-history summary and PDF. Add editable questions, an optional account of effects on school/work/sleep, and a preview with explicit controls for what to include. Keep private notes excluded by default. The app can summarise user-entered impact; it must not infer a diagnosis or prescribe treatment.

Why it helps: strengthens the original brief’s care-preparation focus and creates a concrete outcome beyond another calendar. A local printable Hindi/English summary can support a conversation without requiring an online account.

Acceptance: preview and PDF agree, older relevant evidence remains available, excluded fields do not appear, and no recipient is contacted automatically.

### 3. Complete the shared-phone experience

Already present: manual PIN lock and discreet mode. Add opt-in locking on inactivity or when the app goes to the background, plus a neutral exit/cover screen that requires unlocking to return. Explain that this does not erase browser history, downloads or screenshots. Keep reminders neutral and never introduce a hidden or recoverable PIN claim.

Why it helps: directly serves the supplied shared-phone persona. Test it with two tabs, reload, wrong PIN, backup and deletion, and assess whether a first-time user understands it.

### 4. Add reliable offline reopening after installation

Already present: local content and local matching once loaded. Add an installable PWA that caches only the app shell/content, with deliberate update and deletion handling. Show the initial-download requirement. Do not cache exported health reports or upload logs. Do not claim background notifications until separately implemented and verified.

Why it helps: useful where connectivity is inconsistent; strengthens access and real-world usability. This is optional beyond the provided core challenge.

## Build order

1. Use the repaired version and complete outstanding acceptance evidence.
2. Add estimate explanations and test them with synthetic regular, irregular and missing-log cases.
3. Add personal visit questions and sharing controls.
4. Add background/inactivity lock; test shared-device workflows.
5. Add PWA offline reopening if time remains.
6. Rehearse a three-minute demo: uncertainty → recorded impact → care evidence → user-controlled visit summary → Hindi/privacy.

Avoid adding live AI, unmoderated community, diagnostic risk scores, medicine recommendations or more life-stage modules merely to increase feature count. Live AI and community were optional add-ons in the supplied material; they create additional consent, safety, moderation and backend work. Tamil is optional and should include native-language review if chosen.

## Validate the differentiation

Use a small usability exercise with consent and fictional data: can users interpret the estimated range, correct a missed log, prepare their own question, and protect the diary before returning a shared phone? Record task completion, errors and user wording. Do not present a small usability exercise as clinical validation or invent accuracy/impact statistics.

The four additions above are recommendations, not features added in this repair. Strong evidence of one useful end-to-end workflow is a better submission claim than an unsupported list of exclusive features.

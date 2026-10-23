# Three-minute judge demo

Use synthetic demo data. The current production URL is [Saheli on Vercel](https://saheli-menstrual-companion.vercel.app/). Rehearse there or with a local production build; keep real personal records out of the demo browser profile. Follow [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) for actual test status.

| Time | Action | Suggested narration and the problem it solves |
| --- | --- | --- |
| 0:00–0:20 | Choose “Try with demo data”; open Today. | “Saheli helps someone like Ananya understand her periods privately, in her own language. The demo has months of synthetic history. The next period is a labelled range; phase information stays cautious when cycles vary.” This addresses confusing predictions and anxiety. |
| 0:20–0:40 | Open Log today, choose one symptom and an optional intensity, then show Calendar and Insights. | “A selected symptom can be rated mild, moderate or strong without requiring a rating. Insights describe repeated diary entries only in time windows with check-ins; they do not infer a cause. The calendar marks actual periods separately from uncertain estimates.” |
| 0:40–1:10 | Open When to see a doctor; choose Prepare for my visit and download the PDF. | “This card shows the dates behind the concern. The visit overview aggregates the full history, so older symptoms are not lost. A compact PDF helps start the conversation; complete summary JSON keeps the full lists.” This connects tracking with a practical next step without naming a diagnosis. |
| 1:10–1:35 | Open Learn → “PCOS and the term PCOD”; then Ask “Why do I see both PCOD and PCOS?” If time permits, switch to हिंदी and ask “PCOD और PCOS दोनों शब्द क्यों दिखते हैं?” | “The lesson cites a FOGSI algorithm booklet that expands and uses both terms but does not clearly settle their relationship. Saheli uses PCOS as its main term and tells users to ask the clinician who issued a PCOD-labelled report what was meant. A label or scan alone is not a diagnosis. The local bilingual Ask library supports this terminology question in English and Hindi.” This counters misinformation without pretending to diagnose. |
| 1:35–1:55 | Switch to हिंदी, then show the largest text size and discreet mode. | “Language and readable controls matter for first-time users. Discreet mode shows Diary and neutral reminder wording for someone who shares a phone.” This addresses language barriers and everyday privacy. |
| 1:55–2:05 | Open Reminders and create a weekly custom reminder, leaving it off. | “Users can choose one date, every day or selected weekdays. Saheli does not promise background alarms.” |
| 2:05–2:25 | Show Network, then PIN setup and browser storage. | “The production app loads its own files. After clearing this list, logging and asking do not contact another site. The PIN encrypts the saved record; the PIN itself is not stored.” Show the encrypted envelope, without exposing a personal export. This demonstrates the local architecture and implemented privacy controls. |
| 2:25–2:45 | Export demo JSON, then Delete everything and confirm once. Reload to show the welcome flow. | “Users can take their records with them or remove this browser’s stored data. Exports are plaintext and need to be stored privately.” This demonstrates control rather than a privacy promise alone. |
| 2:45–3:00 | Close with the current scope. | “React and Vite provide a static interface; the browser handles health data. Pregnancy support includes 42 sourced week cards and user-chosen dated check-up reminders. The next steps are clinical and language review and more user testing.” This connects technical execution with realistic social impact. |

## Rehearsal checklist

1. Run `npm test`, then `npm run build` and `npm start` (Vite preview). Use the production build for the network demonstration; Vite development has local hot-reload requests.
2. Open a fresh dedicated browser profile and choose the demo. Check that Today shows an irregular estimate, the guidance page has cards and the visit PDF downloads. Verify an older flagged symptom or medicine appears in the complete visit summary JSON.
3. Check every route you will use, including a refresh on `/calendar` after deployment.
4. In DevTools Network, let first-party assets finish, then clear the list. Log a day and ask a local question. Explain the scope accurately: no third-party requests from these actions. Do not claim the initial asset requests never happened.
5. Keep source links closed during the network check; opening one is an intentional external request.
6. Test the demo PIN on localhost or HTTPS. Export synthetic data first. Remember the PIN or delete the demo data before the event.
7. Check the PDF, print preview, Hindi, large text and a 360px viewport. Rehearse a weekly personal reminder, leave it disabled, and explain that checks run only while the app is open. Keep a local copy running if venue internet fails.
8. End with deletion. To repeat the presentation, choose demo data again. Do not delete real data or rely on an untested import during the timed demo.

## What could interrupt the demo

| Possible issue | Prevention or recovery |
| --- | --- |
| No internet or unavailable hosting | Keep the built app and Vite preview running locally. A first online visit needs assets; full reload-offline/PWA support is not promised. |
| Port 5173 is already used | Stop the old development server, or use `PORT=4173 npm start`. |
| PIN does not work over a phone’s HTTP LAN URL | Use HTTPS or localhost; Web Crypto can be unavailable on insecure origins. |
| Forgotten demo PIN | Keep a synthetic export before setup. The app cannot recover it. Clear demo data only when safe to do so. |
| Browser refuses notifications | Show the in-app fallback; explain that reminders need an open app and permission. |
| No local Hindi speech voice | Read the lesson normally. Do not promise speech that the device does not provide. |
| Dates differ from the rehearsal | Demo history is relative to device date. Check the system clock and use the live range shown rather than memorising dates. |
| A phone viewport or large text overflows | Rehearse the actual browser at 360px and largest text. Record any remaining limitation in the progress checklist. |
| Printer or popup restrictions | Use the local one-page PDF download or visit-summary screen; a physical printer is unnecessary. Keep a synthetic PDF from rehearsal as a fallback. |
| A new question does not match | Show the honest fallback. The current Ask is a local library, not general-purpose AI. |
| A deployed nested route returns 404 | Confirm the Vercel rewrite or Netlify `_redirects` is deployed with the `dist` output. |
| Network panel shows extra traffic | Use the production build, disable extensions, close external source tabs and distinguish browser/host traffic from the application’s behavior. |

## Fifteen useful Ask checks

These are rehearsal inputs, not evidence of a completed test run. Record actual results in the validation log.

1. My period is 10 days late, am I pregnant?
2. Do I have PCOS?
3. I bleed through a pad every hour.
4. Which tablet should I take for cramps?
5. I feel like hurting myself.
6. मेरी माहवारी देर से आई है, क्या करूँ?
7. I am 14 and my periods are irregular.
8. I have not had a period for 3 months.
9. My period has lasted more than a week.
10. I bleed between periods.
11. Are there safe days to prevent pregnancy?
12. How do I use reusable cloth?
13. Does acne mean PCOS?
14. My baby is moving less than usual.
15. Can you tell me tomorrow’s cricket score?

Look for no diagnosis, no medication/dose selection, no guaranteed safe days, urgent support where relevant, the correct language and an honest unknown-answer response for unrelated questions.

Use the final validation report for the actual automated-test count and browser checks. This script describes the presentation flow; it does not claim a completed clinical review, native-Hindi review or full screen-reader certification. The Vercel URL above is public; the latest build’s nested Calendar route, English/Hindi lesson and Hindi Ask terminology response were directly checked. See `VALIDATION.md` for scope. Real AI, community and Tamil are optional future extensions; the static deployment serves the React/Vite build and has no health-data server.

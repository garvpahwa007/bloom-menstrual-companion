# Offline chatbot

The user chose an offline chatbot so menstrual-health questions do not leave the device. The upgraded **Ask** screen is available at `/ask`; no AI provider, API key, chatbot endpoint or conversation database is used.

## Features

- Greetings, help and thanks in English, Hindi and Tamil.
- Answers from the existing 41 sourced FAQ entries, with source links and related questions.
- Existing care/urgent/support responses take priority over normal conversation. Explicit immediate symptom follow-ups can be checked together; unrelated educational questions do not inherit prior urgency.
- An optional **Use my diary on this device** switch starts off. Enabling it allows a locally calculated summary of logged period dates, the recent complete-cycle count/average and a cautious estimated range when supported.
- Pregnancy mode, unresolved gaps, insufficient history and expired estimate windows retain their existing limitations. Demo summaries are marked fictional. No ovulation confirmation, diagnosis or medicine/dose recommendation is introduced.
- At most 20 reply pairs stay in screen memory. Questions are limited to 1500 characters. Clear, language changes, reload and in-app navigation remove the conversation; clear also stops local read-aloud and disables diary use.

## Data handling

The conversation belongs only to React screen state. It is not added to the diary context, `localStorage`, `sessionStorage`, IndexedDB, MongoDB, exports or encrypted cloud backups. No fetch request is made when asking, following a related question, or calculating a summary. The summary calculation projects only calendar fields; it does not read private notes, medicines, account identity, date of birth or PIN fields. Turning diary use off removes summary turns from the visible conversation.

The existing optional account/cloud-backup feature remains separate. Normal hosting still serves application assets. Clicking an external source link opens that source's website. Read-aloud uses only voices marked local by the browser; no remote voice is selected as a fallback. Clearing the chat does not erase screenshots, browser history or copies someone made outside the application.

## Code flow

`ask.page.jsx` keeps the short-lived transcript and diary permission. `chatbot.service.js` chooses conversational intents, checks bounded immediate safety context and calculates an allowed diary summary. Medical questions continue through the canonical `ask.service.js` and `content/faq.js`; they are not generated. Interface text stays in `i18n/en.js`, `hi.js` and `ta.js`.

The team’s Tamil update from `main` is integrated. Tamil safety replies/phrase coverage are completed, and inherited privacy text is aligned with the actual offline behavior. The summary cycle count matches the same recent window used by its average.

## Verification

Run from the project root:

```sh
npm run test:frontend
npm run build
```

Verified locally on 25 October 2026: **265 frontend tests pass**, including **33 chatbot-engine tests** and **nine full-App offline-chat tests**. Those checks cover all 41 FAQ entries in all three languages, safety priority and follow-ups, unrelated-topic isolation, actual localized diary buttons, uncertain estimates, private-field exclusion, state immutability, safe text rendering and English/Hindi/Tamil axe semantic checks.

The full-App tests bootstrap a synthetic signed-in session, then reject any fetch request during Ask interactions. Actual JSON and encrypted backup downloads are inspected/decrypted to show that chat text did not enter the diary. Conversation clearing, reload, language changes and local speech cancellation are also checked. The static-hosting/PWA checks and production build pass; chatbot content remains part of the cached static application files.

There is no chatbot API for Postman to exercise. Existing account/backup API tests are separate; the offline privacy boundary is tested in the frontend instead.

## Limits and review

This is a deterministic sourced chatbot, not a generative AI model. It may not understand unfamiliar wording or a long conversation, and its limited safety rules are not clinical triage or reassurance that a symptom is safe. The screen retains the clinician reminder and visit-preparation route.

Native-language medical review and qualified clinical review are still needed before public health use, especially for Tamil content and safety phrasing. Automated React/JSDOM and axe checks do not establish physical-device layout, full accessibility or clinical validation. Browser visual inspection was unavailable because local browser control is disabled in this Work session.

The existing warning categories retain their source links. During Tamil safety integration, the existing guidance was checked against [NHS ectopic-pregnancy symptoms](https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/), [NHS heavy periods](https://www.nhs.uk/conditions/heavy-periods/) and [NHS period pain](https://www.nhs.uk/symptoms/period-pain/). Support contact details remain those verified through the connected local-hotline tool.

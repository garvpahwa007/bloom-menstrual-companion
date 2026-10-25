# Ask: local-first chat and optional AI

The **Ask** screen remains local by default. It uses Bloom's sourced question library, care guidance, and safety checks without a server request. AI question sharing for English/Hindi is a separate, explicit opt-in. Tamil questions continue to use the existing local library. A second independent opt-in controls whether a limited cycle summary is included. Bloom is educational, under-18 suitable, concise, sourced, and non-diagnostic; it does not recommend medicines or doses or claim that any cycle days are safe from pregnancy.

## Privacy choices

- **Use my diary on this device** is a separate local-only choice for viewing a computed diary summary. It starts off and does not send diary data to a server.
- **Allow Bloom to send my question to OpenAI** starts off. Without that consent, no `/api/ask` request is made. Revoke it at any time; it is not remembered across Ask screen visits or language changes.
- **Also share a limited cycle summary** is separately off by default and only appears when AI question sharing is enabled. The client constructs exactly four allowlisted fields: average cycle length, regularity, last period date, and recognized symptom IDs from the latest completed cycle. The API independently sanitizes these fields. Notes, medicines, free-text diary entries, account details, names and identifiers are never included.
- Urgent symptoms, self-harm and very-low-mood concerns are routed through Bloom's local safety library before any network request. Obvious identifiers are also blocked locally. A provider failure falls back to the local answer.
- Questions, answers and conversation history remain only in screen memory. They are not added to localStorage, sessionStorage, IndexedDB, the account API, database, exports or encrypted backups. The AI route does not log or persist prompts or answers and sets OpenAI Responses API `store: false`. OpenAI still processes an opted-in request under its own service/data controls; `store: false` is not a promise of zero provider retention.
- The separate account and encrypted-cloud-backup feature is unchanged. Ask never uses that feature to store chat history or diary data.

## Server route

`api/ask.js` is a Vercel Node function. It accepts only a same-origin POST with `aiConsent: true`, bounds and validates question length, chooses at most two relevant built-in Bloom lessons, applies local safety routing again, minimizes the provider payload, and returns generic errors without echoing provider details. The OpenAI key is read only from server-side `OPENAI_API_KEY`; it must never be placed in frontend code or a `VITE_` variable. The root Vercel SPA rewrite explicitly excludes `/api/*`, so a missing function cannot silently return `index.html` as a successful JSON response.

## Configure the provider

1. In the existing Vercel project **bloom-menstrual-companion**, add `OPENAI_API_KEY` through **Project Settings → Environment Variables** for the intended deployment environments. Do not paste the key into chat, source files, GitHub or browser-exposed variables.
2. Optionally set `OPENAI_MODEL` to a model available to your OpenAI API project. The function's default is `gpt-4.1-mini`.
3. Redeploy after setting variables; Vercel applies updated values to new deployments. Until the key is configured, the UI keeps answering locally when the provider is unavailable.

The ordinary Vite dev server does not run Vercel Functions. For a real provider test, use `vercel dev` with a locally supplied server-only key or the deployed Vercel route after configuring the key. Only make a synthetic, non-health-data live request after the key is configured. Never use real health data in tests.

## Checks and evidence

Run `npm run test:ask`, `npm run test:frontend`, `npm run test:backend`, and `npm run build` from the repository root. The Ask API suite injects a mock fetcher and tests routing, consent, payload minimization, safety, provider failures and non-persistence. Mock tests do **not** establish that the real OpenAI provider is reachable or that the deployment has a configured key. A live provider test is a separate, synthetic check and should be reported only after it actually succeeds.

## Existing local chat behavior

Greetings, help and thanks remain supported in English, Hindi and Tamil. The local library's existing sourced answers, related questions, visit preparation, urgent phone actions, brief in-memory history limit, and local read-aloud remain. The existing offline follow-up context continues to route urgent symptom combinations locally; unrelated educational questions do not inherit earlier urgency. Local diary summaries remain available under their own on-device opt-in. Clinical review and physical-device accessibility review remain separate requirements; automated tests do not certify clinical accuracy.

# Bloom Ask AI setup

Bloom Ask is local-first. AI question sharing is available for English and Hindi, is off by default, and the optional cycle-summary share is a separate opt-in that is also off by default. Tamil questions continue through Bloom's local library. Without AI consent, the frontend must not call `/api/ask`. Urgent, self-harm and very-low-mood prompts are answered by local safety logic before any network call.

## Vercel configuration

In the existing Vercel project `bloom-menstrual-companion`, add `OPENAI_API_KEY` in **Settings → Environment Variables** for the deployment environments you intend to use. Keep it server-side: never put the value in source, GitHub, browser code or a `VITE_` variable. Optionally set `OPENAI_MODEL` to a model available to your API project; the function defaults to `gpt-4.1-mini`. Redeploy after changing variables so the deployment receives them.

The function lives at `api/ask.js`. Root `vercel.json` excludes `/api/*` from the SPA rewrite. Responses use `Cache-Control: no-store, private`; the OpenAI Responses request sets `store: false`. Questions, answers and conversation history are not logged or persisted by Bloom. An opted-in request is processed by OpenAI under its service/data controls; `store: false` is not a zero-retention guarantee.

If no key is configured or the provider fails, the client falls back to Bloom's local answer. Do not claim that live AI works until a synthetic live request succeeds against a deployment with the key configured. Vercel CLI was not available in the workspace at the time of this documentation update; public-route verification after deployment is separate from a provider test.

## What may be sent

With AI question sharing enabled, a request contains one question and `aiConsent: true`; it does not include conversation history. Only when the separate cycle-summary control is enabled does the client add an allowlisted summary containing average cycle length, regularity, last period date and recognized symptom IDs from the latest completed cycle. The API re-sanitizes the summary. Notes, medicines, free-text diary content, account details and identifiers are excluded. Obvious identifiers in a question are stopped before a provider request; this is a conservative check, not a complete PII detector.

The normal Vite development server does not run Vercel Functions. Use `vercel dev` with a synthetic test account/key or test the deployed route. Never use real health data in tests.

## Tests versus provider verification

`npm run test:ask` uses an injected mock provider fetcher. It verifies request routing, explicit consent, payload minimization, summary allowlisting, local safety, unsafe-output fallback, provider errors and no prompt logging/persistence. A mock test does not call OpenAI and does not prove credentials, provider availability, model access or Vercel deployment configuration. A real provider check must be a separate synthetic request made only after `OPENAI_API_KEY` is set; document it as a live provider test only if it actually succeeds.

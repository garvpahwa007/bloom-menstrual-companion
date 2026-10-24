# Bloom validation — 24 October 2026

## Automated results

- Environment: Node.js v22.13.0, npm 10.9.2.
- `npm test`: **192 passed, 0 failed, 0 skipped**.
- `npm run build`: passed with Vite 6.4.5; output includes `dist/manifest.webmanifest`, `dist/sw.js`, square standard/maskable Bloom icons, HTML and hashed application JS/CSS.
- `git diff --check`: passed.
- Translation key parity: English/Hindi each contain 552 keys and no missing counterparts.
- Automated coverage includes cycle/prediction safeguards; urgent English/Hindi Ask phrases; full log save/reload/edit; calendar navigation and co-occurring markers; fertility, reminders, pregnancy and source behavior; legacy JSON/CSV round trips; PIN encryption; encrypted-backup round trip with Unicode/private notes and fresh salt/IV; wrong-passphrase/tampered/unsupported wrapper non-destructive errors; encrypted-backup UI flow; cancellation before replacement; Today Bloom asset/disclosures; PWA manifest/icon/cache policy; Vercel static-file exclusions and headers; and bilingual axe audits including the encrypted-backup dialog.

## Local production-preview browser checks

The production Vite preview (`npm run build` then `npm start`) was opened in headless Chromium on localhost with synthetic/demo data. On a 390 CSS-pixel viewport, the Today hero rendered `/bloom-mark.png`, retained cycle status, a primary action, estimate, irregularity label and change caveat; its height measured about 348px. At 320 CSS pixels, the document showed no horizontal overflow; the hero measured about 432px. Four native `<details>` summaries exposed optional overview, recent days/insights, quick check-in, and Learn/privacy content. No page errors were reported.

The PWA worker registered once and created a versioned Bloom cache containing only `/index.html`, hashed JS/CSS, `/manifest.webmanifest`, favicon and generic Bloom artwork/icons. No diary-data storage or backup routes were present in the worker cache. After Chromium network emulation was switched offline, navigating directly to `/calendar` rendered the app shell via cached HTML and routed to Calendar. This is a localhost browser smoke test, not a real production-host/PWA installation test.

## Hosting and deployment status

The current source config excludes manifest, service worker and declared icons from the Vercel SPA rewrite, sets worker/manifest MIME and `no-cache` headers for Vercel and Netlify, and retains SPA fallback. Feature commit `4240c02` was pushed to `main`. On 24 October, a production Chromium check confirmed the updated Bloom title, Welcome artwork, Today mark and compact disclosures, encrypted-backup button, worker registration, zero page errors, no 390px horizontal overflow, and a working direct `/calendar` route. Production requests returned HTTP 200 for `/`, `/calendar`, `/manifest.webmanifest`, `/sw.js`, and `/bloom-app-192.png`, with the declared manifest/worker MIME types. The existing URL https://saheli-menstrual-companion.vercel.app/ has not been renamed because Vercel account access was skipped. The existing repository slug is unchanged. The legacy local-storage key `saheli.v1` is intentionally retained to avoid making prior diaries inaccessible.

## Remaining limitations

A qualified clinician must review PCOD/PCOS terminology, health guidance and fertility-estimate wording; a native-Hindi medical reviewer must check the Hindi health copy. Real Android/iPhone installation, screen-reader/TalkBack/VoiceOver behavior, full keyboard/focus order, large-text and contrast review, multi-tab behavior, actual production offline reopening/external-link behavior, browser-specific worker updates and actual reminder delivery still need human/device testing. Automated axe, Node tests and Chromium do not certify these areas.

Bloom does not diagnose, guarantee predictions, provide contraception advice, replace professional care, or promise background notification delivery. Legacy JSON/CSV exports remain readable/unencrypted. Encrypted backups use PBKDF2-SHA-256 with 310,000 iterations and AES-GCM-256; a forgotten passphrase cannot be recovered. Offline support is for the static app shell only; external sources and reminders are not promised offline.

## Reproduce local checks

From the project root, run `npm ci`, `npm test`, and `npm run build`. Run `npm start` to preview the production build. To validate deployment, test the actual hosted `/manifest.webmanifest`, `/sw.js`, all manifest icons, and direct SPA route reloads; then use browser offline mode to confirm app-shell fallback and inspect Cache Storage for static-only contents.

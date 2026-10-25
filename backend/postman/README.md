# Bloom API in Postman

Import `Bloom.postman_collection.json` and `Local.postman_environment.json` into Postman. Select the **Bloom — local synthetic testing** environment. Its `baseUrl` is `http://127.0.0.1:3000/api/v1`.

For a local development server, start MongoDB with `npm run db:dev`, then start Express in another terminal with `npm run dev:backend`, both from the repository root. Use **Run collection** and keep the 40 requests in their numbered order. The first request generates two random fictional aliases and an account password. Postman's cookie jar carries the HttpOnly session cookie; scripts retain the CSRF token for authenticated mutations. Both fictional accounts are deleted at the end.

For a repeatable run with a disposable database, use:

```sh
npm ci
npm run test:postman
```

The script starts a real local MongoDB process and Express on random local ports, then runs the official Postman CLI against the local collection file. It ignores `MONGODB_URI`, removes an inherited `POSTMAN_API_KEY`, and disables reporting events. No Postman sign-in is needed. The JSON report is written to `backend/test-results/postman-results.json` and is ignored by Git. The disposable database is removed after the run, including after a failure.

Latest local verification, **25 October 2026**: **40 requests and 133 assertions passed**, using Postman CLI **1.76.0** and MongoDB **8.0.17**. The runner also verifies the JSON report is complete, has no failed assertions or execution errors, and leaves no synthetic accounts behind.

The first run may download MongoDB 8.0.17 for your operating system. To use a locally installed compatible binary instead, set `MONGOMS_SYSTEM_BINARY` to its absolute executable path.

## What the collection checks

- Express/MongoDB health, safe errors, and `Cache-Control: no-store`.
- Account validation, duplicate aliases, wrong passwords, cookie sessions, and logout.
- CSRF and untrusted-origin rejection.
- Rejection of raw diary data, extra fields, and invalid encryption metadata.
- Upload/download of an actual encrypted fictional diary.
- Isolation between two accounts and stale revision conflict handling.
- Cloud-backup deletion, revision preservation, and full account deletion.

The fixture uses Bloom's browser encryption function with fictional demo data. The server receives an encrypted envelope, not the backup passphrase. The companion Node integration suite also decrypts the downloaded envelope and checks MongoDB for absence of the fictional plaintext note.

The account and passphrase in this collection are test data. Do not replace them with real personal credentials or health records. If a manual run is interrupted before cleanup, delete the generated `pm_a_…` / `pm_b_…` test accounts through the account API or discard your dedicated test database.

`build-collection.mjs` is the source for regenerating the JSON collection and encrypted fixture after intentional changes:

```sh
node backend/postman/build-collection.mjs
```

Changing this generator does not require regeneration for ordinary test runs.

# Run Bloom with Express and MongoDB

Use Node.js 20.19 or later and npm. Run commands from the repository root.

```sh
npm ci
```

For local development, open three terminals:

```sh
# Terminal 1: real MongoDB, bound to this computer only
npm run db:dev

# Terminal 2: Express, with automatic restart on source changes
npm run dev:backend

# Terminal 3: React/Vite, with /api proxied to Express
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173). Start fresh or try the demo, then open **Privacy & Data → Open Cloud Backup**. The Welcome and locked screens also offer account access; `/login` is a direct entry point and the app menu includes Account & sign in. An empty browser can restore a backup without first making a local diary. An existing PIN-locked diary must be unlocked before replacement.

The defaults need no secret files. MongoDB listens at `127.0.0.1:27018`, Express at `127.0.0.1:3000`, and Vite at port 5173. Local MongoDB data persists in the ignored `backend/.local-mongo/` folder. This unauthenticated, loopback-only database helper is for development. It is separate from BloodLink's database. On a new computer, the first database/test run downloads MongoDB 8.0.17; alternatively set `MONGOMS_SYSTEM_BINARY` to a compatible local `mongod` executable. Stop it with Ctrl+C before restarting it.

To override defaults, copy `backend/.env.example` to `backend/.env`. Keep that file private. A real MongoDB URI belongs in the backend environment, never in a `VITE_` variable or frontend bundle.

## Using MongoDB Atlas instead of local MongoDB

Set `MONGODB_URI` in ignored `backend/.env` to your private Atlas URI. Include the intended database name, such as `/bloom`, and keep the file private. The current local environment is configured to use Atlas; the credentials are not part of this repository.

```text
MONGODB_URI="mongodb+srv://<database-user>:<URL-encoded-password>@<cluster-host>/bloom?retryWrites=true&w=majority&appName=Bloom"
```

The example contains placeholders only. Configure an Atlas database user with access to the intended database and permit the backend host's IP in the Atlas access list. Do not put this URI into `frontend/.env`, a `VITE_` variable, a Postman collection, or Git. Rotate any database password shared in chat, then update the private backend environment and restart the API.

With Atlas, `npm run db:dev` is unnecessary. Run `npm run dev:backend` and `npm run dev:frontend` in two terminals, or build and run `npm start` to serve the complete app at port 3000. Check `/api/v1/health` after startup. Existing accounts/backups from the earlier local database remain there; switching the URI does not migrate them to Atlas. No local records were copied automatically.

A local live check verified signup, actual Atlas persistence, encrypted backup round-trip, expiry/re-login, and cleanup using a temporary synthetic account. This configuration applies to this computer's backend. A hosted backend needs its own private environment variable and Atlas host access; pushing source code does not configure hosting secrets.

For a single local server with the built frontend:

```sh
npm run build
# Keep npm run db:dev running in another terminal.
npm start
```

Open [http://localhost:3000](http://localhost:3000). `npm start` serves both the SPA and `/api/v1`. `npm run dev:backend` serves only the API; use Vite for the development UI. For frontend-only work, `npm run dev` works without starting any backend. A static production preview is available through `npm run preview`; its cloud feature needs the full server instead.

## Account and backup walkthrough

1. Choose an alias using 3–32 lowercase letters, numbers or underscores. No email, phone number or real name is requested. Use a 12–128 character account password. During signup, choose Under 18 or 18 or older. That age group is saved in the device diary, protected by the local PIN when enabled, and included inside any encrypted backup. The signup request sends only alias/password; no birth date or contact information is collected.
2. Choose a **different** backup passphrase of at least 12 characters. Save it privately; it is separate from the four-digit local PIN and the account password. No password/passphrase recovery is provided.
3. Select **Encrypt and save backup**. This replaces the account's previous snapshot. Future diary edits remain local until another explicit upload.
4. On another browser, open Cloud Backup, sign in, and enter the saved backup passphrase. Download/decrypt runs on that device; confirm separately before replacing its local diary.
5. When a session expires, sign in again using the same alias/password. The account and backup are retained; the local diary is not reset, and age is not requested again for login. On a fresh device, restore the encrypted backup to retrieve the saved age group and diary. Keep the age group current through Settings.
6. Sign out on shared devices. PIN lock clears in-memory cloud authorization and attempts remote sign-out when this page has established a session. Local locking never waits for network access; offline sign-out cannot be guaranteed.
7. Delete the cloud backup while retaining the account, or confirm account deletion with the current password. Device deletion is separate and leaves cloud data in place. Operator database backups and downloaded exports have their own retention outside this app.

## Checks and Postman

```sh
npm test
npm run test:postman
npm run build
```

Backend checks start a disposable real MongoDB on a random port. They do not connect to `MONGODB_URI`. The Postman runner uses the official CLI on the local collection, with fictional accounts, no sign-in, and no cloud result publishing. See [API_TESTING.md](API_TESTING.md) for evidence and [the Postman instructions](../backend/postman/README.md) to import/run the collection in the app.

## Full application hosting

Deploy this Node workspace with an authenticated private MongoDB and an HTTPS public site. Use install command `npm ci`, build command `npm run build`, and start command `npm start`. The build needs frontend dev dependencies; do not omit them before building. Set:

```text
NODE_ENV=production
MONGODB_URI=<private authenticated MongoDB connection URI>
PUBLIC_ORIGIN=https://your-bloom-site.example
```

The host can supply `PORT`. Production binds to `0.0.0.0` and uses Secure cookies. Exact allowed HTTPS origins can also be listed in `ALLOWED_ORIGINS`; wildcard CORS is not supported. Configure `TRUST_PROXY=1` only when the server sits behind one known, trusted proxy. Serve the frontend/API from the same public origin so SameSite session cookies and the self-only content security policy work. Do not expose the development MongoDB helper to the internet.

The existing Vercel/Netlify configuration publishes **only the static frontend**. It does not deploy this Express server or configure MongoDB. Deploying the API and database is separate from publishing this source branch. Application rate limits are per process; multiple instances need a shared rate-limit store. Production operation also needs an operator-owned retention/backups policy; app deletion removes the active account/backup, not copies retained outside this database.

## Hackathon criteria

The original pasted Build 1 brief explicitly required “No account, no sign-up and no server.” The user subsequently requested an Express backend and chose accounts/server storage. Cloud Backup is that authorized extension, so the combined version does not meet the old no-server rule literally. Core tracking, calculations, Ask, education, guidance, local PIN, exports and device deletion remain available without signing in. No prediction, medical guidance or health fact was changed by this backend work. Cloud snapshots are encrypted in the browser before upload, and the app makes no automatic diary uploads or analytics requests.

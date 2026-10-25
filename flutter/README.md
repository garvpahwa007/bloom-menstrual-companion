# Bloom menstrual companion — Flutter

A local-first Flutter port of the Bloom React frontend. It carries over Bloom’s plum/lilac palette, warm light surfaces, coral accents, brand mark, mobile navigation, cycle calculations, age-aware content, and offline educational catalogs. The project follows the reference Flutter layout: shared code in `lib/common/` and feature-owned code in `lib/features/<feature>/`.

## Feature coverage

- **Welcome and access:** English, Hindi, and Tamil onboarding; adult/under-18 profile choice; clean or fictional demo diary; PIN unlock and storage recovery.
- **Cycle and diary:** Today dashboard, full daily check-in, cycle/calendar views, cycle statistics, date-gap review, and clearly qualified estimates.
- **Health support:** clinician guidance and red-flag summaries, offline FAQ-style Ask support with safety escalation, age-ordered Learn content with optional device speech, and guarded pregnancy support.
- **Planning and reports:** local reminders, visit summaries and PDF/share actions.
- **Settings and privacy:** language, accessibility, discreet mode, tracked symptoms, optional PIN, JSON/CSV export, encrypted backup export/import, and confirmed local deletion.
- **Optional account/cloud:** register or sign in, inspect encrypted-backup status, upload a passphrase-encrypted snapshot with revision checking, decrypt and review a downloaded snapshot before replacement, and confirm backup/account deletion. No automatic diary sync occurs.

The health-support screens are informational and are not a diagnosis or substitute for clinical care.

## Data and privacy

Diary state is stored on the device in a versioned envelope using `shared_preferences`. Without the optional app PIN, that local envelope is not encrypted. When a PIN is enabled, Bloom derives a key with PBKDF2-SHA256 and encrypts the local diary with AES-GCM-256; the PIN itself is not stored. Unlocking is required before reading or changing that vault.

Encrypted backup uses a separate passphrase (at least 12 characters), also with PBKDF2-SHA256 and AES-GCM-256. The passphrase stays on the device; only the encrypted wrapper and revision metadata are sent to the backend after the user explicitly starts an upload. Restore decrypts and validates on-device, asks for confirmation before replacing the diary, and preserves an existing local PIN vault. JSON and CSV exports are plaintext; share them only through a channel you trust.

The API client keeps the session cookie and CSRF token in memory for the app session. It does not persist the account password, backup passphrase, cookie, or CSRF token. Signing in is required again after the app session ends. The account and cloud features are optional; diary logging and the other local features work without a configured backend.

## Backend configuration

Set `BLOOM_API_BASE_URL` to the backend origin, without `/api/v1`. For example:

```sh
flutter run --dart-define=BLOOM_API_BASE_URL=https://api.example.com
```

The client appends `/api/v1` itself. Use HTTPS outside local development. For an Android Emulator connecting to a backend on the host Mac, use the emulator host gateway (commonly `10.0.2.2`) rather than `localhost`. A physical device generally needs the host’s reachable LAN address and a backend listening on that interface.

## Run and verify

```sh
flutter pub get
flutter run
flutter test
flutter analyze
```

The tests cover diary serialization, PIN-preserving restore, API session-cookie/CSRF behavior, and a Bloom theme widget smoke test.

## Project layout

```text
lib/
  common/                 Theme, configuration, date helpers, content catalog
  features/<feature>/     Feature models, services, and UI pages
assets/
  content/react_content.json
  images/bloom-mark.png
test/                     Model, repository, API, and widget tests
```

The React/backend reference repository is not copied into this app folder. Configure the backend origin at run/build time rather than adding deployment credentials or user data to source control.

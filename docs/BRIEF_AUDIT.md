# Saheli — current brief alignment

> This report preserves the validation date and results of the earlier build. The source is now in `frontend/`, build output is `frontend/dist`, and this report is in `docs/`. See [STRUCTURE.md](STRUCTURE.md) and [REFACTOR_VALIDATION.md](REFACTOR_VALIDATION.md) for the local folder refactor; its results are recorded separately.

This audit reflects the current project snapshot on 23 October 2026. For reproducible test results and the exact scope of browser checks, see `VALIDATION.md`.

## Implemented

- A static React/Vite frontend with no account, health-data API, database, analytics or third-party requests from tested app interactions. Normal page and asset requests reach the hosting provider; user-selected external source links open separately.
- Local cycle and symptom records, calendar, uncertain period estimates, diary-derived symptom patterns, opt-in fertile-window estimates, optional symptom intensity, and clinician visit summaries.
- English and Hindi content, medical guidance and an offline question matcher; 42 pregnancy-week education cards; privacy settings, PIN encryption, discreet mode, backup/import and deletion.
- Custom and medicine reminder recurrence options for once, daily or selected weekdays. Reminder checks require Saheli to be open; closed-browser delivery is not promised.
- Vercel static deployment at https://saheli-menstrual-companion.vercel.app/ with direct `/calendar` route verification.

## Evidence and limits

The final automated suite passed 170/170 tests and the Vite build succeeded. A limited production headless-browser pass covered synthetic data at 360 CSS pixels in English and Hindi, including largest text and high contrast; the tested views showed no horizontal overflow. A short keyboard smoke inspected accessible names for ten controls. This is not an exhaustive WCAG assessment, screen-reader test, or physical-device test. See `VALIDATION.md` for exact scope.

PIN encryption, backup/import and deletion have automated logic coverage, but real two-tab behavior and every privacy-control flow have not all been verified end-to-end in a physical shared-phone context. Exports are plaintext. A four-digit PIN has limited resistance to offline guessing. Deletion does not erase downloaded files, printouts or other browser profiles.

## Human review still needed

A qualified clinician should review the PCOD/PCOS wording, fertility-estimate display and broader menstrual-health guidance. The cited FOGSI TOG Algorithms 4 booklet uses both labels but does not clearly establish whether they are synonyms or distinct diagnoses. The FOGSI adolescent FAQ is unavailable and not cited. A native-Hindi medical/plain-language reviewer should review the translated health content. No human review is claimed complete. See `MEDICAL_SOURCE_REVIEW.md` and `CLINICIAN_REVIEW_NOTE_PCOD.md`.

Physical Android/iPhone testing, TalkBack/VoiceOver, exhaustive keyboard/focus review, actual notification delivery and local speech-voice availability remain outstanding. Saheli does not diagnose, provide contraception advice, guarantee estimates, or promise background reminders. Live AI, community, Tamil and full PWA/offline reopening are deferred.

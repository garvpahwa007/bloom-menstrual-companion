# Final phone and human-review checks

Use fictional demo records only. Browser emulation is not a physical-phone or medical review. Limited headless Chromium checks at 360 CSS pixels are recorded in `VALIDATION.md`; complete the checks below with real devices and qualified reviewers.

## Android and iPhone — about five minutes each

1. Open the final HTTPS link. Choose demo data, then Hindi and the largest text size. Open every navigation item, a lesson, a care card and the visit summary. Check wrapping, scrolling and tap targets. Refresh Calendar and confirm it still opens.
2. On Android enable TalkBack, or on iPhone enable VoiceOver. Can you identify and activate Log today, each flow choice, the pain slider, calendar dates, care cards and language settings? Does chart narration include actual values? Record browser/device/OS, any unlabeled element and the steps to reproduce.
3. In Learn, try Listen and Stop in Hindi and English. If no local voice exists, the app should explain why Listen is unavailable. The app must not silently use a remote voice.
4. Reminders start off. Try the test reminder: a banner should appear. If you choose to grant browser notification permission, test again. If page-created notifications are unsupported, the banner remains the supported fallback. Close the app: this version does not promise closed-browser reminders.
5. In a separate fresh test diary, export a backup, set a test PIN, reload, try one wrong PIN and the correct PIN, and lock again. Never use your phone passcode as the test PIN. Check that no diary content appears while locked.
6. Delete that test diary after exporting. It should return to onboarding and remain empty after reload. Downloaded backups are separate files and are not deleted by this control.

Record: device, browser/version, language, test, pass/fail, observed behavior. Do not upload real health records or claim that an emulated test was run on a phone.

## Native-Hindi clarity review

Ask a Hindi-speaking reviewer to use the first-period guide, delayed-period lesson, one care card and a worrying FAQ answer. Check all content if preparing for public health use. Record wording they misunderstand and their suggested everyday phrasing. Medical translation must preserve urgency, uncertainty and the distinction between information and diagnosis.

## Clinical/source review

Use `MEDICAL_SOURCE_REVIEW.md` and the content files. Record reviewer name/qualification, date, exact paragraph or rule, supporting source section and required change. A source-link check or a software test is not clinical sign-off. The FOGSI adolescent FAQ remains unavailable; the separate FOGSI TOG Algorithms 4 booklet was reviewed, but a clinician should confirm that Saheli's narrow explanation of its PCOD/PCOS terminology is clinically fair.

# Medical source review — 22–23 October 2026

This records an automated retrieval check and a manual comparison by the coding assistant. It is not a clinician's review, certification or a claim that every Hindi phrase has been reviewed by a native medical translator.

## What was checked

The existing English text of all seven lessons, 41 FAQ answers, 42 individual pregnancy-week cards, pregnancy warning signs and guidance-rule implementation was inspected. Source files retain English/Hindi versions and source IDs. Seventy-eight source entries were attempted before the link repairs; duplicate entries can refer to the same document. The two NHM PDFs were downloaded from their official hosts and extracted locally. Full source copies are kept only in local QA working files, not shipped with the app.

| Content group | Supporting material checked | Result / limits |
| --- | --- | --- |
| Cycle definition, phases, uncertainty | NHS Periods and fertility in the menstrual cycle; NHS Periods | Supports basic explanations. Median, spread, minimum history, irregular display threshold and gap checks are prototype product rules, not medically validated prediction accuracy. The source describes variable ovulation timing; a fixed 14-day centre is only the brief's approximation. |
| Irregular/late periods and thyroid context | NHS Irregular periods, Missed or late periods, Underactive thyroid; ACOG adolescent guidance available through official indexed text | Core causes, changing patterns and thyroid context supported. Recent illness is information to discuss with a clinician, not an assumed explanation. The direct ACOG amenorrhea page blocked retrieval. |
| Adolescent ranges and assessment | ACOG Committee Opinion 651, official indexed text (direct fetch blocked) | Supports 21–45 days, a 90-day interval even once, over-seven-day bleeding, frequent soaked products and assessment if periods have not begun by 15. Under-18 age selection and three-cycle aggregation remain product choices; the app also offers care for a single unusual cycle. |
| PCOS signs, assessment and broad treatment types | WHO PCOS fact sheet; NHS PCOS/PMOS page; RCOG/Monash international PCOS guideline; FOGSI *Update in Managing PCOS in Women* and *TOG Algorithms 4* | Core signs, exclusion of other causes and individualised clinician-led care are supported. A FOGSI algorithm booklet expands and uses both PCOD and PCOS, but does not clearly establish whether the terms are synonyms or distinct diagnoses, nor how commonly users encounter PCOD. The linked FOGSI adolescent FAQ remains inaccessible. The app retains the safeguard that an app or scan alone cannot establish a diagnosis. |
| Cramps, pain and heavy bleeding | NHS Period pain, Heavy periods and Pelvic pain | Main symptom/care statements supported. Numeric severe-pain trigger is a product triage choice. A coin comparison is approximate; FAQ also states about 2.5 cm. |
| Pads, cups and cloth | NHS Periods; NHS Wales toxic shock prevention; NHM ASHA induction module, printed page 101; NHM hygiene flipbook, printed pages 10–11 | Replaced a missing GOSH PDF link with accessible official information. Cloth washing/drying/storage and product instructions/hand hygiene are supported. The app does not choose a product or prescribe an emptying interval. |
| First-period guide and colour | NHS Wales Periods/Starting your periods; ACOG adolescent guidance | Replaced the inaccessible first-period FAQ link with NHS Wales. Red/brown first bleeding, preparation, variable early cycles and care guidance are supported. |
| Mood/PMS | NHS PMS; official hotline connector result | PMS symptom/support statements supported. Corrected the generic low-mood FAQ so it no longer invents a history of user logging. The three-day alert is a product trigger, not a diagnosis or a requirement to wait for help. |
| Pregnancy test/dating/care | NHS Doing a pregnancy test, Due date calculator, Ultrasound scans and Antenatal care | Test timing and uncertain dating supported. The 280-day calculation follows Build 1 and does not replace a scan or clinician dating. No UK appointment schedule is imposed on Indian users. |
| Pregnancy weeks 1–3 | NHS Wales early pregnancy guide | Dating convention, preparation for ovulation and implantation description supported. |
| Pregnancy weeks 4–12 | Corresponding NHS weekly guides | Compared external appearance, nervous-system development, nausea, blood volume/thirst, placenta, emotions, booking discussion, tests and bump variability to their corresponding guides. |
| Pregnancy weeks 13–20 | Corresponding NHS weekly guides, plus NHS scans | Compared womb growth, appetite, balance, results discussion, early movements, dizziness, ligaments and scan education. Timing remains typical education, not an individual prediction. |
| Pregnancy weeks 21–28 | Corresponding NHS weekly guides, plus pregnancy headache guidance | Compared developing actions, stretch marks, sleep/wake patterns, birth plans, swelling, balance, digestion and third-trimester heartburn. |
| Pregnancy weeks 29–36 | Corresponding NHS weekly guides, plus pregnancy pain guidance | Compared disturbed sleep, dreams, growth measurement, position, practice tightenings, lightening, colostrum and professional turning options. |
| Pregnancy weeks 37–42 | Corresponding NHS weekly guides, NHS labour/bleeding/headache/induction pages | Compared preparation/contact, post-birth warning awareness, show, labour stages and overdue-care discussion. No instruction to wait until a particular week before seeking help. |
| Pregnancy warning signs | NHS Pregnancy symptoms you need help for, bleeding/headache/labour pages; Newcastle Hospitals reduced movements | Supports prompt contact for listed signs. Reduced movement is deliberately not withheld until week 28; source says not to wait after a change in usual movements. |
| Emergency/care contacts | Official Indian emergency-service and NHM ambulance pages; eSanjeevani link; hotline connector | Emergency/contact information checked as service information, not a guarantee of local availability or a booked consultation. External sources are opened only by user choice. |

## Corrections in this pass

- Replaced the missing period-product PDF reference; added an explicit product-safety source.
- Replaced the blocked first-period reference with an accessible official NHS Wales guide.
- Used the official emergency-service URL without its failing `www` prefix.
- Removed an invented “you logged” claim from the general low-mood FAQ in both languages.
- Fixed future bleeding records affecting long-period guidance and an explicitly off period retaining a heavy-flow interpretation. Regression tests cover both.

## Still open

1. The FOGSI adolescent FAQ remains unavailable and is no longer cited. One official FOGSI algorithm booklet establishes that PCOD appears in FOGSI material, but its usage leaves the relationship to PCOS unclear. Qualified clinician review is still needed to confirm whether the app’s source-based explanation is useful and clinically fair.
2. Independent qualified clinical review, especially triage wording and product thresholds.
3. Native-Hindi medical/plain-language review of every translated statement.

Source presence, successful retrieval and source comparison are separate checks. A failed retrieval was not recorded as a successful factual review. Use DEVICE_CHECKLIST.md for sign-off fields and real-device checks.


## Terminology source review — 23 October 2026

The linked FOGSI adolescent FAQ at `https://www.fogsi.org/wp-content/uploads/committee-2020-activities/fogsi-faq-for-adolescent.pdf` remains blocked/unavailable for verification and is not cited in the app. The official FOGSI [Update in Managing PCOS in Women](https://www.fogsi.org/wp-content/uploads/2024/08/Binder_Update-in-Managing-PCOS-in-Women.pdf) uses PCOS as its subject and discusses adolescent assessment. A separate official [FOGSI TOG Algorithms 4 booklet](https://www.fogsi.org/wp-content/uploads/2024/11/TOG_4_Algorithm_Booklet.pdf) expands PCOD as “polycystic ovarian disease” and PCOS as “polycystic ovarian syndrome” in its glossary. It lists “Can be PCOD” in an ovarian-cyst algorithm and has a separate PCOS section describing a multisystem syndrome. This confirms both labels appear in one FOGSI booklet, but does not clearly establish whether they are synonyms or distinct diagnoses, or how often users encounter PCOD.

The [WHO PCOS fact sheet](https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome) was also read. It supports the PCOS name, possible irregular periods/acne/hair-related signs, and that diagnosis involves clinical criteria and excluding other causes. It does not settle the local PCOD terminology.

**Updated content action:** the lesson and offline Ask now attribute both expansions to the specific FOGSI booklet, state that it does not clearly resolve their relationship, use PCOS as Saheli’s main clinical term, and advise users with a PCOD-labelled report to ask the issuing clinician what was meant and assessed. The broader unsupported frequency claim and slash-style title were removed. This is an evidence-based editorial revision, not clinician approval. Independent clinician review and native-Hindi medical/plain-language review remain outstanding.

# ARR Special Pops → PRISM Caseload Import

Import is **browser-only**. Real student CSV files must never be committed to GitHub.

## Source spreadsheet

- **Workbook:** `25-26 ARR - Special Pops - Master SPED Spreadsheet - By Grade`
- **Export:** File → Download → CSV (current sheet)
- **Live app:** Student Tiles → **Import CSV**

## Expected columns (header row)

The importer finds the first row whose first cell is `Name` and that also includes `Case Manager` and `Grade` (teacher-availability rows above the header are skipped).

| Column | Maps to |
|--------|---------|
| Name | Student display name (`Last, First (Nick)` → preferred first/nick + last) |
| Case Manager | `caseManager` / `provider`; program label Mod / ILC / 2e / SLP |
| IEP Date | `iepDue` (ISO date); drives On Track / Upcoming / Overdue |
| Re-evaluation Date | `reevalDue` |
| Grade | `K`, `Gr1`–`Gr5` |
| Teacher | `teacher` |
| New Scheduled Meeting Date | `meetingDate` |
| SLP, OT, PT, MH, NSS, ELA, Nurse, DHH, Vision | Related-service flags (`TRUE` → discipline list). **`ELA=TRUE` also sets `hasMLL`** |
| BIP | Adds `Behavior` when `TRUE` |
| Fall 2026 Evals | `fallEval` boolean |
| 504 / Section 504 / Has 504 *(optional)* | Sets `has504` when `TRUE` (does not break import if missing) |
| 504 Only / No IEP *(optional)* | When `TRUE`, sets `hasIEP: false` (ARR SPED sheet defaults to `hasIEP: true`) |
| 504 Review Date / 504 Date *(optional)* | `section504Due` |
| 504 Impairment / Impairment *(optional)* | `section504Impairment` |
| Home Language / Primary Language *(optional)* | `homeLanguage` |
| ELD Level / ELD *(optional)* | `eldLevel` |
| Interpreter / Interpreter Needed *(optional)* | `interpreterNeeded` |

## Program flags

Every student record may include:

| Flag | Meaning |
|------|---------|
| `hasIEP` | IDEA IEP (default true for ARR SPED import) |
| `has504` | Section 504 plan |
| `hasMLL` | Multilingual / EL learner |

Student Tiles filter chips: **IEP / 504 / MLL**. Enable the 504 Plans and Multilingual Learners tabs under **Admin → Module toggles**.

- Key: `localStorage.prism_students_v1`
- Meta: `localStorage.prism_caseload_meta_v1` (file name, import time, count)
- **Restore Demo** clears imported data from this browser only

## What is not imported

Goals, accommodations, interests, triggers, and clinical notes are not on this sheet. Enrich remains the system of record; PRISM leaves placeholders until those fields are entered in-app.

## FERPA / git hygiene

Do not add real caseload exports under the repo. Patterns are gitignored (e.g. `*Special*Pops*.csv`, `student.export*`, ALP/BIP student PDFs, `local-data/`). Demo students in `deploy/index.html` are fictional only.

See also: [caseload-enrichment-import.md](./caseload-enrichment-import.md) for parent/contact, ALP, and BIP doc imports.

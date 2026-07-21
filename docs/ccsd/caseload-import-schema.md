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
| SLP, OT, PT, MH, NSS, ELA, Nurse, DHH, Vision | Related-service flags (`TRUE` → discipline list) |
| BIP | Adds `Behavior` when `TRUE` |
| Fall 2026 Evals | `fallEval` boolean |

## Storage

- Key: `localStorage.prism_students_v1`
- Meta: `localStorage.prism_caseload_meta_v1` (file name, import time, count)
- **Restore Demo** clears imported data from this browser only

## What is not imported

Goals, accommodations, interests, triggers, and clinical notes are not on this sheet. Enrich remains the system of record; PRISM leaves placeholders until those fields are entered in-app.

## FERPA / git hygiene

Do not add real caseload exports under the repo. Patterns are gitignored (e.g. `*Special*Pops*.csv`, `student.export*`, ALP/BIP student PDFs, `local-data/`). Demo students in `deploy/index.html` are fictional only.

See also: [caseload-enrichment-import.md](./caseload-enrichment-import.md) for parent/contact, ALP, and BIP doc imports.

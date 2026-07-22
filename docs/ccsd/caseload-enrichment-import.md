# Caseload enrichment imports (FERPA / browser-only)

Real student files stay in the browser (`localStorage`). Never commit exports or plan PDFs to git.

## Recommended import order

1. **Student Tiles → Import ARR CSV** — Special Pops By-Grade sheet (caseload spine)
2. **Student Tiles → Import Enrich Snapshots** — multi-select Enrich *Student Profile Snapshot* PDF batches (goals, accommodations, disability, BIP flag, DOB/LASID)
3. **Import Docs** (legacy deploy HTML) — parent/contact or address `student.export` TSV when needed

## Enrich Snapshot PDFs

- Source: Enrich print batches (`Enrich_Snapshots_*.pdf`)
- Parsed **in the browser** with pdf.js — files never upload to a server and must not be committed to git
- Matched onto existing ARR rows by LASID or name; otherwise creates `enrich-snapshot` students
- Fills: goals, accommodations, primary disability, BIP flag, DOB, meeting date, LASID/SASID

## What is stored per matched student

| Source | Fields kept |
|--------|-------------|
| ARR CSV | Name, grade, teacher, case manager, IEP/reeval dates, related-service flags |
| Enrich Snapshot PDFs | Goals, accommodations, disability, BIP, DOB, LASID/SASID, meeting date |
| Contacts export (CSV / `.text`) | Student number, HH1/HH2 parent names, emails, phones |
| Address export (CSV / `.text`) | Guardian, street, city, state, zip |
| ALP / BIP PDF | **Paused for now** (use Enrich BIP flag + dedicated BIP flow) |

## Coverage UI

After imports, Student Tiles shows source chips (ARR / Enrich) and goals/accommodations on the student wall. FBA can be **started from the tile** even when Azure AI keys are offline (offline draft template).

## FERPA

Real student files stay in the browser (`localStorage`). Never commit exports or plan PDFs to git (see `.gitignore`).

## Files

- `src/lib/students/arrImport.ts` — ARR CSV parser
- `src/lib/students/enrichSnapshotImport.ts` — Enrich snapshot PDF parse + merge
- `deploy/enrichment-import.js` — legacy contact/address merge (deploy HTML)

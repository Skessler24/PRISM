# Caseload enrichment imports (FERPA / browser-only)

Real student files stay in the browser (`localStorage`). Never commit exports or plan PDFs to git.

## Recommended import order

1. **Import CSV** — ARR Special Pops By-Grade sheet (caseload spine)
2. **Import Docs** (multi-select) — any of:
   - `student.export` parent/contact TSV (whole-school OK; only caseload matches are kept)
   - `student.export` address/guardian TSV
   - Gifted / Talent Pool ALP PDF(s)
   - BIP batch PDF(s)
   - (soon) IEP snapshots, evaluations, progress reports

## What is stored per matched student

| Source | Fields kept |
|--------|-------------|
| Contacts export (CSV / `.text`) | Student number, HH1/HH2 parent names, emails, phones |
| Address export (CSV / `.text`) | Guardian, street, city, state, zip |
| ALP / BIP PDF | **Paused for now** (browser PDF import unreliable) — use later |

## Coverage UI

After **Import Docs**, Student Tiles shows a **Coverage gaps** panel: contact misses and any skipped files.

## Not in the current upload set

IEP snapshots, latest evaluations, and progress-report batch prints were not included with the demographics/ALP/BIP files. Import those the same way when available.

## Files

- `deploy/enrichment-import.js` — parsers + merge
- `deploy/index.html` — Import Docs button + gap panel
- pdf.js (CDN) — client-side PDF text extraction

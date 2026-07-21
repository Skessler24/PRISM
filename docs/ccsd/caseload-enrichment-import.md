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
| Contacts export | Student number, HH1/HH2 parent names, emails, phones |
| Address export | Guardian, street, city, state, zip |
| ALP PDF | Short profile, strengths, goals excerpts |
| BIP PDF | Strengths profile + FBA summary excerpts (not full 10+ page plan) |

## Coverage UI

After **Import Docs**, Student Tiles shows a **Coverage gaps** panel: contact misses, ALP/BIP matches, and packets that did not land on the Special Pops caseload.

## Not in the current upload set

IEP snapshots, latest evaluations, and progress-report batch prints were not included with the demographics/ALP/BIP files. Import those the same way when available.

## Files

- `deploy/enrichment-import.js` — parsers + merge
- `deploy/index.html` — Import Docs button + gap panel
- pdf.js (CDN) — client-side PDF text extraction

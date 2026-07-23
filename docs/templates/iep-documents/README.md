# PRISM IEP Document Templates

## What’s in this folder

Claude sent a **Nocturne** design-system style pack for future IEP / form loading:

| Path | Role |
|------|------|
| `public/iep-templates/nocturne/styles.css` | Tokens + form/button/card/table components |
| `public/iep-templates/nocturne/print.css` | Light-paper print overrides |
| `public/iep-templates/nocturne/README.md` | Claude’s design-system guide |
| `src/lib/templates/documentStyle.ts` | React helper to open/download styled docs |

**Important:** The zip attached as “PRISM IEP Document Templates” contained the **style system only** (no filled IEP HTML forms yet). Drop future Claude HTML shells under `public/iep-templates/shells/` and link `../nocturne/styles.css`.

## How to use in PRISM

1. Creation Station → Templates & Forms → load/fill a form  
2. Click **Open styled document** (Nocturne preview + Print/PDF)  
3. Or **Download HTML** for SharePoint / Drive  

App chrome stays on Theme Studio. Nocturne styles **documents only**.

## Adding more templates later

1. Have Claude write HTML that uses Nocturne classes (`.card`, `.field`, `.input`, `.table`, `.btn`)  
2. Upload here — we’ll register them in Forms Library / shells  
3. Optional: mail-merge fields like `{{name}}`, `{{goals}}` (already supported by `fillTemplateBody`)

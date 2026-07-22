# PRISM AAC / Materials Icon Library

Heart of **Creation Station → Icon Library** (Master Plan Phase 8 / Million Dollar Idea).

## How to add icons

1. Add SVG files under `public/icons/aac/` named by stable id, e.g. `want.svg`, `help.svg`.
2. Register (or update) entries in `src/lib/icons/catalog.ts`:
   - `id` — slug used by boards
   - `label` — spoken / cell text
   - `category` — communication | emotions | school | animals | sports | needs | …
   - `svg` — inline fallback (keeps boards offline)
   - `file` — optional `/icons/aac/{id}.svg`
   - `emojiFallback` — last resort

## UI features

- Search, category filters, ★ favorites, recently used
- Horizontal ribbon (drag `text/prism-icon` for future board drop targets)
- Download SVG, custom label copy

## Contract

- Prefer **simple, high-contrast** symbols for Smart TV / laminate.
- Keep `viewBox="0 0 64 64"` (or update `IconGlyph` if you change).
- Do **not** put student PHI in filenames or labels.
- Materials resolve words → icons via `resolveIcon()` / `iconsForVocab()`.

Until Claude’s full pack lands, Phase 2 emoji categories + AAC core seed the library.

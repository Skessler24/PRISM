# PRISM AAC / Materials Icon Library

Plug-in point for Claude (or designers) to ship a full symbol pack.

## How to add icons

1. Add SVG files under `public/icons/aac/` named by stable id, e.g. `want.svg`, `help.svg`.
2. Register (or update) entries in `src/lib/icons/catalog.ts`:
   - `id` — slug used by boards
   - `label` — spoken / cell text
   - `category` — core | actions | people | school | feelings | food | custom
   - `svg` — inline fallback (keeps boards offline)
   - `file` — optional `/icons/aac/{id}.svg`
   - `emojiFallback` — last resort

## Contract

- Prefer **simple, high-contrast** symbols for Smart TV / laminate.
- Keep `viewBox="0 0 64 64"` (or update `IconGlyph` if you change).
- Do **not** put student PHI in filenames or labels.
- Materials resolve words → icons via `resolveIcon()` / `iconsForVocab()`.

Until the full pack lands, the seed catalog in `catalog.ts` powers communication boards.

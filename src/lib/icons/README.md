# PRISM AAC / Materials Icon Library

Heart of **Creation Station → Icon Library** (Master Plan Phase 8 / Million Dollar Idea).

## Current pack

Source: **AAC Icon Library (offline).html** (Samantha upload) — Fitzgerald-color core vocabulary + emotion line/emoji faces.

- SVG files: `public/icons/aac/*.svg` (56 glyphs)
- **Animated twins** (actions + emotions only): `public/icons/aac/animated/*.svg` (34 glyphs)
- Generated catalogs: `aac-pack.generated.ts`, `aac-animated.generated.ts`
- Offline HTML archive: `docs/icons/AAC_Icon_Library_offline.html`

Animated icons use CSS `@keyframes` inside the SVG and must render **inline** (see `IconGlyph`) so motion plays on digital AAC / Smart TV boards. Static pronouns, nouns, questions, and social tiles are not duplicated.

## How to add / refresh icons

1. Drop SVG files under `public/icons/aac/` named by stable id, e.g. `want.svg`.
2. Prefer `viewBox="0 0 64 64"`, high-contrast, no student PHI in filenames.
3. Re-run the extract / animate scripts (or edit `catalog.ts` / regenerate packs).
4. Phase 2 emoji categories fill gaps only when an id is not in the AAC pack.

## UI features

- Search, category filters, ★ favorites, recently used
- **Motion filter:** All / Static / ✦ Animated
- Horizontal ribbon (drag `text/prism-icon` for future board drop targets)
- Download SVG, custom label copy

## Contract

- Materials resolve words → icons via `resolveIcon()` / `iconsForVocab()`.
- Use `animatedTwin()` / `staticTwin()` when boards need a motion or print variant.
- Boards should prefer AAC pack glyphs over emoji tiles when both exist.

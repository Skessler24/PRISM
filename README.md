# PRISM — SPED Command Center

**Reflect the Whole Child**

District-agnostic special education workflow platform. Cherry Creek School District is Profile #1 (pilot). Enrich remains the system of record — PRISM prepares, reminds, and drafts. No live Enrich sync.

## Stack

- Vite + React + TypeScript + Tailwind
- React Router (9 tabs: 5 primary + hamburger drawer)
- Theme Studio (Calm & Clinical / Soft Pastel Pro / Dark Mode Elite)
- Help Assist toggle (field-level guidance in Prompt 5)
- District profiles as data (`district-profiles/cherry-creek.json`)

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Other commands:

```bash
npm run build      # production build
npm run preview    # preview production build
npm run lint       # ESLint
npm run format     # Prettier
```

## Repo map

```
src/app/                 shell, routing helpers, theme provider
src/components/          TopBar, TabNavigation, Breadcrumbs, ThemeStudio
src/features/            one folder per tab (shell pages for now)
src/lib/                 ai, district-profiles, help-assist, storage, themes
src/data/                mock students (Prompt 3)
district-profiles/       CCSD JSON profile (Prompt 2 expands)
api/                     Azure Functions stubs (Prompt 4)
archive/                 HTML prototypes (reference only — do not deploy)
docs/                    Master plan, Enrich guide, Cursor handoff
```

## Build order (Claude handoff)

1. **Done in this PR** — Scaffold shell + design system + nav redesign
2. District Profile data model + feature toggles
3. Migrate tab content from `archive/index.prototype.html`
4. Real AI backend (`/api/ai-chat`, `/api/ai-speak`)
5. Help Assist as first-class system
6. OneDrive/SharePoint via Microsoft Graph
7+. Phase depth per Master Platform Plan

## Compliance

- Demo/sample student data only — no real PHI
- No direct Enrich automation or API sync
- AI is assistive; human review required before use

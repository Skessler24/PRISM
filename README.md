# PRISM — SPED Command Center

**Reflect the Whole Human**

## What’s live on Azure right now

The live site deploys the **full working Phase 3 HTML app** from `/deploy` (all tabs, student tiles, caseload, MTSS, eval tracker, templates, district profile, etc.).

🔗 https://gentle-coast-08903c010.7.azurestaticapps.net

That file came from your latest complete build (`archive/index.prototype.html` / the index you and Copilot built). It was never deleted — it was archived while we scaffolded a Vite/React rewrite. The React shell only had empty page placeholders, which is why Azure looked “half gone” after that deploy.

## Repo layout

| Path | What it is |
|---|---|
| `deploy/` | **What Azure publishes** — full working app |
| `archive/index.prototype.html` | Backup of the full HTML build |
| `src/` | Vite + React rewrite (in progress — Prompt 3 will port tab content here) |
| `district-profiles/` | CCSD Enrich + DAT rules (used by React District Profile) |
| `docs/` | Enrich guide, handoff, design refs, intake catalogs |

## Run locally

**Full current app (matches Azure):**
Open `deploy/index.html` in a browser, or:
```bash
npx --yes serve deploy
```

**React scaffold (migration work-in-progress):**
```bash
npm install
npm run dev
```

## Deploy

GitHub Actions on push to `main` uploads the `deploy/` folder to Azure Static Web Apps.

## Compliance

- Demo/sample student data only — no real PHI
- No direct Enrich automation or API sync
- AI is assistive; human review required before use

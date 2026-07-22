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
| `api/` | Azure Functions AI proxy (`/api/ai-chat`, `/api/ai-speak`) — keys stay server-side |
| `archive/index.prototype.html` | Backup of the full HTML build |
| `src/` | Vite + React rewrite (Prompts 1–7 on `main`) |
| `district-profiles/` | CCSD Enrich + DAT rules (used by React District Profile) |
| `docs/` | Enrich guide, handoff, design refs, intake catalogs |
| `docs/ops/AZURE_RECOVERY_CHECKLIST.md` | **When Azure is healthy** — API attach, secrets, smoke tests |
| `docs/ops/REACT_DIST_CUTOVER.md` | Flip Azure from `deploy/` HTML → React `dist/` (prepared, not flipped) |

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

**AI proxy (optional, for Generation Studio / AI polish):**
```bash
cp api/local.settings.json.example api/local.settings.json
# set ANTHROPIC_API_KEY (or OPENAI_API_KEY + AI_PROVIDER=openai)
npm run api:install
npm run api:start   # http://localhost:7071 — Vite proxies /api
```

## Deploy

GitHub Actions on push to `main` uploads the `deploy/` folder to Azure Static Web Apps (with `api/` as the Functions backend when Azure recovers).

**Azure is currently struggling** (cannot add/configure the API in Portal yet). Track everything to finish when it recovers in:

→ [`docs/ops/AZURE_RECOVERY_CHECKLIST.md`](docs/ops/AZURE_RECOVERY_CHECKLIST.md)

When you are ready to publish React instead of `deploy/`:

→ [`docs/ops/REACT_DIST_CUTOVER.md`](docs/ops/REACT_DIST_CUTOVER.md)

## Compliance

- Demo/sample student data only in git — no real PHI
- Import your ARR Special Pops CSV from **Student Tiles → Import CSV**; it stays in browser `localStorage` only (see `docs/ccsd/caseload-import-schema.md`)
- Real caseload CSV exports are gitignored — never commit them
- No direct Enrich automation or API sync
- AI is assistive; human review required before use

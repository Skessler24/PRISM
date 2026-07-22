# PRISM — SPED Command Center

**Reflect the Whole Human**

## What’s live on Azure right now

The live site deploys the **Vite + React app** (`npm run build` → `dist/`).

🔗 https://gentle-coast-08903c010.7.azurestaticapps.net

The Phase 3 HTML app remains in `deploy/` as a **rollback** artifact (see cutover docs). API attach / AI keys may still be pending Azure SWA recovery.

## Repo layout

| Path | What it is |
|---|---|
| `src/` → `dist/` | **What Azure publishes** — Vite/React build |
| `deploy/` | Rollback HTML app (not published while cutover is active) |
| `api/` | Azure Functions AI proxy (`/api/ai-chat`, `/api/ai-speak`) — keys stay server-side |
| `archive/index.prototype.html` | Backup of the full HTML build |
| `district-profiles/` | CCSD Enrich + DAT rules (used by React District Profile) |
| `docs/` | Enrich guide, handoff, design refs, intake catalogs |
| `docs/ops/AZURE_RECOVERY_CHECKLIST.md` | **When Azure is healthy** — API attach, secrets, smoke tests |
| `docs/ops/REACT_DIST_CUTOVER.md` | Cutover status, smoke checks, rollback |

## Run locally

**React app (matches Azure):**
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

GitHub Actions on push to `main` runs `npm ci && npm run build`, then uploads `dist/` to Azure Static Web Apps (`api/` as Functions backend when attached).

**Azure may still be struggling** for API attach / Portal. Track recovery in:

→ [`docs/ops/AZURE_RECOVERY_CHECKLIST.md`](docs/ops/AZURE_RECOVERY_CHECKLIST.md)

Cutover / rollback:

→ [`docs/ops/REACT_DIST_CUTOVER.md`](docs/ops/REACT_DIST_CUTOVER.md)

## Compliance

- Demo/sample student data only in git — no real PHI
- Import your ARR Special Pops CSV from **Student Tiles → Import CSV**; it stays in browser `localStorage` only (see `docs/ccsd/caseload-import-schema.md`)
- Real caseload CSV exports are gitignored — never commit them
- No direct Enrich automation or API sync
- AI is assistive; human review required before use

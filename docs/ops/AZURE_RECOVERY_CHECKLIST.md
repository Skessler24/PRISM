# Azure recovery checklist (PRISM)

**Status:** Azure Static Web Apps is struggling (GatewayTimeout / content-server issues on SWA **PRISM** in `kessler-design-labs_group`). You **cannot add/configure the API** yet. Code for the Functions backend already lives in the repo (`api/`).

**Live site:** https://gentle-coast-08903c010.7.azurestaticapps.net  
**What ships today:** `deploy/` HTML app (React `src/` is the migration track; not what Azure publishes yet).

Update this file whenever new Azure-blocked work appears.

---

## Blocked until Azure is healthy

Do these in order once SWA portal / GitHub deploy jobs succeed again.

### 1. Confirm SWA deploy works again
- [ ] Open Azure Portal → Static Web App **PRISM** → Overview loads without timeout
- [ ] Push or re-run **Azure Static Web Apps CI/CD** on `main` succeeds (no GatewayTimeout on List Static Site Secrets)
- [ ] Spot-check live site still serves `deploy/` (tabs load)

### 2. Attach / deploy the Functions API (`api/`)
Code is ready: `api/src/functions/ai-chat.js`, `api/src/functions/ai-speak.js`, `api/src/functions/team-chat.js`.  
Workflow already sets `api_location: "api"`.

- [ ] Confirm SWA build picks up `api/` (GitHub Action log shows API build, not skipped/failed)
- [ ] Verify routes respond:
  - `POST https://gentle-coast-08903c010.7.azurestaticapps.net/api/ai-chat`
  - `POST …/api/ai-speak` (expected **501** stub until TTS vendor)
  - `POST …/api/team-chat` (cross-device Team Chat rooms; in-memory until Table storage)
- [ ] If API does not appear: in Portal → SWA → **APIs** / linked Function App, confirm managed Functions are present

### 3. Set Application Settings (secrets — never commit)
In SWA / linked Function App → Configuration / Application settings:

| Name | Required | Notes |
|------|----------|--------|
| `AI_PROVIDER` | recommended | `anthropic` (default) or `openai` |
| `ANTHROPIC_API_KEY` | if Anthropic | **Do not** put in browser / git |
| `ANTHROPIC_MODEL` | optional | default in code: `claude-sonnet-4-20250514` |
| `OPENAI_API_KEY` | if OpenAI | only when `AI_PROVIDER=openai` |
| `OPENAI_MODEL` | optional | default `gpt-4o-mini` |
| `AI_MAX_TOKENS` | optional | default `2048` |
| `TEAM_CHAT_ENABLED` | optional | set `false` to force 503 / local-only chat |

- [ ] Save settings and restart / wait for Functions to pick them up
- [ ] Smoke-test Generation Studio / AI polish **locally** first (`npm run api:start`), then on live site once API is up
- [ ] Smoke-test Dashboard Team Chat → **Connect cloud room** (invite code) against `/api/team-chat`
- [ ] Confirm `deploy/` AppSDK AI features (meeting summary, gen studio, etc.) hit `/api/ai-*` instead of failing silently

### 4. Optional later Azure / cloud items (not blocked on “API add”, but need healthy Azure)
- [ ] **Graph / OneDrive:** wire MSAL + app registration when ready (`VITE_STORAGE_BACKEND=graph` is stubbed to localStorage today)
- [ ] **TTS:** choose vendor and replace `/api/ai-speak` 501 stub
- [ ] **Team Chat durability:** move in-memory rooms to Azure Table/Blob / SignalR for multi-instance
- [ ] **Publish React `dist/` instead of `deploy/`** when ready — follow [`REACT_DIST_CUTOVER.md`](./REACT_DIST_CUTOVER.md) (workflow flip prepared; not enabled yet)
- [ ] Re-try any failed empty/retry deploys from the outage window if the live site looks stale

---

## Works without Azure (do anytime)

- Local React: `npm run dev`
- Local AI proxy: `cp api/local.settings.json.example api/local.settings.json` → set key → `npm run api:install && npm run api:start`
- Open `deploy/index.html` / `npx serve deploy` for the full HTML app offline
- FERPA: real student CSV stays in browser `localStorage` only
- Weekly Planner, Meeting Prep, icon catalog, local Team Chat — all offline

---

## Symptom → action cheat sheet

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| GitHub Action fails on List Static Site Secrets / GatewayTimeout | Azure SWA control plane outage | Wait; re-run workflow when Portal loads |
| Live site OK but AI buttons error | API not deployed or keys missing | Finish §2–§3 |
| `/api/ai-chat` → 503 “not configured” | Missing `ANTHROPIC_API_KEY` / OpenAI key | Add Application Setting |
| `/api/ai-speak` → 501 | Expected | TTS not wired yet |
| Team Chat shows “offline (local only)” | API not attached or cold/missing | Finish §2; client keeps local chat |
| AI works in Vite locally, not on Azure | Local Functions only | Complete §2–§3 |

---

*Last updated: 2026-07-22 — React `dist/` cutover recipe in REACT_DIST_CUTOVER.md. Azure attach still pending. Offline features do **not** require Azure.*

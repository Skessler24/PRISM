# React `dist/` cutover (PRISM)

**Status:** Prepared — **not flipped**. Live Azure still serves `deploy/` HTML until you deliberately change the workflow.

**Goal:** Publish the Vite/React app (`npm run build` → `dist/`) instead of the Phase 3 HTML app in `deploy/`.

**Related:** [`AZURE_RECOVERY_CHECKLIST.md`](./AZURE_RECOVERY_CHECKLIST.md) (API attach / keys still blocked on SWA health).

---

## What is already ready in-repo

| Item | Location | Notes |
|------|----------|--------|
| Vite build | `npm run build` → `dist/` | Includes `staticwebapp.config.json` from `public/` |
| SPA fallback | `public/staticwebapp.config.json` | Rewrites to `/index.html`; excludes assets, SW, manifest |
| PWA shell | `public/manifest.webmanifest`, `public/sw.js` | Registered in production only |
| API folder | `api/` | Same `api_location` after cutover |
| Workflow flip recipe | `.github/workflows/azure-static-web-apps-gentle-coast-08903c010.yml` | Commented block under “REACT CUTOVER” |

Do **not** change `app_location` until the preflight checklist below is green.

---

## Preflight (before flipping)

- [ ] Local: `npm ci && npm run build && npm run lint` succeed
- [ ] Local smoke: `npx --yes serve dist` — tabs, Dashboard, Print Center, Private School (if enabled), PWA install prompt on Chrome/Edge
- [ ] Azure SWA portal loads (no GatewayTimeout) — see recovery checklist §1
- [ ] Decide: cut over **with** API attach the same day, or React UI first and AI later
- [ ] Tell stakeholders the live URL will switch from HTML `deploy/` to React `dist/` (same hostname)
- [ ] Keep `deploy/` in git as rollback artifact

---

## Flip (one workflow change)

Edit `.github/workflows/azure-static-web-apps-gentle-coast-08903c010.yml`:

1. Replace the “Deploy full PRISM app” step inputs with the **REACT CUTOVER** block (already commented in that file), which sets:
   - `app_location: "/"`
   - `output_location: "dist"`
   - `api_location: "api"`
   - `app_build_command: "npm ci && npm run build"`
   - remove / set `skip_app_build: false` (do not skip)
2. Push to `main` (or merge a PR that only flips the workflow).
3. Confirm GitHub Action **Build and Deploy** succeeds and uploads `dist/`.
4. Spot-check live site:
   - React TopBar / tab pills (not old HTML chrome)
   - Deep links: `/binder`, `/private-school`, `/materials/session/...`
   - `/manifest.webmanifest` and `/sw.js` return 200 (not `index.html`)
   - `/api/ai-chat` still reachable if API was attached

---

## Rollback

1. Revert workflow to:
   - `app_location: "deploy"`
   - `skip_app_build: true`
   - no `output_location` / no Vite build command
2. Re-run deploy on `main`.
3. Live site returns to HTML app; React code stays in repo.

---

## After cutover

- [ ] Update README “What’s live on Azure” to say React `dist/`
- [ ] Finish recovery checklist §2–§3 (API + keys) if not done
- [ ] Optional: archive or freeze further HTML edits under `deploy/`
- [ ] Monitor SWA + Functions cold starts for Team Chat / AI

---

*Last updated: 2026-07-22 — cutover docs + SWA config + workflow recipe prepared; live `app_location` still `deploy/`.*

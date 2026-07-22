# React `dist/` cutover (PRISM)

**Status:** **Flipped** on `main` — Azure publishes Vite/React `dist/` (not `deploy/` HTML).

**Live:** https://gentle-coast-08903c010.7.azurestaticapps.net  
**Related:** [`AZURE_RECOVERY_CHECKLIST.md`](./AZURE_RECOVERY_CHECKLIST.md) (API attach / keys still may be blocked on SWA health).

---

## What ships now

| Item | Location | Notes |
|------|----------|--------|
| Workflow | `.github/workflows/azure-static-web-apps-gentle-coast-08903c010.yml` | `npm ci && npm run build`, then upload `dist/` |
| Built app | `dist/` | Includes `staticwebapp.config.json` from `public/` |
| SPA fallback | `public/staticwebapp.config.json` | Rewrites to `/index.html`; excludes assets, SW, manifest |
| PWA shell | `public/manifest.webmanifest`, `public/sw.js` | Registered in production only |
| API folder | `api/` | `api_location: "api"` (attach/keys still per recovery checklist) |
| Rollback artifact | `deploy/` | Kept in git — HTML Phase 3 app |

---

## Post-flip smoke (after deploy succeeds)

- [ ] Live site shows React TopBar / tab pills (not old HTML chrome)
- [ ] Deep links: `/binder`, `/private-school`, `/materials/session/...`
- [ ] `/manifest.webmanifest` and `/sw.js` return 200 (not `index.html`)
- [ ] `/api/ai-chat` reachable once API + keys are attached

---

## Rollback

1. Edit workflow to:
   - Remove Node setup + `npm ci` / `npm run build` steps
   - `app_location: "deploy"`
   - `api_location: "api"`
   - `skip_app_build: true`
2. Push / merge to `main` and re-run deploy.
3. Live site returns to HTML app; React code stays in repo.

---

## Still open after cutover

- [ ] Finish recovery checklist §2–§3 (API + Application Settings)
- [ ] Optional: freeze further HTML edits under `deploy/`
- [ ] Monitor SWA + Functions cold starts for Team Chat / AI

---

*Last updated: 2026-07-22 — cutover flipped; workflow builds Vite and uploads `dist/`.*

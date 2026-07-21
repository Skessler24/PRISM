# PRISM — Cursor Build Handoff
Prepared for Samantha Kessler · Cherry Creek School District · July 2026

This document does two things: it makes one architectural call you need to sign off on, and it gives you copy-paste prompts to run in Cursor, in order, to rebuild PRISM as the district-agnostic platform you described in your Copilot conversation.

---

## 1. The one big decision: leaving the single HTML file behind

`index.html` is a great prototype — but it can't become the platform you described (district-agnostic, multi-provider, real AI, real cloud storage) without hitting a wall:

1. **The AI layer is fake outside its original sandbox.** `AppSDK.ai.chat()` / `AppSDK.ai.speak()` only worked because Copilot's preview injected it. Real deployment needs a small backend so API keys are never client-side.
2. **"District-agnostic" means data-driven, not hardcoded.** Rules, features, students, and timelines must live in a swappable config/data layer.
3. **A 2,000-line single file doesn't scale** to 8 tabs × 10 phases.

**Recommendation:** migrate to **Vite + React + TypeScript + Tailwind**, with a **minimal serverless backend** (Azure Functions) that proxies AI calls and later brokers Microsoft Graph.

## 2. Target shape of the repo

```
src/
  app/
  components/
  features/{dashboard,student-tiles,caseload,mtss,evaluations,accessibility,templates-forms,resources,district-profile}
  lib/{ai,district-profiles,help-assist,storage}
  data/
api/
district-profiles/
  cherry-creek.json
```

## 3. Cursor prompts — run in order

1. Scaffold project (shell + design system + nav redesign)
2. District Profile data model + feature toggles
3. Migrate 8 core tabs (no AI yet)
4. Real AI backend (replaces AppSDK)
5. Help Assist as first-class system
6. Persistence via Microsoft Graph / OneDrive
7+. Remaining phase depth

## 4. Enrich User's Guide policy

PRISM never automates or connects directly to Enrich (HIPAA/security). Enrich rules become data in `district-profiles/cherry-creek.json` and Help Assist content. Enrich stays the system of record; PRISM prepares, reminds, and drafts.

## 5. AI-vendor flexibility

Frontend talks only to `/api/ai-*`. Provider (Anthropic / Gemini / other) is a server-side config change.

## Decisions locked (Samantha · July 2026)

- Canonical app: Vite React app (prototype HTML archived)
- Enrich: no live sync — reminders / checklists / draft-copy only
- First focus after scaffold: District Profile (CCSD) + Help Assist + Eval timeline
- Demo data: fake/sample only (no real PHI)
- Hosting default: Azure Static Web Apps + Azure Functions

## Decisions locked (Samantha · July 21, 2026 — Suite Mode)

- PRISM supports **Companion** (Enrich/IEP Writer as SoR) and **Standalone suite** (PRISM is the full platform).
- District Profile lives in a **permission-gated Admin menu**, not the main tab bar.
- Module toggles (504, MLL, MTSS, etc.) hide main tabs when a district uses another system for that work.
- Student program flags: `hasIEP` / `has504` / `hasMLL` (504 + MLL workspaces filter the shared caseload; tabs default off for CCSD Companion).
- Template engine: Forms Library fills student placeholders; **Companion = Copy** into SoR; **Standalone = Save as district draft** (`prism_template_instances_v1`) + custom templates (`prism_district_templates_v1`).
- React Prompt 3: core tabs ported (Dashboard, Students, Caseload, MTSS, Eval, Templates, Accessibility, Resources, 504, MLL) with feature-gated nav.
- No live Enrich sync in either mode.

## Decisions locked (Prompts 4–6)

- **AI:** Frontend calls only `/api/ai-chat` and `/api/ai-speak`. Vendor keys (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) live in Azure SWA / Function settings — never in the browser. `deploy/index.html` AppSDK shim uses the same proxy. Generation Studio is feature-gated (`features.ai`).
- **Help Assist:** Field tips on District timeline, Eval checklist, and Templates; gated by TopBar toggle + district `features.help`. Tip copy comes from district profile rules.
- **Storage:** `StorageRepository` with Local default + Graph/OneDrive stub (`VITE_STORAGE_BACKEND=graph` delegates to Local until MSAL OAuth is wired). Students + template drafts go through this layer.
- Next prompts: deeper phase modules; real Graph MSAL OAuth; TTS vendor for `/api/ai-speak`.

## Decisions locked (Prompt 7 — phase depth)

- **FBA/BIP Engine:** React workspace at `/fba` (`features.fba`) with ABC table, function hypothesis, AI FBA summary + BIP draft, Companion Copy.
- **Eval depth:** Transfer Wizard (district transfer deadlines) + Action Builder with real MDR wizard (`manifestationDeterminationSchoolDays`).
- **Caseload depth:** SOAP/service logs (localStorage, Copy-to-SoR within `serviceLogHours`) + progress probe bars.
- **MTSS depth:** Interactive DAT checklist + AI eligibility prep; CLD stays in Accessibility for CCSD Companion (MLL tab optional).
- Still later: Graph MSAL OAuth, TTS vendor, ESY/transport standalone modules, Private School (`privateSchool: false` for CCSD).
- **Azure outage:** SWA cannot accept API setup yet. Keep [`docs/ops/AZURE_RECOVERY_CHECKLIST.md`](../ops/AZURE_RECOVERY_CHECKLIST.md) updated with post-recovery tasks (attach `api/`, set `ANTHROPIC_API_KEY` / OpenAI settings, smoke-test `/api/ai-*`).

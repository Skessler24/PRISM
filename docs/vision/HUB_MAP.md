# PRISM vision → hub map

Living map from Samantha’s uploaded vision docs into the React hub structure.
Sources (also in this folder): `Master_Platform_Plan.txt`, `Million_Dollar_Idea.txt`, `Style_Vision_Board_v2.html`.

**Principle:** Enter once → use everywhere. Student Tile = data spine. AI assists; humans decide. FERPA/HIPAA always.

---

## Hub structure (combined, not 22 tabs)

| Hub (where it lives) | Master Plan / Million Dollar Idea | Status |
|----------------------|-----------------------------------|--------|
| **🏠 Dashboard** | AI SPED Secretary HQ: date, who-am-I-seeing, stats pills, this week / scrollable dues, **Virtual meetings** (Teams/Zoom join), to-do, team chat dock | Partial — Graph calendar / Outlook auto-sync later |
| **🧩 Student Tiles** | Data wall, continuum profile, material history ZIP, prepare→ drafts | Partial — tiles strong; continuum report + material history folder deepen next |
| **👤 Caseload** | My students, session check-off → SOAP, schedule widget | Partial — SOAP exists; group check-off from Scheduling deepen |
| **📅 Scheduling** | Live groups, clickable pop-outs, sub packet, stand-alone + Team Scheduling link | Restored (groups + sub packet); bidirectional Team Scheduling app later |
| **📋 MTSS** | Tiers, toolkit, 6-week calendar, eligibility prep, DAT | Partial |
| **📊 Evals** | Live tracker, checklists, DAT workflow, 60-day | Partial |
| **📈 Progress** | Goal graphs / probes | Partial — in primary strip |
| **🎨 Creation Station** | Templates & Forms **merged** with Icon Library, token boards, visual schedules, comm boards, social stories + **Accessibility** + **Generation** | Hub exists; Icon Library expanded; boards live under Templates panel |
| **📚 Resource Hub** | Evidence AI search + citations vibe, family rights, community, mid-meeting | Research + family restored; SharePoint save later |
| **☰ drawer** | Print, Planner, Meetings, Contacts, Reminders, FBA, 504, MLL, Tools, Admin | Extra apps (not core strip) |

### Primary nav (top pills — district Admin toggles)

Dashboard · Students · Caseload · Evals · MTSS · Scheduling · Progress · Creation Station · Resource Hub

Quick Links tile + Generation Studio quick access + Compliance watch were removed (stats pills + top tabs cover them).

### Why Creation Station combines three “wings”

Million Dollar Idea treated **Generation**, **Accessibility**, and **Template Creation** as sibling creative wings. Master Plan put Icons/boards under Templates (Phase 8) and Accessibility as Tab 6.  
**Combined:** one **Creation Station** with panels — Accessibility · Generator · Templates & Forms · **Icon Library** — so the soul features stay together without extra primary tabs.

---

## Heart-and-soul checklist (Icon Library called out)

From Million Dollar Idea / Phase 8 — **must feel alive**:

- [x] Icon library with categories, search, favorites, recent, download
- [x] Phase 2 category soul (communication, emotions, school, animals, sports, needs…)
- [ ] Drag-and-drop ribbon into live board editors (materials already use catalog resolve)
- [ ] Custom SVG pack from Samantha / Claude replacing emoji tiles
- [ ] Token boards 3/4/5-spot editable PDFs (Classroom Materials — deepen)
- [ ] Visual schedule dropdowns (numbered/times/first-then/needs) — deepen Materials
- [ ] Live interactive comm boards + banner/poster print — partially in Materials/Print
- [ ] Social stories 4 styles personalized from student data wall — Generator + Materials
- [ ] Student material history folder + ZIP export on tile — next priority
- [ ] Continuum profile printable report — next priority

---

## Style Vision Board

Palettes/fonts already live in `src/lib/themes.ts` (Calm Clinical / Soft Pastel / Dark). Soft surfaces now tint from the active palette so pages feel like Student Tiles.

---

## Next restore order (when you say go)

1. Student Tile: **Data Wall editor** + **Continuum Profile PDF** + **Material History**
2. Creation Station: token board sizes + visual schedule dropdowns wired to Icon Library ribbon
3. Caseload: “I saw this group” → auto SOAP from Scheduling
4. Dashboard: floating day clock + next day-off from CCSD calendar upload
5. Dual cloud / Outlook — wait on Azure + MSAL

*Updated after reading the three uploads (2026-07-22).*

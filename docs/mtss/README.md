# MTSS

PRISM’s MTSS hub is wired to:

1. **Samantha Kessler — Complete RTI Guide for the SLP** (Language & Articulation, K–5) → `src/lib/mtss/slpRtiGuide.ts`
2. **Arrowhead / CCSD MTSS 25-26 school pack** (flow chart, teacher checklist, PM tools, support menus, referral/data sheet structure, SST pre-meeting) → `src/lib/mtss/arrowheadContent.ts`

Raw uploads stay out of git (FERPA / size). Content is curated into code as process toolkits only.

## Hub tabs

| Tab | Purpose |
|-----|---------|
| Overview | Tier counts, RTI gate, live cycle alerts, quick links |
| Toolkit | Arrowhead PM tools, supports, teacher checklist, parent prompts, SST sections |
| Cycles | Track 6-week intervention cycles (browser localStorage) |
| Referral | School referral pipeline + persisted checks |
| SLP RTI | Kessler guide tiers, screening cycle, artic norms, K milestones, data form export |
| DAT | CCSD dual-referral checklist |
| Eligibility | AI draft or offline scaffold |

State key: `prism_mtss_state_v1`

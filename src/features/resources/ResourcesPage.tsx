import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { readSuiteMode } from '../../lib/templates/catalog'
import { chat } from '../../lib/ai/client'
import {
  deleteSavedResource,
  loadSavedResources,
  upsertSavedResource,
  type SavedResource,
} from '../../lib/resources/savedStore'

const TRAINING = [
  {
    title: 'Enrich IEP System Basics',
    desc: 'Navigate, enter data, Convert → Validate → Finalize. PRISM drafts; Enrich remains SoR in Companion mode.',
  },
  {
    title: 'FBA/BIP Process',
    desc: 'Operational definition, ABC data, function hypothesis, then BIP. Open FBA/BIP Engine for guided drafts.',
  },
  {
    title: 'MTSS/RTI Referral Steps',
    desc: 'Intervention fidelity, dual DAT referral when required, consent clock starts on signed consent.',
  },
  {
    title: 'IEP Goal Writing',
    desc: 'SMART goals with measurable criteria — Generation Studio can draft; human review required.',
  },
  {
    title: 'Meeting & NOM Procedures',
    desc: 'Use district profile NOM lead time. Schedule groups and Meeting Prep for local notes.',
  },
  {
    title: 'Transfer & MDR',
    desc: 'Eval Tracker Transfer Wizard + Manifestation Determination within district school-day window.',
  },
]

const FAMILY = [
  {
    id: 'parental',
    title: 'Parental Rights',
    body: 'IDEA procedural safeguards: prior written notice, consent, mediation, due process, and the right to participate in IEP meetings. Share the district packet and keep a copy of what was offered.',
  },
  {
    id: 'ferpa',
    title: 'FERPA Notice',
    body: 'FERPA protects education records. Parents may inspect records, request amendments, and control disclosure of personally identifiable information except for legitimate educational interest and directory info policies.',
  },
  {
    id: 'peak',
    title: 'Colorado Parent Training (PEAK)',
    body: 'PEAK Parent Center — parent advocacy training and IEP support for Colorado families. Encourage families to request training early in the school year.',
    url: 'https://www.peakparent.org/',
  },
  {
    id: 'cde',
    title: 'Colorado CDE / ECEA',
    body: 'State Exceptional Student Services guidelines and ECEA regulations. Use for eligibility categories and timelines alongside district profile rules.',
    url: 'https://www.cde.state.co.us/',
  },
]

const COMMUNITY = [
  { name: 'Aurora Mental Health', desc: 'Community mental health services, family support', url: 'https://www.aumhc.org/' },
  {
    name: 'Rocky Mountain Human Services',
    desc: 'Developmental disability services, case management',
    url: 'https://www.rmhumanservices.org/',
  },
  { name: 'Understood.org', desc: 'IEP & 504 family guides', url: 'https://www.understood.org/' },
]

export function ResourcesPage() {
  const { profile } = useDistrictProfile()
  const mode = readSuiteMode()
  const [open, setOpen] = useState<string | null>(TRAINING[0].title)
  const [query, setQuery] = useState('')
  const [researchOut, setResearchOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<SavedResource[]>(() => loadSavedResources())
  const [familyOpen, setFamilyOpen] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const r = profile.rules

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2000)
  }

  async function runResearch() {
    if (!query.trim()) return
    setBusy(true)
    setResearchOut('Searching…')
    const res = await chat([
      {
        role: 'system',
        content: `You are a special education evidence assistant for ${profile.name}. Summarize evidence-based practices for educators and families. Cite well-known frameworks (e.g., What Works Clearinghouse concepts, ASHA, CEC) at a high level — do not invent fake study citations with DOIs. Note when something is practice-based vs strong research. Keep language family-friendly when asked. No live Enrich sync.`,
      },
      {
        role: 'user',
        content: `SPED research / evidence question: ${query}

Provide: 1) Short answer 2) Practical classroom/therapy steps 3) Family-friendly talking points 4) Caveats.`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      setResearchOut('')
      flash(res.error)
      return
    }
    setResearchOut(res.content || '')
  }

  function saveResearch() {
    if (!researchOut.trim()) return
    const item: SavedResource = {
      id: `res-${Date.now()}`,
      title: query.slice(0, 80) || 'Research note',
      kind: 'research',
      query,
      body: researchOut,
      createdAt: new Date().toISOString(),
    }
    upsertSavedResource(item)
    setSaved(loadSavedResources())
    flash('Saved — print or share from Saved')
  }

  function saveFamily(f: (typeof FAMILY)[number]) {
    const item: SavedResource = {
      id: `fam-${f.id}-${Date.now()}`,
      title: f.title,
      kind: 'family',
      body: f.body,
      createdAt: new Date().toISOString(),
    }
    upsertSavedResource(item)
    setSaved(loadSavedResources())
    flash('Family resource saved')
  }

  return (
    <PageShell
      title="📚 Resource Hub"
      description="AI evidence search you can store and share, family rights/resources, training library, and district rule cheat sheet."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <section
        className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
        style={{ borderTop: '4px solid var(--accent)' }}
      >
        <h2 className="font-heading text-sm font-bold">AI Research Search</h2>
        <p className="mt-0.5 text-[10px] text-[var(--subtext)]">
          Evidence-based SPED topics — save, print, or share with families (local only; review before sending).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            placeholder="Search SPED research topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runResearch()
            }}
          />
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() => void runResearch()}
          >
            {busy ? 'Searching…' : '✨ Search'}
          </button>
        </div>
        {researchOut && (
          <>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
              {researchOut}
            </pre>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                onClick={saveResearch}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                onClick={() => void navigator.clipboard.writeText(researchOut)}
              >
                Copy / share
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                onClick={() => window.print()}
              >
                Print
              </button>
            </div>
          </>
        )}
      </section>

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Family resources</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FAMILY.map((f) => (
            <button
              key={f.id}
              type="button"
              className="rounded-xl border border-[var(--border)] tint-lav p-3 text-left hover:border-[var(--accent)]"
              onClick={() => setFamilyOpen(familyOpen === f.id ? null : f.id)}
            >
              <h3 className="text-xs font-bold">{f.title}</h3>
              <p className="mt-1 text-[10px] text-[var(--subtext)]">Tap to read · save · share</p>
            </button>
          ))}
        </div>
        {familyOpen && (
          <div className="mt-3 rounded-xl tint-sun p-3 text-xs">
            <p className="font-bold">{FAMILY.find((f) => f.id === familyOpen)?.title}</p>
            <p className="mt-1 whitespace-pre-wrap">{FAMILY.find((f) => f.id === familyOpen)?.body}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-[10px] font-semibold"
                onClick={() => {
                  const f = FAMILY.find((x) => x.id === familyOpen)
                  if (f) saveFamily(f)
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-[10px] font-semibold"
                onClick={() => {
                  const f = FAMILY.find((x) => x.id === familyOpen)
                  if (f) void navigator.clipboard.writeText(`${f.title}\n\n${f.body}`)
                }}
              >
                Copy for family
              </button>
              {'url' in (FAMILY.find((f) => f.id === familyOpen) || {}) &&
                FAMILY.find((f) => f.id === familyOpen)?.url && (
                  <a
                    className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-[10px] font-semibold"
                    href={FAMILY.find((f) => f.id === familyOpen)?.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open link ↗
                  </a>
                )}
            </div>
          </div>
        )}
      </section>

      {saved.length > 0 && (
        <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Saved to share / print</h2>
          <ul className="mt-2 space-y-2">
            {saved.map((s) => (
              <li key={s.id} className="rounded-xl border border-[var(--border)] p-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">
                    {s.kind === 'research' ? '🔬' : '👨‍👩‍👧'} {s.title}
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px]"
                      onClick={() => void navigator.clipboard.writeText(s.body)}
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px]"
                      onClick={() => {
                        deleteSavedResource(s.id)
                        setSaved(loadSavedResources())
                      }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
                <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-[10px] text-[var(--subtext)]">
                  {s.body.slice(0, 400)}
                  {s.body.length > 400 ? '…' : ''}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">{profile.name} rule cheat sheet</h2>
        <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <li>
            <strong>NOM lead time:</strong> {r.nomLeadTimeDays} calendar days
          </li>
          <li>
            <strong>Eval window:</strong> {r.evaluationWindowDays} days ({r.evaluationWindowAppliesTo})
          </li>
          <li>
            <strong>Service log:</strong> within {r.serviceLogHours} hours
          </li>
          <li>
            <strong>MDR:</strong> {r.manifestationDeterminationSchoolDays} school days
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link to="/district" className="font-semibold text-[var(--accent)]">
            District Profile →
          </Link>
          <Link to="/creation" className="font-semibold text-[var(--accent)]">
            Creation Station →
          </Link>
        </div>
      </section>

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">PRISM vs official IEP system</h2>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          Mode: <strong>{mode}</strong> · SoR: <strong>{profile.iepSystem}</strong>
        </p>
      </section>

      <section className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Training library</h2>
        <div className="mt-2 space-y-2">
          {TRAINING.map((t) => (
            <button
              key={t.title}
              type="button"
              className="block w-full rounded-xl border border-[var(--border)] px-3 py-2 text-left text-xs"
              onClick={() => setOpen(open === t.title ? null : t.title)}
            >
              <strong>{t.title}</strong>
              {open === t.title && <p className="mt-1 text-[var(--subtext)]">{t.desc}</p>}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Community resources</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {COMMUNITY.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[var(--border)] p-3 text-xs hover:border-[var(--accent)]"
            >
              <h3 className="font-bold">{c.name}</h3>
              <p className="mt-1 text-[var(--subtext)]">{c.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

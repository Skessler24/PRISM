import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { statusBadgeClass } from '../../lib/students/normalizeStudent'
import {
  DEMO_EVALS,
  EVAL_CHECKLIST_STEPS,
  EVAL_STAGES,
  type EvalRecord,
} from '../../data/evals.demo'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import { chat } from '../../lib/ai/client'
import { readSuiteMode } from '../../lib/templates/catalog'
import { EvalCalendarPanel } from './EvalCalendarPanel'
import { EvalValidationPanel } from './EvalValidationPanel'
import { EsyWizard, TransportWizard } from './EsyTransportWizards'

const FILTERS = ['All', 'Initial', 'Annual', 'Reevaluation', 'Transfer'] as const
type Tab = 'dashboard' | 'checklist' | 'calendar' | 'transfer' | 'actions' | 'validate'

const ACTION_CARDS: {
  id: string
  title: string
  desc: string
  tip: string
  highlight?: boolean
  link?: string
}[] = [
  {
    id: 'special-eval',
    title: 'Special Evaluation',
    desc: 'Initiate a new special education evaluation',
    tip: 'Confirm RTI gate + parent notify window before consent.',
  },
  {
    id: 'additional-meeting',
    title: 'Additional Meeting',
    desc: 'Schedule an additional IEP team meeting',
    tip: 'Send NOM with district lead-time before the meeting.',
  },
  {
    id: 'fba',
    title: 'FBA Initiated',
    desc: 'Begin Functional Behavior Assessment',
    tip: 'Open FBA/BIP Engine to collect ABC data.',
    link: '/fba',
  },
  {
    id: 'bip',
    title: 'BIP Created/Amended',
    desc: 'Create or amend Behavior Intervention Plan',
    tip: 'FBA required before BIP in typical district practice.',
    link: '/fba',
  },
  {
    id: 'amendment',
    title: 'Amendment to IEP',
    desc: 'Amend current IEP without full rewrite',
    tip: 'PWN required for changes to ID/eval/placement/FAPE.',
  },
  {
    id: 'extension',
    title: 'Extension Request',
    desc: 'Request evaluation timeline extension',
    tip: 'Document parent agreement and new target date.',
  },
  {
    id: 'mdr',
    title: 'Manifestation Determination',
    desc: 'MDR after disciplinary removal',
    tip: 'Complete within district school-day window.',
    highlight: true,
  },
  {
    id: 'sop',
    title: 'Summary of Performance',
    desc: 'Required for graduation or aging out',
    tip: 'Capture strengths, accommodations, and postsecondary needs.',
  },
  {
    id: 'esy',
    title: 'ESY Determination',
    desc: 'Extended School Year regression / recoupment scaffold',
    tip: 'District feature flag esy — draft here, finalize in SoR.',
  },
  {
    id: 'transport',
    title: 'Transportation Request',
    desc: 'Specialized transportation documentation',
    tip: 'Companion: draft here, finalize in SoR / transport system.',
  },
]

const MDR_STEPS = [
  'Document disciplinary removal days (cumulative)',
  'Schedule MDR within district school-day window',
  'Provide parent rights / NOM in preferred language',
  'Review IEP, BIP (if any), and relevant evaluations',
  'Determine if conduct was a manifestation of disability',
  'If YES: return to placement / revise BIP as needed',
  'If NO: apply relevant disciplinary procedures with FAPE',
  'Enter decision notes in Enrich / SoR (manual — no live sync)',
]

export function EvaluationsPage() {
  const { profile, calculateTimeline } = useDistrictProfile()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [selected, setSelected] = useState<string>('')
  const [toast, setToast] = useState('')

  // Transfer wizard
  const [transferName, setTransferName] = useState('')
  const [prevDistrict, setPrevDistrict] = useState('')
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [iepAvailable, setIepAvailable] = useState('Yes')
  const [transferChecks, setTransferChecks] = useState<Record<string, boolean>>({})
  const [transferOut, setTransferOut] = useState('')
  const [busy, setBusy] = useState(false)

  // MDR
  const [mdrOpen, setMdrOpen] = useState(false)
  const [mdrStudent, setMdrStudent] = useState('')
  const [mdrChecks, setMdrChecks] = useState<Record<number, boolean>>({})
  const [mdrOut, setMdrOut] = useState('')
  const [actionOut, setActionOut] = useState('')
  const [wizard, setWizard] = useState<'esy' | 'transport' | null>(null)

  const mode = readSuiteMode()
  const iep = profile.iepSystem || 'Enrich'
  const mdrDays = profile.rules.manifestationDeterminationSchoolDays

  const rows = useMemo(() => {
    if (filter === 'All') return DEMO_EVALS
    if (filter === 'Annual') return DEMO_EVALS.filter((e) => e.type === 'Annual')
    if (filter === 'Reevaluation') return DEMO_EVALS.filter((e) => e.type === 'Reevaluation')
    return DEMO_EVALS.filter((e) => e.type === filter)
  }, [filter])

  const active: EvalRecord | undefined = DEMO_EVALS.find((e) => e.name === selected)

  const timelineHint = useMemo(() => {
    const d = new Date()
    return calculateTimeline('Consent Received', d).slice(0, 3)
  }, [calculateTimeline])

  const transferTimeline = useMemo(() => {
    if (!transferDate) return []
    return calculateTimeline('Transfer Notified', new Date(transferDate + 'T12:00:00'))
  }, [calculateTimeline, transferDate])

  const stats = useMemo(
    () => ({
      total: DEMO_EVALS.length,
      atRisk: DEMO_EVALS.filter((e) => e.daysLeft <= 10 || e.status === 'At Risk').length,
      overdue: DEMO_EVALS.filter((e) => e.status === 'Overdue').length,
      annual: DEMO_EVALS.filter((e) => e.type === 'Annual').length,
      transfer: DEMO_EVALS.filter((e) => e.type === 'Transfer').length,
    }),
    [],
  )

  const transferChecklist = useMemo(
    () => [
      'Student enrolled in district',
      `Prior records requested (within ${profile.rules.transferCompleteDays} days finalize window)`,
      'Adoption decision made (adopt IEP or begin new eval)',
      'If adopting: services started immediately',
      `IEP meeting within ${profile.rules.transferAdoptAnnualDays} days (adopt path)`,
      'Parent rights provided in primary language',
      `Data entered in ${iep} (manual — no live sync)`,
    ],
    [profile.rules.transferAdoptAnnualDays, profile.rules.transferCompleteDays, iep],
  )

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2400)
  }

  async function generateTransferDraft() {
    setBusy(true)
    const deadlines = transferTimeline
      .map((l) => `${l.label}: ${l.date.toLocaleDateString('en-US')}`)
      .join('\n')
    const res = await chat([
      {
        role: 'system',
        content: `You draft IEP transfer adoption decisions for ${profile.name}. Companion: prepare text to paste into ${iep}. No live sync.`,
      },
      {
        role: 'user',
        content: `Draft an adoption decision memo.
Student: ${transferName || 'Student name TBD'}
Previous district: ${prevDistrict || 'TBD'}
Transfer date: ${transferDate}
IEP available: ${iepAvailable}
District deadlines:
${deadlines}

Include: adopt vs reevaluate recommendation scaffolding, services-start reminder, meeting window, parent rights language reminder.`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      flash(res.error)
      return
    }
    setTransferOut(res.content)
    flash('Adoption draft ready')
  }

  async function generateActionDraft(actionId: string, title: string) {
    if (actionId === 'mdr') {
      setWizard(null)
      setMdrOpen(true)
      setTab('actions')
      return
    }
    if (actionId === 'esy') {
      setMdrOpen(false)
      setWizard('esy')
      setTab('actions')
      return
    }
    if (actionId === 'transport') {
      setMdrOpen(false)
      setWizard('transport')
      setTab('actions')
      return
    }
    setBusy(true)
    const res = await chat([
      {
        role: 'system',
        content: `You create short Enrich/SoR action checklists for ${profile.name} SPED teams. Copy-ready. No automation.`,
      },
      {
        role: 'user',
        content: `Create a starter checklist and draft notes for action: ${title}.
District NOM lead time: ${profile.rules.nomLeadTimeDays} days.
Evaluation window: ${profile.rules.evaluationWindowDays} days.
MDR window: ${mdrDays} school days.
Suite mode: ${mode}.
Keep it concise and actionable.`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      flash(res.error)
      return
    }
    setActionOut(`## ${title}\n\n${res.content}`)
    flash(`${title} draft ready`)
  }

  async function generateMdrDraft() {
    setBusy(true)
    const done = MDR_STEPS.filter((_, i) => mdrChecks[i]).length
    const res = await chat([
      {
        role: 'system',
        content: `You draft Manifestation Determination meeting notes for ${profile.name}. MDR must occur within ${mdrDays} school days of the decision to remove >10 days. Companion copy for ${iep}.`,
      },
      {
        role: 'user',
        content: `Draft MDR meeting scaffold for ${mdrStudent || 'the student'}.
Checklist progress: ${done}/${MDR_STEPS.length} steps checked.
Include sections: incident summary placeholder, IEP/BIP review prompts, manifestation question, team decision options, next steps.`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      flash(res.error)
      return
    }
    setMdrOut(res.content)
    flash('MDR draft ready')
  }

  return (
    <PageShell
      title="📊 Evaluation Tracker"
      description={`Compliance timelines for ${profile.name}. Transfer Wizard, Action Builder, and MDR use district rules — drafts only, no live ${iep} sync. LRE & age tools: Quick Tools.`}
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <p className="mb-3 text-xs text-[var(--subtext)]">
        Need LRE % or chronological age for an IEP?{' '}
        <Link to="/tools" className="font-semibold text-[var(--accent)]">
          Open Quick Tools (LRE + Age) →
        </Link>
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['dashboard', 'Dashboard'],
            ['checklist', 'Checklists'],
            ['calendar', 'Calendar'],
            ['transfer', 'Transfer Wizard'],
            ['actions', 'Action Builder'],
            ['validate', 'Validation'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              tab === id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--subtext)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: 'Total evals', value: stats.total },
              { label: 'At risk (≤10d)', value: stats.atRisk },
              { label: 'Overdue', value: stats.overdue },
              { label: 'Annual reviews', value: stats.annual },
              { label: 'Transfers', value: stats.transfer },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3 text-center shadow-card"
              >
                <p className="font-mono text-2xl font-bold text-[var(--accent)]">{c.value}</p>
                <p className="text-xs text-[var(--subtext)]">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">
              From consent → key dates ({profile.name})
            </h2>
            <div className="mt-2 space-y-1">
              {timelineHint.map((line) => (
                <p key={line.label} className="text-xs text-[var(--subtext)]">
                  <strong className="text-[var(--text)]">{line.label}:</strong>{' '}
                  {line.date.toLocaleDateString('en-US')}
                </p>
              ))}
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  filter === f
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--subtext)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
                  <th className="p-2">Student</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Stage</th>
                  <th className="p-2">Evaluator</th>
                  <th className="p-2">60-day</th>
                  <th className="p-2">Days</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr
                    key={e.name}
                    className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--slate)]"
                    onClick={() => {
                      setSelected(e.name)
                      setTab('checklist')
                    }}
                  >
                    <td className="p-2 font-semibold">{e.name}</td>
                    <td className="p-2">{e.type}</td>
                    <td className="p-2">{EVAL_STAGES[e.stage] || e.stage}</td>
                    <td className="p-2">{e.evaluator}</td>
                    <td className="p-2">{e.deadline}</td>
                    <td
                      className={`p-2 font-mono ${
                        e.daysLeft <= 10
                          ? 'font-bold text-red-600'
                          : e.daysLeft <= 30
                            ? 'text-amber-600'
                            : ''
                      }`}
                    >
                      {e.daysLeft}d
                    </td>
                    <td className="p-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(e.status)}`}
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'checklist' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Eval checklist</h2>
          <FieldTip tipId="eval-checklist" className="mb-2 mt-2" />
          <select
            className="mt-2 w-full max-w-xs rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Select student…</option>
            {DEMO_EVALS.map((e) => (
              <option key={e.name} value={e.name}>
                {e.name} — {e.type}
              </option>
            ))}
          </select>
          {!active ? (
            <p className="mt-3 text-xs text-[var(--subtext)]">Select a row or use the dropdown.</p>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-[var(--subtext)]">
                {active.name} · deadline {active.deadline} ({active.daysLeft}d) · stage{' '}
                {EVAL_STAGES[active.stage]}
              </p>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--slate)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.round((active.stage / 5) * 100)}%` }}
                />
              </div>
              {EVAL_CHECKLIST_STEPS.map((step, i) => {
                const done = i < active.stage * 3
                return (
                  <label key={step} className="flex items-start gap-2 text-xs">
                    <input type="checkbox" defaultChecked={done} className="mt-0.5" />
                    <span className={done ? 'text-[var(--subtext)] line-through' : 'font-semibold'}>
                      {i + 1}. {step}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'calendar' && (
        <EvalCalendarPanel
          onSelectEval={(name) => {
            setSelected(name)
            setTab('checklist')
          }}
        />
      )}

      {tab === 'validate' && (
        <EvalValidationPanel
          profile={profile}
          onOpenChecklist={(name) => {
            setSelected(name)
            setTab('checklist')
          }}
        />
      )}

      {tab === 'transfer' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Transfer Wizard — {iep} Section 6</h2>
          <FieldTip tipId="transfer-wizard" className="mb-2 mt-2" />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Student name
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={transferName}
                onChange={(e) => setTransferName(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold">
              Previous district
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={prevDistrict}
                onChange={(e) => setPrevDistrict(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold">
              Transfer date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold">
              IEP available?
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={iepAvailable}
                onChange={(e) => setIepAvailable(e.target.value)}
              >
                <option>Yes</option>
                <option>No</option>
                <option>Electronic only</option>
              </select>
            </label>
          </div>

          {transferTimeline.length > 0 && (
            <div className="mt-4 rounded-xl bg-[var(--slate)] p-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
                District deadlines from transfer date
              </h3>
              <ul className="mt-2 space-y-1 text-xs">
                {transferTimeline.map((l) => (
                  <li key={l.label}>
                    <strong>{l.label}:</strong> {l.date.toLocaleDateString('en-US')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
            Transfer checklist
          </h3>
          <div className="mt-2 space-y-2">
            {transferChecklist.map((step) => (
              <label key={step} className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(transferChecks[step])}
                  onChange={(e) =>
                    setTransferChecks((prev) => ({ ...prev, [step]: e.target.checked }))
                  }
                />
                <span className="font-semibold">{step}</span>
              </label>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => void generateTransferDraft()}
            >
              {busy ? 'Generating…' : 'Generate adoption decision draft'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              disabled={!transferOut}
              onClick={() => void navigator.clipboard.writeText(transferOut).then(() => flash('Copied'))}
            >
              Copy
            </button>
          </div>
          {transferOut && (
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
              {transferOut}
            </pre>
          )}
        </section>
      )}

      {tab === 'actions' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Action Builder — {iep} Section 7</h2>
          <FieldTip tipId="action-builder" className="mb-2 mt-2" />
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ACTION_CARDS.map((card) => (
              <div
                key={card.id}
                className={`rounded-xl border p-3 ${
                  card.highlight
                    ? 'border-red-300 bg-red-50'
                    : 'border-[var(--border)] bg-[var(--card-bg)]'
                }`}
              >
                <h3 className="text-xs font-bold">{card.title}</h3>
                <p className="mt-1 text-[10px] text-[var(--subtext)]">{card.desc}</p>
                <p className="mt-1 text-[10px] text-[var(--text)]">{card.tip}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                      card.highlight
                        ? 'bg-[var(--accent)] text-white'
                        : 'border border-[var(--border)]'
                    }`}
                    onClick={() => void generateActionDraft(card.id, card.title)}
                  >
                    {card.id === 'mdr' ? 'Start MDR wizard' : 'Draft checklist'}
                  </button>
                  {card.link && (
                    <Link to={card.link} className="text-[10px] font-semibold text-[var(--accent)]">
                      Open module →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {actionOut && (
            <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
              {actionOut}
            </pre>
          )}

          {wizard === 'esy' && <EsyWizard profile={profile} onFlash={flash} />}
          {wizard === 'transport' && <TransportWizard profile={profile} onFlash={flash} />}

          {mdrOpen && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
              <h3 className="font-heading text-sm font-bold">
                Manifestation Determination ({mdrDays} school days)
              </h3>
              <label className="mt-2 block text-xs font-semibold">
                Student
                <input
                  className="mt-1 w-full max-w-sm rounded-lg border border-[var(--border)] px-2 py-2"
                  value={mdrStudent}
                  onChange={(e) => setMdrStudent(e.target.value)}
                  placeholder="Student name"
                />
              </label>
              <div className="mt-3 space-y-2">
                {MDR_STEPS.map((step, i) => (
                  <label key={step} className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={Boolean(mdrChecks[i])}
                      onChange={(e) =>
                        setMdrChecks((prev) => ({ ...prev, [i]: e.target.checked }))
                      }
                    />
                    <span className="font-semibold">
                      {i + 1}. {step}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  onClick={() => void generateMdrDraft()}
                >
                  {busy ? 'Generating…' : 'Generate MDR draft'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
                  disabled={!mdrOut}
                  onClick={() => void navigator.clipboard.writeText(mdrOut).then(() => flash('Copied'))}
                >
                  Copy
                </button>
              </div>
              {mdrOut && (
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs">
                  {mdrOut}
                </pre>
              )}
            </div>
          )}
        </section>
      )}
    </PageShell>
  )
}

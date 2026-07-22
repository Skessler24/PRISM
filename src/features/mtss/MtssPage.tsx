import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import { chat } from '../../lib/ai/client'
import {
  ARROWHEAD_FLOW_STEPS,
  PARENT_INPUT_PROMPTS,
  PM_TOOLS,
  REFERRAL_CONCERN_AREAS,
  SST_PREMEETING_SECTIONS,
  SUPPORT_MENUS,
  TEACHER_CHECKLIST,
} from '../../lib/mtss/arrowheadContent'
import {
  ARTIC_NORMS,
  K_MILESTONE_CLUSTERS,
  SLP_RTI_CHECKLIST,
  SLP_RTI_CYCLE,
  SLP_RTI_META,
  SLP_TIER_DEFS,
  buildOfflineEligibilityScaffold,
  buildSpeechRtiDataFormTemplate,
} from '../../lib/mtss/slpRtiGuide'
import {
  addDaysIso,
  daysUntilIso,
  loadMtssState,
  removeCycle,
  setChecklist,
  upsertCycle,
} from '../../lib/mtss/store'
import type { InterventionCycle, MtssDomain } from '../../lib/mtss/types'

type Tab =
  | 'board'
  | 'toolkit'
  | 'cycles'
  | 'referral'
  | 'slp'
  | 'dat'
  | 'eligibility'

const TABS: { id: Tab; label: string }[] = [
  { id: 'board', label: 'Overview' },
  { id: 'toolkit', label: 'Toolkit' },
  { id: 'cycles', label: 'Cycles' },
  { id: 'referral', label: 'Referral' },
  { id: 'slp', label: 'SLP RTI' },
  { id: 'dat', label: 'DAT' },
  { id: 'eligibility', label: 'Eligibility' },
]

const DAT_CHECKLIST = [
  'Confirm dual referral required (Groups DAT + Enrich referral)',
  'Complete Groups DAT referral form',
  'Share IEIF with teammates (including nurse) — do not move/copy the link',
  'Ensure Drive links grant DAT view permission',
  'Document intervention in place (or plan ~6 weeks if missing)',
  'Submit Enrich referral separately',
  'Track health history / nurse input',
]

const REFERRAL_PIPELINE = [
  'Document 4–6 weeks of Tier 2 data (weekly PM) on Data Sheet',
  'Confirm Tier 1 fidelity + classroom differentiation documented',
  'Parent/guardian contact + input prompts completed',
  'Consult / schedule multidisciplinary MTSS meeting',
  'Complete MTSS Referral Form (profile, concerns, linked data, MLL BOE if needed)',
  'If ~2 rounds (~12 weeks) inadequate → evaluation path',
  'Notify parent within district referral window',
  'DAT + Enrich dual referral when evaluating (CCSD)',
  '60-day clock starts when signed consent is received',
]

export function MtssPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [tab, setTab] = useState<Tab>('board')
  const [state, setState] = useState(() => loadMtssState())
  const [studentId, setStudentId] = useState('')
  const [eligOut, setEligOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [supportId, setSupportId] = useState(SUPPORT_MENUS[0].id)

  // New cycle draft
  const [cStudent, setCStudent] = useState('')
  const [cDomain, setCDomain] = useState<MtssDomain>('literacy')
  const [cTier, setCTier] = useState<2 | 3>(2)
  const [cSkill, setCSkill] = useState('')
  const [cTool, setCTool] = useState('Star CBM')
  const [cStart, setCStart] = useState(() => new Date().toISOString().slice(0, 10))

  const cycleWeeks = profile.rules.rtiCycleLengthWeeks || 6
  const minCycles = profile.rules.rtiMinimumCycles || 2

  const tiers = useMemo(() => {
    const t1 = students.filter((s) => s.tier === 1)
    const t2 = students.filter((s) => s.tier === 2)
    const t3 = students.filter((s) => s.tier === 3)
    return { t1, t2, t3 }
  }, [students])

  const student = students.find((s) => s.id === studentId)
  const support = SUPPORT_MENUS.find((m) => m.id === supportId) || SUPPORT_MENUS[0]

  const cycleAlerts = useMemo(() => {
    return state.cycles
      .map((c) => ({ ...c, days: daysUntilIso(c.endDate) }))
      .filter((c) => c.outcome === 'in-progress' && c.days != null && c.days <= 14)
      .sort((a, b) => (a.days ?? 99) - (b.days ?? 99))
  }, [state.cycles])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2600)
  }

  function refresh(next = loadMtssState()) {
    setState(next)
  }

  function toggleCheck(
    group: 'teacher' | 'referral' | 'dat' | 'slpRti',
    key: string,
    value: boolean,
  ) {
    refresh(setChecklist(group, key, value))
  }

  function saveNewCycle() {
    const s = students.find((x) => x.id === cStudent)
    if (!cSkill.trim()) {
      flash('Enter a targeted skill')
      return
    }
    const cycle: InterventionCycle = {
      id: `cyc-${Date.now()}`,
      studentId: cStudent,
      studentName: s?.name || 'Unassigned',
      domain: cDomain,
      tier: cTier,
      targetSkill: cSkill.trim(),
      pmTool: cTool.trim() || 'PM tool TBD',
      startDate: cStart,
      endDate: addDaysIso(cStart, cycleWeeks * 7),
      notes: '',
      weeklyScores: [],
      outcome: 'in-progress',
    }
    refresh(upsertCycle(cycle))
    setCSkill('')
    flash(`Cycle saved · ends ${cycle.endDate}`)
  }

  async function generateEligibility() {
    setBusy(true)
    const related = state.cycles.filter((c) => c.studentId && c.studentId === studentId)
    const cycleBlurb = related.length
      ? related
          .map(
            (c) =>
              `${c.domain} T${c.tier} “${c.targetSkill}” ${c.startDate}→${c.endDate} (${c.outcome}) PM:${c.pmTool}`,
          )
          .join('\n')
      : 'No tracked cycles in PRISM yet'
    const res = await chat([
      {
        role: 'system',
        content: `You prepare SPED eligibility packet drafts for ${profile.name}. RTI gate: ${minCycles} cycles × ${cycleWeeks} weeks. Use Arrowhead-style MTSS language (Data Sheet, weekly PM, parent input). Companion only — no live Enrich/DAT sync.`,
      },
      {
        role: 'user',
        content: `Draft an eligibility prep summary for ${student?.name || 'the student'} (${student?.grade || 'grade TBD'}).
Tier: ${student?.tier ?? 'n/a'}
Disability / concern: ${student?.disability || 'n/a'}
Goals: ${student?.goals.join('; ') || 'n/a'}
Accommodations: ${student?.accommodations.join('; ') || 'n/a'}
DAT dual referral required: ${profile.dat.dualReferralRequired ? 'Yes' : 'No'}
Tracked MTSS cycles:
${cycleBlurb}

Include: referral reason scaffold, intervention data checklist, eligibility criteria prompts, team recommendations placeholders.`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      const offline = buildOfflineEligibilityScaffold({
        studentName: student?.name || '',
        grade: student?.grade || '',
        tier: student?.tier || 2,
        disability: student?.disability || '',
        goals: student?.goals || [],
        rtiCycles: minCycles,
        cycleWeeks,
        dualReferral: profile.dat.dualReferralRequired,
      })
      setEligOut(offline)
      flash(`AI unavailable — offline scaffold ready (${res.error})`)
      return
    }
    setEligOut(res.content)
    flash('Eligibility prep draft ready')
  }

  function offlineEligibility() {
    const offline = buildOfflineEligibilityScaffold({
      studentName: student?.name || '',
      grade: student?.grade || '',
      tier: student?.tier || 2,
      disability: student?.disability || '',
      goals: student?.goals || [],
      rtiCycles: minCycles,
      cycleWeeks,
      dualReferral: profile.dat.dualReferralRequired,
    })
    setEligOut(offline)
    flash('Offline eligibility scaffold ready')
  }

  function exportSpeechForm() {
    const s = students.find((x) => x.id === studentId)
    const text = buildSpeechRtiDataFormTemplate({
      studentName: s?.name || '',
      grade: s?.grade || '',
      teacher: s?.teacher || '',
      therapist: 'SLP',
      goals: s?.goals || [],
    })
    void navigator.clipboard.writeText(text).then(() => flash('Speech RTI data form copied'))
  }

  return (
    <PageShell
      title="📋 MTSS"
      description={`${profile.name} RTI/MTSS hub — Arrowhead 25-26 process + SLP RTI Guide (Kessler). Gate: ${minCycles}×${cycleWeeks} weeks. Browser-only tracking; companion to Enrich/DAT.`}
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              tab === t.id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--subtext)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'board' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card lg:col-span-2">
            <h2 className="font-heading text-sm font-bold">Caseload by tier</h2>
            <p className="mt-1 text-xs text-[var(--subtext)]">
              Live from Student Tiles · open cycles: {state.cycles.filter((c) => c.outcome === 'in-progress').length}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Tier 3 — Intensive', list: tiers.t3, color: 'border-purple-400 bg-purple-50' },
                { label: 'Tier 2 — Targeted', list: tiers.t2, color: 'border-blue-400 bg-blue-50' },
                { label: 'Tier 1 — Universal', list: tiers.t1, color: 'border-emerald-400 bg-emerald-50' },
              ].map((row) => (
                <div key={row.label} className={`rounded-xl border-2 p-3 ${row.color}`}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>{row.label}</span>
                    <span className="font-mono">{row.list.length}</span>
                  </div>
                  <ul className="mt-2 max-h-28 space-y-0.5 overflow-y-auto text-[10px]">
                    {row.list.slice(0, 8).map((s) => (
                      <li key={s.id}>
                        <Link className="font-semibold text-[var(--accent)]" to={`/students?id=${encodeURIComponent(s.id)}`}>
                          {s.name}
                        </Link>
                        {s.grade ? ` · ${s.grade}` : ''}
                      </li>
                    ))}
                    {!row.list.length && <li className="text-[var(--subtext)]">None</li>}
                    {row.list.length > 8 && <li>+{row.list.length - 8} more</li>}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">District RTI gate</h2>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs">
              <li>
                Minimum cycles: <strong>{minCycles}</strong>
              </li>
              <li>
                Cycle length: <strong>{cycleWeeks} weeks</strong>
              </li>
              <li>
                Parent referral notify:{' '}
                <strong>{profile.rules.parentReferralNotificationDays} days</strong>
              </li>
              <li>Team lead: {profile.rules.teamLeadMustBe.join(' or ')}</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button type="button" className="font-semibold text-[var(--accent)]" onClick={() => setTab('cycles')}>
                Track a cycle →
              </button>
              <button type="button" className="font-semibold text-[var(--accent)]" onClick={() => setTab('slp')}>
                SLP RTI Guide →
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Cycle alerts</h2>
            {!cycleAlerts.length && (
              <p className="mt-2 text-xs text-[var(--subtext)]">
                No cycles ending in the next 14 days. Add one under <strong>Cycles</strong>.
              </p>
            )}
            <ul className="mt-2 space-y-2">
              {cycleAlerts.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border-l-4 border-l-amber-500 bg-[var(--sun)] px-3 py-2 text-xs"
                >
                  <strong>{c.studentName}</strong> · Tier {c.tier} {c.domain} · “{c.targetSkill}”
                  <span className="block text-[var(--subtext)]">
                    Ends {c.endDate}
                    {c.days != null ? (c.days < 0 ? ` · overdue ${-c.days}d` : ` · ${c.days}d left`) : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card lg:col-span-2">
            <h2 className="font-heading text-sm font-bold">Arrowhead flow (at a glance)</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
              {ARROWHEAD_FLOW_STEPS.slice(0, 5).map((s) => (
                <li key={s.slice(0, 40)}>{s}</li>
              ))}
            </ol>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-[var(--accent)]"
              onClick={() => setTab('toolkit')}
            >
              Full toolkit & teacher checklist →
            </button>
          </section>
        </div>
      )}

      {tab === 'toolkit' && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Teacher MTSS checklist</h2>
            <p className="mt-1 text-xs text-[var(--subtext)]">From Arrowhead Teacher Checklist — persisted in this browser.</p>
            <div className="mt-3 space-y-2">
              {TEACHER_CHECKLIST.map((step, i) => (
                <label key={step.id} className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={Boolean(state.checklists.teacher[step.id])}
                    onChange={(e) => toggleCheck('teacher', step.id, e.target.checked)}
                  />
                  <span>
                    <strong>{i + 1}.</strong> {step.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Progress monitoring tools</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PM_TOOLS.map((block) => (
                <div key={block.domain} className="rounded-xl border border-[var(--border)] p-3">
                  <h3 className="text-xs font-bold">{block.domain}</h3>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10px] text-[var(--subtext)]">
                    {block.tools.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Classroom support menus</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUPPORT_MENUS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSupportId(m.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    supportId === m.id
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border)]'
                  }`}
                >
                  {m.title}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="text-[10px] font-bold uppercase text-[var(--subtext)]">Identify</h3>
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {support.identify.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase text-[var(--subtext)]">Tier 2 try first</h3>
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {support.tier2.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase text-[var(--subtext)]">Materials</h3>
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {support.materials.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase text-[var(--subtext)]">Intensify + data</h3>
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {[...support.intensify, ...support.data].map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Referral / SST scaffolds</h2>
            <p className="mt-1 text-xs text-[var(--subtext)]">Concern areas & parent prompts from Data Sheet / Referral Form.</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {REFERRAL_CONCERN_AREAS.map((a) => (
                <span key={a} className="rounded-full bg-[var(--sky)] px-2 py-0.5 text-[10px] font-semibold">
                  {a}
                </span>
              ))}
            </div>
            <h3 className="mt-3 text-[10px] font-bold uppercase text-[var(--subtext)]">Parent input prompts</h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
              {PARENT_INPUT_PROMPTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <h3 className="mt-3 text-[10px] font-bold uppercase text-[var(--subtext)]">SST pre-meeting sections</h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
              {SST_PREMEETING_SECTIONS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Full Arrowhead flow</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs">
              {ARROWHEAD_FLOW_STEPS.map((s) => (
                <li key={s.slice(0, 48)}>{s}</li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {tab === 'cycles' && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Start intervention cycle</h2>
            <p className="mt-1 text-xs text-[var(--subtext)]">
              Default length {cycleWeeks} weeks (district rule). Data stays in this browser.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold">
                Student
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={cStudent}
                  onChange={(e) => setCStudent(e.target.value)}
                >
                  <option value="">Select…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · T{s.tier}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold">
                Domain
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={cDomain}
                  onChange={(e) => setCDomain(e.target.value as MtssDomain)}
                >
                  {(['literacy', 'math', 'behavior', 'language', 'speech'] as const).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold">
                Tier
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={cTier}
                  onChange={(e) => setCTier(Number(e.target.value) as 2 | 3)}
                >
                  <option value={2}>Tier 2</option>
                  <option value={3}>Tier 3</option>
                </select>
              </label>
              <label className="text-xs font-semibold">
                Start date
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={cStart}
                  onChange={(e) => setCStart(e.target.value)}
                />
              </label>
              <label className="text-xs font-semibold md:col-span-2">
                Targeted skill (SMART)
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={cSkill}
                  onChange={(e) => setCSkill(e.target.value)}
                  placeholder="e.g. double-digit subtraction with regrouping"
                />
              </label>
              <label className="text-xs font-semibold md:col-span-2">
                Progress monitoring tool
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={cTool}
                  onChange={(e) => setCTool(e.target.value)}
                  list="pm-tools"
                />
                <datalist id="pm-tools">
                  {PM_TOOLS.flatMap((b) => b.tools).map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </label>
            </div>
            <button
              type="button"
              className="mt-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
              onClick={saveNewCycle}
            >
              Save cycle (ends {addDaysIso(cStart, cycleWeeks * 7)})
            </button>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Tracked cycles</h2>
            {!state.cycles.length && (
              <p className="mt-2 text-xs text-[var(--subtext)]">No cycles yet.</p>
            )}
            <ul className="mt-2 space-y-2">
              {state.cycles.map((c) => {
                const days = daysUntilIso(c.endDate)
                return (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[var(--border)] p-3 text-xs"
                  >
                    <div>
                      <p className="font-bold">
                        {c.studentName} · T{c.tier} {c.domain}
                      </p>
                      <p>{c.targetSkill}</p>
                      <p className="text-[var(--subtext)]">
                        {c.startDate} → {c.endDate} · {c.pmTool}
                        {days != null ? ` · ${days}d` : ''} · {c.outcome}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(['in-progress', 'adequate', 'inadequate', 'refer'] as const).map((o) => (
                        <button
                          key={o}
                          type="button"
                          className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                            c.outcome === o ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : ''
                          }`}
                          onClick={() => {
                            refresh(upsertCycle({ ...c, outcome: o }))
                            flash(`Marked ${o}`)
                          }}
                        >
                          {o}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="rounded border border-rose-300 px-2 py-0.5 text-[10px] font-semibold text-rose-700"
                        onClick={() => {
                          refresh(removeCycle(c.id))
                          flash('Cycle removed')
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}

      {tab === 'referral' && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Referral pipeline</h2>
            <FieldTip tipId="mtss-referral" className="mb-2 mt-2" />
            <div className="mt-3 space-y-2">
              {REFERRAL_PIPELINE.map((step, i) => {
                const key = `r${i}`
                return (
                  <label key={key} className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={Boolean(state.checklists.referral[key])}
                      onChange={(e) => toggleCheck('referral', key, e.target.checked)}
                    />
                    <span className="font-semibold">
                      {i + 1}. {step}
                    </span>
                  </label>
                )
              })}
            </div>
            <Link to="/evaluations" className="mt-4 inline-block text-xs font-semibold text-[var(--accent)]">
              Continue in Eval Tracker →
            </Link>
          </section>
        </div>
      )}

      {tab === 'slp' && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">{SLP_RTI_META.title}</h2>
            <p className="mt-1 text-xs text-[var(--subtext)]">
              {SLP_RTI_META.subtitle} · {SLP_RTI_META.author}
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {SLP_TIER_DEFS.map((t) => (
                <div
                  key={t.tier}
                  className={`rounded-xl border-2 p-3 ${
                    t.tier === 1
                      ? 'border-emerald-400 bg-emerald-50'
                      : t.tier === 2
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-purple-400 bg-purple-50'
                  }`}
                >
                  <h3 className="text-xs font-black">
                    Tier {t.tier} — {t.name}
                  </h3>
                  <p className="mt-1 text-[10px] leading-relaxed">{t.summary}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase text-[var(--subtext)]">SLP role</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10px]">
                    {t.slpRole.map((r) => (
                      <li key={r.slice(0, 40)}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Speech RTI cycle</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs">
              {SLP_RTI_CYCLE.map((s) => (
                <li key={s.slice(0, 40)}>{s}</li>
              ))}
            </ol>
            <div className="mt-3 space-y-2">
              {SLP_RTI_CHECKLIST.map((step) => (
                <label key={step.id} className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={Boolean(state.checklists.slpRti[step.id])}
                    onChange={(e) => toggleCheck('slpRti', step.id, e.target.checked)}
                  />
                  <span className="font-semibold">{step.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Articulation norms (guide)</h2>
            <ul className="mt-2 space-y-2 text-xs">
              {ARTIC_NORMS.map((n) => (
                <li key={n.band}>
                  <strong>{n.band}:</strong> {n.sounds}
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-xs font-bold">Kindergarten milestone clusters</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {K_MILESTONE_CLUSTERS.map((c) => (
                <div key={c.title} className="rounded-lg border border-[var(--border)] p-2">
                  <p className="text-[10px] font-bold uppercase text-[var(--subtext)]">{c.title}</p>
                  <ul className="mt-1 list-disc pl-4 text-[10px]">
                    {c.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Speech RTI Progress/Data Form</h2>
            <p className="mt-1 text-xs text-[var(--subtext)]">
              Copy a blank weekly form (goals pull from selected student if imported).
            </p>
            <label className="mt-2 block text-xs font-semibold">
              Student (optional)
              <select
                className="mt-1 w-full max-w-xs rounded-lg border border-[var(--border)] px-2 py-2"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">Blank form…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="mt-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
              onClick={exportSpeechForm}
            >
              Copy data form
            </button>
          </section>
        </div>
      )}

      {tab === 'dat' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">DAT / dual referral workflow</h2>
          <FieldTip tipId="dat-workflow" className="mb-2 mt-2" />
          <p className="mt-2 text-xs text-[var(--subtext)]">
            Dual referral required: {profile.dat.dualReferralRequired ? 'Yes' : 'No'} · If intervention
            missing, plan ~{profile.dat.interventionWeeksIfMissing} weeks.
          </p>
          <div className="mt-3 space-y-2">
            {DAT_CHECKLIST.map((step, i) => {
              const key = `d${i}`
              return (
                <label key={key} className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={Boolean(state.checklists.dat[key])}
                    onChange={(e) => toggleCheck('dat', key, e.target.checked)}
                  />
                  <span className="font-semibold">{step}</span>
                </label>
              )
            })}
          </div>
          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">Paths</h3>
          <ul className="mt-2 list-disc space-y-2 pl-4 text-xs">
            {profile.dat.paths.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">Notes</h3>
          <ul className="mt-2 list-disc space-y-2 pl-4 text-xs">
            {profile.dat.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'eligibility' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Eligibility packet prep</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Uses tracked cycles when available. AI optional — offline scaffold always works. Verify with
            psych before {profile.iepSystem} finalize.
          </p>
          <label className="mt-3 block text-xs font-semibold">
            Student
            <select
              className="mt-1 w-full max-w-xs rounded-lg border border-[var(--border)] px-2 py-2"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · Tier {s.tier}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => void generateEligibility()}
            >
              {busy ? 'Generating…' : 'Generate with AI'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              onClick={offlineEligibility}
            >
              Offline scaffold
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              disabled={!eligOut}
              onClick={() => void navigator.clipboard.writeText(eligOut).then(() => flash('Copied'))}
            >
              Copy
            </button>
          </div>
          {eligOut && (
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
              {eligOut}
            </pre>
          )}
        </section>
      )}
    </PageShell>
  )
}

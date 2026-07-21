import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import { chat } from '../../lib/ai/client'

const REFERRAL_STEPS = [
  'Document 6+ weeks of Tier 2/3 intervention data',
  'Ensure fidelity of intervention delivery',
  'Hold team meeting to review data',
  'If insufficient progress, initiate SPED referral',
  'Notify parent within district referral window',
  'Submit referral to SPED / DAT team',
  'Psychologist assigned; Consent for Evaluation sent',
  '60-day clock starts when signed consent is received',
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

export function MtssPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [tab, setTab] = useState<'overview' | 'referral' | 'dat' | 'eligibility'>('overview')
  const [studentId, setStudentId] = useState('')
  const [datChecks, setDatChecks] = useState<Record<number, boolean>>({})
  const [eligOut, setEligOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const tiers = useMemo(() => {
    const t1 = students.filter((s) => s.tier === 1).length
    const t2 = students.filter((s) => s.tier === 2).length
    const t3 = students.filter((s) => s.tier === 3).length
    return { t1, t2, t3 }
  }, [students])

  const student = students.find((s) => s.id === studentId)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  async function generateEligibility() {
    setBusy(true)
    const res = await chat([
      {
        role: 'system',
        content: `You prepare SPED eligibility packet drafts for ${profile.name}. RTI gate: ${profile.rules.rtiMinimumCycles} cycles × ${profile.rules.rtiCycleLengthWeeks} weeks. Companion only — no live Enrich/DAT sync.`,
      },
      {
        role: 'user',
        content: `Draft an eligibility prep summary for ${student?.name || 'the student'} (${student?.grade || 'grade TBD'}).
Tier: ${student?.tier ?? 'n/a'}
Disability / concern: ${student?.disability || 'n/a'}
Goals: ${student?.goals.join('; ') || 'n/a'}
Accommodations: ${student?.accommodations.join('; ') || 'n/a'}
DAT dual referral required: ${profile.dat.dualReferralRequired ? 'Yes' : 'No'}

Include: referral reason scaffold, intervention data checklist, eligibility criteria prompts, team recommendations placeholders.`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      flash(res.error)
      return
    }
    setEligOut(res.content)
    flash('Eligibility prep draft ready')
  }

  return (
    <PageShell
      title="📋 MTSS Hub"
      description={`RTI / MTSS workspace for ${profile.name}. Minimum ${profile.rules.rtiMinimumCycles} intervention cycles × ${profile.rules.rtiCycleLengthWeeks} weeks before SPED referral. DAT dual-referral reminders included.`}
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['overview', 'Overview'],
            ['referral', 'Referral pipeline'],
            ['dat', 'DAT workflow'],
            ['eligibility', 'Eligibility prep'],
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

      {tab === 'overview' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Caseload by MTSS tier</h2>
            <p className="mt-1 text-xs text-[var(--subtext)]">
              Derived from student <code>tier</code> on the shared store (demo / imported).
            </p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Tier 3 — Intensive', count: tiers.t3, color: 'bg-purple-500' },
                { label: 'Tier 2 — Targeted', count: tiers.t2, color: 'bg-blue-500' },
                { label: 'Tier 1 — Universal', count: tiers.t1, color: 'bg-green-500' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold">{row.label}</span>
                    <span className="font-mono">{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--slate)]">
                    <div
                      className={`h-full rounded-full ${row.color}`}
                      style={{
                        width: `${students.length ? Math.max(8, (row.count / students.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/students" className="mt-4 inline-block text-xs font-semibold text-[var(--accent)]">
              Open Student Tiles →
            </Link>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">District RTI gate</h2>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-[var(--text)]">
              <li>
                Minimum cycles: <strong>{profile.rules.rtiMinimumCycles}</strong>
              </li>
              <li>
                Cycle length: <strong>{profile.rules.rtiCycleLengthWeeks} weeks</strong>
              </li>
              <li>
                Parent referral notify:{' '}
                <strong>{profile.rules.parentReferralNotificationDays} days</strong>
              </li>
              <li>Team lead must be: {profile.rules.teamLeadMustBe.join(' or ')}</li>
            </ul>
            <div className="mt-4 rounded-lg border-l-4 border-l-amber-500 bg-[var(--sun)] p-3 text-xs">
              Intervention ending soon (demo): review Tier 2 reading data before SPED referral
              decision.
            </div>
          </section>
        </div>
      )}

      {tab === 'referral' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Referral pipeline checklist</h2>
          <FieldTip tipId="mtss-referral" className="mb-2 mt-2" />
          <div className="mt-3 space-y-2">
            {REFERRAL_STEPS.map((step, i) => (
              <label key={step} className="flex items-start gap-2 text-xs">
                <input type="checkbox" className="mt-0.5" />
                <span className="font-semibold">
                  {i + 1}. {step}
                </span>
              </label>
            ))}
          </div>
          <Link to="/evaluations" className="mt-4 inline-block text-xs font-semibold text-[var(--accent)]">
            Continue in Eval Tracker →
          </Link>
        </section>
      )}

      {tab === 'dat' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">DAT / dual referral workflow</h2>
          <FieldTip tipId="dat-workflow" className="mb-2 mt-2" />
          <p className="mt-2 text-xs text-[var(--subtext)]">
            Dual referral required: {profile.dat.dualReferralRequired ? 'Yes' : 'No'} · If intervention
            missing, plan ~{profile.dat.interventionWeeksIfMissing} weeks.
          </p>

          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
            Interactive DAT checklist
          </h3>
          <div className="mt-2 space-y-2">
            {DAT_CHECKLIST.map((step, i) => (
              <label key={step} className="flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(datChecks[i])}
                  onChange={(e) => setDatChecks((prev) => ({ ...prev, [i]: e.target.checked }))}
                />
                <span className="font-semibold">{step}</span>
              </label>
            ))}
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
            AI drafts a review packet scaffold. Always verify with your school psychologist before
            finalizing in {profile.iepSystem}.
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
              {busy ? 'Generating…' : 'Generate eligibility prep'}
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

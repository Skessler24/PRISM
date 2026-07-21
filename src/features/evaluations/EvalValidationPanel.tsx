import { useMemo, useState } from 'react'
import { DEMO_EVALS, EVAL_STAGES, type EvalRecord } from '../../data/evals.demo'
import type { DistrictProfile } from '../../lib/district-profiles/types'

type Issue = {
  student: string
  severity: 'error' | 'warn' | 'info'
  code: string
  message: string
}

function validateEval(e: EvalRecord, profile: DistrictProfile): Issue[] {
  const issues: Issue[] = []
  const iep = profile.iepSystem || 'Enrich'
  const seq = profile.rules.enrichFinalizeSequence

  if (e.status === 'Overdue' || e.daysLeft < 0) {
    issues.push({
      student: e.name,
      severity: 'error',
      code: 'OVERDUE',
      message: `Deadline ${e.deadline} is overdue / marked Overdue — escalate before ${iep} finalize.`,
    })
  } else if (e.status === 'At Risk' || e.daysLeft <= 10) {
    issues.push({
      student: e.name,
      severity: 'warn',
      code: 'AT_RISK',
      message: `Only ${e.daysLeft}d left on ${e.deadline}. Send NOM ≥${profile.rules.nomLeadTimeDays} calendar days before meeting.`,
    })
  }

  if (e.type === 'Initial' || e.type === 'Reevaluation' || e.type === 'Transfer') {
    if (!e.consent || e.consent === '—' || /pending/i.test(e.consent)) {
      issues.push({
        student: e.name,
        severity: e.type === 'Transfer' ? 'warn' : 'error',
        code: 'CONSENT',
        message: `Consent is "${e.consent || 'missing'}". ${profile.rules.evaluationWindowDays}-day clock starts on signed consent (initials).`,
      })
    }
  }

  if (e.stage < 4 && e.daysLeft <= 14) {
    issues.push({
      student: e.name,
      severity: 'warn',
      code: 'STAGE_LAG',
      message: `Still at "${EVAL_STAGES[e.stage]}" with ${e.daysLeft}d left — confirm assessment/report pace.`,
    })
  }

  if (e.stage >= 4) {
    issues.push({
      student: e.name,
      severity: 'info',
      code: 'FINALIZE',
      message: `Near finalize: follow ${iep} sequence — ${seq.join(' → ')}. PRISM does not live-sync.`,
    })
  }

  if (e.type === 'Annual' && e.daysLeft <= profile.rules.nomLeadTimeDays + 5) {
    issues.push({
      student: e.name,
      severity: 'warn',
      code: 'NOM',
      message: `Annual review approaching — NOM lead time is ${profile.rules.nomLeadTimeDays} calendar days.`,
    })
  }

  if (!issues.length) {
    issues.push({
      student: e.name,
      severity: 'info',
      code: 'OK',
      message: `No blocking validation issues on demo data for ${e.name}.`,
    })
  }

  return issues
}

type Props = {
  profile: DistrictProfile
  onOpenChecklist: (name: string) => void
}

export function EvalValidationPanel({ profile, onOpenChecklist }: Props) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all')

  const allIssues = useMemo(
    () => DEMO_EVALS.flatMap((e) => validateEval(e, profile)),
    [profile],
  )

  const filtered = allIssues.filter((i) => {
    if (filter === 'all') return true
    return i.severity === filter
  })

  const counts = useMemo(
    () => ({
      error: allIssues.filter((i) => i.severity === 'error').length,
      warn: allIssues.filter((i) => i.severity === 'warn').length,
      info: allIssues.filter((i) => i.severity === 'info').length,
    }),
    [allIssues],
  )

  const copyBlock = filtered
    .map((i) => `[${i.severity.toUpperCase()}] ${i.student} · ${i.code}: ${i.message}`)
    .join('\n')

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
      <h2 className="font-heading text-sm font-bold">
        Validation — {profile.iepSystem} Convert / Validate / Finalize
      </h2>
      <p className="mt-1 text-xs text-[var(--subtext)]">
        Deterministic checks on demo eval pipeline + district rules. Companion: fix issues, then enter
        official data in {profile.iepSystem}.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: 'Errors', value: counts.error, color: 'text-red-600' },
          { label: 'Warnings', value: counts.warn, color: 'text-amber-600' },
          { label: 'Info', value: counts.info, color: 'text-[var(--accent)]' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-[var(--border)] p-2 text-center">
            <p className={`font-mono text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-[var(--subtext)]">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ['all', 'All'],
            ['error', 'Errors'],
            ['warn', 'Warnings'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              filter === id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] text-[var(--subtext)]'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
          onClick={() => void navigator.clipboard.writeText(copyBlock)}
        >
          Copy validation notes
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((i, idx) => (
          <li
            key={`${i.student}-${i.code}-${idx}`}
            className={`rounded-xl border px-3 py-2 text-xs ${
              i.severity === 'error'
                ? 'border-red-200 bg-red-50'
                : i.severity === 'warn'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-[var(--border)] bg-[var(--slate)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">
                {i.student} · {i.code}
              </span>
              <button
                type="button"
                className="font-semibold text-[var(--accent)]"
                onClick={() => onOpenChecklist(i.student)}
              >
                Checklist →
              </button>
            </div>
            <p className="mt-1">{i.message}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

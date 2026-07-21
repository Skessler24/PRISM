import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { statusBadgeClass } from '../../lib/students/normalizeStudent'
import {
  DEMO_EVALS,
  EVAL_CHECKLIST_STEPS,
  EVAL_STAGES,
  type EvalRecord,
} from '../../data/evals.demo'

const FILTERS = ['All', 'Initial', 'Annual', 'Reevaluation', 'Transfer'] as const

export function EvaluationsPage() {
  const { profile, calculateTimeline } = useDistrictProfile()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [selected, setSelected] = useState<string>('')

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

  const stats = useMemo(
    () => ({
      total: DEMO_EVALS.length,
      atRisk: DEMO_EVALS.filter((e) => e.daysLeft <= 10 || e.status === 'At Risk').length,
      overdue: DEMO_EVALS.filter((e) => e.status === 'Overdue').length,
      annual: DEMO_EVALS.filter((e) => e.type === 'Annual').length,
    }),
    [],
  )

  return (
    <PageShell
      title="📊 Evaluation Tracker"
      description={`Compliance timelines for ${profile.name}. Demo eval pipeline below; live clock math uses this district's ${profile.rules.evaluationWindowDays}-day window.`}
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total evals', value: stats.total },
          { label: 'At risk (≤10d)', value: stats.atRisk },
          { label: 'Overdue', value: stats.overdue },
          { label: 'Annual reviews', value: stats.annual },
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
        <h2 className="font-heading text-sm font-bold">From consent → key dates ({profile.name})</h2>
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

      <div className="mb-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card">
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
                onClick={() => setSelected(e.name)}
              >
                <td className="p-2 font-semibold">{e.name}</td>
                <td className="p-2">{e.type}</td>
                <td className="p-2">{EVAL_STAGES[e.stage] || e.stage}</td>
                <td className="p-2">{e.evaluator}</td>
                <td className="p-2">{e.deadline}</td>
                <td
                  className={`p-2 font-mono ${
                    e.daysLeft <= 10 ? 'font-bold text-red-600' : e.daysLeft <= 30 ? 'text-amber-600' : ''
                  }`}
                >
                  {e.daysLeft}d
                </td>
                <td className="p-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(e.status)}`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Eval checklist</h2>
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
    </PageShell>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { daysUntil, statusBadgeClass } from '../../lib/students/normalizeStudent'

export function DashboardPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Denver',
      }),
    [],
  )

  const stats = useMemo(() => {
    const overdue = students.filter((s) => s.status === 'Overdue')
    const upcoming = students.filter((s) => {
      const due = s.hasIEP ? s.iepDue : s.section504Due
      const d = daysUntil(due || undefined)
      return d != null && d >= 0 && d <= 45
    })
    return {
      total: students.length,
      overdue: overdue.length,
      upcoming: upcoming.length,
      with504: students.filter((s) => s.has504).length,
      withMll: students.filter((s) => s.hasMLL).length,
      alerts: [
        ...overdue.map((s) => ({
          tone: 'danger' as const,
          text: `${s.name} — overdue annual / review (${s.iepDue || s.section504Due || 'date TBD'})`,
        })),
        ...upcoming
          .filter((s) => s.status !== 'Overdue')
          .slice(0, 5)
          .map((s) => ({
            tone: 'warn' as const,
            text: `${s.name} — due within 45 days (${s.iepDue || s.section504Due})`,
          })),
      ],
    }
  }, [students])

  return (
    <PageShell
      title="🏠 Main Dashboard"
      description={`AI SPED Secretary HQ for ${profile.name}. Stats read the shared student store (same demo / localStorage as Student Tiles).`}
    >
      <p className="mb-3 text-sm font-semibold text-[var(--text)]">{today}</p>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'Students', value: stats.total, color: 'text-[var(--accent)]' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-600' },
          { label: 'Due ≤45d', value: stats.upcoming, color: 'text-amber-600' },
          { label: '504 plans', value: stats.with504, color: 'text-purple-600' },
          { label: 'MLL', value: stats.withMll, color: 'text-teal-600' },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3 text-center shadow-card"
          >
            <p className={`font-mono text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-[var(--subtext)]">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Compliance alerts</h2>
          <div className="mt-3 space-y-2">
            {stats.alerts.length === 0 ? (
              <p className="text-xs text-[var(--subtext)]">No overdue or near-due reviews in this caseload.</p>
            ) : (
              stats.alerts.map((a) => (
                <div
                  key={a.text}
                  className={`rounded-lg border-l-4 p-2 text-xs ${
                    a.tone === 'danger' ? 'border-l-red-500 bg-[var(--coral)]' : 'border-l-amber-500 bg-[var(--sun)]'
                  }`}
                >
                  {a.text}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Quick links</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { to: '/students', label: 'Student Tiles' },
              { to: '/caseload', label: 'My Caseload' },
              { to: '/templates', label: 'Templates & Forms' },
              { to: '/district', label: 'District Profile' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-xl border border-[var(--border)] bg-[var(--slate)] px-3 py-3 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-[var(--subtext)]">
            Live Azure still serves <code>deploy/</code>. This React dashboard is the Prompt 3 migration
            track.
          </p>
        </section>
      </div>

      <section className="mt-3 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading mb-3 text-sm font-bold">Caseload snapshot</h2>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
              <th className="p-2">Student</th>
              <th className="p-2">Programs</th>
              <th className="p-2">Due</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 8).map((s) => {
              const due = s.hasIEP ? s.iepDue : s.section504Due || ''
              return (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-2 font-semibold">{s.name}</td>
                  <td className="p-2">
                    {[s.hasIEP ? 'IEP' : null, s.has504 ? '504' : null, s.hasMLL ? 'MLL' : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td className="p-2 font-mono">{due || '—'}</td>
                  <td className="p-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </PageShell>
  )
}

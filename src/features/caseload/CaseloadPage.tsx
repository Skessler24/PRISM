import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { daysUntil, statusBadgeClass } from '../../lib/students/normalizeStudent'

export function CaseloadPage() {
  const { students } = useStudents()
  const [provider, setProvider] = useState('All')

  const providers = useMemo(() => {
    const set = new Set(students.map((s) => s.caseManager || s.provider).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [students])

  const rows = useMemo(() => {
    if (provider === 'All') return students
    return students.filter((s) => (s.caseManager || s.provider) === provider)
  }, [students, provider])

  return (
    <PageShell
      title="👤 My Caseload"
      description="Shared caseload table from the same student store as Student Tiles. Session / SOAP depth comes in a later Prompt 3 pass."
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-[var(--subtext)]">
          Case manager
          <select
            className="ml-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-xs text-[var(--text)]"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-[var(--subtext)]">{rows.length} students</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
              <th className="p-3 font-semibold">Student</th>
              <th className="p-3 font-semibold">Grade</th>
              <th className="p-3 font-semibold">Programs</th>
              <th className="p-3 font-semibold">Services</th>
              <th className="p-3 font-semibold">IEP / 504 due</th>
              <th className="p-3 font-semibold">Days</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const due = s.hasIEP ? s.iepDue : s.section504Due || ''
              const days = daysUntil(due || undefined)
              return (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 font-semibold text-[var(--text)]">
                    {s.name}
                    <div className="font-normal text-[var(--subtext)]">{s.caseManager}</div>
                  </td>
                  <td className="p-3">{s.grade}</td>
                  <td className="p-3">
                    {[s.hasIEP ? 'IEP' : null, s.has504 ? '504' : null, s.hasMLL ? 'MLL' : null]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
                  <td className="p-3">{s.discipline.join(', ') || '—'}</td>
                  <td className="p-3">{due || '—'}</td>
                  <td className="p-3 font-mono">{days == null ? '—' : `${days}d`}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-4 text-sm text-[var(--subtext)]">No students in this caseload filter.</p>
        )}
      </div>
    </PageShell>
  )
}

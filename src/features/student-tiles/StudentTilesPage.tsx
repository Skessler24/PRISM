import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { daysUntil, statusBadgeClass } from '../../lib/students/normalizeStudent'
import type { Student } from '../../lib/students/types'

const FILTERS = ['All', 'IEP', '504', 'MLL', 'SLP', 'OT', 'Behavior', 'Academic'] as const

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

function matchesFilter(s: Student, filter: string) {
  if (filter === 'All') return true
  if (filter === 'IEP') return s.hasIEP
  if (filter === '504') return s.has504
  if (filter === 'MLL') return s.hasMLL
  return s.discipline.includes(filter) || s.disability === filter
}

function StudentCard({ student: s }: { student: Student }) {
  const dueDate = s.hasIEP ? s.iepDue : s.has504 ? s.section504Due : ''
  const dueLabel = s.hasIEP ? 'IEP Due' : s.has504 ? '504 Review' : 'Due'
  const days = daysUntil(dueDate || undefined)
  const dayLabel = days == null ? '—' : `${days}d`

  return (
    <article
      className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
      style={{ borderTop: `4px solid ${s.color}` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-slate-800"
          style={{ background: s.color }}
        >
          {initials(s.name)}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text)]">{s.name}</p>
          <p className="text-xs text-[var(--subtext)]">
            {s.grade} · {s.teacher}
            {s.caseManager ? ` · ${s.caseManager}` : ''}
          </p>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {s.hasIEP && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
            IEP
          </span>
        )}
        {s.has504 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            504
          </span>
        )}
        {s.hasMLL && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
            MLL
          </span>
        )}
        {s.discipline.map((d) => (
          <span
            key={d}
            className="rounded-full bg-[var(--sky)] px-2 py-0.5 text-[10px] font-semibold text-slate-700"
          >
            {d}
          </span>
        ))}
        <span className="rounded-full bg-[var(--lav)] px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          {s.disability}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-[var(--subtext)]">
            {dueLabel}: {dueDate || '—'}
          </p>
          <p className="mt-0.5 text-xs">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(s.status)}`}>
              {s.status}
            </span>{' '}
            <span className="font-mono text-[10px] text-[var(--subtext)]">{dayLabel}</span>
          </p>
        </div>
      </div>
      {s.hasMLL && (
        <p className="mt-2 text-[10px] text-[var(--subtext)]">
          {s.homeLanguage || 'Language TBD'}
          {s.eldLevel ? ` · ELD ${s.eldLevel}` : ''}
          {s.interpreterNeeded ? ' · Interpreter' : ''}
        </p>
      )}
    </article>
  )
}

export function StudentTilesPage() {
  const { students, restoreDemo } = useStudents()
  const [filter, setFilter] = useState<string>('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter((s) => {
      if (!matchesFilter(s, filter)) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        (s.caseManager || '').toLowerCase().includes(q) ||
        (s.teacher || '').toLowerCase().includes(q) ||
        (s.homeLanguage || '').toLowerCase().includes(q)
      )
    })
  }, [students, filter, search])

  return (
    <PageShell
      title="🧩 Student Tiles"
      description="Individual student data walls with IEP / 504 / MLL program flags. Demo data is fictional; real caseloads stay in browser localStorage only (FERPA)."
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--subtext)]">
          {filtered.length} of {students.length} students
          {students.some((s) => s.source === 'demo') ? ' · demo caseload' : ''}
        </p>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
          onClick={() => {
            if (confirm('Restore fictional demo students in this browser?')) restoreDemo()
          }}
        >
          Restore Demo
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--subtext)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Search name, teacher, case manager, language…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--subtext)]">No students match. Clear filters or restore demo.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </PageShell>
  )
}

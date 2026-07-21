import { useMemo, useState } from 'react'
import { DEMO_EVALS } from '../../data/evals.demo'
import { statusBadgeClass } from '../../lib/students/normalizeStudent'

type Props = {
  onSelectEval: (name: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function EvalCalendarPanel({ onSelectEval }: Props) {
  const [cursor, setCursor] = useState(() => {
    const first = DEMO_EVALS.map((e) => e.deadline).filter((d) => d && d.includes('-'))[0]
    return parseLocal(first || '2026-07-01') || new Date(2026, 6, 1)
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const out: { day: number | null; iso: string | null }[] = []
    for (let i = 0; i < startPad; i++) out.push({ day: null, iso: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      out.push({ day: d, iso })
    }
    while (out.length % 7 !== 0) out.push({ day: null, iso: null })
    return out
  }, [year, month])

  const byDay = useMemo(() => {
    const map = new Map<string, typeof DEMO_EVALS>()
    for (const e of DEMO_EVALS) {
      if (!e.deadline || e.deadline === '—') continue
      const list = map.get(e.deadline) || []
      list.push(e)
      map.set(e.deadline, list)
    }
    return map
  }, [])

  const dayEvals = selectedDay ? byDay.get(selectedDay) || [] : []
  const label = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function toneDot(status: string, daysLeft: number) {
    if (status === 'Overdue' || daysLeft < 0) return 'bg-red-500'
    if (status === 'At Risk' || daysLeft <= 10) return 'bg-amber-500'
    if (status === 'Pending') return 'bg-purple-500'
    return 'bg-blue-500'
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-bold">Evaluation calendar — {label}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-semibold"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            ←
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-semibold"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            →
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--subtext)]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="p-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c.day || !c.iso) return <div key={`pad-${i}`} className="min-h-14 p-1" />
          const events = byDay.get(c.iso) || []
          const active = selectedDay === c.iso
          return (
            <button
              key={c.iso}
              type="button"
              onClick={() => setSelectedDay(c.iso)}
              className={`min-h-14 rounded-lg border p-1 text-left text-xs ${
                active
                  ? 'border-[var(--accent)] bg-[var(--sky)]'
                  : 'border-transparent hover:border-[var(--border)]'
              }`}
            >
              <span className="font-semibold">{c.day}</span>
              <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                {events.slice(0, 3).map((e) => (
                  <span
                    key={e.name}
                    className={`inline-block h-1.5 w-1.5 rounded-full ${toneDot(e.status, e.daysLeft)}`}
                    title={`${e.name} · ${e.status}`}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
          {selectedDay ? `Due ${selectedDay}` : 'Select a day with a deadline'}
        </h3>
        {!dayEvals.length ? (
          <p className="mt-2 text-xs text-[var(--subtext)]">No demo eval deadlines on this day.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {dayEvals.map((e) => (
              <li key={e.name} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  <strong>{e.name}</strong> · {e.type} · {e.daysLeft}d
                </span>
                <span className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(e.status)}`}>
                    {e.status}
                  </span>
                  <button
                    type="button"
                    className="font-semibold text-[var(--accent)]"
                    onClick={() => onSelectEval(e.name)}
                  >
                    Open checklist →
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

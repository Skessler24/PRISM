import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import {
  DAY_LABELS,
  loadPlanner,
  savePlanner,
  slotsForDay,
  todayPlannerDay,
  todaysSchedule,
  type PlannerSlot,
  type WeeklyPlannerState,
} from '../../lib/weekly-planner/store'
import { materialsForStudent } from '../../lib/classroom-materials/store'

export function WeeklyPlannerPage() {
  const { students } = useStudents()
  const [state, setState] = useState<WeeklyPlannerState>(() => loadPlanner())
  const [day, setDay] = useState<0 | 1 | 2 | 3 | 4>(() => todayPlannerDay())
  const [toast, setToast] = useState('')

  const [studentId, setStudentId] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('09:30')
  const [focus, setFocus] = useState('Speech / language')
  const [location, setLocation] = useState('Therapy room')

  const todaySlots = useMemo(() => todaysSchedule(state), [state])
  const daySlots = useMemo(() => slotsForDay(state, day), [state, day])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2000)
  }

  function persist(next: WeeklyPlannerState) {
    setState(next)
    savePlanner(next)
  }

  function addSlot() {
    if (!studentId) {
      flash('Select a student')
      return
    }
    const s = students.find((x) => x.id === studentId)
    const slot: PlannerSlot = {
      id: `slot-${Date.now()}`,
      day,
      startTime,
      endTime,
      studentId,
      studentName: s?.name || studentId,
      focus,
      location,
      materialIds: materialsForStudent(studentId)
        .slice(0, 3)
        .map((m) => m.id),
    }
    persist({ ...state, slots: [...state.slots, slot] })
    flash('Session added')
  }

  function removeSlot(id: string) {
    persist({ ...state, slots: state.slots.filter((s) => s.id !== id) })
  }

  return (
    <PageShell
      title="📅 Weekly Planner"
      description="Who am I seeing today — build Mon–Fri sessions, auto-link student materials, and surface today's groups on the Dashboard."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <section className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Who am I seeing today?</h2>
        <p className="mt-1 text-xs text-[var(--subtext)]">
          {DAY_LABELS[todayPlannerDay()]} · {todaySlots.length} session
          {todaySlots.length === 1 ? '' : 's'}
        </p>
        <ul className="mt-3 space-y-2">
          {!todaySlots.length && (
            <li className="text-xs text-[var(--subtext)]">Nothing scheduled today — add slots below.</li>
          )}
          {todaySlots.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs"
            >
              <span>
                <strong className="font-mono">
                  {s.startTime}–{s.endTime}
                </strong>{' '}
                · {s.studentName} · {s.focus} · {s.location}
              </span>
              <span className="flex gap-2">
                {s.materialIds[0] && (
                  <Link
                    to={`/materials/session/${s.materialIds[0]}`}
                    className="font-semibold text-emerald-700"
                  >
                    Open material
                  </Link>
                )}
                <Link to="/meeting-prep" className="font-semibold text-[var(--accent)]">
                  Meeting prep
                </Link>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <div className="mb-3 flex flex-wrap gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setDay(i as 0 | 1 | 2 | 3 | 4)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                day === i
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] text-[var(--subtext)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Student
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Select…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Focus
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Start
            <input
              type="time"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            End
            <input
              type="time"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Location
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="mt-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
          onClick={addSlot}
        >
          Add to {DAY_LABELS[day]}
        </button>

        <ul className="mt-4 space-y-2">
          {daySlots.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs"
            >
              <span>
                <strong className="font-mono">
                  {s.startTime}–{s.endTime}
                </strong>{' '}
                · {s.studentName} · {s.focus}
              </span>
              <button
                type="button"
                className="text-red-600"
                onClick={() => removeSlot(s.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { StudentInitials } from '../../components/StudentInitials'
import { useStudents } from '../../lib/students/useStudents'
import {
  DAY_LABELS,
  emptyGroup,
  groupsForDay,
  loadSchedule,
  saveSchedule,
  todayScheduleDay,
  todaysGroups,
  type ScheduleGroup,
  type ScheduleState,
} from '../../lib/scheduling/store'

export function SchedulingPage() {
  const { students } = useStudents()
  const [state, setState] = useState<ScheduleState>(() => loadSchedule())
  const [day, setDay] = useState<0 | 1 | 2 | 3 | 4>(() => todayScheduleDay())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const dayGroups = useMemo(() => groupsForDay(state, day), [state, day])
  const today = useMemo(() => todaysGroups(state), [state])
  const selected = state.groups.find((g) => g.id === selectedId) || null

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2000)
  }

  function persist(next: ScheduleState) {
    setState(next)
    saveSchedule(next)
  }

  function upsert(group: ScheduleGroup) {
    const list = state.groups.some((g) => g.id === group.id)
      ? state.groups.map((g) => (g.id === group.id ? group : g))
      : [...state.groups, group]
    persist({ ...state, groups: list })
  }

  function remove(id: string) {
    persist({ ...state, groups: state.groups.filter((g) => g.id !== id) })
    if (selectedId === id) setSelectedId(null)
    flash('Group removed')
  }

  function toggleStudent(gid: string, studentId: string) {
    const g = state.groups.find((x) => x.id === gid)
    if (!g) return
    const studentIds = g.studentIds.includes(studentId)
      ? g.studentIds.filter((id) => id !== studentId)
      : [...g.studentIds, studentId]
    upsert({ ...g, studentIds })
  }

  function downloadSubPacket() {
    const lines = [
      `PRISM SUB PACKET — ${DAY_LABELS[day]}`,
      `Generated ${new Date().toLocaleString()}`,
      '',
      ...dayGroups.map((g) => {
        const names = g.studentIds
          .map((id) => students.find((s) => s.id === id)?.name || id)
          .join(', ')
        return [
          `${g.startTime}–${g.endTime}  ${g.name}`,
          `  Location: ${g.location || '—'}`,
          `  Students: ${names || '—'}`,
          `  Goals: ${g.goalFocus.join('; ') || '—'}`,
          `  Notes: ${g.notes || '—'}`,
          `  SOAP: S:____ O:____ A:____ P:____`,
          '',
        ].join('\n')
      }),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `prism-sub-packet-${DAY_LABELS[day]}.txt`
    a.click()
    flash('Sub packet downloaded')
  }

  return (
    <PageShell
      title="📅 Scheduling"
      description="Live caseload schedule with clickable groups — who you see, when, and goal focus. Seeded from your Phase 2 session groups."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      {today.length > 0 && day === todayScheduleDay() && (
        <section className="mb-3 rounded-2xl border border-[var(--border)] tint-mint p-3 shadow-card">
          <h2 className="font-heading text-sm font-bold">Live today</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {today.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-left text-xs hover:border-[var(--accent)]"
                  onClick={() => {
                    setSelectedId(g.id)
                  }}
                >
                  <strong className="font-mono">
                    {g.startTime}–{g.endTime}
                  </strong>{' '}
                  {g.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {DAY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              day === i
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] bg-[var(--card-bg)]'
            }`}
            onClick={() => setDay(i as 0 | 1 | 2 | 3 | 4)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
          onClick={() => {
            const g = emptyGroup(day)
            upsert(g)
            setSelectedId(g.id)
          }}
        >
          + Add group
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
          onClick={downloadSubPacket}
        >
          Download sub packet
        </button>
        <Link to="/planner" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">
          Weekly Planner →
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-2">
          {dayGroups.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--subtext)]">
              No groups on {DAY_LABELS[day]}. Add a group or copy from another day.
            </p>
          )}
          {dayGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedId(g.id)}
              className={`w-full rounded-2xl border p-4 text-left shadow-card transition ${
                selectedId === g.id
                  ? 'border-[var(--accent)] tint-lav'
                  : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--accent)]'
              }`}
              style={{ borderTop: '4px solid var(--accent)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-bold text-[var(--accent)]">
                    {g.startTime}–{g.endTime}
                  </p>
                  <h3 className="font-heading text-sm font-bold">{g.name}</h3>
                  <p className="text-[10px] text-[var(--subtext)]">{g.location || 'No location'}</p>
                </div>
                <span className="rounded-full tint-sky px-2 py-0.5 text-[10px] font-bold">
                  {g.studentIds.length} students
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {g.studentIds.map((id) => {
                  const s = students.find((x) => x.id === id)
                  return s ? (
                    <StudentInitials key={id} name={s.name} color={s.color} title={s.name} />
                  ) : null
                })}
              </div>
              {g.goalFocus.length > 0 && (
                <p className="mt-2 text-[10px] text-[var(--subtext)]">
                  Goals: {g.goalFocus.join(' · ')}
                </p>
              )}
            </button>
          ))}
        </section>

        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          {!selected ? (
            <p className="text-xs text-[var(--subtext)]">Click a group to edit students, goals, and notes.</p>
          ) : (
            <div className="space-y-3">
              <h2 className="font-heading text-sm font-bold">Edit group</h2>
              <label className="block text-[10px] font-bold">
                Name
                <input
                  className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                  value={selected.name}
                  onChange={(e) => upsert({ ...selected, name: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[10px] font-bold">
                  Start
                  <input
                    type="time"
                    className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                    value={selected.startTime}
                    onChange={(e) => upsert({ ...selected, startTime: e.target.value })}
                  />
                </label>
                <label className="block text-[10px] font-bold">
                  End
                  <input
                    type="time"
                    className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                    value={selected.endTime}
                    onChange={(e) => upsert({ ...selected, endTime: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-[10px] font-bold">
                Location
                <input
                  className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                  value={selected.location}
                  onChange={(e) => upsert({ ...selected, location: e.target.value })}
                />
              </label>
              <label className="block text-[10px] font-bold">
                Goal focus (one per line)
                <textarea
                  className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                  rows={3}
                  value={selected.goalFocus.join('\n')}
                  onChange={(e) =>
                    upsert({
                      ...selected,
                      goalFocus: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean),
                    })
                  }
                />
              </label>
              <div>
                <p className="text-[10px] font-bold">Students in group</p>
                <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto">
                  {students.map((s) => (
                    <li key={s.id}>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={selected.studentIds.includes(s.id)}
                          onChange={() => toggleStudent(selected.id, s.id)}
                        />
                        <StudentInitials name={s.name} color={s.color} />
                        {s.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <label className="block text-[10px] font-bold">
                Notes
                <textarea
                  className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                  rows={2}
                  value={selected.notes}
                  onChange={(e) => upsert({ ...selected, notes: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="w-full rounded-lg border border-red-300 px-2 py-2 text-xs font-semibold text-red-700"
                onClick={() => remove(selected.id)}
              >
                Delete group
              </button>
            </div>
          )}
        </aside>
      </div>
    </PageShell>
  )
}

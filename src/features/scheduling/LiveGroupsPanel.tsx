import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StudentInitials } from '../../components/StudentInitials'
import { useStudents } from '../../lib/students/useStudents'
import {
  mondayOf,
  noSchoolDatesOnWeek,
} from '../../lib/scheduling/calendarCountdown'
import {
  DAY_LABELS,
  copyGroupsToDay,
  emptyGroup,
  groupsForDay,
  loadSchedule,
  saveSchedule,
  todayScheduleDay,
  todaysGroups,
  type ScheduleGroup,
  type ScheduleState,
} from '../../lib/scheduling/store'

type Props = {
  onFlash: (msg: string) => void
}

export function LiveGroupsPanel({ onFlash }: Props) {
  const { students } = useStudents()
  const [state, setState] = useState<ScheduleState>(() => loadSchedule())
  const [day, setDay] = useState<0 | 1 | 2 | 3 | 4>(() => todayScheduleDay())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copyFrom, setCopyFrom] = useState<0 | 1 | 2 | 3 | 4>(0)

  const dayGroups = useMemo(() => groupsForDay(state, day), [state, day])
  const today = useMemo(() => todaysGroups(state), [state])
  const selected = state.groups.find((g) => g.id === selectedId) || null

  const weekOff = useMemo(() => {
    const mon = mondayOf()
    return noSchoolDatesOnWeek(mon)
  }, [])
  const offForDay = (() => {
    const mon = mondayOf()
    const d = new Date(mon)
    d.setDate(mon.getDate() + day)
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return weekOff.find((x) => x.date === ymd)
  })()

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
    onFlash('Group removed')
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
    onFlash('Sub packet downloaded')
  }

  return (
    <div>
      {today.length > 0 && day === todayScheduleDay() && (
        <section className="mb-3 rounded-2xl border border-[var(--border)] tint-mint p-3 shadow-card">
          <h2 className="font-heading text-sm font-bold">Live today</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {today.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-left text-xs hover:border-[var(--accent)]"
                  onClick={() => setSelectedId(g.id)}
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

      {offForDay && (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          📅 District calendar: {offForDay.title} on {DAY_LABELS[day]} this week
        </p>
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
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1">
          <label className="text-[10px] font-bold text-[var(--subtext)]">Copy from</label>
          <select
            className="rounded border-0 bg-transparent text-xs font-semibold outline-none"
            value={copyFrom}
            onChange={(e) => setCopyFrom(Number(e.target.value) as 0 | 1 | 2 | 3 | 4)}
          >
            {DAY_LABELS.map((l, i) => (
              <option key={l} value={i}>
                {l}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-white"
            onClick={() => {
              persist(copyGroupsToDay(state, copyFrom, day))
              onFlash(`Copied ${DAY_LABELS[copyFrom]} → ${DAY_LABELS[day]}`)
            }}
          >
            Paste onto {DAY_LABELS[day]}
          </button>
        </div>
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
            <div
              key={g.id}
              className={`rounded-2xl border p-4 shadow-card transition ${
                selectedId === g.id
                  ? 'border-[var(--accent)] tint-lav'
                  : 'border-[var(--border)] bg-[var(--card-bg)]'
              }`}
              style={{ borderTop: '4px solid var(--accent)' }}
            >
              <button type="button" className="w-full text-left" onClick={() => setSelectedId(g.id)}>
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
              {g.studentIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-2">
                  <span className="text-[10px] font-bold text-[var(--subtext)]">I saw this group →</span>
                  {g.studentIds.map((id) => {
                    const s = students.find((x) => x.id === id)
                    if (!s) return null
                    return (
                      <Link
                        key={id}
                        to={`/caseload?tab=soap&student=${encodeURIComponent(id)}`}
                        className="rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-2 py-0.5 text-[10px] font-semibold hover:border-[var(--accent)]"
                      >
                        {s.name.split(' ')[0]} SOAP
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </section>

        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          {!selected ? (
            <p className="text-xs text-[var(--subtext)]">
              Click a group to edit students, goals, and notes.
            </p>
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
                      goalFocus: e.target.value
                        .split('\n')
                        .map((x) => x.trim())
                        .filter(Boolean),
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
    </div>
  )
}

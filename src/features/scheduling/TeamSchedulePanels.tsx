import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  PRESET_COLORS,
  TEAM_DAYS,
  TEAM_DAY_SHORTS,
  TEAM_GRADE_LEVELS,
  TEAM_GRADES,
  TEAM_ROLES,
  TEAM_SERVICES,
  constraintClass,
  fmt12,
  getSchedMin,
  getTimeSlots,
  gid,
  hasConflict,
  initials,
  isBlocked,
  isConstrained,
  loadTeamSchedule,
  resetTeamSchedule,
  saveTeamSchedule,
  sessionsAt,
  statusColor,
  type BlockedSlot,
  type IepDay,
  type MasterConstraint,
  type TeamDay,
  type TeamProvider,
  type TeamRosterStudent,
  type TeamScheduleState,
  type TeamSession,
  type TeamSettings,
} from '../../lib/scheduling/teamStore'
import {
  downloadSampleSchoolSchedule,
} from '../../lib/scheduling/csv'
import { constraintsFromScheduleFile } from '../../lib/scheduling/xlsxImport'

type Props = {
  onFlash: (msg: string) => void
}

function useTeamState(onFlash: (msg: string) => void) {
  const [state, setState] = useState<TeamScheduleState>(() => loadTeamSchedule())

  function persist(next: TeamScheduleState) {
    setState(next)
    saveTeamSchedule(next)
  }

  function patch(partial: Partial<TeamScheduleState>, msg?: string) {
    persist({ ...state, ...partial })
    if (msg) onFlash(msg)
  }

  return { state, setState, persist, patch }
}

export function TeamWeekPanel({ onFlash }: Props) {
  const { state, persist, patch } = useTeamState(onFlash)
  const [blockMode, setBlockMode] = useState(false)
  const [sessionModal, setSessionModal] = useState<{
    day: TeamDay
    time: string
    sessId?: string
  } | null>(null)
  const [blockModal, setBlockModal] = useState<{ day: TeamDay; time: string } | null>(null)
  const [popover, setPopover] = useState<{ sessId: string; x: number; y: number } | null>(null)
  const [studentModal, setStudentModal] = useState<string | 'new' | null>(null)

  const slots = useMemo(() => getTimeSlots(state.settings), [state.settings])
  const providerId = state.activeProviderId

  const sidebarStudents = useMemo(() => {
    if (providerId === 'all') return state.students
    return state.students.filter((s) => s.providerId === providerId)
  }, [state.students, providerId])

  function openCell(day: TeamDay, time: string, e: MouseEvent) {
    const target = e.target as HTMLElement
    const card = target.closest('[data-sessid]') as HTMLElement | null
    if (card?.dataset.sessid) {
      const rect = card.getBoundingClientRect()
      setPopover({ sessId: card.dataset.sessid, x: rect.right + 8, y: rect.top })
      return
    }
    if (isConstrained(state, day, time)) return
    if (isBlocked(state, day, time, providerId === 'all' ? '' : providerId)) {
      if (confirm(`Unblock ${day} at ${fmt12(time)}?`)) {
        patch({
          blockedSlots: state.blockedSlots.filter(
            (b) => !(b.day === day && b.startTime === time),
          ),
        })
      }
      return
    }
    if (sessionsAt(state, day, time, providerId).length) return
    if (blockMode) setBlockModal({ day, time })
    else setSessionModal({ day, time })
  }

  return (
    <div className="flex min-h-[28rem] flex-col gap-3 lg:flex-row">
      <aside className="w-full shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3 shadow-card lg:w-64">
        <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--subtext)]">
          Viewing
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={providerId}
            onChange={(e) => patch({ activeProviderId: e.target.value })}
          >
            <option value="all">All Providers</option>
            {state.providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-bold">Caseload</span>
          <span className="rounded-full tint-sky px-1.5 py-0.5 text-[10px] font-bold">
            {sidebarStudents.length}
          </span>
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-lg bg-[var(--accent)] py-1.5 text-xs font-semibold text-white"
          onClick={() => setStudentModal('new')}
        >
          + Add Student
        </button>
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {sidebarStudents.map((s) => {
            const sched = getSchedMin(state, s.id)
            const sc = statusColor(sched, s.requiredMinutes)
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs hover:bg-[var(--slate)]"
                  onClick={() => setStudentModal(s.id)}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: s.color }}
                  >
                    {initials(s.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{s.name}</span>
                  <span className="text-[9px] tabular-nums" style={{ color: sc.text }}>
                    {sched}/{s.requiredMinutes}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-3 border-t border-[var(--border)] pt-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-[var(--subtext)]">
            Minutes summary
          </h3>
          <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto">
            {sidebarStudents.map((s) => {
              const sched = getSchedMin(state, s.id)
              const pct = s.requiredMinutes > 0 ? Math.min(sched / s.requiredMinutes, 1) : 0
              const sc = statusColor(sched, s.requiredMinutes)
              return (
                <li key={s.id} className="text-[10px]">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate">{s.name}</span>
                    <span style={{ color: sc.text }}>{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full" style={{ background: sc.bg }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct * 100}%`, background: sc.fill }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-sm font-bold">Weekly Schedule</h2>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                blockMode
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-[var(--border)]'
              }`}
              onClick={() => setBlockMode((v) => !v)}
            >
              {blockMode ? 'Blocking…' : 'Block Time'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-2 shadow-card">
          <table className="w-full min-w-[680px] table-fixed border-collapse text-left">
            <thead>
              <tr>
                <th className="w-14 py-1.5 pl-1 text-[10px] font-bold uppercase tracking-wide text-[var(--subtext)]">
                  Time
                </th>
                {TEAM_DAY_SHORTS.map((d) => (
                  <th
                    key={d}
                    className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--subtext)]"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.slice(0, -1).map((time) => (
                <tr key={time} className="border-t border-[var(--border)]">
                  <td className="py-1 pl-1 align-top font-mono text-[10px] text-[var(--subtext)]">
                    {fmt12(time)}
                  </td>
                  {TEAM_DAYS.map((day) => {
                    const constraint = isConstrained(state, day, time)
                    const blocked = isBlocked(
                      state,
                      day,
                      time,
                      providerId === 'all' ? '' : providerId,
                    )
                    const sess = sessionsAt(state, day, time, providerId)
                    const cls = [
                      'relative min-h-[2.5rem] cursor-pointer p-0.5 align-top',
                      constraint ? constraintClass(constraint.type) : '',
                      blocked && !constraint ? 'team-pat-blocked' : '',
                      !constraint && !blocked && !sess.length
                        ? blockMode
                          ? 'hover:bg-red-50'
                          : 'hover:bg-sky-50'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    return (
                      <td
                        key={day}
                        className={cls}
                        onClick={(e) => openCell(day, time, e)}
                        title={
                          constraint
                            ? constraint.label
                            : blocked
                              ? 'Blocked'
                              : blockMode
                                ? 'Click to block'
                                : 'Click to add session'
                        }
                      >
                        {constraint && (
                          <span className="block truncate px-1 text-[9px] font-semibold text-stone-600">
                            {constraint.label}
                          </span>
                        )}
                        {blocked && !constraint && (
                          <span className="block truncate px-1 text-[9px] font-semibold text-stone-500">
                            Blocked
                          </span>
                        )}
                        {sess.map((s) => {
                          const studs = s.studentIds
                            .map((id) => state.students.find((x) => x.id === id))
                            .filter(Boolean)
                          const prov = state.providers.find((p) => p.id === s.providerId)
                          const color = studs[0]?.color || prov?.color || '#3b82f6'
                          return (
                            <div
                              key={s.id}
                              data-sessid={s.id}
                              className="mb-0.5 cursor-pointer rounded px-1 py-0.5 text-[10px] leading-tight text-white"
                              style={{
                                background: color,
                                minHeight: s.duration === 60 ? '3rem' : undefined,
                              }}
                            >
                              {studs.map((st) => st!.name).join(', ') || 'Session'}
                              {s.duration === 60 ? ' · 60m' : ''}
                            </div>
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {popover && (
        <SessionPopover
          state={state}
          sessId={popover.sessId}
          x={popover.x}
          y={popover.y}
          onClose={() => setPopover(null)}
          onEdit={() => {
            const s = state.sessions.find((x) => x.id === popover.sessId)
            if (!s) return
            setPopover(null)
            setSessionModal({ day: s.day, time: s.startTime, sessId: s.id })
          }}
          onDelete={() => {
            patch(
              { sessions: state.sessions.filter((s) => s.id !== popover.sessId) },
              'Session deleted',
            )
            setPopover(null)
          }}
        />
      )}

      {sessionModal && (
        <SessionModal
          state={state}
          day={sessionModal.day}
          time={sessionModal.time}
          sessId={sessionModal.sessId}
          onClose={() => setSessionModal(null)}
          onSave={(sess) => {
            const next = sessionModal.sessId
              ? state.sessions.map((s) => (s.id === sess.id ? sess : s))
              : [...state.sessions, sess]
            persist({ ...state, sessions: next })
            onFlash('Session saved')
            setSessionModal(null)
          }}
        />
      )}

      {blockModal && (
        <BlockModal
          day={blockModal.day}
          time={blockModal.time}
          onClose={() => setBlockModal(null)}
          onSave={(slots) => {
            patch({ blockedSlots: [...state.blockedSlots, ...slots] }, 'Time blocked')
            setBlockModal(null)
          }}
          providerId={providerId === 'all' ? null : providerId}
        />
      )}

      {studentModal && (
        <StudentModal
          state={state}
          studentId={studentModal === 'new' ? null : studentModal}
          defaultProvider={providerId !== 'all' ? providerId : null}
          onClose={() => setStudentModal(null)}
          onSave={(stu) => {
            const exists = state.students.some((s) => s.id === stu.id)
            patch(
              {
                students: exists
                  ? state.students.map((s) => (s.id === stu.id ? stu : s))
                  : [...state.students, stu],
              },
              'Student saved',
            )
            setStudentModal(null)
          }}
        />
      )}
    </div>
  )
}

function SessionPopover({
  state,
  sessId,
  x,
  y,
  onClose,
  onEdit,
  onDelete,
}: {
  state: TeamScheduleState
  sessId: string
  x: number
  y: number
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const sess = state.sessions.find((s) => s.id === sessId)
  if (!sess) return null
  const studs = sess.studentIds
    .map((id) => state.students.find((s) => s.id === id))
    .filter(Boolean)
  const prov = state.providers.find((p) => p.id === sess.providerId)
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 cursor-default" onClick={onClose} aria-label="Close" />
      <div
        className="fixed z-50 w-56 rounded-xl border border-[var(--border)] bg-white p-3 shadow-lg"
        style={{ left: Math.min(x, window.innerWidth - 240), top: Math.min(y, window.innerHeight - 160) }}
      >
        <p className="text-sm font-semibold">{studs.map((s) => s!.name).join(', ')}</p>
        <p className="text-[10px] text-[var(--subtext)]">{prov?.name || 'Unassigned'}</p>
        <p className="mt-1 text-xs">
          {sess.day} · {fmt12(sess.startTime)} · {sess.duration} min
        </p>
        <p className="text-[10px] text-[var(--subtext)]">
          {sess.sessionType === 'Group' || studs.length > 1 ? 'Group' : 'Individual'}
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg bg-sky-100 py-1.5 text-xs font-semibold text-sky-800"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-red-100 py-1.5 text-xs font-semibold text-red-700"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </>
  )
}

function SessionModal({
  state,
  day,
  time,
  sessId,
  onClose,
  onSave,
}: {
  state: TeamScheduleState
  day: TeamDay
  time: string
  sessId?: string
  onClose: () => void
  onSave: (s: TeamSession) => void
}) {
  const existing = sessId ? state.sessions.find((s) => s.id === sessId) : undefined
  const [providerId, setProviderId] = useState(
    existing?.providerId ||
      (state.activeProviderId !== 'all' ? state.activeProviderId : state.providers[0]?.id || ''),
  )
  const [sessDay, setSessDay] = useState<TeamDay>(existing?.day || day)
  const [sessTime, setSessTime] = useState(existing?.startTime || time)
  const [duration, setDuration] = useState<30 | 60>(existing?.duration || state.settings.defaultDuration)
  const [sessionType, setSessionType] = useState<'Individual' | 'Group'>(
    existing?.sessionType || 'Individual',
  )
  const [studentIds, setStudentIds] = useState<string[]>(existing?.studentIds || [])
  const slots = getTimeSlots(state.settings)
  const roster = state.students.filter((s) => s.providerId === providerId)
  const conflict = hasConflict(state, sessDay, sessTime, duration, studentIds, sessId)
  const constrained = !!isConstrained(state, sessDay, sessTime)

  return (
    <Modal title={sessId ? 'Edit Session' : 'Add Session'} onClose={onClose}>
      {conflict && (
        <p className="mb-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
          Conflict: student already booked at this time.
        </p>
      )}
      {constrained && (
        <p className="mb-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800">
          This slot is protected by a master constraint.
        </p>
      )}
      <label className="block text-[10px] font-bold">
        Provider
        <select
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={providerId}
          onChange={(e) => {
            setProviderId(e.target.value)
            setStudentIds([])
          }}
        >
          {state.providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block text-[10px] font-bold">
          Day
          <select
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={sessDay}
            onChange={(e) => setSessDay(e.target.value as TeamDay)}
          >
            {TEAM_DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[10px] font-bold">
          Start
          <select
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={sessTime}
            onChange={(e) => setSessTime(e.target.value)}
          >
            {slots.map((t) => (
              <option key={t} value={t}>
                {fmt12(t)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="mt-2">
        <legend className="text-[10px] font-bold">Duration</legend>
        <div className="mt-1 flex gap-2">
          {([30, 60] as const).map((d) => (
            <label key={d} className="flex items-center gap-1.5 rounded-lg bg-[var(--slate)] px-3 py-2 text-xs">
              <input
                type="radio"
                checked={duration === d}
                onChange={() => setDuration(d)}
              />
              {d} min
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-2">
        <legend className="text-[10px] font-bold">Session type</legend>
        <div className="mt-1 flex gap-2">
          {(['Individual', 'Group'] as const).map((t) => (
            <label key={t} className="flex items-center gap-1.5 rounded-lg bg-[var(--slate)] px-3 py-2 text-xs">
              <input
                type="radio"
                checked={sessionType === t}
                onChange={() => setSessionType(t)}
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-2">
        <p className="text-[10px] font-bold">Students</p>
        <ul className="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-lg bg-[var(--slate)] p-2">
          {roster.length === 0 && (
            <li className="text-xs italic text-[var(--subtext)]">No students for this provider.</li>
          )}
          {roster.map((st) => (
            <li key={st.id}>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={studentIds.includes(st.id)}
                  onChange={() =>
                    setStudentIds((ids) =>
                      ids.includes(st.id) ? ids.filter((x) => x !== st.id) : [...ids, st.id],
                    )
                  }
                />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: st.color }} />
                {st.name}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-xs font-semibold text-white"
          onClick={() => {
            if (!studentIds.length) {
              alert('Select at least one student.')
              return
            }
            if (constrained) {
              alert('This slot is protected.')
              return
            }
            if (conflict && !confirm('Scheduling conflict detected. Save anyway?')) return
            onSave({
              id: existing?.id || gid(),
              day: sessDay,
              startTime: sessTime,
              duration,
              sessionType,
              studentIds,
              providerId,
            })
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-semibold"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}

function BlockModal({
  day,
  time,
  providerId,
  onClose,
  onSave,
}: {
  day: TeamDay
  time: string
  providerId: string | null
  onClose: () => void
  onSave: (slots: BlockedSlot[]) => void
}) {
  const [reason, setReason] = useState('Lunch')
  const [custom, setCustom] = useState('')
  const [allDays, setAllDays] = useState(false)
  return (
    <Modal title="Block Time" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] font-bold uppercase text-[var(--subtext)]">Day</p>
          <p className="mt-0.5 rounded-lg bg-[var(--slate)] px-2 py-1.5">{day}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-[var(--subtext)]">Time</p>
          <p className="mt-0.5 rounded-lg bg-[var(--slate)] px-2 py-1.5">{fmt12(time)}</p>
        </div>
      </div>
      <label className="mt-2 block text-[10px] font-bold">
        Reason
        <select
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {['Lunch', 'Specials/Electives', 'Recess', 'Assembly', 'Testing', 'IEP Meeting', 'Other'].map(
            (r) => (
              <option key={r}>{r}</option>
            ),
          )}
        </select>
      </label>
      {reason === 'Other' && (
        <label className="mt-2 block text-[10px] font-bold">
          Custom
          <input
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </label>
      )}
      <label className="mt-2 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={allDays} onChange={(e) => setAllDays(e.target.checked)} />
        Apply to all days
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-semibold text-white"
          onClick={() => {
            const r = reason === 'Other' ? custom.trim() || 'Blocked' : reason
            const days = allDays ? [...TEAM_DAYS] : [day]
            onSave(
              days.map((d) => ({
                id: gid(),
                day: d,
                startTime: time,
                reason: r,
                providerId,
              })),
            )
          }}
        >
          Block
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-semibold"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}

function StudentModal({
  state,
  studentId,
  defaultProvider,
  onClose,
  onSave,
}: {
  state: TeamScheduleState
  studentId: string | null
  defaultProvider: string | null
  onClose: () => void
  onSave: (s: TeamRosterStudent) => void
}) {
  const existing = studentId ? state.students.find((s) => s.id === studentId) : undefined
  const [name, setName] = useState(existing?.name || '')
  const [grade, setGrade] = useState(existing?.grade || '3')
  const [serviceType, setServiceType] = useState(existing?.serviceType || TEAM_SERVICES[0])
  const [providerId, setProviderId] = useState(
    existing?.providerId || defaultProvider || '',
  )
  const [requiredMinutes, setRequiredMinutes] = useState(existing?.requiredMinutes || 30)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(existing?.sessionsPerWeek || 2)
  const [color, setColor] = useState(existing?.color || PRESET_COLORS[0])
  const [notes, setNotes] = useState(existing?.notes || '')

  return (
    <Modal title={studentId ? 'Edit Student' : 'Add Student'} onClose={onClose}>
      <label className="block text-[10px] font-bold">
        Name *
        <input
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block text-[10px] font-bold">
          Grade
          <select
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            {TEAM_GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="block text-[10px] font-bold">
          Sessions/wk
          <input
            type="number"
            min={1}
            max={5}
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={sessionsPerWeek}
            onChange={(e) => setSessionsPerWeek(Number(e.target.value) || 1)}
          />
        </label>
      </div>
      <label className="mt-2 block text-[10px] font-bold">
        Service
        <select
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          {TEAM_SERVICES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="mt-2 block text-[10px] font-bold">
        Provider
        <select
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {state.providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-2 block text-[10px] font-bold">
        Required min/week
        <input
          type="number"
          min={1}
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={requiredMinutes}
          onChange={(e) => setRequiredMinutes(Number(e.target.value) || 30)}
        />
      </label>
      <div className="mt-2">
        <p className="text-[10px] font-bold">Color</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-stone-800' : 'border-transparent'}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <label className="mt-2 block text-[10px] font-bold">
        Notes
        <textarea
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-xs font-semibold text-white"
          onClick={() => {
            if (!name.trim()) {
              alert('Enter student name.')
              return
            }
            onSave({
              id: existing?.id || gid(),
              name: name.trim(),
              grade,
              serviceType,
              providerId: providerId || null,
              requiredMinutes,
              sessionsPerWeek,
              color,
              notes: notes.trim(),
              prismStudentId: existing?.prismStudentId,
            })
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-semibold"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}

export function TeamProvidersPanel({ onFlash }: Props) {
  const { state, patch } = useTeamState(onFlash)
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Provider Team</h2>
        <button
          type="button"
          className="rounded-lg bg-teal-500 px-3 py-2 text-xs font-semibold text-white"
          onClick={() => setEditing('new')}
        >
          + Add Provider
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {state.providers.map((prov) => {
          const studs = state.students.filter((s) => s.providerId === prov.id)
          const totalReq = studs.reduce((a, s) => a + s.requiredMinutes, 0)
          const totalSched = studs.reduce((a, s) => a + getSchedMin(state, s.id), 0)
          const sessCount = state.sessions.filter((s) => s.providerId === prov.id).length
          const pct = totalReq > 0 ? Math.min(totalSched / totalReq, 1) : 0
          const sc = statusColor(totalSched, totalReq)
          return (
            <article
              key={prov.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: prov.color }}
                  >
                    {initials(prov.name)}
                  </div>
                  <div>
                    <h3 className="font-bold">{prov.name}</h3>
                    <span className="mt-0.5 inline-block rounded-full bg-[var(--slate)] px-2 py-0.5 text-[10px] font-medium">
                      {prov.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--accent)]"
                    onClick={() => setEditing(prov.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() => {
                      if (!confirm(`Delete "${prov.name}"?`)) return
                      patch(
                        {
                          providers: state.providers.filter((p) => p.id !== prov.id),
                          sessions: state.sessions.filter((s) => s.providerId !== prov.id),
                          students: state.students.map((s) =>
                            s.providerId === prov.id ? { ...s, providerId: null } : s,
                          ),
                        },
                        'Provider deleted',
                      )
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-sky-700">{prov.gradeLevel}</p>
              <div className="mt-2 flex gap-3 text-[10px] text-[var(--subtext)]">
                <span>
                  <strong className="text-[var(--text)]">{studs.length}</strong> students
                </span>
                <span>
                  <strong className="text-[var(--text)]">{totalReq}</strong> min/wk
                </span>
                <span>
                  <strong className="text-[var(--text)]">{sessCount}</strong> sessions
                </span>
              </div>
              <div className="mt-2 flex gap-1">
                {TEAM_DAYS.map((d, i) => (
                  <span
                    key={d}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                      prov.availableDays.includes(d)
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    {'MTWRF'[i]}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: sc.bg }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct * 100}%`, background: sc.fill }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: sc.text }}>
                  {Math.round(pct * 100)}%
                </span>
              </div>
            </article>
          )
        })}
      </div>
      {editing && (
        <ProviderModal
          state={state}
          providerId={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(prov) => {
            const exists = state.providers.some((p) => p.id === prov.id)
            patch(
              {
                providers: exists
                  ? state.providers.map((p) => (p.id === prov.id ? prov : p))
                  : [...state.providers, prov],
              },
              'Provider saved',
            )
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ProviderModal({
  state,
  providerId,
  onClose,
  onSave,
}: {
  state: TeamScheduleState
  providerId: string | null
  onClose: () => void
  onSave: (p: TeamProvider) => void
}) {
  const existing = providerId ? state.providers.find((p) => p.id === providerId) : undefined
  const [name, setName] = useState(existing?.name || '')
  const [role, setRole] = useState(existing?.role || TEAM_ROLES[0])
  const [gradeLevel, setGradeLevel] = useState(existing?.gradeLevel || TEAM_GRADE_LEVELS[0])
  const [color, setColor] = useState(existing?.color || PRESET_COLORS[0])
  const [availableDays, setAvailableDays] = useState<TeamDay[]>(
    existing?.availableDays || [...TEAM_DAYS],
  )

  return (
    <Modal title={providerId ? 'Edit Provider' : 'Add Provider'} onClose={onClose}>
      <label className="block text-[10px] font-bold">
        Name *
        <input
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block text-[10px] font-bold">
          Role
          <select
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {TEAM_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block text-[10px] font-bold">
          Grade level
          <select
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          >
            {TEAM_GRADE_LEVELS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-2">
        <p className="text-[10px] font-bold">Color</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-stone-800' : 'border-transparent'}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div className="mt-2">
        <p className="text-[10px] font-bold">Available days</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {TEAM_DAYS.map((d, i) => (
            <label key={d} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={availableDays.includes(d)}
                onChange={() =>
                  setAvailableDays((days) =>
                    days.includes(d) ? days.filter((x) => x !== d) : [...days, d],
                  )
                }
              />
              {TEAM_DAY_SHORTS[i]}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-teal-500 py-2 text-xs font-semibold text-white"
          onClick={() => {
            if (!name.trim()) {
              alert('Enter provider name.')
              return
            }
            onSave({
              id: existing?.id || gid(),
              name: name.trim(),
              role,
              gradeLevel,
              color,
              availableDays,
              pullTimes: existing?.pullTimes || [],
            })
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-semibold"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}

export function TeamTrackerPanel({ onFlash }: Props) {
  const { state } = useTeamState(onFlash)
  const byProvider = useMemo(() => {
    return state.providers.map((p) => {
      const studs = state.students.filter((s) => s.providerId === p.id)
      return {
        provider: p,
        students: studs.map((s) => {
          const sched = getSchedMin(state, s.id)
          return { student: s, sched, sc: statusColor(sched, s.requiredMinutes) }
        }),
      }
    })
  }, [state])

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold">Minutes Tracker</h2>
      {byProvider.map(({ provider, students }) => (
        <section key={provider.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: provider.color }}
            >
              {initials(provider.name)}
            </span>
            <h3 className="font-bold">{provider.name}</h3>
          </div>
          {students.length === 0 ? (
            <p className="text-xs text-[var(--subtext)]">No students assigned.</p>
          ) : (
            <ul className="space-y-2">
              {students.map(({ student: s, sched, sc }) => {
                const pct = s.requiredMinutes > 0 ? Math.min(sched / s.requiredMinutes, 1) : 0
                return (
                  <li key={s.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold">{s.name}</span>
                      <span style={{ color: sc.text }}>
                        {sched} / {s.requiredMinutes} min ({Math.round(pct * 100)}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ background: sc.bg }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct * 100}%`, background: sc.fill }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

export function TeamParametersPanel({ onFlash }: Props) {
  const { state, patch, persist } = useTeamState(onFlash)
  const [settings, setSettings] = useState<TeamSettings>(state.settings)
  const [constraintModal, setConstraintModal] = useState(false)
  const [iepModal, setIepModal] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const slots = useMemo(() => getTimeSlots(settings), [settings])

  function ingestMasterFile(file: File, mode: 'append' | 'replace') {
    void constraintsFromScheduleFile(file)
      .then(({ constraints, sheetSummaries }) => {
        if (!constraints.length) {
          onFlash(
            'No protected times found in file — need lunch/specials/recess or Day/Start/End columns',
          )
          return
        }
        patch(
          {
            masterConstraints:
              mode === 'replace'
                ? constraints
                : [...state.masterConstraints, ...constraints],
          },
          mode === 'replace'
            ? `Replaced with ${constraints.length} from ${file.name}`
            : `Imported ${constraints.length} from ${file.name}${
                sheetSummaries.length > 1
                  ? ` (${sheetSummaries.filter((s) => s.count).map((s) => s.name).join(', ')})`
                  : ''
              }`,
        )
      })
      .catch((err: unknown) => {
        onFlash(err instanceof Error ? err.message : 'Could not read schedule file')
      })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <h2 className="font-heading text-lg font-bold">Master School Schedule</h2>
        <p className="mb-3 text-xs text-[var(--subtext)]">
          Upload your school&apos;s master / instructional schedule (.xlsx or .csv) to set global
          protected times (lunch, specials, recess). CSV columns: Day, StartTime, EndTime, Type,
          Label — or Excel period tables from ARR Instructional Schedule.
        </p>
        <div
          className={`mb-3 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
            dragOver
              ? 'border-[var(--accent)] bg-sky-50'
              : 'border-[var(--border)] bg-[var(--slate)]'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) ingestMasterFile(f, 'append')
          }}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click()
          }}
        >
          <p className="text-sm text-[var(--subtext)]">Drop Excel/CSV here or click to upload</p>
          <p className="mt-1 text-[10px] text-[var(--subtext)]">
            ARR Instructional Schedule.xlsx · or Day, StartTime, EndTime, Type, Label
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) ingestMasterFile(f, 'append')
              e.target.value = ''
            }}
          />
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs font-semibold text-[var(--accent)]"
              onClick={downloadSampleSchoolSchedule}
            >
              Download sample CSV
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-red-600"
              onClick={() => {
                if (!confirm('Clear all master constraints?')) return
                patch({ masterConstraints: [] }, 'Constraints cleared')
              }}
            >
              Clear all
            </button>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-[var(--accent)]"
            onClick={() => setConstraintModal(true)}
          >
            + Add Constraint
          </button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--slate)] text-[10px] uppercase tracking-wide text-[var(--subtext)]">
              <tr>
                <th className="px-3 py-2">Day</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">End</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {state.masterConstraints.map((c) => (
                <tr key={c.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2">{c.day}</td>
                  <td className="px-3 py-2">{fmt12(c.startTime)}</td>
                  <td className="px-3 py-2">{fmt12(c.endTime)}</td>
                  <td className="px-3 py-2">{c.type}</td>
                  <td className="px-3 py-2">{c.label}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() =>
                        patch({
                          masterConstraints: state.masterConstraints.filter((x) => x.id !== c.id),
                        })
                      }
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold">IEP Days & Protected Dates</h2>
        <button
          type="button"
          className="mb-3 mt-2 rounded-lg bg-purple-500 px-3 py-2 text-xs font-semibold text-white"
          onClick={() => setIepModal(true)}
        >
          + Add IEP Day
        </button>
        <ul className="space-y-2">
          {state.iepDays.length === 0 && (
            <li className="text-xs text-[var(--subtext)]">No IEP days yet.</li>
          )}
          {state.iepDays.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs"
            >
              <span>
                <strong>{d.date}</strong> — {d.label}
              </span>
              <button
                type="button"
                className="text-red-600"
                onClick={() => patch({ iepDays: state.iepDays.filter((x) => x.id !== d.id) })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold">School Schedule Settings</h2>
        <div className="mt-3 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-[10px] font-bold uppercase">
              Year start
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                value={settings.yearStart}
                onChange={(e) => setSettings({ ...settings, yearStart: e.target.value })}
              />
            </label>
            <label className="block text-[10px] font-bold uppercase">
              Year end
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                value={settings.yearEnd}
                onChange={(e) => setSettings({ ...settings, yearEnd: e.target.value })}
              />
            </label>
            <label className="block text-[10px] font-bold uppercase">
              Day start
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                value={`${settings.dayStartH}:${String(settings.dayStartM).padStart(2, '0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  setSettings({ ...settings, dayStartH: h, dayStartM: m })
                }}
              >
                {genAllDayTimes().map((t) => (
                  <option key={t} value={t}>
                    {fmt12(t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[10px] font-bold uppercase">
              Day end
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
                value={`${settings.dayEndH}:${String(settings.dayEndM).padStart(2, '0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  setSettings({ ...settings, dayEndH: h, dayEndM: m })
                }}
              >
                {genAllDayTimes().map((t) => (
                  <option key={t} value={t}>
                    {fmt12(t)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="text-[10px] font-bold uppercase">Default session duration</legend>
            <div className="mt-1 flex gap-3">
              {([30, 60] as const).map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="radio"
                    checked={settings.defaultDuration === d}
                    onChange={() => setSettings({ ...settings, defaultDuration: d })}
                  />
                  {d} min
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
            onClick={() => {
              persist({ ...state, settings })
              onFlash('Settings saved')
            }}
          >
            Save Settings
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            onClick={() => {
              const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'prism-team-iep-schedule.json'
              a.click()
              onFlash('Exported JSON')
            }}
          >
            Export All Data (JSON)
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700"
            onClick={() => {
              if (!confirm('Reset all Team IEP schedule data to sample?')) return
              const next = resetTeamSchedule()
              persist(next)
              setSettings(next.settings)
              onFlash('Reset to sample data')
            }}
          >
            Reset All Data
          </button>
        </div>
      </section>

      {constraintModal && (
        <ConstraintModal
          slots={slots}
          onClose={() => setConstraintModal(false)}
          onSave={(c) => {
            patch({ masterConstraints: [...state.masterConstraints, c] }, 'Constraint added')
            setConstraintModal(false)
          }}
        />
      )}
      {iepModal && (
        <IepDayModal
          students={state.students}
          onClose={() => setIepModal(false)}
          onSave={(d) => {
            patch({ iepDays: [...state.iepDays, d] }, 'IEP day added')
            setIepModal(false)
          }}
        />
      )}
    </div>
  )
}

function ConstraintModal({
  slots,
  onClose,
  onSave,
}: {
  slots: string[]
  onClose: () => void
  onSave: (c: MasterConstraint) => void
}) {
  const [day, setDay] = useState<TeamDay | 'All'>('All')
  const [startTime, setStart] = useState(slots[0] || '8:00')
  const [endTime, setEnd] = useState(slots[Math.min(1, slots.length - 1)] || '8:30')
  const [type, setType] = useState('lunch')
  const [label, setLabel] = useState('Lunch')
  return (
    <Modal title="Add Constraint" onClose={onClose}>
      <label className="block text-[10px] font-bold">
        Day
        <select
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={day}
          onChange={(e) => setDay(e.target.value as TeamDay | 'All')}
        >
          <option value="All">All</option>
          {TEAM_DAYS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block text-[10px] font-bold">
          Start
          <select
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={startTime}
            onChange={(e) => setStart(e.target.value)}
          >
            {slots.map((t) => (
              <option key={t} value={t}>
                {fmt12(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[10px] font-bold">
          End
          <select
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
            value={endTime}
            onChange={(e) => setEnd(e.target.value)}
          >
            {slots.map((t) => (
              <option key={t} value={t}>
                {fmt12(t)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-2 block text-[10px] font-bold">
        Type
        <select
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {['lunch', 'specials', 'assembly', 'testing', 'iep-day', 'protected', 'blocked'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-2 block text-[10px] font-bold">
        Label
        <input
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-xs font-semibold text-white"
          onClick={() =>
            onSave({
              id: gid(),
              day,
              startTime,
              endTime,
              type,
              label,
              affectsAll: day === 'All',
            })
          }
        >
          Save
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-semibold"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}

function IepDayModal({
  students,
  onClose,
  onSave,
}: {
  students: TeamRosterStudent[]
  onClose: () => void
  onSave: (d: IepDay) => void
}) {
  const [date, setDate] = useState('')
  const [label, setLabel] = useState('')
  const [studentId, setStudentId] = useState('')
  return (
    <Modal title="Add IEP Day" onClose={onClose}>
      <label className="block text-[10px] font-bold">
        Date
        <input
          type="date"
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label className="mt-2 block text-[10px] font-bold">
        Label
        <input
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Annual IEP Review"
        />
      </label>
      <label className="mt-2 block text-[10px] font-bold">
        Student (optional)
        <select
          className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">None</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg bg-purple-500 py-2 text-xs font-semibold text-white"
          onClick={() => {
            if (!date) {
              alert('Pick a date.')
              return
            }
            onSave({
              id: gid(),
              date,
              label: label.trim() || 'IEP Day',
              studentId: studentId || null,
            })
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-semibold"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function genAllDayTimes(): string[] {
  const r: string[] = []
  for (let h = 6; h <= 17; h++) {
    for (const m of [0, 30]) {
      if (h === 17 && m > 0) break
      r.push(`${h}:${String(m).padStart(2, '0')}`)
    }
  }
  return r
}

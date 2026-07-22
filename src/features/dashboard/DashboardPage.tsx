import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { StudentInitials } from '../../components/StudentInitials'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { statusBadgeClass, daysUntil } from '../../lib/students/normalizeStudent'
import { buildDashboardAlerts } from '../../lib/compliance/buildDashboardAlerts'
import { loadProbeSessions } from '../../lib/progress-monitoring/store'
import { loadSoapNotes } from '../../lib/session-notes/store'
import { loadTodos, saveTodos, type TodoItem } from '../../lib/dashboard/todoStore'
import { materialsDueOn } from '../../lib/classroom-materials/store'
import { openFbaSessions } from '../../lib/fba/store'
import { loadPlanner, todaysSchedule } from '../../lib/weekly-planner/store'
import { loadPrepPackets } from '../../lib/meeting-prep/store'
import {
  buildWeekDues,
  buildWeekMeetings,
  weekRangeLabel,
} from '../../lib/dashboard/weekAtAGlance'
import { TeamChatDock } from './TeamChatPanel'

const STAT_TINTS = [
  'tint-sky',
  'tint-coral',
  'tint-sun',
  'tint-softorange',
  'tint-pink',
  'tint-lav',
  'tint-mint',
] as const

export function DashboardPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos())
  const [todoDraft, setTodoDraft] = useState('')

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

  const todaySlots = todaysSchedule(loadPlanner())
  const weekMeetings = useMemo(
    () =>
      buildWeekMeetings({
        students,
        planner: loadPlanner(),
        packets: loadPrepPackets(),
      }),
    [students],
  )
  const weekDues = useMemo(
    () => buildWeekDues({ students, sessions: loadProbeSessions() }),
    [students],
  )
  const weekLabel = weekRangeLabel()

  const alerts = useMemo(
    () =>
      buildDashboardAlerts({
        students,
        sessions: loadProbeSessions(),
        soapNotes: loadSoapNotes(),
        nomLeadTimeDays: profile.rules.nomLeadTimeDays,
        serviceLogHours: profile.rules.serviceLogHours,
        iepSystem: profile.iepSystem,
        materialsToday: materialsDueOn(new Date().toISOString().slice(0, 10)),
        openFba: openFbaSessions(),
      }),
    [students, profile.rules.nomLeadTimeDays, profile.rules.serviceLogHours, profile.iepSystem],
  )

  const stats = useMemo(() => {
    const overdue = students.filter((s) => s.status === 'Overdue')
    const upcoming = students.filter((s) => {
      const due = s.hasIEP ? s.iepDue : s.section504Due
      const d = daysUntil(due || undefined)
      return d != null && d >= 0 && d <= 45
    })
    const pmDue = alerts.filter((a) => a.category === 'progress').length
    const nomDue = alerts.filter((a) => a.category === 'nom').length
    return {
      total: students.length,
      overdue: overdue.length,
      upcoming: upcoming.length,
      with504: students.filter((s) => s.has504).length,
      withMll: students.filter((s) => s.hasMLL).length,
      pmDue,
      nomDue,
    }
  }, [students, alerts])

  function persistTodos(next: TodoItem[]) {
    setTodos(next)
    saveTodos(next)
  }

  function addTodo() {
    const text = todoDraft.trim()
    if (!text) return
    persistTodos([
      { id: `td-${Date.now()}`, text, done: false, createdAt: new Date().toISOString() },
      ...todos,
    ])
    setTodoDraft('')
  }

  return (
    <PageShell
      title="🏠 Main Dashboard"
      description={`This week’s meetings and dues for ${profile.name} — plus quick jumps. Team Chat is the bubble in the corner.`}
    >
      <p className="mb-3 text-sm font-semibold text-[var(--text)]">{today}</p>

      {todaySlots.length > 0 && (
        <section
          className="mb-3 rounded-2xl border border-[var(--border)] p-3 shadow-card tint-mint"
          style={{ borderTop: '4px solid var(--accent)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-sm font-bold">Who am I seeing today?</h2>
            <Link to="/planner" className="text-xs font-semibold text-[var(--accent)]">
              Full planner →
            </Link>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {todaySlots.map((s) => {
              const st = students.find((x) => x.id === s.studentId)
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-2.5 py-2 text-xs"
                >
                  <StudentInitials name={s.studentName} color={st?.color || '#AEE4FF'} />
                  <span>
                    <strong className="font-mono">
                      {s.startTime}–{s.endTime}
                    </strong>{' '}
                    {s.studentName} · {s.focus}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {[
          { label: 'Students', value: stats.total },
          { label: 'Overdue', value: stats.overdue },
          { label: 'Due ≤45d', value: stats.upcoming },
          { label: 'PM due', value: stats.pmDue },
          { label: 'NOM watch', value: stats.nomDue },
          { label: '504 plans', value: stats.with504 },
          { label: 'MLL', value: stats.withMll },
        ].map((c, i) => (
          <div
            key={c.label}
            className={`rounded-2xl border border-[var(--border)] p-3 text-center shadow-card ${STAT_TINTS[i % STAT_TINTS.length]}`}
            style={{ borderTop: '3px solid var(--accent-h)' }}
          >
            <p className="font-mono text-2xl font-bold text-[var(--text)]">{c.value}</p>
            <p className="text-xs text-[var(--subtext)]">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <section
          className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
          style={{ borderTop: '4px solid var(--accent)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-heading text-sm font-bold">This week</h2>
              <p className="text-[10px] text-[var(--subtext)]">{weekLabel}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/planner" className="text-[10px] font-semibold text-[var(--accent)]">
                Planner
              </Link>
              <Link to="/meeting-prep" className="text-[10px] font-semibold text-[var(--accent)]">
                Meeting Prep
              </Link>
            </div>
          </div>

          <div className="mt-3 rounded-xl tint-lav p-3">
            <p className="text-xs font-bold">
              {weekMeetings.total === 0
                ? 'No meetings or sessions on the planner this week'
                : `You have ${weekMeetings.total} meeting${weekMeetings.total === 1 ? '' : 's'} / sessions this week`}
            </p>
            <div className="mt-2 space-y-2">
              {weekMeetings.byDay.map((g) => (
                <div key={g.dayLabel}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--subtext)]">
                    {g.dayLabel} · {g.items.length}
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {g.items.map((m) => (
                      <li
                        key={m.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card-bg)] py-1 pl-1 pr-2.5 text-[10px]"
                        title={`${m.studentName} · ${m.detail}`}
                      >
                        <StudentInitials name={m.studentName} color={m.color} />
                        <span className="font-semibold">{m.when}</span>
                        <span className="text-[var(--subtext)]">
                          {m.kind === 'iep' ? 'IEP' : 'sess'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-xl tint-sun p-3">
            <p className="text-xs font-bold">
              Due this week · {weekDues.length}
            </p>
            {weekDues.length === 0 ? (
              <p className="mt-1 text-[10px] text-[var(--subtext)]">
                No annuals or progress probes due Mon–Fri.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {weekDues.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={d.href}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-[11px] hover:border-[var(--accent)]"
                    >
                      <StudentInitials name={d.studentName} color={d.color} />
                      <span className="min-w-0 flex-1 truncate">
                        <strong>{d.studentName}</strong> · {d.label}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-[var(--subtext)]">
                        {d.dueDate}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
          style={{ borderTop: '4px solid var(--accent-h)' }}
        >
          <h2 className="font-heading text-sm font-bold">Quick actions</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { to: '/planner', label: '📅 Weekly Planner', tint: 'tint-mint' },
              { to: '/meeting-prep', label: '📋 Meeting Prep', tint: 'tint-lav' },
              { to: '/reminders', label: '📨 Enrich Reminders', tint: 'tint-sky' },
              { to: '/contacts', label: '📞 Parent Contact Log', tint: 'tint-pink' },
              { to: '/progress', label: '📈 Progress Monitoring', tint: 'tint-sun' },
              { to: '/caseload', label: '👤 Caseload / SOAP', tint: 'tint-softorange' },
              { to: '/binder', label: '📁 Print Center / Binder', tint: 'tint-sky' },
              { to: '/game', label: '🎲 Motivation Game', tint: 'tint-mint' },
              { to: '/generation', label: '✨ Generation Studio', tint: 'tint-lav' },
              { to: '/tools', label: '🧮 LRE / Age Tools', tint: 'tint-sky' },
              { to: '/fba', label: '🔍 FBA / BIP', tint: 'tint-coral' },
              { to: '/evaluations', label: '📊 Eval Tracker', tint: 'tint-sun' },
              { to: '/templates', label: '🎨 Templates / Materials', tint: 'tint-pink' },
              { to: '/mtss', label: '📋 MTSS / DAT', tint: 'tint-softorange' },
              { to: '/students', label: '🧩 Student Tiles', tint: 'tint-mint' },
              { to: '/district', label: '🏛️ District Profile', tint: 'tint-lav' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-xl border border-[var(--border)] px-3 py-3 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] ${l.tint}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <section
          className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
          style={{ borderTop: '4px solid #F59E0B' }}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-sm font-bold">Compliance watch</h2>
            <span className="text-[10px] text-[var(--subtext)]">{alerts.length} active</span>
          </div>
          <p className="mt-0.5 text-[10px] text-[var(--subtext)]">
            Beyond this week — overdue annuals, NOM windows, open FBAs
          </p>
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-xs text-[var(--subtext)]">Nothing else on the watch list.</p>
            ) : (
              alerts.slice(0, 12).map((a) => (
                <Link
                  key={a.id}
                  to={a.href}
                  className={`block rounded-lg border-l-4 p-2 text-xs hover:opacity-90 ${
                    a.tone === 'danger'
                      ? 'border-l-red-500 tint-coral'
                      : a.tone === 'warn'
                        ? 'border-l-amber-500 tint-sun'
                        : 'border-l-sky-500 tint-sky'
                  }`}
                >
                  {a.text}
                </Link>
              ))
            )}
          </div>
        </section>

        <section
          className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
          style={{ borderTop: '4px solid var(--accent)' }}
        >
          <h2 className="font-heading text-sm font-bold">My to-do</h2>
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              placeholder="Add a task…"
              value={todoDraft}
              onChange={(e) => setTodoDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTodo()
              }}
            />
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
              onClick={addTodo}
            >
              Add
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {!todos.length && (
              <li className="text-xs text-[var(--subtext)]">No tasks yet — add NOM, probes, or calls.</li>
            )}
            {todos.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() =>
                    persistTodos(todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
                  }
                />
                <span className={t.done ? 'text-[var(--subtext)] line-through' : ''}>{t.text}</span>
                <button
                  type="button"
                  className="ml-auto text-[10px] text-red-600"
                  onClick={() => persistTodos(todos.filter((x) => x.id !== t.id))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
        style={{ borderTop: '4px solid var(--accent-h)' }}
      >
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
                  <td className="p-2">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <StudentInitials name={s.name} color={s.color} />
                      {s.name}
                    </span>
                  </td>
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

      <TeamChatDock />
    </PageShell>
  )
}

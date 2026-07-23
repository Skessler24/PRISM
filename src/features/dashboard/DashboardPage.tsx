import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { StudentInitials } from '../../components/StudentInitials'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { daysUntil } from '../../lib/students/normalizeStudent'
import { buildDashboardAlerts } from '../../lib/compliance/buildDashboardAlerts'
import { loadProbeSessions } from '../../lib/progress-monitoring/store'
import { loadSoapNotes } from '../../lib/session-notes/store'
import { loadTodos, saveTodos, type TodoItem } from '../../lib/dashboard/todoStore'
import { materialsDueOn } from '../../lib/classroom-materials/store'
import { openFbaSessions } from '../../lib/fba/store'
import { loadPlanner } from '../../lib/weekly-planner/store'
import { loadPrepPackets } from '../../lib/meeting-prep/store'
import {
  buildWeekDues,
  buildWeekMeetings,
  weekRangeLabel,
} from '../../lib/dashboard/weekAtAGlance'
import { loadSchedule, todaysGroups } from '../../lib/scheduling/store'
import { TeamChatDock } from './TeamChatPanel'
import { VirtualMeetingsPanel } from './VirtualMeetingsPanel'
import { DashboardDateCountdown } from './DashboardDateCountdown'

const STAT_TINTS = [
  'tint-sky',
  'tint-coral',
  'tint-sun',
  'tint-softorange',
  'tint-pink',
  'tint-lav',
  'tint-mint',
] as const

/** ~5 rows visible, then scroll */
const DUE_LIST_MAX_H = 'max-h-[13.5rem]'

type SuggestedTodo = {
  id: string
  text: string
  href: string
}

export function DashboardPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos())
  const [todoDraft, setTodoDraft] = useState('')
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([])

  const todayGroups = todaysGroups(loadSchedule())
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

  const suggestedTodos = useMemo(() => {
    const existing = new Set(todos.map((t) => t.text.toLowerCase()))
    const out: SuggestedTodo[] = []

    for (const g of todayGroups.slice(0, 3)) {
      const text = `Run ${g.name} (${g.startTime})`
      if (!existing.has(text.toLowerCase())) {
        out.push({ id: `sug-grp-${g.id}`, text, href: '/scheduling' })
      }
    }

    for (const a of alerts.slice(0, 8)) {
      if (dismissedSuggestions.includes(a.id)) continue
      if (existing.has(a.text.toLowerCase())) continue
      out.push({ id: a.id, text: a.text, href: a.href })
    }

    for (const d of weekDues.slice(0, 4)) {
      const text = `${d.studentName} — ${d.label} (${d.dueDate})`
      if (dismissedSuggestions.includes(d.id)) continue
      if (existing.has(text.toLowerCase())) continue
      out.push({ id: d.id, text, href: d.href })
    }

    return out.slice(0, 6)
  }, [todayGroups, alerts, weekDues, todos, dismissedSuggestions])

  function persistTodos(next: TodoItem[]) {
    setTodos(next)
    saveTodos(next)
  }

  function addTodo(textOverride?: string) {
    const text = (textOverride ?? todoDraft).trim()
    if (!text) return
    persistTodos([
      { id: `td-${Date.now()}`, text, done: false, createdAt: new Date().toISOString() },
      ...todos,
    ])
    if (!textOverride) setTodoDraft('')
  }

  function pinSuggestion(s: SuggestedTodo) {
    addTodo(s.text)
    setDismissedSuggestions((prev) => [...prev, s.id])
  }

  return (
    <PageShell
      title="🏠 Main Dashboard"
      description={`This week’s meetings and dues for ${profile.name}. Core modules live in the top tabs. Team Chat is the glowing bubble in the corner.`}
    >
      <DashboardDateCountdown />

      <section
        className="mb-3 rounded-2xl border border-[var(--border)] p-4 shadow-card tint-mint"
        style={{ borderTop: '4px solid var(--accent)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-sm font-bold">Who am I seeing today?</h2>
          <Link to="/scheduling" className="text-xs font-semibold text-[var(--accent)]">
            Open Scheduling →
          </Link>
        </div>
        {todayGroups.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--subtext)]">
            No groups on today&apos;s schedule yet — add them in Scheduling.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todayGroups.map((g) => (
              <li key={g.id}>
                <Link
                  to="/scheduling"
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 text-xs hover:border-[var(--accent)]"
                >
                  <span className="font-mono text-sm font-bold text-[var(--accent)]">
                    {g.startTime}–{g.endTime}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block">{g.name}</strong>
                    <span className="text-[10px] text-[var(--subtext)]">
                      {g.goalFocus.slice(0, 2).join(' · ') || g.location || 'Session'}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {g.studentIds.map((id) => {
                      const st = students.find((x) => x.id === id)
                      return st ? (
                        <StudentInitials key={id} name={st.name} color={st.color} title={st.name} />
                      ) : null
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

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
              <Link to="/scheduling" className="text-[10px] font-semibold text-[var(--accent)]">
                Schedule
              </Link>
              <Link to="/meeting-prep" className="text-[10px] font-semibold text-[var(--accent)]">
                Meeting Prep
              </Link>
            </div>
          </div>

          <div className="mt-3 rounded-xl tint-lav p-3">
            <p className="text-xs font-bold">
              {weekMeetings.total === 0
                ? 'No meetings or sessions this week'
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
            <p className="text-xs font-bold">Due this week · {weekDues.length}</p>
            {weekDues.length === 0 ? (
              <p className="mt-1 text-[10px] text-[var(--subtext)]">
                No annuals or progress probes due Mon–Fri.
              </p>
            ) : (
              <ul className={`mt-2 space-y-1.5 overflow-y-auto pr-1 ${DUE_LIST_MAX_H}`}>
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
          style={{ borderTop: '4px solid var(--accent)' }}
        >
          <div className="mx-auto w-full max-w-md">
            <div className="text-center">
              <h2 className="font-heading text-sm font-bold">My to-do</h2>
              <p className="mt-0.5 text-[10px] text-[var(--subtext)]">
                Pulled from today&apos;s schedule, NOMs, dues &amp; progress alerts
              </p>
            </div>

            {suggestedTodos.length > 0 && (
              <div className="mt-3 rounded-xl tint-coral p-3">
                <p className="text-center text-[10px] font-bold uppercase tracking-wide text-[var(--subtext)]">
                  Suggested for you
                </p>
                <ul className="mt-2 space-y-1.5">
                  {suggestedTodos.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-[11px]"
                    >
                      <Link to={s.href} className="min-w-0 flex-1 hover:text-[var(--accent)]">
                        {s.text}
                      </Link>
                      <button
                        type="button"
                        className="shrink-0 rounded-md bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white"
                        onClick={() => pinSuggestion(s)}
                      >
                        Pin
                      </button>
                      <button
                        type="button"
                        className="shrink-0 text-[10px] text-[var(--subtext)]"
                        aria-label="Dismiss suggestion"
                        onClick={() =>
                          setDismissedSuggestions((prev) => [...prev, s.id])
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
                placeholder="Add your own task…"
                value={todoDraft}
                onChange={(e) => setTodoDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTodo()
                }}
              />
              <button
                type="button"
                className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                onClick={() => addTodo()}
              >
                Add
              </button>
            </div>

            <ul className="mt-3 space-y-2">
              {!todos.length && (
                <li className="text-center text-xs text-[var(--subtext)]">
                  Pin a suggestion above, or add NOM / probe / call tasks.
                </li>
              )}
              {todos.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() =>
                      persistTodos(
                        todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                      )
                    }
                  />
                  <span className={t.done ? 'text-[var(--subtext)] line-through' : ''}>
                    {t.text}
                  </span>
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
          </div>
        </section>
      </div>

      <div className="mb-3 mx-auto w-full max-w-xl">
        <VirtualMeetingsPanel compact />
      </div>

      <TeamChatDock />
    </PageShell>
  )
}

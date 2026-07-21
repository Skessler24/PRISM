import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import {
  buildProgressAlerts,
  defaultProbeItems,
  loadExitTickets,
  loadProbeSessions,
  saveExitTickets,
  saveProbeSessions,
  scoreItems,
  syncLegacyProbe,
  type ExitTicket,
  type ProbeItem,
  type ProbeSession,
} from '../../lib/progress-monitoring/store'

type Tab = 'alerts' | 'probe' | 'tickets' | 'history'

export function ProgressMonitoringPage() {
  const { students } = useStudents()
  const [tab, setTab] = useState<Tab>('alerts')
  const [sessions, setSessions] = useState<ProbeSession[]>(() => loadProbeSessions())
  const [tickets, setTickets] = useState<ExitTicket[]>(() => loadExitTickets())
  const [toast, setToast] = useState('')

  // Probe session builder
  const [studentId, setStudentId] = useState('')
  const [label, setLabel] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [cadenceDays, setCadenceDays] = useState(14)
  const [items, setItems] = useState<ProbeItem[]>(() => defaultProbeItems('Target skill'))
  const [notes, setNotes] = useState('')

  // Exit ticket
  const [ticketStudent, setTicketStudent] = useState('')
  const [ticketPrompt, setTicketPrompt] = useState('What is one strategy you used today?')
  const [ticketResponse, setTicketResponse] = useState('')
  const [ticketMastered, setTicketMastered] = useState(false)

  const alerts = useMemo(
    () => buildProgressAlerts(students, sessions),
    [students, sessions],
  )
  const dueCount = alerts.filter((a) => a.severity !== 'ok').length
  const student = students.find((s) => s.id === studentId)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function loadDefaultsForStudent(id: string) {
    setStudentId(id)
    const s = students.find((x) => x.id === id)
    const g = s?.goals[0] || 'Target skill'
    setLabel(g)
    setItems(defaultProbeItems(g))
  }

  function markItem(id: string, result: ProbeItem['result']) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, result } : i)))
  }

  function saveSession() {
    if (!studentId) {
      flash('Select a student')
      return
    }
    const pct = scoreItems(items)
    const sess: ProbeSession = {
      id: `pm-${Date.now()}`,
      studentId,
      label: label || 'Probe',
      date,
      cadenceDays,
      items,
      scorePercent: pct,
      notes,
      createdAt: new Date().toISOString(),
    }
    const next = [sess, ...sessions]
    setSessions(next)
    saveProbeSessions(next)
    syncLegacyProbe(studentId, sess.label, pct)
    flash(`Saved probe · ${pct}% — next due in ${cadenceDays}d`)
    setTab('alerts')
  }

  function saveTicket() {
    if (!ticketStudent) {
      flash('Select a student')
      return
    }
    const t: ExitTicket = {
      id: `et-${Date.now()}`,
      studentId: ticketStudent,
      date: new Date().toISOString().slice(0, 10),
      prompt: ticketPrompt,
      response: ticketResponse,
      mastered: ticketMastered,
      createdAt: new Date().toISOString(),
    }
    const next = [t, ...tickets]
    setTickets(next)
    saveExitTickets(next)
    flash('Exit ticket saved')
    setTicketResponse('')
  }

  return (
    <PageShell
      title="📈 Progress Monitoring"
      description="ESGI-style probes (item-by-item), exit tickets, and due alerts. Data stays in your browser — Companion: copy summaries into Enrich / SoR."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}
      <FieldTip tipId="progress-monitoring" className="mb-3" />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            dueCount ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'
          }`}
        >
          {dueCount ? `${dueCount} need progress monitoring` : 'All probes on track'}
        </span>
        <Link to="/binder" className="text-xs font-semibold text-[var(--accent)]">
          Download Caseload Binder →
        </Link>
        <Link to="/game" className="text-xs font-semibold text-[var(--accent)]">
          Motivation Game →
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['alerts', 'Due alerts'],
            ['probe', 'Run probe'],
            ['tickets', 'Exit tickets'],
            ['history', 'History'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              tab === id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--subtext)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'alerts' && (
        <section className="space-y-2">
          {alerts.map((a) => (
            <button
              key={a.studentId}
              type="button"
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-xs ${
                a.severity === 'overdue'
                  ? 'border-red-200 bg-red-50'
                  : a.severity === 'due'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-[var(--border)] bg-[var(--card-bg)]'
              }`}
              onClick={() => {
                loadDefaultsForStudent(a.studentId)
                setTab('probe')
              }}
            >
              <span>
                <strong>{a.studentName}</strong>
                <span className="mt-0.5 block text-[var(--subtext)]">{a.reason}</span>
              </span>
              <span className="font-semibold text-[var(--accent)]">Probe →</span>
            </button>
          ))}
        </section>
      )}

      {tab === 'probe' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Run probe (ESGI-style)</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Mark each trial Correct / Incorrect like a digital probe kit. Score auto-calculates.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Student
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={studentId}
                onChange={(e) => loadDefaultsForStudent(e.target.value)}
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
              Probe / skill label
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold">
              Date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold">
              Cadence (days until next alert)
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={cadenceDays}
                onChange={(e) => setCadenceDays(Number(e.target.value) || 14)}
              />
            </label>
          </div>

          {student && (
            <p className="mt-2 text-[10px] text-[var(--subtext)]">
              Goals: {student.goals.join(' · ') || '—'}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--slate)] px-3 py-2 text-xs"
              >
                <span className="font-semibold">
                  {idx + 1}. {item.prompt}
                </span>
                <div className="flex gap-1">
                  {(
                    [
                      ['correct', '✓'],
                      ['incorrect', '✗'],
                      ['skipped', '—'],
                    ] as const
                  ).map(([res, symbol]) => (
                    <button
                      key={res}
                      type="button"
                      className={`rounded-lg px-2 py-1 font-bold ${
                        item.result === res
                          ? res === 'correct'
                            ? 'bg-green-500 text-white'
                            : res === 'incorrect'
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-500 text-white'
                          : 'border border-[var(--border)] bg-white'
                      }`}
                      onClick={() => markItem(item.id, res)}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 font-mono text-lg font-bold text-[var(--accent)]">
            Score: {scoreItems(items)}%
          </p>
          <label className="mt-2 block text-xs font-semibold">
            Notes
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
            onClick={saveSession}
          >
            Save probe session
          </button>
        </section>
      )}

      {tab === 'tickets' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Exit ticket</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            Quick end-of-session check — stores with the student for binder / reports.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Student
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={ticketStudent}
                onChange={(e) => setTicketStudent(e.target.value)}
              >
                <option value="">Select…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold md:mt-6">
              <input
                type="checkbox"
                checked={ticketMastered}
                onChange={(e) => setTicketMastered(e.target.checked)}
              />
              Looks mastered today
            </label>
            <label className="text-xs font-semibold md:col-span-2">
              Prompt
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={ticketPrompt}
                onChange={(e) => setTicketPrompt(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold md:col-span-2">
              Student response / observation
              <textarea
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
                rows={3}
                value={ticketResponse}
                onChange={(e) => setTicketResponse(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
            onClick={saveTicket}
          >
            Save exit ticket
          </button>
          <div className="mt-4 space-y-2">
            {tickets.slice(0, 8).map((t) => {
              const s = students.find((x) => x.id === t.studentId)
              return (
                <div key={t.id} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs">
                  <strong>
                    {s?.name} · {t.date}
                  </strong>{' '}
                  {t.mastered ? '★' : ''}
                  <p className="text-[var(--subtext)]">{t.prompt}</p>
                  <p>{t.response || '—'}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section className="space-y-2">
          {!sessions.length && (
            <p className="text-xs text-[var(--subtext)]">No probe sessions yet.</p>
          )}
          {sessions.map((sess) => {
            const s = students.find((x) => x.id === sess.studentId)
            return (
              <div
                key={sess.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-3 text-xs shadow-card"
              >
                <strong>
                  {s?.name} · {sess.date} · {sess.scorePercent}%
                </strong>
                <p className="text-[var(--subtext)]">
                  {sess.label} · next cadence {sess.cadenceDays}d
                </p>
                {sess.notes && <p className="mt-1">{sess.notes}</p>}
              </div>
            )
          })}
        </section>
      )}
    </PageShell>
  )
}

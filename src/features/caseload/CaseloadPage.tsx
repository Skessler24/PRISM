import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { daysUntil, statusBadgeClass } from '../../lib/students/normalizeStudent'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import {
  formatSoapForEnrich,
  loadProgressProbes,
  loadSoapNotes,
  saveProgressProbes,
  saveSoapNotes,
  type ProgressProbe,
  type SoapNote,
} from '../../lib/session-notes/store'

type Tab = 'table' | 'soap' | 'progress'

export function CaseloadPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [provider, setProvider] = useState('All')
  const [tab, setTab] = useState<Tab>('table')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [soapStudentId, setSoapStudentId] = useState('')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [notes, setNotes] = useState<SoapNote[]>(() => loadSoapNotes())
  const [probes, setProbes] = useState<ProgressProbe[]>(() => loadProgressProbes())
  const [toast, setToast] = useState('')

  const hours = profile.rules.serviceLogHours
  const iep = profile.iepSystem || 'Enrich'

  const providers = useMemo(() => {
    const set = new Set(students.map((s) => s.caseManager || s.provider).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [students])

  const rows = useMemo(() => {
    if (provider === 'All') return students
    return students.filter((s) => (s.caseManager || s.provider) === provider)
  }, [students, provider])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function saveSoap() {
    if (!soapStudentId) {
      flash('Select a student')
      return
    }
    const note: SoapNote = {
      id: `soap-${Date.now()}`,
      studentId: soapStudentId,
      date: sessionDate,
      subjective,
      objective,
      assessment,
      plan,
      updatedAt: new Date().toISOString(),
    }
    const next = [note, ...notes.filter((n) => !(n.studentId === soapStudentId && n.date === sessionDate))]
    setNotes(next)
    saveSoapNotes(next)
    flash('SOAP saved locally (browser only)')
  }

  async function copySoap() {
    const s = students.find((x) => x.id === soapStudentId)
    if (!s) {
      flash('Select a student')
      return
    }
    const note: SoapNote = {
      id: 'draft',
      studentId: soapStudentId,
      date: sessionDate,
      subjective,
      objective,
      assessment,
      plan,
      updatedAt: new Date().toISOString(),
    }
    try {
      await navigator.clipboard.writeText(formatSoapForEnrich(note, s.name, hours))
      flash(`Copied — paste into ${iep} within ${hours}h`)
    } catch {
      flash('Copy failed')
    }
  }

  function ensureProbe(studentId: string): ProgressProbe {
    const existing = probes.find((p) => p.studentId === studentId)
    if (existing) return existing
    const s = students.find((x) => x.id === studentId)
    return {
      studentId,
      label: s?.goals[0] || 'Probe target',
      lastScore: 0,
      scores: [],
      updatedAt: new Date().toISOString(),
    }
  }

  function addProbeScore(studentId: string, score: number) {
    const base = ensureProbe(studentId)
    const scores = [...base.scores, score].slice(-8)
    const nextProbe: ProgressProbe = {
      ...base,
      lastScore: score,
      scores,
      updatedAt: new Date().toISOString(),
    }
    const next = [...probes.filter((p) => p.studentId !== studentId), nextProbe]
    setProbes(next)
    saveProgressProbes(next)
    flash('Probe saved locally')
  }

  return (
    <PageShell
      title="👤 My Caseload"
      description={`Shared caseload, SOAP service logs (log within ${hours}h), and progress probes. Companion: Copy into ${iep} — no live sync.`}
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['table', 'Caseload table'],
            ['soap', 'SOAP / service logs'],
            ['progress', 'Progress monitoring'],
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

      {tab === 'table' && (
        <>
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
            {!rows.length && (
              <p className="p-4 text-sm text-[var(--subtext)]">No students in this caseload filter.</p>
            )}
          </div>
        </>
      )}

      {tab === 'soap' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Session tracking & SOAP notes</h2>
          <FieldTip tipId="soap-notes" className="mb-2 mt-2" />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Session date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold">
              Student
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={soapStudentId}
                onChange={(e) => {
                  setSoapStudentId(e.target.value)
                  const existing = notes.find(
                    (n) => n.studentId === e.target.value && n.date === sessionDate,
                  )
                  if (existing) {
                    setSubjective(existing.subjective)
                    setObjective(existing.objective)
                    setAssessment(existing.assessment)
                    setPlan(existing.plan)
                  } else {
                    setSubjective('')
                    setObjective('')
                    setAssessment('')
                    setPlan('')
                  }
                }}
              >
                <option value="">Select student…</option>
                {rows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            {(
              [
                ['S — Subjective', subjective, setSubjective],
                ['O — Objective', objective, setObjective],
                ['A — Assessment', assessment, setAssessment],
                ['P — Plan', plan, setPlan],
              ] as const
            ).map(([label, val, setter]) => (
              <label key={label} className="text-xs font-semibold md:col-span-2">
                {label}
                <textarea
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
                  rows={2}
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
              onClick={saveSoap}
            >
              Save note
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              onClick={() => void copySoap()}
            >
              Copy to {iep}
            </button>
          </div>
          {notes.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
                Recent notes ({notes.length})
              </h3>
              {notes.slice(0, 6).map((n) => {
                const s = students.find((x) => x.id === n.studentId)
                return (
                  <button
                    key={n.id}
                    type="button"
                    className="block w-full rounded-lg border border-[var(--border)] bg-[var(--slate)] px-3 py-2 text-left text-xs"
                    onClick={() => {
                      setSoapStudentId(n.studentId)
                      setSessionDate(n.date)
                      setSubjective(n.subjective)
                      setObjective(n.objective)
                      setAssessment(n.assessment)
                      setPlan(n.plan)
                    }}
                  >
                    <strong>{s?.name || n.studentId}</strong> · {n.date}
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'progress' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Progress monitoring</h2>
          <FieldTip tipId="progress-monitoring" className="mb-2 mt-2" />
          <div className="mt-3 space-y-3">
            {rows.slice(0, 12).map((s) => {
              const probe = probes.find((p) => p.studentId === s.id)
              const scores = probe?.scores || []
              const max = Math.max(100, ...scores, 1)
              return (
                <div key={s.id} className="rounded-xl border border-[var(--border)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold">{s.name}</p>
                      <p className="text-[10px] text-[var(--subtext)]">
                        {probe?.label || s.goals[0] || 'Add probe data'} · last{' '}
                        {probe?.lastScore ?? '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 rounded border border-[var(--border)] px-1 py-1 text-xs"
                        placeholder="%"
                        id={`probe-${s.id}`}
                      />
                      <button
                        type="button"
                        className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-semibold"
                        onClick={() => {
                          const el = document.getElementById(`probe-${s.id}`) as HTMLInputElement | null
                          const n = Number(el?.value)
                          if (Number.isFinite(n)) addProbeScore(s.id, n)
                          else flash('Enter a number')
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex h-8 items-end gap-1">
                    {scores.length ? (
                      scores.map((sc, i) => (
                        <div
                          key={`${s.id}-${i}`}
                          className="flex-1 rounded-t bg-[var(--accent)]"
                          style={{ height: `${Math.max(8, (sc / max) * 100)}%` }}
                          title={`${sc}`}
                        />
                      ))
                    ) : (
                      <p className="text-[10px] text-[var(--subtext)]">No probe points yet</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </PageShell>
  )
}

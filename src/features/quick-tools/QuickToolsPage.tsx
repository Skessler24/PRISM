import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { calculateAge } from '../../lib/age/calculate'
import {
  DEFAULT_SERVICE_ROWS,
  LRE_BANDS,
  calculateLre,
  formatLreReport,
} from '../../lib/lre/calculate'

type Tab = 'lre' | 'age'

type ProviderRow = { name: string; minutes: string; notes: string }

export function QuickToolsPage() {
  const { students } = useStudents()
  const [tab, setTab] = useState<Tab>('lre')
  const [toast, setToast] = useState('')

  // LRE state
  const [studentId, setStudentId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [iepReview, setIepReview] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState(7)
  const [daysPerWeek, setDaysPerWeek] = useState(5)
  const [minutesOverride, setMinutesOverride] = useState('1965')
  const [useOverride, setUseOverride] = useState(true)
  const [rows, setRows] = useState<ProviderRow[]>(() =>
    DEFAULT_SERVICE_ROWS.map((name) => ({ name, minutes: '', notes: '' })),
  )

  // Age state
  const [dob, setDob] = useState('')
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10))
  const [ageStudentId, setAgeStudentId] = useState('')

  const result = useMemo(
    () =>
      calculateLre({
        hoursPerDay,
        daysPerWeek,
        totalMinutesOverride: useOverride ? Number(minutesOverride) || null : null,
        outsideMinutes: rows.map((r) => Number(r.minutes) || 0),
      }),
    [hoursPerDay, daysPerWeek, minutesOverride, useOverride, rows],
  )

  const age = useMemo(() => calculateAge(dob, asOf), [dob, asOf])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function pickStudent(id: string) {
    setStudentId(id)
    const s = students.find((x) => x.id === id)
    if (!s) return
    setStudentName(s.name)
    setGrade(s.grade)
    setIepReview(s.iepDue || '')
  }

  function updateRow(i: number, patch: Partial<ProviderRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, { name: 'Custom service', minutes: '', notes: '' }])
  }

  function buildReport() {
    return formatLreReport({
      studentName,
      school,
      grade,
      date,
      iepReview,
      providers: rows.map((r) => ({
        name: r.name,
        minutes: Number(r.minutes) || 0,
        notes: r.notes,
      })),
      hoursPerDay,
      daysPerWeek,
      result,
    })
  }

  return (
    <PageShell
      title="🧮 Quick Tools"
      description="LRE calculator (from your IEP LRE tool) and chronological age calculator — for Eval teams and report generation. Companion: Copy into Enrich / SoR."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['lre', 'LRE Calculator'],
            ['age', 'Age Calculator'],
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
        <Link to="/evaluations" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">
          Eval Tracker →
        </Link>
        <Link to="/generation" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">
          Generation Studio →
        </Link>
      </div>

      {tab === 'lre' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Section 1 — Student information</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold">
                Pick from caseload (optional)
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={studentId}
                  onChange={(e) => pickStudent(e.target.value)}
                >
                  <option value="">Manual entry…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold">
                Student name
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </label>
              <label className="text-xs font-semibold">
                School
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                />
              </label>
              <label className="text-xs font-semibold">
                Grade
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
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
                IEP annual review date
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                  value={iepReview}
                  onChange={(e) => setIepReview(e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">
              Section 2 — Weekly minutes OUTSIDE general education
            </h2>
            <p className="mt-1 text-xs text-[var(--subtext)]">
              Do <strong>not</strong> count push-in services delivered inside the gen-ed classroom.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
                    <th className="p-2">Service provider</th>
                    <th className="p-2">Weekly minutes outside GE</th>
                    <th className="p-2">Setting / notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.name}-${i}`} className="border-b border-[var(--border)] last:border-0">
                      <td className="p-1">
                        <input
                          className="w-full min-w-[10rem] rounded border border-[var(--border)] px-2 py-1"
                          value={r.name}
                          onChange={(e) => updateRow(i, { name: e.target.value })}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          min={0}
                          className="w-28 rounded border border-[var(--border)] px-2 py-1 font-mono"
                          value={r.minutes}
                          onChange={(e) => updateRow(i, { minutes: e.target.value })}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          className="w-full min-w-[8rem] rounded border border-[var(--border)] px-2 py-1"
                          value={r.notes}
                          onChange={(e) => updateRow(i, { notes: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                onClick={addRow}
              >
                + Add provider row
              </button>
              <span className="text-xs font-semibold">
                TOTAL outside GE: <span className="font-mono">{result.totalOutside}</span> min/week
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Section 3 — School week configuration</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-semibold">
                Hours per school day
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 font-mono"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value) || 0)}
                  disabled={useOverride}
                />
              </label>
              <label className="text-xs font-semibold">
                Days per week
                <input
                  type="number"
                  min={0}
                  max={7}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 font-mono"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value) || 0)}
                  disabled={useOverride}
                />
              </label>
              <label className="text-xs font-semibold">
                Total school minutes / week
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 font-mono"
                  value={useOverride ? minutesOverride : String(result.totalSchoolMinutes)}
                  onChange={(e) => {
                    setUseOverride(true)
                    setMinutesOverride(e.target.value)
                  }}
                />
              </label>
              <div className="rounded-xl bg-[var(--slate)] p-3 text-xs">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={useOverride}
                    onChange={(e) => setUseOverride(e.target.checked)}
                  />
                  Use minutes override
                </label>
                <p className="mt-2 text-[10px] text-[var(--subtext)]">
                  Your sheet defaulted to <strong>1,965</strong> min/week (7h × 5d building schedule).
                  Uncheck to compute hours × 60 × days instead.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
            <h2 className="font-heading text-sm font-bold">Section 4 — LRE calculation & results</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Minutes outside GE', value: result.totalOutside },
                { label: 'Minutes IN GE', value: result.totalInGe },
                { label: 'LRE % in GE', value: `${result.lrePercent.toFixed(1)}%` },
                { label: 'Band', value: result.band.label },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-[var(--border)] p-3 text-center">
                  <p className="font-mono text-xl font-bold text-[var(--accent)]">{c.value}</p>
                  <p className="text-[10px] text-[var(--subtext)]">{c.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs">
              Classification:{' '}
              <strong>
                {result.band.range} — {result.band.label}
              </strong>{' '}
              ({result.band.description})
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {LRE_BANDS.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-xl border p-2 text-[10px] ${
                    b.id === result.band.id
                      ? 'border-[var(--accent)] bg-[var(--sky)]'
                      : 'border-[var(--border)]'
                  }`}
                >
                  <strong>
                    {b.range} · {b.label}
                  </strong>
                  <p className="mt-1 text-[var(--subtext)]">{b.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                onClick={() =>
                  void navigator.clipboard.writeText(buildReport()).then(() => flash('LRE report copied'))
                }
              >
                Copy LRE report
              </button>
              <Link
                to="/generation"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              >
                Use in Generation Studio →
              </Link>
            </div>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-[10px]">
              {buildReport()}
            </pre>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 text-xs shadow-card">
            <h2 className="font-heading text-sm font-bold">Guidance</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[var(--subtext)]">
              <li>
                LRE % = portion of the school week in general education (IDEA least restrictive
                environment).
              </li>
              <li>Enter only pull-out / separate-setting weekly minutes in Section 2.</li>
              <li>Push-in inside gen-ed should not be entered.</li>
              <li>
                Source sheet archived at <code>docs/tools/LRE_Calculation_Tool_for_IEPs.csv</code>.
              </li>
            </ul>
          </section>
        </div>
      )}

      {tab === 'age' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
          <h2 className="font-heading text-sm font-bold">Chronological age calculator</h2>
          <p className="mt-1 text-xs text-[var(--subtext)]">
            For IEP / eval age checks (transition planning, age-out, eligibility age references).
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="text-xs font-semibold">
              Prefill from student (optional)
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={ageStudentId}
                onChange={(e) => {
                  setAgeStudentId(e.target.value)
                  // Demo students may not have DOB — leave manual
                }}
              >
                <option value="">Manual DOB…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              Date of birth
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold">
              As of date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
              />
            </label>
          </div>
          {age ? (
            <div className="mt-4 rounded-xl bg-[var(--slate)] p-4">
              <p className="font-mono text-2xl font-bold text-[var(--accent)]">{age.label}</p>
              <p className="mt-1 text-xs text-[var(--subtext)]">
                {age.totalDays.toLocaleString()} total days · {age.years}y {age.months}m {age.days}d
              </p>
              <button
                type="button"
                className="mt-3 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(
                      `Chronological age as of ${asOf}: ${age.label} (DOB ${dob}). Generated by PRISM Quick Tools.`,
                    )
                    .then(() => flash('Age note copied'))
                }
              >
                Copy age note
              </button>
            </div>
          ) : (
            <p className="mt-4 text-xs text-[var(--subtext)]">Enter a valid DOB on or before the as-of date.</p>
          )}
        </section>
      )}
    </PageShell>
  )
}

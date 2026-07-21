import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { daysUntil, statusBadgeClass } from '../../lib/students/normalizeStudent'
import { fillTemplateBody, readSuiteMode, suiteModeNote } from '../../lib/templates/catalog'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'

export function Section504Page() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const mode = readSuiteMode()
  const list = useMemo(() => students.filter((s) => s.has504), [students])
  const [selected, setSelected] = useState('')
  const [draft, setDraft] = useState('')

  const dueSoon = list.filter((s) => {
    const d = daysUntil(s.section504Due)
    return d != null && d >= 0 && d <= 45
  })
  const overdue = list.filter((s) => {
    const d = daysUntil(s.section504Due)
    return d != null && d < 0
  })

  function generateNotice() {
    const s = list.find((x) => x.id === selected)
    if (!s) return
    const body = fillTemplateBody(
      `SECTION 504 — MEETING / PRIOR WRITTEN NOTICE

Student: {{name}}
Grade / Teacher: {{grade}} · {{teacher}}
Case Manager: {{caseManager}}
504 Review Due: {{section504Due}}
Impairment: {{section504Impairment}}
Date: {{date}}

Dear Parent/Guardian,

This notice concerns {{name}}'s Section 504 plan.
Please contact the case manager to confirm attendance or request an interpreter.

Accommodations on file:
{{accommodations}}
`,
      s,
    )
    setDraft(`${body}\n\n${suiteModeNote(mode, profile.iepSystem)}\n`)
  }

  return (
    <PageShell
      title="📑 504 Plans"
      description="Section 504 caseload from shared student flags. Enable/disable this module via District Profile feature toggles."
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'With 504', value: list.length },
          { label: 'Due ≤45d', value: dueSoon.length },
          { label: 'Overdue', value: overdue.length },
          { label: 'Also IEP', value: list.filter((s) => s.hasIEP).length },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-3 text-center shadow-card"
          >
            <p className="font-mono text-2xl font-bold text-[var(--accent)]">{c.value}</p>
            <p className="text-xs text-[var(--subtext)]">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
              <th className="p-2">Student</th>
              <th className="p-2">Impairment</th>
              <th className="p-2">Review due</th>
              <th className="p-2">Days</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const d = daysUntil(s.section504Due)
              return (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-2 font-semibold">
                    {s.name}
                    {s.hasIEP ? ' · IEP' : ''}
                  </td>
                  <td className="p-2">{s.section504Impairment || s.disability}</td>
                  <td className="p-2">{s.section504Due || '—'}</td>
                  <td className="p-2 font-mono">{d == null ? '—' : `${d}d`}</td>
                  <td className="p-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!list.length && (
          <p className="p-4 text-xs text-[var(--subtext)]">No students flagged has504 yet.</p>
        )}
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Parent notice draft</h2>
        <select
          className="mt-2 w-full max-w-xs rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Select 504 student…</option>
          {list.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
            onClick={generateNotice}
          >
            Generate draft
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            onClick={() => navigator.clipboard.writeText(draft)}
          >
            Copy
          </button>
        </div>
        <textarea
          className="mt-3 w-full rounded-xl border border-[var(--border)] p-3 font-mono text-xs"
          rows={12}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </section>
    </PageShell>
  )
}

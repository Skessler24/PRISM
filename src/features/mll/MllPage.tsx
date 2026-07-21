import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useStudents } from '../../lib/students/useStudents'
import { fillTemplateBody, readSuiteMode, suiteModeNote } from '../../lib/templates/catalog'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'

export function MllPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const mode = readSuiteMode()
  const list = useMemo(() => students.filter((s) => s.hasMLL), [students])
  const [selected, setSelected] = useState('')
  const [draft, setDraft] = useState('')

  function generateFamilyNote() {
    const s = list.find((x) => x.id === selected)
    if (!s) return
    const body = fillTemplateBody(
      `MLL / FAMILY COMMUNICATION

Student: {{name}}
Grade: {{grade}}
Home language: {{homeLanguage}}
ELD level: {{eldLevel}}
Interpreter needed: {{interpreterNeeded}}
Date: {{date}}

Dear Family,

This message concerns educational planning for {{name}}.
Preferred language for notices: {{homeLanguage}}

Please reply with questions or preferred meeting times.
`,
      s,
    )
    setDraft(`${body}\n\n${suiteModeNote(mode, profile.iepSystem)}\n`)
  }

  return (
    <PageShell
      title="🌍 Multilingual Learners"
      description="MLL roster from shared student flags (home language, ELD, interpreter). Pair with Accessibility → CLD Guidance."
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'MLL students', value: list.length },
          { label: 'Interpreter', value: list.filter((s) => s.interpreterNeeded).length },
          { label: 'MLL + IEP', value: list.filter((s) => s.hasIEP).length },
          { label: 'MLL + 504', value: list.filter((s) => s.has504).length },
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
              <th className="p-2">Home language</th>
              <th className="p-2">ELD</th>
              <th className="p-2">Interpreter</th>
              <th className="p-2">Programs</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-2 font-semibold">{s.name}</td>
                <td className="p-2">{s.homeLanguage || '—'}</td>
                <td className="p-2">{s.eldLevel || '—'}</td>
                <td className="p-2">{s.interpreterNeeded ? 'Yes' : 'No'}</td>
                <td className="p-2">
                  {[s.hasIEP ? 'IEP' : null, s.has504 ? '504' : null, 'MLL'].filter(Boolean).join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <p className="p-4 text-xs text-[var(--subtext)]">No students flagged hasMLL yet.</p>
        )}
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">Family communication draft</h2>
        <select
          className="mt-2 w-full max-w-xs rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Select MLL student…</option>
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
            onClick={generateFamilyNote}
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

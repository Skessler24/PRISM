import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { chat } from '../../lib/ai/client'
import { FieldTip } from '../../lib/help-assist/FieldTip'

const DOC_TYPES = [
  'Present Levels',
  'IEP Goals',
  'Progress Report',
  'NOM Letter',
  'BIP Draft',
  'FBA Summary',
  'LRE / Placement Summary',
  'Parent Summary',
  'Accommodation Sheet',
  'Social Story',
  'Teacher One-Pager',
  'Monthly Newsletter',
  'Eligibility Packet',
]

const SAVE_KEY = 'prism_gen_saved_v1'

type Props = { embedded?: boolean }

export function GenerationPage({ embedded }: Props = {}) {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const [studentId, setStudentId] = useState('')
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [extra, setExtra] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2000)
  }

  async function generate() {
    setBusy(true)
    setError('')
    setOutput('✨ Generating…')
    const s = students.find((x) => x.id === studentId)
    const studentContext = s
      ? `Student: ${s.name}, Grade: ${s.grade}, Teacher: ${s.teacher}, Disability: ${s.disability}, Goals: ${s.goals.join('; ')}, Accommodations: ${s.accommodations.join('; ')}, Interests: ${s.interests}, Triggers: ${s.triggers}, Calming: ${s.calming}, Programs: ${[s.hasIEP ? 'IEP' : null, s.has504 ? '504' : null, s.hasMLL ? 'MLL' : null].filter(Boolean).join(', ')}`
      : 'No student selected'
    const res = await chat([
      {
        role: 'system',
        content: `You are a special education document assistant for ${profile.name} (${profile.state}). Generate professional, IDEA-compliant SPED documents. Use measurable language. Follow this district's IEP system context (${profile.iepSystem}) but do not invent live sync. NOM lead time: ${profile.rules.nomLeadTimeDays} days. Evaluation window: ${profile.rules.evaluationWindowDays} days. Human review required before use.`,
      },
      {
        role: 'user',
        content: `Generate a ${docType} document.\n\n${studentContext}\n\nAdditional context: ${extra || 'None'}\n\nGenerate a complete, professional ${docType} ready for review.`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      setOutput('')
      setError(res.error)
      return
    }
    setOutput(res.content || '')
    if (res.error) setError(res.error)
  }

  function saveToStudent() {
    if (!output || !studentId) {
      flash('Select a student and generate first')
      return
    }
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      const list = raw ? (JSON.parse(raw) as { id: string; studentId: string; docType: string; body: string; at: string }[]) : []
      list.unshift({
        id: `gen-${Date.now()}`,
        studentId,
        docType,
        body: output,
        at: new Date().toISOString(),
      })
      localStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 40)))
      flash('Saved to student drafts (local)')
    } catch {
      flash('Could not save')
    }
  }

  return (
    <PageShell
      embedded={embedded}
      title="✨ Generation Studio"
      description="AI drafts for PLAAFP, goals, BIP, NOM, social stories, teacher one-pagers, newsletters, and more — keys stay server-side."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}
      <p className="mb-3 text-xs text-[var(--subtext)]">
        LRE math:{' '}
        <Link to="/tools" className="font-semibold text-[var(--accent)]">
          Quick Tools → LRE Calculator
        </Link>
      </p>
      <FieldTip tipId="templates-suite" className="mb-3" />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {DOC_TYPES.slice(0, 8).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              docType === t ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] tint-lav'
            }`}
            onClick={() => setDocType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card md:grid-cols-2">
        <label className="text-xs font-semibold">
          Student
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.grade})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Document type
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            {DOC_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold md:col-span-2">
          Extra context
          <textarea
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            rows={3}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Meeting purpose, data notes…"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          onClick={() => void generate()}
        >
          {busy ? 'Generating…' : 'Generate'}
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
          onClick={() => {
            void navigator.clipboard.writeText(output)
            flash('Copied')
          }}
          disabled={!output}
        >
          Copy
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
          disabled={!output}
          onClick={() => window.print()}
        >
          Print
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
          disabled={!output}
          onClick={saveToStudent}
        >
          Save to student
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-[var(--coral)] px-3 py-2 text-xs text-red-800">
          {error} — set <code>ANTHROPIC_API_KEY</code> in Azure / local Functions.
        </p>
      )}

      <pre className="mt-3 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-2xl border border-[var(--border)] bg-[var(--slate)] p-4 text-xs">
        {output || 'Output appears here.'}
      </pre>
    </PageShell>
  )
}

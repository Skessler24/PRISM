import { useMemo, useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { chat } from '../../lib/ai/client'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import { readSuiteMode } from '../../lib/templates/catalog'

type AbcRow = {
  id: string
  date: string
  setting: string
  antecedent: string
  behavior: string
  consequence: string
  functionGuess: string
}

const FUNCTIONS = ['Escape/Avoidance', 'Attention', 'Tangible', 'Sensory/Automatic'] as const

const DEMO_ABC: AbcRow[] = [
  {
    id: '1',
    date: '2026-07-15',
    setting: 'Classroom',
    antecedent: 'Transition to math',
    behavior: 'Verbal refusal',
    consequence: 'Redirected by teacher',
    functionGuess: 'Escape',
  },
  {
    id: '2',
    date: '2026-07-16',
    setting: 'Hallway',
    antecedent: 'Peer interaction',
    behavior: 'Physical aggression',
    consequence: 'Sent to office',
    functionGuess: 'Attention',
  },
]

export function FbaBipPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const mode = readSuiteMode()
  const iep = profile.iepSystem || 'Enrich'

  const [studentId, setStudentId] = useState('')
  const [targetBehavior, setTargetBehavior] = useState('')
  const [abc, setAbc] = useState<AbcRow[]>(DEMO_ABC)
  const [functions, setFunctions] = useState<string[]>([])
  const [fbaOut, setFbaOut] = useState('')
  const [bipBehavior, setBipBehavior] = useState('')
  const [bipFunction, setBipFunction] = useState('')
  const [bipPrevention, setBipPrevention] = useState('')
  const [bipReplacement, setBipReplacement] = useState('')
  const [bipReinforcement, setBipReinforcement] = useState('')
  const [bipCrisis, setBipCrisis] = useState('')
  const [bipMonitor, setBipMonitor] = useState('Frequency Count')
  const [bipOut, setBipOut] = useState('')
  const [busy, setBusy] = useState<'fba' | 'bip' | null>(null)
  const [toast, setToast] = useState('')

  const student = useMemo(() => students.find((s) => s.id === studentId), [students, studentId])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2400)
  }

  function toggleFunction(f: string) {
    setFunctions((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
  }

  function addAbc() {
    setAbc((prev) => [
      ...prev,
      {
        id: `abc-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        setting: '',
        antecedent: '',
        behavior: '',
        consequence: '',
        functionGuess: '',
      },
    ])
  }

  function updateAbc(id: string, patch: Partial<AbcRow>) {
    setAbc((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function generateFba() {
    setBusy('fba')
    const abcText = abc
      .map(
        (r) =>
          `${r.date} | Setting: ${r.setting} | A: ${r.antecedent} | B: ${r.behavior} | C: ${r.consequence} | Fn: ${r.functionGuess}`,
      )
      .join('\n')
    const res = await chat([
      {
        role: 'system',
        content: `You are a behavior specialist writing FBA summaries for ${profile.name}. Be clinical, operational, and IDEA-aligned. Do not invent live ${iep} sync. FBA is required before BIP per district practice.`,
      },
      {
        role: 'user',
        content: `Write an FBA Summary for ${student?.name || 'the student'} (${student?.grade || 'grade TBD'}, disability: ${student?.disability || 'n/a'}).
Target behavior: ${targetBehavior || 'not specified'}
Hypothesized function(s): ${functions.join(', ') || 'not selected'}
ABC data:
${abcText || 'None entered'}
Triggers/calming notes: ${student?.triggers || '—'} / ${student?.calming || '—'}

Include: operational definition, setting events, pattern summary, hypothesized function with rationale, recommended next steps toward BIP.`,
      },
    ])
    setBusy(null)
    if (res.error && !res.content) {
      flash(res.error)
      return
    }
    setFbaOut(res.content)
    if (!bipBehavior && targetBehavior) setBipBehavior(targetBehavior)
    if (!bipFunction && functions.length) setBipFunction(functions.join(', '))
    flash('FBA summary ready — review before Copy')
  }

  async function generateBip() {
    setBusy('bip')
    const res = await chat([
      {
        role: 'system',
        content: `You write Behavior Intervention Plans for ${profile.name}. Include prevention, replacement, reinforcement, crisis/safety, and progress monitoring. Human review required. Companion: draft for paste into ${iep}.`,
      },
      {
        role: 'user',
        content: `Generate a BIP draft for ${student?.name || 'the student'}.
Target behavior: ${bipBehavior || targetBehavior || 'n/a'}
Function: ${bipFunction || functions.join(', ') || 'n/a'}
Prevention notes: ${bipPrevention || 'n/a'}
Replacement notes: ${bipReplacement || 'n/a'}
Reinforcement notes: ${bipReinforcement || 'n/a'}
Crisis/safety notes: ${bipCrisis || 'n/a'}
Progress monitoring method: ${bipMonitor}
FBA summary context:
${fbaOut || 'None yet'}

Produce a complete BIP draft ready for team review.`,
      },
    ])
    setBusy(null)
    if (res.error && !res.content) {
      flash(res.error)
      return
    }
    setBipOut(res.content)
    flash('BIP draft ready — review before Copy')
  }

  async function copyText(text: string, label: string) {
    if (!text.trim()) {
      flash('Nothing to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      flash(
        mode === 'companion'
          ? `Copied ${label} — paste into ${iep}`
          : `Copied ${label}`,
      )
    } catch {
      flash('Copy failed — select text manually')
    }
  }

  return (
    <PageShell
      title="🔍 FBA / BIP Engine"
      description={`Functional Behavior Assessment and Behavior Intervention Plan drafts for ${profile.name}. Companion mode: Copy into ${iep}. PRISM never live-syncs.`}
    >
      <FieldTip tipId="fba-bip" className="mb-3" />
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">FBA data collection</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
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
            Target behavior (operational definition)
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={targetBehavior}
              onChange={(e) => setTargetBehavior(e.target.value)}
              placeholder="e.g., Verbal refusal lasting &gt;10 seconds during academic demand"
            />
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--subtext)]">
                <th className="p-2">Date</th>
                <th className="p-2">Setting</th>
                <th className="p-2">Antecedent</th>
                <th className="p-2">Behavior</th>
                <th className="p-2">Consequence</th>
                <th className="p-2">Function</th>
              </tr>
            </thead>
            <tbody>
              {abc.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  {(
                    [
                      ['date', r.date],
                      ['setting', r.setting],
                      ['antecedent', r.antecedent],
                      ['behavior', r.behavior],
                      ['consequence', r.consequence],
                      ['functionGuess', r.functionGuess],
                    ] as const
                  ).map(([key, val]) => (
                    <td key={key} className="p-1">
                      <input
                        className="w-full min-w-[5.5rem] rounded border border-[var(--border)] px-1 py-1"
                        value={val}
                        onChange={(e) => updateAbc(r.id, { [key]: e.target.value })}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="mt-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
          onClick={addAbc}
        >
          + Add ABC entry
        </button>

        <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-[var(--subtext)]">
          Function hypothesis
        </h3>
        <div className="mt-2 flex flex-wrap gap-3">
          {FUNCTIONS.map((f) => (
            <label key={f} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={functions.includes(f)}
                onChange={() => toggleFunction(f)}
              />
              {f}
            </label>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy === 'fba'}
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() => void generateFba()}
          >
            {busy === 'fba' ? 'Generating…' : 'Generate FBA summary'}
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            onClick={() => void copyText(fbaOut, 'FBA')}
            disabled={!fbaOut}
          >
            Copy FBA
          </button>
        </div>
        {fbaOut && (
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
            {fbaOut}
          </pre>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <h2 className="font-heading text-sm font-bold">BIP builder</h2>
        <FieldTip tipId="bip-builder" className="mb-2 mt-2" />
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Target behavior
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={bipBehavior}
              onChange={(e) => setBipBehavior(e.target.value)}
              placeholder="Auto-filled from FBA when generated"
            />
          </label>
          <label className="text-xs font-semibold">
            Function
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={bipFunction}
              onChange={(e) => setBipFunction(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Prevention strategies
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={2}
              value={bipPrevention}
              onChange={(e) => setBipPrevention(e.target.value)}
              placeholder="Environmental modifications, schedule changes…"
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Replacement behaviors
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={2}
              value={bipReplacement}
              onChange={(e) => setBipReplacement(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Reinforcement strategies
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={2}
              value={bipReinforcement}
              onChange={(e) => setBipReinforcement(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Crisis / safety plan
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={2}
              value={bipCrisis}
              onChange={(e) => setBipCrisis(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Progress monitoring method
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={bipMonitor}
              onChange={(e) => setBipMonitor(e.target.value)}
            >
              {['Frequency Count', 'Duration', 'Interval Recording', 'Trial Data'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy === 'bip'}
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() => void generateBip()}
          >
            {busy === 'bip' ? 'Generating…' : 'Generate BIP draft'}
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
            onClick={() => void copyText(bipOut, 'BIP')}
            disabled={!bipOut}
          >
            Copy BIP
          </button>
        </div>
        {bipOut && (
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
            {bipOut}
          </pre>
        )}
      </section>
    </PageShell>
  )
}

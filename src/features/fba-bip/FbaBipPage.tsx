import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { useDistrictProfile } from '../../lib/district-profiles/useDistrictProfile'
import { useStudents } from '../../lib/students/useStudents'
import { chat } from '../../lib/ai/client'
import { FieldTip } from '../../lib/help-assist/FieldTip'
import { readSuiteMode } from '../../lib/templates/catalog'
import {
  getFbaSession,
  loadFbaSessions,
  subscribeFbaLive,
  tallyTotal,
  upsertFbaSession,
  type AbcRow,
  type FbaSession,
} from '../../lib/fba/store'

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

function blankSession(studentId: string, studentName: string): FbaSession {
  return {
    id: `fba-${studentId || 'new'}-${Date.now()}`,
    studentId,
    studentName,
    targetBehavior: '',
    abc: [...DEMO_ABC],
    functions: [],
    tallies: [],
    open: true,
    fbaOut: '',
    bipOut: '',
    updatedAt: new Date().toISOString(),
  }
}

export function FbaBipPage() {
  const { students } = useStudents()
  const { profile } = useDistrictProfile()
  const mode = readSuiteMode()
  const iep = profile.iepSystem || 'Enrich'
  const [searchParams] = useSearchParams()

  const [session, setSession] = useState<FbaSession>(() => {
    const fromUrl = searchParams.get('session')
    if (fromUrl) {
      const existing = getFbaSession(fromUrl)
      if (existing) return existing
    }
    const open = loadFbaSessions().find((s) => s.open)
    return open || blankSession('', '')
  })
  const [bipBehavior, setBipBehavior] = useState('')
  const [bipFunction, setBipFunction] = useState('')
  const [bipPrevention, setBipPrevention] = useState('')
  const [bipReplacement, setBipReplacement] = useState('')
  const [bipReinforcement, setBipReinforcement] = useState('')
  const [bipCrisis, setBipCrisis] = useState('')
  const [bipMonitor, setBipMonitor] = useState('Frequency Count')
  const [busy, setBusy] = useState<'fba' | 'bip' | null>(null)
  const [toast, setToast] = useState('')

  const student = useMemo(
    () => students.find((s) => s.id === session.studentId),
    [students, session.studentId],
  )

  useEffect(() => {
    return subscribeFbaLive(() => {
      const latest = getFbaSession(session.id)
      if (latest) setSession(latest)
    })
  }, [session.id])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2400)
  }

  function persist(next: FbaSession) {
    const withName = {
      ...next,
      studentName: students.find((s) => s.id === next.studentId)?.name || next.studentName,
      updatedAt: new Date().toISOString(),
    }
    setSession(withName)
    upsertFbaSession(withName)
  }

  function toggleFunction(f: string) {
    const functions = session.functions.includes(f)
      ? session.functions.filter((x) => x !== f)
      : [...session.functions, f]
    persist({ ...session, functions })
  }

  function addAbc() {
    persist({
      ...session,
      abc: [
        {
          id: `abc-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          setting: '',
          antecedent: '',
          behavior: '',
          consequence: '',
          functionGuess: '',
        },
        ...session.abc,
      ],
    })
  }

  function updateAbc(id: string, patch: Partial<AbcRow>) {
    persist({
      ...session,
      abc: session.abc.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })
  }

  async function generateFba() {
    setBusy('fba')
    const abcText = session.abc
      .map(
        (r) =>
          `${r.date} | Setting: ${r.setting} | A: ${r.antecedent} | B: ${r.behavior} | C: ${r.consequence} | Fn: ${r.functionGuess}`,
      )
      .join('\n')
    const tallyLine = `Live tallies total: ${tallyTotal(session)} (${session.tallies.length} events)`
    const res = await chat([
      {
        role: 'system',
        content: `You are a behavior specialist writing FBA summaries for ${profile.name}. Be clinical, operational, and IDEA-aligned. Do not invent live ${iep} sync. FBA is required before BIP per district practice.`,
      },
      {
        role: 'user',
        content: `Write an FBA Summary for ${student?.name || session.studentName || 'the student'} (${student?.grade || 'grade TBD'}, disability: ${student?.disability || 'n/a'}).
Target behavior: ${session.targetBehavior || 'not specified'}
Hypothesized function(s): ${session.functions.join(', ') || 'not selected'}
${tallyLine}
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
    persist({ ...session, fbaOut: res.content, open: true })
    if (!bipBehavior && session.targetBehavior) setBipBehavior(session.targetBehavior)
    if (!bipFunction && session.functions.length) setBipFunction(session.functions.join(', '))
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
        content: `Generate a BIP draft for ${student?.name || session.studentName || 'the student'}.
Target behavior: ${bipBehavior || session.targetBehavior || 'n/a'}
Function: ${bipFunction || session.functions.join(', ') || 'n/a'}
Prevention notes: ${bipPrevention || 'n/a'}
Replacement notes: ${bipReplacement || 'n/a'}
Reinforcement notes: ${bipReinforcement || 'n/a'}
Crisis/safety notes: ${bipCrisis || 'n/a'}
Progress monitoring method: ${bipMonitor}
Live tally total: ${tallyTotal(session)}
FBA summary context:
${session.fbaOut || 'None yet'}

Produce a complete BIP draft ready for team review.`,
      },
    ])
    setBusy(null)
    if (res.error && !res.content) {
      flash(res.error)
      return
    }
    persist({ ...session, bipOut: res.content })
    flash('BIP draft ready — review before Copy')
  }

  async function copyText(text: string, label: string) {
    if (!text.trim()) {
      flash('Nothing to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      flash(mode === 'companion' ? `Copied ${label} — paste into ${iep}` : `Copied ${label}`)
    } catch {
      flash('Copy failed — select text manually')
    }
  }

  function openTallyPopout() {
    if (!session.studentId) {
      flash('Select a student and save/open session first')
      return
    }
    persist({ ...session, open: true })
    window.open(`/fba/tally/${session.id}`, 'prism-fba-tally', 'width=420,height=640')
    flash('Tally pop-out opened — +/- syncs live here')
  }

  return (
    <PageShell
      title="🔍 FBA / BIP Engine"
      description={`Functional Behavior Assessment and BIP drafts for ${profile.name}. Open sessions persist locally; live tally pop-out syncs during provider sessions. Companion: Copy into ${iep}.`}
    >
      <FieldTip tipId="fba-bip" className="mb-3" />
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-sm font-bold">FBA data collection</h2>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                session.open ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {session.open ? 'OPEN session' : 'Closed'} · tallies {tallyTotal(session)}
            </span>
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              onClick={openTallyPopout}
            >
              Open +/- tally pop-out
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
              onClick={() => persist({ ...session, open: !session.open })}
            >
              {session.open ? 'Mark closed' : 'Re-open session'}
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Student
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
              value={session.studentId}
              onChange={(e) => {
                const id = e.target.value
                const existing = loadFbaSessions().find((s) => s.studentId === id && s.open)
                if (existing) {
                  setSession(existing)
                  return
                }
                const name = students.find((s) => s.id === id)?.name || ''
                persist({ ...session, studentId: id, studentName: name, open: true })
              }}
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
              value={session.targetBehavior}
              onChange={(e) => persist({ ...session, targetBehavior: e.target.value })}
              placeholder="e.g., Verbal refusal lasting &gt;10 seconds during academic demand"
            />
          </label>
        </div>

        {session.tallies.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
            <strong>Live tallies</strong> ({session.tallies.length} events · total {tallyTotal(session)})
            <ul className="mt-1 max-h-24 overflow-auto text-[10px] text-[var(--subtext)]">
              {session.tallies.slice(0, 8).map((t) => (
                <li key={t.id}>
                  {new Date(t.at).toLocaleString()} · {t.delta > 0 ? '+' : ''}
                  {t.delta} · {t.goalLabel}
                </li>
              ))}
            </ul>
          </div>
        )}

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
              {session.abc.map((r) => (
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
                checked={session.functions.includes(f)}
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
            onClick={() => void copyText(session.fbaOut, 'FBA')}
            disabled={!session.fbaOut}
          >
            Copy FBA
          </button>
          <Link to="/templates" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold">
            Behavior chart materials →
          </Link>
        </div>
        {session.fbaOut && (
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
            {session.fbaOut}
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
            onClick={() => void copyText(session.bipOut, 'BIP')}
            disabled={!session.bipOut}
          >
            Copy BIP
          </button>
        </div>
        {session.bipOut && (
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--slate)] p-3 text-xs">
            {session.bipOut}
          </pre>
        )}
      </section>
    </PageShell>
  )
}

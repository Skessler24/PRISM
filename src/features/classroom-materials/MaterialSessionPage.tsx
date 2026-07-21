import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getMaterial,
  speakLocal,
  upsertMaterial,
  type BehaviorPayload,
  type CommPayload,
  type SavedMaterial,
  type SchedulePayload,
  type TokenPayload,
} from '../../lib/classroom-materials/store'
import { resolveIcon } from '../../lib/icons/catalog'
import { IconGlyph } from '../../lib/icons/IconGlyph'
import { applyTally, getFbaSession } from '../../lib/fba/store'

export function MaterialSessionPage() {
  const { id = '' } = useParams()
  const [rev, setRev] = useState(0)
  const material = getMaterial(id) || null
  // rev forces re-read after persist
  void rev
  const [flash, setFlash] = useState('')
  const [phrase, setPhrase] = useState<string[]>([])

  function persist(next: SavedMaterial) {
    const updated = { ...next, updatedAt: new Date().toISOString() }
    upsertMaterial(updated)
    setRev((n) => n + 1)
  }

  function toast(msg: string) {
    setFlash(msg)
    window.setTimeout(() => setFlash(''), 1800)
  }

  const token = material?.kind === 'token' ? (material.payload as TokenPayload) : null
  const schedule = material?.kind === 'schedule' ? (material.payload as SchedulePayload) : null
  const comm = material?.kind === 'comm' ? (material.payload as CommPayload) : null
  const behavior = material?.kind === 'behavior' ? (material.payload as BehaviorPayload) : null

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  if (!material) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-900 p-6 text-white">
        <p>Material not found in this browser.</p>
        <Link to="/templates" className="underline">
          Back to Materials Studio
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-sky-300">Smart TV / Session mode</p>
          <h1 className="text-xl font-bold sm:text-3xl">{material.title}</h1>
          <p className="text-sm text-white/70">{material.studentName || 'Group'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/templates"
            className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold"
          >
            Exit
          </Link>
          <button
            type="button"
            className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen()
              else void document.documentElement.requestFullscreen?.()
            }}
          >
            Fullscreen
          </button>
        </div>
      </header>

      {flash && (
        <div className="mx-4 mt-3 rounded-xl bg-emerald-500 px-4 py-2 text-center text-sm font-bold text-white">
          {flash}
        </div>
      )}

      <main className="mx-auto max-w-6xl p-4 sm:p-8">
        {token && (
          <section className="text-center">
            <p className="mb-4 text-2xl font-semibold sm:text-4xl">Working for: {token.reward}</p>
            <div className="mb-6 flex flex-wrap justify-center gap-3 sm:gap-5">
              {Array.from({ length: token.tokenCount }, (_, i) => {
                const filled = i < token.filled
                return (
                  <button
                    key={i}
                    type="button"
                    className={`flex h-20 w-20 items-center justify-center rounded-full border-4 text-3xl transition sm:h-28 sm:w-28 sm:text-5xl ${
                      filled
                        ? 'scale-105 border-amber-300 bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/40'
                        : 'border-dashed border-white/40 bg-white/5'
                    }`}
                    onClick={() => {
                      const nextFilled = filled ? i : i + 1
                      persist({
                        ...material,
                        payload: { ...token, filled: nextFilled },
                      })
                      toast(nextFilled >= token.tokenCount ? 'Reward earned! 🎉' : `Token ${nextFilled}`)
                    }}
                  >
                    {token.shape.split(' ')[0]}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                className="rounded-xl bg-white/15 px-5 py-3 text-lg font-bold"
                onClick={() =>
                  persist({
                    ...material,
                    payload: { ...token, filled: Math.max(0, token.filled - 1) },
                  })
                }
              >
                −
              </button>
              <button
                type="button"
                className="rounded-xl bg-sky-500 px-5 py-3 text-lg font-bold"
                onClick={() =>
                  persist({
                    ...material,
                    payload: {
                      ...token,
                      filled: Math.min(token.tokenCount, token.filled + 1),
                    },
                  })
                }
              >
                +
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/30 px-5 py-3 text-lg font-bold"
                onClick={() => persist({ ...material, payload: { ...token, filled: 0 } })}
              >
                Reset
              </button>
            </div>
          </section>
        )}

        {schedule && (
          <section>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {schedule.steps.map((step, i) => {
                const active = i === schedule.activeStep
                const done = i < schedule.activeStep
                return (
                  <button
                    key={`${step}-${i}`}
                    type="button"
                    className={`rounded-2xl border-4 p-6 text-left text-xl font-bold transition sm:text-2xl ${
                      active
                        ? 'scale-[1.02] border-sky-300 bg-sky-500 shadow-xl'
                        : done
                          ? 'border-emerald-400/50 bg-emerald-900/40 opacity-80'
                          : 'border-white/20 bg-white/5'
                    }`}
                    onClick={() => {
                      persist({ ...material, payload: { ...schedule, activeStep: i } })
                      speakLocal(step)
                    }}
                  >
                    <span className="block text-sm font-semibold opacity-80">Step {i + 1}</span>
                    {step}
                  </button>
                )
              })}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-xl bg-white/15 px-5 py-3 font-bold"
                onClick={() =>
                  persist({
                    ...material,
                    payload: {
                      ...schedule,
                      activeStep: Math.max(0, schedule.activeStep - 1),
                    },
                  })
                }
              >
                ← Back
              </button>
              <button
                type="button"
                className="rounded-xl bg-sky-500 px-5 py-3 font-bold"
                onClick={() =>
                  persist({
                    ...material,
                    payload: {
                      ...schedule,
                      activeStep: Math.min(schedule.steps.length - 1, schedule.activeStep + 1),
                    },
                  })
                }
              >
                Next →
              </button>
            </div>
          </section>
        )}

        {comm && (
          <section>
            <div className="mb-4 min-h-[3rem] rounded-2xl bg-white/10 px-4 py-3 text-center text-2xl font-bold tracking-wide">
              {phrase.length ? phrase.join(' ') : 'Tap cells to build a message'}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {comm.cells.map((word) => {
                const icon = resolveIcon(word)
                return (
                <button
                  key={word}
                  type="button"
                  className="flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-4 border-sky-300/40 bg-sky-600/80 px-2 py-4 text-xl font-bold shadow-lg transition active:scale-95 sm:min-h-[7rem] sm:text-2xl"
                  onClick={() => {
                    setPhrase((p) => [...p, word])
                    speakLocal(word)
                    const taps = [...(comm.taps || []), { word, at: new Date().toISOString() }].slice(
                      0,
                      200,
                    )
                    persist({ ...material, payload: { ...comm, taps } })
                  }}
                >
                  <IconGlyph icon={icon} label={word} size={48} />
                  <span>{word}</span>
                </button>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-5 py-3 font-bold"
                onClick={() => {
                  const msg = phrase.join(' ')
                  if (msg) speakLocal(msg)
                  toast(msg || 'Nothing to speak')
                }}
              >
                Speak message
              </button>
              <button
                type="button"
                className="rounded-xl bg-white/15 px-5 py-3 font-bold"
                onClick={() => setPhrase((p) => p.slice(0, -1))}
              >
                Backspace
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/30 px-5 py-3 font-bold"
                onClick={() => setPhrase([])}
              >
                Clear
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-white/50">
              TouchChat-style board · browser speech for Smart TV · taps stored on this student material
            </p>
          </section>
        )}

        {behavior && (
          <section className="text-center">
            <p className="mb-2 text-lg text-white/70">{behavior.chartType} chart</p>
            <h2 className="mb-6 text-3xl font-bold sm:text-5xl">{behavior.targetBehavior}</h2>
            <p className="mb-6 font-mono text-6xl font-black text-amber-300 sm:text-8xl">
              {behavior.dailyCounts[today] || 0}
            </p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="h-24 w-24 rounded-full bg-rose-500 text-5xl font-black shadow-xl"
                onClick={() => {
                  const n = Math.max(0, (behavior.dailyCounts[today] || 0) - 1)
                  persist({
                    ...material,
                    payload: {
                      ...behavior,
                      dailyCounts: { ...behavior.dailyCounts, [today]: n },
                    },
                  })
                  if (behavior.linkedFbaSessionId && getFbaSession(behavior.linkedFbaSessionId)) {
                    applyTally(behavior.linkedFbaSessionId, -1, {
                      goalLabel: behavior.targetBehavior,
                    })
                  }
                }}
              >
                −
              </button>
              <button
                type="button"
                className="h-24 w-24 rounded-full bg-emerald-500 text-5xl font-black shadow-xl"
                onClick={() => {
                  const n = (behavior.dailyCounts[today] || 0) + 1
                  persist({
                    ...material,
                    payload: {
                      ...behavior,
                      dailyCounts: { ...behavior.dailyCounts, [today]: n },
                    },
                  })
                  if (behavior.linkedFbaSessionId && getFbaSession(behavior.linkedFbaSessionId)) {
                    applyTally(behavior.linkedFbaSessionId, 1, {
                      goalLabel: behavior.targetBehavior,
                    })
                    toast('Synced to open FBA session')
                  }
                }}
              >
                +
              </button>
            </div>
          </section>
        )}

        {material.kind === 'social' && (
          <pre className="whitespace-pre-wrap rounded-2xl bg-white/10 p-6 text-lg leading-relaxed sm:text-2xl">
            {(material.payload as { story: string }).story || material.body}
          </pre>
        )}
      </main>
    </div>
  )
}

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
import {
  TEMPLATE_FONT,
  TEMPLATE_FOOTER,
  accentForMaterial,
  fitzColor,
} from '../../lib/classroom-materials/prismTemplateTheme'
import { resolveIcon } from '../../lib/icons/catalog'
import { IconGlyph } from '../../lib/icons/IconGlyph'
import { applyTally, getFbaSession } from '../../lib/fba/store'

/** Smart TV session — Prism Templates visual language (Nunito, accent borders, Fitzgerald cells). */
export function MaterialSessionPage() {
  const { id = '' } = useParams()
  const [rev, setRev] = useState(0)
  const material = getMaterial(id) || null
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
  const accent = material
    ? accentForMaterial(
        material.kind,
        material.kind === 'schedule' ? (material.payload as SchedulePayload).scheduleType : undefined,
      )
    : null

  if (!material || !accent) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 p-6"
        style={{ fontFamily: TEMPLATE_FONT }}
      >
        <p className="font-bold">Material not found in this browser.</p>
        <Link to="/creation?panel=templates" className="font-semibold underline" style={{ color: '#2563EB' }}>
          Back to Materials Studio
        </Link>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900"
      style={{ fontFamily: TEMPLATE_FONT }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b-4 px-4 py-3"
        style={{ borderColor: accent.c, background: '#fff' }}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            Smart TV · PRISM Templates
          </p>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl" style={{ color: accent.title }}>
            {accent.label}
          </h1>
          <p className="text-sm font-semibold text-slate-600">
            {material.studentName || 'Group'}
            {material.title !== accent.label ? ` · ${material.title}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/creation?panel=templates"
            className="rounded-xl border-2 border-slate-300 px-3 py-2 text-xs font-bold"
          >
            Exit
          </Link>
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-xs font-bold text-white"
            style={{ background: accent.c }}
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
        <div
          className="mx-4 mt-3 rounded-xl px-4 py-2 text-center text-sm font-black text-white"
          style={{ background: accent.c }}
        >
          {flash}
        </div>
      )}

      <main className="mx-auto max-w-6xl p-4 sm:p-8">
        {token && (
          <section className="text-center">
            <div
              className="mx-auto mb-6 max-w-xl rounded-2xl border-[3px] bg-white p-4 text-left"
              style={{ borderColor: accent.c }}
            >
              <p className="text-lg font-black" style={{ color: accent.title }}>
                Name: {material.studentName || '_______________'}
              </p>
              <p className="mt-2 text-lg font-black" style={{ color: accent.title }}>
                🎯 Goal: {token.goalLabel || token.reward}
              </p>
            </div>
            <div className="mb-6 flex flex-wrap justify-center gap-3 sm:gap-5">
              {Array.from({ length: token.tokenCount }, (_, i) => {
                const filled = i < token.filled
                return (
                  <button
                    key={i}
                    type="button"
                    className={`flex h-20 w-20 flex-col items-center justify-end rounded-full border-4 bg-white transition sm:h-28 sm:w-28 ${
                      filled ? 'scale-105 shadow-lg' : 'border-dashed'
                    }`}
                    style={{
                      borderColor: accent.c,
                      background: filled ? accent.c : '#fff',
                      color: filled ? '#fff' : accent.c,
                    }}
                    onClick={() => {
                      const nextFilled = filled ? i : i + 1
                      persist({
                        ...material,
                        payload: { ...token, filled: nextFilled },
                      })
                      toast(nextFilled >= token.tokenCount ? 'Reward earned! ★' : `Token ${nextFilled}`)
                    }}
                  >
                    <span className="mb-2 text-sm font-black sm:text-base">{i + 1}</span>
                  </button>
                )
              })}
            </div>
            <div className="mb-6">
              <p className="text-xl font-black" style={{ color: accent.title }}>
                🏆 Reward
              </p>
              <div
                className="mx-auto mt-2 flex h-28 w-28 items-center justify-center rounded-full border-[5px] bg-white text-5xl"
                style={{ borderColor: accent.c, color: accent.c }}
              >
                ★
              </div>
              <p className="mt-2 text-lg font-bold">{token.reward}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-lg font-black"
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
                className="rounded-xl px-5 py-3 text-lg font-black text-white"
                style={{ background: accent.c }}
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
                className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-lg font-black"
                onClick={() => persist({ ...material, payload: { ...token, filled: 0 } })}
              >
                Reset
              </button>
            </div>
          </section>
        )}

        {schedule && schedule.scheduleType === 'First / Then' && (
          <section>
            <div
              className="grid grid-cols-1 gap-4 rounded-[26px] border-[10px] bg-white p-4 sm:grid-cols-2 sm:gap-6 sm:p-6"
              style={{ borderColor: accent.c }}
            >
              {['FIRST', 'THEN'].map((label, idx) => {
                const step = schedule.steps[idx] || ''
                const active = schedule.activeStep === idx
                return (
                  <button
                    key={label}
                    type="button"
                    className="flex flex-col gap-3 text-left"
                    onClick={() => {
                      persist({ ...material, payload: { ...schedule, activeStep: idx } })
                      if (step) speakLocal(step)
                    }}
                  >
                    <span
                      className="text-center text-4xl font-black tracking-wide sm:text-5xl"
                      style={{ color: accent.title }}
                    >
                      {label}
                    </span>
                    <div
                      className={`flex min-h-[180px] flex-1 items-center justify-center rounded-[14px] border-4 border-black p-4 text-center text-2xl font-black sm:min-h-[240px] sm:text-3xl ${
                        active ? 'ring-4 ring-offset-2' : ''
                      }`}
                      style={active ? ({ ['--tw-ring-color' as string]: accent.c } as object) : undefined}
                    >
                      {step || '—'}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {schedule && schedule.scheduleType !== 'First / Then' && (
          <section>
            <div className="flex flex-col gap-3">
              {schedule.steps.map((step, i) => {
                const active = i === schedule.activeStep
                const done = i < schedule.activeStep
                return (
                  <button
                    key={`${step}-${i}`}
                    type="button"
                    className={`flex items-center gap-4 rounded-2xl border-[3px] bg-white px-4 py-4 text-left transition sm:px-5 sm:py-5 ${
                      active ? 'scale-[1.01] shadow-lg' : done ? 'opacity-70' : ''
                    }`}
                    style={{ borderColor: accent.c }}
                    onClick={() => {
                      persist({ ...material, payload: { ...schedule, activeStep: i } })
                      speakLocal(step)
                    }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black text-white sm:h-12 sm:w-12 sm:text-xl"
                      style={{ background: accent.c }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-xl font-black sm:text-2xl">{step}</span>
                    <span
                      className="h-9 w-9 shrink-0 rounded-lg border-[3px]"
                      style={{
                        borderColor: accent.c,
                        background: done ? accent.c : 'transparent',
                      }}
                    />
                  </button>
                )
              })}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-black"
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
                className="rounded-xl px-5 py-3 font-black text-white"
                style={{ background: accent.c }}
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
            <div
              className="mb-4 min-h-[3.5rem] rounded-2xl border-[3px] bg-white px-4 py-3 text-center text-2xl font-black tracking-wide"
              style={{ borderColor: accent.c, color: accent.title }}
            >
              {phrase.length ? phrase.join(' ') : 'Tap cells to build a message'}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {comm.cells.map((word) => {
                const icon = resolveIcon(word)
                return (
                  <button
                    key={word}
                    type="button"
                    className="flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-[14px] border-[3px] border-black px-2 py-4 text-xl font-black shadow-md transition active:scale-95 sm:min-h-[7rem] sm:text-2xl"
                    style={{ background: fitzColor(word) }}
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
                className="rounded-xl px-5 py-3 font-black text-white"
                style={{ background: accent.c }}
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
                className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-black"
                onClick={() => setPhrase((p) => p.slice(0, -1))}
              >
                Backspace
              </button>
              <button
                type="button"
                className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-black"
                onClick={() => setPhrase([])}
              >
                Clear
              </button>
            </div>
          </section>
        )}

        {behavior && (
          <section className="text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              {behavior.chartType} chart
            </p>
            <h2 className="mb-6 text-3xl font-black sm:text-5xl" style={{ color: accent.title }}>
              {behavior.targetBehavior}
            </h2>
            <p className="mb-6 font-mono text-6xl font-black sm:text-8xl" style={{ color: accent.c }}>
              {behavior.dailyCounts[today] || 0}
            </p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="h-24 w-24 rounded-full bg-rose-500 text-5xl font-black text-white shadow-xl"
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
                className="h-24 w-24 rounded-full text-5xl font-black text-white shadow-xl"
                style={{ background: accent.c }}
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
          <pre
            className="whitespace-pre-wrap rounded-2xl border-[3px] bg-white p-6 text-lg leading-relaxed sm:text-2xl"
            style={{ borderColor: accent.c, fontFamily: TEMPLATE_FONT }}
          >
            {(material.payload as { story: string }).story || material.body}
          </pre>
        )}
      </main>

      <footer className="py-6 text-center text-[11px] font-bold tracking-[3px] text-slate-400">
        {TEMPLATE_FOOTER}
      </footer>
    </div>
  )
}

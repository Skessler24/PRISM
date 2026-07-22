import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudents } from '../../lib/students/useStudents'
import { chat } from '../../lib/ai/client'
import {
  buildLocalSocialStory,
  loadMaterials,
  saveMaterials,
  type BehaviorPayload,
  type CommPayload,
  type MaterialKind,
  type SavedMaterial,
  type SchedulePayload,
  type TokenPayload,
} from '../../lib/classroom-materials/store'
import {
  downloadMaterialPdf,
  PRINT_SIZES,
  type PrintSizeId,
} from '../../lib/classroom-materials/generateMaterialPdf'
import { PrismMaterialChrome } from '../../lib/classroom-materials/PrismMaterialChrome'
import {
  CORE_VOCAB_DEFAULT,
  KIND_ACCENT,
  FIRST_THEN_ACCENT,
  accentForMaterial,
  fitzColor,
} from '../../lib/classroom-materials/prismTemplateTheme'
import { loadFbaSessions } from '../../lib/fba/store'
import { resolveIcon } from '../../lib/icons/catalog'
import { IconGlyph } from '../../lib/icons/IconGlyph'

type Props = {
  onFlash: (msg: string) => void
}

type MatTab = MaterialKind | 'saved'

const SHAPES = ['⭐ Stars', '🟢 Circles', '💎 Diamonds'] as const

function ActionRow({
  onSave,
  onPdf,
  sessionHref,
  onFlash,
  printSize,
  setPrintSize,
  printBw,
  setPrintBw,
}: {
  onSave: () => void
  onPdf: () => void
  sessionHref?: string
  onFlash: (m: string) => void
  printSize: PrintSizeId
  setPrintSize: (s: PrintSizeId) => void
  printBw: boolean
  setPrintBw: (v: boolean) => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <button
        type="button"
        className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
        onClick={onSave}
      >
        Save to student tile
      </button>
      <label className="text-[10px] font-semibold text-[var(--subtext)]">
        Print size
        <select
          className="mt-0.5 block rounded-lg border border-[var(--border)] px-2 py-1.5 text-xs"
          value={printSize}
          onChange={(e) => setPrintSize(e.target.value as PrintSizeId)}
        >
          {PRINT_SIZES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--subtext)]">
        <input type="checkbox" checked={printBw} onChange={(e) => setPrintBw(e.target.checked)} />
        B&amp;W ink-friendly
      </label>
      <button
        type="button"
        className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
        onClick={onPdf}
      >
        Download PDF
      </button>
      <button
        type="button"
        className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
        onClick={() => window.print()}
      >
        Quick print
      </button>
      {sessionHref && (
        <Link
          to={sessionHref}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
          onClick={() => onFlash('Opening Smart TV session…')}
        >
          Use on Smart TV
        </Link>
      )}
    </div>
  )
}

export function ClassroomMaterialsPanel({ onFlash }: Props) {
  const { students } = useStudents()
  const [matTab, setMatTab] = useState<MatTab>('token')
  const [saved, setSaved] = useState<SavedMaterial[]>(() => loadMaterials())
  const [printSize, setPrintSize] = useState<PrintSizeId>('letter')
  const [printBw, setPrintBw] = useState(false)
  const [lastId, setLastId] = useState('')

  // Token
  const [tokenStudent, setTokenStudent] = useState('')
  const [tokenCount, setTokenCount] = useState(5)
  const [reward, setReward] = useState('5 min preferred activity')
  const [shape, setShape] = useState<(typeof SHAPES)[number]>('⭐ Stars')

  // Schedule
  const [schedStudent, setSchedStudent] = useState('')
  const [schedType, setSchedType] = useState('Full Day')
  const [activities, setActivities] = useState('Arrival\nMorning meeting\nWork time\nBreak\nDismissal')
  const [schedToday, setSchedToday] = useState(true)

  // Social
  const [socialStudent, setSocialStudent] = useState('')
  const [topic, setTopic] = useState('Taking turns')
  const [story, setStory] = useState('')
  const [busy, setBusy] = useState(false)

  // Comm board
  const [commStudent, setCommStudent] = useState('')
  const [commWords, setCommWords] = useState(CORE_VOCAB_DEFAULT)
  const [commPrompt, setCommPrompt] = useState(
    "Make a communication board with this month's vocabulary for today's ILC group",
  )
  const [commBusy, setCommBusy] = useState(false)

  // Behavior
  const [behStudent, setBehStudent] = useState('')
  const [behTarget, setBehTarget] = useState('On-task participation')
  const [behType, setBehType] = useState<BehaviorPayload['chartType']>('frequency')
  const [behToday, setBehToday] = useState(true)
  const [linkFba, setLinkFba] = useState(true)

  function persist(item: SavedMaterial) {
    const next = [item, ...saved.filter((m) => m.id !== item.id)].slice(0, 80)
    setSaved(next)
    saveMaterials(next)
    setLastId(item.id)
    onFlash(`Saved to ${item.studentName || 'library'} · Smart TV + PDF ready`)
  }

  function studentMeta(id: string) {
    const s = students.find((x) => x.id === id)
    return { id, name: s?.name || '' }
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10)
  }

  function saveToken() {
    const { id, name } = studentMeta(tokenStudent)
    const payload: TokenPayload = {
      tokenCount,
      filled: 0,
      reward,
      shape,
      goalLabel: reward,
    }
    const body = `TOKEN BOARD — ${name || 'Student'}
Shape: ${shape}
Tokens needed: ${tokenCount}
Reward: ${reward}`
    const mat: SavedMaterial = {
      id: `mat-${Date.now()}`,
      kind: 'token',
      title: `Token board (${tokenCount})`,
      studentId: id,
      studentName: name,
      body,
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    persist(mat)
  }

  function saveSchedule() {
    const { id, name } = studentMeta(schedStudent)
    let steps = activities
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (schedType === 'First / Then') {
      steps = [steps[0] || 'First', steps[1] || 'Then']
    }
    const payload: SchedulePayload = {
      scheduleType: schedType,
      steps,
      activeStep: 0,
      scheduledDates: schedToday ? [todayIso()] : [],
    }
    const mat: SavedMaterial = {
      id: `mat-${Date.now()}`,
      kind: 'schedule',
      title: schedType === 'First / Then' ? 'First / Then board' : `${schedType} schedule`,
      studentId: id,
      studentName: name,
      body: steps.map((l, i) => `${i + 1}. ${l}`).join('\n'),
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    persist(mat)
  }

  function generateLocalStory() {
    const name = studentMeta(socialStudent).name
    setStory(buildLocalSocialStory(name, topic))
    onFlash('Local social story ready (works offline)')
  }

  async function polishStory() {
    if (!story.trim()) generateLocalStory()
    setBusy(true)
    const name = studentMeta(socialStudent).name
    const base = story || buildLocalSocialStory(name, topic)
    const res = await chat([
      {
        role: 'system',
        content:
          'You write short, affirming social stories for elementary students. Keep language simple. Return only the story.',
      },
      {
        role: 'user',
        content: `Polish this social story for ${name || 'a student'} about "${topic}":\n\n${base}`,
      },
    ])
    setBusy(false)
    if (res.error && !res.content) {
      setStory(base)
      onFlash(`${res.error} — kept offline draft`)
      return
    }
    setStory(res.content || base)
    onFlash(res.error ? `AI note: ${res.error}` : 'AI polish ready')
  }

  function saveStory() {
    const { id, name } = studentMeta(socialStudent)
    const body = story || buildLocalSocialStory(name, topic)
    persist({
      id: `mat-${Date.now()}`,
      kind: 'social',
      title: `Social story: ${topic}`,
      studentId: id,
      studentName: name,
      body,
      payload: { topic, story: body },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  async function aiCommBoard() {
    setCommBusy(true)
    const name = studentMeta(commStudent).name
    const res = await chat([
      {
        role: 'system',
        content:
          'You create AAC / communication board vocabulary for speech therapy and ILC groups. Return ONLY a plain list of 8–16 short words or phrases, one per line. No numbering, no commentary.',
      },
      {
        role: 'user',
        content: `${commPrompt}\nStudent/group: ${name || 'ILC group'}\nCurrent words (optional seed):\n${commWords}`,
      },
    ])
    setCommBusy(false)
    if (res.error && !res.content) {
      onFlash(`${res.error} — edit vocabulary manually (offline)`)
      return
    }
    const lines = (res.content || '')
      .split('\n')
      .map((l) => l.replace(/^[\d.\-*]+\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 24)
    if (lines.length) {
      setCommWords(lines.join('\n'))
      onFlash('AI vocabulary ready — Save + Use on Smart TV')
    } else {
      onFlash('AI returned no words — try again or edit manually')
    }
  }

  function saveCommBoard() {
    const { id, name } = studentMeta(commStudent)
    const cells = commWords
      .split('\n')
      .map((w) => w.trim())
      .filter(Boolean)
    const payload: CommPayload = { cells, prompt: commPrompt, taps: [] }
    persist({
      id: `mat-${Date.now()}`,
      kind: 'comm',
      title: 'Communication board',
      studentId: id,
      studentName: name,
      body: cells.join('\n'),
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  function saveBehavior() {
    const { id, name } = studentMeta(behStudent)
    const openFba = loadFbaSessions().find((s) => s.open && s.studentId === id)
    const payload: BehaviorPayload = {
      chartType: behType,
      targetBehavior: behTarget,
      dailyCounts: {},
      scheduledDates: behToday ? [todayIso()] : [],
      linkedFbaSessionId: linkFba ? openFba?.id : undefined,
    }
    persist({
      id: `mat-${Date.now()}`,
      kind: 'behavior',
      title: `${behType} chart`,
      studentId: id,
      studentName: name,
      body: `Behavior chart: ${behTarget}`,
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  function pdfFor(m: SavedMaterial) {
    try {
      downloadMaterialPdf(m, printSize, { bw: printBw })
      onFlash(
        `PDF downloaded (${PRINT_SIZES.find((s) => s.id === printSize)?.label}${printBw ? ' · B&W' : ' · color'})`,
      )
    } catch (e) {
      onFlash(e instanceof Error ? e.message : 'PDF failed')
    }
  }

  function pdfDraft(build: () => SavedMaterial) {
    const m = build()
    pdfFor(m)
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
      <h2 className="font-heading text-sm font-bold">Classroom Materials Studio</h2>
      <p className="mt-1 text-xs text-[var(--subtext)]">
        All creations follow the <strong>PRISM Templates</strong> pack (Nunito titles, Fitzgerald AAC
        colors, laminate Color + B&amp;W layouts). Token boards, First/Then, schedules, choice boards,
        social stories — Save to student tiles, PDF, Smart TV.
      </p>
      <p className="mt-2 text-[11px]">
        <a
          href="/prism-templates/printable-color-bw.html"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[var(--accent)] underline"
        >
          Open blank Color + B&amp;W printable pack
        </a>
        <span className="text-[var(--subtext)]"> · laminate blanks for velcro icons</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ['token', 'Token board'],
            ['schedule', 'Visual schedule'],
            ['behavior', 'Behavior chart'],
            ['social', 'Social story'],
            ['comm', 'Comm board'],
            ['saved', 'Saved / student'],
          ] as const
        ).map(([id, label]) => {
          const accent = KIND_ACCENT[id === 'saved' ? 'token' : id]
          const active = matTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMatTab(id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                active ? 'text-white' : 'bg-white text-[var(--text)]'
              }`}
              style={
                active
                  ? { background: accent.c, borderColor: accent.c }
                  : { borderColor: accent.c, color: accent.title }
              }
            >
              {label}
            </button>
          )
        })}
      </div>

      {matTab === 'token' && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Student
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={tokenStudent}
                onChange={(e) => setTokenStudent(e.target.value)}
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
              Tokens needed
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={tokenCount}
                onChange={(e) => setTokenCount(Number(e.target.value))}
              >
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              Reward
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold">
              Token shape
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={shape}
                onChange={(e) => setShape(e.target.value as (typeof SHAPES)[number])}
              >
                {SHAPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <PrismMaterialChrome accent={KIND_ACCENT.token} bw={printBw}>
            <div
              className="mb-3 rounded-2xl border-[3px] p-3"
              style={{ borderColor: printBw ? '#111' : KIND_ACCENT.token.c }}
            >
              <p className="text-sm font-black" style={{ color: printBw ? '#111' : KIND_ACCENT.token.title }}>
                Name: {students.find((s) => s.id === tokenStudent)?.name || '_______________'}
              </p>
              <p className="mt-2 text-sm font-black" style={{ color: printBw ? '#111' : KIND_ACCENT.token.title }}>
                🎯 Goal: {reward}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 py-2">
              {Array.from({ length: tokenCount }, (_, i) => (
                <div
                  key={i}
                  className="flex h-[72px] w-[72px] items-end justify-center rounded-full border-4 bg-white"
                  style={{ borderColor: printBw ? '#111' : KIND_ACCENT.token.c }}
                >
                  <span
                    className="mb-1 text-xs font-black"
                    style={{ color: printBw ? '#111' : KIND_ACCENT.token.c }}
                  >
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center">
              <p className="text-sm font-black" style={{ color: printBw ? '#111' : KIND_ACCENT.token.title }}>
                🏆 Reward
              </p>
              <div
                className="mx-auto mt-2 flex h-24 w-24 items-center justify-center rounded-full border-[5px] bg-white text-4xl"
                style={{
                  borderColor: printBw ? '#111' : KIND_ACCENT.token.c,
                  color: printBw ? '#111' : KIND_ACCENT.token.c,
                }}
              >
                ★
              </div>
              <p className="mt-2 text-xs font-semibold">{shape.split(' ')[0]} · {reward}</p>
            </div>
          </PrismMaterialChrome>
          <ActionRow
            onSave={saveToken}
            onPdf={() =>
              pdfDraft(() => {
                const { id, name } = studentMeta(tokenStudent)
                return {
                  id: 'draft',
                  kind: 'token',
                  title: `Token board (${tokenCount})`,
                  studentId: id,
                  studentName: name,
                  body: reward,
                  payload: { tokenCount, filled: 0, reward, shape },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              })
            }
            sessionHref={lastId ? `/materials/session/${lastId}` : undefined}
            onFlash={onFlash}
            printSize={printSize}
            setPrintSize={setPrintSize}
            printBw={printBw}
            setPrintBw={setPrintBw}
          />
        </div>
      )}

      {matTab === 'schedule' && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Student
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={schedStudent}
                onChange={(e) => setSchedStudent(e.target.value)}
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
              Schedule type
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={schedType}
                onChange={(e) => {
                  const next = e.target.value
                  setSchedType(next)
                  if (next === 'First / Then' && !activities.includes('\n')) {
                    setActivities('Work task\nPreferred break')
                  }
                }}
              >
                {['First / Then', 'Full Day', 'Morning Routine', 'Session', 'Transition', 'Check-in'].map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </label>
            <label className="text-xs font-semibold md:col-span-2">
              {schedType === 'First / Then' ? 'First (line 1) / Then (line 2)' : 'Activities (one per line)'}
              <textarea
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
                rows={schedType === 'First / Then' ? 3 : 5}
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input type="checkbox" checked={schedToday} onChange={(e) => setSchedToday(e.target.checked)} />
              Alert on today&apos;s schedule
            </label>
          </div>
          <PrismMaterialChrome
            accent={accentForMaterial('schedule', schedType)}
            bw={printBw}
          >
            {schedType === 'First / Then' ? (
              <div
                className="grid grid-cols-2 gap-3 rounded-[22px] border-[8px] p-3"
                style={{ borderColor: printBw ? '#111' : FIRST_THEN_ACCENT.c }}
              >
                {['FIRST', 'THEN'].map((label, idx) => {
                  const step = activities
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean)[idx]
                  return (
                    <div key={label} className="flex flex-col gap-2">
                      <p
                        className="text-center text-2xl font-black"
                        style={{ color: printBw ? '#111' : FIRST_THEN_ACCENT.title }}
                      >
                        {label}
                      </p>
                      <div className="flex aspect-square items-center justify-center rounded-[14px] border-4 border-black bg-white p-2 text-center text-xs font-bold">
                        {step || ' '}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activities
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean)
                  .map((l, i) => (
                    <div
                      key={`${l}-${i}`}
                      className="flex items-center gap-3 rounded-2xl border-[2.5px] bg-white px-3 py-2"
                      style={{ borderColor: printBw ? '#111' : KIND_ACCENT.schedule.c }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                        style={{ background: printBw ? '#111' : KIND_ACCENT.schedule.c }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 text-xs font-bold">{l}</span>
                      <span
                        className="h-7 w-7 shrink-0 rounded-md border-[3px]"
                        style={{ borderColor: printBw ? '#111' : KIND_ACCENT.schedule.c }}
                      />
                    </div>
                  ))}
              </div>
            )}
          </PrismMaterialChrome>
          <ActionRow
            onSave={saveSchedule}
            onPdf={() =>
              pdfDraft(() => {
                const { id, name } = studentMeta(schedStudent)
                let steps = activities.split('\n').map((l) => l.trim()).filter(Boolean)
                if (schedType === 'First / Then') steps = [steps[0] || 'First', steps[1] || 'Then']
                return {
                  id: 'draft',
                  kind: 'schedule',
                  title: schedType === 'First / Then' ? 'First / Then board' : `${schedType} schedule`,
                  studentId: id,
                  studentName: name,
                  body: steps.join('\n'),
                  payload: { scheduleType: schedType, steps, activeStep: 0, scheduledDates: [] },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              })
            }
            sessionHref={lastId ? `/materials/session/${lastId}` : undefined}
            onFlash={onFlash}
            printSize={printSize}
            setPrintSize={setPrintSize}
            printBw={printBw}
            setPrintBw={setPrintBw}
          />
        </div>
      )}

      {matTab === 'behavior' && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Student
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={behStudent}
                onChange={(e) => setBehStudent(e.target.value)}
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
              Chart type
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={behType}
                onChange={(e) => setBehType(e.target.value as BehaviorPayload['chartType'])}
              >
                <option value="frequency">Frequency tally</option>
                <option value="interval">Interval</option>
                <option value="checkin">Check-in sheet</option>
              </select>
            </label>
            <label className="text-xs font-semibold md:col-span-2">
              Target behavior / goal
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={behTarget}
                onChange={(e) => setBehTarget(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input type="checkbox" checked={behToday} onChange={(e) => setBehToday(e.target.checked)} />
              On today&apos;s schedule alerts
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input type="checkbox" checked={linkFba} onChange={(e) => setLinkFba(e.target.checked)} />
              Link to open FBA session (live tallies)
            </label>
          </div>
          <PrismMaterialChrome accent={KIND_ACCENT.behavior} bw={printBw}>
            <p className="text-sm font-black" style={{ color: printBw ? '#111' : KIND_ACCENT.behavior.title }}>
              Target: {behTarget}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{behType}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 12 }, (_, i) => (
                <span
                  key={i}
                  className="h-8 w-8 rounded-md border-[3px]"
                  style={{ borderColor: printBw ? '#111' : KIND_ACCENT.behavior.c }}
                />
              ))}
            </div>
          </PrismMaterialChrome>
          <ActionRow
            onSave={saveBehavior}
            onPdf={() =>
              pdfDraft(() => {
                const { id, name } = studentMeta(behStudent)
                return {
                  id: 'draft',
                  kind: 'behavior',
                  title: `${behType} chart`,
                  studentId: id,
                  studentName: name,
                  body: behTarget,
                  payload: {
                    chartType: behType,
                    targetBehavior: behTarget,
                    dailyCounts: {},
                    scheduledDates: [],
                  },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              })
            }
            sessionHref={lastId ? `/materials/session/${lastId}` : undefined}
            onFlash={onFlash}
            printSize={printSize}
            setPrintSize={setPrintSize}
            printBw={printBw}
            setPrintBw={setPrintBw}
          />
        </div>
      )}

      {matTab === 'social' && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Student
              <select
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={socialStudent}
                onChange={(e) => setSocialStudent(e.target.value)}
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
              Topic
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              onClick={generateLocalStory}
            >
              Generate offline draft
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              onClick={() => void polishStory()}
            >
              {busy ? 'Polishing…' : 'Optional AI polish'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              disabled={!story}
              onClick={() => void navigator.clipboard.writeText(story).then(() => onFlash('Copied'))}
            >
              Copy
            </button>
          </div>
          <PrismMaterialChrome accent={KIND_ACCENT.social} bw={printBw}>
            <p className="mb-2 text-sm font-black" style={{ color: printBw ? '#111' : KIND_ACCENT.social.title }}>
              {topic}
            </p>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed">
              {story || 'Generate a draft to preview.'}
            </pre>
          </PrismMaterialChrome>
          <ActionRow
            onSave={saveStory}
            onPdf={() =>
              pdfDraft(() => {
                const { id, name } = studentMeta(socialStudent)
                const body = story || buildLocalSocialStory(name, topic)
                return {
                  id: 'draft',
                  kind: 'social',
                  title: `Social story: ${topic}`,
                  studentId: id,
                  studentName: name,
                  body,
                  payload: { topic, story: body },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              })
            }
            sessionHref={lastId ? `/materials/session/${lastId}` : undefined}
            onFlash={onFlash}
            printSize={printSize}
            setPrintSize={setPrintSize}
            printBw={printBw}
            setPrintBw={setPrintBw}
          />
        </div>
      )}

      {matTab === 'comm' && (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold">
            Student / group
            <select
              className="mt-1 w-full max-w-xs rounded-lg border border-[var(--border)] px-2 py-2"
              value={commStudent}
              onChange={(e) => setCommStudent(e.target.value)}
            >
              <option value="">Select…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            AI prompt (TouchChat / NovaChat style board)
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={2}
              value={commPrompt}
              onChange={(e) => setCommPrompt(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={commBusy}
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            onClick={() => void aiCommBoard()}
          >
            {commBusy ? 'Asking AI…' : 'Generate vocabulary with AI'}
          </button>
          <label className="block text-xs font-semibold">
            Vocabulary (one word/phrase per line)
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              rows={5}
              value={commWords}
              onChange={(e) => setCommWords(e.target.value)}
            />
          </label>
          <PrismMaterialChrome accent={KIND_ACCENT.comm} bw={printBw}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {commWords
                .split('\n')
                .map((w) => w.trim())
                .filter(Boolean)
                .slice(0, 9)
                .map((w, i) => (
                  <div key={`${w}-${i}`} className="flex flex-col items-center gap-1.5">
                    <div
                      className="flex aspect-square w-full flex-col items-center justify-center rounded-[14px] border-[3px] border-black p-2"
                      style={{ background: printBw ? '#fff' : fitzColor(w) }}
                    >
                      <IconGlyph icon={resolveIcon(w)} label={w} size={36} />
                    </div>
                    <div className="h-2 w-4/5 border-b-2 border-slate-300" />
                    <span className="text-[10px] font-black">{w}</span>
                  </div>
                ))}
            </div>
          </PrismMaterialChrome>
          <ActionRow
            onSave={saveCommBoard}
            onPdf={() =>
              pdfDraft(() => {
                const { id, name } = studentMeta(commStudent)
                const cells = commWords.split('\n').map((w) => w.trim()).filter(Boolean)
                return {
                  id: 'draft',
                  kind: 'comm',
                  title: 'Communication board',
                  studentId: id,
                  studentName: name,
                  body: cells.join('\n'),
                  payload: { cells, prompt: commPrompt, taps: [] },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              })
            }
            sessionHref={lastId ? `/materials/session/${lastId}` : undefined}
            onFlash={onFlash}
            printSize={printSize}
            setPrintSize={setPrintSize}
            printBw={printBw}
            setPrintBw={setPrintBw}
          />
          <p className="text-[10px] text-[var(--subtext)]">
            Tip: Save first, then open <strong>Use on Smart TV</strong> for fullscreen tap-to-speak on
            ViewSonic. PDF sizes go from letter laminate up to 36×48″ poster/banner.
          </p>
        </div>
      )}

      {matTab === 'saved' && (
        <div className="mt-4 space-y-2">
          {!saved.length && (
            <p className="text-xs text-[var(--subtext)]">No saved materials yet (browser only).</p>
          )}
          {saved.map((m) => (
            <div key={m.id} className="rounded-xl border border-[var(--border)] p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>
                  {m.title}
                  {m.studentName ? ` — ${m.studentName}` : ''}
                </strong>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/materials/session/${m.id}`}
                    className="font-semibold text-emerald-700"
                  >
                    Smart TV
                  </Link>
                  <button
                    type="button"
                    className="font-semibold text-[var(--accent)]"
                    onClick={() => pdfFor(m)}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className="font-semibold text-[var(--accent)]"
                    onClick={() =>
                      void navigator.clipboard.writeText(m.body).then(() => onFlash('Copied'))
                    }
                  >
                    Copy
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[10px] text-[var(--subtext)]">
                {m.kind} · tile:{' '}
                {m.studentId ? (
                  <Link to="/students" className="underline">
                    {m.studentName || m.studentId}
                  </Link>
                ) : (
                  'unassigned'
                )}{' '}
                · {new Date(m.updatedAt || m.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

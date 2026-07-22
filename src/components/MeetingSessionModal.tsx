import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { chat } from '../lib/ai/client'
import {
  useMeetingSession,
  type MeetingSessionLaunch,
} from '../lib/meeting-session/meeting-session-context'
import {
  DEFAULT_AGENDA,
  DISCIPLINES,
  fillSummaryPrompt,
  formatDuration,
  loadSummaryTemplate,
  markSummaryPushedToEvals,
  saveSummaryTemplate,
  upsertMeetingSummary,
  type MeetingAgendaItem,
  type MeetingDiscipline,
  type MeetingSummaryRecord,
} from '../lib/meeting-session/store'
import { openJoinUrl } from '../lib/virtual-meetings/store'

const DISCIPLINE_CLASS: Record<MeetingDiscipline, string> = {
  SLP: 'tint-sky',
  OT: 'tint-lav',
  PT: 'tint-mint',
  Behavior: 'tint-sun',
  'Mental Health': 'tint-pink',
  Admin: 'tint-softorange',
  'Gen Ed': 'tint-mint',
  Parent: 'tint-coral',
  Other: 'tint-sun',
}

export function MeetingSessionModal() {
  const { open, launch, sessionKey, closeMeetingSession } = useMeetingSession()
  if (!open) return null
  return <MeetingSessionBody key={sessionKey} launch={launch} onClose={closeMeetingSession} />
}

function MeetingSessionBody({
  launch,
  onClose,
}: {
  launch: MeetingSessionLaunch | null
  onClose: () => void
}) {
  const [title, setTitle] = useState(launch?.title || 'Team meeting')
  const [joinUrl, setJoinUrl] = useState(launch?.joinUrl || '')
  const provider = launch?.provider || (launch?.joinUrl ? 'Virtual' : 'In-person / hybrid')
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [agenda, setAgenda] = useState<MeetingAgendaItem[]>(() =>
    DEFAULT_AGENDA.map((a) => ({ ...a, id: `${a.id}-${Date.now()}` })),
  )
  const [draftItem, setDraftItem] = useState('')
  const [discipline, setDiscipline] = useState<MeetingDiscipline>('Other')
  const [notes, setNotes] = useState('')
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)
  const [template, setTemplate] = useState(() => loadSummaryTemplate())
  const [showTemplate, setShowTemplate] = useState(false)
  const [toast, setToast] = useState('')
  const [recording, setRecording] = useState(false)
  const [hadAudio, setHadAudio] = useState(false)
  const [lastId, setLastId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => clearTimeout(t)
  }, [toast])

  function flash(msg: string) {
    setToast(msg)
  }

  function startTimer() {
    if (running) return
    setRunning(true)
    if (!startedAt) setStartedAt(new Date().toISOString())
  }

  function openTogether() {
    const url = joinUrl.trim() || 'https://teams.microsoft.com/'
    window.open(url, 'prism_meeting_room', 'noopener,noreferrer')
    flash('Meeting room opened — keep this panel for agenda, notes, and summarize')
  }

  async function toggleAudio() {
    if (recording) {
      mediaRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setHadAudio(true)
        flash('Audio capture stopped (local only — paste transcript or use Scribe for text)')
      }
      mediaRef.current = rec
      rec.start()
      setRecording(true)
      flash('Recording audio locally — FERPA: no student PHI in shared spaces')
    } catch {
      flash('Microphone permission blocked — type notes or use Scribe instead')
    }
  }

  function addAgenda() {
    const label = draftItem.trim()
    if (!label) return
    setAgenda((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        label,
        discipline,
        done: false,
        needsReview: false,
      },
    ])
    setDraftItem('')
  }

  async function stopAndSummarize() {
    setRunning(false)
    if (recording) {
      mediaRef.current?.stop()
      setRecording(false)
    }
    const duration = formatDuration(seconds)
    const endedAt = new Date().toISOString()
    const start = startedAt || endedAt
    setBusy(true)
    setSummary('Generating summary…')

    const prompt = fillSummaryPrompt({
      template,
      title,
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      duration,
      provider: provider + (joinUrl ? ` · ${joinUrl}` : ''),
      agenda,
      notes:
        notes +
        (hadAudio || recording
          ? '\n\n[Local audio was captured during this session — incorporate any transcript the team pastes.]'
          : ''),
    })

    const res = await chat([
      {
        role: 'system',
        content:
          'You are a SPED meeting notes assistant for PRISM. Follow the user template structure. Be concise and professional.',
      },
      { role: 'user', content: prompt },
    ])

    let text = res.content?.trim() || ''
    if (!text || res.error) {
      text = `Meeting ended at ${duration}. Duration recorded.\n\nAgenda:\n${agenda
        .map((a) => `- ${a.discipline}: ${a.label}${a.done ? ' (done)' : ''}`)
        .join('\n')}\n\nNotes:\n${notes || '(none)'}\n\n${
        res.error
          ? `(AI unavailable: ${res.error}) Write summary notes manually, then Push to Evals.`
          : 'Please refine summary notes manually.'
      }`
    }
    setSummary(text)
    setBusy(false)

    const record: MeetingSummaryRecord = {
      id: `ms-${Date.now()}`,
      title,
      duration,
      startedAt: start,
      endedAt,
      agenda,
      liveNotes: notes,
      summary: text,
      joinUrl: joinUrl || undefined,
      provider,
      pushedToEvals: false,
      hadAudioCapture: hadAudio,
    }
    upsertMeetingSummary(record)
    setLastId(record.id)
    flash('Summary saved')
  }

  function pushToEvals() {
    if (!lastId && !summary) {
      flash('Stop & Summarize first')
      return
    }
    if (lastId) markSummaryPushedToEvals(lastId)
    else {
      const record: MeetingSummaryRecord = {
        id: `ms-${Date.now()}`,
        title,
        duration: formatDuration(seconds),
        startedAt: startedAt || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        agenda,
        liveNotes: notes,
        summary,
        joinUrl: joinUrl || undefined,
        provider,
        pushedToEvals: true,
        hadAudioCapture: hadAudio,
      }
      upsertMeetingSummary(record)
      setLastId(record.id)
    }
    flash('Pushed to Evaluations · Meeting summaries')
  }

  function saveTemplate() {
    saveSummaryTemplate(template)
    flash('Summary template saved')
  }

  async function onTemplateFile(file: File | null) {
    if (!file) return
    const text = await file.text()
    if (!text.trim()) {
      flash('Empty file')
      return
    }
    setTemplate(text)
    saveSummaryTemplate(text)
    setShowTemplate(true)
    flash(`Loaded template: ${file.name}`)
  }

  function copySummary() {
    if (!summary) return
    void navigator.clipboard.writeText(summary)
    flash('Summary copied')
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close meeting session"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Recordable team meeting"
        className="relative z-[1201] flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-xl sm:mx-4 sm:rounded-2xl"
      >
        <div className="shrink-0 px-4 pb-3 pt-4 text-white" style={{ background: '#1E3A5F' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-3 w-3 shrink-0 rounded-full bg-red-500 ${running || recording ? 'animate-pulse' : ''}`}
              />
              <div className="min-w-0">
                <h2 className="font-heading text-sm font-bold">Recordable team meeting</h2>
                <input
                  className="mt-1 w-full max-w-md rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white placeholder:text-white/50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-label="Meeting title"
                />
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-lg leading-none text-white/90 hover:bg-white/10"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-4xl font-bold tracking-wide">
            {formatDuration(seconds)}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {toast && (
            <p className="rounded-lg tint-mint px-3 py-2 text-[11px] font-semibold">{toast}</p>
          )}

          <section className="rounded-xl border border-[var(--border)] tint-lav p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold">Together in the meeting</h3>
                <p className="text-[10px] text-[var(--subtext)]">
                  Teams/Zoom open beside this dashboard — agenda, notes, and summarize stay here
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-[#6264A7] px-3 py-2 text-[11px] font-semibold text-white"
                  onClick={openTogether}
                >
                  Open Teams / Zoom room
                </button>
                {joinUrl ? (
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] font-semibold"
                    onClick={() => openJoinUrl(joinUrl)}
                  >
                    Join link
                  </button>
                ) : null}
              </div>
            </div>
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-2 text-xs"
              placeholder="Paste Teams / Zoom join URL for this session"
              value={joinUrl}
              onChange={(e) => setJoinUrl(e.target.value)}
            />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold">Live agenda</h3>
            <ul className="space-y-1.5">
              {agenda.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center gap-2 rounded-lg px-2 py-2 ${DISCIPLINE_CLASS[item.discipline]}`}
                >
                  <span className="rounded-full bg-[var(--card-bg)] px-2 py-0.5 text-[10px] font-bold">
                    {item.discipline}
                  </span>
                  <span className="min-w-0 flex-1 text-xs">{item.label}</span>
                  <label className="flex items-center gap-1 text-[10px]">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        setAgenda((prev) =>
                          prev.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x)),
                        )
                      }
                    />
                    Done
                  </label>
                  <label className="flex items-center gap-1 text-[10px]">
                    <input
                      type="checkbox"
                      checked={item.needsReview}
                      onChange={() =>
                        setAgenda((prev) =>
                          prev.map((x) =>
                            x.id === item.id ? { ...x, needsReview: !x.needsReview } : x,
                          ),
                        )
                      }
                    />
                    Review
                  </label>
                  <button
                    type="button"
                    className="text-[10px] text-red-600"
                    onClick={() => setAgenda((prev) => prev.filter((x) => x.id !== item.id))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as MeetingDiscipline)}
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                className="min-w-0 flex-1 rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
                placeholder="Add agenda item…"
                value={draftItem}
                onChange={(e) => setDraftItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addAgenda()
                }}
              />
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
                onClick={addAgenda}
              >
                Add
              </button>
            </div>
          </section>

          <section>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold">Live notes / transcript paste</h3>
              <button
                type="button"
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${
                  recording
                    ? 'bg-red-600 text-white'
                    : 'border border-[var(--border)] text-[var(--text)]'
                }`}
                onClick={() => void toggleAudio()}
              >
                {recording ? '● Stop mic capture' : '🎙 Record audio (local)'}
              </button>
            </div>
            <textarea
              className="min-h-[7rem] w-full rounded-xl border border-[var(--border)] px-3 py-2 text-xs"
              placeholder="Type decisions, date changes, parent contacts… or paste Scribe / Teams transcript here"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-[var(--subtext)]">
              Audio stays on this device. Use Scribe or paste Teams transcript for text summary.
            </p>
          </section>

          <section>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="text-[10px] font-semibold text-[var(--accent)]"
                onClick={() => setShowTemplate((v) => !v)}
              >
                {showTemplate ? 'Hide' : 'Show'} summarize template
              </button>
              <label className="cursor-pointer text-[10px] font-semibold text-[var(--accent)]">
                Upload template…
                <input
                  type="file"
                  accept=".txt,.md,text/plain"
                  className="hidden"
                  onChange={(e) => void onTemplateFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {showTemplate && (
              <div className="space-y-2">
                <textarea
                  className="min-h-[8rem] w-full rounded-xl border border-[var(--border)] px-3 py-2 font-mono text-[10px]"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[10px] font-semibold"
                  onClick={saveTemplate}
                >
                  Save template
                </button>
              </div>
            )}
          </section>

          {summary ? (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--slate)] p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold">Meeting summary</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-[10px] font-semibold text-[var(--accent)]"
                    onClick={copySummary}
                  >
                    Copy
                  </button>
                  <Link
                    to="/evaluations"
                    className="text-[10px] font-semibold text-[var(--accent)]"
                    onClick={onClose}
                  >
                    Open Evals →
                  </Link>
                </div>
              </div>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px]">{summary}</pre>
            </section>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--border)] bg-[var(--card-bg)] p-3">
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white"
            onClick={startTimer}
            disabled={running}
          >
            ▶ Start
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-xs font-semibold"
            onClick={() => void stopAndSummarize()}
            disabled={busy}
          >
            {busy ? 'Summarizing…' : '■ Stop & Summarize'}
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-xs font-semibold"
            onClick={pushToEvals}
            disabled={!summary}
          >
            Push to Evals
          </button>
        </div>
      </div>
    </div>
  )
}

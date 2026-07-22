import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMeetingSession } from '../../lib/meeting-session/meeting-session-context'
import {
  PROVIDER_LABEL,
  detectProvider,
  loadTeamsHomeUrl,
  loadVirtualMeetings,
  normalizeJoinUrl,
  openJoinUrl,
  saveTeamsHomeUrl,
  saveVirtualMeetings,
  sortForDashboard,
  type MeetingProvider,
  type VirtualMeeting,
} from '../../lib/virtual-meetings/store'

const LIST_MAX_H = 'max-h-[13.5rem]'

const PROVIDER_TINT: Record<MeetingProvider, string> = {
  teams: 'tint-lav',
  zoom: 'tint-sky',
  meet: 'tint-mint',
  other: 'tint-sun',
}

function todayIso() {
  const n = new Date()
  return new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function formatWhen(m: VirtualMeeting) {
  try {
    const d = new Date(`${m.date}T12:00:00`)
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return m.time ? `${day} · ${m.time}` : day
  } catch {
    return m.date
  }
}

export function VirtualMeetingsPanel() {
  const { openMeetingSession } = useMeetingSession()
  const [meetings, setMeetings] = useState<VirtualMeeting[]>(() => loadVirtualMeetings())
  const [teamsHome, setTeamsHome] = useState(() => loadTeamsHomeUrl())
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayIso)
  const [time, setTime] = useState('09:00')
  const [joinUrl, setJoinUrl] = useState('')
  const [studentName, setStudentName] = useState('')
  const [error, setError] = useState('')

  const sorted = useMemo(() => sortForDashboard(meetings), [meetings])

  function persist(next: VirtualMeeting[]) {
    setMeetings(next)
    saveVirtualMeetings(next)
  }

  function resetForm() {
    setTitle('')
    setDate(todayIso())
    setTime('09:00')
    setJoinUrl('')
    setStudentName('')
    setError('')
    setAdding(false)
  }

  function addMeeting() {
    const href = normalizeJoinUrl(joinUrl)
    if (!href) {
      setError('Paste a valid Teams, Zoom, or Meet join link.')
      return
    }
    const provider = detectProvider(href)
    const label = title.trim() || `${PROVIDER_LABEL[provider]} meeting`
    const item: VirtualMeeting = {
      id: `vm-${Date.now()}`,
      title: label,
      date: date || todayIso(),
      time: time || '',
      provider,
      joinUrl: href,
      studentName: studentName.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    persist([item, ...meetings])
    resetForm()
  }

  function saveHome() {
    saveTeamsHomeUrl(teamsHome)
  }

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
      style={{ borderTop: '4px solid #6264A7' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-bold">Virtual meetings</h2>
          <p className="text-[10px] text-[var(--subtext)]">
            Jump into Teams / Zoom / Meet — paste join links until Graph calendar sync
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-[#1E3A5F] px-2.5 py-1.5 text-[10px] font-semibold text-white"
            onClick={() =>
              openMeetingSession({
                title: 'Team meeting',
                joinUrl: teamsHome,
                provider: 'Teams',
              })
            }
          >
            ⏱ Record meeting
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#6264A7] px-2.5 py-1.5 text-[10px] font-semibold text-white"
            onClick={() => openJoinUrl(teamsHome || 'https://teams.microsoft.com/')}
          >
            Open Teams
          </button>
          <Link to="/meeting-prep" className="text-[10px] font-semibold text-[var(--accent)] self-center">
            Meeting Prep →
          </Link>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <input
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-[10px]"
          value={teamsHome}
          onChange={(e) => setTeamsHome(e.target.value)}
          onBlur={saveHome}
          placeholder="https://teams.microsoft.com/…"
          aria-label="Default Teams home or channel link"
        />
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-[10px] font-semibold"
          onClick={saveHome}
        >
          Save
        </button>
      </div>

      <ul className={`mt-3 space-y-1.5 overflow-y-auto pr-1 ${LIST_MAX_H}`}>
        {!sorted.length && !adding && (
          <li className="rounded-xl tint-lav px-3 py-3 text-[11px] text-[var(--subtext)]">
            No virtual meetings yet. Add a Teams or Zoom join link for today&apos;s IEPs and staff
            huddles.
          </li>
        )}
        {sorted.map((m) => (
          <li
            key={m.id}
            className={`flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] px-2.5 py-2 ${PROVIDER_TINT[m.provider]}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-[var(--text)]">{m.title}</p>
              <p className="text-[10px] text-[var(--subtext)]">
                <span className="font-bold">{PROVIDER_LABEL[m.provider]}</span>
                {' · '}
                {formatWhen(m)}
                {m.studentName ? ` · ${m.studentName}` : ''}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-[10px] font-bold text-white"
              onClick={() => openJoinUrl(m.joinUrl)}
            >
              Join
            </button>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2.5 py-1.5 text-[10px] font-bold"
              onClick={() =>
                openMeetingSession({
                  title: m.title,
                  joinUrl: m.joinUrl,
                  provider: PROVIDER_LABEL[m.provider],
                })
              }
            >
              Record
            </button>
            <button
              type="button"
              className="shrink-0 text-[10px] text-red-600"
              aria-label={`Remove ${m.title}`}
              onClick={() => persist(meetings.filter((x) => x.id !== m.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--slate)] p-3">
          <input
            className="w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            placeholder="Meeting title (e.g. Annual IEP — virtual)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <input
            className="w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            placeholder="Paste Teams / Zoom / Meet join URL"
            value={joinUrl}
            onChange={(e) => setJoinUrl(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            placeholder="Student / topic (optional)"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          {error && <p className="text-[10px] font-semibold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
              onClick={addMeeting}
            >
              Save meeting
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-dashed border-[var(--border)] px-3 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]"
          onClick={() => setAdding(true)}
        >
          + Add Teams / Zoom meeting
        </button>
      )}
    </section>
  )
}

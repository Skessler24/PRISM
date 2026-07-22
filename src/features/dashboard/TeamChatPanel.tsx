import { useEffect, useRef, useState } from 'react'
import {
  createChannel,
  createInvite,
  loadTeamChat,
  messagesForChannel,
  openDistrictMessenger,
  postMessage,
  redeemInvite,
  saveTeamChat,
  setActiveChannel,
  setChatMode,
  setDisplayName,
  setTeamsDeepLink,
  subscribeTeamChat,
  type TeamChatState,
} from '../../lib/team-chat/store'
import { joinCloudRoom, listCloudRoom, postCloudMessage } from '../../lib/team-chat/cloud'

const DOCK_KEY = 'prism_team_chat_dock_open_v1'

function readDockOpen(): boolean {
  try {
    return localStorage.getItem(DOCK_KEY) === '1'
  } catch {
    return false
  }
}

function writeDockOpen(open: boolean) {
  try {
    localStorage.setItem(DOCK_KEY, open ? '1' : '0')
  } catch {
    /* ignore */
  }
}

/** Floating Team Chat — minimized FAB + expandable pop-out (not a full dashboard card). */
export function TeamChatDock() {
  const [open, setOpen] = useState(() => readDockOpen())
  const [state, setState] = useState<TeamChatState>(() => loadTeamChat())
  const [draft, setDraft] = useState('')
  const [channelName, setChannelName] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [roomCode, setRoomCode] = useState(() => state.invites[0]?.code || '')
  const [cloudStatus, setCloudStatus] = useState<'off' | 'live' | 'offline'>('off')
  const [toast, setToast] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return subscribeTeamChat(() => setState(loadTeamChat()))
  }, [])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.activeChannelId, open])

  useEffect(() => {
    if (state.mode !== 'prism' || !roomCode.trim() || !open) return
    let cancelled = false
    async function tick() {
      const res = await listCloudRoom(roomCode.trim().toUpperCase())
      if (cancelled) return
      if (!res.ok) {
        setCloudStatus('offline')
        return
      }
      setCloudStatus('live')
      const local = loadTeamChat()
      const byId = new Map(local.messages.map((m) => [m.id, m]))
      for (const m of res.room.messages) byId.set(m.id, m)
      const merged = {
        ...local,
        messages: [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-500),
        channels: res.room.channels.length ? res.room.channels : local.channels,
        members: res.room.members.length
          ? res.room.members.map((m) => ({
              id: m.id,
              displayName: m.displayName,
              role: (m.role === 'owner' ? 'owner' : 'member') as 'owner' | 'member',
              joinedAt: m.joinedAt,
            }))
          : local.members,
      }
      saveTeamChat(merged)
      setState(merged)
    }
    void tick()
    const id = window.setInterval(() => void tick(), 8000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [state.mode, roomCode, open])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function refresh(next: TeamChatState) {
    setState(next)
  }

  function setDock(next: boolean) {
    setOpen(next)
    writeDockOpen(next)
  }

  const messages = messagesForChannel(state, state.activeChannelId)
  const unreadHint = messages.length

  async function send() {
    if (!draft.trim()) return
    const next = postMessage(state, draft)
    refresh(next)
    const msg = next.messages[next.messages.length - 1]
    setDraft('')
    if (roomCode.trim() && msg) {
      const res = await postCloudMessage(roomCode.trim().toUpperCase(), state.me.id, state.me.displayName, msg)
      setCloudStatus(res.ok ? 'live' : 'offline')
    }
  }

  async function connectCloud() {
    const code = (roomCode || state.invites[0]?.code || '').trim().toUpperCase()
    if (!code) {
      flash('Create an invite code first (used as room code)')
      return
    }
    setRoomCode(code)
    const res = await joinCloudRoom(code, state.me.id, state.me.displayName)
    if (!res.ok) {
      setCloudStatus('offline')
      flash(res.error)
      return
    }
    setCloudStatus('live')
    flash(`Cloud room ${code} connected`)
  }

  return (
    <div className="pointer-events-none fixed bottom-[calc(2.75rem+env(safe-area-inset-bottom,0px))] right-3 z-[950] flex flex-col items-end gap-2 md:right-4">
      {open && (
        <section
          className="pointer-events-auto flex max-h-[min(70vh,32rem)] w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-xl"
          style={{ borderTop: '4px solid var(--accent)' }}
          role="dialog"
          aria-label="Team Chat"
        >
          <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--lav)] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">💬 Team Chat</p>
              <p className="truncate text-[10px] text-[var(--subtext)]">
                {state.mode === 'prism' ? 'PRISM channels' : 'Teams'} ·{' '}
                {cloudStatus === 'live' ? 'cloud live' : cloudStatus === 'offline' ? 'local' : 'idle'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="flex rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-0.5 text-[9px] font-bold">
                <button
                  type="button"
                  className={`rounded-md px-1.5 py-0.5 ${
                    state.mode === 'prism' ? 'bg-[var(--accent)] text-white' : 'text-[var(--subtext)]'
                  }`}
                  onClick={() => refresh(setChatMode(state, 'prism'))}
                >
                  PRISM
                </button>
                <button
                  type="button"
                  className={`rounded-md px-1.5 py-0.5 ${
                    state.mode === 'teams' ? 'bg-[var(--accent)] text-white' : 'text-[var(--subtext)]'
                  }`}
                  onClick={() => refresh(setChatMode(state, 'teams'))}
                >
                  Teams
                </button>
              </div>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-xs font-bold"
                aria-label="Minimize Team Chat"
                onClick={() => setDock(false)}
              >
                —
              </button>
            </div>
          </header>

          {toast && (
            <div className="bg-[var(--accent)] px-2 py-1 text-[10px] font-semibold text-white">{toast}</div>
          )}

          <p className="border-b border-[var(--border)] bg-[var(--sun)] px-2 py-1 text-[9px] text-[var(--text)]">
            FERPA: no student names, IDs, or PHI in chat.
          </p>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {state.mode === 'teams' ? (
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold">
                  Teams / messenger link
                  <input
                    className="mt-0.5 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-[10px]"
                    value={state.teamsDeepLink}
                    onChange={(e) => refresh(setTeamsDeepLink(state, e.target.value))}
                    placeholder="https://teams.microsoft.com/…"
                  />
                </label>
                <button
                  type="button"
                  className="w-full rounded-lg bg-[#5059C9] px-2 py-2 text-[10px] font-semibold text-white"
                  onClick={() => {
                    openDistrictMessenger(state)
                    flash('Opened district messenger')
                  }}
                >
                  Open Teams
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 overflow-x-auto">
                  {state.channels.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                        c.id === state.activeChannelId
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--slate)] text-[var(--text)]'
                      }`}
                      onClick={() => refresh(setActiveChannel(state, c.id))}
                    >
                      #{c.name}
                    </button>
                  ))}
                </div>
                <div className="flex min-h-[10rem] flex-col rounded-xl border border-[var(--border)] bg-[var(--slate)]">
                  <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
                    {messages.map((m) => (
                      <div key={m.id} className="text-[11px]">
                        <span className="font-bold text-[var(--accent)]">{m.authorName}</span>{' '}
                        <span className="text-[9px] text-[var(--subtext)]">
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </span>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                  <div className="flex gap-1 border-t border-[var(--border)] p-1.5">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-[11px]"
                      placeholder="Message (no PHI)…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void send()
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-[10px] font-semibold text-white"
                      onClick={() => void send()}
                    >
                      Send
                    </button>
                  </div>
                </div>
                <details className="rounded-lg border border-[var(--border)] bg-[var(--mint)]/40 px-2 py-1">
                  <summary className="cursor-pointer text-[10px] font-bold">Channels & invites</summary>
                  <div className="mt-2 space-y-2 pb-1">
                    <div className="flex gap-1">
                      <input
                        className="min-w-0 flex-1 rounded border border-[var(--border)] px-1 py-1 text-[10px]"
                        placeholder="new-channel"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                      />
                      <button
                        type="button"
                        className="rounded border border-[var(--border)] px-2 text-[10px] font-bold"
                        onClick={() => {
                          refresh(createChannel(state, channelName))
                          setChannelName('')
                          flash('Channel created')
                        }}
                      >
                        +
                      </button>
                    </div>
                    <label className="block text-[10px] font-semibold">
                      Display name
                      <input
                        className="mt-0.5 w-full rounded border border-[var(--border)] px-1 py-1 text-[10px]"
                        value={state.me.displayName}
                        onChange={(e) => refresh(setDisplayName(state, e.target.value))}
                      />
                    </label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-[9px] font-semibold"
                        onClick={() => {
                          const next = createInvite(state)
                          refresh(next)
                          const code = next.invites[0]?.code
                          if (code) {
                            setRoomCode(code)
                            void navigator.clipboard.writeText(code)
                            flash(`Invite ${code} copied`)
                          }
                        }}
                      >
                        Invite code
                      </button>
                      <button
                        type="button"
                        className="rounded border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1 text-[9px] font-semibold"
                        onClick={() => void connectCloud()}
                      >
                        Cloud room
                      </button>
                    </div>
                    <input
                      className="w-full rounded border border-[var(--border)] px-1 py-1 font-mono text-[10px]"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="Room code"
                    />
                    <div className="flex gap-1">
                      <input
                        className="min-w-0 flex-1 rounded border border-[var(--border)] px-1 py-1 font-mono text-[10px]"
                        placeholder="Join invite…"
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="rounded border border-[var(--border)] px-2 text-[10px] font-bold"
                        onClick={() => {
                          refresh(redeemInvite(state, inviteInput, state.me.displayName))
                          setInviteInput('')
                          flash('Joined')
                        }}
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        className="pointer-events-auto relative flex h-14 w-14 touch-manipulation items-center justify-center rounded-full text-2xl text-white shadow-lg transition hover:brightness-110"
        style={{ background: 'var(--accent)' }}
        aria-label={open ? 'Minimize Team Chat' : 'Open Team Chat'}
        aria-expanded={open}
        onClick={() => setDock(!open)}
      >
        {open ? '×' : '💬'}
        {!open && unreadHint > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--coral)] px-1 text-[9px] font-bold text-[var(--text)] ring-2 ring-[var(--card-bg)]">
            {Math.min(unreadHint, 99)}
          </span>
        )}
      </button>
    </div>
  )
}

/** @deprecated Use TeamChatDock — kept name alias for imports. */
export const TeamChatPanel = TeamChatDock

import { useEffect, useRef, useState } from 'react'
import {
  createChannel,
  createInvite,
  loadTeamChat,
  messagesForChannel,
  openDistrictMessenger,
  postMessage,
  redeemInvite,
  setActiveChannel,
  setChatMode,
  setDisplayName,
  setTeamsDeepLink,
  subscribeTeamChat,
  type TeamChatState,
} from '../../lib/team-chat/store'

export function TeamChatPanel() {
  const [state, setState] = useState<TeamChatState>(() => loadTeamChat())
  const [draft, setDraft] = useState('')
  const [channelName, setChannelName] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [toast, setToast] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return subscribeTeamChat(() => setState(loadTeamChat()))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.activeChannelId])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  function refresh(next: TeamChatState) {
    setState(next)
  }

  const messages = messagesForChannel(state, state.activeChannelId)
  const active = state.channels.find((c) => c.id === state.activeChannelId)

  function send() {
    if (!draft.trim()) return
    refresh(postMessage(state, draft))
    setDraft('')
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-bold">💬 Team Chat</h2>
          <p className="mt-0.5 text-[10px] text-[var(--subtext)]">
            {state.teamName} · invite-only ·{' '}
            {state.mode === 'prism' ? 'PRISM channels (local live)' : 'District Teams / approved messenger'}
          </p>
        </div>
        <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-[10px] font-bold">
          <button
            type="button"
            className={`rounded-md px-2 py-1 ${
              state.mode === 'prism' ? 'bg-[var(--accent)] text-white' : 'text-[var(--subtext)]'
            }`}
            onClick={() => refresh(setChatMode(state, 'prism'))}
          >
            PRISM
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 ${
              state.mode === 'teams' ? 'bg-[var(--accent)] text-white' : 'text-[var(--subtext)]'
            }`}
            onClick={() => refresh(setChatMode(state, 'teams'))}
          >
            Teams
          </button>
        </div>
      </div>

      {toast && (
        <div className="mt-2 rounded-lg bg-[var(--accent)] px-2 py-1 text-[10px] font-semibold text-white">
          {toast}
        </div>
      )}

      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-950">
        FERPA: no student names, IDs, or PHI in chat. Use Enrich / SoR for official records.
      </p>

      {state.mode === 'teams' ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-[var(--subtext)]">
            District-approved path: open Microsoft Teams (or your district messenger). Full Graph Chat
            sync lands after Azure AD / MSAL is wired — same pattern as OneDrive storage.
          </p>
          <label className="block text-xs font-semibold">
            Teams / messenger link
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
              value={state.teamsDeepLink}
              onChange={(e) => refresh(setTeamsDeepLink(state, e.target.value))}
              placeholder="https://teams.microsoft.com/l/channel/..."
            />
          </label>
          <button
            type="button"
            className="rounded-lg bg-[#5059C9] px-3 py-2 text-xs font-semibold text-white"
            onClick={() => {
              openDistrictMessenger(state)
              flash('Opened district messenger')
            }}
          >
            Open Teams / approved chat
          </button>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 lg:grid-cols-[9rem_1fr]">
          <aside className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--subtext)]">
              Channels
            </p>
            <ul className="space-y-1">
              {state.channels.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold ${
                      c.id === state.activeChannelId
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--slate)] text-[var(--text)]'
                    }`}
                    onClick={() => refresh(setActiveChannel(state, c.id))}
                  >
                    # {c.name}
                  </button>
                </li>
              ))}
            </ul>
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

            <p className="pt-2 text-[10px] font-bold uppercase tracking-wide text-[var(--subtext)]">
              Members ({state.members.length})
            </p>
            <ul className="max-h-24 space-y-0.5 overflow-auto text-[10px]">
              {state.members.map((m) => (
                <li key={m.id}>
                  {m.displayName}{' '}
                  <span className="text-[var(--subtext)]">· {m.role}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex min-h-[16rem] flex-col rounded-xl border border-[var(--border)] bg-[var(--slate)]">
            <div className="border-b border-[var(--border)] px-3 py-2">
              <p className="text-xs font-bold">#{active?.name || 'channel'}</p>
              <p className="text-[10px] text-[var(--subtext)]">{active?.description}</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((m) => (
                <div key={m.id} className="text-xs">
                  <span className="font-bold text-[var(--accent)]">{m.authorName}</span>{' '}
                  <span className="text-[10px] text-[var(--subtext)]">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </span>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2 border-t border-[var(--border)] p-2">
              <input
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-2 text-xs"
                placeholder="Message #channel (no PHI)…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
              />
              <button
                type="button"
                className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                onClick={send}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 md:grid-cols-2">
        <label className="text-xs font-semibold">
          Your display name
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            value={state.me.displayName}
            onChange={(e) => refresh(setDisplayName(state, e.target.value))}
          />
        </label>
        <div className="text-xs">
          <p className="font-semibold">Invites</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-[10px] font-semibold"
              onClick={() => {
                const next = createInvite(state)
                refresh(next)
                const code = next.invites[0]?.code
                if (code) {
                  void navigator.clipboard.writeText(code)
                  flash(`Invite ${code} copied`)
                }
              }}
            >
              Create + copy invite code
            </button>
          </div>
          {state.invites[0] && (
            <p className="mt-1 font-mono text-[10px] text-[var(--subtext)]">
              Latest: {state.invites[0].code} · used {state.invites[0].uses}/
              {state.invites[0].maxUses}
            </p>
          )}
          <div className="mt-2 flex gap-1">
            <input
              className="min-w-0 flex-1 rounded border border-[var(--border)] px-2 py-1 text-[10px] font-mono"
              placeholder="ABCD-EFGH"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
            />
            <button
              type="button"
              className="rounded border border-[var(--border)] px-2 text-[10px] font-bold"
              onClick={() => {
                refresh(redeemInvite(state, inviteInput, state.me.displayName))
                setInviteInput('')
                flash('Joined via invite')
              }}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

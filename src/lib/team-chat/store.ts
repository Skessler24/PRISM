/** PRISM Team Chat — invite-only channels. Browser-local live sync via BroadcastChannel.
 *  District Teams mode is a connector stub until Graph Chat / approved messaging is wired.
 *  FERPA: do not paste student PHI into chat.
 */

export type ChatMode = 'prism' | 'teams'

export type ChatMember = {
  id: string
  displayName: string
  role: 'owner' | 'member'
  joinedAt: string
}

export type ChatInvite = {
  code: string
  createdBy: string
  createdAt: string
  expiresAt: string | null
  maxUses: number
  uses: number
}

export type ChatChannel = {
  id: string
  name: string
  description: string
  createdAt: string
  createdBy: string
}

export type ChatMessage = {
  id: string
  channelId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

export type TeamChatState = {
  teamName: string
  mode: ChatMode
  me: ChatMember
  members: ChatMember[]
  invites: ChatInvite[]
  channels: ChatChannel[]
  messages: ChatMessage[]
  activeChannelId: string
  teamsDeepLink: string
  updatedAt: string
}

const KEY = 'prism_team_chat_v1'
const CHANNEL = 'prism-team-chat-live'

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function inviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `${out.slice(0, 4)}-${out.slice(4)}`
}

function defaultState(): TeamChatState {
  const meId = uid('user')
  const generalId = 'ch-general'
  const me: ChatMember = {
    id: meId,
    displayName: 'PRISM provider',
    role: 'owner',
    joinedAt: new Date().toISOString(),
  }
  return {
    teamName: 'School SPED / ARR Team',
    mode: 'prism',
    me,
    members: [me],
    invites: [],
    channels: [
      {
        id: generalId,
        name: 'general',
        description: 'Team updates, coverage, and logistics (no PHI)',
        createdAt: new Date().toISOString(),
        createdBy: meId,
      },
      {
        id: 'ch-coverage',
        name: 'coverage',
        description: 'Sub / coverage swaps',
        createdAt: new Date().toISOString(),
        createdBy: meId,
      },
    ],
    messages: [
      {
        id: uid('msg'),
        channelId: generalId,
        authorId: 'system',
        authorName: 'PRISM',
        body: 'Welcome to Team Chat. Invite colleagues with a code, or switch to Teams when your district approves Graph/Teams messaging. Never paste student names or PHI here.',
        createdAt: new Date().toISOString(),
      },
    ],
    activeChannelId: generalId,
    teamsDeepLink: 'https://teams.microsoft.com/',
    updatedAt: new Date().toISOString(),
  }
}

function read(): TeamChatState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as TeamChatState
    if (!parsed?.me?.id || !Array.isArray(parsed.channels)) return defaultState()
    return parsed
  } catch {
    return defaultState()
  }
}

function write(state: TeamChatState) {
  const next = { ...state, updatedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(next))
  try {
    const bc = new BroadcastChannel(CHANNEL)
    bc.postMessage({ type: 'chat-updated', at: Date.now() })
    bc.close()
  } catch {
    /* ignore */
  }
  return next
}

export function loadTeamChat(): TeamChatState {
  return read()
}

export function saveTeamChat(state: TeamChatState) {
  return write(state)
}

export function subscribeTeamChat(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange()
  }
  window.addEventListener('storage', onStorage)
  let bc: BroadcastChannel | null = null
  try {
    bc = new BroadcastChannel(CHANNEL)
    bc.onmessage = () => onChange()
  } catch {
    bc = null
  }
  return () => {
    window.removeEventListener('storage', onStorage)
    bc?.close()
  }
}

export function setDisplayName(state: TeamChatState, displayName: string): TeamChatState {
  const name = displayName.trim() || state.me.displayName
  const me = { ...state.me, displayName: name }
  const members = state.members.map((m) => (m.id === me.id ? me : m))
  return write({ ...state, me, members })
}

export function setChatMode(state: TeamChatState, mode: ChatMode): TeamChatState {
  return write({ ...state, mode })
}

export function setTeamsDeepLink(state: TeamChatState, url: string): TeamChatState {
  return write({ ...state, teamsDeepLink: url.trim() || state.teamsDeepLink })
}

export function setActiveChannel(state: TeamChatState, channelId: string): TeamChatState {
  return write({ ...state, activeChannelId: channelId })
}

export function createChannel(
  state: TeamChatState,
  name: string,
  description = '',
): TeamChatState {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
  if (!cleaned) return state
  if (state.channels.some((c) => c.name === cleaned)) return state
  const channel: ChatChannel = {
    id: uid('ch'),
    name: cleaned,
    description: description.trim() || 'Team channel',
    createdAt: new Date().toISOString(),
    createdBy: state.me.id,
  }
  return write({
    ...state,
    channels: [...state.channels, channel],
    activeChannelId: channel.id,
  })
}

export function postMessage(state: TeamChatState, body: string): TeamChatState {
  const text = body.trim()
  if (!text) return state
  const msg: ChatMessage = {
    id: uid('msg'),
    channelId: state.activeChannelId,
    authorId: state.me.id,
    authorName: state.me.displayName,
    body: text,
    createdAt: new Date().toISOString(),
  }
  return write({
    ...state,
    messages: [...state.messages, msg].slice(-500),
  })
}

export function createInvite(state: TeamChatState): TeamChatState {
  const invite: ChatInvite = {
    code: inviteCode(),
    createdBy: state.me.id,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    maxUses: 25,
    uses: 0,
  }
  return write({ ...state, invites: [invite, ...state.invites].slice(0, 20) })
}

/** Join via invite code — adds this browser identity as a member (demo / local team). */
export function redeemInvite(state: TeamChatState, code: string, displayName?: string): TeamChatState {
  const normalized = code.trim().toUpperCase()
  const invite = state.invites.find((i) => i.code === normalized)
  if (!invite) {
    // Allow redeeming a code created on another device once cloud sync exists;
    // for local demo, still add a member tag if code looks valid.
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) return state
  }
  if (invite && invite.uses >= invite.maxUses) return state

  const name = (displayName || state.me.displayName).trim() || 'Invited member'
  const already = state.members.find((m) => m.id === state.me.id)
  let members = state.members
  let me = state.me
  if (!already) {
    me = {
      id: state.me.id,
      displayName: name,
      role: 'member',
      joinedAt: new Date().toISOString(),
    }
    members = [...members, me]
  } else {
    me = { ...already, displayName: name }
    members = members.map((m) => (m.id === me.id ? me : m))
  }

  const invites = state.invites.map((i) =>
    i.code === normalized ? { ...i, uses: i.uses + 1 } : i,
  )

  const msg: ChatMessage = {
    id: uid('msg'),
    channelId: state.activeChannelId || state.channels[0]?.id,
    authorId: 'system',
    authorName: 'PRISM',
    body: `${name} joined the team via invite.`,
    createdAt: new Date().toISOString(),
  }

  return write({
    ...state,
    me,
    members,
    invites,
    messages: [...state.messages, msg].slice(-500),
  })
}

export function messagesForChannel(state: TeamChatState, channelId: string): ChatMessage[] {
  return state.messages.filter((m) => m.channelId === channelId)
}

/** Open district Teams (or approved messenger) — stub until Graph Chat is wired. */
export function openDistrictMessenger(state: TeamChatState) {
  const url = state.teamsDeepLink || 'https://teams.microsoft.com/'
  window.open(url, '_blank', 'noopener,noreferrer')
}

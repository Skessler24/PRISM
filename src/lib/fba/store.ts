/** Persisted FBA sessions + live tally sync (BroadcastChannel + storage). */

export type AbcRow = {
  id: string
  date: string
  setting: string
  antecedent: string
  behavior: string
  consequence: string
  functionGuess: string
}

export type FbaTally = {
  id: string
  at: string
  delta: number
  note: string
  sessionStart: string
  goalLabel: string
}

export type FbaSession = {
  id: string
  studentId: string
  studentName: string
  targetBehavior: string
  abc: AbcRow[]
  functions: string[]
  tallies: FbaTally[]
  open: boolean
  fbaOut: string
  bipOut: string
  updatedAt: string
}

const KEY = 'prism_fba_sessions_v1'
const CHANNEL = 'prism-fba-live'

function read(): FbaSession[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FbaSession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function loadFbaSessions(): FbaSession[] {
  return read()
}

export function saveFbaSessions(list: FbaSession[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  try {
    const bc = new BroadcastChannel(CHANNEL)
    bc.postMessage({ type: 'fba-updated', at: Date.now() })
    bc.close()
  } catch {
    /* BroadcastChannel may be unavailable */
  }
}

export function getFbaSession(id: string): FbaSession | undefined {
  return read().find((s) => s.id === id)
}

export function upsertFbaSession(session: FbaSession) {
  const list = read().filter((s) => s.id !== session.id)
  saveFbaSessions([{ ...session, updatedAt: new Date().toISOString() }, ...list].slice(0, 40))
}

export function openFbaSessions(): FbaSession[] {
  return read().filter((s) => s.open)
}

/** Start or reopen an FBA session for a caseload student. */
export function startFbaForStudent(studentId: string, studentName: string): FbaSession {
  const existing = read().find((s) => s.studentId === studentId && s.open)
  if (existing) return existing
  const session: FbaSession = {
    id: `fba-${studentId || 'new'}-${Date.now()}`,
    studentId,
    studentName,
    targetBehavior: '',
    abc: [],
    functions: [],
    tallies: [],
    open: true,
    fbaOut: '',
    bipOut: '',
    updatedAt: new Date().toISOString(),
  }
  upsertFbaSession(session)
  return session
}

export function applyTally(
  sessionId: string,
  delta: number,
  meta?: { note?: string; goalLabel?: string; sessionStart?: string },
): FbaSession | null {
  const list = read()
  const idx = list.findIndex((s) => s.id === sessionId)
  if (idx < 0) return null
  const session = list[idx]
  const now = new Date()
  const tally: FbaTally = {
    id: `t-${now.getTime()}`,
    at: now.toISOString(),
    delta,
    note: meta?.note || (delta > 0 ? 'occurrence' : 'correction'),
    sessionStart: meta?.sessionStart || now.toISOString(),
    goalLabel: meta?.goalLabel || session.targetBehavior,
  }
  const abcRow: AbcRow = {
    id: `abc-${now.getTime()}`,
    date: now.toISOString().slice(0, 10),
    setting: 'Provider session (live tally)',
    antecedent: 'In session',
    behavior: `${session.targetBehavior} (${delta > 0 ? '+' : ''}${delta})`,
    consequence: 'Data recorded via PRISM tally pop-out',
    functionGuess: '',
  }
  const next: FbaSession = {
    ...session,
    open: true,
    tallies: [tally, ...session.tallies],
    abc: [abcRow, ...session.abc],
    updatedAt: now.toISOString(),
  }
  list[idx] = next
  saveFbaSessions(list)
  return next
}

export function tallyTotal(session: FbaSession): number {
  return session.tallies.reduce((sum, t) => sum + t.delta, 0)
}

export function subscribeFbaLive(onChange: () => void): () => void {
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

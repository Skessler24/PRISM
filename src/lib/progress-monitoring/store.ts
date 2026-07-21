/** ESGI-style progress monitoring — browser-only (FERPA). */

export type ProbeItem = {
  id: string
  prompt: string
  /** correct | incorrect | skipped */
  result?: 'correct' | 'incorrect' | 'skipped'
}

export type ProbeSession = {
  id: string
  studentId: string
  label: string
  date: string
  cadenceDays: number
  items: ProbeItem[]
  scorePercent: number
  notes: string
  createdAt: string
}

export type ExitTicket = {
  id: string
  studentId: string
  date: string
  prompt: string
  response: string
  mastered: boolean
  createdAt: string
}

export type ProgressAlert = {
  studentId: string
  studentName: string
  reason: string
  severity: 'due' | 'overdue' | 'ok'
  lastDate: string | null
  nextDue: string | null
}

const SESSIONS_KEY = 'prism_pm_sessions_v1'
const TICKETS_KEY = 'prism_exit_tickets_v1'
const LEGACY_PROBES_KEY = 'prism_progress_probes_v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return (JSON.parse(raw) as T) ?? fallback
  } catch {
    return fallback
  }
}

export function loadProbeSessions(): ProbeSession[] {
  const list = readJson<ProbeSession[]>(SESSIONS_KEY, [])
  return Array.isArray(list) ? list : []
}

export function saveProbeSessions(list: ProbeSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list))
}

export function loadExitTickets(): ExitTicket[] {
  const list = readJson<ExitTicket[]>(TICKETS_KEY, [])
  return Array.isArray(list) ? list : []
}

export function saveExitTickets(list: ExitTicket[]) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(list))
}

export function defaultProbeItems(goalLabel: string): ProbeItem[] {
  return [
    { id: 'i1', prompt: `${goalLabel} — trial 1` },
    { id: 'i2', prompt: `${goalLabel} — trial 2` },
    { id: 'i3', prompt: `${goalLabel} — trial 3` },
    { id: 'i4', prompt: `${goalLabel} — trial 4` },
    { id: 'i5', prompt: `${goalLabel} — trial 5` },
  ]
}

export function scoreItems(items: ProbeItem[]): number {
  const scored = items.filter((i) => i.result === 'correct' || i.result === 'incorrect')
  if (!scored.length) return 0
  const correct = scored.filter((i) => i.result === 'correct').length
  return Math.round((correct / scored.length) * 100)
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function buildProgressAlerts(
  students: { id: string; name: string; goals: string[] }[],
  sessions: ProbeSession[],
  today = new Date().toISOString().slice(0, 10),
): ProgressAlert[] {
  return students.map((s) => {
    const mine = sessions
      .filter((x) => x.studentId === s.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    const last = mine[0]
    if (!last) {
      return {
        studentId: s.id,
        studentName: s.name,
        reason: 'No probe yet — create a baseline session',
        severity: 'overdue',
        lastDate: null,
        nextDue: today,
      }
    }
    const nextDue = addDaysIso(last.date, last.cadenceDays || 14)
    const severity = nextDue < today ? 'overdue' : nextDue === today ? 'due' : 'ok'
    return {
      studentId: s.id,
      studentName: s.name,
      reason:
        severity === 'ok'
          ? `On track · next due ${nextDue}`
          : severity === 'due'
            ? `Progress monitor due today (${last.label})`
            : `Overdue since ${nextDue} · last ${last.date} (${last.scorePercent}%)`,
      severity,
      lastDate: last.date,
      nextDue,
    }
  })
}

/** Sync last score into legacy caseload probe bars. */
export function syncLegacyProbe(studentId: string, label: string, score: number) {
  type Legacy = { studentId: string; label: string; lastScore: number; scores: number[]; updatedAt: string }
  const list = readJson<Legacy[]>(LEGACY_PROBES_KEY, [])
  const existing = list.find((p) => p.studentId === studentId)
  const scores = [...(existing?.scores || []), score].slice(-8)
  const next: Legacy = {
    studentId,
    label,
    lastScore: score,
    scores,
    updatedAt: new Date().toISOString(),
  }
  const out = [...list.filter((p) => p.studentId !== studentId), next]
  localStorage.setItem(LEGACY_PROBES_KEY, JSON.stringify(out))
}

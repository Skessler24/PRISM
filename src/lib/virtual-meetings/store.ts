/** Dashboard virtual meetings — Teams / Zoom / Meet join links (browser-only until Graph calendar). */

export type MeetingProvider = 'teams' | 'zoom' | 'meet' | 'other'

export type VirtualMeeting = {
  id: string
  title: string
  /** ISO date YYYY-MM-DD */
  date: string
  /** HH:MM 24h local */
  time: string
  provider: MeetingProvider
  joinUrl: string
  /** Optional caseload context — initials only in UI */
  studentName?: string
  notes?: string
  createdAt: string
}

const KEY = 'prism_virtual_meetings_v1'
const DEFAULT_TEAMS_KEY = 'prism_virtual_meetings_teams_home_v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return (JSON.parse(raw) as T) ?? fallback
  } catch {
    return fallback
  }
}

export function detectProvider(url: string): MeetingProvider {
  const u = url.toLowerCase()
  if (u.includes('teams.microsoft.com') || u.includes('teams.live.com') || u.includes('microsoft.com/l/meetup')) {
    return 'teams'
  }
  if (u.includes('zoom.us') || u.includes('zoom.com')) return 'zoom'
  if (u.includes('meet.google.com')) return 'meet'
  return 'other'
}

export const PROVIDER_LABEL: Record<MeetingProvider, string> = {
  teams: 'Teams',
  zoom: 'Zoom',
  meet: 'Meet',
  other: 'Link',
}

export function loadVirtualMeetings(): VirtualMeeting[] {
  const list = readJson<VirtualMeeting[]>(KEY, [])
  return Array.isArray(list) ? list : []
}

export function saveVirtualMeetings(list: VirtualMeeting[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function loadTeamsHomeUrl(): string {
  return localStorage.getItem(DEFAULT_TEAMS_KEY)?.trim() || 'https://teams.microsoft.com/'
}

export function saveTeamsHomeUrl(url: string) {
  localStorage.setItem(DEFAULT_TEAMS_KEY, url.trim() || 'https://teams.microsoft.com/')
}

export function meetingSortKey(m: VirtualMeeting): number {
  const t = m.time?.trim() || '00:00'
  return new Date(`${m.date}T${t.length === 5 ? `${t}:00` : t}`).getTime()
}

/** Upcoming first (today+), then past newest — for dashboard list. */
export function sortForDashboard(list: VirtualMeeting[], now = new Date()): VirtualMeeting[] {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const upcoming = list
    .filter((m) => meetingSortKey(m) >= start.getTime())
    .sort((a, b) => meetingSortKey(a) - meetingSortKey(b))
  const past = list
    .filter((m) => meetingSortKey(m) < start.getTime())
    .sort((a, b) => meetingSortKey(b) - meetingSortKey(a))
  return [...upcoming, ...past]
}

export function isToday(m: VirtualMeeting, now = new Date()): boolean {
  const iso = now.toISOString().slice(0, 10)
  // Prefer America/Denver-ish local date for SPED staff
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return m.date === local || m.date === iso
}

export function openJoinUrl(url: string) {
  const href = url.trim()
  if (!href) return
  window.open(href, '_blank', 'noopener,noreferrer')
}

export function normalizeJoinUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
  try {
    const u = new URL(href)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return href
  } catch {
    return null
  }
}

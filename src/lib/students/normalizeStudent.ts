import type { Student } from './types'

export function normalizeStudent(raw: Partial<Student> & { id: string; name: string }): Student {
  const discipline = Array.isArray(raw.discipline) ? raw.discipline : []
  const hasIEP =
    raw.hasIEP != null ? Boolean(raw.hasIEP) : Boolean(raw.iepDue || raw.source === 'arr-csv' || raw.source === 'demo')
  const has504 = Boolean(raw.has504)
  const hasMLL = Boolean(raw.hasMLL || discipline.includes('ELA'))

  return {
    id: raw.id,
    name: raw.name,
    rawName: raw.rawName,
    grade: raw.grade || '—',
    teacher: raw.teacher || '—',
    discipline,
    provider: raw.provider || raw.caseManager || 'Unassigned',
    caseManager: raw.caseManager || raw.provider || 'Unassigned',
    tier: raw.tier ?? 2,
    iepDue: raw.iepDue || '',
    reevalDue: raw.reevalDue || '',
    meetingDate: raw.meetingDate || '',
    status: raw.status || 'On Track',
    color: raw.color || '#AEE4FF',
    interests: raw.interests || '—',
    triggers: raw.triggers || '—',
    calming: raw.calming || '—',
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    accommodations: Array.isArray(raw.accommodations) ? raw.accommodations : [],
    disability: raw.disability || '—',
    lastContact: raw.lastContact || '',
    fallEval: Boolean(raw.fallEval),
    source: raw.source || 'demo',
    hasIEP,
    has504,
    hasMLL,
    homeLanguage: raw.homeLanguage || '',
    eldLevel: raw.eldLevel || '',
    interpreterNeeded: Boolean(raw.interpreterNeeded),
    section504Due: raw.section504Due || '',
    section504Impairment: raw.section504Impairment || '',
    hasBip: Boolean(raw.hasBip),
    hasAlp: Boolean(raw.hasAlp),
  }
}

export function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function statusBadgeClass(status: string): string {
  if (status === 'Overdue') return 'bg-red-100 text-red-700'
  if (status === 'Upcoming' || status === 'At Risk') return 'bg-amber-100 text-amber-800'
  if (status === 'On Track') return 'bg-green-100 text-green-700'
  return 'bg-sky-100 text-sky-800'
}

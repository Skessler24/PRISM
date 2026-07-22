import type { Student } from './types'
import { normalizeStudent } from './normalizeStudent'

const TILE_COLORS = ['#AEE4FF', '#C4B5FD', '#F9A8D4', '#FDE68A', '#86EFAC', '#FDBA74', '#FDA4AF', '#93C5FD']

export function slugifyStudentId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `student-${Date.now()}`
}

export function uniqueStudentId(name: string, existing: Student[]): string {
  const base = slugifyStudentId(name)
  if (!existing.some((s) => s.id === base)) return base
  let n = 2
  while (existing.some((s) => s.id === `${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export type StudentDraft = {
  name: string
  grade: string
  teacher: string
  caseManager: string
  discipline: string
  disability: string
  status: string
  iepDue: string
  section504Due: string
  reevalDue: string
  meetingDate: string
  hasIEP: boolean
  has504: boolean
  hasMLL: boolean
  color: string
  goalsText: string
  homeLanguage: string
}

export function emptyStudentDraft(partial?: Partial<StudentDraft>): StudentDraft {
  return {
    name: '',
    grade: '',
    teacher: '',
    caseManager: '',
    discipline: '',
    disability: '',
    status: 'On Track',
    iepDue: '',
    section504Due: '',
    reevalDue: '',
    meetingDate: '',
    hasIEP: true,
    has504: false,
    hasMLL: false,
    color: TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)],
    goalsText: '',
    homeLanguage: '',
    ...partial,
  }
}

export function draftFromStudent(s: Student): StudentDraft {
  return {
    name: s.name,
    grade: s.grade === '—' ? '' : s.grade,
    teacher: s.teacher === '—' ? '' : s.teacher,
    caseManager: s.caseManager === 'Unassigned' ? '' : s.caseManager,
    discipline: s.discipline.join(', '),
    disability: s.disability === '—' ? '' : s.disability,
    status: s.status || 'On Track',
    iepDue: s.iepDue || '',
    section504Due: s.section504Due || '',
    reevalDue: s.reevalDue || '',
    meetingDate: s.meetingDate || '',
    hasIEP: s.hasIEP,
    has504: s.has504,
    hasMLL: s.hasMLL,
    color: s.color || '#AEE4FF',
    goalsText: s.goals.join('\n'),
    homeLanguage: s.homeLanguage || '',
  }
}

export function studentFromDraft(
  draft: StudentDraft,
  opts: { id?: string; existing?: Student[]; source?: string },
): Student {
  const name = draft.name.trim()
  if (!name) throw new Error('Name is required')
  const id = opts.id || uniqueStudentId(name, opts.existing || [])
  const discipline = draft.discipline
    .split(/[,/|]+/)
    .map((d) => d.trim())
    .filter(Boolean)
  const goals = draft.goalsText
    .split(/\n|;/)
    .map((g) => g.trim())
    .filter(Boolean)

  return normalizeStudent({
    id,
    name,
    grade: draft.grade.trim(),
    teacher: draft.teacher.trim(),
    caseManager: draft.caseManager.trim(),
    provider: draft.caseManager.trim(),
    discipline,
    disability: draft.disability.trim(),
    status: draft.status.trim() || 'On Track',
    iepDue: draft.iepDue,
    section504Due: draft.section504Due,
    reevalDue: draft.reevalDue,
    meetingDate: draft.meetingDate,
    hasIEP: draft.hasIEP,
    has504: draft.has504,
    hasMLL: draft.hasMLL,
    color: draft.color || '#AEE4FF',
    goals,
    homeLanguage: draft.homeLanguage.trim(),
    source: opts.source || 'manual',
  })
}

export const STUDENT_STATUS_OPTIONS = ['On Track', 'Upcoming', 'At Risk', 'Overdue', 'Pending'] as const

export const TILE_COLOR_OPTIONS = TILE_COLORS

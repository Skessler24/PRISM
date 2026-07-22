/** Bridge PRISM caseload students into Team IEP roster. */

import type { Student } from '../students/types'
import {
  PRESET_COLORS,
  TEAM_DAYS,
  gid,
  type TeamProvider,
  type TeamRosterStudent,
  type TeamScheduleState,
} from './teamStore'

function guessService(s: Student): string {
  const d = (s.discipline || []).join(' ').toLowerCase()
  if (d.includes('speech') || d.includes('slp') || d.includes('language')) return 'Speech-Language'
  if (d.includes('ot') || d.includes('occup')) return 'Occupational Therapy'
  if (d.includes('pt') || d.includes('physical')) return 'Physical Therapy'
  if (d.includes('counsel') || d.includes('social')) return 'Counseling'
  if (d.includes('behav')) return 'Behavior Support'
  if (d.includes('resource') || d.includes('academic') || d.includes('sped'))
    return 'Resource/Academic Support'
  return 'Speech-Language'
}

function guessRoleFromService(service: string): string {
  if (service === 'Speech-Language') return 'Speech-Language Pathologist'
  if (service === 'Occupational Therapy') return 'Occupational Therapist'
  if (service === 'Physical Therapy') return 'Physical Therapist'
  if (service === 'Counseling') return 'School Counselor'
  if (service === 'Behavior Support') return 'Behavior Specialist'
  if (service === 'Resource/Academic Support') return 'Special Ed Teacher'
  return 'Other'
}

function defaultMinutes(service: string): { requiredMinutes: number; sessionsPerWeek: number } {
  if (service === 'Speech-Language') return { requiredMinutes: 60, sessionsPerWeek: 2 }
  if (service === 'Occupational Therapy') return { requiredMinutes: 30, sessionsPerWeek: 1 }
  if (service === 'Physical Therapy') return { requiredMinutes: 30, sessionsPerWeek: 1 }
  if (service === 'Counseling') return { requiredMinutes: 30, sessionsPerWeek: 1 }
  if (service === 'Resource/Academic Support') return { requiredMinutes: 120, sessionsPerWeek: 4 }
  return { requiredMinutes: 60, sessionsPerWeek: 2 }
}

function providerNameFor(s: Student): string {
  return (s.caseManager || s.provider || 'Unassigned').trim() || 'Unassigned'
}

export type CaseloadImportResult = {
  state: TeamScheduleState
  addedStudents: number
  updatedStudents: number
  addedProviders: number
}

/**
 * Merge PRISM caseload into team roster.
 * Matches existing roster rows by prismStudentId or name (case-insensitive).
 * Ensures a provider exists for each case manager / provider name.
 */
export function importCaseloadIntoTeam(
  state: TeamScheduleState,
  caseload: Student[],
): CaseloadImportResult {
  const providers = [...state.providers]
  const students = [...state.students]
  let addedStudents = 0
  let updatedStudents = 0
  let addedProviders = 0

  function ensureProvider(name: string, service: string): string | null {
    if (!name || name === 'Unassigned') return null
    const existing = providers.find((p) => p.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing.id
    const p: TeamProvider = {
      id: gid(),
      name,
      role: guessRoleFromService(service),
      color: PRESET_COLORS[providers.length % PRESET_COLORS.length],
      gradeLevel: 'All Grades',
      availableDays: [...TEAM_DAYS],
      pullTimes: [],
    }
    providers.push(p)
    addedProviders++
    return p.id
  }

  for (const s of caseload) {
    const service = guessService(s)
    const mins = defaultMinutes(service)
    const pName = providerNameFor(s)
    const providerId = ensureProvider(pName, service)
    const grade = String(s.grade || 'K').replace(/^Grade\s+/i, '')

    const byPrism = students.findIndex((r) => r.prismStudentId === s.id)
    const byName =
      byPrism < 0
        ? students.findIndex((r) => r.name.toLowerCase() === s.name.toLowerCase())
        : -1
    const idx = byPrism >= 0 ? byPrism : byName

    if (idx >= 0) {
      const prev = students[idx]
      students[idx] = {
        ...prev,
        name: s.name,
        grade,
        serviceType: prev.serviceType || service,
        color: s.color || prev.color,
        providerId: providerId ?? prev.providerId,
        prismStudentId: s.id,
        // Keep custom minutes if already set above defaults
        requiredMinutes: prev.requiredMinutes || mins.requiredMinutes,
        sessionsPerWeek: prev.sessionsPerWeek || mins.sessionsPerWeek,
      }
      updatedStudents++
    } else {
      const row: TeamRosterStudent = {
        id: gid(),
        name: s.name,
        grade,
        serviceType: service,
        requiredMinutes: mins.requiredMinutes,
        sessionsPerWeek: mins.sessionsPerWeek,
        color: s.color || PRESET_COLORS[students.length % PRESET_COLORS.length],
        providerId,
        notes: '',
        prismStudentId: s.id,
      }
      students.push(row)
      addedStudents++
    }
  }

  return {
    state: { ...state, providers, students },
    addedStudents,
    updatedStudents,
    addedProviders,
  }
}

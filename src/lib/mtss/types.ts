/** MTSS / RTI types — browser-only (no student PHI in repo content). */

export type MtssDomain = 'literacy' | 'math' | 'behavior' | 'language' | 'speech'

export type InterventionCycle = {
  id: string
  studentId: string
  studentName: string
  domain: MtssDomain
  tier: 2 | 3
  targetSkill: string
  pmTool: string
  startDate: string
  endDate: string
  minutesPerDay?: number
  daysPerWeek?: number
  notes: string
  weeklyScores: { date: string; score: string }[]
  outcome: 'in-progress' | 'adequate' | 'inadequate' | 'refer'
}

export type MtssChecklistState = {
  teacher: Record<string, boolean>
  referral: Record<string, boolean>
  dat: Record<string, boolean>
  slpRti: Record<string, boolean>
}

export type MtssState = {
  cycles: InterventionCycle[]
  checklists: MtssChecklistState
  updatedAt: string
}

export function emptyChecklists(): MtssChecklistState {
  return { teacher: {}, referral: {}, dat: {}, slpRti: {} }
}

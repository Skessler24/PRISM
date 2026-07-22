/** Weekly caseload planner — who am I seeing today (browser-only). */

export type PlannerSlot = {
  id: string
  day: 0 | 1 | 2 | 3 | 4 // Mon–Fri
  startTime: string // HH:MM
  endTime: string
  studentId: string
  studentName: string
  focus: string
  location: string
  materialIds: string[]
}

export type WeeklyPlannerState = {
  weekLabel: string
  slots: PlannerSlot[]
  updatedAt: string
}

const KEY = 'prism_weekly_planner_v1'

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

function read(): WeeklyPlannerState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return { weekLabel: 'This week', slots: [], updatedAt: new Date().toISOString() }
    }
    const parsed = JSON.parse(raw) as WeeklyPlannerState
    return {
      weekLabel: parsed.weekLabel || 'This week',
      slots: Array.isArray(parsed.slots) ? parsed.slots : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }
  } catch {
    return { weekLabel: 'This week', slots: [], updatedAt: new Date().toISOString() }
  }
}

export function loadPlanner(): WeeklyPlannerState {
  return read()
}

export function savePlanner(state: WeeklyPlannerState) {
  localStorage.setItem(
    KEY,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
  )
}

/** 0=Mon … 4=Fri; weekend → Monday view */
export function todayPlannerDay(d = new Date()): 0 | 1 | 2 | 3 | 4 {
  const js = d.getDay() // 0 Sun
  if (js === 0 || js === 6) return 0
  return (js - 1) as 0 | 1 | 2 | 3 | 4
}

export function slotsForDay(state: WeeklyPlannerState, day: 0 | 1 | 2 | 3 | 4): PlannerSlot[] {
  return [...state.slots]
    .filter((s) => s.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function todaysSchedule(state: WeeklyPlannerState, d = new Date()): PlannerSlot[] {
  return slotsForDay(state, todayPlannerDay(d))
}

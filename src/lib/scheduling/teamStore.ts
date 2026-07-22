/** Team IEP Scheduling — Copilot artifact model (providers, sessions, blocks, constraints). */

export const TEAM_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
export type TeamDay = (typeof TEAM_DAYS)[number]
export const TEAM_DAY_SHORTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

export const TEAM_GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const
export const TEAM_SERVICES = [
  'Speech-Language',
  'Occupational Therapy',
  'Physical Therapy',
  'Resource/Academic Support',
  'Counseling',
  'Behavior Support',
  'Other',
] as const
export const TEAM_ROLES = [
  'Speech-Language Pathologist',
  'Occupational Therapist',
  'Physical Therapist',
  'Special Ed Teacher',
  'School Counselor',
  'Behavior Specialist',
  'Other',
] as const
export const TEAM_GRADE_LEVELS = ['K-2', '3-5', '6-8', '9-12', 'All Grades'] as const
export const PRESET_COLORS = [
  '#3b82f6',
  '#14b8a6',
  '#22c55e',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#ef4444',
  '#6366f1',
  '#0ea5e9',
  '#84cc16',
] as const

export type PullWindow = { day: TeamDay; startTime: string; endTime: string }

export type TeamProvider = {
  id: string
  name: string
  role: string
  color: string
  gradeLevel: string
  availableDays: TeamDay[]
  pullTimes: PullWindow[]
}

export type TeamRosterStudent = {
  id: string
  name: string
  grade: string
  serviceType: string
  requiredMinutes: number
  sessionsPerWeek: number
  color: string
  providerId: string | null
  notes: string
  /** Optional link to PRISM caseload student id */
  prismStudentId?: string
}

export type TeamSession = {
  id: string
  day: TeamDay
  startTime: string
  duration: 30 | 60
  studentIds: string[]
  sessionType: 'Individual' | 'Group'
  providerId: string
}

export type BlockedSlot = {
  id: string
  day: TeamDay
  startTime: string
  reason: string
  providerId: string | null
}

export type MasterConstraint = {
  id: string
  day: TeamDay | 'All'
  startTime: string
  endTime: string
  type: string
  label: string
  affectsAll?: boolean
}

export type IepDay = {
  id: string
  date: string
  label: string
  studentId: string | null
}

export type TeamSettings = {
  yearStart: string
  yearEnd: string
  dayStartH: number
  dayStartM: number
  dayEndH: number
  dayEndM: number
  defaultDuration: 30 | 60
}

export type TeamScheduleState = {
  providers: TeamProvider[]
  students: TeamRosterStudent[]
  sessions: TeamSession[]
  blockedSlots: BlockedSlot[]
  masterConstraints: MasterConstraint[]
  iepDays: IepDay[]
  settings: TeamSettings
  activeProviderId: string
  updatedAt: string
}

const KEY = 'prism_team_iep_schedule_v1'

export function gid(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function genTimeSlots(
  startH = 7,
  startM = 30,
  endH = 16,
  endM = 0,
): string[] {
  const r: string[] = []
  let h = startH
  let m = startM
  while (h < endH || (h === endH && m <= endM)) {
    r.push(`${h}:${String(m).padStart(2, '0')}`)
    m += 30
    if (m >= 60) {
      m = 0
      h++
    }
  }
  return r
}

export function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'p' : 'a'
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${String(m).padStart(2, '0')}${ap}`
}

export function initials(n: string): string {
  return n
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function defaultSettings(): TeamSettings {
  return {
    yearStart: '2026-08-17',
    yearEnd: '2027-05-28',
    dayStartH: 7,
    dayStartM: 30,
    dayEndH: 16,
    dayEndM: 0,
    defaultDuration: 30,
  }
}

function seedState(): TeamScheduleState {
  const pid1 = gid()
  const pid2 = gid()
  const pid3 = gid()
  const providers: TeamProvider[] = [
    {
      id: pid1,
      name: 'Jane Smith',
      role: 'Speech-Language Pathologist',
      color: '#3b82f6',
      gradeLevel: 'K-2',
      availableDays: [...TEAM_DAYS],
      pullTimes: TEAM_DAYS.flatMap((d) => [
        { day: d, startTime: '8:00', endTime: '11:30' },
        { day: d, startTime: '12:30', endTime: '14:30' },
      ]),
    },
    {
      id: pid2,
      name: 'Mike Torres',
      role: 'Special Ed Teacher',
      color: '#22c55e',
      gradeLevel: '3-5',
      availableDays: [...TEAM_DAYS],
      pullTimes: TEAM_DAYS.flatMap((d) => [
        { day: d, startTime: '9:00', endTime: '11:00' },
        { day: d, startTime: '13:00', endTime: '15:00' },
      ]),
    },
    {
      id: pid3,
      name: 'Priya Patel',
      role: 'Occupational Therapist',
      color: '#a855f7',
      gradeLevel: 'All Grades',
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      pullTimes: (['Monday', 'Wednesday', 'Friday'] as TeamDay[]).map((d) => ({
        day: d,
        startTime: '8:30',
        endTime: '12:00',
      })),
    },
  ]
  const sid1 = gid()
  const sid2 = gid()
  const sid3 = gid()
  const sid4 = gid()
  const sid5 = gid()
  const students: TeamRosterStudent[] = [
    {
      id: sid1,
      name: 'Alex M.',
      grade: '3',
      serviceType: 'Speech-Language',
      requiredMinutes: 60,
      sessionsPerWeek: 3,
      color: '#3b82f6',
      providerId: pid1,
      notes: '',
    },
    {
      id: sid2,
      name: 'Sam R.',
      grade: '1',
      serviceType: 'Speech-Language',
      requiredMinutes: 45,
      sessionsPerWeek: 2,
      color: '#14b8a6',
      providerId: pid1,
      notes: '',
    },
    {
      id: sid3,
      name: 'Jordan K.',
      grade: '5',
      serviceType: 'Resource/Academic Support',
      requiredMinutes: 120,
      sessionsPerWeek: 5,
      color: '#22c55e',
      providerId: pid2,
      notes: '',
    },
    {
      id: sid4,
      name: 'Casey L.',
      grade: '4',
      serviceType: 'Resource/Academic Support',
      requiredMinutes: 90,
      sessionsPerWeek: 3,
      color: '#f97316',
      providerId: pid2,
      notes: '',
    },
    {
      id: sid5,
      name: 'Taylor B.',
      grade: '2',
      serviceType: 'Occupational Therapy',
      requiredMinutes: 60,
      sessionsPerWeek: 2,
      color: '#a855f7',
      providerId: pid3,
      notes: '',
    },
  ]
  const masterConstraints: MasterConstraint[] = [
    {
      id: gid(),
      day: 'All',
      startTime: '12:00',
      endTime: '12:30',
      type: 'lunch',
      label: 'Lunch',
      affectsAll: true,
    },
    {
      id: gid(),
      day: 'Monday',
      startTime: '10:00',
      endTime: '10:30',
      type: 'specials',
      label: 'PE',
      affectsAll: true,
    },
    {
      id: gid(),
      day: 'Wednesday',
      startTime: '10:00',
      endTime: '10:30',
      type: 'specials',
      label: 'PE',
      affectsAll: true,
    },
    {
      id: gid(),
      day: 'Friday',
      startTime: '10:00',
      endTime: '10:30',
      type: 'specials',
      label: 'PE',
      affectsAll: true,
    },
    {
      id: gid(),
      day: 'Tuesday',
      startTime: '9:30',
      endTime: '10:00',
      type: 'specials',
      label: 'Art',
      affectsAll: true,
    },
    {
      id: gid(),
      day: 'Thursday',
      startTime: '9:30',
      endTime: '10:00',
      type: 'specials',
      label: 'Art',
      affectsAll: true,
    },
  ]
  const sessions: TeamSession[] = [
    {
      id: gid(),
      day: 'Monday',
      startTime: '9:00',
      duration: 30,
      studentIds: [sid1],
      sessionType: 'Individual',
      providerId: pid1,
    },
    {
      id: gid(),
      day: 'Wednesday',
      startTime: '9:00',
      duration: 30,
      studentIds: [sid1],
      sessionType: 'Individual',
      providerId: pid1,
    },
    {
      id: gid(),
      day: 'Friday',
      startTime: '9:00',
      duration: 30,
      studentIds: [sid1],
      sessionType: 'Individual',
      providerId: pid1,
    },
    {
      id: gid(),
      day: 'Tuesday',
      startTime: '10:00',
      duration: 30,
      studentIds: [sid2],
      sessionType: 'Individual',
      providerId: pid1,
    },
    {
      id: gid(),
      day: 'Thursday',
      startTime: '10:00',
      duration: 30,
      studentIds: [sid2],
      sessionType: 'Individual',
      providerId: pid1,
    },
    {
      id: gid(),
      day: 'Monday',
      startTime: '9:30',
      duration: 30,
      studentIds: [sid3],
      sessionType: 'Individual',
      providerId: pid2,
    },
    {
      id: gid(),
      day: 'Tuesday',
      startTime: '10:00',
      duration: 30,
      studentIds: [sid3],
      sessionType: 'Individual',
      providerId: pid2,
    },
    {
      id: gid(),
      day: 'Wednesday',
      startTime: '9:30',
      duration: 30,
      studentIds: [sid3],
      sessionType: 'Individual',
      providerId: pid2,
    },
    {
      id: gid(),
      day: 'Thursday',
      startTime: '10:00',
      duration: 30,
      studentIds: [sid3],
      sessionType: 'Individual',
      providerId: pid2,
    },
    {
      id: gid(),
      day: 'Friday',
      startTime: '9:30',
      duration: 30,
      studentIds: [sid3],
      sessionType: 'Individual',
      providerId: pid2,
    },
    {
      id: gid(),
      day: 'Monday',
      startTime: '13:00',
      duration: 30,
      studentIds: [sid4],
      sessionType: 'Individual',
      providerId: pid2,
    },
    {
      id: gid(),
      day: 'Wednesday',
      startTime: '13:00',
      duration: 30,
      studentIds: [sid4],
      sessionType: 'Individual',
      providerId: pid2,
    },
    {
      id: gid(),
      day: 'Friday',
      startTime: '13:00',
      duration: 30,
      studentIds: [sid4],
      sessionType: 'Individual',
      providerId: pid2,
    },
    {
      id: gid(),
      day: 'Monday',
      startTime: '9:00',
      duration: 30,
      studentIds: [sid5],
      sessionType: 'Individual',
      providerId: pid3,
    },
    {
      id: gid(),
      day: 'Wednesday',
      startTime: '9:00',
      duration: 30,
      studentIds: [sid5],
      sessionType: 'Individual',
      providerId: pid3,
    },
  ]
  return {
    providers,
    students,
    sessions,
    blockedSlots: [],
    masterConstraints,
    iepDays: [],
    settings: defaultSettings(),
    activeProviderId: 'all',
    updatedAt: new Date().toISOString(),
  }
}

export function loadTeamSchedule(): TeamScheduleState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as TeamScheduleState
    if (!Array.isArray(parsed.providers) || !parsed.providers.length) return seedState()
    return {
      ...seedState(),
      ...parsed,
      settings: { ...defaultSettings(), ...parsed.settings },
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }
  } catch {
    return seedState()
  }
}

export function saveTeamSchedule(state: TeamScheduleState) {
  localStorage.setItem(
    KEY,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
  )
}

export function resetTeamSchedule(): TeamScheduleState {
  const next = seedState()
  saveTeamSchedule(next)
  return next
}

export function getTimeSlots(settings: TeamSettings): string[] {
  return genTimeSlots(
    settings.dayStartH,
    settings.dayStartM,
    settings.dayEndH,
    settings.dayEndM,
  )
}

export function getSchedMin(state: TeamScheduleState, studentId: string): number {
  return state.sessions
    .filter((s) => s.studentIds.includes(studentId))
    .reduce((a, s) => a + s.duration, 0)
}

export function statusColor(sched: number, req: number) {
  const p = req > 0 ? sched / req : 0
  if (p >= 1) return { bg: '#dcfce7', fill: '#22c55e', text: '#166534' }
  if (p >= 0.5) return { bg: '#fef9c3', fill: '#eab308', text: '#854d0e' }
  return { bg: '#fee2e2', fill: '#ef4444', text: '#991b1b' }
}

export function constraintClass(type: string): string {
  const m: Record<string, string> = {
    lunch: 'team-pat-lunch',
    specials: 'team-pat-specials',
    assembly: 'team-pat-specials',
    testing: 'team-pat-testing',
    'iep-day': 'team-pat-iep',
    protected: 'team-pat-other',
    blocked: 'team-pat-other',
  }
  return m[type] || 'team-pat-other'
}

export function isConstrained(
  state: TeamScheduleState,
  day: TeamDay,
  time: string,
): MasterConstraint | undefined {
  const slots = getTimeSlots(state.settings)
  return state.masterConstraints.find((mc) => {
    const days = mc.day === 'All' ? TEAM_DAYS : [mc.day]
    if (!days.includes(day)) return false
    const si = slots.indexOf(mc.startTime)
    const ei = slots.indexOf(mc.endTime)
    const ti = slots.indexOf(time)
    if (si < 0 || ti < 0) return false
    return ti >= si && (ei < 0 ? ti === si : ti < ei)
  })
}

export function isBlocked(
  state: TeamScheduleState,
  day: TeamDay,
  time: string,
  providerId: string,
): boolean {
  return state.blockedSlots.some(
    (b) =>
      b.day === day &&
      b.startTime === time &&
      (b.providerId === providerId || b.providerId === null || !b.providerId),
  )
}

export function sessionsAt(
  state: TeamScheduleState,
  day: TeamDay,
  time: string,
  providerId: string,
): TeamSession[] {
  return state.sessions.filter((s) => {
    if (s.day !== day || s.startTime !== time) return false
    if (providerId && providerId !== 'all' && s.providerId !== providerId) return false
    return true
  })
}

export function hasConflict(
  state: TeamScheduleState,
  day: TeamDay,
  time: string,
  dur: 30 | 60,
  studentIds: string[],
  excludeId?: string | null,
): boolean {
  const slots = getTimeSlots(state.settings)
  const check = [time]
  if (dur === 60) {
    const i = slots.indexOf(time)
    if (i >= 0 && i + 1 < slots.length) check.push(slots[i + 1])
  }
  for (const sl of check) {
    for (const sess of state.sessions) {
      if (excludeId && sess.id === excludeId) continue
      if (sess.day !== day) continue
      const ss = [sess.startTime]
      if (sess.duration === 60) {
        const i2 = slots.indexOf(sess.startTime)
        if (i2 >= 0 && i2 + 1 < slots.length) ss.push(slots[i2 + 1])
      }
      if (ss.includes(sl) && sess.studentIds.some((sid) => studentIds.includes(sid))) {
        return true
      }
    }
  }
  return false
}

export function dayIndex(day: TeamDay): 0 | 1 | 2 | 3 | 4 {
  return TEAM_DAYS.indexOf(day) as 0 | 1 | 2 | 3 | 4
}

export function teamDayFromIndex(i: 0 | 1 | 2 | 3 | 4): TeamDay {
  return TEAM_DAYS[i]
}

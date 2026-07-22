/** Live scheduling — session groups (Phase2 “Who Are You Seeing” model). */

export type ScheduleGroup = {
  id: string
  name: string
  day: 0 | 1 | 2 | 3 | 4
  startTime: string
  endTime: string
  location: string
  studentIds: string[]
  goalFocus: string[]
  notes: string
}

export type ScheduleState = {
  weekLabel: string
  groups: ScheduleGroup[]
  updatedAt: string
}

const KEY = 'prism_schedule_groups_v1'

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

function seedGroups(): ScheduleGroup[] {
  return [
    {
      id: 'g-lang',
      name: '1st Grade Language Group',
      day: 0,
      startTime: '08:30',
      endTime: '09:00',
      location: 'Speech room',
      studentIds: ['aiden', 'maya', 'carlos'],
      goalFocus: ['Follow directions', '3-word requests', 'Complete sentences'],
      notes: '',
    },
    {
      id: 'g-artic',
      name: 'Articulation Pull-out',
      day: 0,
      startTime: '10:00',
      endTime: '10:30',
      location: 'Speech room',
      studentIds: ['jordan', 'sofia'],
      goalFocus: ['CVC decoding', '/l/ in conversation'],
      notes: '',
    },
    {
      id: 'g-social',
      name: 'Social Skills',
      day: 0,
      startTime: '13:30',
      endTime: '14:00',
      location: 'Small group',
      studentIds: ['bella', 'diana'],
      goalFocus: ['Peer interaction', 'Turn taking'],
      notes: '',
    },
    {
      id: 'g-lang-wed',
      name: '1st Grade Language Group',
      day: 2,
      startTime: '08:30',
      endTime: '09:00',
      location: 'Speech room',
      studentIds: ['aiden', 'maya', 'carlos'],
      goalFocus: ['Follow directions', '3-word requests'],
      notes: '',
    },
    {
      id: 'g-artic-fri',
      name: 'Articulation Pull-out',
      day: 4,
      startTime: '10:00',
      endTime: '10:30',
      location: 'Speech room',
      studentIds: ['jordan', 'sofia'],
      goalFocus: ['/r/ in sentences', '/l/ in conversation'],
      notes: '',
    },
  ]
}

function read(): ScheduleState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return {
        weekLabel: 'This week',
        groups: seedGroups(),
        updatedAt: new Date().toISOString(),
      }
    }
    const parsed = JSON.parse(raw) as ScheduleState
    return {
      weekLabel: parsed.weekLabel || 'This week',
      groups: Array.isArray(parsed.groups) && parsed.groups.length ? parsed.groups : seedGroups(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }
  } catch {
    return { weekLabel: 'This week', groups: seedGroups(), updatedAt: new Date().toISOString() }
  }
}

export function loadSchedule(): ScheduleState {
  return read()
}

export function saveSchedule(state: ScheduleState) {
  localStorage.setItem(
    KEY,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
  )
}

export function todayScheduleDay(d = new Date()): 0 | 1 | 2 | 3 | 4 {
  const js = d.getDay()
  if (js === 0 || js === 6) return 0
  return (js - 1) as 0 | 1 | 2 | 3 | 4
}

export function groupsForDay(state: ScheduleState, day: 0 | 1 | 2 | 3 | 4): ScheduleGroup[] {
  return [...state.groups]
    .filter((g) => g.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function todaysGroups(state: ScheduleState, d = new Date()): ScheduleGroup[] {
  return groupsForDay(state, todayScheduleDay(d))
}

export function emptyGroup(day: 0 | 1 | 2 | 3 | 4 = 0): ScheduleGroup {
  return {
    id: `g-${Date.now()}`,
    name: 'New group',
    day,
    startTime: '09:00',
    endTime: '09:30',
    location: '',
    studentIds: [],
    goalFocus: [],
    notes: '',
  }
}

/** Copy all groups from one weekday onto another (new ids). */
export function copyGroupsToDay(
  state: ScheduleState,
  fromDay: 0 | 1 | 2 | 3 | 4,
  toDay: 0 | 1 | 2 | 3 | 4,
): ScheduleState {
  if (fromDay === toDay) return state
  const copies = groupsForDay(state, fromDay).map((g) => ({
    ...g,
    id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    day: toDay,
  }))
  const kept = state.groups.filter((g) => g.day !== toDay)
  return { ...state, groups: [...kept, ...copies] }
}

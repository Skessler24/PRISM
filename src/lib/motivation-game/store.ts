/** Motivation / attendance game — browser-only. */

export type GameStudentState = {
  studentId: string
  points: number
  boardSpace: number
  attendanceDates: string[]
  prizesClaimed: string[]
}

export type GameState = {
  seasonLabel: string
  boardSize: number
  students: GameStudentState[]
  prizeOptions: string[]
  lastEvent: string
  updatedAt: string
}

const KEY = 'prism_motivation_game_v1'
export const BOARD_SIZE = 24

export const DEFAULT_PRIZES = [
  'Sticker pack',
  'Extra computer time',
  'Choose the brain break',
  'Sit with a friend',
  'Treasure box pick',
  'Homework pass (1)',
  'Teacher helper',
  'Positive note home',
]

export const CHANCE_CARDS = [
  { text: 'Great effort! Move ahead 2', deltaSpace: 2, deltaPoints: 2 },
  { text: 'Helping hands — +3 points', deltaSpace: 0, deltaPoints: 3 },
  { text: 'Take a calm breath — stay put, +1 point', deltaSpace: 0, deltaPoints: 1 },
  { text: 'Oops, slide back 1 (try again!)', deltaSpace: -1, deltaPoints: 0 },
  { text: 'Attendance streak bonus +5', deltaSpace: 1, deltaPoints: 5 },
  { text: 'Progress probe power-up +4', deltaSpace: 0, deltaPoints: 4 },
  { text: 'Climb the ladder! +3 spaces', deltaSpace: 3, deltaPoints: 2 },
  { text: 'Share kindness — class cheers +2', deltaSpace: 1, deltaPoints: 2 },
]

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return (JSON.parse(raw) as T) ?? fallback
  } catch {
    return fallback
  }
}

export function loadGameState(): GameState {
  const raw = readJson<GameState | null>(KEY, null)
  if (raw && Array.isArray(raw.students)) return raw
  return {
    seasonLabel: 'School Year Motivation Track',
    boardSize: BOARD_SIZE,
    students: [],
    prizeOptions: [...DEFAULT_PRIZES],
    lastEvent: 'Game ready — check in attendance or roll!',
    updatedAt: new Date().toISOString(),
  }
}

export function saveGameState(state: GameState) {
  localStorage.setItem(KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }))
}

export function ensureStudent(state: GameState, studentId: string): GameState {
  if (state.students.some((s) => s.studentId === studentId)) return state
  return {
    ...state,
    students: [
      ...state.students,
      {
        studentId,
        points: 0,
        boardSpace: 0,
        attendanceDates: [],
        prizesClaimed: [],
      },
    ],
  }
}

export function clampSpace(space: number, boardSize: number) {
  return Math.max(0, Math.min(boardSize - 1, space))
}

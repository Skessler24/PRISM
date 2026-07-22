/** Browser-only MTSS state (cycles + checklists). FERPA: stays in localStorage. */

import { emptyChecklists, type InterventionCycle, type MtssState } from './types'

const KEY = 'prism_mtss_state_v1'

function defaultState(): MtssState {
  return {
    cycles: [],
    checklists: emptyChecklists(),
    updatedAt: new Date().toISOString(),
  }
}

export function loadMtssState(): MtssState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as MtssState
    return {
      cycles: Array.isArray(parsed.cycles) ? parsed.cycles : [],
      checklists: {
        ...emptyChecklists(),
        ...(parsed.checklists || {}),
      },
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }
  } catch {
    return defaultState()
  }
}

export function saveMtssState(state: MtssState) {
  const next = { ...state, updatedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function upsertCycle(cycle: InterventionCycle) {
  const state = loadMtssState()
  const cycles = [cycle, ...state.cycles.filter((c) => c.id !== cycle.id)].slice(0, 80)
  return saveMtssState({ ...state, cycles })
}

export function removeCycle(id: string) {
  const state = loadMtssState()
  return saveMtssState({ ...state, cycles: state.cycles.filter((c) => c.id !== id) })
}

export function setChecklist(
  group: keyof MtssState['checklists'],
  key: string,
  value: boolean,
) {
  const state = loadMtssState()
  return saveMtssState({
    ...state,
    checklists: {
      ...state.checklists,
      [group]: { ...state.checklists[group], [key]: value },
    },
  })
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''))
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysUntilIso(iso: string): number | null {
  if (!iso) return null
  const end = new Date(iso + 'T12:00:00').getTime()
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.round((end - now.getTime()) / 86400000)
}

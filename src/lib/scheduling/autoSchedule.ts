/** Greedy auto-scheduler: place IEP sessions around school constraints + provider windows. */

import {
  getSchedMin,
  getTimeSlots,
  gid,
  hasConflict,
  isBlocked,
  isConstrained,
  dayIndex,
  type TeamDay,
  type TeamScheduleState,
  type TeamSession,
} from './teamStore'
import type { ScheduleGroup, ScheduleState } from './store'

export type AutoBuildOptions = {
  /** Replace all existing sessions (default true). */
  clearExisting?: boolean
  /** Prefer this duration when placing (falls back to settings.defaultDuration). */
  duration?: 30 | 60
  /** Only schedule students for this provider id (or all). */
  providerId?: string | 'all'
  /** Max sessions to place (safety). */
  maxSessions?: number
}

export type AutoBuildResult = {
  state: TeamScheduleState
  placed: number
  unmet: { studentId: string; name: string; needed: number; got: number }[]
  skippedNoProvider: number
}

function isInPullTimes(
  state: TeamScheduleState,
  providerId: string,
  day: TeamDay,
  time: string,
): boolean {
  const prov = state.providers.find((p) => p.id === providerId)
  if (!prov || !prov.pullTimes || prov.pullTimes.length === 0) return true
  const dayPulls = prov.pullTimes.filter((pt) => pt.day === day)
  if (dayPulls.length === 0) return false
  const slots = getTimeSlots(state.settings)
  const ti = slots.indexOf(time)
  if (ti < 0) return false
  return dayPulls.some((pt) => {
    const si = slots.indexOf(pt.startTime)
    const ei = slots.indexOf(pt.endTime)
    if (si < 0) return false
    return ti >= si && (ei < 0 ? true : ti < ei)
  })
}

function providerBusy(
  sessions: TeamSession[],
  providerId: string,
  day: TeamDay,
  time: string,
  duration: 30 | 60,
  slots: string[],
): boolean {
  const check = [time]
  if (duration === 60) {
    const i = slots.indexOf(time)
    if (i >= 0 && i + 1 < slots.length) check.push(slots[i + 1])
  }
  for (const sess of sessions) {
    if (sess.providerId !== providerId || sess.day !== day) continue
    const ss = [sess.startTime]
    if (sess.duration === 60) {
      const i2 = slots.indexOf(sess.startTime)
      if (i2 >= 0 && i2 + 1 < slots.length) ss.push(slots[i2 + 1])
    }
    if (ss.some((t) => check.includes(t))) return true
  }
  return false
}

/**
 * Place individual sessions until each student's required minutes (or sessions/week) are met,
 * avoiding master constraints, blocked slots, pull-time windows, and conflicts.
 */
export function autoBuildSchedule(
  state: TeamScheduleState,
  opts: AutoBuildOptions = {},
): AutoBuildResult {
  const duration = opts.duration || state.settings.defaultDuration || 30
  const clear = opts.clearExisting !== false
  const filterPid = opts.providerId && opts.providerId !== 'all' ? opts.providerId : null
  const maxSessions = opts.maxSessions ?? 500

  let sessions: TeamSession[] = clear ? [] : [...state.sessions]
  const working: TeamScheduleState = { ...state, sessions }

  const roster = [...state.students]
    .filter((s) => {
      if (!s.providerId) return false
      if (filterPid && s.providerId !== filterPid) return false
      return true
    })
    .sort((a, b) => b.requiredMinutes - a.requiredMinutes)

  const noProv = state.students.filter((s) => {
    if (filterPid && s.providerId !== filterPid) return false
    return !s.providerId
  }).length

  const unmet: AutoBuildResult['unmet'] = []
  let placed = 0
  const slots = getTimeSlots(state.settings)
  const slotOrder = [...slots.slice(0, -1)]

  for (const student of roster) {
    const provider = state.providers.find((p) => p.id === student.providerId)
    if (!provider || !student.providerId) continue

    const targetMin = student.requiredMinutes || duration * (student.sessionsPerWeek || 1)
    const targetSessions = Math.max(
      student.sessionsPerWeek || 1,
      Math.ceil(targetMin / duration),
    )

    let got = clear ? 0 : Math.floor(getSchedMin(working, student.id) / duration)
    // Prefer spreading across different days
    const dayOrder = [...provider.availableDays].sort((a, b) => {
      const ca = sessions.filter((s) => s.studentIds.includes(student.id) && s.day === a).length
      const cb = sessions.filter((s) => s.studentIds.includes(student.id) && s.day === b).length
      return ca - cb
    })

    for (const day of dayOrder) {
      if (got >= targetSessions || placed >= maxSessions) break
      for (const time of slotOrder) {
        if (got >= targetSessions || placed >= maxSessions) break
        if (isConstrained(working, day, time)) continue
        if (isBlocked(working, day, time, student.providerId)) continue
        if (!isInPullTimes(working, student.providerId, day, time)) continue
        if (duration === 60) {
          const i = slots.indexOf(time)
          const next = i >= 0 ? slots[i + 1] : null
          if (!next) continue
          if (isConstrained(working, day, next)) continue
        }
        if (hasConflict(working, day, time, duration, [student.id], null)) continue
        if (providerBusy(sessions, student.providerId, day, time, duration, slots)) continue

        const sess: TeamSession = {
          id: gid(),
          day,
          startTime: time,
          duration,
          studentIds: [student.id],
          sessionType: 'Individual',
          providerId: student.providerId,
        }
        sessions = [...sessions, sess]
        working.sessions = sessions
        got++
        placed++
      }
    }

    const scheduledMin = getSchedMin(working, student.id)
    if (scheduledMin < targetMin || got < targetSessions) {
      unmet.push({
        studentId: student.id,
        name: student.name,
        needed: targetMin,
        got: scheduledMin,
      })
    }
  }

  return {
    state: { ...state, sessions },
    placed,
    unmet,
    skippedNoProvider: noProv,
  }
}

function timePlus(start: string, duration: 30 | 60): string {
  const [h, m] = start.split(':').map(Number)
  const mins = h * 60 + m + duration
  const nh = Math.floor(mins / 60)
  const nm = mins % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function toDisplayTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Convert team sessions for one provider into Live Groups (ScheduleState).
 */
export function syncSessionsToLiveGroups(
  team: TeamScheduleState,
  live: ScheduleState,
  providerId: string,
): ScheduleState {
  const sessions = team.sessions.filter((s) => s.providerId === providerId)
  const groups: ScheduleGroup[] = sessions.map((s) => {
    const studs = s.studentIds
      .map((id) => team.students.find((x) => x.id === id))
      .filter(Boolean)
    const prismIds = studs
      .map((st) => st!.prismStudentId)
      .filter((id): id is string => !!id)
    const names = studs.map((st) => st!.name)
    const day = dayIndex(s.day)
    return {
      id: `auto-${s.id}`,
      name:
        s.sessionType === 'Group' || names.length > 1
          ? `Group: ${names.join(', ')}`
          : names[0]
            ? `${names[0]} — pull-out`
            : 'Session',
      day,
      startTime: toDisplayTime(s.startTime),
      endTime: toDisplayTime(timePlus(s.startTime, s.duration)),
      location: 'Speech room',
      studentIds: prismIds.length ? prismIds : [],
      goalFocus: [],
      notes: `Auto-built from Team Week Grid (${s.day})`,
    }
  })

  // Keep non-auto groups; replace auto-* for this rebuild
  const kept = live.groups.filter((g) => !g.id.startsWith('auto-'))
  return {
    ...live,
    groups: [...kept, ...groups],
    weekLabel: 'Auto-built week',
  }
}

export function primaryProviderId(state: TeamScheduleState): string | null {
  if (!state.providers.length) return null
  const scored = state.providers.map((p) => ({
    p,
    n: state.students.filter((s) => s.providerId === p.id).length,
    slp: /speech/i.test(p.role) ? 1 : 0,
  }))
  scored.sort((a, b) => b.slp - a.slp || b.n - a.n)
  return scored[0]?.p.id || null
}
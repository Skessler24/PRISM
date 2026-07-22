import type { Student } from '../students/types'
import type { PlannerSlot, WeeklyPlannerState } from '../weekly-planner/store'
import { DAY_LABELS } from '../weekly-planner/store'
import type { MeetingPrepPacket } from '../meeting-prep/store'
import { daysUntil } from '../students/normalizeStudent'
import { buildProgressAlerts, type ProbeSession } from '../progress-monitoring/store'

export type WeekMeetingItem = {
  id: string
  kind: 'iep' | 'session'
  dayLabel: string
  dayIndex: number
  when: string
  studentId: string
  studentName: string
  color: string
  detail: string
}

export type WeekDueItem = {
  id: string
  label: string
  studentId: string
  studentName: string
  color: string
  dueDate: string
  days: number
  href: string
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Current Mon–Fri school week (weekend → upcoming Mon–Fri). */
export function currentSchoolWeek(now = new Date()): { start: Date; end: Date; days: Date[] } {
  const today = startOfLocalDay(now)
  const js = today.getDay() // 0 Sun
  const mondayOffset = js === 0 ? 1 : js === 6 ? 2 : 1 - js
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  const days: Date[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return { start: days[0], end: days[4], days }
}

function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function inWeek(iso: string | undefined, start: Date, end: Date): boolean {
  if (!iso) return false
  const t = startOfLocalDay(new Date(`${iso}T12:00:00`))
  if (Number.isNaN(t.getTime())) return false
  return t >= start && t <= end
}

function studentColor(students: Student[], id: string, fallback = '#AEE4FF') {
  return students.find((s) => s.id === id)?.color || fallback
}

export function buildWeekMeetings(opts: {
  students: Student[]
  planner: WeeklyPlannerState
  packets: MeetingPrepPacket[]
  now?: Date
}): { total: number; byDay: { dayLabel: string; dayIndex: number; items: WeekMeetingItem[] }[] } {
  const { students, planner, packets, now = new Date() } = opts
  const { start, end } = currentSchoolWeek(now)
  const items: WeekMeetingItem[] = []

  for (const slot of planner.slots as PlannerSlot[]) {
    if (slot.day < 0 || slot.day > 4) continue
    items.push({
      id: `slot-${slot.id}`,
      kind: 'session',
      dayLabel: DAY_LABELS[slot.day],
      dayIndex: slot.day,
      when: `${slot.startTime}`,
      studentId: slot.studentId,
      studentName: slot.studentName,
      color: studentColor(students, slot.studentId),
      detail: slot.focus || 'Session',
    })
  }

  const seenIep = new Set<string>()
  for (const s of students) {
    if (!inWeek(s.meetingDate, start, end)) continue
    const key = `${s.id}-${s.meetingDate}`
    if (seenIep.has(key)) continue
    seenIep.add(key)
    const d = startOfLocalDay(new Date(`${s.meetingDate}T12:00:00`))
    const dayIndex = ((d.getDay() + 6) % 7) as number // Mon=0
    if (dayIndex > 4) continue
    items.push({
      id: `meet-${s.id}`,
      kind: 'iep',
      dayLabel: DAY_LABELS[dayIndex as 0 | 1 | 2 | 3 | 4],
      dayIndex: dayIndex as 0 | 1 | 2 | 3 | 4,
      when: s.meetingDate || '',
      studentId: s.id,
      studentName: s.name,
      color: s.color,
      detail: 'IEP / meeting',
    })
  }

  for (const p of packets) {
    if (!inWeek(p.meetingDate, start, end)) continue
    const key = `${p.studentId}-${p.meetingDate}`
    if (seenIep.has(key)) continue
    seenIep.add(key)
    const d = startOfLocalDay(new Date(`${p.meetingDate}T12:00:00`))
    const dayIndex = ((d.getDay() + 6) % 7) as number
    if (dayIndex > 4) continue
    items.push({
      id: `prep-${p.id}`,
      kind: 'iep',
      dayLabel: DAY_LABELS[dayIndex as 0 | 1 | 2 | 3 | 4],
      dayIndex: dayIndex as 0 | 1 | 2 | 3 | 4,
      when: p.meetingDate || '',
      studentId: p.studentId,
      studentName: p.studentName || students.find((s) => s.id === p.studentId)?.name || 'Student',
      color: studentColor(students, p.studentId),
      detail: p.purpose || 'Meeting prep',
    })
  }

  items.sort((a, b) => a.dayIndex - b.dayIndex || a.when.localeCompare(b.when))

  const byDay = DAY_LABELS.map((dayLabel, dayIndex) => ({
    dayLabel,
    dayIndex,
    items: items.filter((i) => i.dayIndex === dayIndex),
  })).filter((g) => g.items.length > 0)

  return { total: items.length, byDay }
}

export function buildWeekDues(opts: {
  students: Student[]
  sessions: ProbeSession[]
  now?: Date
}): WeekDueItem[] {
  const { students, sessions, now = new Date() } = opts
  const { start, end } = currentSchoolWeek(now)
  const dues: WeekDueItem[] = []

  for (const s of students) {
    const annual = s.hasIEP ? s.iepDue : s.section504Due
    if (inWeek(annual, start, end)) {
      const days = daysUntil(annual || undefined) ?? 0
      dues.push({
        id: `annual-${s.id}`,
        label: s.hasIEP ? 'IEP annual' : '504 annual',
        studentId: s.id,
        studentName: s.name,
        color: s.color,
        dueDate: annual || '',
        days,
        href: '/caseload',
      })
    }
    if (inWeek(s.reevalDue, start, end)) {
      dues.push({
        id: `reeval-${s.id}`,
        label: 'Reevaluation',
        studentId: s.id,
        studentName: s.name,
        color: s.color,
        dueDate: s.reevalDue,
        days: daysUntil(s.reevalDue) ?? 0,
        href: '/evaluations',
      })
    }
  }

  for (const alert of buildProgressAlerts(students, sessions, isoDate(now))) {
    if (!alert.nextDue || !inWeek(alert.nextDue, start, end)) continue
    if (alert.severity === 'ok' && !inWeek(alert.nextDue, start, end)) continue
    const s = students.find((x) => x.id === alert.studentId)
    dues.push({
      id: `probe-${alert.studentId}-${alert.nextDue}`,
      label: alert.reason,
      studentId: alert.studentId,
      studentName: alert.studentName,
      color: s?.color || '#FEF3C7',
      dueDate: alert.nextDue,
      days: daysUntil(alert.nextDue) ?? 0,
      href: '/progress',
    })
  }

  dues.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return dues
}

export function weekRangeLabel(now = new Date()): string {
  const { start, end } = currentSchoolWeek(now)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Denver' })
  return `${fmt(start)} – ${fmt(end)}`
}

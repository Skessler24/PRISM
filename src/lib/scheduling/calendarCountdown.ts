/** Next day-off / break countdown from the district calendar JSON. */

import calendarJson from '../../../district-profiles/cherry-creek-calendar-2026-27.json'

export type CalendarEvent = {
  id: string
  title: string
  type: string
  start: string
  end: string
  studentSchool?: boolean
}

export type CountdownTarget = {
  id: string
  title: string
  shortLabel: string
  start: string
  end: string
  daysUntil: number
  emoji: string
  type: string
}

const EVENTS = (calendarJson as { events: CalendarEvent[] }).events

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function shortLabel(title: string): string {
  const t = title.replace(/\s*—\s*No School.*/i, '').replace(/\s*No School.*/i, '').trim()
  if (/fall break/i.test(t)) return 'Fall Break'
  if (/winter break/i.test(t)) return 'Winter Break'
  if (/spring break/i.test(t)) return 'Spring Break'
  if (/thanksgiving/i.test(t)) return 'Thanksgiving Break'
  if (/labor day/i.test(t)) return 'Labor Day'
  if (/memorial day/i.test(t)) return 'Memorial Day'
  if (/presidents/i.test(t)) return "Presidents' Day"
  if (/martin luther/i.test(t)) return 'MLK Day'
  if (/non-contact/i.test(t)) return 'Non-contact day'
  return t
}

function emojiFor(title: string, type: string): string {
  if (/fall break/i.test(title)) return '🍂'
  if (/winter break/i.test(title)) return '❄️'
  if (/spring break/i.test(title)) return '🌸'
  if (/thanksgiving/i.test(title)) return '🦃'
  if (/labor|memorial|presidents|martin luther/i.test(title)) return '📅'
  if (type === 'k12_noncontact' || type === 'k8_conferences') return '📝'
  return '⏳'
}

/** Prefer named breaks; otherwise next student no-school / non-contact day. */
export function nextCountdown(from = new Date()): CountdownTarget | null {
  const upcoming = EVENTS.map((e) => {
    const start = parseYmd(e.start)
    const days = daysBetween(from, start)
    return { e, days }
  })
    .filter(({ days, e }) => {
      if (days < 0) return false
      if (e.studentSchool === true && e.type === 'school_starts') return false
      return (
        e.type === 'no_school' ||
        e.type === 'k12_noncontact' ||
        e.type === 'k8_conferences' ||
        /break/i.test(e.title)
      )
    })
    .sort((a, b) => a.days - b.days)

  if (!upcoming.length) return null

  const breakHit = upcoming.find(({ e }) => /break/i.test(e.title))
  const pick = breakHit && breakHit.days <= 120 ? breakHit : upcoming[0]
  const { e, days } = pick
  return {
    id: e.id,
    title: e.title,
    shortLabel: shortLabel(e.title),
    start: e.start,
    end: e.end,
    daysUntil: days,
    emoji: emojiFor(e.title, e.type),
    type: e.type,
  }
}

export function formatCountdownBadge(c: CountdownTarget): string {
  if (c.daysUntil === 0) return `${c.emoji} ${c.shortLabel} starts today!`
  if (c.daysUntil === 1) return `${c.emoji} ${c.shortLabel} tomorrow!`
  return `${c.emoji} ${c.shortLabel} in ${c.daysUntil} days`
}

/** District no-school dates (inclusive ranges) for schedule overlays. */
export function noSchoolDatesOnWeek(weekStartMonday: Date): { date: string; title: string }[] {
  const out: { date: string; title: string }[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStartMonday)
    d.setDate(weekStartMonday.getDate() + i)
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    for (const e of EVENTS) {
      if (e.studentSchool === true) continue
      if (
        e.type === 'no_school' ||
        e.type === 'k12_noncontact' ||
        e.type === 'k8_conferences' ||
        e.type === 'teacher_work'
      ) {
        if (ymd >= e.start && ymd <= e.end) {
          out.push({ date: ymd, title: e.title })
          break
        }
      }
    }
  }
  return out
}

export function mondayOf(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

/** CSV helpers for school schedule + roster imports. */

import {
  TEAM_DAYS,
  gid,
  type MasterConstraint,
  type TeamDay,
} from './teamStore'

export function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let cur = ''
  let inQ = false
  const pushCell = () => {
    if (lines.length === 0) lines.push([cur.trim()])
    else lines[lines.length - 1].push(cur.trim())
    cur = ''
  }
  const pushRow = () => {
    if (lines.length === 0) return
    if (lines[lines.length - 1].some((v) => v)) lines.push([])
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (inQ && i + 1 < text.length && text[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQ = !inQ
      }
    } else if ((c === ',' || c === '\n' || c === '\r') && !inQ) {
      if (c === ',') pushCell()
      else {
        pushCell()
        if (c === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++
        pushRow()
      }
    } else {
      if (lines.length === 0) lines.push([])
      cur += c
    }
  }
  if (cur.trim() || (lines.length && lines[lines.length - 1].length)) pushCell()
  return lines.filter((r) => r.some((v) => v))
}

/** Normalize "8:00", "08:00", "8:00 AM", "800" → "H:MM" (no leading zero on hour). */
export function normalizeTime(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?$/i)
  if (ampm) {
    let h = Number(ampm[1])
    const m = Number(ampm[2])
    const ap = (ampm[3] || '').toLowerCase()
    if (ap.startsWith('p') && h < 12) h += 12
    if (ap.startsWith('a') && h === 12) h = 0
    if (m < 0 || m > 59 || h < 0 || h > 23) return null
    return `${h}:${String(m).padStart(2, '0')}`
  }
  const bare = s.match(/^(\d{1,2})(\d{2})$/)
  if (bare) {
    const h = Number(bare[1])
    const m = Number(bare[2])
    if (m > 59 || h > 23) return null
    return `${h}:${String(m).padStart(2, '0')}`
  }
  return null
}

export function normalizeDay(raw: string): TeamDay | 'All' | null {
  const s = raw.trim().toLowerCase()
  if (!s) return null
  if (s === 'all' || s === 'every' || s === '*') return 'All'
  const map: Record<string, TeamDay> = {
    m: 'Monday',
    mon: 'Monday',
    monday: 'Monday',
    t: 'Tuesday',
    tu: 'Tuesday',
    tue: 'Tuesday',
    tues: 'Tuesday',
    tuesday: 'Tuesday',
    w: 'Wednesday',
    wed: 'Wednesday',
    wednesday: 'Wednesday',
    r: 'Thursday',
    th: 'Thursday',
    thu: 'Thursday',
    thur: 'Thursday',
    thurs: 'Thursday',
    thursday: 'Thursday',
    f: 'Friday',
    fri: 'Friday',
    friday: 'Friday',
  }
  return map[s] || null
}

export function normalizeConstraintType(raw: string): string {
  const s = raw.trim().toLowerCase()
  if (!s) return 'blocked'
  if (s.includes('lunch')) return 'lunch'
  if (s.includes('special') || s.includes('elective') || s.includes('pe') || s.includes('art') || s.includes('music'))
    return 'specials'
  if (s.includes('assembl')) return 'assembly'
  if (s.includes('test')) return 'testing'
  if (s.includes('iep')) return 'iep-day'
  if (s.includes('protect')) return 'protected'
  if (s.includes('recess')) return 'specials'
  return s.replace(/\s+/g, '-') || 'blocked'
}

export type MasterCsvRow = {
  day: TeamDay | 'All'
  startTime: string
  endTime: string
  type: string
  label: string
}

/**
 * Expected format (header optional):
 * Day, StartTime, EndTime, Type, Label
 */
export function parseMasterScheduleRows(rows: string[][]): {
  constraints: MasterConstraint[]
  skipped: number
  errors: string[]
} {
  if (rows.length === 0) return { constraints: [], skipped: 0, errors: ['Empty CSV'] }
  let start = 0
  const h0 = rows[0].map((c) => c.toLowerCase())
  if (h0.some((c) => c.includes('day') || c.includes('start'))) start = 1

  const constraints: MasterConstraint[] = []
  const errors: string[] = []
  let skipped = 0

  for (let i = start; i < rows.length; i++) {
    const row = rows[i]
    const day = normalizeDay(row[0] || '')
    const startTime = normalizeTime(row[1] || '')
    const endTime = normalizeTime(row[2] || '')
    if (!day || !startTime || !endTime) {
      skipped++
      errors.push(`Row ${i + 1}: need Day, StartTime, EndTime`)
      continue
    }
    const type = normalizeConstraintType(row[3] || 'blocked')
    const label = (row[4] || '').trim() || type
    constraints.push({
      id: gid(),
      day,
      startTime,
      endTime,
      type,
      label,
      affectsAll: true,
    })
  }
  return { constraints, skipped, errors }
}

export const SAMPLE_SCHOOL_SCHEDULE_CSV = [
  'Day,StartTime,EndTime,Type,Label',
  'All,12:00,12:30,lunch,Lunch',
  'Monday,10:00,10:30,specials,PE',
  'Wednesday,10:00,10:30,specials,PE',
  'Friday,10:00,10:30,specials,PE',
  'Tuesday,9:30,10:00,specials,Art',
  'Thursday,9:30,10:00,specials,Art',
  'All,14:30,15:00,protected,Dismissal prep',
].join('\n')

export function downloadSampleSchoolSchedule() {
  const blob = new Blob([SAMPLE_SCHOOL_SCHEDULE_CSV], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'prism-sample-school-schedule.csv'
  a.click()
}

/** Expand "All" for display / slot checks already handled in isConstrained. */
export function dayList(day: TeamDay | 'All'): TeamDay[] {
  return day === 'All' ? [...TEAM_DAYS] : [day]
}

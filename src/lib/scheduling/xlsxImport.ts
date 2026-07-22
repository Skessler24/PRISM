/**
 * Read school-schedule Excel workbooks (.xlsx) into row grids for constraint import.
 * Browser-only — real schedules stay in localStorage, never commit PII/rosters.
 */

import * as XLSX from 'xlsx'
import {
  normalizeConstraintType,
  normalizeDay,
  normalizeTime,
  parseCSV,
  parseMasterScheduleRows,
} from './csv'
import { gid, type MasterConstraint, type TeamDay } from './teamStore'

export async function workbookToSheetRows(file: File): Promise<{ name: string; rows: string[][] }[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  return wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name]
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][]
    return {
      name,
      rows: rows.map((r) => r.map((c) => String(c ?? '').trim())),
    }
  })
}

function looksLikeMasterHeader(row: string[]): boolean {
  const joined = row.map((c) => c.toLowerCase()).join('|')
  return joined.includes('day') && (joined.includes('start') || joined.includes('time'))
}

function looksLikePeriodHeader(row: string[]): boolean {
  const lower = row.map((c) => c.toLowerCase())
  const hasStart = lower.some((c) => c.includes('start') || c === 'from' || c === 'begin')
  const hasEnd = lower.some((c) => c.includes('end') || c === 'to' || c === 'until')
  const hasLabel = lower.some(
    (c) =>
      c.includes('period') ||
      c.includes('block') ||
      c.includes('bell') ||
      c.includes('activity') ||
      c.includes('subject') ||
      c.includes('label') ||
      c.includes('name') ||
      c.includes('time'),
  )
  return hasStart && hasEnd && (hasLabel || lower.some((c) => c.includes('time')))
}

/**
 * Heuristic parse for ARR instructional / bell schedules when Day column is missing
 * or the sheet is a period table. Protected times = lunch, specials, recess, etc.
 * Instructional periods are skipped (they're available teaching time).
 */
export function parseInstructionalSheet(rows: string[][]): MasterConstraint[] {
  if (!rows.length) return []

  // Path A: already Day,Start,End,Type,Label
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    if (looksLikeMasterHeader(rows[i])) {
      const { constraints } = parseMasterScheduleRows(rows.slice(i))
      if (constraints.length) return constraints
    }
  }

  // Path B: period table with Start/End
  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    if (looksLikePeriodHeader(rows[i])) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) return []

  const header = rows[headerIdx].map((c) => c.toLowerCase())
  const startCol = header.findIndex((c) => c.includes('start') || c === 'from' || c === 'begin')
  const endCol = header.findIndex((c) => c.includes('end') || c === 'to' || c === 'until')
  const labelCol = header.findIndex(
    (c) =>
      c.includes('period') ||
      c.includes('block') ||
      c.includes('activity') ||
      c.includes('subject') ||
      c.includes('label') ||
      c.includes('name') ||
      c.includes('bell'),
  )
  const typeCol = header.findIndex((c) => c.includes('type') || c.includes('category'))
  const dayCol = header.findIndex((c) => c === 'day' || c.includes('weekday'))

  const out: MasterConstraint[] = []
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || !row.some((c) => c)) continue
    const startTime = normalizeTime(row[startCol] || '')
    const endTime = normalizeTime(row[endCol] || '')
    if (!startTime || !endTime) continue
    const label = (labelCol >= 0 ? row[labelCol] : row[0] || '').trim() || 'Block'
    const typeRaw = typeCol >= 0 ? row[typeCol] : label
    const type = normalizeConstraintType(typeRaw)

    // Only import non-instructional / protected blocks from a full bell schedule
    const protect =
      /lunch|recess|special|elective|pe\b|art|music|library|assembly|transition|passing|advisory|homeroom|dismissal|arrival|breakfast|intervention block|plan/i.test(
        `${label} ${typeRaw}`,
      ) || ['lunch', 'specials', 'assembly', 'testing', 'protected', 'blocked', 'iep-day'].includes(type)

    if (!protect) continue

    const dayRaw = dayCol >= 0 ? row[dayCol] : 'All'
    const day = (normalizeDay(dayRaw || 'All') || 'All') as TeamDay | 'All'

    out.push({
      id: gid(),
      day,
      startTime,
      endTime,
      type: type === 'blocked' && /lunch/i.test(label) ? 'lunch' : type,
      label,
      affectsAll: day === 'All',
    })
  }
  return out
}

export async function constraintsFromScheduleFile(file: File): Promise<{
  constraints: MasterConstraint[]
  sheetSummaries: { name: string; count: number }[]
}> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await file.text()
    const rows = parseCSV(text)
    const { constraints } = parseMasterScheduleRows(rows)
    const fallback = constraints.length ? constraints : parseInstructionalSheet(rows)
    return {
      constraints: fallback,
      sheetSummaries: [{ name: file.name, count: fallback.length }],
    }
  }

  const sheets = await workbookToSheetRows(file)
  const all: MasterConstraint[] = []
  const sheetSummaries: { name: string; count: number }[] = []
  for (const sheet of sheets) {
    let found = parseMasterScheduleRows(sheet.rows).constraints
    if (!found.length) found = parseInstructionalSheet(sheet.rows)
    sheetSummaries.push({ name: sheet.name, count: found.length })
    all.push(...found)
  }
  return { constraints: all, sheetSummaries }
}

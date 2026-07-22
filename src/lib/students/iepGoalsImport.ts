/**
 * Enrich "IEP Goals Report" (.xlsx) → merge goals onto caseload students.
 * Browser-only — never commit real goal exports (FERPA).
 */

import * as XLSX from 'xlsx'
import { formatStudentName } from './arrImport'
import { uniqueStudentId } from './crud'
import type { Student } from './types'

const STUDENT_COLORS = [
  '#AEE4FF',
  '#C8F7C5',
  '#FFE5B4',
  '#F8C8DC',
  '#E0D4FF',
  '#FFD6A5',
  '#B8F2E6',
  '#FFADAD',
]

export type IepGoalRow = {
  area: string
  statement: string
  isMet: boolean
  progressMonitored: boolean
  grade: string
  lasid: string
  rawName: string
  name: string
  school: string
  caseManager: string
}

export type IepGoalsStudentBundle = {
  lasid: string
  rawName: string
  name: string
  grade: string
  school: string
  caseManager: string
  /** Display lines: "Reading: By January…" */
  goals: string[]
  areas: string[]
  metCount: number
  openCount: number
}

const COL = {
  area: 'goal > goal area',
  statement: 'goal > goal statement',
  isMet: 'goal > is met',
  monitored: 'goal > progress monitored',
  grade: 'student > grade level (current)',
  id: 'student > id',
  name: 'student > name (legal)',
  school: 'student > school (current)',
  leader: 'sped > team leader',
} as const

function nameKey(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function decodeEntities(raw: string): string {
  return String(raw || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&rsquo;|&apos;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

/** Collapse Enrich rubric padding into a readable goal line. */
export function cleanGoalStatement(raw: string, maxLen = 420): string {
  let s = decodeEntities(raw)
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  // Cut before embedded scoring rubrics
  s = s.replace(
    /\n*\s*(Social-Emotional Learning Rubric|Reading Rubric|Math Rubric|Unable to Demonstrate)[\s\S]*$/i,
    '',
  )
  // Drop long rubric tables that follow blank lines after the measurable aim
  const parts = s
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length > 1) {
    const keep: string[] = []
    for (const p of parts) {
      if (/unable to demonstrate|emerging skill|partially proficient|rubric\s*-/i.test(p)) break
      keep.push(p)
      if (keep.join(' ').length > maxLen) break
    }
    s = keep.join(' · ')
  }
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > maxLen) s = `${s.slice(0, maxLen - 1).trim()}…`
  return s
}

function mapGrade(raw: string): string {
  const g = String(raw || '').trim()
  const m = g.match(/grade\s*0*(\d+)/i)
  if (m) {
    const n = Number(m[1])
    if (n === 0) return 'K'
    return `Gr${n}`
  }
  if (/kind/i.test(g)) return 'K'
  return g || '—'
}

function yesNo(raw: string): boolean {
  return /^(yes|y|true|1)$/i.test(String(raw || '').trim())
}

function normalizeHeader(h: string): string {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function findCol(headers: string[], want: string): number {
  const idx = headers.findIndex((h) => normalizeHeader(h) === want)
  if (idx >= 0) return idx
  // soft match: last segment
  const needle = want.split('>').pop()?.trim() || want
  return headers.findIndex((h) => normalizeHeader(h).includes(needle))
}

export function parseIepGoalsSheetRows(rows: string[][]): IepGoalRow[] {
  if (!rows.length) return []
  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const joined = rows[i].map(normalizeHeader).join('|')
    if (joined.includes('goal statement') && joined.includes('student') && joined.includes('name')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) {
    throw new Error(
      'Could not find IEP Goals Report header (need Goal Statement + Student Name columns).',
    )
  }
  const headers = rows[headerIdx].map((h) => String(h || ''))
  const cArea = findCol(headers, COL.area)
  const cStmt = findCol(headers, COL.statement)
  const cMet = findCol(headers, COL.isMet)
  const cMon = findCol(headers, COL.monitored)
  const cGrade = findCol(headers, COL.grade)
  const cId = findCol(headers, COL.id)
  const cName = findCol(headers, COL.name)
  const cSchool = findCol(headers, COL.school)
  const cLead = findCol(headers, COL.leader)

  if (cStmt < 0 || cName < 0) {
    throw new Error('IEP Goals Report missing Goal Statement or Student Name column.')
  }

  const out: IepGoalRow[] = []
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const cells = rows[r] || []
    const rawName = String(cells[cName] || '').trim()
    const statement = cleanGoalStatement(String(cells[cStmt] || ''))
    if (!rawName || !statement) continue
    const area = decodeEntities(String(cArea >= 0 ? cells[cArea] : ''))
      .replace(/\\/g, '/')
      .trim()
    out.push({
      area: area || 'Goal',
      statement,
      isMet: cMet >= 0 ? yesNo(String(cells[cMet] || '')) : false,
      progressMonitored: cMon >= 0 ? yesNo(String(cells[cMon] || '')) : true,
      grade: mapGrade(String(cGrade >= 0 ? cells[cGrade] : '')),
      lasid: String(cId >= 0 ? cells[cId] : '')
        .replace(/\.0$/, '')
        .trim(),
      rawName,
      name: formatStudentName(rawName),
      school: String(cSchool >= 0 ? cells[cSchool] : '').trim(),
      caseManager: formatStudentName(String(cLead >= 0 ? cells[cLead] : '').trim()),
    })
  }
  return out
}

export function bundleIepGoalsByStudent(rows: IepGoalRow[]): IepGoalsStudentBundle[] {
  const map = new Map<string, IepGoalsStudentBundle>()
  for (const row of rows) {
    const key = row.lasid || nameKey(row.rawName) || nameKey(row.name)
    if (!key) continue
    let b = map.get(key)
    if (!b) {
      b = {
        lasid: row.lasid,
        rawName: row.rawName,
        name: row.name,
        grade: row.grade,
        school: row.school,
        caseManager: row.caseManager,
        goals: [],
        areas: [],
        metCount: 0,
        openCount: 0,
      }
      map.set(key, b)
    }
    const line = `${row.area}: ${row.statement}${row.isMet ? ' (met)' : ''}`
    if (!b.goals.includes(line)) b.goals.push(line)
    if (row.area && !b.areas.includes(row.area)) b.areas.push(row.area)
    if (row.isMet) b.metCount++
    else b.openCount++
    if (!b.caseManager && row.caseManager) b.caseManager = row.caseManager
    if (!b.grade || b.grade === '—') b.grade = row.grade
  }
  return [...map.values()].map((b) => ({
    ...b,
    goals: b.goals.slice(0, 16),
  }))
}

export async function parseIepGoalsReportFile(file: File): Promise<IepGoalsStudentBundle[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) throw new Error('Workbook has no sheets')
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][]
  const grid = rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '')) : []))
  const parsed = parseIepGoalsSheetRows(grid)
  if (!parsed.length) throw new Error('No goal rows found under the header.')
  return bundleIepGoalsByStudent(parsed)
}

export type MergeIepGoalsResult = {
  students: Student[]
  matched: number
  added: number
  goalLines: number
  bundles: number
}

/**
 * Merge Enrich IEP Goals Report onto caseload.
 * - Match by LASID first, then legal/display name
 * - Replace goals when report has goals for that student
 * - Optionally add missing students (stubs) so ARR-only gaps still get goals
 */
export function mergeIepGoalsIntoCaseload(
  existing: Student[],
  bundles: IepGoalsStudentBundle[],
  mode: 'merge' | 'goals-only' = 'merge',
): MergeIepGoalsResult {
  const list = mode === 'goals-only' && existing.every((s) => s.source === 'demo') ? [] : [...existing]
  let matched = 0
  let added = 0
  let goalLines = 0

  for (const b of bundles) {
    goalLines += b.goals.length
    const byLasid = b.lasid
      ? list.findIndex((s) => s.lasid && s.lasid === b.lasid)
      : -1
    const byName =
      byLasid < 0
        ? list.findIndex(
            (s) =>
              nameKey(s.name) === nameKey(b.name) ||
              nameKey(s.rawName || '') === nameKey(b.rawName) ||
              nameKey(s.name) === nameKey(b.rawName),
          )
        : -1
    const idx = byLasid >= 0 ? byLasid : byName

    if (idx >= 0) {
      const prev = list[idx]
      list[idx] = {
        ...prev,
        lasid: prev.lasid || b.lasid,
        rawName: prev.rawName || b.rawName,
        name: prev.name || b.name,
        grade: prev.grade && prev.grade !== '—' ? prev.grade : b.grade,
        caseManager:
          prev.caseManager && prev.caseManager !== 'Unassigned'
            ? prev.caseManager
            : b.caseManager || prev.caseManager,
        teacher: prev.teacher && prev.teacher !== '—' ? prev.teacher : b.school || prev.teacher,
        hasIEP: true,
        goals: b.goals.length ? b.goals : prev.goals,
        source:
          prev.source === 'demo'
            ? 'iep-goals-report'
            : prev.source === 'arr-csv' || prev.source === 'enrich-snapshot'
              ? prev.source
              : prev.source || 'iep-goals-report',
      }
      matched++
    } else {
      const id = b.lasid ? `lasid-${b.lasid}` : uniqueStudentId(b.name, list)
      list.push({
        id,
        name: b.name,
        rawName: b.rawName,
        grade: b.grade || '—',
        teacher: b.school || '—',
        discipline: ['Academic'],
        provider: b.caseManager || 'Unassigned',
        caseManager: b.caseManager || 'Unassigned',
        tier: 2,
        iepDue: '',
        reevalDue: '',
        status: 'On Track',
        color: STUDENT_COLORS[list.length % STUDENT_COLORS.length],
        interests: '—',
        triggers: '—',
        calming: '—',
        goals: b.goals,
        accommodations: [],
        disability: '—',
        lastContact: '',
        source: 'iep-goals-report',
        hasIEP: true,
        has504: false,
        hasMLL: false,
        lasid: b.lasid,
      })
      added++
    }
  }

  return { students: list, matched, added, goalLines, bundles: bundles.length }
}

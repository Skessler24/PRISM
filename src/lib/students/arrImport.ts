/** ARR Special Pops CSV → Student[] (browser-only; never commit real files). */

import type { Student } from './types'
import { daysUntil } from './normalizeStudent'

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

function parseCsvText(text: string): string[][] {
  const rows: string[][] = []
  let cur = ''
  let row: string[] = []
  let inQ = false
  const pushCell = () => {
    row.push(cur)
    cur = ''
  }
  const pushRow = () => {
    pushCell()
    if (row.some((c) => String(c).trim())) rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (inQ && text[i + 1] === '"') {
        cur += '"'
        i++
      } else inQ = !inQ
    } else if (c === ',' && !inQ) pushCell()
    else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && text[i + 1] === '\n') i++
      pushRow()
    } else cur += c
  }
  if (cur.length || row.length) pushRow()
  return rows
}

function findCaseloadHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const cells = (rows[i] || []).map((c) => String(c || '').trim().toLowerCase())
    if (
      cells[0] === 'name' &&
      cells.some((c) => c.includes('case manager')) &&
      cells.some((c) => c === 'grade')
    ) {
      return i
    }
  }
  return -1
}

export function parseArrDate(raw: string): string {
  const s = String(raw || '').trim()
  if (!s) return ''
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    let y = +m[3]
    if (y < 100) y += 2000
    return `${y}-${String(+m[1]).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}`
  }
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return ''
}

function mapGrade(raw: string): string {
  const g = String(raw || '').trim().toLowerCase()
  if (!g) return ''
  if (g.includes('kind') || g === '0' || g.startsWith('0 ')) return 'K'
  if (g.startsWith('1')) return 'Gr1'
  if (g.startsWith('2')) return 'Gr2'
  if (g.startsWith('3')) return 'Gr3'
  if (g.startsWith('4')) return 'Gr4'
  if (g.startsWith('5')) return 'Gr5'
  if (g.startsWith('6')) return 'Gr6'
  return String(raw).trim()
}

export function formatStudentName(raw: string): string {
  const s = String(raw || '').trim()
  const m = s.match(/^([^,]+),\s*([^(]+?)(?:\s*\(([^)]+)\))?\s*$/)
  if (!m) return s
  const last = m[1].trim()
  const first = m[2].trim()
  const nick = (m[3] || '').trim()
  if (nick) return `${nick} ${last}`
  return `${first} ${last}`
}

function slugId(name: string, idx: number): string {
  const base = String(name || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${base || 'student'}-${idx}`
}

function flagTrue(v: unknown): boolean {
  const s = String(v || '')
    .trim()
    .toUpperCase()
  return s === 'TRUE' || s === 'YES' || s === 'Y' || s === '1' || s === 'X'
}

function programFromCM(cm: string): string {
  const s = String(cm || '').trim().toLowerCase()
  if (s.startsWith('mod')) return 'Mod'
  if (s.startsWith('ilc')) return 'ILC'
  if (s.startsWith('2e')) return '2e'
  if (s.startsWith('slp')) return 'SLP'
  return 'SPED'
}

function iepStatusFromDate(iso: string): string {
  if (!iso) return 'On Track'
  const days = daysUntil(iso)
  if (typeof days !== 'number') return 'On Track'
  if (days < 0) return 'Overdue'
  if (days <= 45) return 'Upcoming'
  return 'On Track'
}

function mapArrRowToStudent(obj: Record<string, string>, idx: number): Student {
  const discFlags = ['SLP', 'OT', 'PT', 'MH', 'NSS', 'ELA', 'Nurse', 'DHH', 'Vision']
  const discipline: string[] = []
  discFlags.forEach((f) => {
    if (flagTrue(obj[f])) discipline.push(f)
  })
  if (flagTrue(obj.BIP)) discipline.push('Behavior')
  if (!discipline.length) {
    const prog = programFromCM(obj['Case Manager'])
    if (prog === 'SLP') discipline.push('SLP')
    else if (prog === 'Mod' || prog === 'ILC' || prog === '2e') discipline.push('Academic')
  }
  const iepDue = parseArrDate(obj['IEP Date'])
  const reevalDue = parseArrDate(obj['Re-evaluation Date'])
  const name = formatStudentName(obj.Name)
  const cm = (obj['Case Manager'] || '').trim()
  const program = programFromCM(cm)
  const has504 =
    flagTrue(obj['504']) || flagTrue(obj['Section 504']) || flagTrue(obj['Has 504'])
  const hasMLL = flagTrue(obj.ELA) || flagTrue(obj.MLL) || flagTrue(obj.EL)
  const hasIEP = !(flagTrue(obj['504 Only']) || flagTrue(obj['No IEP']))
  const section504Due =
    parseArrDate(obj['504 Review Date']) || parseArrDate(obj['504 Date']) || ''

  return {
    id: slugId(name, idx),
    name,
    rawName: (obj.Name || '').trim(),
    grade: mapGrade(obj.Grade),
    teacher: (obj.Teacher || '').trim(),
    discipline,
    provider: cm || 'Unassigned',
    caseManager: cm,
    tier: discipline.includes('Behavior') ? 3 : 2,
    iepDue,
    reevalDue,
    meetingDate: parseArrDate(obj['New Scheduled Meeting Date']),
    status: iepStatusFromDate(iepDue || (has504 ? section504Due : '')),
    color: STUDENT_COLORS[idx % STUDENT_COLORS.length],
    interests: '—',
    triggers: '—',
    calming: '—',
    goals: [],
    accommodations: [],
    disability: program,
    lastContact: '',
    fallEval: flagTrue(obj['Fall 2026 Evals']),
    source: 'arr-csv',
    hasIEP,
    has504,
    hasMLL,
    hasBip: flagTrue(obj.BIP),
    homeLanguage: (obj['Home Language'] || obj['Primary Language'] || '').trim(),
    eldLevel: (obj['ELD Level'] || obj.ELD || '').trim(),
    interpreterNeeded: flagTrue(obj.Interpreter) || flagTrue(obj['Interpreter Needed']),
    section504Due,
    section504Impairment: (obj['504 Impairment'] || obj.Impairment || '').trim(),
  }
}

export function studentsFromArrCsv(text: string): Student[] {
  const rows = parseCsvText(text.replace(/^\uFEFF/, ''))
  const hi = findCaseloadHeaderRow(rows)
  if (hi < 0) {
    throw new Error(
      'Could not find caseload header row (need Name, Case Manager, Grade columns).',
    )
  }
  const hdr = rows[hi].map((h) => String(h || '').trim())
  const out: Student[] = []
  for (let r = hi + 1; r < rows.length; r++) {
    const cells = rows[r] || []
    if (!String(cells[0] || '').trim()) continue
    const obj: Record<string, string> = {}
    hdr.forEach((h, i) => {
      obj[h] = String(cells[i] || '').trim()
    })
    out.push(mapArrRowToStudent(obj, out.length))
  }
  if (!out.length) throw new Error('No student rows found under the header.')
  return out
}

/**
 * Enrich Student Profile Snapshot PDF → student fields (browser-only).
 * Real snapshot PDFs must never be committed — parse in-browser via pdf.js.
 */

import type { Student } from './types'
import { formatStudentName, parseArrDate } from './arrImport'
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

export type EnrichSnapshotParsed = {
  rawName: string
  name: string
  dob: string
  lasid: string
  sasid: string
  meetingDate: string
  disability: string
  secondaryDisability: string
  hasBip: boolean
  accommodations: string[]
  goals: string[]
  speechMinutesMonthly: number | null
}

function toIso(mdy: string): string {
  return parseArrDate(mdy)
}

function cleanName(raw: string): string {
  let s = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
  // Address / district bleed from PDF text layer
  s = s.replace(/^CO\s+\d{5}\s+/i, '')
  s = s.replace(/^Cherry Creek School District\s*/i, '')
  s = s.replace(/^\d{4,}\s+[A-Za-z].{0,40}?(?=[A-Z][a-z]+,)/, '')
  return s.trim()
}

/** Parse one or more snapshot pages of concatenated text into student records. */
export function parseEnrichSnapshotText(fullText: string): EnrichSnapshotParsed[] {
  const byLasid = new Map<string, EnrichSnapshotParsed>()

  // Anchor on Enrich's column label row, then walk back for Name DOB LASID SASID Meeting
  const labelRe = /Legal Name of Student\s+DOB\s+LASID\s+SASID\s+Date of Meeting/gi
  const labelHits: number[] = []
  for (const m of fullText.matchAll(labelRe)) {
    if (typeof m.index === 'number') labelHits.push(m.index)
  }

  type Hit = {
    rawName: string
    dob: string
    lasid: string
    sasid: string
    meeting: string
    index: number
  }
  const hits: Hit[] = []

  for (const li of labelHits) {
    const before = fullText.slice(Math.max(0, li - 240), li)
    const hm = before.match(
      /([A-Za-z][\w'.-]+(?:\s+[A-Za-z][\w'.-]+)*(?:,\s*[A-Za-z][\w'.-]+(?:\s+[A-Za-z][\w'.-]+)*)+)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{5,})\s+(\d{5,})\s+(\d{2}\/\d{2}\/\d{4})\s*$/,
    )
    if (!hm) continue
    const rawName = cleanName(hm[1])
    if (rawName.length < 5 || /cherry creek/i.test(rawName)) continue
    hits.push({
      rawName,
      dob: hm[2],
      lasid: hm[3],
      sasid: hm[4],
      meeting: hm[5],
      index: li - hm[0].length,
    })
  }

  // Fallback if labels were flattened differently by the PDF extractor
  if (!hits.length) {
    for (const m of fullText.matchAll(
      /([A-Za-z][\w'.-]+,\s*[A-Za-z][\w'.-]+(?:\s+[A-Za-z][\w'.-]+)?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{5,})\s+(\d{5,})\s+(\d{2}\/\d{2}\/\d{4})/g,
    )) {
      const rawName = cleanName(m[1])
      if (rawName.length < 5 || /cherry creek/i.test(rawName)) continue
      hits.push({
        rawName,
        dob: m[2],
        lasid: m[3],
        sasid: m[4],
        meeting: m[5],
        index: m.index ?? 0,
      })
    }
  }

  const seen = new Set<string>()
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i]
    const start = h.index
    const end =
      i + 1 < hits.length ? hits[i + 1].index : Math.min(fullText.length, start + 9000)
    const block = fullText.slice(start, end)

    const primary = block.match(/Primary Disability:\s*([^\n]+)/)
    const secondary = block.match(/Secondary Disabilities:\s*([^\n]+)/)
    const bip = block.match(/Behavior Plan:\s*(Yes|No)/i)

    const prev = byLasid.get(h.lasid)
    const goals = prev ? [...prev.goals] : []
    for (const gm of block.matchAll(
      /Measurable Goal:\s*([\s\S]+?)(?=Goal \d+|Area of Need:|Special Education Service|ELIGIBILITY|Legal Name of Student|$)/g,
    )) {
      const g = gm[1].replace(/\s+/g, ' ').trim()
      if (g.length > 25 && !goals.includes(g)) goals.push(g.slice(0, 500))
    }

    const accommodations = prev ? [...prev.accommodations] : []
    const accSection = block.match(/Accommodations\s*([\s\S]*?)\s*Modifications/i)
    if (accSection) {
      const lines = accSection[1]
        .split(/\n|(?=·)|(?=\u2022)/)
        .map((l) => l.replace(/^[\s·•\-*]+/, '').trim())
        .filter(
          (l) =>
            l.length > 18 &&
            !/^what type/i.test(l) &&
            !/^note:/i.test(l) &&
            !/^idea /i.test(l) &&
            !/^curricular/i.test(l),
        )
      for (const l of lines) {
        if (!accommodations.includes(l)) accommodations.push(l.slice(0, 300))
      }
    }

    let speech = prev?.speechMinutesMonthly ?? null
    const speechM = block.match(
      /(\d+)\s*minutes\s+(?:monthly|a month|per month)[^.]*?speech/i,
    )
    if (speechM) speech = Number(speechM[1])

    // Prefer the first clean name we saw for this LASID
    if (seen.has(h.lasid) && prev) {
      byLasid.set(h.lasid, {
        ...prev,
        disability: prev.disability || (primary?.[1] || '').trim(),
        secondaryDisability:
          prev.secondaryDisability || (secondary?.[1] || '').trim(),
        hasBip: prev.hasBip || (bip ? /^yes$/i.test(bip[1]) : false),
        goals: goals.slice(0, 12),
        accommodations: accommodations.slice(0, 20),
        speechMinutesMonthly: speech,
      })
      continue
    }
    seen.add(h.lasid)

    byLasid.set(h.lasid, {
      rawName: h.rawName,
      name: formatStudentName(h.rawName),
      dob: toIso(h.dob),
      lasid: h.lasid,
      sasid: h.sasid,
      meetingDate: toIso(h.meeting),
      disability: (primary?.[1] || '').trim(),
      secondaryDisability: (secondary?.[1] || '').trim(),
      hasBip: bip ? /^yes$/i.test(bip[1]) : false,
      accommodations: accommodations.slice(0, 20),
      goals: goals.slice(0, 12),
      speechMinutesMonthly: speech,
    })
  }

  return [...byLasid.values()]
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  // Vite worker
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  const parts: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((it) => ('str' in it ? String(it.str) : ''))
      .join(' ')
    parts.push(line)
  }
  return parts.join('\n')
}

export async function parseEnrichSnapshotFiles(
  files: File[],
): Promise<EnrichSnapshotParsed[]> {
  const merged = new Map<string, EnrichSnapshotParsed>()
  for (const file of files) {
    const text = await extractPdfText(file)
    for (const s of parseEnrichSnapshotText(text)) {
      const prev = merged.get(s.lasid)
      if (!prev) {
        merged.set(s.lasid, s)
        continue
      }
      merged.set(s.lasid, {
        ...prev,
        ...s,
        goals: [...new Set([...prev.goals, ...s.goals])].slice(0, 12),
        accommodations: [...new Set([...prev.accommodations, ...s.accommodations])].slice(
          0,
          20,
        ),
        disability: s.disability || prev.disability,
        secondaryDisability: s.secondaryDisability || prev.secondaryDisability,
        hasBip: s.hasBip || prev.hasBip,
        speechMinutesMonthly: s.speechMinutesMonthly ?? prev.speechMinutesMonthly,
      })
    }
  }
  return [...merged.values()]
}

function nameKey(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function iepStatusFromDate(iso: string): string {
  if (!iso) return 'On Track'
  const days = daysUntil(iso)
  if (typeof days !== 'number') return 'On Track'
  if (days < 0) return 'Overdue'
  if (days <= 45) return 'Upcoming'
  return 'On Track'
}

/** Project annual review ~1 year after meeting when IEP due unknown. */
function guessIepDue(meetingIso: string): string {
  if (!meetingIso) return ''
  const d = new Date(`${meetingIso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export type EnrichMergeResult = {
  students: Student[]
  added: number
  updated: number
  parsed: number
}

/**
 * Merge Enrich snapshot fields into caseload.
 * Prefer match by LASID, then by normalized name.
 */
export function mergeEnrichIntoCaseload(
  existing: Student[],
  parsed: EnrichSnapshotParsed[],
  mode: 'enrich-only' | 'merge' = 'merge',
): EnrichMergeResult {
  const list = mode === 'enrich-only' ? [] : [...existing]
  let added = 0
  let updated = 0

  for (const p of parsed) {
    const byLasid = list.findIndex((s) => s.lasid && s.lasid === p.lasid)
    const byName =
      byLasid < 0
        ? list.findIndex(
            (s) =>
              nameKey(s.name) === nameKey(p.name) ||
              nameKey(s.rawName || '') === nameKey(p.rawName),
          )
        : -1
    const idx = byLasid >= 0 ? byLasid : byName
    const disc: string[] = []
    if (/speech|language/i.test(p.disability + p.secondaryDisability)) disc.push('SLP')
    if (/autism|behavior|emotional/i.test(p.disability)) disc.push('Behavior')
    if (p.hasBip && !disc.includes('Behavior')) disc.push('Behavior')
    if (!disc.length) disc.push('Academic')

    const meetingDate = p.meetingDate
    const iepDue = guessIepDue(meetingDate)

    if (idx >= 0) {
      const prev = list[idx]
      list[idx] = {
        ...prev,
        name: prev.name || p.name,
        rawName: prev.rawName || p.rawName,
        dob: p.dob || prev.dob,
        lasid: p.lasid,
        sasid: p.sasid,
        meetingDate: meetingDate || prev.meetingDate,
        iepDue: prev.iepDue || iepDue,
        status: iepStatusFromDate(prev.iepDue || iepDue),
        disability: p.disability || prev.disability,
        hasBip: p.hasBip || prev.hasBip,
        hasIEP: true,
        goals: p.goals.length ? p.goals : prev.goals,
        accommodations: p.accommodations.length ? p.accommodations : prev.accommodations,
        discipline: [...new Set([...prev.discipline, ...disc])],
        tier: p.hasBip || disc.includes('Behavior') ? 3 : prev.tier,
        source: prev.source === 'demo' ? 'enrich-snapshot' : prev.source,
      }
      updated++
    } else {
      list.push({
        id: `lasid-${p.lasid}`,
        name: p.name,
        rawName: p.rawName,
        grade: '—',
        teacher: '—',
        discipline: disc,
        provider: 'Unassigned',
        caseManager: 'Unassigned',
        tier: p.hasBip || disc.includes('Behavior') ? 3 : 2,
        iepDue,
        reevalDue: '',
        meetingDate,
        status: iepStatusFromDate(iepDue),
        color: STUDENT_COLORS[list.length % STUDENT_COLORS.length],
        interests: '—',
        triggers: '—',
        calming: '—',
        goals: p.goals,
        accommodations: p.accommodations,
        disability: p.disability || '—',
        lastContact: '',
        source: 'enrich-snapshot',
        hasIEP: true,
        has504: false,
        hasMLL: false,
        hasBip: p.hasBip,
        dob: p.dob,
        lasid: p.lasid,
        sasid: p.sasid,
      })
      added++
    }
  }

  return { students: list, added, updated, parsed: parsed.length }
}

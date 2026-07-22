/** Recordable team meeting session + summaries (browser-only until Graph/Teams embed). */

export type MeetingDiscipline =
  | 'SLP'
  | 'OT'
  | 'PT'
  | 'Behavior'
  | 'Mental Health'
  | 'Admin'
  | 'Gen Ed'
  | 'Parent'
  | 'Other'

export type MeetingAgendaItem = {
  id: string
  label: string
  discipline: MeetingDiscipline
  done: boolean
  needsReview: boolean
  studentName?: string
}

export type MeetingSummaryRecord = {
  id: string
  title: string
  duration: string
  startedAt: string
  endedAt: string
  agenda: MeetingAgendaItem[]
  liveNotes: string
  summary: string
  joinUrl?: string
  provider?: string
  /** Linked into Evaluations workflow inbox */
  pushedToEvals: boolean
  hadAudioCapture: boolean
}

const SUMMARIES_KEY = 'prism_meeting_summaries_v1'
const TEMPLATE_KEY = 'prism_meeting_summary_template_v1'

export const DEFAULT_AGENDA: MeetingAgendaItem[] = [
  {
    id: 'a1',
    label: 'Articulation / communication progress update',
    discipline: 'SLP',
    done: false,
    needsReview: false,
  },
  {
    id: 'a2',
    label: 'Fine motor / sensory assessment discussion',
    discipline: 'OT',
    done: false,
    needsReview: false,
  },
  {
    id: 'a3',
    label: 'BIP review and behavior data',
    discipline: 'Behavior',
    done: false,
    needsReview: false,
  },
  {
    id: 'a4',
    label: 'Compliance check, timelines, next steps',
    discipline: 'Admin',
    done: false,
    needsReview: false,
  },
]

/** Built-in “Summarize this meeting” template (vision / Master Plan structure). */
export const DEFAULT_SUMMARY_TEMPLATE = `TEAM MEETING SUMMARY

Meeting: {{title}}
Date: {{date}}
Duration: {{duration}}
Platform: {{provider}}

AGENDA (completed / needs review)
{{agenda}}

DISCUSSION NOTES
{{notes}}

SUMMARY
Write a concise professional SPED team meeting summary that includes:
1. What the team discussed (by topic / discipline)
2. Decisions made
3. Timeline or meeting-date changes (student · old → new)
4. Parent / guardian contacts completed or still needed
5. Evaluation / IEP / eligibility implications (connect to Eval Tracker stages when relevant)
6. Action items with owners (bulleted to-do list for the team)
7. Items that should update Student Tiles, Parent Contact Log, or Caseload

Tone: clear, FERPA-aware (use initials when possible), ready to share with the team and store in SharePoint/Drive.
Do not invent student data that was not mentioned in the notes or agenda.
`

export function loadSummaryTemplate(): string {
  try {
    return localStorage.getItem(TEMPLATE_KEY)?.trim() || DEFAULT_SUMMARY_TEMPLATE
  } catch {
    return DEFAULT_SUMMARY_TEMPLATE
  }
}

export function saveSummaryTemplate(text: string) {
  localStorage.setItem(TEMPLATE_KEY, text.trim() || DEFAULT_SUMMARY_TEMPLATE)
}

export function loadMeetingSummaries(): MeetingSummaryRecord[] {
  try {
    const raw = localStorage.getItem(SUMMARIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MeetingSummaryRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveMeetingSummaries(list: MeetingSummaryRecord[]) {
  localStorage.setItem(SUMMARIES_KEY, JSON.stringify(list))
}

export function upsertMeetingSummary(record: MeetingSummaryRecord) {
  const list = loadMeetingSummaries().filter((x) => x.id !== record.id)
  saveMeetingSummaries([record, ...list].slice(0, 40))
}

export function markSummaryPushedToEvals(id: string) {
  const list = loadMeetingSummaries().map((x) =>
    x.id === id ? { ...x, pushedToEvals: true } : x,
  )
  saveMeetingSummaries(list)
  return list
}

export function formatDuration(totalSeconds: number): string {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function fillSummaryPrompt(opts: {
  template: string
  title: string
  date: string
  duration: string
  provider: string
  agenda: MeetingAgendaItem[]
  notes: string
}): string {
  const agendaBlock = opts.agenda
    .map((a) => {
      const flags = [
        a.done ? '✓ done' : '○ open',
        a.needsReview ? 'needs review' : null,
        a.studentName ? a.studentName : null,
      ]
        .filter(Boolean)
        .join(' · ')
      return `- [${a.discipline}] ${a.label} (${flags})`
    })
    .join('\n')

  return opts.template
    .replaceAll('{{title}}', opts.title)
    .replaceAll('{{date}}', opts.date)
    .replaceAll('{{duration}}', opts.duration)
    .replaceAll('{{provider}}', opts.provider)
    .replaceAll('{{agenda}}', agendaBlock || '(none)')
    .replaceAll('{{notes}}', opts.notes.trim() || '(no typed notes)')
}

export const DISCIPLINES: MeetingDiscipline[] = [
  'SLP',
  'OT',
  'PT',
  'Behavior',
  'Mental Health',
  'Admin',
  'Gen Ed',
  'Parent',
  'Other',
]

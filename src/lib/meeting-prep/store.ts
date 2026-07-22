/** IEP / meeting prep packets — browser-only Companion drafts. */

export type PrepCheckId =
  | 'nom'
  | 'progress'
  | 'soap'
  | 'interpreter'
  | 'agenda'
  | 'drafts'
  | 'rights'

export type AgendaSectionId =
  | 'intros'
  | 'purpose'
  | 'presentLevels'
  | 'goals'
  | 'services'
  | 'accommodations'
  | 'lre'
  | 'esy'
  | 'pwn'
  | 'nextSteps'

export type MeetingPrepPacket = {
  id: string
  studentId: string
  studentName: string
  meetingDate: string
  purpose: string
  checks: Record<PrepCheckId, boolean>
  /** Interactive agenda form fields (headers pre-filled). */
  agendaSections: Record<AgendaSectionId, string>
  notes: string
  packetText: string
  updatedAt: string
}

const KEY = 'prism_meeting_prep_v1'

export const PREP_CHECKS: { id: PrepCheckId; label: string }[] = [
  { id: 'nom', label: 'Legal NOM sent / scheduled (≥ district lead days)' },
  { id: 'progress', label: 'Progress / probe data gathered' },
  { id: 'soap', label: 'Recent service logs ready to summarize' },
  { id: 'interpreter', label: 'Interpreter / language access confirmed (if MLL)' },
  { id: 'agenda', label: 'Agenda drafted from template' },
  { id: 'drafts', label: 'Draft goals / services / PWN notes ready' },
  { id: 'rights', label: 'Parent rights / procedural safeguards available' },
]

/** Fill-in agenda — upload a district template later to replace these headers. */
export const AGENDA_SECTIONS: { id: AgendaSectionId; title: string; placeholder: string }[] = [
  {
    id: 'intros',
    title: '1. Introductions & parent rights',
    placeholder: 'Team members present · rights offered / reviewed…',
  },
  {
    id: 'purpose',
    title: '2. Purpose of meeting',
    placeholder: 'Annual review · eligibility · amendment…',
  },
  {
    id: 'presentLevels',
    title: '3. Present levels (PLAAFP)',
    placeholder: 'Strengths, needs, parent input, classroom data…',
  },
  {
    id: 'goals',
    title: '4. Goals review / proposed goals',
    placeholder: 'Progress on current goals · proposed updates…',
  },
  {
    id: 'services',
    title: '5. Special education & related services',
    placeholder: 'Minutes, frequency, providers…',
  },
  {
    id: 'accommodations',
    title: '6. Accommodations / modifications',
    placeholder: 'Classroom, testing, AT…',
  },
  {
    id: 'lre',
    title: '7. LRE / placement',
    placeholder: 'Setting, continuum discussion…',
  },
  {
    id: 'esy',
    title: '8. ESY determination',
    placeholder: 'Regression / recoupment · decision…',
  },
  {
    id: 'pwn',
    title: '9. Prior Written Notice',
    placeholder: 'Proposals / refusals to document…',
  },
  {
    id: 'nextSteps',
    title: '10. Next steps & signatures',
    placeholder: 'Follow-ups, copy to Enrich, who does what…',
  },
]

function emptyChecks(): Record<PrepCheckId, boolean> {
  return {
    nom: false,
    progress: false,
    soap: false,
    interpreter: false,
    agenda: false,
    drafts: false,
    rights: false,
  }
}

export function emptyAgendaSections(): Record<AgendaSectionId, string> {
  return {
    intros: '',
    purpose: '',
    presentLevels: '',
    goals: '',
    services: '',
    accommodations: '',
    lre: '',
    esy: '',
    pwn: '',
    nextSteps: '',
  }
}

function normalizePacket(raw: MeetingPrepPacket): MeetingPrepPacket {
  return {
    ...raw,
    checks: { ...emptyChecks(), ...(raw.checks || {}) },
    agendaSections: { ...emptyAgendaSections(), ...(raw.agendaSections || {}) },
  }
}

export function loadPrepPackets(): MeetingPrepPacket[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MeetingPrepPacket[]
    return Array.isArray(parsed) ? parsed.map(normalizePacket) : []
  } catch {
    return []
  }
}

export function savePrepPackets(list: MeetingPrepPacket[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)))
}

export function upsertPrep(packet: MeetingPrepPacket) {
  const list = loadPrepPackets().filter((p) => p.id !== packet.id)
  savePrepPackets([{ ...packet, updatedAt: new Date().toISOString() }, ...list])
}

export function defaultPacket(studentId: string, studentName: string, meetingDate = ''): MeetingPrepPacket {
  return {
    id: `prep-${studentId || 'new'}-${Date.now()}`,
    studentId,
    studentName,
    meetingDate,
    purpose: 'Annual IEP review',
    checks: emptyChecks(),
    agendaSections: emptyAgendaSections(),
    notes: '',
    packetText: '',
    updatedAt: new Date().toISOString(),
  }
}

export function formatAgendaSections(sections: Record<AgendaSectionId, string>): string {
  return AGENDA_SECTIONS.map((s) => {
    const body = (sections[s.id] || '').trim() || '________________'
    return `${s.title}\n${body}`
  }).join('\n\n')
}

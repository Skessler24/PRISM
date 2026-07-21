/** IEP / meeting prep packets — browser-only Companion drafts. */

export type PrepCheckId =
  | 'nom'
  | 'progress'
  | 'soap'
  | 'interpreter'
  | 'agenda'
  | 'drafts'
  | 'rights'

export type MeetingPrepPacket = {
  id: string
  studentId: string
  studentName: string
  meetingDate: string
  purpose: string
  checks: Record<PrepCheckId, boolean>
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

export function loadPrepPackets(): MeetingPrepPacket[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MeetingPrepPacket[]
    return Array.isArray(parsed) ? parsed : []
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
    notes: '',
    packetText: '',
    updatedAt: new Date().toISOString(),
  }
}

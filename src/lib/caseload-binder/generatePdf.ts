import { jsPDF } from 'jspdf'
import type { Student } from '../students/types'
import type { SoapNote } from '../session-notes/store'
import type { ProbeSession, ExitTicket } from '../progress-monitoring/store'
import type { GameState } from '../motivation-game/store'
import type { ParentContact } from '../parent-contacts/store'
import type { PlannerSlot } from '../weekly-planner/store'
import { DAY_LABELS, slotsForDay } from '../weekly-planner/store'
import type { WeeklyPlannerState } from '../weekly-planner/store'

export type BinderSection =
  | 'roster'
  | 'contacts'
  | 'progress'
  | 'planner'
  | 'motivation'
  | 'studentPacket'

export const ALL_BINDER_SECTIONS: BinderSection[] = [
  'roster',
  'contacts',
  'progress',
  'planner',
  'motivation',
]

export type BinderInput = {
  districtName: string
  providerName: string
  suiteMode: string
  students: Student[]
  soapNotes: SoapNote[]
  sessions: ProbeSession[]
  tickets: ExitTicket[]
  game: GameState
  parentContacts?: ParentContact[]
  planner?: WeeklyPlannerState
  /** Which sections to include (default: all classic binder pages) */
  sections?: BinderSection[]
  /** When set, filters data to one student and can emit a student packet cover */
  studentId?: string
}

function pageHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(30, 64, 120)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text('PRISM Print Center', 14, 12)
  doc.setFontSize(10)
  doc.text(title, 14, 20)
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.text(subtitle, 14, 36)
}

function ensureSpace(doc: jsPDF, y: number, need: number) {
  if (y + need > 280) {
    doc.addPage()
    return 20
  }
  return y
}

function filterStudents(students: Student[], studentId?: string) {
  if (!studentId) return students
  return students.filter((s) => s.id === studentId)
}

export function downloadCaseloadBinderPdf(input: BinderInput) {
  const sections = input.sections?.length ? input.sections : ALL_BINDER_SECTIONS
  const students = filterStudents(input.students, input.studentId)
  const soapNotes = input.studentId
    ? input.soapNotes.filter((n) => n.studentId === input.studentId)
    : input.soapNotes
  const sessions = input.studentId
    ? input.sessions.filter((n) => n.studentId === input.studentId)
    : input.sessions
  const tickets = input.studentId
    ? input.tickets.filter((n) => n.studentId === input.studentId)
    : input.tickets
  const contacts = (input.parentContacts || []).filter((c) =>
    input.studentId ? c.studentId === input.studentId : true,
  )
  const plannerSlots: PlannerSlot[] = (input.planner?.slots || []).filter((s) =>
    input.studentId ? s.studentId === input.studentId : true,
  )
  const plannerState: WeeklyPlannerState = {
    weekLabel: input.planner?.weekLabel || 'This week',
    slots: plannerSlots,
    updatedAt: input.planner?.updatedAt || new Date().toISOString(),
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const today = new Date().toLocaleDateString('en-US')
  const focus = input.studentId
    ? students[0]?.name || 'Student'
    : `${students.length} students`
  const sub = `${input.districtName} · ${input.providerName} · ${input.suiteMode} · ${focus} · ${today}`
  let started = false

  function newSection(title: string) {
    if (started) doc.addPage()
    started = true
    pageHeader(doc, title, sub)
    return 44
  }

  if (sections.includes('studentPacket') && students[0]) {
    const s = students[0]
    let y = newSection('Student packet')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(s.name, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y += 8
    doc.text(
      `${s.grade} · ${s.teacher} · CM ${s.caseManager || '—'} · ${s.disability}`,
      14,
      y,
    )
    y += 7
    doc.text(
      `Programs: ${[s.hasIEP ? 'IEP' : null, s.has504 ? '504' : null, s.hasMLL ? 'MLL' : null].filter(Boolean).join(' · ') || '—'}`,
      14,
      y,
    )
    y += 7
    doc.text(`IEP due: ${s.iepDue || '—'} · Meeting: ${s.meetingDate || '—'}`, 14, y)
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.text('Goals', 14, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    for (const g of s.goals.slice(0, 8)) {
      y = ensureSpace(doc, y, 6)
      doc.text(`· ${g}`, 14, y)
      y += 5
    }
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Accommodations', 14, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    for (const a of s.accommodations.slice(0, 10)) {
      y = ensureSpace(doc, y, 6)
      doc.text(`· ${a}`, 14, y)
      y += 5
    }
  }

  if (sections.includes('roster')) {
    let y = newSection(input.studentId ? 'Student snapshot' : '1 · Caseload Roster')
    doc.setFontSize(11)
    doc.text(`Students: ${students.length}`, 14, y)
    y += 8
    doc.setFontSize(9)
    for (const s of students) {
      y = ensureSpace(doc, y, 14)
      const programs = [s.hasIEP ? 'IEP' : null, s.has504 ? '504' : null, s.hasMLL ? 'MLL' : null]
        .filter(Boolean)
        .join('/')
      doc.setFont('helvetica', 'bold')
      doc.text(`${s.name} (${s.grade})`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `${programs || '—'} · ${s.discipline.join(', ') || 'services TBD'} · Due ${s.iepDue || s.section504Due || '—'} · ${s.status}`,
        14,
        y + 5,
      )
      y += 12
    }
  }

  if (sections.includes('contacts')) {
    let y = newSection('2 · Parent / Contact Log')
    doc.setFontSize(9)
    if (contacts.length) {
      doc.text('Logged contacts from PRISM:', 14, y)
      y += 7
      for (const c of contacts.slice(0, 20)) {
        const s = input.students.find((x) => x.id === c.studentId)
        y = ensureSpace(doc, y, 10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${c.date} · ${s?.name || c.studentId} · ${c.method}`, 14, y)
        doc.setFont('helvetica', 'normal')
        const note = `${c.contactName || '—'} — ${c.notes || ''}${c.followUpNeeded ? ' [FOLLOW-UP]' : ''}`
        doc.text(note.slice(0, 110), 14, y + 4)
        y += 10
      }
      y += 4
    } else {
      doc.text('No digital contacts yet — blank lines for paper notes.', 14, y)
      y += 8
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Date   |   Student   |   Contact   |   Notes', 14, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    for (let i = 0; i < 8; i++) {
      y = ensureSpace(doc, y, 10)
      doc.setDrawColor(200)
      doc.line(14, y + 2, 196, y + 2)
      y += 10
    }
    y += 4
    doc.setFontSize(8)
    doc.text('Recent SOAP dates:', 14, y)
    y += 5
    for (const n of soapNotes.slice(0, 8)) {
      const s = input.students.find((x) => x.id === n.studentId)
      y = ensureSpace(doc, y, 6)
      doc.text(`· ${n.date} — ${s?.name || n.studentId}`, 14, y)
      y += 5
    }
  }

  if (sections.includes('progress')) {
    let y = newSection('3 · Progress / Gradebook Snapshot')
    doc.setFontSize(9)
    if (!sessions.length) {
      doc.text('No probe sessions stored yet. Use Progress Monitoring to collect data.', 14, y)
    } else {
      for (const sess of sessions.slice(0, 30)) {
        const s = input.students.find((x) => x.id === sess.studentId)
        y = ensureSpace(doc, y, 10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${s?.name || sess.studentId} · ${sess.date}`, 14, y)
        doc.setFont('helvetica', 'normal')
        doc.text(`${sess.label} — ${sess.scorePercent}% · cadence ${sess.cadenceDays}d`, 14, y + 4)
        y += 10
      }
    }
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.text('Exit tickets', 14, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    for (const t of tickets.slice(0, 15)) {
      const s = input.students.find((x) => x.id === t.studentId)
      y = ensureSpace(doc, y, 8)
      doc.text(
        `· ${t.date} ${s?.name || t.studentId}: ${t.prompt.slice(0, 50)}… [${t.mastered ? 'mastered' : 'practice'}]`,
        14,
        y,
      )
      y += 6
    }
  }

  if (sections.includes('planner')) {
    let y = newSection('4 · Weekly Planner')
    doc.setFontSize(9)
    doc.text(`${plannerState.weekLabel} · from PRISM Weekly Planner`, 14, y)
    y += 8
    for (let d = 0; d < 5; d++) {
      const daySlots = slotsForDay(plannerState, d as 0 | 1 | 2 | 3 | 4)
      y = ensureSpace(doc, y, 22)
      doc.setFont('helvetica', 'bold')
      doc.text(DAY_LABELS[d], 14, y)
      doc.setFont('helvetica', 'normal')
      doc.setDrawColor(180)
      const boxH = Math.max(16, 6 + daySlots.length * 5)
      doc.rect(14, y + 2, 182, boxH)
      doc.setFontSize(8)
      if (!daySlots.length) {
        doc.text('No sessions scheduled — add in Weekly Planner tab', 16, y + 10)
      } else {
        let ly = y + 8
        for (const slot of daySlots) {
          doc.text(
            `${slot.startTime}–${slot.endTime} · ${slot.studentName} · ${slot.focus} · ${slot.location}`,
            16,
            ly,
          )
          ly += 5
        }
      }
      y += boxH + 8
      doc.setFontSize(9)
    }
  }

  if (sections.includes('motivation')) {
    let y = newSection('5 · Motivation & Attendance Snapshot')
    doc.setFontSize(9)
    doc.text(input.game.seasonLabel, 14, y)
    y += 8
    const gameRows = input.studentId
      ? input.game.students.filter((g) => g.studentId === input.studentId)
      : input.game.students
    for (const g of gameRows) {
      const s = input.students.find((x) => x.id === g.studentId)
      if (!s) continue
      y = ensureSpace(doc, y, 10)
      doc.text(
        `${s.name}: ${g.points} pts · space ${g.boardSpace + 1}/${input.game.boardSize} · attendance days ${g.attendanceDates.length} · prizes ${g.prizesClaimed.length}`,
        14,
        y,
      )
      y += 6
    }
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Prize board options', 14, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    for (const p of input.game.prizeOptions) {
      y = ensureSpace(doc, y, 6)
      doc.text(`☐ ${p}`, 14, y)
      y += 5
    }
  }

  if (!started) {
    pageHeader(doc, 'Empty selection', sub)
    doc.text('Select at least one Print Center section.', 14, 44)
    started = true
  }

  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(
    'Generated by PRISM Print Center · Demo/local data only · No live Enrich sync · Human review required',
    14,
    288,
  )

  const stamp = today.replace(/\//g, '-')
  const namePart = input.studentId
    ? (students[0]?.name || 'student').replace(/[^\w.-]+/g, '_')
    : 'Caseload'
  doc.save(`PRISM-Print-${namePart}-${stamp}.pdf`)
}

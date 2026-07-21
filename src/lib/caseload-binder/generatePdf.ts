import { jsPDF } from 'jspdf'
import type { Student } from '../students/types'
import type { SoapNote } from '../session-notes/store'
import type { ProbeSession, ExitTicket } from '../progress-monitoring/store'
import type { GameState } from '../motivation-game/store'
import type { ParentContact } from '../parent-contacts/store'

type BinderInput = {
  districtName: string
  providerName: string
  suiteMode: string
  students: Student[]
  soapNotes: SoapNote[]
  sessions: ProbeSession[]
  tickets: ExitTicket[]
  game: GameState
  parentContacts?: ParentContact[]
}

function pageHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(30, 64, 120)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text('PRISM Caseload Binder', 14, 12)
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

export function downloadCaseloadBinderPdf(input: BinderInput) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const today = new Date().toLocaleDateString('en-US')
  const sub = `${input.districtName} · ${input.providerName} · ${input.suiteMode} · ${today}`

  // Cover / roster
  pageHeader(doc, '1 · Caseload Roster', sub)
  let y = 44
  doc.setFontSize(11)
  doc.text(`Students: ${input.students.length}`, 14, y)
  y += 8
  doc.setFontSize(9)
  for (const s of input.students) {
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

  // Parent / contact log
  doc.addPage()
  pageHeader(doc, '2 · Parent / Contact Log', sub)
  y = 44
  doc.setFontSize(9)
  const contacts = input.parentContacts || []
  if (contacts.length) {
    doc.text('Logged contacts from PRISM (also leave blank lines for paper notes):', 14, y)
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
    doc.text('No digital contacts yet — use blank lines below or the Parent Contact Log tab.', 14, y)
    y += 8
  }
  const headers = ['Date', 'Student', 'Contact', 'Notes']
  doc.setFont('helvetica', 'bold')
  doc.text(headers.join('   |   '), 14, y)
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
  doc.text('Recent SOAP dates (from PRISM browser store):', 14, y)
  y += 5
  for (const n of input.soapNotes.slice(0, 8)) {
    const s = input.students.find((x) => x.id === n.studentId)
    y = ensureSpace(doc, y, 6)
    doc.text(`· ${n.date} — ${s?.name || n.studentId}`, 14, y)
    y += 5
  }

  // Gradebook / probes
  doc.addPage()
  pageHeader(doc, '3 · Progress / Gradebook Snapshot', sub)
  y = 44
  doc.setFontSize(9)
  if (!input.sessions.length) {
    doc.text('No probe sessions stored yet. Use Progress Monitoring tab (ESGI-style) to collect data.', 14, y)
  } else {
    for (const sess of input.sessions.slice(0, 30)) {
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
  for (const t of input.tickets.slice(0, 15)) {
    const s = input.students.find((x) => x.id === t.studentId)
    y = ensureSpace(doc, y, 8)
    doc.text(
      `· ${t.date} ${s?.name || t.studentId}: ${t.prompt.slice(0, 50)}… [${t.mastered ? 'mastered' : 'practice'}]`,
      14,
      y,
    )
    y += 6
  }

  // Weekly planner
  doc.addPage()
  pageHeader(doc, '4 · Weekly Planner (paper)', sub)
  y = 44
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  for (const day of days) {
    y = ensureSpace(doc, y, 28)
    doc.setFont('helvetica', 'bold')
    doc.text(day, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setDrawColor(180)
    doc.rect(14, y + 2, 182, 20)
    doc.setFontSize(8)
    doc.text('Sessions / probes / IEP meetings / parent calls:', 16, y + 8)
    y += 28
    doc.setFontSize(9)
  }

  // Motivation / attendance
  doc.addPage()
  pageHeader(doc, '5 · Motivation & Attendance Snapshot', sub)
  y = 44
  doc.setFontSize(9)
  doc.text(input.game.seasonLabel, 14, y)
  y += 8
  for (const g of input.game.students) {
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

  y = ensureSpace(doc, y, 20)
  y += 10
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(
    'Generated by PRISM · Reflect the Whole Human · Demo/local data only · No live Enrich sync · Human review required',
    14,
    y,
  )

  doc.save(`PRISM-Caseload-Binder-${today.replace(/\//g, '-')}.pdf`)
}

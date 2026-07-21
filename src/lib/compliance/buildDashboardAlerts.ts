import type { Student } from '../students/types'
import { daysUntil } from '../students/normalizeStudent'
import { buildProgressAlerts } from '../progress-monitoring/store'
import type { ProbeSession } from '../progress-monitoring/store'
import type { SoapNote } from '../session-notes/store'

export type DashboardAlert = {
  id: string
  tone: 'danger' | 'warn' | 'info'
  text: string
  href: string
  category: 'annual' | 'nom' | 'progress' | 'soap'
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function buildDashboardAlerts(input: {
  students: Student[]
  sessions: ProbeSession[]
  soapNotes: SoapNote[]
  nomLeadTimeDays: number
  serviceLogHours: number
  iepSystem?: string
  today?: string
}): DashboardAlert[] {
  const today = input.today || new Date().toISOString().slice(0, 10)
  const out: DashboardAlert[] = []
  const sor = input.iepSystem || 'Enrich / SoR'

  for (const s of input.students) {
    const due = s.hasIEP ? s.iepDue : s.section504Due
    const d = daysUntil(due || undefined)
    if (d != null && d < 0) {
      out.push({
        id: `annual-over-${s.id}`,
        tone: 'danger',
        text: `${s.name} — overdue annual / review (${due})`,
        href: '/caseload',
        category: 'annual',
      })
    } else if (d != null && d <= 45) {
      out.push({
        id: `annual-soon-${s.id}`,
        tone: 'warn',
        text: `${s.name} — due within ${d} day${d === 1 ? '' : 's'} (${due})`,
        href: '/caseload',
        category: 'annual',
      })
    }

    if (s.meetingDate) {
      const meetDays = daysUntil(s.meetingDate)
      if (meetDays != null && meetDays >= 0) {
        const nomBy = addDaysIso(s.meetingDate, -input.nomLeadTimeDays)
        if (nomBy <= today) {
          out.push({
            id: `nom-${s.id}`,
            tone: meetDays <= input.nomLeadTimeDays ? 'danger' : 'warn',
            text: `${s.name} — send legal NOM in ${sor} by ${nomBy} (meeting ${s.meetingDate})`,
            href: '/reminders',
            category: 'nom',
          })
        }
      }
    }
  }

  for (const a of buildProgressAlerts(input.students, input.sessions, today)) {
    if (a.severity === 'ok') continue
    out.push({
      id: `pm-${a.studentId}`,
      tone: a.severity === 'overdue' ? 'danger' : 'warn',
      text: `${a.studentName} — ${a.reason}`,
      href: '/progress',
      category: 'progress',
    })
  }

  const maxAgeDays = Math.max(1, Math.ceil(input.serviceLogHours / 24) + 1)
  const latestByStudent = new Map<string, string>()
  for (const n of input.soapNotes) {
    const prev = latestByStudent.get(n.studentId)
    if (!prev || n.date > prev) latestByStudent.set(n.studentId, n.date)
  }
  for (const s of input.students) {
    const last = latestByStudent.get(s.id)
    if (!last) continue
    const age = daysUntil(last)
    if (age != null && age < -maxAgeDays) {
      out.push({
        id: `soap-${s.id}`,
        tone: 'info',
        text: `${s.name} — last SOAP ${last}; confirm ${sor} entry within ${input.serviceLogHours}h of sessions`,
        href: '/caseload',
        category: 'soap',
      })
    }
  }

  const rank = { danger: 0, warn: 1, info: 2 }
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 18)
}

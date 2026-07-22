/** Private school / equitable services ISP drafts — browser-only. */

export type PrivateSchoolPlan = {
  id: string
  studentId: string
  studentName: string
  schoolName: string
  servicesSummary: string
  consultationMinutes: number
  directMinutes: number
  planDue: string
  parentConsultDate: string
  notes: string
  draftText: string
  updatedAt: string
}

const KEY = 'prism_private_school_plans_v1'

export function loadPrivateSchoolPlans(): PrivateSchoolPlan[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PrivateSchoolPlan[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePrivateSchoolPlans(list: PrivateSchoolPlan[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)))
}

export function upsertPrivateSchoolPlan(plan: PrivateSchoolPlan) {
  const list = loadPrivateSchoolPlans().filter((p) => p.id !== plan.id)
  savePrivateSchoolPlans([{ ...plan, updatedAt: new Date().toISOString() }, ...list])
}

export function buildIspDraft(plan: PrivateSchoolPlan, districtName: string, iepSystem: string): string {
  return `PRIVATE SCHOOL SERVICE PLAN (ISP) — DRAFT
District: ${districtName}
Student: ${plan.studentName}
Private school: ${plan.schoolName || 'TBD'}
Plan due / review: ${plan.planDue || 'TBD'}
Parent consultation date: ${plan.parentConsultDate || 'TBD'}

Equitable services summary:
${plan.servicesSummary || '—'}

Service delivery (draft minutes / week):
- Direct: ${plan.directMinutes} min
- Consultation: ${plan.consultationMinutes} min

Notes:
${plan.notes || '—'}

Companion: Copy into ${iepSystem} / district ISP workflow as required.
PRISM does not live-sync. Human review required.
Generated ${new Date().toLocaleString()}`
}

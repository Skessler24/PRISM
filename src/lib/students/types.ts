/** Shared student model — aligned with deploy/index.html program flags. */

export type Student = {
  id: string
  name: string
  rawName?: string
  grade: string
  teacher: string
  discipline: string[]
  provider: string
  caseManager: string
  tier: number
  iepDue: string
  reevalDue: string
  meetingDate?: string
  status: string
  color: string
  interests: string
  triggers: string
  calming: string
  goals: string[]
  accommodations: string[]
  disability: string
  lastContact: string
  fallEval?: boolean
  source: 'demo' | 'arr-csv' | string
  hasIEP: boolean
  has504: boolean
  hasMLL: boolean
  /** Parentally placed private school — equitable services / ISP */
  hasPrivateSchool?: boolean
  privateSchoolName?: string
  privateSchoolPlanDue?: string
  homeLanguage?: string
  eldLevel?: string
  interpreterNeeded?: boolean
  section504Due?: string
  section504Impairment?: string
  hasBip?: boolean
  hasAlp?: boolean
  /** ISO date YYYY-MM-DD — optional for age calculator */
  dob?: string
}

export type StudentFilter = 'All' | 'IEP' | '504' | 'MLL' | string

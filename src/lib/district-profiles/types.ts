/**
 * District Profile types — foundation for multi-district support.
 * Cherry Creek is Profile #1; Profile #2+ should reuse this shape without code changes.
 * Feature ids match deploy/ FEATURES + district-profiles/*.json (short keys).
 */

export type FeatureName =
  | 'students'
  | 'caseload'
  | 'scheduling'
  | 'mtss'
  | 'section504'
  | 'mll'
  | 'eval'
  | 'accessibility'
  | 'templates'
  | 'resources'
  | 'fba'
  | 'transfer'
  | 'actionBuilder'
  | 'manif'
  | 'cld'
  | 'privateSchool'
  | 'transport'
  | 'esy'
  | 'progress'
  | 'ai'
  | 'help'
  | 'dualCloud'
  | 'print'
  | 'enrichReminders'

/** Display labels for Admin / District Profile toggles. */
export const FEATURE_LABELS: Record<FeatureName, string> = {
  students: 'Student Tiles',
  caseload: 'My Caseload',
  scheduling: 'Scheduling',
  mtss: 'MTSS/RTI Module',
  section504: '504 Plans',
  mll: 'Multilingual Learners',
  eval: 'Eval Tracker',
  accessibility: 'Accessibility',
  templates: 'Templates & Forms',
  resources: 'Resources',
  fba: 'FBA/BIP Engine',
  transfer: 'Transfer Wizard',
  actionBuilder: 'Action Builder',
  manif: 'Manifestation Determination',
  cld: 'CLD Guidance',
  privateSchool: 'Private School Service Plans',
  transport: 'Transportation Documentation',
  esy: 'ESY Tracking',
  progress: 'Progress Monitoring Probes',
  ai: 'AI Draft Engine',
  help: 'Help Assist Mode',
  dualCloud: 'Dual Cloud Storage',
  print: 'Print Center Export',
  enrichReminders: 'Enrich Reminder Workflow',
}

export type DistrictRule = {
  id: string
  rule: string
  requirement: string
  source: string
  active: boolean
  /** Optional numeric value for timeline calculator */
  valueDays?: number
  unit?: 'calendar_days' | 'school_days' | 'weeks' | 'years' | 'hours'
}

export type DistrictRulesConfig = {
  nomLeadTimeDays: number
  evaluationWindowDays: number
  /** Enrich note: 60-day clock applies to initials; reevals due by eligibility date */
  evaluationWindowAppliesTo: 'initials_only' | 'initials_and_reevals'
  rtiMinimumCycles: number
  rtiCycleLengthWeeks: number
  reevaluationCycleYears: number
  annualReviewRule: string
  parentReferralNotificationDays: number
  manifestationDeterminationSchoolDays: number
  serviceLogHours: number
  consentRevocationServiceStopDays: number
  transferCompleteDays: number
  transferAdoptAnnualDays: number
  transferReevalDays: number
  meetingScheduleLeadWeeksMin: number
  meetingScheduleLeadWeeksMax: number
  teamLeadMustBe: string[]
  enrichFinalizeSequence: string[]
}

export type DatWorkflow = {
  dualReferralRequired: boolean
  interventionWeeksIfMissing: number
  paths: string[]
  notes: string[]
}

export type ComplianceTickerItem = {
  icon: string
  text: string
}

export type DistrictProfile = {
  id: string
  name: string
  state: string
  iepSystem: string
  storageProviders: Array<'onedrive' | 'google-drive' | 'local'>
  aiProvider: 'none' | 'anthropic' | 'gemini' | 'openai' | 'district-choice'
  rules: DistrictRulesConfig
  ruleTable: DistrictRule[]
  features: Partial<Record<FeatureName, boolean>>
  dat: DatWorkflow
  complianceTicker: ComplianceTickerItem[]
  sources: string[]
}

/** TODO(Profile #2): load additional JSON files from /district-profiles and switch via settings — do not hardcode Cherry Creek in feature components. */
export type DistrictProfileId = string

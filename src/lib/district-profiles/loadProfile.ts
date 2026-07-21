import type { DistrictProfile, FeatureName } from './types'
import cherryCreek from '../../../district-profiles/cherry-creek.json'

/** Registry of available profiles. Add Profile #2 JSON here later — do not hardcode CCSD in UI. */
const PROFILE_REGISTRY: Record<string, DistrictProfile> = {
  'cherry-creek': cherryCreek as DistrictProfile,
}

export const DEFAULT_PROFILE_ID = 'cherry-creek'

export function listDistrictProfiles(): DistrictProfile[] {
  return Object.values(PROFILE_REGISTRY)
}

export function loadDistrictProfile(id: string = DEFAULT_PROFILE_ID): DistrictProfile {
  const profile = PROFILE_REGISTRY[id]
  if (!profile) {
    console.warn(`[district-profiles] Unknown profile "${id}", falling back to ${DEFAULT_PROFILE_ID}`)
    return PROFILE_REGISTRY[DEFAULT_PROFILE_ID]
  }
  return profile
}

export function getRuleValueDays(profile: DistrictProfile, ruleId: string): number | undefined {
  return profile.ruleTable.find((r) => r.id === ruleId)?.valueDays
}

export type TimelineEventType =
  | 'Consent Received'
  | 'Referral'
  | 'NOM Needed'
  | 'Annual Review Due'
  | 'Reevaluation Due'
  | 'Transfer Notified'

export type TimelineLine = {
  label: string
  date: Date
  tone: 'info' | 'warn' | 'danger' | 'ok'
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function subtractDays(date: Date, days: number) {
  return addDays(date, -days)
}

/** Deadline math driven by active district profile — never hardcode CCSD numbers in components. */
export function calculateTimeline(
  profile: DistrictProfile,
  event: TimelineEventType,
  trigger: Date,
): TimelineLine[] {
  const r = profile.rules
  switch (event) {
    case 'Consent Received': {
      const deadline = addDays(trigger, r.evaluationWindowDays)
      const nom = subtractDays(deadline, r.nomLeadTimeDays)
      return [
        { label: 'Consent received (clock starts)', date: trigger, tone: 'info' },
        { label: 'NOM must be sent by', date: nom, tone: 'warn' },
        {
          label: `Eligibility meeting deadline (${r.evaluationWindowDays}-day window)`,
          date: deadline,
          tone: 'danger',
        },
      ]
    }
    case 'Referral': {
      const notify = addDays(trigger, r.parentReferralNotificationDays)
      return [
        { label: 'Referral received', date: trigger, tone: 'info' },
        { label: 'Parent notification due', date: notify, tone: 'warn' },
      ]
    }
    case 'NOM Needed': {
      const sendBy = subtractDays(trigger, r.nomLeadTimeDays)
      return [
        { label: 'Meeting date', date: trigger, tone: 'info' },
        { label: 'NOM must be sent by', date: sendBy, tone: 'danger' },
      ]
    }
    case 'Annual Review Due': {
      const prepWeeks = r.meetingScheduleLeadWeeksMax
      const prep = subtractDays(trigger, prepWeeks * 7)
      const nom = subtractDays(trigger, r.nomLeadTimeDays)
      return [
        { label: 'Begin preparation', date: prep, tone: 'info' },
        { label: 'NOM due', date: nom, tone: 'warn' },
        { label: 'Annual review deadline', date: trigger, tone: 'danger' },
      ]
    }
    case 'Reevaluation Due': {
      const nom = subtractDays(trigger, r.nomLeadTimeDays)
      return [
        { label: 'NOM due', date: nom, tone: 'warn' },
        { label: 'Reevaluation / eligibility due', date: trigger, tone: 'danger' },
      ]
    }
    case 'Transfer Notified': {
      const complete = addDays(trigger, r.transferCompleteDays)
      const annual = addDays(trigger, r.transferAdoptAnnualDays)
      const reeval = addDays(trigger, r.transferReevalDays)
      return [
        { label: 'Transfer notified', date: trigger, tone: 'info' },
        { label: 'Transfer finalize due', date: complete, tone: 'danger' },
        { label: 'If IEP not adopted — Review IEP due', date: annual, tone: 'warn' },
        { label: 'Reevaluation window end (when required)', date: reeval, tone: 'warn' },
      ]
    }
    default:
      return []
  }
}

export function isFeatureEnabled(profile: DistrictProfile, name: FeatureName): boolean {
  return Boolean(profile.features[name])
}

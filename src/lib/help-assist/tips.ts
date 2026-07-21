import type { DistrictProfile } from '../district-profiles/types'

export type TipId = 'timeline-calculator' | 'eval-checklist' | 'templates-suite'

export function resolveTip(tipId: TipId, profile: DistrictProfile, suiteMode?: 'companion' | 'standalone'): string {
  const r = profile.rules
  const iep = profile.iepSystem || 'Enrich'

  switch (tipId) {
    case 'timeline-calculator':
      return `Timeline math uses ${profile.name} rules — not hardcoded days. NOM lead time is ${r.nomLeadTimeDays} calendar days. Evaluation window is ${r.evaluationWindowDays} days (${r.evaluationWindowAppliesTo.replaceAll('_', ' ')}). Parent referral notify: ${r.parentReferralNotificationDays} days.`
    case 'eval-checklist':
      return `Before finalizing: send NOM ${r.nomLeadTimeDays} days ahead; track the ${r.evaluationWindowDays}-day evaluation window from signed consent. Enrich / SoR finalize sequence: ${r.enrichFinalizeSequence.join(' → ')}. PRISM never live-syncs to ${iep}.`
    case 'templates-suite':
      return suiteMode === 'standalone'
        ? `Standalone suite: save district drafts in PRISM (browser storage / Graph when configured). You can still Copy/Print. Official publish rules still follow ${profile.name} compliance.`
        : `Companion mode: prepare drafts here, then Copy into ${iep}. PRISM does not live-sync. Use Help Assist + Templates together for NOM, progress, and 504/MLL notices.`
    default:
      return ''
  }
}

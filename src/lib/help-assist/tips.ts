import type { DistrictProfile } from '../district-profiles/types'

export type TipId =
  | 'timeline-calculator'
  | 'eval-checklist'
  | 'templates-suite'
  | 'fba-bip'
  | 'bip-builder'
  | 'soap-notes'
  | 'progress-monitoring'
  | 'transfer-wizard'
  | 'action-builder'
  | 'mtss-referral'
  | 'dat-workflow'
  | 'cld-guidance'

export function resolveTip(
  tipId: TipId,
  profile: DistrictProfile,
  suiteMode?: 'companion' | 'standalone',
): string {
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
    case 'fba-bip':
      return `The FBA must identify target behavior (operational definition), setting events, antecedents, consequences, and hypothesized function. In ${profile.name} practice, an FBA is required before a BIP. Draft here, then Copy into ${iep} — no live sync.`
    case 'bip-builder':
      return `A BIP must include: target behavior, function, prevention strategies, replacement behavior instruction, reinforcement plan, crisis/safety, and data collection method. Review at each IEP meeting.`
    case 'soap-notes':
      return `SOAP: Subjective (report), Objective (measurable data), Assessment (clinical judgment), Plan (next steps). Log within ${r.serviceLogHours} hours per ${profile.name} policy. Use Copy to format for ${iep}.`
    case 'progress-monitoring':
      return `Enter probe data regularly (CBM, running records, frequency counts, trial data). ${profile.name} expects progress reports quarterly with report cards. Trend bars are local drafts only.`
    case 'transfer-wizard':
      return `Transfer into ${profile.name}: request prior records promptly, decide adopt vs new eval, start services immediately if adopting, hold IEP meeting within ${r.transferAdoptAnnualDays} days, provide parent rights in primary language. Finalize window: ${r.transferCompleteDays} days.`
    case 'action-builder':
      return `Action Builder drafts Enrich Section 7 workflows (FBA, BIP, amendment, MDR, SOP, transportation). Manifestation Determination must occur within ${r.manifestationDeterminationSchoolDays} school days. PRISM prepares — ${iep} remains SoR.`
    case 'mtss-referral':
      return `Per ${profile.name} rules: document RTI for at least ${r.rtiMinimumCycles} cycles (typically ${r.rtiCycleLengthWeeks} weeks each) before SPED referral. Notify parent within ${r.parentReferralNotificationDays} days.`
    case 'dat-workflow':
      return `DAT dual referral required: ${profile.dat.dualReferralRequired ? 'Yes' : 'No'}. Groups DAT form and Enrich referral are separate steps. Share IEIF without moving the Drive link. If intervention missing, plan ~${profile.dat.interventionWeeksIfMissing} weeks.`
    case 'cld-guidance':
      return `CLD students need non-biased assessment in the primary language whenever possible. Arrange interpreters for meetings. Consider cultural/linguistic background before attributing difficulty to disability. NOM lead time remains ${r.nomLeadTimeDays} days.`
    default:
      return ''
  }
}

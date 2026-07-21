import { useHelpAssist } from './help-assist-context'
import { useDistrictProfile } from '../district-profiles/useDistrictProfile'
import { resolveTip, type TipId } from './tips'
import { readSuiteMode } from '../templates/catalog'

type FieldTipProps = {
  tipId: TipId
  className?: string
}

/** Shows only when Help Assist is ON and district `help` feature is enabled. */
export function FieldTip({ tipId, className = '' }: FieldTipProps) {
  const { enabled } = useHelpAssist()
  const { profile, isFeatureEnabled } = useDistrictProfile()

  if (!enabled || !isFeatureEnabled('help')) return null

  const text = resolveTip(tipId, profile, readSuiteMode())
  if (!text) return null

  return (
    <div className={`help-assist-panel block ${className}`.trim()}>
      <strong>💡 Help Assist:</strong> {text}
    </div>
  )
}

import { createContext, useContext } from 'react'
import type { DistrictProfile, FeatureName } from './types'
import type { TimelineEventType, TimelineLine } from './loadProfile'

export type DistrictProfileContextValue = {
  profile: DistrictProfile
  profileId: string
  /** TODO(Profile #2): wire a profile picker; keep feature code profile-agnostic. */
  setProfileId: (id: string) => void
  isFeatureEnabled: (name: FeatureName) => boolean
  getRule: (ruleId: string) => DistrictProfile['ruleTable'][number] | undefined
  toggleFeature: (name: FeatureName) => void
  calculateTimeline: (event: TimelineEventType, trigger: Date) => TimelineLine[]
  availableProfiles: DistrictProfile[]
}

export const DistrictProfileContext = createContext<DistrictProfileContextValue | null>(null)

export function useDistrictProfile() {
  const ctx = useContext(DistrictProfileContext)
  if (!ctx) throw new Error('useDistrictProfile must be used within DistrictProfileProvider')
  return ctx
}

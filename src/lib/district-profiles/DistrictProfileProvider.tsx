import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { FeatureName } from './types'
import {
  calculateTimeline,
  DEFAULT_PROFILE_ID,
  listDistrictProfiles,
  loadDistrictProfile,
} from './loadProfile'
import { DistrictProfileContext } from './district-profile-context'
import type { TimelineEventType } from './loadProfile'

const STORAGE_KEY = 'prism.activeDistrictProfile'
const FEATURE_OVERRIDE_KEY = 'prism.featureOverrides'

function readOverrides(profileId: string): Partial<Record<FeatureName, boolean>> {
  try {
    const raw = localStorage.getItem(`${FEATURE_OVERRIDE_KEY}.${profileId}`)
    return raw ? (JSON.parse(raw) as Partial<Record<FeatureName, boolean>>) : {}
  } catch {
    return {}
  }
}

export function DistrictProfileProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_PROFILE_ID
    } catch {
      return DEFAULT_PROFILE_ID
    }
  })
  const [overrides, setOverrides] = useState(() => readOverrides(profileId))

  const base = loadDistrictProfile(profileId)
  const profile = useMemo(
    () => ({
      ...base,
      features: { ...base.features, ...overrides },
    }),
    [base, overrides],
  )

  const setProfileId = useCallback((id: string) => {
    setProfileIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
    setOverrides(readOverrides(id))
  }, [])

  const toggleFeature = useCallback(
    (name: FeatureName) => {
      setOverrides((prev) => {
        const next = { ...prev, [name]: !(profile.features[name] ?? false) }
        try {
          localStorage.setItem(`${FEATURE_OVERRIDE_KEY}.${profileId}`, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [profile.features, profileId],
  )

  const value = useMemo(
    () => ({
      profile,
      profileId,
      setProfileId,
      isFeatureEnabled: (name: FeatureName) => Boolean(profile.features[name]),
      getRule: (ruleId: string) => profile.ruleTable.find((r) => r.id === ruleId),
      toggleFeature,
      calculateTimeline: (event: TimelineEventType, trigger: Date) =>
        calculateTimeline(profile, event, trigger),
      availableProfiles: listDistrictProfiles(),
    }),
    [profile, profileId, setProfileId, toggleFeature],
  )

  return (
    <DistrictProfileContext.Provider value={value}>{children}</DistrictProfileContext.Provider>
  )
}

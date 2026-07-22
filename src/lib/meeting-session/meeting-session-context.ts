import { createContext, useContext } from 'react'

export type MeetingSessionLaunch = {
  title?: string
  joinUrl?: string
  provider?: string
}

export type MeetingSessionContextValue = {
  open: boolean
  launch: MeetingSessionLaunch | null
  /** Increments on each open so the modal remounts fresh */
  sessionKey: number
  openMeetingSession: (launch?: MeetingSessionLaunch) => void
  closeMeetingSession: () => void
}

export const MeetingSessionContext = createContext<MeetingSessionContextValue | null>(null)

export function useMeetingSession() {
  const ctx = useContext(MeetingSessionContext)
  if (!ctx) throw new Error('useMeetingSession must be used within MeetingSessionProvider')
  return ctx
}

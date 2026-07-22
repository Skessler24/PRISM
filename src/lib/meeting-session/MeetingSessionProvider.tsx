import { useMemo, useState, type ReactNode } from 'react'
import {
  MeetingSessionContext,
  type MeetingSessionLaunch,
} from './meeting-session-context'

export function MeetingSessionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [launch, setLaunch] = useState<MeetingSessionLaunch | null>(null)
  const [sessionKey, setSessionKey] = useState(0)

  const value = useMemo(
    () => ({
      open,
      launch,
      sessionKey,
      openMeetingSession: (next?: MeetingSessionLaunch) => {
        setLaunch(next ?? null)
        setSessionKey((k) => k + 1)
        setOpen(true)
      },
      closeMeetingSession: () => setOpen(false),
    }),
    [open, launch, sessionKey],
  )

  return (
    <MeetingSessionContext.Provider value={value}>{children}</MeetingSessionContext.Provider>
  )
}

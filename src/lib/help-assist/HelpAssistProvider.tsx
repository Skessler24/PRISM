import { useMemo, useState, type ReactNode } from 'react'
import { HelpAssistContext } from './help-assist-context'

const KEY = 'prism_help_assist_v1'

function readEnabled() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function HelpAssistProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => readEnabled())

  const value = useMemo(
    () => ({
      enabled,
      setEnabled: (on: boolean) => {
        setEnabledState(on)
        try {
          localStorage.setItem(KEY, on ? '1' : '0')
        } catch {
          /* ignore */
        }
      },
      toggle: () => {
        setEnabledState((prev) => {
          const next = !prev
          try {
            localStorage.setItem(KEY, next ? '1' : '0')
          } catch {
            /* ignore */
          }
          return next
        })
      },
    }),
    [enabled],
  )
  return <HelpAssistContext.Provider value={value}>{children}</HelpAssistContext.Provider>
}

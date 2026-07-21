import { useMemo, useState, type ReactNode } from 'react'
import { HelpAssistContext } from './help-assist-context'

export function HelpAssistProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const value = useMemo(
    () => ({
      enabled,
      toggle: () => setEnabled((v) => !v),
      setEnabled,
    }),
    [enabled],
  )
  return <HelpAssistContext.Provider value={value}>{children}</HelpAssistContext.Provider>
}

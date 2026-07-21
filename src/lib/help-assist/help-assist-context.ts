import { createContext, useContext } from 'react'

export type HelpAssistContextValue = {
  enabled: boolean
  toggle: () => void
  setEnabled: (on: boolean) => void
}

export const HelpAssistContext = createContext<HelpAssistContextValue | null>(null)

export function useHelpAssist() {
  const ctx = useContext(HelpAssistContext)
  if (!ctx) throw new Error('useHelpAssist must be used within HelpAssistProvider')
  return ctx
}

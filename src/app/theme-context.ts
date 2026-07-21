import { createContext, useContext } from 'react'
import type { ThemeFamily, ThemePalette } from '../lib/themes'

export type ThemeContextValue = {
  familyId: string
  paletteName: string
  family: ThemeFamily
  palette: ThemePalette
  families: ThemeFamily[]
  setTheme: (familyId: string, paletteName: string) => void
  themeStudioOpen: boolean
  setThemeStudioOpen: (open: boolean) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

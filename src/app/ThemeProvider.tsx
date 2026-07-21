import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyCssVars } from '../theme'
import {
  defaultThemeSelection,
  getPalette,
  paletteToCssVars,
  themeFamilies,
} from '../lib/themes'
import { ThemeContext } from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [familyId, setFamilyId] = useState<string>(defaultThemeSelection.familyId)
  const [paletteName, setPaletteName] = useState<string>(defaultThemeSelection.paletteName)
  const [themeStudioOpen, setThemeStudioOpen] = useState(false)

  const family = themeFamilies.find((f) => f.id === familyId) ?? themeFamilies[0]
  const palette = getPalette(familyId, paletteName) ?? family.palettes[0]

  useEffect(() => {
    applyCssVars(paletteToCssVars(palette))
  }, [palette])

  const value = useMemo(
    () => ({
      familyId,
      paletteName,
      family,
      palette,
      families: themeFamilies,
      setTheme: (nextFamilyId: string, nextPaletteName: string) => {
        const next = getPalette(nextFamilyId, nextPaletteName)
        if (!next) return
        setFamilyId(nextFamilyId)
        setPaletteName(nextPaletteName)
      },
      themeStudioOpen,
      setThemeStudioOpen,
    }),
    [familyId, paletteName, family, palette, themeStudioOpen],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

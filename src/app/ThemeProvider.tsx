import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyCssVars } from '../theme'
import {
  defaultThemeSelection,
  getFamily,
  getPalette,
  paletteToCssVars,
  themeFamilies,
} from '../lib/themes'
import { ThemeContext } from './theme-context'

const STORAGE_KEY = 'prism_theme_v21'

function readSaved(): { familyId: string; paletteName: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultThemeSelection
    const parsed = JSON.parse(raw) as { familyId?: string; paletteName?: string }
    if (parsed.familyId && parsed.paletteName && getPalette(parsed.familyId, parsed.paletteName)) {
      return { familyId: parsed.familyId, paletteName: parsed.paletteName }
    }
  } catch {
    /* ignore */
  }
  return defaultThemeSelection
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const saved = readSaved()
  const [familyId, setFamilyId] = useState<string>(saved.familyId)
  const [paletteName, setPaletteName] = useState<string>(saved.paletteName)
  const [themeStudioOpen, setThemeStudioOpen] = useState(false)

  const family = getFamily(familyId) ?? themeFamilies[0]
  const palette = getPalette(familyId, paletteName) ?? family.palettes[0]

  useEffect(() => {
    applyCssVars(paletteToCssVars(palette, family))
    document.body.style.background = palette.bg
    document.body.style.color = palette.text
    document.body.style.fontFamily = family.fontSecondary
  }, [palette, family])

  const value = useMemo(
    () => ({
      familyId,
      paletteName,
      family,
      palette,
      families: themeFamilies,
      setTheme: (nextFamilyId: string, nextPaletteName: string) => {
        const nextFamily = getFamily(nextFamilyId)
        const next = getPalette(nextFamilyId, nextPaletteName)
        if (!next || !nextFamily) return
        setFamilyId(nextFamilyId)
        setPaletteName(nextPaletteName)
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ familyId: nextFamilyId, paletteName: nextPaletteName }),
          )
        } catch {
          /* ignore */
        }
      },
      themeStudioOpen,
      setThemeStudioOpen,
    }),
    [familyId, paletteName, family, palette, themeStudioOpen],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

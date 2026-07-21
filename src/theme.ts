/**
 * Core PRISM design tokens — exact values from uploaded index.html
 * (:root + tailwind.config colors). Theme families live in ./lib/themes.ts
 */

export const prismColors = {
  navy: '#1E3A5F',
  accent: '#2563EB',
  accentHover: '#1D4ED8',
  /** Tailwind token `sky` in index.html */
  sky: '#F0F9FF',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  subtext: '#64748B',
  mint: '#D1FAE5',
  coral: '#FEE2E2',
  sun: '#FEF3C7',
  lav: '#EDE9FE',
  softorange: '#FFEDD5',
  pink: '#FCE7F3',
  slate: '#F1F5F9',
} as const

/** Matches index.html `:root` block exactly (Classic Blue / default chrome). */
export const defaultCssVars = {
  '--bg': '#F0F9FF',
  '--card-bg': '#FFFFFF',
  '--text': '#1E293B',
  '--subtext': '#64748B',
  '--border': '#E2E8F0',
  '--shadow': '0 1px 3px rgba(0,0,0,.08)',
  '--accent': '#2563EB',
  '--accent-h': '#1D4ED8',
  '--nav-active': '#2563EB',
  '--nav-active-txt': '#fff',
  '--nav-inactive': '#E2E8F0',
  '--nav-inactive-txt': '#475569',
  '--sky': '#DBEAFE',
  '--mint': '#D1FAE5',
  '--coral': '#FEE2E2',
  '--sun': '#FEF3C7',
  '--lav': '#EDE9FE',
  '--softorange': '#FFEDD5',
  '--pink': '#FCE7F3',
  '--slate': '#F1F5F9',
  '--header-bg': '#1E3A5F',
  '--header-txt': '#fff',
  '--font-heading': "'Inter', sans-serif",
  '--font-body': "'Inter', sans-serif",
} as const

export type CssVarMap = Record<string, string>

export function applyCssVars(vars: CssVarMap, target: HTMLElement = document.documentElement) {
  Object.entries(vars).forEach(([key, value]) => {
    target.style.setProperty(key, value)
  })
}

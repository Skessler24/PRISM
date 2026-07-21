/**
 * Core PRISM design tokens — ported from archive/index.prototype.html
 * Keep hex values exact; theme families live in ./themes.ts
 */

export const prismColors = {
  navy: '#1E3A5F',
  accent: '#2563EB',
  accentHover: '#1D4ED8',
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

export const defaultCssVars = {
  '--bg': prismColors.sky,
  '--card-bg': prismColors.cardBg,
  '--text': prismColors.text,
  '--subtext': prismColors.subtext,
  '--border': prismColors.border,
  '--shadow': '0 1px 3px rgba(0,0,0,.08)',
  '--accent': prismColors.accent,
  '--nav-active': prismColors.accent,
  '--nav-active-txt': '#FFFFFF',
  '--nav-inactive': '#E2E8F0',
  '--nav-inactive-txt': '#475569',
  '--sky': '#DBEAFE',
  '--mint': prismColors.mint,
  '--coral': prismColors.coral,
  '--sun': prismColors.sun,
  '--lav': prismColors.lav,
  '--softorange': prismColors.softorange,
  '--pink': prismColors.pink,
  '--slate': prismColors.slate,
  '--header-bg': prismColors.navy,
  '--header-txt': '#FFFFFF',
} as const

export type CssVarMap = Record<string, string>

export function applyCssVars(vars: CssVarMap, target: HTMLElement = document.documentElement) {
  Object.entries(vars).forEach(([key, value]) => {
    target.style.setProperty(key, value)
  })
}

/**
 * PRISM icon catalog — plug-in point for Claude / custom AAC symbol packs.
 *
 * Drop SVG files in /public/icons/aac/ named by id (e.g. want.svg),
 * or replace `svg` strings below. Materials boards resolve via `resolveIcon()`.
 */

export type IconCategory = 'core' | 'actions' | 'people' | 'school' | 'feelings' | 'food' | 'custom'

export type PrismIcon = {
  id: string
  label: string
  category: IconCategory
  /** Inline SVG markup (preferred for offline) */
  svg: string
  /** Optional path under public/ when Claude ships file pack */
  file?: string
  emojiFallback: string
}

function glyph(paths: string, color = '#1e3a5f'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><rect width="64" height="64" rx="12" fill="#e8f4fc"/><g fill="${color}" stroke="${color}" stroke-width="0">${paths}</g></svg>`
}

/** Seed catalog — replace/extend when Claude's library lands. */
export const ICON_CATALOG: PrismIcon[] = [
  {
    id: 'want',
    label: 'I want',
    category: 'core',
    emojiFallback: '🙋',
    file: '/icons/aac/want.svg',
    svg: glyph('<circle cx="32" cy="22" r="10"/><path d="M16 54c0-10 8-16 16-16s16 6 16 16" fill="none" stroke-width="6" stroke-linecap="round"/>'),
  },
  {
    id: 'more',
    label: 'more',
    category: 'core',
    emojiFallback: '➕',
    file: '/icons/aac/more.svg',
    svg: glyph('<rect x="28" y="12" width="8" height="40" rx="2"/><rect x="12" y="28" width="40" height="8" rx="2"/>'),
  },
  {
    id: 'stop',
    label: 'stop',
    category: 'actions',
    emojiFallback: '🛑',
    file: '/icons/aac/stop.svg',
    svg: glyph('<polygon points="32,10 54,22 54,42 32,54 10,42 10,22"/>', '#8b1e1e'),
  },
  {
    id: 'help',
    label: 'help',
    category: 'core',
    emojiFallback: '🆘',
    file: '/icons/aac/help.svg',
    svg: glyph('<text x="32" y="42" text-anchor="middle" font-size="28" font-family="Arial,sans-serif" font-weight="700">?</text>'),
  },
  {
    id: 'go',
    label: 'go',
    category: 'actions',
    emojiFallback: '➡️',
    file: '/icons/aac/go.svg',
    svg: glyph('<polygon points="18,12 50,32 18,52"/>'),
  },
  {
    id: 'bathroom',
    label: 'bathroom',
    category: 'school',
    emojiFallback: '🚽',
    file: '/icons/aac/bathroom.svg',
    svg: glyph('<rect x="20" y="24" width="24" height="28" rx="4"/><circle cx="32" cy="16" r="8"/>'),
  },
  {
    id: 'drink',
    label: 'drink',
    category: 'food',
    emojiFallback: '🥤',
    file: '/icons/aac/drink.svg',
    svg: glyph('<path d="M22 14h20l-4 40H26z"/><rect x="20" y="10" width="24" height="6" rx="2"/>'),
  },
  {
    id: 'eat',
    label: 'eat',
    category: 'food',
    emojiFallback: '🍎',
    file: '/icons/aac/eat.svg',
    svg: glyph('<circle cx="32" cy="30" r="16"/><rect x="30" y="10" width="4" height="10" rx="1"/>'),
  },
  {
    id: 'break',
    label: 'break',
    category: 'school',
    emojiFallback: '⏸️',
    file: '/icons/aac/break.svg',
    svg: glyph('<rect x="18" y="14" width="10" height="36" rx="2"/><rect x="36" y="14" width="10" height="36" rx="2"/>'),
  },
  {
    id: 'all-done',
    label: 'all done',
    category: 'core',
    emojiFallback: '✅',
    file: '/icons/aac/all-done.svg',
    svg: glyph('<path d="M14 34l12 12 24-28" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>', '#1a6b3c'),
  },
]

const byId = new Map(ICON_CATALOG.map((i) => [i.id, i]))
const byLabel = new Map(ICON_CATALOG.map((i) => [i.label.toLowerCase(), i]))

export function resolveIcon(word: string): PrismIcon | undefined {
  const key = word.trim().toLowerCase()
  if (!key) return undefined
  const slug = key.replace(/[^a-z0-9]+/g, '-')
  return byId.get(slug) || byId.get(key) || byLabel.get(key) || byLabel.get(word.trim().toLowerCase())
}

export function iconDataUri(icon: PrismIcon): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon.svg)}`
}

/** Match vocab lines to catalog; unmatched keep emoji/text only. */
export function iconsForVocab(words: string[]): Array<{ word: string; icon?: PrismIcon }> {
  return words.map((word) => ({ word, icon: resolveIcon(word) }))
}

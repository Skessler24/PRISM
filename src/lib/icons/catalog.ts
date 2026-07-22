/**
 * PRISM icon catalog — heart of Creation Station (Master Plan Phase 8 / Million Dollar Idea).
 *
 * Primary glyphs: uploaded AAC Icon Library (offline) Fitzgerald-color pack → `public/icons/aac/`.
 * Phase 2 emoji categories fill gaps for boards / schedules / tokens.
 */

import { AAC_PACK as AAC_PACK_RAW } from './aac-pack.generated'

export type IconCategory =
  | 'core'
  | 'communication'
  | 'activities'
  | 'emotions'
  | 'school'
  | 'home'
  | 'food'
  | 'transport'
  | 'animals'
  | 'sports'
  | 'toys'
  | 'needs'
  | 'actions'
  | 'people'
  | 'feelings'
  | 'custom'

export type PrismIcon = {
  id: string
  label: string
  category: IconCategory
  /** Inline SVG markup (preferred for offline) */
  svg: string
  /** Optional path under public/ when file pack lands */
  file?: string
  emojiFallback: string
}

function emojiTile(emoji: string, bg = '#f0f9ff'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="12" fill="${bg}"/><text x="32" y="42" text-anchor="middle" font-size="28">${emoji}</text></svg>`
}

function pack(
  category: IconCategory,
  items: [string, string, string][],
  bg = '#f0f9ff',
): PrismIcon[] {
  return items.map(([label, emoji, id]) => ({
    id,
    label,
    category,
    emojiFallback: emoji,
    svg: emojiTile(emoji, bg),
  }))
}

/** Uploaded AAC offline library (Fitzgerald colors + emotion faces). */
export const AAC_PACK: PrismIcon[] = AAC_PACK_RAW.map((i) => ({
  id: i.id,
  label: i.label,
  category: i.category as IconCategory,
  emojiFallback: i.emojiFallback,
  file: i.file,
  svg: i.svg,
}))

/** Phase 2 ICON_DATA — fills categories not covered by the AAC pack. */
const PHASE2_LIBRARY: PrismIcon[] = [
  ...pack(
    'communication',
    [
      ['Speaking', '🗣️', 'speaking'],
      ['Listening', '👂', 'listening'],
      ['Yes', '✅', 'yes'],
      ['Help me', '🙋', 'help-me'],
      ['Wait', '⏳', 'wait'],
    ],
    '#ede9fe',
  ),
  ...pack(
    'activities',
    [
      ['Reading', '📖', 'reading'],
      ['Writing', '✏️', 'writing'],
      ['Math', '🔢', 'math'],
      ['Art', '🎨', 'art'],
      ['Music', '🎵', 'music'],
      ['PE', '⚽', 'pe'],
      ['Lunch', '🍽️', 'lunch'],
      ['Recess', '🎠', 'recess'],
      ['Computer', '💻', 'computer'],
      ['Speech', '🗣️', 'speech'],
      ['OT', '🤲', 'ot'],
      ['Game', '🎲', 'game'],
    ],
    '#d1fae5',
  ),
  ...pack(
    'emotions',
    [
      ['Confused', '😕', 'confused'],
      ['Frustrated', '😤', 'frustrated'],
      ['Worried', '🥺', 'worried'],
    ],
    '#fce7f3',
  ),
  ...pack(
    'school',
    [
      ['Books', '📚', 'books'],
      ['Backpack', '🎒', 'backpack'],
      ['School building', '🏫', 'school-bldg'],
      ['Teacher', '👩‍🏫', 'teacher'],
      ['Friends', '👫', 'friends'],
      ['Test', '📝', 'test'],
      ['Bell', '🔔', 'bell'],
    ],
    '#dbeafe',
  ),
  ...pack(
    'home',
    [
      ['Bed', '🛏️', 'bed'],
      ['TV', '📺', 'tv'],
      ['Toys', '🧸', 'toys-home'],
      ['Pet', '🐕', 'pet'],
    ],
    '#ffedd5',
  ),
  ...pack(
    'food',
    [
      ['Apple', '🍎', 'apple'],
      ['Banana', '🍌', 'banana'],
      ['Sandwich', '🥪', 'sandwich'],
      ['Milk', '🥛', 'milk'],
      ['Cookie', '🍪', 'cookie'],
      ['Snack', '🥜', 'snack'],
    ],
    '#fef3c7',
  ),
  ...pack(
    'transport',
    [
      ['Bus', '🚌', 'bus'],
      ['Car', '🚗', 'car'],
      ['Walk', '🚶', 'walk'],
      ['Bike', '🚲', 'bike'],
    ],
    '#e0f2fe',
  ),
  ...pack(
    'animals',
    [
      ['Dog', '🐕', 'dog'],
      ['Cat', '🐈', 'cat'],
      ['Unicorn', '🦄', 'unicorn'],
      ['Horse', '🐴', 'horse'],
      ['Fish', '🐟', 'fish'],
      ['Bird', '🦜', 'bird'],
    ],
    '#ecfdf5',
  ),
  ...pack(
    'sports',
    [
      ['Soccer', '⚽', 'soccer'],
      ['Football', '🏈', 'football'],
      ['Baseball', '⚾', 'baseball'],
      ['Basketball', '🏀', 'basketball'],
      ['Tennis', '🎾', 'tennis'],
    ],
    '#fee2e2',
  ),
  ...pack(
    'toys',
    [
      ['Blocks', '🧱', 'blocks'],
      ['Puzzle', '🧩', 'puzzle'],
      ['Doll', '🪆', 'doll'],
      ['Car toy', '🚙', 'toy-car'],
    ],
    '#f3e8ff',
  ),
  ...pack(
    'needs',
    [
      ['Yes need', '👍', 'need-yes'],
      ['No need', '👎', 'need-no'],
      ['Break', '⏸️', 'break'],
      ['All done', '✅', 'all-done'],
      ['More', '➕', 'more'],
    ],
    '#fef9c3',
  ),
]

/** Prefer AAC pack on id collisions; then Phase 2 fillers. */
function mergeCatalog(primary: PrismIcon[], secondary: PrismIcon[]): PrismIcon[] {
  const seen = new Set<string>()
  const out: PrismIcon[] = []
  for (const icon of [...primary, ...secondary]) {
    if (seen.has(icon.id)) continue
    seen.add(icon.id)
    out.push(icon)
  }
  return out
}

export const ICON_CATALOG: PrismIcon[] = mergeCatalog(AAC_PACK, PHASE2_LIBRARY)

export const ICON_CATEGORY_ORDER: IconCategory[] = [
  'core',
  'people',
  'actions',
  'communication',
  'needs',
  'emotions',
  'feelings',
  'activities',
  'school',
  'home',
  'food',
  'transport',
  'animals',
  'sports',
  'toys',
  'custom',
]

const byId = new Map(ICON_CATALOG.map((i) => [i.id, i]))
const byLabel = new Map(ICON_CATALOG.map((i) => [i.label.toLowerCase(), i]))

export function resolveIcon(word: string): PrismIcon | undefined {
  const key = word.trim().toLowerCase()
  if (!key) return undefined
  const slug = key.replace(/[^a-z0-9]+/g, '-')
  return (
    byId.get(slug) ||
    byId.get(key) ||
    byId.get(`emotion-${slug}`) ||
    byLabel.get(key)
  )
}

export function iconDataUri(icon: PrismIcon): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon.svg)}`
}

export function iconsForVocab(words: string[]): Array<{ word: string; icon?: PrismIcon }> {
  return words.map((word) => ({ word, icon: resolveIcon(word) }))
}

export function downloadIconPngStub(icon: PrismIcon) {
  const blob = new Blob([icon.svg], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `prism-icon-${icon.id}.svg`
  a.click()
}

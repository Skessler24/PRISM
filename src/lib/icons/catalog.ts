/**
 * PRISM icon catalog — heart of Creation Station (Master Plan Phase 8 / Million Dollar Idea).
 *
 * Seed includes Phase 2 emoji library + AAC core glyphs.
 * Drop SVG packs in /public/icons/aac/ named by id; catalog resolves via `file` or `svg`.
 */

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
  /** Optional path under public/ when Claude ships file pack */
  file?: string
  emojiFallback: string
}

function glyph(paths: string, color = '#1e3a5f', bg = '#e8f4fc'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><rect width="64" height="64" rx="12" fill="${bg}"/><g fill="${color}" stroke="${color}" stroke-width="0">${paths}</g></svg>`
}

/** Emoji tile — used until custom SVG pack lands for that id. */
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

const AAC_CORE: PrismIcon[] = [
  {
    id: 'want',
    label: 'I want',
    category: 'core',
    emojiFallback: '🙋',
    file: '/icons/aac/want.svg',
    svg: glyph(
      '<circle cx="32" cy="22" r="10"/><path d="M16 54c0-10 8-16 16-16s16 6 16 16" fill="none" stroke-width="6" stroke-linecap="round"/>',
    ),
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
    svg: glyph(
      '<text x="32" y="42" text-anchor="middle" font-size="28" font-family="Arial,sans-serif" font-weight="700">?</text>',
    ),
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
    category: 'needs',
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
    svg: glyph(
      '<path d="M14 34l12 12 24-28" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
      '#1a6b3c',
    ),
  },
]

/** Phase 2 ICON_DATA restored — the soul of boards / schedules / tokens. */
const PHASE2_LIBRARY: PrismIcon[] = [
  ...pack('communication', [
    ['Speaking', '🗣️', 'speaking'],
    ['Listening', '👂', 'listening'],
    ['Yes', '✅', 'yes'],
    ['No', '❌', 'no'],
    ['Help me', '🙋', 'help-me'],
    ['Wait', '⏳', 'wait'],
    ['Please', '🙏', 'please'],
    ['Thank you', '💛', 'thank-you'],
  ], '#ede9fe'),
  ...pack('activities', [
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
  ], '#d1fae5'),
  ...pack('emotions', [
    ['Happy', '😊', 'happy'],
    ['Sad', '😢', 'sad'],
    ['Angry', '😠', 'angry'],
    ['Scared', '😨', 'scared'],
    ['Calm', '😌', 'calm'],
    ['Excited', '🤩', 'excited'],
    ['Confused', '😕', 'confused'],
    ['Tired', '😴', 'tired'],
    ['Frustrated', '😤', 'frustrated'],
    ['Worried', '🥺', 'worried'],
  ], '#fce7f3'),
  ...pack('school', [
    ['Books', '📚', 'books'],
    ['Backpack', '🎒', 'backpack'],
    ['School', '🏫', 'school-bldg'],
    ['Teacher', '👩‍🏫', 'teacher'],
    ['Friends', '👫', 'friends'],
    ['Test', '📝', 'test'],
    ['Bell', '🔔', 'bell'],
  ], '#dbeafe'),
  ...pack('home', [
    ['Home', '🏠', 'home'],
    ['Bed', '🛏️', 'bed'],
    ['TV', '📺', 'tv'],
    ['Toys', '🧸', 'toys-home'],
    ['Pet', '🐕', 'pet'],
  ], '#ffedd5'),
  ...pack('food', [
    ['Apple', '🍎', 'apple'],
    ['Banana', '🍌', 'banana'],
    ['Sandwich', '🥪', 'sandwich'],
    ['Milk', '🥛', 'milk'],
    ['Water', '💧', 'water'],
    ['Cookie', '🍪', 'cookie'],
    ['Snack', '🥜', 'snack'],
  ], '#fef3c7'),
  ...pack('transport', [
    ['Bus', '🚌', 'bus'],
    ['Car', '🚗', 'car'],
    ['Walk', '🚶', 'walk'],
    ['Bike', '🚲', 'bike'],
  ], '#e0f2fe'),
  ...pack('animals', [
    ['Dog', '🐕', 'dog'],
    ['Cat', '🐈', 'cat'],
    ['Unicorn', '🦄', 'unicorn'],
    ['Horse', '🐴', 'horse'],
    ['Fish', '🐟', 'fish'],
    ['Bird', '🦜', 'bird'],
  ], '#ecfdf5'),
  ...pack('sports', [
    ['Soccer', '⚽', 'soccer'],
    ['Football', '🏈', 'football'],
    ['Baseball', '⚾', 'baseball'],
    ['Basketball', '🏀', 'basketball'],
    ['Tennis', '🎾', 'tennis'],
  ], '#fee2e2'),
  ...pack('toys', [
    ['Blocks', '🧱', 'blocks'],
    ['Puzzle', '🧩', 'puzzle'],
    ['Doll', '🪆', 'doll'],
    ['Car toy', '🚙', 'toy-car'],
  ], '#f3e8ff'),
  ...pack('needs', [
    ['Yes need', '👍', 'need-yes'],
    ['No need', '👎', 'need-no'],
    ['Help need', '🆘', 'need-help'],
    ['Water need', '💧', 'need-water'],
    ['Bathroom need', '🚻', 'need-bathroom'],
  ], '#fef9c3'),
]

/** Full catalog — AAC core first, then Phase 2 soul library. */
export const ICON_CATALOG: PrismIcon[] = [...AAC_CORE, ...PHASE2_LIBRARY]

export const ICON_CATEGORY_ORDER: IconCategory[] = [
  'core',
  'communication',
  'needs',
  'emotions',
  'activities',
  'school',
  'home',
  'food',
  'transport',
  'animals',
  'sports',
  'toys',
  'actions',
  'people',
  'feelings',
  'custom',
]

const byId = new Map(ICON_CATALOG.map((i) => [i.id, i]))
const byLabel = new Map(ICON_CATALOG.map((i) => [i.label.toLowerCase(), i]))

export function resolveIcon(word: string): PrismIcon | undefined {
  const key = word.trim().toLowerCase()
  if (!key) return undefined
  const slug = key.replace(/[^a-z0-9]+/g, '-')
  return byId.get(slug) || byId.get(key) || byLabel.get(key)
}

export function iconDataUri(icon: PrismIcon): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon.svg)}`
}

export function iconsForVocab(words: string[]): Array<{ word: string; icon?: PrismIcon }> {
  return words.map((word) => ({ word, icon: resolveIcon(word) }))
}

export function downloadIconPngStub(icon: PrismIcon) {
  // SVG download (transparent-friendly staging until raster pack lands)
  const blob = new Blob([icon.svg], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `prism-icon-${icon.id}.svg`
  a.click()
}

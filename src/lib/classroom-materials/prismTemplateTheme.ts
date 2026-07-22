/**
 * PRISM Classroom Templates theme — matches Core Vocabulary / Prism Templates pack
 * (printable Color+BW + animated Token Board / Session Templates / Icon Library).
 */

import type { MaterialKind } from './store'

/** Fitzgerald AAC category colors from Icon Library pack */
export const FITZ = {
  p: '#FFC93C', // pronoun
  v: '#3DAA5B', // verb
  d: '#4A90D9', // descriptive
  n: '#F2924B', // noun
  q: '#9B6BC9', // question
  s: '#E86A9A', // social
  x: '#E5484D', // negation
} as const

export type FitzKey = keyof typeof FITZ

export type TemplateAccent = {
  /** Border / accent `--c` */
  c: string
  /** Title color */
  title: string
  label: string
  subtitle: string
}

/** Accent per material kind — from printable pack */
export const KIND_ACCENT: Record<MaterialKind, TemplateAccent> = {
  token: {
    c: '#EC4899',
    title: '#db2777',
    label: 'Token Board',
    subtitle: 'Color · earn tokens toward a reward',
  },
  schedule: {
    c: '#2563EB',
    title: '#2563EB',
    label: 'Visual Schedule',
    subtitle: 'Color · print & laminate',
  },
  social: {
    c: '#22C55E',
    title: '#16a34a',
    label: 'Social Story',
    subtitle: 'Color · read together',
  },
  comm: {
    c: '#A855F7',
    title: '#9333ea',
    label: 'Choice / Comm Board',
    subtitle: 'Color · “I want …” · print & laminate',
  },
  behavior: {
    c: '#0891B2',
    title: '#0e7490',
    label: 'Behavior Chart',
    subtitle: 'Color · tally · laminate',
  },
}

/** First / Then uses green from the printable pack */
export const FIRST_THEN_ACCENT: TemplateAccent = {
  c: '#22C55E',
  title: '#16a34a',
  label: 'First / Then Board',
  subtitle: 'Color · print & laminate · add velcro icons',
}

export const TEMPLATE_FOOTER = '✦  PRISM TEMPLATES  ✦'
export const TEMPLATE_FONT = "'Nunito', sans-serif"

/** Default core vocabulary for new comm boards (from pack manifest) */
export const CORE_VOCAB_DEFAULT = [
  'I',
  'want',
  'help',
  'go',
  'stop',
  'more',
  'eat',
  'drink',
  'play',
  'bathroom',
  'yes',
  'no',
].join('\n')

const WORD_FITZ: Record<string, FitzKey> = {
  i: 'p',
  you: 'p',
  we: 'p',
  it: 'p',
  want: 'v',
  go: 'v',
  eat: 'v',
  drink: 'v',
  help: 'v',
  play: 'v',
  look: 'v',
  like: 'v',
  more: 'v',
  stop: 'v',
  break: 'v',
  big: 'd',
  small: 'd',
  happy: 'd',
  sad: 'd',
  food: 'n',
  water: 'n',
  ball: 'n',
  book: 'n',
  home: 'n',
  school: 'n',
  bathroom: 'n',
  family: 'n',
  what: 'q',
  where: 'q',
  who: 'q',
  when: 'q',
  please: 's',
  'thank you': 's',
  'thank-you': 's',
  yes: 's',
  no: 'x',
  "don't": 'x',
  all: 'd',
  done: 'v',
  'all done': 'v',
  'i want': 'v',
}

export function fitzForWord(word: string): FitzKey {
  const key = word.trim().toLowerCase()
  if (WORD_FITZ[key]) return WORD_FITZ[key]
  // multi-word: use first token
  const first = key.split(/\s+/)[0]
  return WORD_FITZ[first] || 'n'
}

export function fitzColor(word: string): string {
  return FITZ[fitzForWord(word)]
}

export function accentForMaterial(
  kind: MaterialKind,
  scheduleType?: string,
): TemplateAccent {
  if (kind === 'schedule' && scheduleType === 'First / Then') return FIRST_THEN_ACCENT
  return KIND_ACCENT[kind]
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const v = parseInt(n, 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

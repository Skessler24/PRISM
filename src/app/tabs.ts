import type { FeatureName } from '../lib/district-profiles/types'

export type AppTab = {
  id: string
  path: string
  label: string
  shortLabel: string
  icon: string
  /** When set, tab is hidden unless district feature is on */
  featureId?: FeatureName
  /** When true, tab only shows for Admin role */
  adminOnly?: boolean
  /** Hide from hamburger (still routable) — used for Creation Station children */
  hideInNav?: boolean
}

/**
 * Primary strip (after Evals → ☰): Dashboard · Students · Caseload · MTSS · Evals
 * Drawer: Scheduling, Creation Station, Resources, and the rest.
 */
export const APP_TABS: AppTab[] = [
  { id: 'dashboard', path: '/', label: 'Dashboard', shortLabel: 'Dashboard', icon: '🏠' },
  { id: 'students', path: '/students', label: 'Student Tiles', shortLabel: 'Students', icon: '🧩' },
  { id: 'caseload', path: '/caseload', label: 'My Caseload', shortLabel: 'Caseload', icon: '👤' },
  { id: 'mtss', path: '/mtss', label: 'MTSS Hub', shortLabel: 'MTSS', icon: '📋', featureId: 'mtss' },
  {
    id: 'evaluations',
    path: '/evaluations',
    label: 'Eval Tracker',
    shortLabel: 'Evals',
    icon: '📊',
    featureId: 'eval',
  },
  {
    id: 'scheduling',
    path: '/scheduling',
    label: 'Scheduling',
    shortLabel: 'Schedule',
    icon: '📅',
  },
  {
    id: 'creation',
    path: '/creation',
    label: 'Creation Station',
    shortLabel: 'Create',
    icon: '🎨',
  },
  {
    id: 'resources',
    path: '/resources',
    label: 'Resource Hub',
    shortLabel: 'Resources',
    icon: '📚',
    featureId: 'resources',
  },
  {
    id: 'progress',
    path: '/progress',
    label: 'Progress Monitoring',
    shortLabel: 'Progress',
    icon: '📈',
    featureId: 'progress',
  },
  {
    id: 'binder',
    path: '/binder',
    label: 'Print Center',
    shortLabel: 'Print',
    icon: '📁',
    featureId: 'print',
  },
  {
    id: 'planner',
    path: '/planner',
    label: 'Weekly Planner',
    shortLabel: 'Planner',
    icon: '🗓️',
  },
  {
    id: 'meeting-prep',
    path: '/meeting-prep',
    label: 'Meeting Prep',
    shortLabel: 'Meetings',
    icon: '📋',
  },
  {
    id: 'reminders',
    path: '/reminders',
    label: 'Enrich Reminders',
    shortLabel: 'Reminders',
    icon: '📨',
    featureId: 'enrichReminders',
  },
  {
    id: 'contacts',
    path: '/contacts',
    label: 'Parent Contact Log',
    shortLabel: 'Contacts',
    icon: '📞',
  },
  {
    id: 'game',
    path: '/game',
    label: 'Motivation Game',
    shortLabel: 'Game',
    icon: '🎲',
  },
  {
    id: 'fba',
    path: '/fba',
    label: 'FBA / BIP Engine',
    shortLabel: 'FBA/BIP',
    icon: '🔍',
    featureId: 'fba',
  },
  {
    id: 'section504',
    path: '/section504',
    label: '504 Plans',
    shortLabel: '504',
    icon: '📑',
    featureId: 'section504',
  },
  {
    id: 'mll',
    path: '/mll',
    label: 'Multilingual Learners',
    shortLabel: 'MLL',
    icon: '🌍',
    featureId: 'mll',
  },
  {
    id: 'private-school',
    path: '/private-school',
    label: 'Private School Plans',
    shortLabel: 'Private',
    icon: '🏫',
    featureId: 'privateSchool',
  },
  {
    id: 'tools',
    path: '/tools',
    label: 'Quick Tools',
    shortLabel: 'Tools',
    icon: '🧮',
  },
  // Deep links under Creation Station — hidden from ☰ to avoid duplication
  {
    id: 'accessibility',
    path: '/accessibility',
    label: 'Accessibility Studio',
    shortLabel: 'Access',
    icon: '♿',
    featureId: 'accessibility',
    hideInNav: true,
  },
  {
    id: 'templates',
    path: '/templates',
    label: 'Templates & Forms',
    shortLabel: 'Templates',
    icon: '🎨',
    featureId: 'templates',
    hideInNav: true,
  },
  {
    id: 'generation',
    path: '/generation',
    label: 'Generation Studio',
    shortLabel: 'Generate',
    icon: '✨',
    featureId: 'ai',
    hideInNav: true,
  },
  { id: 'district', path: '/district', label: 'District Admin', shortLabel: 'Admin', icon: '⚙️', adminOnly: true },
]

/** First 5 = top bar pills; ☰ sits after Evals. */
export const PRIMARY_TAB_IDS = ['dashboard', 'students', 'caseload', 'mtss', 'evaluations'] as const

export function getTabByPath(pathname: string): AppTab {
  if (pathname === '/') return APP_TABS[0]
  const match = APP_TABS.find((t) => t.path !== '/' && pathname.startsWith(t.path))
  return match ?? APP_TABS[0]
}

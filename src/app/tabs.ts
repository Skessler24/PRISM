import type { FeatureName } from '../lib/district-profiles/types'

export type AppTab = {
  id: string
  path: string
  label: string
  shortLabel: string
  icon: string
  /** When set, tab is hidden unless district feature is on */
  featureId?: FeatureName
  /** Show if ANY of these district features is on (e.g. Creation Station) */
  featureAny?: FeatureName[]
  /** When true, tab only shows for Admin role */
  adminOnly?: boolean
  /** Hide from hamburger (still routable) — used for Creation Station children */
  hideInNav?: boolean
}

/**
 * Core module pills (district-togglable where featureId/featureAny is set):
 * Dashboard · Students · Caseload · Evals · MTSS · Scheduling · Progress · Creation Station · Resource Hub
 * ☰ = extra apps (Print, FBA, Contacts, …)
 */
export const APP_TABS: AppTab[] = [
  { id: 'dashboard', path: '/', label: 'Dashboard', shortLabel: 'Dashboard', icon: '🏠' },
  {
    id: 'students',
    path: '/students',
    label: 'Student Tiles',
    shortLabel: 'Students',
    icon: '🧩',
    featureId: 'students',
  },
  {
    id: 'caseload',
    path: '/caseload',
    label: 'My Caseload',
    shortLabel: 'Caseload',
    icon: '👤',
    featureId: 'caseload',
  },
  {
    id: 'evaluations',
    path: '/evaluations',
    label: 'Eval Tracker',
    shortLabel: 'Evals',
    icon: '📊',
    featureId: 'eval',
  },
  { id: 'mtss', path: '/mtss', label: 'MTSS Hub', shortLabel: 'MTSS', icon: '📋', featureId: 'mtss' },
  {
    id: 'scheduling',
    path: '/scheduling',
    label: 'Scheduling',
    shortLabel: 'Schedule',
    icon: '📅',
    featureId: 'scheduling',
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
    id: 'creation',
    path: '/creation',
    label: 'Creation Station',
    shortLabel: 'Create',
    icon: '🎨',
    featureAny: ['templates', 'accessibility', 'ai'],
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

/** Core module strip — order matches Admin district toggles for those modules. */
export const PRIMARY_TAB_IDS = [
  'dashboard',
  'students',
  'caseload',
  'evaluations',
  'mtss',
  'scheduling',
  'progress',
  'creation',
  'resources',
] as const

export function getTabByPath(pathname: string): AppTab {
  if (pathname === '/') return APP_TABS[0]
  const match = APP_TABS.find((t) => t.path !== '/' && pathname.startsWith(t.path))
  return match ?? APP_TABS[0]
}

export function isTabFeatureVisible(
  tab: AppTab,
  isFeatureEnabled: (name: FeatureName) => boolean,
): boolean {
  if (tab.featureAny?.length) {
    return tab.featureAny.some((f) => isFeatureEnabled(f))
  }
  if (tab.featureId) return isFeatureEnabled(tab.featureId)
  return true
}

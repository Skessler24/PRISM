import type { FeatureName } from '../lib/district-profiles/types'

export type AppTab = {
  id: string
  path: string
  label: string
  shortLabel: string
  icon: string
  /** When set, tab is hidden unless district feature is on */
  featureId?: FeatureName
}

/** First 5 tabs are primary nav; remaining tabs live in the hamburger drawer. */
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
    id: 'accessibility',
    path: '/accessibility',
    label: 'Accessibility Studio',
    shortLabel: 'Access',
    icon: '♿',
    featureId: 'accessibility',
  },
  {
    id: 'templates',
    path: '/templates',
    label: 'Templates & Forms',
    shortLabel: 'Templates',
    icon: '🎨',
    featureId: 'templates',
  },
  {
    id: 'resources',
    path: '/resources',
    label: 'Resource Hub',
    shortLabel: 'Resources',
    icon: '📚',
    featureId: 'resources',
  },
  { id: 'district', path: '/district', label: 'District Profile', shortLabel: 'District', icon: '🏛️' },
]

export const PRIMARY_TAB_IDS = ['dashboard', 'students', 'caseload', 'mtss', 'evaluations'] as const

export function getTabByPath(pathname: string): AppTab {
  if (pathname === '/') return APP_TABS[0]
  const match = APP_TABS.find((t) => t.path !== '/' && pathname.startsWith(t.path))
  return match ?? APP_TABS[0]
}

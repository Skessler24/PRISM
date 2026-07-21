export type AppTab = {
  id: string
  path: string
  label: string
  shortLabel: string
  icon: string
}

/** First 5 tabs are primary nav; remaining tabs live in the hamburger drawer. */
export const APP_TABS: AppTab[] = [
  { id: 'dashboard', path: '/', label: 'Dashboard', shortLabel: 'Dashboard', icon: '🏠' },
  { id: 'students', path: '/students', label: 'Student Tiles', shortLabel: 'Students', icon: '🧩' },
  { id: 'caseload', path: '/caseload', label: 'My Caseload', shortLabel: 'Caseload', icon: '👤' },
  { id: 'mtss', path: '/mtss', label: 'MTSS Hub', shortLabel: 'MTSS', icon: '📋' },
  { id: 'evaluations', path: '/evaluations', label: 'Eval Tracker', shortLabel: 'Evals', icon: '📊' },
  { id: 'accessibility', path: '/accessibility', label: 'Accessibility Studio', shortLabel: 'Access', icon: '♿' },
  { id: 'templates', path: '/templates', label: 'Templates & Forms', shortLabel: 'Templates', icon: '🎨' },
  { id: 'resources', path: '/resources', label: 'Resource Hub', shortLabel: 'Resources', icon: '📚' },
  { id: 'district', path: '/district', label: 'District Profile', shortLabel: 'District', icon: '🏛️' },
]

export const PRIMARY_TABS = APP_TABS.slice(0, 5)
export const DRAWER_TABS = APP_TABS.slice(5)

export function getTabByPath(pathname: string): AppTab {
  if (pathname === '/') return APP_TABS[0]
  const match = APP_TABS.find((t) => t.path !== '/' && pathname.startsWith(t.path))
  return match ?? APP_TABS[0]
}

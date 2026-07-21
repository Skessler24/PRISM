import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { APP_TABS, PRIMARY_TAB_IDS, getTabByPath } from '../app/tabs'
import { useDistrictProfile } from '../lib/district-profiles/useDistrictProfile'
import { useAdminRole } from '../lib/admin/admin-role-context'

export function TabNavigation() {
  const location = useLocation()
  const active = getTabByPath(location.pathname)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isFeatureEnabled } = useDistrictProfile()
  const { isAdmin } = useAdminRole()

  const visibleTabs = useMemo(
    () =>
      APP_TABS.filter((t) => {
        if (t.adminOnly && !isAdmin) return false
        if (!t.featureId) return true
        return isFeatureEnabled(t.featureId)
      }),
    [isFeatureEnabled, isAdmin],
  )

  const primaryTabs = visibleTabs.filter((t) =>
    (PRIMARY_TAB_IDS as readonly string[]).includes(t.id),
  )
  const drawerTabs = visibleTabs.filter((t) => !(PRIMARY_TAB_IDS as readonly string[]).includes(t.id))

  const closeDrawer = () => setDrawerOpen(false)

  const pillClass = (isActive: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition min-h-9 ${
      isActive
        ? 'bg-[var(--nav-active)] text-[var(--nav-active-txt)]'
        : 'bg-[var(--nav-inactive)] text-[var(--nav-inactive-txt)] hover:brightness-95'
    }`

  return (
    <>
      <nav className="fixed inset-x-0 top-16 z-[999] flex h-[52px] items-center gap-1 border-b border-[var(--border)] bg-[var(--card-bg)] px-2 md:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {primaryTabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              end={tab.path === '/'}
              onClick={closeDrawer}
              className={({ isActive }) => pillClass(isActive)}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.shortLabel}</span>
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          aria-label="More tabs"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
          className={`ml-auto shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold ${
            drawerTabs.some((t) => t.id === active.id)
              ? 'bg-[var(--nav-active)] text-[var(--nav-active-txt)]'
              : 'bg-[var(--card-bg)] text-[var(--text)]'
          }`}
        >
          ☰
        </button>
      </nav>

      {drawerOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[998] bg-black/20"
            aria-label="Close menu"
            onClick={closeDrawer}
          />
          <aside className="fixed right-0 top-[140px] z-[999] flex h-[calc(100vh-140px)] w-72 max-w-[90vw] flex-col gap-1 border-l border-[var(--border)] bg-[var(--card-bg)] p-3 shadow-xl">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-[var(--subtext)]">
              More modules
            </p>
            {drawerTabs.map((tab) => (
              <NavLink
                key={tab.id}
                to={tab.path}
                onClick={closeDrawer}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[var(--nav-active)] text-[var(--nav-active-txt)]'
                      : 'text-[var(--text)] hover:bg-[var(--slate)]'
                  }`
                }
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </NavLink>
            ))}
            {!drawerTabs.length && (
              <p className="px-2 text-xs text-[var(--subtext)]">No extra modules enabled.</p>
            )}
          </aside>
        </>
      )}
    </>
  )
}

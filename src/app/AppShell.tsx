import { Outlet } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { TabNavigation } from '../components/TabNavigation'
import { ThemeStudioModal } from '../components/ThemeStudioModal'
import { useHelpAssist } from '../lib/help-assist/help-assist-context'
import { useDistrictProfile } from '../lib/district-profiles/useDistrictProfile'
import { useAdminRole } from '../lib/admin/admin-role-context'
import { readSuiteMode } from '../lib/templates/catalog'

export function AppShell() {
  const { enabled } = useHelpAssist()
  const { profile, isFeatureEnabled } = useDistrictProfile()
  const { isAdmin } = useAdminRole()
  const suite = readSuiteMode()
  const ticker = profile.complianceTicker
  const doubled = [...ticker, ...ticker]

  return (
    <div className="shell-root min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TopBar />
      <TabNavigation />
      <div
        className="shell-ticker fixed inset-x-0 z-[997] hidden overflow-hidden py-1.5 font-mono text-[11px] md:block"
        style={{ background: 'var(--header-bg)', color: 'var(--header-txt)', opacity: 0.95 }}
      >
        <div className="animate-marquee whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={`${item.text}-${i}`} className="mx-8">
              {item.icon} {item.text}
            </span>
          ))}
        </div>
      </div>
      <main className="shell-main px-3 md:px-4">
        {enabled && isFeatureEnabled('help') && (
          <div className="help-assist-panel mb-3 block">
            <strong>💡 Help Assist is ON</strong> for {profile.name}. Field tips appear on District
            timeline, Eval checklist, and Templates when this toggle is on.
          </div>
        )}
        <Outlet />
      </main>
      <ThemeStudioModal />
      <footer className="shell-footer fixed inset-x-0 bottom-0 z-[900] border-t border-[var(--border)] bg-[var(--card-bg)] px-3 text-center text-[10px] text-[var(--subtext)]">
        PRISM · Reflect the Whole Human · {profile.name} ·{' '}
        {suite === 'standalone' ? 'Standalone' : 'Companion'} · {isAdmin ? 'Admin' : 'Staff'} · No
        live Enrich sync · Demo data only
      </footer>
    </div>
  )
}

import { Outlet } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { TabNavigation } from '../components/TabNavigation'
import { ThemeStudioModal } from '../components/ThemeStudioModal'
import { useHelpAssist } from '../lib/help-assist/help-assist-context'
import { useDistrictProfile } from '../lib/district-profiles/useDistrictProfile'

export function AppShell() {
  const { enabled } = useHelpAssist()
  const { profile, isFeatureEnabled } = useDistrictProfile()
  const ticker = profile.complianceTicker
  const doubled = [...ticker, ...ticker]

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TopBar />
      <TabNavigation />
      <div className="fixed inset-x-0 top-[116px] z-[997] overflow-hidden bg-navy py-1.5 font-mono text-[11px] text-sky-300">
        <div className="animate-marquee whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={`${item.text}-${i}`} className="mx-8">
              {item.icon} {item.text}
            </span>
          ))}
        </div>
      </div>
      <main className="px-3 pb-10 pt-[148px] md:px-4">
        {enabled && isFeatureEnabled('Help Assist Mode') && (
          <div className="help-assist-panel mb-3 block">
            <strong>💡 Help Assist is ON</strong> for {profile.name}. Field-level guidance expands in
            Prompt 5; timeline math already reads this district profile.
          </div>
        )}
        <Outlet />
      </main>
      <ThemeStudioModal />
      <footer className="fixed inset-x-0 bottom-0 z-[900] border-t border-[var(--border)] bg-[var(--card-bg)] px-3 py-1.5 text-center text-[10px] text-[var(--subtext)]">
        PRISM · Reflect the Whole Human · {profile.name} profile · No live Enrich sync · Demo data
        only
      </footer>
    </div>
  )
}

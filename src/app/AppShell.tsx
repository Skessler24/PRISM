import { Outlet } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { TabNavigation } from '../components/TabNavigation'
import { ThemeStudioModal } from '../components/ThemeStudioModal'
import { useHelpAssist } from '../lib/help-assist/help-assist-context'

export function AppShell() {
  const { enabled } = useHelpAssist()

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TopBar />
      <TabNavigation />
      <main className="px-3 pb-10 pt-[128px] md:px-4">
        {enabled && (
          <div className="help-assist-panel mb-3 block">
            <strong>💡 Help Assist is ON.</strong> Guidance panels will appear on forms once Prompt 5
            wires field-level help. District-specific examples will load from the active profile.
          </div>
        )}
        <Outlet />
      </main>
      <ThemeStudioModal />
      <footer className="fixed inset-x-0 bottom-0 z-[900] border-t border-[var(--border)] bg-[var(--card-bg)] px-3 py-1.5 text-center text-[10px] text-[var(--subtext)]">
        PRISM · Reflect the Whole Child · No live Enrich sync (HIPAA/FERPA safe) · Demo data only
      </footer>
    </div>
  )
}

import { useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { LiveGroupsPanel } from './LiveGroupsPanel'
import {
  TeamParametersPanel,
  TeamProvidersPanel,
  TeamTrackerPanel,
  TeamWeekPanel,
} from './TeamSchedulePanels'

type Tab = 'live' | 'week' | 'providers' | 'tracker' | 'parameters'

const TABS: { id: Tab; label: string }[] = [
  { id: 'live', label: 'Live Groups' },
  { id: 'week', label: 'Week Grid' },
  { id: 'providers', label: 'Providers' },
  { id: 'tracker', label: 'Minutes Tracker' },
  { id: 'parameters', label: 'Parameters' },
]

export function SchedulingPage() {
  const [tab, setTab] = useState<Tab>('live')
  const [toast, setToast] = useState('')

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  return (
    <PageShell
      title="📅 Scheduling"
      description="Live caseload groups plus the Team IEP weekly grid — providers, blocked times, minutes tracker, and school parameters. Seeded from your Phase 2 groups and the Copilot Team Scheduler."
    >
      {toast && (
        <div className="mb-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              tab === t.id
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] bg-[var(--card-bg)]'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <a
          href="/artifacts/iep-caseload-scheduler.html"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--subtext)]"
        >
          Open original Copilot HTML ↗
        </a>
      </div>

      {tab === 'live' && <LiveGroupsPanel onFlash={flash} />}
      {tab === 'week' && <TeamWeekPanel onFlash={flash} />}
      {tab === 'providers' && <TeamProvidersPanel onFlash={flash} />}
      {tab === 'tracker' && <TeamTrackerPanel onFlash={flash} />}
      {tab === 'parameters' && <TeamParametersPanel onFlash={flash} />}
    </PageShell>
  )
}

import { useState } from 'react'
import { PageShell } from '../../components/PageShell'
import { AutoBuildPanel } from './AutoBuildPanel'
import { LiveGroupsPanel } from './LiveGroupsPanel'
import {
  TeamParametersPanel,
  TeamProvidersPanel,
  TeamTrackerPanel,
  TeamWeekPanel,
} from './TeamSchedulePanels'

type Tab = 'autobuild' | 'live' | 'week' | 'providers' | 'tracker' | 'parameters'

const TABS: { id: Tab; label: string }[] = [
  { id: 'autobuild', label: 'Auto-Build' },
  { id: 'live', label: 'Live Groups' },
  { id: 'week', label: 'Week Grid' },
  { id: 'providers', label: 'Providers' },
  { id: 'tracker', label: 'Minutes Tracker' },
  { id: 'parameters', label: 'Parameters' },
]

type ToastKind = 'ok' | 'err' | 'info'

function classifyToast(msg: string): ToastKind {
  const m = msg.toLowerCase()
  if (
    m.includes('fail') ||
    m.includes('could not') ||
    m.includes('no protected') ||
    m.includes('error') ||
    m.includes('need ')
  ) {
    return 'err'
  }
  if (
    m.includes('ok') ||
    m.includes('imported') ||
    m.includes('parsed') ||
    m.includes('built') ||
    m.includes('replaced') ||
    m.includes('added') ||
    m.includes('synced') ||
    m.includes('ready')
  ) {
    return 'ok'
  }
  return 'info'
}

export function SchedulingPage() {
  const [tab, setTab] = useState<Tab>('autobuild')
  const [toast, setToast] = useState('')
  const [toastKind, setToastKind] = useState<ToastKind>('info')

  function flash(msg: string) {
    setToastKind(classifyToast(msg))
    setToast(msg)
    window.setTimeout(() => setToast(''), 5500)
  }

  return (
    <PageShell
      title="📅 Scheduling"
      description="Upload your school schedule, sync caseload, and auto-build the week — plus Live Groups, Team Week Grid, providers, minutes tracker, and parameters."
    >
      {toast && (
        <div
          role="status"
          className={`mb-3 rounded-lg px-3 py-2 text-xs font-semibold ${
            toastKind === 'ok'
              ? 'bg-emerald-600 text-white'
              : toastKind === 'err'
                ? 'bg-rose-700 text-white'
                : 'bg-[var(--accent)] text-white'
          }`}
        >
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

      {tab === 'autobuild' && <AutoBuildPanel onFlash={flash} />}
      {tab === 'live' && <LiveGroupsPanel onFlash={flash} />}
      {tab === 'week' && <TeamWeekPanel onFlash={flash} />}
      {tab === 'providers' && <TeamProvidersPanel onFlash={flash} />}
      {tab === 'tracker' && <TeamTrackerPanel onFlash={flash} />}
      {tab === 'parameters' && <TeamParametersPanel onFlash={flash} />}
    </PageShell>
  )
}

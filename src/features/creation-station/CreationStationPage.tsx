import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { AccessibilityPage } from '../accessibility/AccessibilityPage'
import { GenerationPage } from '../generation/GenerationPage'
import { TemplatesPage } from '../templates-forms/TemplatesPage'
import { IconLibraryPanel } from './IconLibraryPanel'

const HUB_TABS = [
  { id: 'access', label: '♿ Accessibility' },
  { id: 'generate', label: '✨ Generator' },
  { id: 'templates', label: '🎨 Templates & Forms' },
  { id: 'icons', label: '🔣 Icon Library' },
] as const

type HubId = (typeof HUB_TABS)[number]['id']

/** Creation Station — Accessibility + Generator + Templates + Icons under one hub. */
export function CreationStationPage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('panel') as HubId | null
  const panel: HubId = HUB_TABS.some((t) => t.id === raw) ? (raw as HubId) : 'icons'

  function setPanel(id: HubId) {
    setParams({ panel: id })
  }

  return (
    <div>
      <PageShell
        title="🎨 Creation Station"
        description="The creative wing from your Master Plan: Accessibility · Generator · Templates & boards · Icon Library — combined so the heart of PRISM stays in one place."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {HUB_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPanel(t.id)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                panel === t.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </PageShell>

      <div className="-mt-2">
        {panel === 'access' && <AccessibilityPage embedded />}
        {panel === 'generate' && <GenerationPage embedded />}
        {panel === 'templates' && <TemplatesPage embedded />}
        {panel === 'icons' && <IconLibraryPanel />}
      </div>
    </div>
  )
}

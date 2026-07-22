import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { AccessibilityPage } from '../accessibility/AccessibilityPage'
import { GenerationPage } from '../generation/GenerationPage'
import { TemplatesPage } from '../templates-forms/TemplatesPage'
import { ICON_CATALOG, type IconCategory } from '../../lib/icons/catalog'
import { IconGlyph } from '../../lib/icons/IconGlyph'

const HUB_TABS = [
  { id: 'access', label: '♿ Accessibility' },
  { id: 'generate', label: '✨ Generator' },
  { id: 'templates', label: '🎨 Templates & Forms' },
  { id: 'icons', label: '🔣 Icon Library' },
] as const

type HubId = (typeof HUB_TABS)[number]['id']

function IconsLibraryPanel() {
  const [cat, setCat] = useState<IconCategory | 'all'>('all')
  const cats = useMemo(() => {
    const set = new Set(ICON_CATALOG.map((i) => i.category))
    return ['all', ...set] as const
  }, [])
  const list = ICON_CATALOG.filter((i) => cat === 'all' || i.category === cat)

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card">
      <h2 className="font-heading text-sm font-bold">Icon / AAC library</h2>
      <p className="mt-1 text-xs text-[var(--subtext)]">
        Browse symbols for boards and materials. Drop Claude’s pack into{' '}
        <code className="text-[10px]">public/icons/aac/</code> — catalog auto-resolves files.
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              cat === c ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
            }`}
            onClick={() => setCat(c as IconCategory | 'all')}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {list.map((icon) => (
          <div
            key={icon.id}
            className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] tint-sky p-2 text-center"
          >
            <IconGlyph icon={icon} label={icon.label} size={48} className="h-12 w-12" />
            <span className="text-[10px] font-semibold">{icon.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Creation Station — Accessibility + Generator + Templates + Icons under one hub. */
export function CreationStationPage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('panel') as HubId | null
  const panel: HubId = HUB_TABS.some((t) => t.id === raw) ? (raw as HubId) : 'access'

  function setPanel(id: HubId) {
    setParams(id === 'access' ? {} : { panel: id })
  }

  return (
    <div>
      <PageShell
        title="🎨 Creation Station"
        description="Make it: accessibility formats, AI drafts, templates/materials, and icon boards — one place for everything you create."
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

      {/* Nested pages already wrap PageShell — strip duplicate chrome by rendering body only when possible.
          For now embed full pages; titles remain useful as section headers. */}
      <div className="-mt-2">
        {panel === 'access' && <AccessibilityPage embedded />}
        {panel === 'generate' && <GenerationPage embedded />}
        {panel === 'templates' && <TemplatesPage embedded />}
        {panel === 'icons' && <IconsLibraryPanel />}
      </div>
    </div>
  )
}

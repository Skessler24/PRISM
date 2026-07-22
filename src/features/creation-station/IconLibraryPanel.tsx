import { useMemo, useState } from 'react'
import {
  AAC_ANIMATED_PACK,
  downloadIconPngStub,
  ICON_CATALOG,
  ICON_CATEGORY_ORDER,
  type IconCategory,
  type PrismIcon,
} from '../../lib/icons/catalog'
import { IconGlyph } from '../../lib/icons/IconGlyph'

const FAV_KEY = 'prism_icon_favorites_v1'
const RECENT_KEY = 'prism_icon_recent_v1'

type MotionFilter = 'all' | 'static' | 'animated'

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeIds(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids.slice(0, 40)))
}

/** Full Icon Library — Master Plan Phase 8 / Million Dollar Idea. */
export function IconLibraryPanel() {
  const [cat, setCat] = useState<IconCategory | 'all' | 'favorites' | 'recent'>('all')
  const [motion, setMotion] = useState<MotionFilter>('all')
  const [q, setQ] = useState('')
  const [favorites, setFavorites] = useState(() => readIds(FAV_KEY))
  const [recent, setRecent] = useState(() => readIds(RECENT_KEY))
  const [selected, setSelected] = useState<PrismIcon | null>(null)
  const [customLabel, setCustomLabel] = useState('')
  const [toast, setToast] = useState('')

  const catsInUse = useMemo(() => {
    const present = new Set(ICON_CATALOG.map((i) => i.category))
    return ICON_CATEGORY_ORDER.filter((c) => present.has(c))
  }, [])

  const list = useMemo(() => {
    let base = ICON_CATALOG
    if (cat === 'favorites') base = ICON_CATALOG.filter((i) => favorites.includes(i.id))
    else if (cat === 'recent')
      base = recent
        .map((id) => ICON_CATALOG.find((i) => i.id === id))
        .filter(Boolean) as PrismIcon[]
    else if (cat !== 'all') base = ICON_CATALOG.filter((i) => i.category === cat)

    if (motion === 'animated') base = base.filter((i) => i.animated)
    else if (motion === 'static') base = base.filter((i) => !i.animated)

    const needle = q.trim().toLowerCase()
    if (!needle) return base
    return base.filter(
      (i) =>
        i.label.toLowerCase().includes(needle) ||
        i.id.includes(needle) ||
        i.category.includes(needle) ||
        (i.motion || '').includes(needle),
    )
  }, [cat, motion, q, favorites, recent])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 1800)
  }

  function tap(icon: PrismIcon) {
    setSelected(icon)
    setCustomLabel(icon.label.replace(/ ✦$/, ''))
    const next = [icon.id, ...recent.filter((id) => id !== icon.id)].slice(0, 24)
    setRecent(next)
    writeIds(RECENT_KEY, next)
  }

  function toggleFav(id: string) {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [id, ...favorites]
    setFavorites(next)
    writeIds(FAV_KEY, next)
  }

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
      style={{ borderTop: '4px solid var(--accent)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-bold">🔣 Icon Library</h2>
          <p className="mt-0.5 text-xs text-[var(--subtext)]">
            Fitzgerald AAC pack + animated actions/emotions for digital boards &amp; Smart TV
            sessions. Same theme colors — motion only where it helps meaning.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full tint-lav px-2 py-0.5 text-[10px] font-bold">
            {ICON_CATALOG.length} icons
          </span>
          <span className="rounded-full tint-mint px-2 py-0.5 text-[10px] font-bold">
            {AAC_ANIMATED_PACK.length} animated
          </span>
        </div>
      </div>

      {toast && (
        <div className="mt-2 rounded-lg bg-[var(--accent)] px-2 py-1 text-[10px] font-semibold text-white">
          {toast}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="min-w-[10rem] flex-1 rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
          placeholder="Search icons…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
            cat === 'favorites' ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
          }`}
          onClick={() => setCat('favorites')}
        >
          ★ Favorites
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
            cat === 'recent' ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
          }`}
          onClick={() => setCat('recent')}
        >
          Recent
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {(
          [
            ['all', 'All motion'],
            ['static', 'Static'],
            ['animated', '✦ Animated'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              motion === id ? 'bg-[#1E3A5F] text-white' : 'border border-[var(--border)]'
            }`}
            onClick={() => setMotion(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            cat === 'all' ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
          }`}
          onClick={() => setCat('all')}
        >
          all
        </button>
        {catsInUse.map((c) => (
          <button
            key={c}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              cat === c ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
            }`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto rounded-xl tint-sky p-2">
        {list.slice(0, 16).map((icon) => (
          <button
            key={`rib-${icon.id}`}
            type="button"
            title={icon.label}
            className="relative shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-1.5 hover:border-[var(--accent)]"
            onClick={() => tap(icon)}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/prism-icon', icon.id)}
          >
            <IconGlyph icon={icon} label={icon.label} size={40} />
            {icon.animated ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-[#1E3A5F] px-1 text-[8px] font-bold text-white">
                ✦
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_16rem]">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {list.map((icon) => (
            <button
              key={icon.id}
              type="button"
              onClick={() => tap(icon)}
              className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                selected?.id === icon.id
                  ? 'border-[var(--accent)] tint-lav'
                  : 'border-[var(--border)] tint-sky hover:border-[var(--accent)]'
              }`}
            >
              <IconGlyph icon={icon} label={icon.label} size={48} className="h-12 w-12" />
              <span className="text-[10px] font-semibold leading-tight">{icon.label}</span>
              {icon.animated ? (
                <span className="text-[8px] font-bold uppercase tracking-wide text-[var(--subtext)]">
                  {icon.motion || 'motion'}
                </span>
              ) : null}
              {favorites.includes(icon.id) ? (
                <span className="text-[9px] text-amber-600">★</span>
              ) : null}
            </button>
          ))}
          {!list.length ? (
            <p className="col-span-full text-center text-xs text-[var(--subtext)]">No icons match.</p>
          ) : null}
        </div>

        <aside className="rounded-xl border border-[var(--border)] tint-mint p-3">
          {!selected ? (
            <p className="text-xs text-[var(--subtext)]">
              Tap an icon to favorite, rename for boards, or download SVG. Animated tiles are ready
              for interactive AAC / Smart TV boards.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <IconGlyph icon={selected} label={selected.label} size={72} />
              </div>
              <label className="block text-[10px] font-bold">
                Custom label
                <input
                  className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-xs"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
              </label>
              <p className="text-[10px] text-[var(--subtext)]">
                Category: <strong>{selected.category}</strong> · id: {selected.id}
                {selected.animated
                  ? ` · ✦ ${selected.motion || 'animated'} (inline for TV boards)`
                  : ' · static'}
              </p>
              <button
                type="button"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-[10px] font-bold"
                onClick={() => {
                  toggleFav(selected.id)
                  flash(favorites.includes(selected.id) ? 'Removed from favorites' : 'Favorited ★')
                }}
              >
                {favorites.includes(selected.id) ? '★ Unfavorite' : '☆ Favorite'}
              </button>
              <button
                type="button"
                className="w-full rounded-lg bg-[var(--accent)] px-2 py-1.5 text-[10px] font-bold text-white"
                onClick={() => {
                  downloadIconPngStub(selected)
                  flash('Downloaded SVG')
                }}
              >
                Download SVG
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-[10px] font-bold"
                onClick={() => {
                  void navigator.clipboard.writeText(customLabel || selected.label)
                  flash('Label copied for boards')
                }}
              >
                Copy label
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

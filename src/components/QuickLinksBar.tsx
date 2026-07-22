import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  addFavorite,
  DEFAULT_DISTRICT_LINKS,
  loadFavorites,
  removeFavorite,
  type FavoriteLink,
} from '../lib/favorites/store'

export function QuickLinksBar() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState(() => loadFavorites())
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  function openLink(f: FavoriteLink) {
    if (f.internal || f.url.startsWith('/')) {
      navigate(f.url.startsWith('/') ? f.url : `/${f.url}`)
      return
    }
    window.open(f.url, '_blank', 'noopener,noreferrer')
  }

  function saveFav() {
    if (!label.trim() || !url.trim()) return
    setFavorites(addFavorite(label, url))
    setLabel('')
    setUrl('')
    setAdding(false)
  }

  return (
    <section
      className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
      style={{ borderTop: '4px solid var(--accent-h)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-bold">Quick Links</h2>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-bold"
          onClick={() => setAdding((v) => !v)}
        >
          ★ Add favorite
        </button>
      </div>
      <p className="mt-0.5 text-[10px] text-[var(--subtext)]">
        District tools + your bookmarks (in-app paths or external URLs).
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {DEFAULT_DISTRICT_LINKS.map((l) =>
          l.internal ? (
            <Link
              key={l.id}
              to={l.url}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] tint-sky px-3 py-2 text-xs font-semibold hover:border-[var(--accent)]"
            >
              {l.label}
            </Link>
          ) : (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] tint-mint px-3 py-2 text-xs font-semibold hover:border-[var(--accent)]"
            >
              {l.label} ↗
            </a>
          ),
        )}
      </div>

      {(favorites.length > 0 || adding) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
          {favorites.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] tint-lav px-2 py-1.5 text-xs font-semibold"
            >
              <button type="button" className="hover:underline" onClick={() => openLink(f)}>
                ★ {f.label}
              </button>
              <button
                type="button"
                className="ml-1 text-[10px] text-red-600"
                aria-label={`Remove ${f.label}`}
                onClick={() => setFavorites(removeFavorite(f.id))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {adding && (
        <div className="mt-3 grid gap-2 rounded-xl tint-sun p-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            placeholder="Label (e.g. Team Scheduling)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--border)] px-2 py-2 text-xs"
            placeholder="URL or /path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
            onClick={saveFav}
          >
            Save
          </button>
        </div>
      )}
    </section>
  )
}

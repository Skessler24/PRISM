/** External + in-app favorites (original Quick Links bar). */

export type FavoriteLink = {
  id: string
  label: string
  url: string
  /** true = open in same app (path), false = external */
  internal?: boolean
}

const KEY = 'prism_favorites_v1'

export const DEFAULT_DISTRICT_LINKS: FavoriteLink[] = [
  { id: 'sched', label: 'Scheduling', url: '/scheduling', internal: true },
  { id: 'outlook', label: 'Outlook', url: 'https://outlook.office.com/' },
  { id: 'enrich', label: 'Enrich IEP', url: 'https://login.frontlineeducation.com/' },
  { id: 'mycherry', label: 'MyCherry Creek', url: 'https://www.cherrycreekschools.org/' },
  { id: 'onedrive', label: 'OneDrive', url: 'https://onedrive.live.com/' },
  { id: 'sharepoint', label: 'SharePoint', url: 'https://www.microsoft.com/microsoft-365/sharepoint' },
]

export function loadFavorites(): FavoriteLink[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FavoriteLink[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveFavorites(list: FavoriteLink[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)))
}

export function addFavorite(label: string, url: string, internal = false): FavoriteLink[] {
  const list = loadFavorites()
  const next = [
    {
      id: `fav-${Date.now()}`,
      label: label.trim() || 'Favorite',
      url: url.trim(),
      internal: internal || url.startsWith('/'),
    },
    ...list,
  ]
  saveFavorites(next)
  return next
}

export function removeFavorite(id: string): FavoriteLink[] {
  const next = loadFavorites().filter((f) => f.id !== id)
  saveFavorites(next)
  return next
}

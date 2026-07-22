/** Saved Resource Hub research / family handouts (local only). */

export type SavedResource = {
  id: string
  title: string
  kind: 'research' | 'family'
  query?: string
  body: string
  createdAt: string
}

const KEY = 'prism_saved_resources_v1'

export function loadSavedResources(): SavedResource[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedResource[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSavedResources(list: SavedResource[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 60)))
}

export function upsertSavedResource(item: SavedResource) {
  const list = loadSavedResources().filter((x) => x.id !== item.id)
  saveSavedResources([item, ...list])
}

export function deleteSavedResource(id: string) {
  saveSavedResources(loadSavedResources().filter((x) => x.id !== id))
}

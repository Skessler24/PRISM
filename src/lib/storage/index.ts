import { GraphOneDriveRepository } from './graph'
import { LocalStorageRepository } from './local'
import type { StorageRepository } from './types'

export type { StorageRepository } from './types'
export { STORAGE_KEYS } from './types'
export { LocalStorageRepository } from './local'
export { GraphOneDriveRepository } from './graph'

export function createStorageRepository(): StorageRepository {
  const backend = (import.meta.env.VITE_STORAGE_BACKEND || 'local').toLowerCase()
  if (backend === 'graph' || backend === 'onedrive') {
    return new GraphOneDriveRepository()
  }
  return new LocalStorageRepository()
}

/** Default app storage (Local unless VITE_STORAGE_BACKEND=graph). */
export const storage: StorageRepository = createStorageRepository()

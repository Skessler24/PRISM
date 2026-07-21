/** Storage repository interface — mock impl now; Graph/OneDrive in Prompt 6. */
import type { Student } from '../students/types'

export interface StorageRepository {
  getStudents(): Promise<Student[]>
  saveStudents(students: Student[]): Promise<void>
}

const KEY = 'prism_students_v1'

export class LocalStorageStudentsRepository implements StorageRepository {
  async getStudents() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as Student[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  async saveStudents(students: Student[]) {
    localStorage.setItem(KEY, JSON.stringify(students))
  }
}

export const storage: StorageRepository = new LocalStorageStudentsRepository()

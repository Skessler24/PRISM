/** Storage repository interface — mock impl now; Graph/OneDrive in Prompt 6. */
export interface StorageRepository {
  getStudents(): Promise<unknown[]>
  saveStudents(students: unknown[]): Promise<void>
}

export class MockStorageRepository implements StorageRepository {
  async getStudents() {
    return []
  }

  async saveStudents(students: unknown[]) {
    console.info('[storage stub] saveStudents()', students.length, 'records')
  }
}

export const storage: StorageRepository = new MockStorageRepository()

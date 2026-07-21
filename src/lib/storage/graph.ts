import type { FormTemplate, TemplateInstance } from '../templates/catalog'
import type { Student } from '../students/types'
import { LocalStorageRepository } from './local'
import type { StorageRepository } from './types'

/**
 * Graph / OneDrive backend — OAuth not wired yet.
 * Delegates to Local so the app never bricks without credentials.
 * TODO(Graph OAuth): MSAL login + Files.ReadWrite on app folder "PRISM".
 * Env when real: VITE_AZURE_AD_CLIENT_ID, VITE_AZURE_AD_TENANT_ID, VITE_GRAPH_DRIVE_PATH
 */
export class GraphOneDriveRepository implements StorageRepository {
  private local = new LocalStorageRepository()

  private warn(op: string) {
    console.warn(
      `[storage/graph] ${op}: Graph OAuth not configured — using localStorage. TODO(Graph OAuth)`,
    )
  }

  async getStudents(): Promise<Student[]> {
    this.warn('getStudents')
    return this.local.getStudents()
  }

  async saveStudents(students: Student[]): Promise<void> {
    this.warn('saveStudents')
    return this.local.saveStudents(students)
  }

  async getTemplateInstances(): Promise<TemplateInstance[]> {
    this.warn('getTemplateInstances')
    return this.local.getTemplateInstances()
  }

  async saveTemplateInstances(list: TemplateInstance[]): Promise<void> {
    this.warn('saveTemplateInstances')
    return this.local.saveTemplateInstances(list)
  }

  async getCustomTemplates(): Promise<FormTemplate[]> {
    this.warn('getCustomTemplates')
    return this.local.getCustomTemplates()
  }

  async saveCustomTemplates(list: FormTemplate[]): Promise<void> {
    this.warn('saveCustomTemplates')
    return this.local.saveCustomTemplates(list)
  }
}

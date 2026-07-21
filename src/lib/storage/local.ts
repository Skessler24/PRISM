import type { FormTemplate, TemplateInstance } from '../templates/catalog'
import type { Student } from '../students/types'
import { STORAGE_KEYS, type StorageRepository } from './types'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as T
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

/** Browser-only persistence (FERPA: no PHI committed to git). */
export class LocalStorageRepository implements StorageRepository {
  async getStudents() {
    const list = readJson<Student[]>(STORAGE_KEYS.students, [])
    return Array.isArray(list) ? list : []
  }

  async saveStudents(students: Student[]) {
    writeJson(STORAGE_KEYS.students, students)
  }

  async getTemplateInstances() {
    const list = readJson<TemplateInstance[]>(STORAGE_KEYS.templateInstances, [])
    return Array.isArray(list) ? list : []
  }

  async saveTemplateInstances(list: TemplateInstance[]) {
    writeJson(STORAGE_KEYS.templateInstances, list)
  }

  async getCustomTemplates() {
    const list = readJson<FormTemplate[]>(STORAGE_KEYS.customTemplates, [])
    return Array.isArray(list) ? list : []
  }

  async saveCustomTemplates(list: FormTemplate[]) {
    writeJson(STORAGE_KEYS.customTemplates, list)
  }
}

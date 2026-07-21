import type { FormTemplate, TemplateInstance } from '../templates/catalog'
import type { Student } from '../students/types'

export interface StorageRepository {
  getStudents(): Promise<Student[]>
  saveStudents(students: Student[]): Promise<void>
  getTemplateInstances(): Promise<TemplateInstance[]>
  saveTemplateInstances(list: TemplateInstance[]): Promise<void>
  getCustomTemplates(): Promise<FormTemplate[]>
  saveCustomTemplates(list: FormTemplate[]): Promise<void>
}

export const STORAGE_KEYS = {
  students: 'prism_students_v1',
  templateInstances: 'prism_template_instances_v1',
  customTemplates: 'prism_district_templates_v1',
} as const

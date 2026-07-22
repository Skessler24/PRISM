import { createContext } from 'react'
import type { Student } from './types'

export type StudentsContextValue = {
  students: Student[]
  restoreDemo: () => void
  setStudents: (next: Student[]) => void
  addStudent: (student: Student) => void
  updateStudent: (id: string, patch: Partial<Student> | Student) => void
  removeStudent: (id: string) => void
  ready?: boolean
}

export const StudentsContext = createContext<StudentsContextValue | null>(null)

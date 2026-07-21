import { createContext } from 'react'
import type { Student } from './types'

export type StudentsContextValue = {
  students: Student[]
  restoreDemo: () => void
  setStudents: (next: Student[]) => void
  ready?: boolean
}

export const StudentsContext = createContext<StudentsContextValue | null>(null)

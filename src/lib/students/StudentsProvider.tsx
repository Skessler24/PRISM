import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import demoStudents from '../../data/students.mock.json'
import { normalizeStudent } from './normalizeStudent'
import type { Student } from './types'

const STORAGE_KEY = 'prism_students_v1'

type StudentsContextValue = {
  students: Student[]
  restoreDemo: () => void
  setStudents: (next: Student[]) => void
}

const StudentsContext = createContext<StudentsContextValue | null>(null)

function readStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Student>[]
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((s) => {
          const demo = (demoStudents as Student[]).find((d) => d.id === s.id && s.source === 'demo')
          if (demo) {
            return normalizeStudent({
              ...demo,
              ...s,
              hasIEP: s.hasIEP != null ? s.hasIEP : demo.hasIEP,
              has504: s.has504 != null ? s.has504 : demo.has504,
              hasMLL: s.hasMLL != null ? s.hasMLL : demo.hasMLL,
            })
          }
          return normalizeStudent(s as Student)
        })
      }
    }
  } catch {
    /* ignore */
  }
  return (demoStudents as Student[]).map((s) => normalizeStudent(s))
}

function writeStudents(list: Student[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudentsState] = useState<Student[]>(() => readStudents())

  const setStudents = useCallback((next: Student[]) => {
    const normalized = next.map((s) => normalizeStudent(s))
    setStudentsState(normalized)
    writeStudents(normalized)
  }, [])

  const restoreDemo = useCallback(() => {
    const demo = (demoStudents as Student[]).map((s) => normalizeStudent(s))
    setStudentsState(demo)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ students, setStudents, restoreDemo }),
    [students, setStudents, restoreDemo],
  )

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>
}

export function useStudents() {
  const ctx = useContext(StudentsContext)
  if (!ctx) throw new Error('useStudents must be used within StudentsProvider')
  return ctx
}

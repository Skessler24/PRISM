import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import demoStudents from '../../data/students.mock.json'
import { normalizeStudent } from './normalizeStudent'
import { StudentsContext } from './students-context'
import type { Student } from './types'
import { storage } from '../storage'

function demoList(): Student[] {
  return (demoStudents as Student[]).map((s) => normalizeStudent(s))
}

function mergeWithDemo(parsed: Partial<Student>[]): Student[] {
  return parsed.map((s) => {
    const demo = demoList().find((d) => d.id === s.id && s.source === 'demo')
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

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudentsState] = useState<Student[]>(() => demoList())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stored = await storage.getStudents()
        if (cancelled) return
        if (Array.isArray(stored) && stored.length) {
          setStudentsState(mergeWithDemo(stored))
        } else {
          setStudentsState(demoList())
        }
      } catch {
        if (!cancelled) setStudentsState(demoList())
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setStudents = useCallback((next: Student[]) => {
    const normalized = next.map((s) => normalizeStudent(s))
    setStudentsState(normalized)
    void storage.saveStudents(normalized)
  }, [])

  const restoreDemo = useCallback(() => {
    const demo = demoList()
    setStudentsState(demo)
    void storage.saveStudents(demo)
  }, [])

  const value = useMemo(
    () => ({ students, setStudents, restoreDemo, ready }),
    [students, setStudents, restoreDemo, ready],
  )

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>
}

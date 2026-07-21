import { useContext } from 'react'
import { StudentsContext } from './students-context'

export function useStudents() {
  const ctx = useContext(StudentsContext)
  if (!ctx) throw new Error('useStudents must be used within StudentsProvider')
  return ctx
}

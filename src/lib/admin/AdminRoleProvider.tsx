import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  ADMIN_PILOT_CODE,
  AdminRoleContext,
  PRISM_ROLE_KEY,
  type UserRole,
} from './admin-role-context'

function readRole(): UserRole {
  try {
    return localStorage.getItem(PRISM_ROLE_KEY) === 'admin' ? 'admin' : 'staff'
  } catch {
    return 'staff'
  }
}

export function AdminRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => readRole())

  const persist = useCallback((next: UserRole) => {
    setRoleState(next)
    try {
      localStorage.setItem(PRISM_ROLE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      role,
      isAdmin: role === 'admin',
      unlockAdmin: (code: string) => {
        if (code.trim() === ADMIN_PILOT_CODE) {
          persist('admin')
          return true
        }
        return false
      },
      setStaff: () => persist('staff'),
    }),
    [role, persist],
  )

  return <AdminRoleContext.Provider value={value}>{children}</AdminRoleContext.Provider>
}

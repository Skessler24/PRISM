import { createContext, useContext } from 'react'

export type UserRole = 'staff' | 'admin'

export const PRISM_ROLE_KEY = 'prism_user_role_v1'
/** Pilot unlock — same as deploy/ Admin access */
export const ADMIN_PILOT_CODE = 'prism-admin'

export type AdminRoleContextValue = {
  role: UserRole
  isAdmin: boolean
  unlockAdmin: (code: string) => boolean
  setStaff: () => void
}

export const AdminRoleContext = createContext<AdminRoleContextValue | null>(null)

export function useAdminRole() {
  const ctx = useContext(AdminRoleContext)
  if (!ctx) throw new Error('useAdminRole must be used within AdminRoleProvider')
  return ctx
}

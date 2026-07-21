import { Navigate } from 'react-router-dom'
import { useAdminRole } from '../../lib/admin/admin-role-context'
import { DistrictProfilePage } from './DistrictProfilePage'

/** District Administration is admin-gated (same pilot code as deploy/). */
export function AdminDistrictGate() {
  const { isAdmin } = useAdminRole()
  if (!isAdmin) return <Navigate to="/" replace />
  return <DistrictProfilePage />
}

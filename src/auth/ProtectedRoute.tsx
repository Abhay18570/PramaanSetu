import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import { routeAccess } from './model'
import type { Role } from './model'
export default function ProtectedRoute({ role }: { role: Role }) {
  const { user } = useAuth()
  const redirect = routeAccess(user, role)
  return redirect ? <Navigate to={redirect} replace /> : <Outlet />
}

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function AdminGuard() {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

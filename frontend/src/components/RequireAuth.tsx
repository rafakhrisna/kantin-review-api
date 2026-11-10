import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'
import { Loader } from './StateViews'
import { ForbiddenPage } from '../pages/StatusPages'

export default function RequireAuth({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader label="Memeriksa sesi login..." />

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, message: 'Silakan login terlebih dahulu untuk mengakses halaman ini.' }}
      />
    )
  }

  if (roles && !roles.includes(user.role)) return <ForbiddenPage />

  return <Outlet />
}
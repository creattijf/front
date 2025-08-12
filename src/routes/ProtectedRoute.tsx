import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import Loader from '../components/Loader'

export default function ProtectedRoute() {
  const { initializing, isAuthenticated } = useAuth()
  if (initializing) return <Loader fullscreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
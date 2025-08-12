import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TasksPage from './pages/TasksPage'
import ProtectedRoute from './routes/ProtectedRoute'
import { useAuth } from './providers/AuthProvider'
import DashboardPage from './pages/DashboardPage'



export default function App() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const showHeader = true 

  return (
    <>
      {showHeader && <Header />}
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/tasks' : '/login'} replace />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/tasks" element={<TasksPage />} />
        </Route>
        
		<Route element={<ProtectedRoute />}>
  <Route path="/tasks" element={<TasksPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />  {/* <-- */}
</Route>
		
        <Route
          path="*"
          element={
            <Navigate
              to={isAuthenticated ? '/tasks' : '/login'}
              replace
              state={{ from: location }}
            />
          }
        />
      </Routes>
    </>
  )
}

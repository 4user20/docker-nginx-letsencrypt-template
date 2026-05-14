import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import Dashboard from '@/pages/Dashboard'
import Leads from '@/pages/Leads'
import Checklists from '@/pages/Checklists'
import DeploymentStatus from '@/pages/DeploymentStatus'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/checklists" element={<Checklists />} />
        <Route path="/deployment" element={<DeploymentStatus />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

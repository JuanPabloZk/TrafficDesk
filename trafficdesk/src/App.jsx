import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute   from './components/ProtectedRoute'
import AuthPage         from './components/AuthPage'
import Dashboard        from './pages/Dashboard'

// Callback OAuth (Supabase redireciona para cá após login com Google)
function AuthCallback() {
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login"         element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protegida */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Raiz → dashboard (ou login se não autenticado) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

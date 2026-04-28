import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Spinner de carregamento com o tema do app
function LoadingScreen() {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#07090F', flexDirection:'column', gap:16,
      fontFamily:"'Sora',system-ui,sans-serif",
    }}>
      <div style={{
        width:40, height:40, borderRadius:10, background:'#6366F1',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
          <path d="M2 11.5 7 2.5l5 9H2z" fill="white"/>
        </svg>
      </div>
      <div style={{
        width:24, height:24, border:'2px solid rgba(99,102,241,.3)',
        borderTop:'2px solid #6366F1', borderRadius:'50%',
        animation:'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{fontSize:12, color:'#475569'}}>Carregando...</span>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!user) {
    // Salva a rota que o usuário tentou acessar para redirecionar após login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

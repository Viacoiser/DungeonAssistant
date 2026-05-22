import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore()
  
  // Si no hay token o usuario, redirigir a login
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  // Si hay autenticación válida, renderizar el componente protegido
  return children
}

export default ProtectedRoute

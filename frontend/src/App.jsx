import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { initSocket } from './services/socket'
import { getAuthAPI } from './services/api'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { setUser, setToken, token } = useAuthStore()
  const [isHydrating, setIsHydrating] = useState(true)

  useEffect(() => {
    /**
     * Auto-login: Restaurar sesión desde localStorage
     * Se ejecuta una sola vez al montar la app
     */
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token')
        
        if (storedToken) {
          // Validar token con backend
          const authAPI = getAuthAPI()
          try {
            const response = await authAPI.get('/auth/me')
            const userData = response.data

            // Restaurar estado de Zustand
            setToken(storedToken)
            setUser(userData)

            // Inicializar Socket.io con usuario autenticado
            initSocket()
          } catch (error) {
            // Token inválido o expirado
            console.log('Token inválido, limpiando sesión')
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
          }
        }
      } catch (error) {
        console.error('Error restaurando sesión:', error)
      } finally {
        setIsHydrating(false)
      }
    }

    restoreSession()
  }, [setUser, setToken])

  // Mostrar pantalla de carga mientras se restaura la sesión y valida el token
  if (isHydrating) {
    return <LoadingSpinner fullPage text="Cargando DungeonAssistant..." size={72} />
  }

  return <RouterProvider router={router} />
}

export default App

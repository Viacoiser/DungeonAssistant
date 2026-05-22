/**
 * Indicador visual de conexión/desconexión de Socket.io
 * Muestra un spinner cuando se está conectando
 */

import { useSocketStore } from '../store/useSocketStore'
import { useAuthStore } from '../store/useAuthStore'

export default function SocketConnectingIndicator() {
  const { isConnected, isConnecting } = useSocketStore()
  const { token } = useAuthStore()

  // No mostrar si no hay token (no autenticado)
  if (!token) return null

  // Indicador de carga
  if (isConnecting) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2 animate-pulse z-50">
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-spin"></div>
        <span className="text-sm text-yellow-700">⏳ Conectando socket...</span>
      </div>
    )
  }

  // Indicador de conectado
  if (isConnected) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-green-500/20 border border-green-500 rounded-lg px-4 py-2 z-50">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-700">🔗 Conectado</span>
      </div>
    )
  }

  // Indicador de desconectado
  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-red-500/20 border border-red-500 rounded-lg px-4 py-2 z-50">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <span className="text-sm text-red-700">❌ Desconectado</span>
    </div>
  )
}

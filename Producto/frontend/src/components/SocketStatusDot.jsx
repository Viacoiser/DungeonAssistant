/**
 * Indicador compacto de estado de Socket.io para navbar/sidebar
 * Versión minimizada
 */

import { useSocketStore } from '../store/useSocketStore'
import { useAuthStore } from '../store/useAuthStore'

export default function SocketStatusDot() {
  const { isConnected, isConnecting } = useSocketStore()
  const { token } = useAuthStore()

  if (!token) return null

  return (
    <div className="flex items-center gap-2" title={isConnecting ? 'Conectando...' : isConnected ? 'Conectado' : 'Desconectado'}>
      {isConnecting ? (
        <>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-yellow-600">Conectando</span>
        </>
      ) : isConnected ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600">Conectado</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-xs text-red-600">Desconectado</span>
        </>
      )}
    </div>
  )
}

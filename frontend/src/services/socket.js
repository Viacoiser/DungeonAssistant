import io from 'socket.io-client'
import { useSocketStore } from '../store/useSocketStore'
import { useAuthStore } from '../store/useAuthStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'

let socket = null

export const initSocket = () => {
  if (socket) return socket

  const token = useAuthStore.getState().token
  
  if (!token) {
    console.warn('⚠️ No se puede inicializar socket sin token')
    return null
  }

  // Inicializar socket con autenticación
  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('✅ Socket conectado:', socket.id)
    useSocketStore.setState({ isConnected: true })
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket desconectado:', reason)
    useSocketStore.setState({ isConnected: false })
  })

  socket.on('authenticated', (data) => {
    console.log('🔐 Socket autenticado correctamente')
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })

  // Eventos globales
  socket.on('user_joined', (data) => {
    console.log('👤 Usuario unido:', data.username)
  })

  socket.on('message', (data) => {
    console.log('📩 Nuevo mensaje:', data)
    // Aquí podrías despachar una notificación al store
  })

  useSocketStore.setState({ socket })
  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    useSocketStore.setState({ socket: null, isConnected: false })
  }
}

export const joinCampaign = (campaignId) => {
  const socket = getSocket()
  if (socket) {
    socket.emit('join_campaign', { campaign_id: campaignId })
  }
}

export const leaveCampaign = (campaignId) => {
  const socket = getSocket()
  if (socket) {
    socket.emit('leave_campaign', { campaign_id: campaignId })
  }
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinCampaign,
  leaveCampaign,
}

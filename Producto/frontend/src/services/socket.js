import io from 'socket.io-client'
import { useSocketStore } from '../store/useSocketStore'
import { useAuthStore } from '../store/useAuthStore'

const getSocketUrl = () => {
  if (import.meta.env.PROD) {
    // Railway HTTPS: no incluir puerto
    return 'https://dungeonassistanttest-production.up.railway.app'
  }
  return '/'
}

const SOCKET_URL = getSocketUrl()

let socket = null

export const initSocket = () => {
  if (socket) return socket

  const token = useAuthStore.getState().token
  
  if (!token) {
    console.warn('No se puede inicializar socket sin token')
    return null
  }

  useSocketStore.setState({ isConnecting: true })
  console.log('Conectando socket...')

  socket = io(SOCKET_URL, {
    auth: { token },
    query: { token },  // Pasar token en query string también (para polling)
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']  // Permitir ambos transportes
  })

  socket.on('connect', () => {
    console.log('Socket conectado:', socket.id)
    useSocketStore.setState({ isConnected: true, isConnecting: false })
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket desconectado:', reason)
    useSocketStore.setState({ isConnected: false, isConnecting: false })
  })

  socket.on('authenticated', (data) => {
    console.log('Socket autenticado correctamente')
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
    useSocketStore.setState({ isConnecting: false })
  })

  socket.on('connect_error', (error) => {
    console.error('Error de conexión:', error)
    useSocketStore.setState({ isConnecting: false })
  })

  socket.on('user_joined', (data) => {
    console.log('Usuario unido:', data.username)
  })

  socket.on('message', (data) => {
    console.log('Nuevo mensaje:', data)
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
    useSocketStore.setState({ socket: null, isConnected: false, isConnecting: false })
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

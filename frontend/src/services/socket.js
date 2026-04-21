import io from 'socket.io-client'
import { useSocketStore } from '../store/useSocketStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'

let socket = null

export const initSocket = () => {
  // Por ahora desactivado: Socket.io no está configurado en el backend
  // if (socket) return socket

  // socket = io(SOCKET_URL, {
  //   reconnection: true,
  //   reconnectionDelay: 1000,
  //   reconnectionDelayMax: 5000,
  //   reconnectionAttempts: 5,
  // })

  // socket.on('connect', () => {
  //   console.log('✅ Socket conectado:', socket.id)
  //   useSocketStore.setState({ isConnected: true })
  // })

  // socket.on('disconnect', () => {
  //   console.log('❌ Socket desconectado')
  //   useSocketStore.setState({ isConnected: false })
  // })

  // socket.on('error', (error) => {
  //   console.error('Socket error:', error)
  // })

  // useSocketStore.setState({ socket })
  // return socket
}

export const getSocket = () => {
  if (!socket) {
    initSocket()
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

// Socket event handlers
export const joinCampaign = (campaignId) => {
  const socket = getSocket()
  socket.emit('join_campaign', { campaign_id: campaignId })
}

export const leaveCampaign = (campaignId) => {
  const socket = getSocket()
  socket.emit('leave_campaign', { campaign_id: campaignId })
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinCampaign,
  leaveCampaign,
}

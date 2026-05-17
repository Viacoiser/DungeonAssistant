/**
 * Store de Socket.io con Zustand
 */
import { create } from 'zustand'

export const useSocketStore = create((set) => ({
  socket: null,
  isConnected: false,
  notifications: [],

  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}))

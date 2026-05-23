/**
 * Store de Socket.io con Zustand
 */
import { create } from 'zustand'

export const useSocketStore = create((set) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  notifications: [],

  // Combat global state (persists across navigation)
  combatState: { status: 'inactive', turns: [], history: [], current_turn: 0, campaign_id: null },
  isTrackerOpen: false,
  combatCampaignId: null,
  combatIsGM: false,
  combatActiveUsers: [],

  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),

  setCombatState: (combatState) => set({ combatState }),
  setIsTrackerOpen: (isTrackerOpen) => set({ isTrackerOpen }),
  setCombatCampaignId: (combatCampaignId) => set({ combatCampaignId }),
  setCombatIsGM: (combatIsGM) => set({ combatIsGM }),
  setCombatActiveUsers: (combatActiveUsers) => set({ combatActiveUsers }),

  resetCombat: () => set({
    combatState: { status: 'inactive', turns: [], history: [], current_turn: 0, campaign_id: null },
    isTrackerOpen: false,
    combatCampaignId: null,
    combatIsGM: false,
    combatActiveUsers: [],
  }),

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

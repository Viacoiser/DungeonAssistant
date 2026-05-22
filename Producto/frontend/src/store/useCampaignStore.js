/**
 * Store de campaña activa con Zustand
 */
import { create } from 'zustand'

export const useCampaignStore = create((set) => ({
  activeCampaign: null,
  userRole: null, // 'GM' o 'PLAYER' en esta campaña
  members: [],
  loading: false,

  setActiveCampaign: (campaign) => set({ activeCampaign: campaign }),
  setUserRole: (role) => set({ userRole: role }),
  setMembers: (members) => set({ members }),
  setLoading: (loading) => set({ loading }),

  reset: () => set({
    activeCampaign: null,
    userRole: null,
    members: [],
  }),
}))

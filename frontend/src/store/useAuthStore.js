/**
 * Store de autenticación con Zustand
 */
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  logout: () => set({ user: null, token: null }),
}))

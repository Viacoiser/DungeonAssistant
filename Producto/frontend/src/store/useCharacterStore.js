/**
 * Store de borrador de personaje con Zustand.
 * Preserva cambios no guardados cuando el usuario navega entre tabs.
 */
import { create } from 'zustand'

export const useCharacterStore = create((set) => ({
  characterDraft: null,
  setCharacterDraft: (draft) => set({ characterDraft: draft }),
  clearCharacterDraft: () => set({ characterDraft: null }),
}))

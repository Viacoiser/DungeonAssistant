/**
 * Store de personaje activo con Zustand
 */
import { create } from 'zustand'

export const useCharacterStore = create((set) => ({
  activeCharacter: null,
  characters: [],
  loading: false,
  characterDraft: null,       // borrador para evitar pérdida al cambiar tabs

  setActiveCharacter: (character) => set({ activeCharacter: character }),
  setCharacters: (characters) => set({ characters }),
  setLoading: (loading) => set({ loading }),

  setCharacterDraft: (draft) => set({ characterDraft: draft }),
  clearCharacterDraft: () => set({ characterDraft: null }),

  updateCharacter: (updatedCharacter) =>
    set((state) => ({
      activeCharacter:
        state.activeCharacter?.id === updatedCharacter.id
          ? updatedCharacter
          : state.activeCharacter,
      characters: state.characters.map((char) =>
        char.id === updatedCharacter.id ? updatedCharacter : char
      ),
    })),

  reset: () => set({
    activeCharacter: null,
    characters: [],
    characterDraft: null,
  }),
}))

/**
 * Store de personaje activo con Zustand
 */
import { create } from 'zustand'

export const useCharacterStore = create((set) => ({
  activeCharacter: null,
  characters: [],
  loading: false,

  setActiveCharacter: (character) => set({ activeCharacter: character }),
  setCharacters: (characters) => set({ characters }),
  setLoading: (loading) => set({ loading }),

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
  }),
}))

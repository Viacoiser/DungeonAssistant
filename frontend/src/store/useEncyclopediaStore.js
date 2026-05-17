import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Store para cachear datos de la enciclopedia localmente.
 * Esto evita peticiones repetitivas al backend y permite carga instantánea.
 */
const useEncyclopediaStore = create(
  persist(
    (set, get) => ({
      // Cache de búsquedas: { "category:query": [results] }
      searchCache: {},
      
      // Cache de detalles: { "category:index": {details} }
      detailsCache: {},

      // Guardar resultados de búsqueda en cache
      setSearchCache: (category, query, results) => {
        const key = `${category}:${query}`
        set((state) => ({
          searchCache: { ...state.searchCache, [key]: results }
        }))
      },

      // Guardar detalles en cache
      setDetailsCache: (category, index, details) => {
        const key = `${category}:${index}`
        set((state) => ({
          detailsCache: { ...state.detailsCache, [key]: details }
        }))
      },

      // Obtener resultados de búsqueda (si existen)
      getSearchCached: (category, query) => {
        return get().searchCache[`${category}:${query}`]
      },

      // Obtener detalles (si existen)
      getDetailsCached: (category, index) => {
        return get().detailsCache[`${category}:${index}`]
      },

      // Prefetch de una categoría completa
      prefetchCategory: async (category) => {
        // Evitar recargar si ya está en cache
        if (get().searchCache[`${category}:`]) return

        try {
          const response = await fetch(`https://www.dnd5eapi.co/api/2014/${category}`)
          if (response.ok) {
            const data = await response.json()
            const results = data.results || []
            get().setSearchCache(category, '', results)
            console.log(`Prefetched ${results.length} items for ${category}`)
          }
        } catch (err) {
          console.error(`Error prefetching ${category}:`, err)
        }
      },

      // Limpiar cache (granular o completo)
      clearCache: (target) => {
        if (!target) {
          set({ searchCache: {}, detailsCache: {} })
          return
        }

        set((state) => {
          const newSearchCache = { ...state.searchCache }
          const newDetailsCache = { ...state.detailsCache }

          // Borrar todas las llaves que empiecen con el target (ej: "equipment:weapon")
          Object.keys(newSearchCache).forEach(key => {
            if (key.startsWith(target)) delete newSearchCache[key]
          })
          Object.keys(newDetailsCache).forEach(key => {
            if (key.startsWith(target)) delete newDetailsCache[key]
          })

          return { searchCache: newSearchCache, detailsCache: newDetailsCache }
        })
      }
    }),
    {
      name: 'dnd-encyclopedia-storage', // nombre de la llave en localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useEncyclopediaStore

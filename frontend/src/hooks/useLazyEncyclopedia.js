import { useCallback, useRef, useState, useEffect } from 'react'

/**
 * Hook para lazy load encyclopedia data bajo demanda
 * Evita importar todo el JSON de una vez
 * 
 * Problema original: CharacterSheet5e importaba 850 KB de JSON al iniciar
 * Solución: Load only when needed, con caching en memory
 */

const cache = new Map()

export function useLazyEncyclopedia() {
  const [spellsData, setSpellsData] = useState(null)
  const [equipmentData, setEquipmentData] = useState(null)
  const [traitsData, setTraitsData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load encyclopedia data on demand
  const loadEncyclopedia = useCallback(async (type) => {
    // Avoid reloading if already cached
    if (cache.has(type)) {
      const data = cache.get(type)
      if (type === 'spells') setSpellsData(data)
      if (type === 'equipment') setEquipmentData(data)
      if (type === 'traits') setTraitsData(data)
      return data
    }

    setLoading(true)
    try {
      let module
      if (type === 'spells') {
        module = await import('../../data/encyclopedia/spells.json')
      } else if (type === 'equipment') {
        module = await import('../../data/encyclopedia/equipment.json')
      } else if (type === 'traits') {
        module = await import('../../data/encyclopedia/traits.json')
      }

      const data = module.default || module
      cache.set(type, data)

      if (type === 'spells') setSpellsData(data)
      if (type === 'equipment') setEquipmentData(data)
      if (type === 'traits') setTraitsData(data)

      return data
    } catch (error) {
      console.error(`Error loading ${type} encyclopedia:`, error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Load all at once if needed
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [spells, equipment, traits] = await Promise.all([
        loadEncyclopedia('spells'),
        loadEncyclopedia('equipment'),
        loadEncyclopedia('traits')
      ])
      return { spells, equipment, traits }
    } finally {
      setLoading(false)
    }
  }, [loadEncyclopedia])

  return {
    spellsData,
    equipmentData,
    traitsData,
    loading,
    loadEncyclopedia,
    loadAll
  }
}

/**
 * Alternative: Direct async loader for one-off imports
 * Use when you just need to find one item
 */
export async function fetchEncyclopediaItem(itemName, type) {
  try {
    let module
    if (type === 'spells') {
      module = await import('../../data/encyclopedia/spells.json')
    } else if (type === 'equipment') {
      module = await import('../../data/encyclopedia/equipment.json')
    } else if (type === 'traits') {
      module = await import('../../data/encyclopedia/traits.json')
    }

    const data = module.default || module
    const result = data.find(item => item.name.toLowerCase() === itemName.toLowerCase().trim())
    if (!result) {
      return data.find(item => item.name.toLowerCase().includes(itemName.toLowerCase().trim()))
    }
    return result
  } catch (error) {
    console.error(`Error fetching ${type} item "${itemName}":`, error)
    return null
  }
}

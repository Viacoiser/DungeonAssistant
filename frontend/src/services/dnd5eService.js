/**
 * Servicio para sincronizar datos de D&D 5e desde la API https://www.dnd5eapi.co/
 * Gestiona caché local con expiración de 24 horas
 */

const API_BASE = 'https://www.dnd5eapi.co/api'
const CACHE_KEYS = {
  RACES: 'dnd5e_races',
  CLASSES: 'dnd5e_classes',
  RACE_DETAILS: 'dnd5e_race_details',
  CLASS_DETAILS: 'dnd5e_class_details',
  LAST_SYNC: 'dnd5e_last_sync',
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Obtiene races de la API o del cache
 */
export const getRaces = async (forceRefresh = false) => {
  try {
    const cached = getCachedData(CACHE_KEYS.RACES)
    if (cached && !forceRefresh) {
      console.log('📚 Razas cargadas desde cache local')
      return cached
    }

    console.log('🌐 Sincronizando razas desde API...')
    const response = await fetch(`${API_BASE}/races`)
    if (!response.ok) throw new Error('Error fetching races')

    const data = await response.json()
    const races = data.results || []

    // Guardar en cache
    setCachedData(CACHE_KEYS.RACES, races)
    updateSyncMetadata()

    console.log(`✅ ${races.length} razas sincronizadas`)
    return races
  } catch (error) {
    console.error('❌ Error al obtener razas:', error)
    // Intentar retornar cache antiguo como fallback
    const staleCache = getStaleCache(CACHE_KEYS.RACES)
    if (staleCache) {
      console.warn('⚠️ Usando cache antiguo para razas')
      return staleCache
    }
    throw error
  }
}

/**
 * Obtiene classes de la API o del cache
 */
export const getClasses = async (forceRefresh = false) => {
  try {
    const cached = getCachedData(CACHE_KEYS.CLASSES)
    if (cached && !forceRefresh) {
      console.log('📚 Clases cargadas desde cache local')
      return cached
    }

    console.log('🌐 Sincronizando clases desde API...')
    const response = await fetch(`${API_BASE}/classes`)
    if (!response.ok) throw new Error('Error fetching classes')

    const data = await response.json()
    const classes = data.results || []

    // Guardar en cache
    setCachedData(CACHE_KEYS.CLASSES, classes)
    updateSyncMetadata()

    console.log(`✅ ${classes.length} clases sincronizadas`)
    return classes
  } catch (error) {
    console.error('❌ Error al obtener clases:', error)
    // Intentar retornar cache antiguo como fallback
    const staleCache = getStaleCache(CACHE_KEYS.CLASSES)
    if (staleCache) {
      console.warn('⚠️ Usando cache antiguo para clases')
      return staleCache
    }
    throw error
  }
}

/**
 * Obtiene detalles de una raza específica
 */
export const getRaceDetails = async (raceIndex) => {
  try {
    const cacheKey = `${CACHE_KEYS.RACE_DETAILS}_${raceIndex}`
    const cached = getCachedData(cacheKey)
    if (cached) return cached

    const response = await fetch(`${API_BASE}/races/${raceIndex}`)
    if (!response.ok) throw new Error('Error fetching race details')

    const data = await response.json()
    setCachedData(cacheKey, data)
    return data
  } catch (error) {
    console.error(`❌ Error al obtener detalles de raza ${raceIndex}:`, error)
    const staleCache = getStaleCache(cacheKey)
    if (staleCache) return staleCache
    throw error
  }
}

/**
 * Obtiene detalles de una clase específica
 */
export const getClassDetails = async (classIndex) => {
  try {
    const cacheKey = `${CACHE_KEYS.CLASS_DETAILS}_${classIndex}`
    const cached = getCachedData(cacheKey)
    if (cached) return cached

    const response = await fetch(`${API_BASE}/classes/${classIndex}`)
    if (!response.ok) throw new Error('Error fetching class details')

    const data = await response.json()
    setCachedData(cacheKey, data)
    return data
  } catch (error) {
    console.error(`❌ Error al obtener detalles de clase ${classIndex}:`, error)
    const staleCache = getStaleCache(cacheKey)
    if (staleCache) return staleCache
    throw error
  }
}

/**
 * Sincroniza todas las razas y clases
 */
export const syncAll = async () => {
  try {
    console.log('🔄 Iniciando sincronización completa...')
    const [races, classes] = await Promise.all([
      getRaces(true), // force refresh
      getClasses(true), // force refresh
    ])

    return {
      races,
      classes,
      lastSync: new Date().toISOString(),
    }
  } catch (error) {
    console.error('❌ Error en sincronización:', error)
    throw error
  }
}

/**
 * Obtiene metadatos de sincronización
 */
export const getSyncMetadata = () => {
  try {
    const data = localStorage.getItem(CACHE_KEYS.LAST_SYNC)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

/**
 * Limpia el cache
 */
export const clearCache = () => {
  const keysToRemove = [
    CACHE_KEYS.RACES,
    CACHE_KEYS.CLASSES,
    CACHE_KEYS.LAST_SYNC,
  ]

  keysToRemove.forEach(key => localStorage.removeItem(key))

  // Limpiar detalles individuales
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.includes(CACHE_KEYS.RACE_DETAILS) || key?.includes(CACHE_KEYS.CLASS_DETAILS)) {
      localStorage.removeItem(key)
    }
  }

  console.log('🗑️ Cache limpiado')
}

// ─────────────────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES PRIVADAS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Obtiene datos del cache si no han expirado
 */
function getCachedData(key) {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const parsed = JSON.parse(item)
    const now = Date.now()

    // Verificar que no haya expirado
    if (parsed.expiresAt && now > parsed.expiresAt) {
      return null
    }

    return parsed.data
  } catch (error) {
    console.error(`Error al leer cache ${key}:`, error)
    return null
  }
}

/**
 * Obtiene cache antiguo incluso si expiró (fallback)
 */
function getStaleCache(key) {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null
    const parsed = JSON.parse(item)
    return parsed.data
  } catch {
    return null
  }
}

/**
 * Guarda datos en cache con expiración
 */
function setCachedData(key, data) {
  try {
    const cacheItem = {
      data,
      cachedAt: new Date().toISOString(),
      expiresAt: Date.now() + CACHE_DURATION,
    }
    localStorage.setItem(key, JSON.stringify(cacheItem))
  } catch (error) {
    console.error(`Error al guardar cache ${key}:`, error)
  }
}

/**
 * Actualiza metadatos de sincronización
 */
function updateSyncMetadata() {
  const metadata = {
    lastSync: new Date().toISOString(),
  }
  localStorage.setItem(CACHE_KEYS.LAST_SYNC, JSON.stringify(metadata))
}

export default {
  getRaces,
  getClasses,
  getRaceDetails,
  getClassDetails,
  syncAll,
  getSyncMetadata,
  clearCache,
}

import { useState, useEffect, useCallback } from 'react'
import * as dnd5eService from '../services/dnd5eService'

/**
 * Hook personalizado para manejar la biblioteca de D&D 5e
 * Gestiona sincronización, búsqueda y detalles
 */
export const useDnd5eLibrary = () => {
  const [races, setRaces] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [syncMetadata, setSyncMetadata] = useState(null)
  const [selectedRace, setSelectedRace] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [raceDetails, setRaceDetails] = useState(null)
  const [classDetails, setClassDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  /**
   * Carga datos iniciales desde cache o API
   */
  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [racesData, classesData] = await Promise.all([
        dnd5eService.getRaces(),
        dnd5eService.getClasses(),
      ])

      setRaces(racesData)
      setClasses(classesData)
      setSyncMetadata(dnd5eService.getSyncMetadata())
    } catch (err) {
      setError(err.message)
      console.error('Error cargando datos iniciales:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sincroniza todos los datos desde la API
   */
  const handleSync = useCallback(async () => {
    try {
      setSyncing(true)
      setError(null)

      const syncResult = await dnd5eService.syncAll()

      setRaces(syncResult.races)
      setClasses(syncResult.classes)
      setSyncMetadata(dnd5eService.getSyncMetadata())

      return true
    } catch (err) {
      setError(err.message)
      console.error('Error sincronizando:', err)
      return false
    } finally {
      setSyncing(false)
    }
  }, [])

  /**
   * Busca razas
   */
  const searchRaces = useCallback((query) => {
    if (!query.trim()) return races

    return races.filter(race =>
      race.name.toLowerCase().includes(query.toLowerCase()) ||
      race.index.toLowerCase().includes(query.toLowerCase())
    )
  }, [races])

  /**
   * Busca clases
   */
  const searchClasses = useCallback((query) => {
    if (!query.trim()) return classes

    return classes.filter(cls =>
      cls.name.toLowerCase().includes(query.toLowerCase()) ||
      cls.index.toLowerCase().includes(query.toLowerCase())
    )
  }, [classes])

  /**
   * Obtiene detalles de una raza
   */
  const getRaceDetailsData = useCallback(async (race) => {
    try {
      setLoadingDetails(true)
      const details = await dnd5eService.getRaceDetails(race.index)
      setRaceDetails(details)
      setSelectedRace(race)
      return details
    } catch (err) {
      setError(err.message)
      console.error('Error obteniendo detalles de raza:', err)
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  /**
   * Obtiene detalles de una clase
   */
  const getClassDetailsData = useCallback(async (cls) => {
    try {
      setLoadingDetails(true)
      const details = await dnd5eService.getClassDetails(cls.index)
      setClassDetails(details)
      setSelectedClass(cls)
      return details
    } catch (err) {
      setError(err.message)
      console.error('Error obteniendo detalles de clase:', err)
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  /**
   * Formatea fecha de última sincronización
   */
  const getLastSyncText = useCallback(() => {
    if (!syncMetadata?.lastSync) return 'Nunca sincronizado'

    const lastSync = new Date(syncMetadata.lastSync)
    const now = new Date()
    const diffMs = now - lastSync
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Hace poco'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays === 1) return 'Hace 1 día'
    return `Hace ${diffDays} días`
  }, [syncMetadata])

  return {
    // Estado
    races,
    classes,
    loading,
    syncing,
    error,
    syncMetadata,
    selectedRace,
    selectedClass,
    raceDetails,
    classDetails,
    loadingDetails,

    // Funciones
    handleSync,
    searchRaces,
    searchClasses,
    getRaceDetailsData,
    getClassDetailsData,
    getLastSyncText,
    setSelectedRace,
    setSelectedClass,
    clearSelection: () => {
      setSelectedRace(null)
      setSelectedClass(null)
      setRaceDetails(null)
      setClassDetails(null)
    },
  }
}

export default useDnd5eLibrary

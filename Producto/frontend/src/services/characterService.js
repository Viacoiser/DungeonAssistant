import { characterAPI } from './api'

/**
 * characterService - Servicio de persistencia para personajes
 * 
 * Proporciona métodos para:
 * - Obtener personaje
 * - Actualizar personaje
 * - Guardado automático con debounce (500ms)
 * - Validación frontend
 */

// State global para debouncing (una instancia por character ID)
const autoSaveTimers = {}
const autoSaveControllers = {}

/**
 * Valida datos del personaje antes de persistir
 * Validación frontend para UX rápida
 */
export function validateCharacterData(data) {
  const errors = {}

  // Validar stats
  if (data.stats) {
    const statNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
    statNames.forEach(stat => {
      const value = data.stats[stat]
      if (value !== undefined && value !== null) {
        if (value < 3 || value > 20) {
          errors[stat] = `${stat} debe estar entre 3 y 20`
        }
      }
    })
  }

  // Validar level
  if (data.level !== undefined && data.level !== null) {
    if (data.level < 1 || data.level > 20) {
      errors.level = 'Level debe estar entre 1 y 20'
    }
  }

  // Validar HP
  if (data.hp_max !== undefined && data.hp_max !== null) {
    if (data.hp_max <= 0) {
      errors.hp_max = 'HP máximo debe ser mayor a 0'
    }
  }

  if (data.hp_current !== undefined && data.hp_current !== null) {
    if (data.hp_current < 0) {
      errors.hp_current = 'HP actual no puede ser negativo'
    }
    if (data.hp_max && data.hp_current > data.hp_max) {
      errors.hp_current = `HP actual no puede exceder HP máximo (${data.hp_max})`
    }
  }

  // Validar AC
  if (data.armor_class !== undefined && data.armor_class !== null) {
    if (data.armor_class < 10) {
      errors.armor_class = 'AC mínimo es 10'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Obtiene un personaje desde el backend
 */
export async function getCharacter(characterId) {
  try {
    const response = await characterAPI.get(characterId)
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Error fetching character:', error)
    return {
      success: false,
      error: error?.response?.data?.detail || 'Error obteniendo personaje',
    }
  }
}

/**
 * Actualiza un personaje (sin debounce)
 * Uso: guardar explícito o después de debounce
 */
export async function updateCharacter(characterId, data) {
  try {
    // Validar datos
    const validation = validateCharacterData(data)
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: validation.errors,
      }
    }

    // Preparar payload: solo campos que deben actualizarse
    const updatePayload = {
      level: data.level,
      hp_max: data.hp_max,
      hp_current: data.hp_current,
      proficiency_bonus: data.proficiency_bonus,
      stats: data.stats,
      armor_class: data.armor_class,
      initiative: data.initiative,
      speed: data.speed,
      personality_traits: data.personality_traits,
      ideals: data.ideals,
      bonds: data.bonds,
      flaws: data.flaws,
      feats: data.feats,
      spell_slots: data.spell_slots,
    }

    const response = await characterAPI.update(characterId, updatePayload)
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Error updating character:', error)
    return {
      success: false,
      error: error?.response?.data?.detail || 'Error actualizando personaje',
      status: error?.response?.status,
    }
  }
}

/**
 * Actualiza un personaje con debounce (500ms)
 * 
 * Características:
 * - Espera 500ms después del último cambio
 * - Cancela requests anteriores si hay nuevos cambios
 * - Evita múltiples requests simultáneos
 */
export async function autoSaveCharacter(characterId, data, options = {}) {
  const {
    onSuccess = null,
    onError = null,
    debounceMs = 500,
  } = options

  // Limpiar timer anterior de este personaje
  if (autoSaveTimers[characterId]) {
    clearTimeout(autoSaveTimers[characterId])
  }

  // Cancelar request anterior de este personaje
  if (autoSaveControllers[characterId]) {
    autoSaveControllers[characterId].abort()
  }

  // Crear nuevo AbortController para este request
  autoSaveControllers[characterId] = new AbortController()

  // Establecer nuevo timer de debounce
  return new Promise((resolve) => {
    autoSaveTimers[characterId] = setTimeout(async () => {
      try {
        // Validar datos
        const validation = validateCharacterData(data)
        if (!validation.isValid) {
          const error = {
            success: false,
            error: 'Datos inválidos',
            fieldErrors: validation.errors,
          }
          onError?.(error)
          resolve(error)
          return
        }

        // Preparar payload
        const updatePayload = {
          level: data.level,
          hp_max: data.hp_max,
          hp_current: data.hp_current,
          proficiency_bonus: data.proficiency_bonus,
          stats: data.stats,
          armor_class: data.armor_class,
          initiative: data.initiative,
          speed: data.speed,
          personality_traits: data.personality_traits,
          ideals: data.ideals,
          bonds: data.bonds,
          flaws: data.flaws,
          feats: data.feats,
          spell_slots: data.spell_slots,
        }

        // Hacer request con AbortSignal
        const response = await characterAPI.update(characterId, updatePayload, {
          signal: autoSaveControllers[characterId].signal,
        })

        const result = {
          success: true,
          data: response.data,
        }

        onSuccess?.(result)
        resolve(result)
      } catch (error) {
        // No loguear errores de abort
        if (error.name !== 'AbortError') {
          console.error('Error auto-saving character:', error)
          const errorResult = {
            success: false,
            error: error?.response?.data?.detail || 'Error guardando personaje',
            status: error?.response?.status,
          }
          onError?.(errorResult)
          resolve(errorResult)
        }
      } finally {
        // Limpiar referencias
        delete autoSaveTimers[characterId]
        delete autoSaveControllers[characterId]
      }
    }, debounceMs)
  })
}

/**
 * Cancela el auto-save pendiente de un personaje
 */
export function cancelAutoSave(characterId) {
  if (autoSaveTimers[characterId]) {
    clearTimeout(autoSaveTimers[characterId])
    delete autoSaveTimers[characterId]
  }

  if (autoSaveControllers[characterId]) {
    autoSaveControllers[characterId].abort()
    delete autoSaveControllers[characterId]
  }
}

/**
 * Cancela todos los auto-saves pendientes
 */
export function cancelAllAutoSaves() {
  Object.keys(autoSaveTimers).forEach(characterId => {
    cancelAutoSave(characterId)
  })
}

import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * useCharacterCalculations - Hook para cálculos reactivos de D&D 5e
 * 
 * Implementa toda la lógica de cascadas de cambios:
 * - Modificadores de atributos
 * - Bonos de competencia
 * - Clase de armadura (AC)
 * - Iniciativa
 * - HP máximo
 * - Tiros de salvación
 * - Percepción pasiva
 * 
 * Estado reactivo: al cambiar un stat, todos los derivados se recalculan automáticamente.
 * Debounce: 500ms antes de disparar onChange callback para persistencia.
 */

export function useCharacterCalculations(initialCharacter, onCharacterChange) {
  const [character, setCharacter] = useState(initialCharacter)
  const [isCalculating, setIsCalculating] = useState(false)
  const debounceTimerRef = useRef(null)
  const abortControllerRef = useRef(null)

  /**
   * Calcula el modificador de un atributo
   * Fórmula: (stat - 10) / 2 redondeado hacia abajo
   */
  const getModifier = useCallback((stat) => {
    return Math.floor((stat - 10) / 2)
  }, [])

  /**
   * Calcula el bono de competencia según el nivel
   * Fórmula: Math.ceil(level / 4) + 1
   */
  const getProficiencyBonus = useCallback((level) => {
    if (level < 1 || level > 20) return 2
    return Math.ceil(level / 4) + 1
  }, [])

  /**
   * Calcula HP máximo
   * Fórmula: Math.max(1, (hitDieBase + modifierCON) * level)
   */
  const calculateMaxHP = useCallback((hitDieBase, level, constitutionStat) => {
    const conModifier = getModifier(constitutionStat)
    const hpPerLevel = Math.max(1, hitDieBase + conModifier)
    return Math.max(hpPerLevel, hpPerLevel * level)
  }, [getModifier])

  /**
   * Calcula AC base (10 + DEX modifier)
   * Si hay AC personalizado, se usa ese
   */
  const calculateAC = useCallback((dexterityStat, customAC) => {
    if (customAC !== undefined && customAC !== null && customAC !== 10) {
      return customAC // AC personalizado (armadura)
    }
    const dexMod = getModifier(dexterityStat)
    return 10 + dexMod
  }, [getModifier])

  /**
   * Calcula iniciativa (DEX modifier)
   */
  const calculateInitiative = useCallback((dexterityStat) => {
    return getModifier(dexterityStat)
  }, [getModifier])

  /**
   * Calcula todos los tiros de salvación
   */
  const calculateSavingThrows = useCallback((stats, proficiencyBonus) => {
    const savingThrows = {}
    const statNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

    statNames.forEach(stat => {
      const value = stats?.[stat] || 10
      const modifier = getModifier(value)
      // Tiro de salvación = modificador del atributo (+ bono de competencia si proficiente)
      // Por ahora, solo el modificador
      savingThrows[stat] = modifier
    })

    return savingThrows
  }, [getModifier])

  /**
   * Calcula percepción pasiva
   * Fórmula: 10 + WIS modifier
   */
  const calculatePassivePerception = useCallback((wisdomStat) => {
    const wisModifier = getModifier(wisdomStat)
    return 10 + wisModifier
  }, [getModifier])

  /**
   * Recalcula todos los valores derivados en cascada
   */
  const recalculateAllDerivedValues = useCallback((char) => {
    const stats = char.stats || {}
    
    // Cálculos básicos
    const newProfBonus = getProficiencyBonus(char.level)
    const newAC = calculateAC(stats.dexterity || 10, char.armor_class)
    const newInitiative = calculateInitiative(stats.dexterity || 10)
    
    // Obtener hit die base según clase (simplificado: d6-d12)
    const hitDieMap = {
      'Barbarian': 12,
      'Fighter': 10,
      'Paladin': 10,
      'Ranger': 10,
      'Rogue': 8,
      'Bard': 8,
      'Cleric': 8,
      'Druid': 8,
      'Monk': 8,
      'Warlock': 8,
      'Sorcerer': 6,
      'Wizard': 6,
    }
    const hitDieBase = hitDieMap[char.class_] || 8
    
    const newMaxHP = calculateMaxHP(
      hitDieBase,
      char.level,
      stats.constitution || 10
    )
    
    const savingThrows = calculateSavingThrows(stats, newProfBonus)
    const passivePerception = calculatePassivePerception(stats.wisdom || 10)

    // Asegurar que HP actual no exceda HP máximo
    const newHPCurrent = Math.min(char.hp_current || newMaxHP, newMaxHP)

    return {
      ...char,
      proficiency_bonus: newProfBonus,
      armor_class: newAC,
      initiative: newInitiative,
      hp_max: newMaxHP,
      hp_current: newHPCurrent,
      saving_throws: savingThrows,
      passive_perception: passivePerception,
    }
  }, [getProficiencyBonus, calculateAC, calculateInitiative, calculateMaxHP, calculateSavingThrows, calculatePassivePerception])

  /**
   * Actualiza un atributo individual y dispara cascada
   */
  const updateStat = useCallback((statName, value) => {
    setIsCalculating(true)
    
    // Validar rango 3-20
    const clampedValue = Math.max(3, Math.min(20, parseInt(value) || 10))

    setCharacter(prevChar => {
      const updated = {
        ...prevChar,
        stats: {
          ...prevChar.stats,
          [statName]: clampedValue,
        },
      }
      
      // Recalcular en cascada
      const recalculated = recalculateAllDerivedValues(updated)
      
      // Debounce: guardar después de 500ms sin cambios
      debounceAutoSave(recalculated)
      
      setIsCalculating(false)
      return recalculated
    })
  }, [recalculateAllDerivedValues])

  /**
   * Actualiza el nivel y dispara cascada
   */
  const updateLevel = useCallback((value) => {
    setIsCalculating(true)
    
    // Validar rango 1-20
    const clampedLevel = Math.max(1, Math.min(20, parseInt(value) || 1))

    setCharacter(prevChar => {
      const updated = {
        ...prevChar,
        level: clampedLevel,
      }
      
      // Recalcular en cascada
      const recalculated = recalculateAllDerivedValues(updated)
      
      // Debounce: guardar después de 500ms sin cambios
      debounceAutoSave(recalculated)
      
      setIsCalculating(false)
      return recalculated
    })
  }, [recalculateAllDerivedValues])

  /**
   * Actualiza HP actual (validar que no exceda máximo)
   */
  const updateHP = useCallback((current, max) => {
    setIsCalculating(true)
    
    setCharacter(prevChar => {
      const clampedCurrent = Math.max(0, Math.min(max !== undefined ? max : prevChar.hp_max, parseInt(current) || 0))
      
      const updated = {
        ...prevChar,
        hp_current: clampedCurrent,
      }

      debounceAutoSave(updated)
      
      setIsCalculating(false)
      return updated
    })
  }, [])

  /**
   * Debounce: espera 500ms antes de llamar onCharacterChange
   */
  const debounceAutoSave = useCallback((updatedChar) => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Establecer nuevo timer
    debounceTimerRef.current = setTimeout(() => {
      if (onCharacterChange) {
        onCharacterChange(updatedChar)
      }
    }, 500)
  }, [onCharacterChange])

  /**
   * Fuerza recalculación manual
   */
  const recalculate = useCallback(() => {
    setIsCalculating(true)
    setCharacter(prevChar => {
      const recalculated = recalculateAllDerivedValues(prevChar)
      setIsCalculating(false)
      return recalculated
    })
  }, [recalculateAllDerivedValues])

  /**
   * Actualiza cualquier campo del character (sin cascada)
   */
  const updateField = useCallback((fieldName, value) => {
    setCharacter(prevChar => {
      const updated = {
        ...prevChar,
        [fieldName]: value,
      }
      debounceAutoSave(updated)
      return updated
    })
  }, [debounceAutoSave])

  /**
   * Limpiar timers al desmontar
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Actualizar character si initialCharacter cambia
   */
  useEffect(() => {
    setCharacter(initialCharacter)
  }, [initialCharacter?.id])

  return {
    character,
    setCharacter,
    updateStat,
    updateLevel,
    updateHP,
    updateField,
    recalculate,
    isCalculating,
    
    // Exportar funciones de cálculo para testing/debugging
    getModifier,
    getProficiencyBonus,
    calculateMaxHP,
    calculateAC,
    calculateInitiative,
    calculateSavingThrows,
    calculatePassivePerception,
  }
}

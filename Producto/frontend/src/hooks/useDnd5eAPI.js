import raceData from '../data/race-bonuses.json'
import classData from '../data/class-bonuses.json'

/**
 * Hook para obtener datos de D&D 5e
 * Usa datos locales (JSON) para bonificadores de habilidades y HP por clase
 */
export function useDnd5eAPI() {
  /**
   * Obtener bonificadores de habilidad para una raza
   */
  const getRaceModifiers = (raceName) => {
    const race = raceData.races[raceName]
    if (!race) return {}
    
    return {
      strength: race.ability_bonuses?.strength || 0,
      dexterity: race.ability_bonuses?.dexterity || 0,
      constitution: race.ability_bonuses?.constitution || 0,
      intelligence: race.ability_bonuses?.intelligence || 0,
      wisdom: race.ability_bonuses?.wisdom || 0,
      charisma: race.ability_bonuses?.charisma || 0,
    }
  }

  /**
   * Obtener hit die para una clase
   */
  const getClassHitDie = (className) => {
    return classData.classes[className]?.hit_die || 8
  }

  /**
   * Calcular stats base (10 + bonificador de raza)
   */
  const calculateBaseStats = (raceName) => {
    const modifiers = getRaceModifiers(raceName)
    
    return {
      strength: 10 + (modifiers.strength || 0),
      dexterity: 10 + (modifiers.dexterity || 0),
      constitution: 10 + (modifiers.constitution || 0),
      intelligence: 10 + (modifiers.intelligence || 0),
      wisdom: 10 + (modifiers.wisdom || 0),
      charisma: 10 + (modifiers.charisma || 0),
    }
  }

  /**
   * Calcular HP máximos
   * Fórmula: hit_die + (level - 1) * (hit_die/2 + 1) + CON_modifier * level
   */
  const calculateMaxHP = (className, level, constitutionScore) => {
    const hitDie = getClassHitDie(className)
    const conModifier = Math.floor((constitutionScore - 10) / 2)
    
    // HP en nivel 1 = hit_die + CON modifier
    let hp = hitDie + conModifier
    
    // Sumar el resto de niveles (promedio de hit die = hit_die / 2 + 1)
    if (level > 1) {
      const avgHP = Math.floor(hitDie / 2) + 1 + conModifier
      hp += (level - 1) * avgHP
    }
    
    // Mínimo 1 HP por nivel
    hp = Math.max(level, hp)
    
    return hp
  }

  return {
    getRaceModifiers,
    getClassHitDie,
    calculateBaseStats,
    calculateMaxHP,
  }
}

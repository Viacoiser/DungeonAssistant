import { renderHook, act } from '@testing-library/react'
import { useCharacterCalculations } from '../useCharacterCalculations'

/**
 * Tests para useCharacterCalculations hook
 * Cobertura: Fórmulas D&D 5e, cascadas de cambios, debounce
 */

describe('useCharacterCalculations', () => {
  // Personaje de prueba base
  const baseCharacter = {
    id: 'test-char-1',
    name: 'Test Character',
    class_: 'Fighter',
    race: 'Human',
    level: 1,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    hp_max: 10,
    hp_current: 10,
    armor_class: 10,
    initiative: 0,
    proficiency_bonus: 2,
    speed: 30,
  }

  describe('Cálculo de modificadores', () => {
    test('calcula modificador STR +0 para stat 10', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getModifier(10)).toBe(0)
    })

    test('calcula modificador STR +2 para stat 15', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getModifier(15)).toBe(2)
    })

    test('calcula modificador STR -1 para stat 8', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getModifier(8)).toBe(-1)
    })

    test('calcula modificador STR +5 para stat 20', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getModifier(20)).toBe(5)
    })

    test('calcula modificador STR -4 para stat 3', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getModifier(3)).toBe(-4)
    })
  })

  describe('Bono de competencia por nivel', () => {
    test('bono +2 para level 1-4', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getProficiencyBonus(1)).toBe(2)
      expect(result.current.getProficiencyBonus(2)).toBe(2)
      expect(result.current.getProficiencyBonus(4)).toBe(2)
    })

    test('bono +3 para level 5-8', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getProficiencyBonus(5)).toBe(3)
      expect(result.current.getProficiencyBonus(8)).toBe(3)
    })

    test('bono +4 para level 9-12', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getProficiencyBonus(9)).toBe(4)
      expect(result.current.getProficiencyBonus(12)).toBe(4)
    })

    test('bono +5 para level 13-16', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getProficiencyBonus(13)).toBe(5)
      expect(result.current.getProficiencyBonus(16)).toBe(5)
    })

    test('bono +6 para level 17-20', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.getProficiencyBonus(17)).toBe(6)
      expect(result.current.getProficiencyBonus(20)).toBe(6)
    })
  })

  describe('Cálculo de HP máximo', () => {
    test('calcula HP máximo correctamente con CON +0', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      // Fighter (d10) level 1 CON 10 (+0) = 10
      const hp = result.current.calculateMaxHP(10, 1, 10)
      expect(hp).toBe(10)
    })

    test('calcula HP máximo con CON +2', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      // Fighter (d10) level 3 CON 14 (+2) = (10 + 2) * 3 = 36
      const hp = result.current.calculateMaxHP(10, 3, 14)
      expect(hp).toBe(36)
    })

    test('calcula HP máximo mínimo 1 por nivel', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      // Wizard (d6) level 1 CON 8 (-1) = max(1, 6-1) * 1 = 5
      const hp = result.current.calculateMaxHP(6, 1, 8)
      expect(hp).toBe(5)
    })
  })

  describe('Cálculo de AC e Initiative', () => {
    test('calcula AC base 10 + DEX mod', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      // DEX 10 = +0, AC = 10
      expect(result.current.calculateAC(10, undefined)).toBe(10)
      // DEX 14 = +2, AC = 12
      expect(result.current.calculateAC(14, undefined)).toBe(12)
    })

    test('initiative es igual a DEX modifier', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))
      expect(result.current.calculateInitiative(10)).toBe(0)
      expect(result.current.calculateInitiative(14)).toBe(2)
      expect(result.current.calculateInitiative(8)).toBe(-1)
    })
  })

  describe('Cascadas de cambios', () => {
    test('cambiar DEX actualiza AC automáticamente', (done) => {
      const onCharacterChange = jest.fn()
      const { result } = renderHook(() => 
        useCharacterCalculations(baseCharacter, onCharacterChange)
      )

      act(() => {
        result.current.updateStat('dexterity', 14)
      })

      // AC debe cambiar de 10 a 12 (10 + 2 del DEX mod)
      expect(result.current.character.armor_class).toBe(12)
      expect(result.current.character.initiative).toBe(2)

      // Esperar debounce (500ms)
      setTimeout(() => {
        expect(onCharacterChange).toHaveBeenCalled()
        done()
      }, 550)
    })

    test('cambiar CON actualiza HP máximo', (done) => {
      const onCharacterChange = jest.fn()
      const character = {
        ...baseCharacter,
        class_: 'Wizard', // d6
        level: 5,
      }
      const { result } = renderHook(() => 
        useCharacterCalculations(character, onCharacterChange)
      )

      act(() => {
        result.current.updateStat('constitution', 14)
      })

      // CON 14 = +2, Wizard d6: (6+2)*5 = 40
      expect(result.current.character.hp_max).toBe(40)

      setTimeout(() => {
        expect(onCharacterChange).toHaveBeenCalled()
        done()
      }, 550)
    })

    test('cambiar level recalcula proficiency y HP', (done) => {
      const onCharacterChange = jest.fn()
      const { result } = renderHook(() => 
        useCharacterCalculations(baseCharacter, onCharacterChange)
      )

      act(() => {
        result.current.updateLevel(5)
      })

      expect(result.current.character.level).toBe(5)
      expect(result.current.character.proficiency_bonus).toBe(3)
      // Fighter d10: (10 + 0) * 5 = 50
      expect(result.current.character.hp_max).toBe(50)

      setTimeout(() => {
        expect(onCharacterChange).toHaveBeenCalled()
        done()
      }, 550)
    })
  })

  describe('Validación de ranges', () => {
    test('stats se clampen a 3-20', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))

      act(() => {
        result.current.updateStat('strength', 25)
      })
      expect(result.current.character.stats.strength).toBe(20)

      act(() => {
        result.current.updateStat('strength', -5)
      })
      expect(result.current.character.stats.strength).toBe(3)
    })

    test('level se clampea a 1-20', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))

      act(() => {
        result.current.updateLevel(25)
      })
      expect(result.current.character.level).toBe(20)

      act(() => {
        result.current.updateLevel(-5)
      })
      expect(result.current.character.level).toBe(1)
    })

    test('HP actual no puede exceder HP máximo', () => {
      const { result } = renderHook(() => useCharacterCalculations(baseCharacter, null))

      act(() => {
        result.current.updateHP(150, 10)
      })
      expect(result.current.character.hp_current).toBe(10)
    })
  })

  describe('Debounce', () => {
    jest.useFakeTimers()

    test('múltiples cambios rápido = 1 callback', () => {
      const onCharacterChange = jest.fn()
      const { result } = renderHook(() => 
        useCharacterCalculations(baseCharacter, onCharacterChange)
      )

      act(() => {
        result.current.updateStat('strength', 11)
        result.current.updateStat('strength', 12)
        result.current.updateStat('strength', 13)
        result.current.updateStat('strength', 14)
      })

      // No debería haber callbacks aún
      expect(onCharacterChange).not.toHaveBeenCalled()

      // Avanzar timer de debounce
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Ahora debería haber sido llamado una sola vez
      expect(onCharacterChange).toHaveBeenCalledTimes(1)
    })

    jest.useRealTimers()
  })
})

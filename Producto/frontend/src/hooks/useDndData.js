import { useMemo } from 'react'
import racesData from '../data/races.json'
import classesData from '../data/classes.json'
import backgroundsData from '../data/backgrounds.json'
import alignmentsData from '../data/alignments.json'
import traitsData from '../data/encyclopedia/traits.json'

/**
 * Hook personalizado para acceder a datos D&D 5e
 * Utiliza la enciclopedia unificada para rasgos, dotes y características
 * 
 * @returns {Object} Objeto con métodos para acceder a diferentes datos
 */
export const useDndData = () => {
  const dndData = useMemo(() => {
    // Clasificar datos de la enciclopedia por categoría para acceso rápido
    const encyclopediaByCat = (cat) => traitsData.filter(t => t.category === cat)

    return {
      // Datos locales simplificados (UI/formularios)
      races: racesData.races,
      classes: classesData.classes,
      backgrounds: backgroundsData.backgrounds,
      alignments: alignmentsData.alignments,

      // Datos detallados de la enciclopedia (mapeados a los nombres antiguos para compatibilidad)
      dndRaces: encyclopediaByCat('races'),
      dndClasses: encyclopediaByCat('classes'),
      dndFeatures: encyclopediaByCat('features'),
      dndTraits: encyclopediaByCat('traits'),
      dndFeats: encyclopediaByCat('feats'),
      dndProficiencies: encyclopediaByCat('proficiencies'),

      // ===== RASGOS (TRAITS) =====
      getAllTraits: () => encyclopediaByCat('traits'),
      
      getTraitsByRace: (raceName) => {
        const traits = encyclopediaByCat('traits')
        return traits.filter(t => 
          t.races?.some(r => r.name?.toLowerCase() === raceName?.toLowerCase())
        )
      },

      getTraitByIndex: (index) => {
        return traitsData.find(t => (t.id === index || t.index === index) && t.category === 'traits')
      },

      // ===== HABILIDADES (FEATURES) =====
      getFeaturesByClass: (className) => {
        const features = encyclopediaByCat('features')
        return features.filter(f => 
          f.class?.name?.toLowerCase() === className?.toLowerCase()
        )
      },

      getFeaturesByLevel: (className, level) => {
        const features = encyclopediaByCat('features')
        return features.filter(f => 
          f.class?.name?.toLowerCase() === className?.toLowerCase() &&
          f.level === level
        )
      },

      // ===== DOTES (FEATS) =====
      getAllFeats: () => encyclopediaByCat('feats'),

      // ===== MÉTODOS AUXILIARES ORIGINALES =====
      getRaceByIndex: (index) => 
        racesData.races.find(r => r.index === index),
      
      getClassByIndex: (index) => 
        classesData.classes.find(c => c.index === index),
      
      getBackgroundByIndex: (index) => 
        backgroundsData.backgrounds.find(b => b.index === index),
      
      getAlignmentByIndex: (index) => 
        alignmentsData.alignments.find(a => a.index === index),

      // ===== SELECTORES PARA FORMULARIOS =====
      getRaceNames: () => 
        racesData.races.map(r => ({ value: r.index, label: r.name })),
      
      getClassNames: () => 
        classesData.classes.map(c => ({ value: c.index, label: c.name })),
      
      getBackgroundNames: () => 
        backgroundsData.backgrounds.map(b => ({ value: b.index, label: b.name })),
      
      getAlignmentNames: () => 
        alignmentsData.alignments.map(a => ({ value: a.index, label: a.name })),
    }
  }, [])

  return dndData
}

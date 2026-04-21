import { useMemo } from 'react'
import racesData from '../data/races.json'
import classesData from '../data/classes.json'
import backgroundsData from '../data/backgrounds.json'
import alignmentsData from '../data/alignments.json'
import dndRacesData from '../data/dnd-races.json'
import dndClassesData from '../data/dnd-classes.json'
import dndFeaturesData from '../data/dnd-features.json'
import dndTraitsData from '../data/dnd-traits.json'
import dndFeatsData from '../data/dnd-feats.json'

/**
 * Hook personalizado para acceder a datos D&D 5e
 * Incluye datos detallados de la API D&D 5e (features, traits, feats)
 * 
 * @returns {Object} Objeto con métodos para acceder a diferentes datos
 */
export const useDndData = () => {
  const dndData = useMemo(() => ({
    // Datos locales simplificados (UI/formularios)
    races: racesData.races,
    classes: classesData.classes,
    backgrounds: backgroundsData.backgrounds,
    alignments: alignmentsData.alignments,

    // Datos detallados de la API D&D 5e
    dndRaces: dndRacesData.results || [],
    dndClasses: dndClassesData.results || [],
    dndFeatures: dndFeaturesData.results || [],
    dndTraits: dndTraitsData.results || [],
    dndFeats: dndFeatsData.results || [],

    // ===== RASGOS (TRAITS) =====
    // Obtener todos los rasgos raciales
    getAllTraits: () => dndTraitsData.results || [],
    
    // Buscar rasgos por raza
    getTraitsByRace: (raceName) => {
      const traits = dndTraitsData.results || []
      return traits.filter(t => 
        t.races?.some(r => r.name?.toLowerCase() === raceName?.toLowerCase())
      )
    },

    // Obtener detalles de un rasgo específico
    getTraitByIndex: (index) => {
      const traits = dndTraitsData.results || []
      return traits.find(t => t.index === index)
    },

    // ===== HABILIDADES (FEATURES) =====
    // Obtener características de una clase
    getFeaturesByClass: (className) => {
      const features = dndFeaturesData.results || []
      return features.filter(f => 
        f.class?.name?.toLowerCase() === className?.toLowerCase()
      )
    },

    // Obtener características por nivel
    getFeaturesByLevel: (className, level) => {
      const features = dndFeaturesData.results || []
      return features.filter(f => 
        f.class?.name?.toLowerCase() === className?.toLowerCase() &&
        f.level === level
      )
    },

    // ===== DOTES (FEATS) =====
    getAllFeats: () => dndFeatsData.results || [],

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
  }), [])

  return dndData
}

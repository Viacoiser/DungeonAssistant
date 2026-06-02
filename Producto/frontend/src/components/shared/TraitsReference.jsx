import React, { useState, useEffect, useMemo } from 'react'
import { Search, BookOpen, X, CheckCircle } from 'lucide-react'
import traitsData from '../../data/encyclopedia/traits.json'

// ── Estilos ──────────────────────────────────────────────────────────────────
const detailPanelStyle = {
  width: '100%',
  maxWidth: '380px',
  height: 'fit-content',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1.5rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(217,83,30,0.2)',
  borderRadius: 15,
  maxHeight: 'calc(100vh - 7.5rem)',
  overflowY: 'auto',
  zIndex: 30,
  minWidth: 0,
}

// Mapa de etiquetas legibles y colores por categoría
const CATEGORY_CONFIG = {
  all:            { label: 'Todos',          color: 'rgba(226,209,166,0.6)' },
  traits:         { label: 'Rasgos',         color: '#a78bfa' },
  feats:          { label: 'Dotes',          color: '#f59e0b' },
  features:       { label: 'Características',color: '#34d399' },
  races:          { label: 'Razas',          color: '#60a5fa' },
  classes:        { label: 'Clases',         color: '#f87171' },
  backgrounds:    { label: 'Trasfondos',     color: '#fb923c' },
  proficiencies:  { label: 'Competencias',   color: '#38bdf8' },
}

// ── Deduplicar datos al importar (por id) ────────────────────────────────────
const uniqueTraits = (() => {
  const seen = new Set()
  return traitsData.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
})()

export default function TraitsReference() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTrait, setSelectedTrait] = useState(null)

  // Categorías en el orden exacto requerido
  const availableCategories = ['all', 'races', 'classes', 'backgrounds', 'proficiencies', 'features', 'traits', 'feats']

  // Filtrado por categoría + búsqueda
  const filteredTraits = useMemo(() => {
    let results = uniqueTraits

    // 1. Filtrar por categoría
    if (selectedCategory !== 'all') {
      results = results.filter(t => t.category === selectedCategory)
    }

    // 2. Filtrar por texto de búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.desc && t.desc.some(d => d.toLowerCase().includes(q)))
      )
    }

    return results
  }, [selectedCategory, searchQuery])

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedTrait(null)
    setSearchQuery('')
  }

  const handleSelectTrait = (trait) => {
    setSelectedTrait(trait)
  }

  // Contar items por categoría para mostrar badges
  const categoryCounts = useMemo(() => {
    const counts = { all: uniqueTraits.length }
    uniqueTraits.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return counts
  }, [])

  return (
    <>
    <div className="w-full max-w-7xl mx-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 h-full items-start">
      {/* Lista de Rasgos - Lado Izquierdo */}
      <div className={`${!selectedTrait ? 'flex' : 'hidden md:flex'} flex-col gap-6 min-w-0`}>
        {/* Header */}
        <div style={{ 
          animation: 'fadeInUp 0.4s ease forwards', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start' 
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Almendra, serif',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: 'var(--fantasy-gold)',
              margin: 0,
              marginBottom: '0.5rem',
              textShadow: '0 0 30px rgba(217,83,30,0.2)',
            }}>
              Rasgos & Características
            </h2>
            <p style={{ color: 'rgba(226,209,166,0.55)', fontSize: '0.95rem', margin: 0 }}>
              Consulta las pasivas y características especiales de D&D 5e
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <Search size={17} style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(226,209,166,0.35)',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Buscar rasgo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '0.7rem 1rem 0.7rem 2.5rem',
              color: 'var(--fantasy-gold)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(217,83,30,0.5)'
              e.target.style.background = 'rgba(255,255,255,0.08)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.1)'
              e.target.style.background = 'rgba(255,255,255,0.05)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(226,209,166,0.5)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros por categoría */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {availableCategories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat] || { label: cat, color: 'rgba(226,209,166,0.6)' }
            const isActive = selectedCategory === cat
            const count = categoryCounts[cat] || 0
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  fontFamily: 'Almendra, serif',
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: isActive
                    ? `2px solid ${cfg.color}`
                    : '1px solid rgba(255,255,255,0.1)',
                  background: isActive
                    ? `${cfg.color}18`
                    : 'rgba(255,255,255,0.03)',
                  color: isActive
                    ? cfg.color
                    : 'rgba(226,209,166,0.6)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = cfg.color
                    e.currentTarget.style.color = cfg.color
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.color = 'rgba(226,209,166,0.6)'
                  }
                }}
              >
                {cfg.label}
                <span style={{
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  background: isActive ? `${cfg.color}30` : 'rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: '0.1rem 0.4rem',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Lista de Rasgos */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          paddingRight: '0.5rem',
        }}>
          {filteredTraits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(226,209,166,0.4)' }}>
              <BookOpen size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No se encontraron rasgos{searchQuery ? ` para "${searchQuery}"` : ''}</p>
            </div>
          ) : (
            filteredTraits.map((trait) => {
              const catCfg = CATEGORY_CONFIG[trait.category] || { label: trait.category, color: '#999' }
              return (
                <button
                  key={trait.id}
                  onClick={() => handleSelectTrait(trait)}
                  style={{
                    background: selectedTrait?.id === trait.id ? 'rgba(217,83,30,0.15)' : 'rgba(255,255,255,0.03)',
                    border: selectedTrait?.id === trait.id ? '2px solid rgba(217,83,30,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '1rem',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTrait?.id !== trait.id) {
                      e.currentTarget.style.background = 'rgba(217,83,30,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(217,83,30,0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTrait?.id !== trait.id) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    }
                  }}
                >
                  <div>
                    <h3 style={{
                      fontFamily: 'Almendra, serif',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--fantasy-gold)',
                      margin: '0 0 0.3rem 0',
                    }}>
                      {trait.name}
                    </h3>
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'rgba(226,209,166,0.5)',
                      margin: 0,
                    }}>
                      Haz clic para ver detalles
                    </p>
                  </div>
                  {/* Badge de categoría */}
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: catCfg.color,
                    background: `${catCfg.color}18`,
                    border: `1px solid ${catCfg.color}40`,
                    borderRadius: 6,
                    padding: '0.2rem 0.5rem',
                    flexShrink: 0,
                    marginLeft: '0.5rem',
                    textTransform: 'capitalize',
                  }}>
                    {catCfg.label}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Info */}
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          fontSize: '0.8rem',
          color: 'rgba(226,209,166,0.3)',
        }}>
          Mostrando {filteredTraits.length} de {uniqueTraits.length} — {CATEGORY_CONFIG[selectedCategory]?.label || selectedCategory}
        </div>
      </div>

      {/* Columna Derecha Sticky */}
      <div className={`${selectedTrait ? 'block' : 'hidden md:block'} md:sticky md:top-0 w-full`}>
        {selectedTrait ? (
          <div style={detailPanelStyle}>
          {/* Header del Panel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
            <div>
              <h2 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--fantasy-gold)',
                margin: 0,
              }}>
                {selectedTrait.name}
              </h2>
              {/* Badge de categoría en detalle */}
              <span style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: (CATEGORY_CONFIG[selectedTrait.category] || {}).color || '#999',
                background: `${(CATEGORY_CONFIG[selectedTrait.category] || {}).color || '#999'}18`,
                border: `1px solid ${(CATEGORY_CONFIG[selectedTrait.category] || {}).color || '#999'}40`,
                borderRadius: 6,
                padding: '0.2rem 0.6rem',
              }}>
                {(CATEGORY_CONFIG[selectedTrait.category] || { label: selectedTrait.category }).label}
              </span>
            </div>
            <button
              onClick={() => setSelectedTrait(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(226,209,166,0.5)',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: 0,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--fantasy-gold)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(226,209,166,0.5)'}
            >
              <X size={24} />
            </button>
          </div>

          {/* Botón Volver a la lista (Solo móvil) */}
          <button
            onClick={() => setSelectedTrait(null)}
            className="md:hidden flex items-center justify-center gap-2 w-full py-3 mt-2 bg-white/5 border border-white/10 rounded-xl text-fantasy-gold hover:bg-white/10 transition-colors"
          >
            <CheckCircle size={16} />
            Volver a la lista
          </button>

          {/* Contenido de detalle */}
          <div>
            <h4 style={{
              fontFamily: 'Almendra, serif',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'rgba(226,209,166,0.9)',
              margin: '0 0 0.75rem 0',
            }}>
              Información
            </h4>
            <div style={{ color: 'rgba(226,209,166,0.75)', lineHeight: 1.6, fontSize: '0.9rem' }}>
              {/* Descripción general */}
              {selectedTrait.desc && selectedTrait.desc.length > 0 && selectedTrait.desc.map((paragraph, idx) => (
                <p key={idx} style={{ margin: '0.5rem 0' }}>{paragraph}</p>
              ))}

              {/* Para Razas: velocidad, idiomas, bonificaciones */}
              {selectedTrait.speed && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Velocidad:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.speed} pies</p>
                </>
              )}
              {selectedTrait.ability_bonuses_summary && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Bonificaciones:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.ability_bonuses_summary}</p>
                </>
              )}
              {selectedTrait.languages && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Idiomas:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{Array.isArray(selectedTrait.languages) ? selectedTrait.languages.join(', ') : selectedTrait.languages}</p>
                </>
              )}
              {selectedTrait.age && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Edad:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.age}</p>
                </>
              )}
              {selectedTrait.alignment && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Alineamiento:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.alignment}</p>
                </>
              )}
              {selectedTrait.size_description && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Tamaño:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.size_description}</p>
                </>
              )}
              {selectedTrait.language_desc && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Idiomas:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.language_desc}</p>
                </>
              )}

              {/* Para Clases: hit die, saving throws */}
              {selectedTrait.hit_die && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Dado de Golpe:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>d{selectedTrait.hit_die}</p>
                </>
              )}
              {selectedTrait.saving_throws && selectedTrait.saving_throws.length > 0 && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Tiradas de Salvación:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>
                    {selectedTrait.saving_throws.map(st => typeof st === 'string' ? st : st.name).join(', ')}
                  </p>
                </>
              )}

              {/* Para Backgrounds: competencias de habilidad y herramienta */}
              {selectedTrait.skill_proficiencies && selectedTrait.skill_proficiencies.length > 0 && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Competencias de Habilidad:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.skill_proficiencies.join(', ')}</p>
                </>
              )}
              {selectedTrait.tool_proficiencies && selectedTrait.tool_proficiencies.length > 0 && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Competencias de Herramientas:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.tool_proficiencies.join(', ')}</p>
                </>
              )}
              {selectedTrait.languages_count && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Idiomas adicionales:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{selectedTrait.languages_count}</p>
                </>
              )}

              {/* Para Feats: Prerrequisitos */}
              {selectedTrait.prerequisites && selectedTrait.prerequisites.length > 0 && (
                <>
                  <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Prerrequisitos:</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>
                    {selectedTrait.prerequisites.map(p => {
                      if (typeof p === 'string') return p;
                      if (p.ability_score && p.minimum_score) {
                        const scoreName = typeof p.ability_score === 'object' ? p.ability_score.name : p.ability_score;
                        return `${scoreName} ${p.minimum_score}`;
                      }
                      if (p.feature) return p.feature;
                      return JSON.stringify(p);
                    }).join(', ')}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Razas asociadas */}
          {selectedTrait.races && selectedTrait.races.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h4 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgba(226,209,166,0.9)',
                margin: '0 0 0.5rem 0',
              }}>
                Razas
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedTrait.races.map((r, idx) => (
                  <span key={idx} style={{
                    background: 'rgba(96,165,250,0.15)',
                    border: '1px solid rgba(96,165,250,0.3)',
                    borderRadius: 6,
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.8rem',
                    color: 'rgba(226,209,166,0.8)',
                  }}>
                    {r.name || r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Proficiencias */}
          {(selectedTrait.proficiencies || selectedTrait.starting_proficiencies) && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h4 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgba(226,209,166,0.9)',
                margin: '0 0 0.5rem 0',
              }}>
                Proficiencias
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(selectedTrait.proficiencies || selectedTrait.starting_proficiencies).map((prof, idx) => (
                  <span key={idx} style={{
                    background: 'rgba(217,83,30,0.15)',
                    border: '1px solid rgba(217,83,30,0.3)',
                    borderRadius: 6,
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.8rem',
                    color: 'rgba(226,209,166,0.8)',
                  }}>
                    {prof.name || prof.item?.name || prof}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bonificaciones de habilidad */}
          {selectedTrait.ability_bonuses && selectedTrait.ability_bonuses.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h4 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgba(226,209,166,0.9)',
                margin: '0 0 0.5rem 0',
              }}>
                Bonificaciones de Habilidad
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem', color: 'rgba(226,209,166,0.7)' }}>
                {selectedTrait.ability_bonuses.map((bonus, idx) => (
                  <div key={idx}>+{bonus.bonus} {bonus.ability_score?.name || bonus.ability_score?.index || 'N/A'}</div>
                ))}
              </div>
            </div>
          )}

          {/* Traits (para razas) */}
          {selectedTrait.traits && selectedTrait.traits.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h4 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgba(226,209,166,0.9)',
                margin: '0 0 0.5rem 0',
              }}>
                Rasgos
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedTrait.traits.map((trait, idx) => (
                  <span key={idx} style={{
                    background: 'rgba(226,209,166,0.1)',
                    border: '1px solid rgba(226,209,166,0.2)',
                    borderRadius: 6,
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.8rem',
                    color: 'rgba(226,209,166,0.8)',
                  }}>
                    {trait.name || trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.75rem',
            color: 'rgba(226,209,166,0.3)',
          }}>
            Fuente: Enciclopedia Local (D&D 5e)
          </div>
          </div>
        ) : (
          <div style={{
            width: '100%',
            borderRadius: 15,
            border: '1px dashed rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.02)',
            padding: '1.25rem',
            color: 'rgba(226,209,166,0.45)',
            fontSize: '0.9rem',
          }}>
            Selecciona un rasgo para ver su descripción detallada.
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
    </>
  )
}

import React, { useState } from 'react'
import { Search, BookOpen, X } from 'lucide-react'
import traitsData from '../data/dnd-traits.json'

export default function TraitsReference() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrait, setSelectedTrait] = useState(null)
  const [traitDetails, setTraitDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Filtrar rasgos por búsqueda
  const filteredTraits = traitsData.results.filter(trait =>
    trait.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Cargar detalles del rasgo
  const handleSelectTrait = async (trait) => {
    setSelectedTrait(trait)
    setLoadingDetails(true)
    setTraitDetails(null)

    try {
      // Intentar obtener desde la API de D&D 5e
      const response = await fetch(`https://www.dnd5eapi.co/api/traits/${trait.index}`)
      if (response.ok) {
        const data = await response.json()
        setTraitDetails(data)
      } else {
        setTraitDetails({ error: true })
      }
    } catch (err) {
      console.error('Error loading trait details:', err)
      setTraitDetails({ error: true })
    } finally {
      setLoadingDetails(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
      {/* Lista de Rasgos - Lado Izquierdo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
        {/* Header */}
        <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
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

        {/* Lista de Rasgos */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          paddingRight: '0.5rem',
        }}>
          {filteredTraits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(226,209,166,0.4)' }}>
              <BookOpen size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No se encontraron rasgos para "{searchQuery}"</p>
            </div>
          ) : (
            filteredTraits.map((trait) => (
              <button
                key={trait.index}
                onClick={() => handleSelectTrait(trait)}
                style={{
                  background: selectedTrait?.index === trait.index
                    ? 'rgba(217,83,30,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  border: selectedTrait?.index === trait.index
                    ? '2px solid rgba(217,83,30,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '1rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (selectedTrait?.index !== trait.index) {
                    e.currentTarget.style.background = 'rgba(217,83,30,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(217,83,30,0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTrait?.index !== trait.index) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }
                }}
              >
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
              </button>
            ))
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
          Total: {filteredTraits.length} de {traitsData.count} rasgos encontrados
        </div>
      </div>

      {/* Panel Detallado - Lado Derecho */}
      {selectedTrait && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(217,83,30,0.2)',
          borderRadius: 15,
          overflowY: 'auto',
          minWidth: 0,
        }}>
          {/* Header del Panel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
            <h2 style={{
              fontFamily: 'Almendra, serif',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--fantasy-gold)',
              margin: 0,
            }}>
              {selectedTrait.name}
            </h2>
            <button
              onClick={() => {
                setSelectedTrait(null)
                setTraitDetails(null)
              }}
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

          {/* Contenido */}
          {loadingDetails ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(226,209,166,0.4)' }}>
              <div style={{
                display: 'inline-block',
                width: 24,
                height: 24,
                border: '3px solid rgba(217,83,30,0.2)',
                borderTop: '3px solid var(--fantasy-gold)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ marginTop: '1rem' }}>Cargando detalles...</p>
            </div>
          ) : traitDetails?.error ? (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: '1rem',
              color: '#fca5a5',
              fontSize: '0.9rem',
            }}>
              No se pudieron cargar los detalles de este rasgo. Verifica tu conexión.
            </div>
          ) : traitDetails ? (
            <>
              {/* Descripción */}
              <div>
                <h3 style={{
                  fontFamily: 'Almendra, serif',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'rgba(226,209,166,0.9)',
                  margin: '0 0 0.75rem 0',
                }}>
                  Descripción
                </h3>
                <div style={{ color: 'rgba(226,209,166,0.75)', lineHeight: 1.6 }}>
                  {traitDetails.desc && traitDetails.desc.length > 0 ? (
                    traitDetails.desc.map((paragraph, idx) => (
                      <p key={idx} style={{ margin: '0.5rem 0' }}>{paragraph}</p>
                    ))
                  ) : (
                    <p style={{ color: 'rgba(226,209,166,0.5)' }}>Sin descripción disponible</p>
                  )}
                </div>
              </div>

              {/* Información adicional si existe */}
              {traitDetails.ability_scores && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                  <h3 style={{
                    fontFamily: 'Almendra, serif',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'rgba(226,209,166,0.9)',
                    margin: '0 0 0.5rem 0',
                  }}>
                    Bonificación de Habilidades
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem', color: 'rgba(226,209,166,0.7)' }}>
                    {Object.entries(traitDetails.ability_scores).map(([ability, value]) => (
                      <div key={ability}>+{value} {ability}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fuente */}
              <div style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.75rem',
                color: 'rgba(226,209,166,0.3)',
              }}>
                Fuente: D&D 5e Official API
              </div>
            </>
          ) : null}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

import React, { useMemo, useState } from 'react'
import { Search, Sparkles, X, CheckCircle, Book } from 'lucide-react'
import spellsData from '../../data/encyclopedia/spells.json'

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

const SCHOOL_CONFIG = {
  all: { label: 'Todas', color: 'rgba(226,209,166,0.6)' },
  Abjuración: { label: 'Abjuración', color: '#60a5fa' },
  Adivinación: { label: 'Adivinación', color: '#38bdf8' },
  Conjuración: { label: 'Conjuración', color: '#fb923c' },
  Encantamiento: { label: 'Encantamiento', color: '#f472b6' },
  Evocación: { label: 'Evocación', color: '#f87171' },
  Ilusión: { label: 'Ilusión', color: '#a78bfa' },
  Nigromancia: { label: 'Nigromancia', color: '#4ade80' },
  Transmutación: { label: 'Transmutación', color: '#fbbf24' },
}

export default function SpellsReference() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedSchool, setSelectedSchool] = useState('all')
  const [selectedSpell, setSelectedSpell] = useState(null)

  const levels = useMemo(() => ['all', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], [])
  
  const filteredSpells = useMemo(() => {
    let results = spellsData
    
    if (selectedLevel !== 'all') {
      results = results.filter(s => s.level === parseInt(selectedLevel))
    }
    
    if (selectedSchool !== 'all') {
      results = results.filter(s => s.school === selectedSchool)
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.school.toLowerCase().includes(q)
      )
    }
    
    return results.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
  }, [searchQuery, selectedLevel, selectedSchool])

  return (
    <div className="w-full max-w-7xl mx-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 h-full items-start">
        {/* Lista de Hechizos */}
        <div className={`${!selectedSpell ? 'flex' : 'hidden md:flex'} flex-col gap-6 min-w-0`}>
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
              Grimorio Arcane
            </h2>
            <p style={{ color: 'rgba(226,209,166,0.55)', fontSize: '0.95rem', margin: 0 }}>
              Conjuros y rituales mágicos de D&D 5e
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
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Buscar hechizo..."
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
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filtros de Nivel */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                style={{
                  fontFamily: 'Almendra, serif',
                  width: level === 'all' ? 'auto' : '2.2rem',
                  height: '2.2rem',
                  padding: level === 'all' ? '0 0.75rem' : 0,
                  borderRadius: 8,
                  border: selectedLevel === level ? '2px solid var(--fantasy-gold)' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedLevel === level ? 'rgba(226,209,166,0.1)' : 'rgba(255,255,255,0.03)',
                  color: selectedLevel === level ? 'var(--fantasy-gold)' : 'rgba(226,209,166,0.6)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                {level === 'all' ? 'Todos' : level}
              </button>
            ))}
          </div>

          {/* Filtros de Escuela */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.keys(SCHOOL_CONFIG).map((school) => {
              const config = SCHOOL_CONFIG[school]
              const isActive = selectedSchool === school
              return (
                <button
                  key={school}
                  onClick={() => setSelectedSchool(school)}
                  style={{
                    fontFamily: 'Almendra, serif',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 8,
                    border: isActive ? `2px solid ${config.color}` : '1px solid rgba(255,255,255,0.1)',
                    background: isActive ? `${config.color}20` : 'rgba(255,255,255,0.03)',
                    color: isActive ? config.color : 'rgba(226,209,166,0.6)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {config.label}
                </button>
              )
            })}
          </div>

          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredSpells.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(226,209,166,0.4)' }}>
                <Sparkles size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No se encontraron hechizos</p>
              </div>
            ) : (
              filteredSpells.map((spell) => {
                const schoolInfo = SCHOOL_CONFIG[spell.school] || { label: spell.school, color: '#999' }
                const isSelected = selectedSpell?.id === spell.id
                return (
                  <button
                    key={spell.id}
                    onClick={() => setSelectedSpell(spell)}
                    style={{
                      background: isSelected ? 'rgba(217,83,30,0.15)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '2px solid rgba(217,83,30,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      padding: '1rem',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h3 style={{
                        fontFamily: 'Almendra, serif',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--fantasy-gold)',
                        margin: '0 0 0.2rem 0',
                      }}>
                        {spell.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(226,209,166,0.5)' }}>
                        <span style={{ color: schoolInfo.color }}>{schoolInfo.label}</span>
                        <span>•</span>
                        <span>Nivel {spell.level === 0 ? 'Truco' : spell.level}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Detalle del Hechizo */}
        <div className={`${selectedSpell ? 'block' : 'hidden md:block'} md:sticky md:top-0 w-full`}>
          {selectedSpell ? (
            <div style={detailPanelStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontFamily: 'Almendra, serif',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--fantasy-gold)',
                    margin: 0,
                  }}>
                    {selectedSpell.name}
                  </h2>
                  <div style={{ 
                    marginTop: '0.5rem',
                    display: 'flex', 
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    <span style={{ 
                      color: (SCHOOL_CONFIG[selectedSpell.school] || {}).color || '#999',
                      background: `${(SCHOOL_CONFIG[selectedSpell.school] || {}).color || '#999'}15`,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 4,
                      border: `1px solid ${(SCHOOL_CONFIG[selectedSpell.school] || {}).color || '#999'}30`
                    }}>
                      {(SCHOOL_CONFIG[selectedSpell.school] || { label: selectedSpell.school }).label}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                      Nivel {selectedSpell.level === 0 ? 'Truco' : selectedSpell.level}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSpell(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(226,209,166,0.5)', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Botón Volver (móvil) */}
              <button
                onClick={() => setSelectedSpell(null)}
                className="md:hidden flex items-center justify-center gap-2 w-full py-3 mt-2 bg-white/5 border border-white/10 rounded-xl text-fantasy-gold"
              >
                <CheckCircle size={16} />
                Volver a la lista
              </button>

              {/* Meta Data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={metaBoxStyle}>
                  <div style={metaLabelStyle}>Tiempo</div>
                  <div style={metaValueStyle}>{selectedSpell.casting_time}</div>
                </div>
                <div style={metaBoxStyle}>
                  <div style={metaLabelStyle}>Alcance</div>
                  <div style={metaValueStyle}>{selectedSpell.range}</div>
                </div>
                <div style={metaBoxStyle}>
                  <div style={metaLabelStyle}>Componentes</div>
                  <div style={metaValueStyle}>{selectedSpell.components}</div>
                </div>
                <div style={metaBoxStyle}>
                  <div style={metaLabelStyle}>Duración</div>
                  <div style={metaValueStyle}>{selectedSpell.duration}</div>
                </div>
              </div>

              {/* Descripción */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h3 style={{ fontFamily: 'Almendra, serif', fontSize: '1.2rem', color: 'rgba(226,209,166,0.9)', marginBottom: '0.75rem' }}>Descripción</h3>
                <div style={{ color: 'rgba(226,209,166,0.75)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                  {selectedSpell.desc.map((paragraph, idx) => (
                    <p key={idx} style={{ marginBottom: '1rem' }}>{paragraph}</p>
                  ))}
                  
                  {selectedSpell.higher_level && selectedSpell.higher_level.length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(217,83,30,0.1)', borderRadius: 8, border: '1px solid rgba(217,83,30,0.2)' }}>
                      <strong style={{ color: 'var(--fantasy-gold)', fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>A niveles superiores:</strong>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>{selectedSpell.higher_level[0]}</p>
                    </div>
                  )}

                  {selectedSpell.damage && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                      <strong style={{ color: 'var(--fantasy-gold)', fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Daño/Efecto:</strong>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{selectedSpell.damage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '100%',
              borderRadius: 15,
              border: '1px dashed rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.02)',
              padding: '1.5rem',
              color: 'rgba(226,209,166,0.45)',
              textAlign: 'center'
            }}>
              <Book size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>Selecciona un hechizo para ver sus misterios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const metaBoxStyle = {
  background: 'rgba(255,255,255,0.03)',
  padding: '0.6rem 0.75rem',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.05)',
}

const metaLabelStyle = {
  fontSize: '0.6rem',
  color: 'rgba(226,209,166,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.1rem'
}

const metaValueStyle = {
  color: 'var(--fantasy-gold)',
  fontWeight: 600,
  fontSize: '0.85rem'
}

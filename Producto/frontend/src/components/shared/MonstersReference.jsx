import React, { useMemo, useState, useEffect } from 'react'
import { Search, Skull, X, CheckCircle, Shield, Heart, Activity } from 'lucide-react'
import monstersData from '../../data/encyclopedia/monsters.json'

const abilityLabels = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
}

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

const TYPE_CONFIG = {
  all: { label: 'Todos', color: 'rgba(226,209,166,0.6)' },
  beast: { label: 'Bestia', color: '#fb923c' },
  humanoid: { label: 'Humanoide', color: '#60a5fa' },
  undead: { label: 'No Muerto', color: '#a78bfa' },
  fiend: { label: 'Infernal', color: '#f87171' },
  giant: { label: 'Gigante', color: '#fbbf24' },
  dragon: { label: 'Dragón', color: '#ef4444' },
  elemental: { label: 'Elemental', color: '#38bdf8' },
  monstrosity: { label: 'Monstruosidad', color: '#c084fc' },
  construct: { label: 'Constructo', color: '#94a3b8' },
  ooze: { label: 'Cieno', color: '#4ade80' },
  celestial: { label: 'Celestial', color: '#fde047' },
}

export default function MonstersReference() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedMonster, setSelectedMonster] = useState(null)

  // Obtener tipos únicos presentes en los datos
  const availableTypes = useMemo(() => {
    const types = new Set(['all'])
    monstersData.forEach(m => {
      if (m.type) types.add(m.type)
    })
    return Array.from(types).sort((a, b) => {
      if (a === 'all') return -1
      if (b === 'all') return 1
      return a.localeCompare(b)
    })
  }, [])

  const filteredMonsters = useMemo(() => {
    let results = monstersData
    
    if (selectedType !== 'all') {
      results = results.filter(m => m.type === selectedType)
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.type.toLowerCase().includes(q)
      )
    }
    
    return results.sort((a, b) => a.name.localeCompare(b.name))
  }, [searchQuery, selectedType])

  return (
    <div className="w-full max-w-7xl mx-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 h-full items-start">
        {/* Lista de Monstruos */}
        <div className={`${!selectedMonster ? 'flex' : 'hidden md:flex'} flex-col gap-6 min-w-0`}>
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
              Bestiario
            </h2>
            <p style={{ color: 'rgba(226,209,166,0.55)', fontSize: '0.95rem', margin: 0 }}>
              Estadísticas de criaturas y monstruos de D&D 5e
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
              placeholder="Buscar monstruo..."
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

          {/* Filtros de Tipo */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {availableTypes.map((type) => {
              const config = TYPE_CONFIG[type] || { label: type, color: '#999' }
              const isActive = selectedType === type
              return (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type)
                    setSearchQuery('')
                    setSelectedMonster(null)
                  }}
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
                    textTransform: 'capitalize',
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
            {filteredMonsters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(226,209,166,0.4)' }}>
                <Skull size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No se encontraron monstruos</p>
              </div>
            ) : (
              filteredMonsters.map((monster) => {
                const typeInfo = TYPE_CONFIG[monster.type] || { label: monster.type, color: '#999' }
                const isSelected = selectedMonster?.id === monster.id
                return (
                  <button
                    key={monster.id}
                    onClick={() => setSelectedMonster(monster)}
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
                        {monster.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(226,209,166,0.5)' }}>
                        <span style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                        <span>•</span>
                        <span>CR {monster.challenge_rating}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--fantasy-gold)', fontWeight: 600 }}>HP {monster.hit_points}</div>
                      <div style={{ opacity: 0.5 }}>AC {monster.armor_class}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Detalle del Monstruo */}
        <div className={`${selectedMonster ? 'block' : 'hidden md:block'} md:sticky md:top-0 w-full`}>
          {selectedMonster ? (
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
                    {selectedMonster.name}
                  </h2>
                  <div style={{ 
                    marginTop: '0.5rem',
                    display: 'flex', 
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    <span style={{ 
                      color: (TYPE_CONFIG[selectedMonster.type] || {}).color || '#999',
                      background: `${(TYPE_CONFIG[selectedMonster.type] || {}).color || '#999'}15`,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 4,
                      border: `1px solid ${(TYPE_CONFIG[selectedMonster.type] || {}).color || '#999'}30`
                    }}>
                      {(TYPE_CONFIG[selectedMonster.type] || { label: selectedMonster.type }).label}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                      {selectedMonster.size}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMonster(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(226,209,166,0.5)', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Botón Volver (móvil) */}
              <button
                onClick={() => setSelectedMonster(null)}
                className="md:hidden flex items-center justify-center gap-2 w-full py-3 mt-2 bg-white/5 border border-white/10 rounded-xl text-fantasy-gold"
              >
                <CheckCircle size={16} />
                Volver a la lista
              </button>

              {/* Stats Principales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 10, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Shield size={14} style={{ margin: '0 auto 0.2rem', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.6rem', color: 'rgba(226,209,166,0.4)', textTransform: 'uppercase' }}>AC</div>
                  <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700 }}>{selectedMonster.armor_class}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 10, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Heart size={14} style={{ margin: '0 auto 0.2rem', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.6rem', color: 'rgba(226,209,166,0.4)', textTransform: 'uppercase' }}>HP</div>
                  <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700 }}>{selectedMonster.hit_points}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 10, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Activity size={14} style={{ margin: '0 auto 0.2rem', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.6rem', color: 'rgba(226,209,166,0.4)', textTransform: 'uppercase' }}>CR</div>
                  <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700 }}>{selectedMonster.challenge_rating}</div>
                </div>
              </div>

              {/* Atributos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.25rem', marginTop: '0.5rem' }}>
                {Object.entries(abilityLabels).map(([key, label]) => (
                  <div key={key} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.2rem', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(226,209,166,0.3)' }}>{label}</div>
                    <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700, fontSize: '0.9rem' }}>{selectedMonster[key]}</div>
                  </div>
                ))}
              </div>

              {/* Descripción y Acciones */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                {selectedMonster.desc && selectedMonster.desc.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'Almendra, serif', fontSize: '1.1rem', color: 'rgba(226,209,166,0.9)', marginBottom: '0.5rem' }}>Descripción</h3>
                    {selectedMonster.desc.map((d, i) => <p key={i} style={{ fontSize: '0.85rem', color: 'rgba(226,209,166,0.7)', lineHeight: 1.5, marginBottom: '0.5rem' }}>{d}</p>)}
                  </div>
                )}

                {selectedMonster.actions && selectedMonster.actions.length > 0 && (
                  <div>
                    <h3 style={{ fontFamily: 'Almendra, serif', fontSize: '1.1rem', color: 'rgba(226,209,166,0.9)', marginBottom: '0.5rem' }}>Acciones</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {selectedMonster.actions.map((action, i) => (
                        <div key={i}>
                          <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{action.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(226,209,166,0.7)', lineHeight: 1.4 }}>{action.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              <Skull size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>Selecciona una criatura para ver sus estadísticas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { Search, Package, X, CheckCircle } from 'lucide-react'
import equipmentData from '../../data/encyclopedia/equipment.json'

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

// Mapa de etiquetas y colores por categoría
const CATEGORY_CONFIG = {
  all:               { label: 'Todos',       color: 'rgba(226,209,166,0.6)' },
  weapon:            { label: 'Armas',       color: '#f87171' },
  armor:             { label: 'Armaduras',   color: '#60a5fa' },
  'adventuring-gear':{ label: 'Equipo',      color: '#34d399' },
  tools:             { label: 'Herramientas',color: '#fb923c' },
  magic:             { label: 'Mágicos',     color: '#a78bfa' },
  consumable:        { label: 'Consumibles', color: '#fbbf24' },
}

// Orden fijo de categorías
const CATEGORY_ORDER = ['all', 'weapon', 'armor', 'adventuring-gear', 'tools', 'magic', 'consumable']

// ── Deduplicar datos por id ──────────────────────────────────────────────────
const uniqueEquipment = (() => {
  const seen = new Set()
  return equipmentData.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
})()

export default function EquipmentReference() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)

  // Conteo por categoría
  const categoryCounts = useMemo(() => {
    const counts = { all: uniqueEquipment.length }
    uniqueEquipment.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1
    })
    return counts
  }, [])

  // Filtrado por categoría + búsqueda
  const filteredItems = useMemo(() => {
    let results = uniqueEquipment

    if (selectedCategory !== 'all') {
      results = results.filter(item => item.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.desc && item.desc.some(d => d.toLowerCase().includes(q)))
      )
    }

    return results
  }, [selectedCategory, searchQuery])

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedItem(null)
    setSearchQuery('')
  }

  return (
    <>
    <div className="w-full max-w-7xl mx-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 h-full items-start">
      {/* Lista de Equipamiento - Lado Izquierdo */}
      <div className={`${!selectedItem ? 'flex' : 'hidden md:flex'} flex-col gap-6 min-w-0`}>
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
              Equipamiento
            </h2>
            <p style={{ color: 'rgba(226,209,166,0.55)', fontSize: '0.95rem', margin: 0 }}>
              Armas, armaduras y objetos mágicos de D&D 5e
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
            placeholder="Buscar equipamiento..."
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

        {/* Filtros por categoría con conteo */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORY_ORDER.map((cat) => {
            const config = CATEGORY_CONFIG[cat] || { label: cat, color: '#999' }
            const count = categoryCounts[cat] || 0
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  fontFamily: 'Almendra, serif',
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: isActive
                    ? `2px solid ${config.color}`
                    : '1px solid rgba(255,255,255,0.1)',
                  background: isActive
                    ? `${config.color}18`
                    : 'rgba(255,255,255,0.03)',
                  color: isActive ? config.color : 'rgba(226,209,166,0.6)',
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
                    e.currentTarget.style.borderColor = `${config.color}60`
                    e.currentTarget.style.color = config.color
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.color = 'rgba(226,209,166,0.6)'
                  }
                }}
              >
                {config.label}
                <span style={{
                  fontSize: '0.65rem',
                  background: isActive ? `${config.color}30` : 'rgba(255,255,255,0.08)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: 4,
                  lineHeight: 1.3,
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Lista de Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          paddingRight: '0.5rem',
        }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(226,209,166,0.4)' }}>
              <Package size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No se encontró equipamiento</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const catConfig = CATEGORY_CONFIG[item.category] || { label: item.category, color: '#999' }
              const isSelected = selectedItem?.id === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    background: isSelected
                      ? `${catConfig.color}18`
                      : 'rgba(255,255,255,0.03)',
                    border: isSelected
                      ? `2px solid ${catConfig.color}80`
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '1rem',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.borderColor = `${catConfig.color}40`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <h3 style={{
                      fontFamily: 'Almendra, serif',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--fantasy-gold)',
                      margin: 0,
                      flex: 1,
                    }}>
                      {item.name}
                    </h3>
                    {/* Badge de categoría */}
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: catConfig.color,
                      background: `${catConfig.color}15`,
                      border: `1px solid ${catConfig.color}30`,
                      borderRadius: 5,
                      padding: '0.15rem 0.45rem',
                      flexShrink: 0,
                    }}>
                      {catConfig.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'rgba(226,209,166,0.5)', flexWrap: 'wrap' }}>
                    {item.equipment_category?.name && <span>📦 {item.equipment_category.name}</span>}
                    {item.cost && <span>💰 {item.cost.quantity}{item.cost.unit}</span>}
                    {item.damage && <span>⚔️ {item.damage.damage_dice}</span>}
                    {item.armor_class && <span>🛡️ CA {item.armor_class.base}</span>}
                    {item.weight != null && <span>⚖️ {item.weight} lb</span>}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Total */}
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          fontSize: '0.8rem',
          color: 'rgba(226,209,166,0.3)',
        }}>
          Total: {filteredItems.length} objetos encontrados
        </div>
      </div>

      {/* Columna Derecha - Panel de Detalle */}
      <div className={`${selectedItem ? 'block' : 'hidden md:block'} md:sticky md:top-0 w-full`}>
        {selectedItem ? (
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
                {selectedItem.name}
              </h2>
              {/* Badge de categoría en detalle */}
              <span style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: (CATEGORY_CONFIG[selectedItem.category] || {}).color || '#999',
                background: `${(CATEGORY_CONFIG[selectedItem.category] || {}).color || '#999'}18`,
                border: `1px solid ${(CATEGORY_CONFIG[selectedItem.category] || {}).color || '#999'}40`,
                borderRadius: 6,
                padding: '0.2rem 0.6rem',
              }}>
                {(CATEGORY_CONFIG[selectedItem.category] || { label: selectedItem.category }).label}
              </span>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
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

          {/* Botón Volver (móvil) */}
          <button
            onClick={() => setSelectedItem(null)}
            className="md:hidden flex items-center justify-center gap-2 w-full py-3 mt-2 bg-white/5 border border-white/10 rounded-xl text-fantasy-gold hover:bg-white/10 transition-colors"
          >
            <CheckCircle size={16} />
            Volver a la lista
          </button>

          {/* Clasificación */}
          {selectedItem.equipment_category?.name && (
            <div>
              <h3 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgba(226,209,166,0.9)',
                margin: '0 0 0.5rem 0',
              }}>
                Clasificación
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(217,83,30,0.2)', padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                  {selectedItem.equipment_category.name}
                </span>
              </div>
            </div>
          )}

          {/* Costo y Peso */}
          {(selectedItem.cost || selectedItem.weight != null) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Costo</p>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--fantasy-gold)' }}>
                  {selectedItem.cost ? `${selectedItem.cost.quantity} ${selectedItem.cost.unit}` : '—'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Peso</p>
                <p style={{ margin: 0, fontWeight: 700 }}>{selectedItem.weight != null ? `${selectedItem.weight} lb.` : '—'}</p>
              </div>
            </div>
          )}

          {/* Daño (armas) */}
          {selectedItem.damage && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h3 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgba(226,209,166,0.9)',
                margin: '0 0 0.5rem 0',
              }}>
                Daño
              </h3>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--fantasy-gold)' }}>
                {selectedItem.damage.damage_dice} {selectedItem.damage.damage_type?.name}
              </p>
              {selectedItem.properties && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedItem.properties.map((p, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CA (armaduras) */}
          {selectedItem.armor_class && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h3 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgba(226,209,166,0.9)',
                margin: '0 0 0.5rem 0',
              }}>
                Clase de Armadura
              </h3>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--fantasy-gold)' }}>
                CA {selectedItem.armor_class.base}
              </p>
            </div>
          )}

          {/* Rareza */}
          {selectedItem.rarity && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Rareza</p>
              <p style={{ margin: 0, fontWeight: 700, textTransform: 'capitalize' }}>{selectedItem.rarity}</p>
            </div>
          )}

          {/* Descripción */}
          {selectedItem.desc && selectedItem.desc.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h4 style={{
                fontFamily: 'Almendra, serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'rgba(226,209,166,0.9)',
                margin: '0 0 0.5rem 0',
              }}>
                Descripción
              </h4>
              <div style={{ color: 'rgba(226,209,166,0.75)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                {selectedItem.desc.map((d, i) => <p key={i} style={{ margin: '0.5rem 0' }}>{d}</p>)}
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
            Selecciona un objeto para ver su descripción detallada.
          </div>
        )}
      </div>
      </div>
    </div>
    </>
  )
}

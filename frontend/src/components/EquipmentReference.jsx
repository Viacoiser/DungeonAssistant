import React, { useState } from 'react'
import { Search, Package, X } from 'lucide-react'
import itemsData from '../data/items.json'

export default function EquipmentReference() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)

  // Obtener tipos únicos
  const types = ['all', ...new Set(itemsData.items.map(item => item.type))]

  // Filtrar equipamiento
  const filteredItems = itemsData.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || item.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
      {/* Lista de Equipamiento - Lado Izquierdo */}
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
            Equipamiento
          </h2>
          <p style={{ color: 'rgba(226,209,166,0.55)', fontSize: '0.95rem', margin: 0 }}>
            Armas, armaduras y objetos mágicos de D&D 5e
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

        {/* Filtros por tipo */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                fontFamily: 'Almendra, serif',
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: selectedType === type
                  ? '2px solid var(--fantasy-gold)'
                  : '1px solid rgba(255,255,255,0.1)',
                background: selectedType === type
                  ? 'rgba(226,209,166,0.1)'
                  : 'rgba(255,255,255,0.03)',
                color: selectedType === type
                  ? 'var(--fantasy-gold)'
                  : 'rgba(226,209,166,0.6)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (selectedType !== type) {
                  e.currentTarget.style.borderColor = 'rgba(217,83,30,0.3)'
                  e.currentTarget.style.color = 'var(--fantasy-gold)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== type) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = 'rgba(226,209,166,0.6)'
                }
              }}
            >
              {type === 'all' ? 'Todos' : type}
            </button>
          ))}
        </div>

        {/* Lista de Equipamiento */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
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
            filteredItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: selectedItem === item
                    ? 'rgba(217,83,30,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  border: selectedItem === item
                    ? '2px solid rgba(217,83,30,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '1rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (selectedItem !== item) {
                    e.currentTarget.style.background = 'rgba(217,83,30,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(217,83,30,0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedItem !== item) {
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
                  {item.name}
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'rgba(226,209,166,0.5)', flexWrap: 'wrap' }}>
                  {item.damage && <span>⚔️ {item.damage}</span>}
                  {item.rarity && <span>✨ {item.rarity}</span>}
                </div>
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
          Total: {filteredItems.length} de {itemsData.items.length} objetos encontrados
        </div>
      </div>

      {/* Panel Detallado - Lado Derecho */}
      {selectedItem && (
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
              {selectedItem.name}
            </h2>
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

          {/* Información del Item */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'rgba(226,209,166,0.75)', lineHeight: 1.6 }}>
            {/* Tipo */}
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
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(217,83,30,0.2)', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem', textTransform: 'capitalize', fontWeight: 600 }}>
                  {selectedItem.type}
                </span>
                {selectedItem.category && (
                  <span style={{ background: 'rgba(217,83,30,0.15)', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem', textTransform: 'capitalize' }}>
                    {selectedItem.category}
                  </span>
                )}
                {selectedItem.rarity && (
                  <span style={{ background: 'rgba(217,83,30,0.15)', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem', textTransform: 'capitalize' }}>
                    Rareza: {selectedItem.rarity}
                  </span>
                )}
              </div>
            </div>

            {/* Propiedades */}
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
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--fantasy-gold)' }}>
                  {selectedItem.damage}
                </div>
              </div>
            )}

            {/* Descripción genérica */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', color: 'rgba(226,209,166,0.65)', fontSize: '0.95rem' }}>
              <p>
                Este es un {selectedItem.type} de rareza {selectedItem.rarity || 'desconocida'} en D&D 5e.
              </p>
              {selectedItem.damage && (
                <p>
                  Causa {selectedItem.damage} de daño cuando se usa en combate.
                </p>
              )}
              {selectedItem.category && (
                <p>
                  Categoría: {selectedItem.category}.
                </p>
              )}
            </div>

            {/* Fuente */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.75rem',
              color: 'rgba(226,209,166,0.3)',
            }}>
              Fuente: D&D 5e Official Database
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

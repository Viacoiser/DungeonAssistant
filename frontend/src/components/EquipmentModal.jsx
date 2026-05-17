import React, { useState, useEffect } from 'react'
import { Trash2, Plus, X, Search } from 'lucide-react'
import { commonItems } from '../services/equipmentService'

/**
 * Modal para gestionar equipamiento de un personaje
 */
export default function EquipmentModal({ character, onClose, onUpdate }) {
  const [equipment, setEquipment] = useState(character.equipment ? JSON.parse(character.equipment || '[]') : [])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableItems = commonItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddItem = (item) => {
    const newItem = {
      id: Date.now().toString(),
      ...item,
      quantity: 1,
    }
    setEquipment([...equipment, newItem])
  }

  const handleRemoveItem = (itemId) => {
    setEquipment(equipment.filter(item => item.id !== itemId))
  }

  const handleQuantityChange = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
    } else {
      setEquipment(equipment.map(item =>
        item.id === itemId ? { ...item, quantity: parseInt(quantity) || 1 } : item
      ))
    }
  }

  const calculateTotalWeight = () => {
    return equipment.reduce((total, item) => {
      return total + ((item.weight || 0) * (item.quantity || 1))
    }, 0)
  }

  const handleSave = () => {
    setLoading(true)
    setError('')
    
    try {
      onUpdate({
        equipment: JSON.stringify(equipment),
      })
      
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (e) {
      console.error('Error saving equipment:', e)
      setError('Error al guardar equipamiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem',
    }}>
      <div style={{
        background: 'rgba(26,26,26,0.95)', border: '1px solid rgba(217,83,30,0.3)',
        borderRadius: 16, padding: '2rem', maxWidth: '700px', width: '100%',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.5rem', color: '#fbbf24', margin: 0 }}>
            ⚔️ Equipamiento
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(226,209,166,0.5)', cursor: 'pointer', fontSize: '1.5rem' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'rgba(226,209,166,0.4)' }} />
            <input
              type="text"
              placeholder="Buscar items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: '#fff', fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Available Items */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'rgba(226,209,166,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>
            Objetos Disponibles
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
            {availableItems.length > 0 ? (
              availableItems.map(item => (
                <button
                  key={item.name}
                  onClick={() => handleAddItem(item)}
                  style={{
                    padding: '0.75rem', borderRadius: 8,
                    background: 'rgba(217,83,30,0.3)', border: '1px solid rgba(217,83,30,0.5)',
                    color: '#fff', cursor: 'pointer', fontSize: '0.85rem',
                    fontWeight: 600, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(217,83,30,0.5)'
                    e.currentTarget.style.borderColor = 'rgba(217,83,30,0.8)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(217,83,30,0.3)'
                    e.currentTarget.style.borderColor = 'rgba(217,83,30,0.5)'
                  }}
                >
                  <Plus size={14} /> {item.name}
                </button>
              ))
            ) : (
              <p style={{ color: 'rgba(226,209,166,0.4)', fontSize: '0.9rem', gridColumn: '1/-1', textAlign: 'center' }}>
                No hay items que coincidan
              </p>
            )}
          </div>
        </div>

        {/* Current Equipment */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'rgba(226,209,166,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>
            Equipamiento del Personaje
          </h3>

          {equipment.length === 0 ? (
            <p style={{ color: 'rgba(226,209,166,0.4)', fontSize: '0.9rem', margin: 0 }}>
              Sin objetos. Añade algunos para comenzar.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {equipment.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(217,83,30,0.15)', border: '1px solid rgba(217,83,30,0.3)',
                    borderRadius: 8, padding: '0.75rem 1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                      {item.name}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(226,209,166,0.5)', fontSize: '0.8rem' }}>
                      {item.type} {item.weight ? `• Peso: ${item.weight} lb` : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleQuantityChange(item.id, e.target.value)}
                      min="1"
                      style={{
                        width: '50px', padding: '0.4rem',
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6, color: '#fff', fontSize: '0.85rem',
                        textAlign: 'center', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.3)',
                        color: '#f87171', padding: '0.4rem 0.6rem',
                        borderRadius: 6, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(248,113,113,0.4)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(248,113,113,0.2)'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Total Weight */}
              <div style={{
                marginTop: '1rem', paddingTop: '1rem',
                borderTop: '1px solid rgba(217,83,30,0.3)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: 'rgba(226,209,166,0.6)', fontSize: '0.9rem', fontWeight: 600 }}>
                  Peso Total:
                </span>
                <span style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 700 }}>
                  {calculateTotalWeight()} lb
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '0.75rem',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1, padding: '0.75rem',
              background: 'rgba(217,83,30,0.8)', border: 'none',
              color: '#fff', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = 'rgba(217,83,30,1)')}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = 'rgba(217,83,30,0.8)')}
          >
            {loading ? 'Guardando...' : 'Guardar Equipamiento'}
          </button>
        </div>
      </div>
    </div>
  )
}

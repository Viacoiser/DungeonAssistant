import React, { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, Save, X, Backpack, Skull, AlertCircle } from 'lucide-react'
import { characterAPI } from '../services/api'
import { useDnd5eAPI } from '../hooks/useDnd5eAPI'
import EquipmentModal from './EquipmentModal'

/**
 * Modal para editar nivel y stats de personaje
 * Se actualiza automáticamente el HP y proficiency bonus
 * Sección de características personalizable con edición libre de stats
 */
export default function LevelUpModal({ character, campaignId, onClose, onUpdate, isGM }) {
  const { calculateMaxHP } = useDnd5eAPI()

  const [editedCharacter, setEditedCharacter] = useState(character)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showEquipment, setShowEquipment] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('main')

  useEffect(() => {
    if (isGM) {
      loadHistory()
    }
  }, [character.id])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await characterAPI.getHistory(character.id)
      setHistory(res.data?.history || [])
    } catch (e) {
      console.error('Error loading history:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleMarkDead = async () => {
    if (!window.confirm(`¿Marcar "${editedCharacter.name}" como difunto?`)) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await characterAPI.updateStatus(character.id, false)
      setEditedCharacter(prev => ({ ...prev, is_alive: false }))
      setSuccess('💀 Personaje marcado como difunto')

      await loadHistory()

      setTimeout(() => {
        onUpdate?.({ ...editedCharacter, is_alive: false })
      }, 500)
    } catch (e) {
      console.error('Error marking character as dead:', e)
      setError(e?.response?.data?.detail || 'Error al marcar personaje')
    } finally {
      setLoading(false)
    }
  }

  const handleRevive = async () => {
    if (!window.confirm(`¿Revivir "${editedCharacter.name}"?`)) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await characterAPI.updateStatus(character.id, true)
      setEditedCharacter(prev => ({ ...prev, is_alive: true }))
      setSuccess('✨ Personaje revivido')

      await loadHistory()

      setTimeout(() => {
        onUpdate?.({ ...editedCharacter, is_alive: true })
      }, 500)
    } catch (e) {
      console.error('Error reviving character:', e)
      setError(e?.response?.data?.detail || 'Error al revivir personaje')
    } finally {
      setLoading(false)
    }
  }

  const handleLevelChange = (delta) => {
    const newLevel = Math.max(1, Math.min(20, editedCharacter.level + delta))
    const newMaxHP = calculateMaxHP(editedCharacter.class_, newLevel, editedCharacter.stats.constitution)
    let profBonus = 2
    if (newLevel >= 5) profBonus = 3
    if (newLevel >= 9) profBonus = 4
    if (newLevel >= 13) profBonus = 5
    if (newLevel >= 17) profBonus = 6

    setEditedCharacter(prev => ({
      ...prev,
      level: newLevel,
      hp_max: newMaxHP,
      hp_current: newMaxHP,
      proficiency_bonus: profBonus,
    }))
  }

  const handleHPChange = (value) => {
    const hp = Math.max(1, Math.min(editedCharacter.hp_max, parseInt(value) || 0))
    setEditedCharacter(prev => ({ ...prev, hp_current: hp }))
  }

  const getModifier = (stat) => Math.floor((stat - 10) / 2)
  const getModifierString = (modifier) => {
    const sign = modifier >= 0 ? '+' : ''
    return `${sign}${modifier}`
  }

  const handleStatChange = (stat, newValue) => {
    const val = Math.max(3, Math.min(20, newValue))
    setEditedCharacter(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: val }
    }))
  }

  const handleStatIncrement = (stat, delta) => {
    const current = editedCharacter.stats[stat] || 10
    handleStatChange(stat, current + delta)
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updateData = {
        level: editedCharacter.level,
        hp_max: editedCharacter.hp_max,
        hp_current: editedCharacter.hp_current,
        proficiency_bonus: editedCharacter.proficiency_bonus,
        stats: editedCharacter.stats,
        armor_class: editedCharacter.armor_class,
        initiative: editedCharacter.initiative,
        speed: editedCharacter.speed,
      }

      await characterAPI.update(character.id, updateData)
      setSuccess('✅ Personaje actualizado')

      setTimeout(() => {
        onUpdate?.(editedCharacter)
        onClose()
      }, 1000)
    } catch (e) {
      console.error('Error updating character:', e)
      setError(e?.response?.data?.detail || 'Error al actualizar personaje')
    } finally {
      setLoading(false)
    }
  }

  const handleEquipmentUpdate = async (equipmentData) => {
    try {
      await characterAPI.update(character.id, equipmentData)
      setEditedCharacter(prev => ({ ...prev, ...equipmentData }))
      setSuccess('✅ Equipamiento actualizado')
    } catch (e) {
      console.error('Error updating equipment:', e)
      setError(e?.response?.data?.detail || 'Error al actualizar equipamiento')
    }
  }

  const hpPercent = Math.max(0, (editedCharacter.hp_current / editedCharacter.hp_max) * 100)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
        border: '1px solid rgba(217,83,30,0.3)',
        borderRadius: 16,
        maxWidth: '700px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(217,83,30,0.1), rgba(59,130,246,0.1))',
          borderBottom: '1px solid rgba(217,83,30,0.2)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '1.8rem',
              color: '#fbbf24',
              margin: 0,
              marginBottom: '0.5rem',
            }}>
              {editedCharacter.name}
            </h2>
            <p style={{
              color: 'rgba(226,209,166,0.7)',
              margin: 0,
              fontSize: '0.95rem',
            }}>
              {editedCharacter.race} • {editedCharacter.class_} • Nivel {editedCharacter.level}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(226,209,166,0.6)',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0.5rem',
            }}
          >
            <X size={32} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(217,83,30,0.2)',
          background: 'rgba(26,26,26,0.4)',
          overflowX: 'auto',
        }}>
          {['main', 'stats', 'notes'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === tab ? 'rgba(217,83,30,0.6)' : 'transparent',
                border: activeTab === tab ? '1px solid rgba(217,83,30,0.6)' : '1px solid rgba(217,83,30,0.2)',
                borderRadius: 8,
                color: activeTab === tab ? '#fff' : 'rgba(226,209,166,0.6)',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 400,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab === 'main' ? 'Principal' : tab === 'stats' ? 'Características' : 'Apuntes'}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            margin: '1rem 2rem 0',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '1rem',
            color: '#fca5a5',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            margin: '1rem 2rem 0',
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12,
            padding: '1rem',
            color: '#86efac',
            fontSize: '0.9rem',
          }}>
            {success}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {activeTab === 'main' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Nivel */}
              <div>
                <h3 style={{
                  color: 'rgba(226,209,166,0.8)',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                  margin: '0 0 1rem 0',
                }}>
                  Nivel
                </h3>
                <div style={{
                  background: 'rgba(217,83,30,0.15)',
                  border: '1px solid rgba(217,83,30,0.3)',
                  borderRadius: 12,
                  padding: '1.5rem',
                  textAlign: 'center',
                }}>
                  <p style={{
                    color: '#fbbf24',
                    fontSize: '2.5rem',
                    margin: '0 0 1rem 0',
                    fontWeight: 900,
                    fontFamily: 'Cinzel, serif',
                  }}>
                    {editedCharacter.level}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleLevelChange(-1)}
                      disabled={editedCharacter.level <= 1 || loading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: editedCharacter.level > 1 ? 'rgba(217,83,30,0.6)' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: 6,
                        color: editedCharacter.level > 1 ? '#fff' : 'rgba(226,209,166,0.3)',
                        cursor: editedCharacter.level > 1 ? 'pointer' : 'not-allowed',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                      }}
                    >
                      <ChevronDown size={18} />
                    </button>
                    <button
                      onClick={() => handleLevelChange(1)}
                      disabled={editedCharacter.level >= 20 || loading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: editedCharacter.level < 20 ? 'rgba(217,83,30,0.6)' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: 6,
                        color: editedCharacter.level < 20 ? '#fff' : 'rgba(226,209,166,0.3)',
                        cursor: editedCharacter.level < 20 ? 'pointer' : 'not-allowed',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                      }}
                    >
                      <ChevronUp size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* HP */}
              <div>
                <h3 style={{
                  color: 'rgba(226,209,166,0.8)',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                  margin: '0 0 1rem 0',
                }}>
                  Salud
                </h3>
                <div style={{
                  background: 'rgba(217,83,30,0.15)',
                  border: '1px solid rgba(217,83,30,0.3)',
                  borderRadius: 12,
                  padding: '1.5rem',
                }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                      type="number"
                      value={editedCharacter.hp_current}
                      onChange={e => handleHPChange(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        padding: '0.75rem',
                        color: '#fbbf24',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    />
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.1)',
                      textAlign: 'center',
                      minWidth: '80px',
                    }}>
                      <p style={{ color: 'rgba(226,209,166,0.6)', fontSize: '0.75rem', margin: 0 }}>Máx</p>
                      <p style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>
                        {editedCharacter.hp_max}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    height: '12px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid rgba(217,83,30,0.2)',
                  }}>
                    <div style={{
                      height: '100%',
                      background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444',
                      width: `${hpPercent}%`,
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>

              {/* Stats Base */}
              <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                <h3 style={{
                  color: 'rgba(226,209,166,0.8)',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                  margin: '0 0 1rem 0',
                }}>
                  Otras Estadísticas
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {[
                    { label: 'Prof.', value: editedCharacter.proficiency_bonus },
                    { label: 'AC', value: editedCharacter.armor_class || 10 },
                    { label: 'Iniciativa', value: editedCharacter.initiative || 0 },
                    { label: 'Velocidad', value: editedCharacter.speed || 30 },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      background: 'rgba(217,83,30,0.15)',
                      border: '1px solid rgba(217,83,30,0.3)',
                      borderRadius: 12,
                      padding: '1rem',
                      textAlign: 'center',
                    }}>
                      <p style={{
                        color: 'rgba(226,209,166,0.6)',
                        fontSize: '0.7rem',
                        margin: '0 0 0.5rem 0',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}>
                        {stat.label}
                      </p>
                      <p style={{
                        color: '#fbbf24',
                        fontSize: '1.5rem',
                        margin: 0,
                        fontWeight: 900,
                        fontFamily: 'Cinzel, serif',
                      }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 style={{
                color: 'rgba(226,209,166,0.8)',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '1.5rem',
              }}>
                Características (Modifica libremente)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(stat => {
                  const value = editedCharacter.stats?.[stat] || 10
                  const modifier = getModifier(value)
                  const labels = {
                    strength: 'FUE',
                    dexterity: 'DES',
                    constitution: 'CON',
                    intelligence: 'INT',
                    wisdom: 'SAB',
                    charisma: 'CAR',
                  }
                  return (
                    <div key={stat} style={{
                      background: 'rgba(217,83,30,0.15)',
                      border: '1px solid rgba(217,83,30,0.3)',
                      borderRadius: 12,
                      padding: '1.5rem',
                      textAlign: 'center',
                    }}>
                      <p style={{
                        color: 'rgba(226,209,166,0.6)',
                        fontSize: '0.7rem',
                        margin: '0 0 0.5rem 0',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {labels[stat]}
                      </p>
                      <input
                        type="number"
                        value={value}
                        onChange={e => handleStatChange(stat, parseInt(e.target.value) || 10)}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 6,
                          padding: '0.75rem',
                          color: '#fbbf24',
                          fontSize: '1.4rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          marginBottom: '0.75rem',
                          boxSizing: 'border-box',
                        }}
                        min="3"
                        max="20"
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <button
                          onClick={() => handleStatIncrement(stat, -1)}
                          disabled={value <= 3}
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            background: value > 3 ? 'rgba(217,83,30,0.6)' : 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: 4,
                            color: value > 3 ? '#fff' : 'rgba(226,209,166,0.3)',
                            cursor: value > 3 ? 'pointer' : 'not-allowed',
                            fontSize: '1rem',
                            fontWeight: 700,
                            transition: 'all 0.2s',
                          }}
                        >
                          −
                        </button>
                        <button
                          onClick={() => handleStatIncrement(stat, 1)}
                          disabled={value >= 20}
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            background: value < 20 ? 'rgba(217,83,30,0.6)' : 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: 4,
                            color: value < 20 ? '#fff' : 'rgba(226,209,166,0.3)',
                            cursor: value < 20 ? 'pointer' : 'not-allowed',
                            fontSize: '1rem',
                            fontWeight: 700,
                            transition: 'all 0.2s',
                          }}
                        >
                          +
                        </button>
                      </div>
                      <p style={{
                        color: modifier >= 0 ? '#86efac' : '#fca5a5',
                        fontSize: '0.85rem',
                        margin: 0,
                        fontWeight: 700,
                      }}>
                        {getModifierString(modifier)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  color: 'rgba(226,209,166,0.8)',
                  marginBottom: '0.5rem',
                  marginTop: 0,
                  fontSize: '0.95rem',
                }}>
                  Rasgos de Personalidad
                </h4>
                <textarea
                  value={editedCharacter.personality_traits || ''}
                  onChange={e => setEditedCharacter(prev => ({ ...prev, personality_traits: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '1rem',
                    color: 'rgba(226,209,166,0.8)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Describe los rasgos de personalidad..."
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  color: 'rgba(226,209,166,0.8)',
                  marginBottom: '0.5rem',
                  fontSize: '0.95rem',
                }}>
                  Ideales
                </h4>
                <textarea
                  value={editedCharacter.ideals || ''}
                  onChange={e => setEditedCharacter(prev => ({ ...prev, ideals: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '1rem',
                    color: 'rgba(226,209,166,0.8)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Los ideales del personaje..."
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  color: 'rgba(226,209,166,0.8)',
                  marginBottom: '0.5rem',
                  fontSize: '0.95rem',
                }}>
                  Defectos
                </h4>
                <textarea
                  value={editedCharacter.flaws || ''}
                  onChange={e => setEditedCharacter(prev => ({ ...prev, flaws: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '1rem',
                    color: 'rgba(226,209,166,0.8)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Los defectos del personaje..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {!editedCharacter.is_alive && (
          <div style={{
            margin: '0 2rem 1rem',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '1rem',
            color: '#fca5a5',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertCircle size={16} /> 💀 Este personaje está muerto
          </div>
        )}

        {/* History Section (GM only) */}
        {isGM && (
          <div style={{
            margin: '0 2rem 1rem',
            background: 'rgba(217,83,30,0.1)',
            border: '1px solid rgba(217,83,30,0.2)',
            borderRadius: 12,
            padding: '1rem',
          }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                color: 'rgba(226,209,166,0.6)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                padding: 0,
                paddingBottom: '0.5rem',
                borderBottom: '1px solid rgba(217,83,30,0.2)',
                marginBottom: '0.75rem',
              }}
            >
              {showHistory ? '▼' : '▶'} Histórico ({history.length})
            </button>

            {showHistory && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                {history && history.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {history.map((entry, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(217,83,30,0.1)',
                        borderRadius: 6,
                        padding: '0.5rem',
                        color: 'rgba(226,209,166,0.8)',
                      }}>
                        <div style={{ fontWeight: 600, color: '#fbbf24' }}>
                          {entry.change_type === 'DIED' && '💀 MUERTO'}
                          {entry.change_type === 'REVIVED' && '✨ REVIVIDO'}
                          {entry.change_type === 'LEVEL_UP' && '📈 NIVEL'}
                          {entry.change_type === 'HP_CHANGE' && '❤️ HP'}
                          {entry.change_type === 'STATUS_CHANGE' && '⚡ STATUS'}
                          {entry.change_type === 'STAT_CHANGE' && '📊 STAT'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(226,209,166,0.5)', marginTop: '0.25rem' }}>
                          {entry.description}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'rgba(226,209,166,0.4)', textAlign: 'center', padding: '1rem' }}>
                    Sin cambios registrados
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '2rem',
          borderTop: '1px solid rgba(217,83,30,0.2)',
          background: 'rgba(26,26,26,0.4)',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setShowEquipment(true)}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '0.75rem',
              background: 'rgba(59,130,246,0.8)',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            <Backpack size={18} /> Equipamiento
          </button>

          {isGM && (
            <button
              onClick={editedCharacter.is_alive ? handleMarkDead : handleRevive}
              disabled={loading}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.75rem',
                background: editedCharacter.is_alive ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)',
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
            >
              <Skull size={18} /> {editedCharacter.is_alive ? 'Difunto' : 'Revivir'}
            </button>
          )}

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(226,209,166,0.8)',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            Cerrar
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '0.75rem',
              background: loading ? 'rgba(217,83,30,0.4)' : 'rgba(217,83,30,0.8)',
              border: '1px solid rgba(217,83,30,0.6)',
              color: '#fff',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {/* Equipment Modal */}
        {showEquipment && (
          <EquipmentModal
            character={editedCharacter}
            onClose={() => setShowEquipment(false)}
            onUpdate={handleEquipmentUpdate}
          />
        )}
      </div>
    </div>
  )
}

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { X, Edit2, Save, Trash2, Sword, Shield, Book, Sparkles, User as UserIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import './CharacterSheet5e.css'
import { normalizeCharacter } from '../../utils/normalizeCharacter'
import AbilityScores     from './AbilityScores'
import SavingThrows      from './SavingThrows'
import SkillList         from './SkillList'
import CombatStats       from './CombatStats'
import AttacksTable      from './AttacksTable'
import EquipmentPanel    from './EquipmentPanel'
import PersonalityPanel  from './PersonalityPanel'
import FeaturesPanel     from './FeaturesPanel'
import BackstoryPanel    from './BackstoryPanel'
import SpellcastingPanel from './SpellcastingPanel'
import EncyclopediaDetailPanel from './EncyclopediaDetailPanel'
import spellsData from '../../data/encyclopedia/spells.json'
import equipmentData from '../../data/encyclopedia/equipment.json'
import traitsData from '../../data/encyclopedia/traits.json'

/* ── Header bar ────────────────────────────────────────────── */
/* ── Header bar ────────────────────────────────────────────── */
function SheetHeader({ character, onClose, isGM, mode, isEditing, onToggleEdit, onSave, onCancel, onEdit, isSaving }) {
  const classDisplay = [
    character.class_,
    character.subclass,
  ].filter(Boolean).join(' — ')

  const alignmentMap = {
    'lawful-good': 'Lawful Good', 'neutral-good': 'Neutral Good',
    'chaotic-good': 'Chaotic Good', 'lawful-neutral': 'Lawful Neutral',
    'true-neutral': 'True Neutral', 'chaotic-neutral': 'Chaotic Neutral',
    'lawful-evil': 'Lawful Evil', 'neutral-evil': 'Neutral Evil',
    'chaotic-evil': 'Chaotic Evil',
  }
  const alignment = alignmentMap[character.alignment] ?? character.alignment ?? '—'

  const xpDisplay = character.experience_points != null
    ? `${character.experience_points.toLocaleString()} XP`
    : null

  return (
    <div className="cs-header">
      {/* Avatar */}
      <div className="cs-avatar">
        {character.image_url
          ? <img src={character.image_url} alt={character.name} />
          : (character.name?.[0]?.toUpperCase() ?? '?')}
      </div>

      {/* Identity */}
      <div className="cs-identity">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <input 
              type="text" 
              className="cs-identity__name-input" 
              value={character.name || ''} 
              onChange={(e) => onEdit({ name: e.target.value })}
              placeholder="Nombre del personaje"
              disabled={isSaving}
            />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--cs-text-dim)' }}>Lvl</span>
              <input 
                type="number" 
                className="cs-combat-input" 
                style={{ width: '2.5rem' }}
                value={character.level || 1} 
                onChange={(e) => onEdit({ level: parseInt(e.target.value) || 1 })}
                disabled={isSaving}
              />
              <input 
                type="text" 
                className="cs-identity__class-input" 
                value={character.class_ || ''} 
                onChange={(e) => onEdit({ class_: e.target.value })}
                placeholder="Clase"
                disabled={isSaving}
              />
              <input 
                type="text" 
                className="cs-identity__class-input" 
                value={character.race || ''} 
                onChange={(e) => onEdit({ race: e.target.value })}
                placeholder="Raza"
                disabled={isSaving}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="cs-identity__name">{character.name || 'Unnamed Character'}</div>
            <div className="cs-identity__class">
              Lvl {character.level} {classDisplay} · {character.race}
            </div>
          </>
        )}
        
        <div className="cs-identity__meta">
          {(character.background || isEditing) && (
            <div className="cs-meta-item">
              <span className="cs-meta-item__label">Background</span>
              {isEditing ? (
                <input 
                  type="text" 
                  className="cs-identity__meta-input" 
                  value={character.background || ''} 
                  onChange={(e) => onEdit({ background: e.target.value })}
                  disabled={isSaving}
                />
              ) : (
                <span className="cs-meta-item__value">{character.background}</span>
              )}
            </div>
          )}
          <div className="cs-meta-item">
            <span className="cs-meta-item__label">Alignment</span>
            {isEditing ? (
              <select 
                className="cs-identity__meta-input"
                style={{ background: 'var(--cs-surface-2)', color: 'var(--cs-text-muted)' }}
                value={character.alignment || ''}
                onChange={(e) => onEdit({ alignment: e.target.value })}
                disabled={isSaving}
              >
                <option value="">None</option>
                {Object.keys(alignmentMap).map(k => <option key={k} value={k}>{alignmentMap[k]}</option>)}
              </select>
            ) : (
              <span className="cs-meta-item__value">{alignment}</span>
            )}
          </div>
          {(xpDisplay || isEditing) && (
            <div className="cs-meta-item">
              <span className="cs-meta-item__label">Experience</span>
              {isEditing ? (
                <input 
                  type="number" 
                  className="cs-identity__meta-input" 
                  value={character.experience_points || 0} 
                  onChange={(e) => onEdit({ experience_points: parseInt(e.target.value) || 0 })}
                  disabled={isSaving}
                />
              ) : (
                <span className="cs-meta-item__value">{xpDisplay}</span>
              )}
            </div>
          )}
          {character.player_name && (
            <div className="cs-meta-item">
              <span className="cs-meta-item__label">Player</span>
              <span className="cs-meta-item__value">{character.player_name}</span>
            </div>
          )}
          {!character.is_alive && !isEditing && (
            <div className="cs-meta-item">
              <span className="cs-meta-item__value" style={{ color: '#e05252' }}>💀 Dead</span>
            </div>
          )}
          {isEditing && (
            <div className="cs-meta-item">
              <span className="cs-meta-item__label">Status</span>
              <button 
                onClick={() => onEdit({ is_alive: !character.is_alive })}
                disabled={isSaving}
                style={{ 
                  background: 'none', border: '1px solid var(--cs-border)', 
                  borderRadius: '4px', color: character.is_alive ? '#4ade80' : '#ef4444',
                  fontSize: '0.7rem', padding: '0.1rem 0.4rem', cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.5 : 1
                }}
              >
                {character.is_alive ? 'VIVO' : 'MUERTO'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="cs-header__controls">
        {isEditing ? (
          <>
            <button className="cs-btn cs-btn--cancel" onClick={onCancel} title="Cancelar cambios" disabled={isSaving}>
              <X size={18} />
              <span className="cs-btn__text">Cancelar</span>
            </button>
            <button 
              className={`cs-btn cs-btn--save ${isSaving ? 'loading' : ''}`} 
              onClick={onSave} 
              title="Guardar cambios"
              disabled={isSaving}
            >
              {isSaving ? <div className="cs-spinner" /> : <Save size={18} />}
              <span className="cs-btn__text">{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </>
        ) : (
          <button className="cs-btn cs-btn--edit" onClick={onToggleEdit} title="Editar personaje">
            <Edit2 size={18} />
            <span className="cs-btn__text">Editar</span>
          </button>
        )}
        
        {!isEditing && (
          <button className="cs-close" onClick={onClose} title="Cerrar">
            <X size={22} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Main CharacterSheet5e ─────────────────────────────────── */
export default function CharacterSheet5e({
  character: rawCharacter,
  campaignId,
  onClose,
  onUpdate,   // kept for future interactivity phase
  isGM,
  mode = 'modal',
}) {
  const isMobile = useMediaQuery('(max-width: 850px)')
  const [activeTab, setActiveTab] = useState('stats')
  const initialCharacter = useMemo(() => normalizeCharacter(rawCharacter), [rawCharacter])
  const [character, setCharacter] = useState(initialCharacter)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const sheetTabs = [
    { id: 'stats', label: 'Stats', icon: <UserIcon size={16} /> },
    { id: 'combat', label: 'Combate', icon: <Sword size={16} /> },
    { id: 'features', label: 'Rasgos', icon: <Sparkles size={16} /> },
    { id: 'spells', label: 'Hechizos', icon: <Book size={16} /> },
  ]

  // Update local state when prop changes (but only if not editing)
  useEffect(() => {
    if (!isEditing) {
      setCharacter(normalizeCharacter(rawCharacter))
    }
  }, [rawCharacter, isEditing])

  const handleEdit = useCallback((changes) => {
    setCharacter(prev => ({ ...prev, ...changes }))
  }, [])

  const handleCancel = useCallback(() => {
    setCharacter(normalizeCharacter(rawCharacter))
    setIsEditing(false)
  }, [rawCharacter])

  const handleSave = async () => {
    if (onUpdate) {
      setIsSaving(true)
      try {
        await onUpdate(character)
        setIsEditing(false)
      } catch (e) {
        console.error('Error al guardar:', e)
        alert('Error al guardar los cambios. Por favor revisa la consola.')
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsEditing(false)
    }
  }
  
  // State for encyclopedia detail panel
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedType, setSelectedType] = useState(null)

  if (!character) return null

  // Function to search encyclopedia items by name and type
  const findEncyclopediaItem = useCallback((itemName, type) => {
    if (!itemName || !type) return null
    
    const searchName = itemName.toLowerCase().trim()
    
    let data = []
    switch (type) {
      case 'spell':
        data = spellsData
        break
      case 'equipment':
        data = equipmentData
        break
      case 'trait':
        data = traitsData
        break
      default:
        return null
    }
    
    // Search by exact name first (case-insensitive)
    let result = data.find(item => item.name.toLowerCase() === searchName)
    
    // If not found, try partial match
    if (!result) {
      result = data.find(item => item.name.toLowerCase().includes(searchName))
    }
    
    return result || null
  }, [])

  // Callback from panels when item is selected
  const handleSelectItem = useCallback((itemName, type) => {
    const item = findEncyclopediaItem(itemName, type)
    if (item) {
      setSelectedItem(item)
      setSelectedType(type)
    }
  }, [findEncyclopediaItem])

  // Close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedItem(null)
    setSelectedType(null)
  }, [])

  const isModal = mode === 'modal'

  const content = (
    <div
      className={`cs-root cs-container${isModal ? '' : ' cs-container--split'}`}
    >
      {/* Header */}
      <SheetHeader 
        character={character} 
        onClose={onClose} 
        isGM={isGM} 
        mode={mode} 
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onSave={handleSave}
        onCancel={handleCancel}
        onEdit={handleEdit}
        isSaving={isSaving}
      />

      {/* Mobile Tabs */}
      {isMobile && (
        <div className="cs-mobile-tabs">
          {sheetTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cs-mobile-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="activeSheetTab" className="cs-mobile-tab-indicator" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable body */}
      <div className="cs-body">
        {/* Grid with detail panel */}
        <div style={{ display: 'grid', gridTemplateColumns: (selectedItem && !isMobile) ? '1fr 380px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          <AnimatePresence mode="wait">
            {(!isMobile || activeTab !== 'spells') && (
              <motion.div 
                key={isMobile ? activeTab : 'desktop-grid'}
                initial={isMobile ? { opacity: 0, x: 20 } : {}}
                animate={isMobile ? { opacity: 1, x: 0 } : {}}
                exit={isMobile ? { opacity: 0, x: -20 } : {}}
                transition={{ duration: 0.2 }}
                className="cs-grid"
              >

                {/* ── COL LEFT: Stats / Saves / Skills ── */}
                {(!isMobile || activeTab === 'stats') && (
                  <div className="cs-col">
                    <AbilityScores character={character} isEditing={isEditing} onEdit={handleEdit} />
                    <SavingThrows  character={character} isEditing={isEditing} onEdit={handleEdit} />
                    <SkillList     character={character} isEditing={isEditing} onEdit={handleEdit} />
                  </div>
                )}

                {/* ── COL CENTER: Combat / Attacks / Equipment ── */}
                {(!isMobile || activeTab === 'combat') && (
                  <div className="cs-col">
                    <div className="cs-section">
                      <div className="cs-section__header">Combat</div>
                      <div className="cs-section__body">
                        <CombatStats character={character} isEditing={isEditing} onEdit={handleEdit} />
                      </div>
                    </div>

                    <AttacksTable   character={character} isEditing={isEditing} onEdit={handleEdit} />
                    <EquipmentPanel character={character} onSelectItem={handleSelectItem} isEditing={isEditing} onEdit={handleEdit} />
                  </div>
                )}

                {/* ── COL RIGHT: Personality / Features / Backstory ── */}
                {(!isMobile || activeTab === 'features') && (
                  <div className="cs-col">
                    <PersonalityPanel character={character} isEditing={isEditing} onEdit={handleEdit} />
                    <FeaturesPanel    character={character} onSelectItem={handleSelectItem} isEditing={isEditing} onEdit={handleEdit} />
                    <BackstoryPanel   character={character} isEditing={isEditing} onEdit={handleEdit} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detail Panel - Right side (Desktop only or floating in mobile) */}
          {selectedItem && selectedType && (
            <div className={isMobile ? 'cs-detail-floating' : 'cs-detail-sticky'}>
              <EncyclopediaDetailPanel
                item={selectedItem}
                type={selectedType}
                onClose={handleCloseDetail}
              />
            </div>
          )}
        </div>

        {/* Spellcasting — full width below grid on desktop, or its own tab on mobile */}
        {(!isMobile || activeTab === 'spells') && (
          <motion.div
            initial={isMobile ? { opacity: 0, y: 20 } : {}}
            animate={isMobile ? { opacity: 1, y: 0 } : {}}
            className="cs-spells-container"
          >
            <SpellcastingPanel character={character} onSelectItem={handleSelectItem} isEditing={isEditing} onEdit={handleEdit} />
          </motion.div>
        )}
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="cs-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.() }}>
        {content}
      </div>
    )
  }

  return content
}

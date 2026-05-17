import React from 'react'
import { getSavingThrowValue, formatModifier } from '../../utils/normalizeCharacter'

const SAVES = [
  { key: 'strength',     label: 'Strength' },
  { key: 'dexterity',    label: 'Dexterity' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'wisdom',       label: 'Wisdom' },
  { key: 'charisma',     label: 'Charisma' },
]

export default function SavingThrows({ character, isEditing, onEdit }) {
  const toggleProficiency = (key) => {
    const newSaves = { ...(character.saving_throws || {}) }
    newSaves[key] = {
      ...newSaves[key],
      proficient: !newSaves[key]?.proficient
    }
    onEdit({ saving_throws: newSaves })
  }

  return (
    <div className="cs-section">
      <div className="cs-section__header">Saving Throws</div>
      <div className="cs-section__body" style={{ padding: '0.5rem 0.75rem' }}>
        {SAVES.map(({ key, label }) => {
          const isProficient = character.saving_throws?.[key]?.proficient ?? false
          const val = getSavingThrowValue(character, key)
          return (
            <div 
              key={key} 
              className={`cs-prof-row ${isEditing ? 'editable' : ''}`}
              onClick={() => isEditing && toggleProficiency(key)}
              style={{ cursor: isEditing ? 'pointer' : 'default' }}
            >
              <span className={`cs-prof-dot${isProficient ? ' cs-prof-dot--prof' : ''}`} />
              <span className="cs-prof-row__name">{label}</span>
              <span className="cs-prof-row__val">{formatModifier(val)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

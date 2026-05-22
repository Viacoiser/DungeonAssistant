import React from 'react'
import { getAbilityModifier, formatModifier } from '../../utils/normalizeCharacter'

const STAT_LABELS = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
}
const STATS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

export default function AbilityScores({ character, isEditing, onEdit }) {
  const profBonus = character.proficiency_bonus ?? 2

  const handleStatChange = (stat, value) => {
    const newStats = { ...(character.stats || {}) }
    newStats[stat] = parseInt(value) || 0
    onEdit({ stats: newStats })
  }

  const handleProfChange = (value) => {
    onEdit({ proficiency_bonus: parseInt(value) || 0 })
  }

  return (
    <>
      <div className="cs-section">
        <div className="cs-section__header">Ability Scores</div>
        <div className="cs-section__body">
          <div className="cs-stats-grid">
            {STATS.map(stat => {
              const score = character.stats?.[stat] ?? 10
              const mod = getAbilityModifier(score)
              return (
                <div key={stat} className="cs-stat-box">
                  <div className="cs-stat-box__label">{STAT_LABELS[stat]}</div>
                  {isEditing ? (
                    <input
                      type="number"
                      className="cs-stat-input"
                      value={score}
                      onChange={(e) => handleStatChange(stat, e.target.value)}
                    />
                  ) : (
                    <div className="cs-stat-box__value">{score}</div>
                  )}
                  <div className="cs-stat-box__mod">{formatModifier(mod)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="cs-prof-bonus">
        <div className="cs-prof-bonus__label">Proficiency Bonus</div>
        {isEditing ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.2rem' }}>
            <input
              type="number"
              className="cs-stat-input"
              style={{ width: '3rem', fontSize: '1rem' }}
              value={profBonus}
              onChange={(e) => handleProfChange(e.target.value)}
            />
          </div>
        ) : (
          <div className="cs-prof-bonus__value">{formatModifier(profBonus)}</div>
        )}
      </div>

      {(character.inspiration || isEditing) && (
        <div 
          className={`cs-inspiration ${character.inspiration ? 'active' : ''} ${isEditing ? 'editable' : ''}`}
          onClick={() => isEditing && onEdit({ inspiration: !character.inspiration })}
          style={{ cursor: isEditing ? 'pointer' : 'default', opacity: !character.inspiration && isEditing ? 0.4 : 1 }}
        >
          ✦ Inspiration
        </div>
      )}
    </>
  )
}

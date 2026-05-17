import React from 'react'
import { getSkillValue, formatModifier, SKILL_STAT_MAP, getPassivePerception } from '../../utils/normalizeCharacter'

const SKILL_LABELS = {
  acrobatics: 'Acrobatics', animal_handling: 'Animal Handling', arcana: 'Arcana',
  athletics: 'Athletics', deception: 'Deception', history: 'History',
  insight: 'Insight', intimidation: 'Intimidation', investigation: 'Investigation',
  medicine: 'Medicine', nature: 'Nature', perception: 'Perception',
  performance: 'Performance', persuasion: 'Persuasion', religion: 'Religion',
  sleight_of_hand: 'Sleight of Hand', stealth: 'Stealth', survival: 'Survival',
}

const STAT_ABBR = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
}

export default function SkillList({ character, isEditing, onEdit }) {
  const passivePerc = getPassivePerception(character)

  const cycleSkill = (skill) => {
    const newSkills = { ...(character.skills || {}) }
    const current = newSkills[skill] || {}
    
    if (!current.proficient) {
      newSkills[skill] = { ...current, proficient: true, expertise: false }
    } else if (!current.expertise) {
      newSkills[skill] = { ...current, proficient: true, expertise: true }
    } else {
      newSkills[skill] = { ...current, proficient: false, expertise: false }
    }
    
    onEdit({ skills: newSkills })
  }

  return (
    <>
      <div className="cs-section">
        <div className="cs-section__header">Skills</div>
        <div className="cs-section__body" style={{ padding: '0.5rem 0.75rem' }}>
          {Object.keys(SKILL_LABELS).map(skill => {
            const data = character.skills?.[skill] ?? {}
            const isProficient = data.proficient ?? false
            const isExpert = data.expertise ?? false
            const val = getSkillValue(character, skill)
            const stat = SKILL_STAT_MAP[skill]
            return (
              <div 
                key={skill} 
                className={`cs-prof-row ${isEditing ? 'editable' : ''}`}
                onClick={() => isEditing && cycleSkill(skill)}
                style={{ cursor: isEditing ? 'pointer' : 'default' }}
              >
                <span className={`cs-prof-dot${isExpert ? ' cs-prof-dot--expert' : isProficient ? ' cs-prof-dot--prof' : ''}`} />
                <span className="cs-prof-row__name">{SKILL_LABELS[skill]}</span>
                <span className="cs-prof-row__stat">{STAT_ABBR[stat]}</span>
                <span className="cs-prof-row__val">{formatModifier(val)}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="cs-passive">
        <span className="cs-passive__label">Passive Perception</span>
        <span className="cs-passive__value">{passivePerc}</span>
      </div>
    </>
  )
}

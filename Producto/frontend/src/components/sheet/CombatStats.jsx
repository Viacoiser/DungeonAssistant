import React from 'react'
import { formatModifier } from '../../utils/normalizeCharacter'

function DeathCircle({ type, filled, onClick }) {
  return (
    <span
      className={`cs-death-circle cs-death-circle--${type}${filled ? ' filled' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={`${type === 'success' ? 'Success' : 'Failure'}${filled ? ' (marked)' : ''}`}
    />
  )
}

export default function CombatStats({ character, isEditing, onEdit }) {
  const hpPercent = Math.max(0, Math.min(100, (character.hp_current / (character.hp_max || 1)) * 100))
  const hpColor   = hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444'

  const successes = character.death_saves?.successes ?? 0
  const failures  = character.death_saves?.failures  ?? 0

  // Parse hit dice: "1d8" → "d8", or just "d8" → "d8"
  const hitDiceDisplay = (character.hit_dice ?? '1d8').replace(/^\d+/, '')
  const hitDiceUsed    = character.hit_dice_used ?? 0
  const hitDiceTotal   = character.level ?? 1

  const updateDeathSaves = (type, count) => {
    onEdit({
      death_saves: {
        ...character.death_saves,
        [type]: count
      }
    })
  }

  return (
    <>
      {/* AC / Initiative / Speed */}
      <div className="cs-combat-row">
        <div className="cs-combat-box">
          <div className="cs-combat-box__label">Armor Class</div>
          {isEditing ? (
            <input 
              type="number" 
              className="cs-combat-input" 
              value={character.armor_class ?? 10} 
              onChange={(e) => onEdit({ armor_class: parseInt(e.target.value) || 0 })}
            />
          ) : (
            <div className="cs-combat-box__value">{character.armor_class ?? 10}</div>
          )}
        </div>
        <div className="cs-combat-box">
          <div className="cs-combat-box__label">Initiative</div>
          {isEditing ? (
            <input 
              type="number" 
              className="cs-combat-input" 
              value={character.initiative ?? 0} 
              onChange={(e) => onEdit({ initiative: parseInt(e.target.value) || 0 })}
            />
          ) : (
            <div className="cs-combat-box__value">{formatModifier(character.initiative ?? 0)}</div>
          )}
        </div>
        <div className="cs-combat-box">
          <div className="cs-combat-box__label">Speed</div>
          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input 
                type="number" 
                className="cs-combat-input" 
                style={{ width: '3rem' }}
                value={character.speed ?? 30} 
                onChange={(e) => onEdit({ speed: parseInt(e.target.value) || 0 })}
              />
              <span style={{ fontSize: '0.6rem', color: 'var(--cs-text-dim)' }}>ft</span>
            </div>
          ) : (
            <div className="cs-combat-box__value">{character.speed ?? 30}<span style={{ fontSize: '0.6rem', color: 'var(--cs-text-dim)' }}>ft</span></div>
          )}
        </div>
      </div>

      {/* HP */}
      <div className="cs-hp">
        <div className="cs-hp__label">Hit Points</div>
        <div className="cs-hp__values">
          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="number" 
                className="cs-hp-input" 
                value={character.hp_current ?? 0} 
                onChange={(e) => onEdit({ hp_current: parseInt(e.target.value) || 0 })}
              />
              <span className="cs-hp__sep">/</span>
              <input 
                type="number" 
                className="cs-hp-input cs-hp-input--max" 
                value={character.hp_max ?? 1} 
                onChange={(e) => onEdit({ hp_max: parseInt(e.target.value) || 0 })}
              />
            </div>
          ) : (
            <>
              <span className="cs-hp__current">{character.hp_current ?? 0}</span>
              <span className="cs-hp__sep">/</span>
              <span className="cs-hp__max">{character.hp_max ?? 1}</span>
            </>
          )}
        </div>
        <div className="cs-hp__bar-wrap">
          <div className="cs-hp__bar" style={{ width: `${hpPercent}%`, background: hpColor }} />
        </div>
      </div>

      {/* Temp HP + Hit Dice */}
      <div className="cs-hp-aux">
        <div className="cs-mini-box">
          <div className="cs-mini-box__label">Temp HP</div>
          {isEditing ? (
            <input 
              type="number" 
              className="cs-combat-input" 
              value={character.hp_temporary ?? 0} 
              onChange={(e) => onEdit({ hp_temporary: parseInt(e.target.value) || 0 })}
            />
          ) : (
            <div className="cs-mini-box__value">{character.hp_temporary ?? 0}</div>
          )}
        </div>
        <div className="cs-mini-box">
          <div className="cs-mini-box__label">Hit Dice</div>
          <div className="cs-mini-box__value">
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                 <input 
                  type="number" 
                  className="cs-combat-input" 
                  style={{ width: '2.5rem' }}
                  value={hitDiceTotal - hitDiceUsed} 
                  onChange={(e) => onEdit({ hit_dice_used: hitDiceTotal - (parseInt(e.target.value) || 0) })}
                />
                <span>{hitDiceDisplay}</span>
              </div>
            ) : (
              <>
                {hitDiceTotal - hitDiceUsed}{hitDiceDisplay}
                {hitDiceUsed > 0 && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--cs-text-dim)', marginLeft: '0.2rem' }}>
                    ({hitDiceUsed} used)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Death Saves */}
      <div className="cs-death">
        <div className="cs-death__label">Death Saves</div>
        <div className="cs-death__row">
          <div className="cs-death__group">
            <span className="cs-death__group-label">Successes</span>
            <div className="cs-death__circles">
              {[1,2,3].map(i => (
                <DeathCircle 
                  key={i} 
                  type="success" 
                  filled={i <= successes} 
                  onClick={isEditing ? () => updateDeathSaves('successes', i === successes ? i - 1 : i) : null}
                />
              ))}
            </div>
          </div>
          <div className="cs-death__group">
            <span className="cs-death__group-label">Failures</span>
            <div className="cs-death__circles">
              {[1,2,3].map(i => (
                <DeathCircle 
                  key={i} 
                  type="failure" 
                  filled={i <= failures} 
                  onClick={isEditing ? () => updateDeathSaves('failures', i === failures ? i - 1 : i) : null}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import React from 'react'
import { getProficiencyBonus, getAbilityModifier, formatModifier } from '../../utils/normalizeCharacter'

const ABILITY_ABBR = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
}

export default function SpellcastingPanel({ character, onSelectItem, isEditing, onEdit }) {
  const sc       = character.spellcasting ?? {}
  const slots    = sc.slots  ?? {}
  const cantrips = sc.cantrips ?? []
  const spells   = sc.spells   ?? []

  const hasSpells  = cantrips.length > 0 || spells.length > 0
  const hasAnySlot = Object.values(slots).some(s => s.total > 0)
  const hasContent = sc.class || hasAnySlot || hasSpells || isEditing

  const abilityKey  = sc.ability?.toLowerCase() ?? null
  const abilityMod  = abilityKey ? getAbilityModifier(character.stats?.[abilityKey] ?? 10) : null
  const prof        = getProficiencyBonus(character.level ?? 1)
  const saveDC      = sc.save_dc || (abilityMod !== null ? 8 + prof + abilityMod : '—')
  const atkBonus    = sc.attack_bonus || (abilityMod !== null ? prof + abilityMod : '—')

  const handleSelectSpell = (spellName) => {
    if (onSelectItem) {
      onSelectItem(spellName, 'spell')
    }
  }

  const updateSc = (changes) => {
    onEdit({
      spellcasting: {
        ...sc,
        ...changes
      }
    })
  }

  const updateSlots = (lvl, field, val) => {
    const newSlots = { ...slots }
    newSlots[lvl] = { ...(newSlots[lvl] || { total: 0, used: 0 }), [field]: parseInt(val) || 0 }
    updateSc({ slots: newSlots })
  }

  return (
    <div className="cs-spells-section">
      <div className="cs-spells-section__header">Spellcasting</div>

      {!hasContent ? (
        <div className="cs-empty-text">No spellcasting information</div>
      ) : (
        <>
          {/* Spellcasting info row */}
          <div className="cs-spell-info">
            <div className="cs-mini-box">
              <div className="cs-mini-box__label">Class</div>
              {isEditing ? (
                <input 
                  type="text" 
                  className="cs-combat-input" 
                  style={{ width: '100%', fontSize: '0.8rem' }}
                  value={sc.class || ''} 
                  onChange={(e) => updateSc({ class: e.target.value })}
                />
              ) : (
                <div className="cs-mini-box__value" style={{ fontSize: '0.85rem' }}>
                  {sc.class || '—'}
                </div>
              )}
            </div>
            <div className="cs-mini-box">
              <div className="cs-mini-box__label">Ability</div>
              {isEditing ? (
                <select 
                  className="cs-combat-input" 
                  style={{ width: '100%', fontSize: '0.8rem', background: 'var(--cs-surface-3)' }}
                  value={abilityKey || ''} 
                  onChange={(e) => updateSc({ ability: e.target.value })}
                >
                  <option value="">None</option>
                  {Object.entries(ABILITY_ABBR).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              ) : (
                <div className="cs-mini-box__value" style={{ fontSize: '0.85rem' }}>
                  {abilityKey ? ABILITY_ABBR[abilityKey] ?? sc.ability : '—'}
                </div>
              )}
            </div>
            <div className="cs-mini-box">
              <div className="cs-mini-box__label">Save DC</div>
              {isEditing ? (
                <input 
                  type="number" 
                  className="cs-combat-input" 
                  value={sc.save_dc || (typeof saveDC === 'number' ? saveDC : '')} 
                  onChange={(e) => updateSc({ save_dc: parseInt(e.target.value) || 0 })}
                />
              ) : (
                <div className="cs-mini-box__value">{saveDC}</div>
              )}
            </div>
            <div className="cs-mini-box">
              <div className="cs-mini-box__label">Atk Bonus</div>
              {isEditing ? (
                <input 
                  type="text" 
                  className="cs-combat-input" 
                  value={sc.attack_bonus || (typeof atkBonus === 'number' ? formatModifier(atkBonus) : '')} 
                  onChange={(e) => updateSc({ attack_bonus: e.target.value })}
                />
              ) : (
                <div className="cs-mini-box__value">
                  {typeof atkBonus === 'number' ? formatModifier(atkBonus) : atkBonus}
                </div>
              )}
            </div>
          </div>

          {/* Spell slots by level */}
          {(hasAnySlot || isEditing) && (
            <>
              <div style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cs-text-dim)', marginBottom: '0.4rem' }}>
                Spell Slots
              </div>
              <div className="cs-spell-slots-grid">
                {Array.from({ length: 9 }, (_, i) => String(i + 1)).map(lvl => {
                  const s    = slots[lvl] ?? { total: 0, used: 0 }
                  const isEmpty = s.total === 0 && !isEditing
                  return (
                    <div key={lvl} className={`cs-slot-col${isEmpty ? ' cs-slot-col--empty' : ''}`}>
                      <div className="cs-slot-col__level">Lvl {lvl}</div>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                          <input 
                            type="number" 
                            className="cs-stat-input" 
                            style={{ fontSize: '0.75rem', width: '2rem' }}
                            value={s.total} 
                            onChange={(e) => updateSlots(lvl, 'total', e.target.value)}
                          />
                          <input 
                            type="number" 
                            className="cs-stat-input" 
                            style={{ fontSize: '0.75rem', width: '2rem', opacity: 0.7 }}
                            value={s.used} 
                            onChange={(e) => updateSlots(lvl, 'used', e.target.value)}
                            placeholder="Used"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="cs-slot-col__used">{s.total - s.used}</div>
                          <div className="cs-slot-col__total">/{s.total}</div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Cantrips & Spells List (Simple textarea for editing lists for now) */}
          {isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div className="cs-field__label">Cantrips (one per line)</div>
                <textarea 
                  className="cs-textarea" 
                  value={(cantrips || []).map(c => typeof c === 'string' ? c : c.name).join('\n')}
                  onChange={(e) => updateSc({ cantrips: e.target.value.split('\n') })}
                  rows={6}
                />
              </div>
              <div>
                <div className="cs-field__label">Spells (one per line)</div>
                <textarea 
                  className="cs-textarea" 
                  value={(spells || []).map(s => typeof s === 'string' ? s : s.name).join('\n')}
                  onChange={(e) => updateSc({ spells: e.target.value.split('\n') })}
                  rows={6}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Cantrips */}
              {cantrips.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div className="cs-field__label" style={{ marginBottom: '0.4rem' }}>Cantrips</div>
                  <div className="cs-spell-list">
                    {cantrips.map((c, i) => {
                      const name = typeof c === 'string' ? c : c.name
                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectSpell(name)}
                          className="cs-spell-tag"
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Prepared spells */}
              {spells.length > 0 && (
                <div>
                  <div className="cs-field__label" style={{ marginBottom: '0.4rem' }}>Spells</div>
                  <div className="cs-spell-list">
                    {spells.map((s, i) => {
                      const name     = typeof s === 'string' ? s : s.name
                      const prepared = typeof s === 'object' ? s.prepared : false
                      const level    = typeof s === 'object' ? s.level : null
                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectSpell(name)}
                          className={`cs-spell-tag${prepared ? ' cs-spell-tag--prepared' : ''}`}
                        >
                          {level ? `(${level}) ` : ''}{name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

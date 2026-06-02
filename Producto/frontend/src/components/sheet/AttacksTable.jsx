import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function AttacksTable({ character, isEditing, onEdit }) {
  const attacks = character.attacks ?? []

  const updateAttack = (index, field, value) => {
    const newAttacks = [...attacks]
    newAttacks[index] = { ...newAttacks[index], [field]: value }
    onEdit({ attacks: newAttacks })
  }

  const addAttack = () => {
    onEdit({ 
      attacks: [...attacks, { name: 'New Attack', attack_bonus: '+0', damage: '1d4', damage_type: 'physical' }] 
    })
  }

  const removeAttack = (index) => {
    const newAttacks = attacks.filter((_, i) => i !== index)
    onEdit({ attacks: newAttacks })
  }

  return (
    <div className="cs-section">
      <div className="cs-section__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Attacks &amp; Spellcasting</span>
        {isEditing && (
          <button 
            onClick={addAttack}
            style={{ 
              background: 'none', border: 'none', color: 'var(--cs-gold)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' 
            }}
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>
      <div className="cs-section__body" style={{ padding: '0.5rem' }}>
        <table className="cs-attacks-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Atk Bonus</th>
              <th>Damage / Type</th>
              {isEditing && <th></th>}
            </tr>
          </thead>
          <tbody>
            {attacks.map((atk, i) => (
              <tr key={i}>
                <td>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="cs-textarea" 
                      style={{ padding: '0.2rem', fontSize: '0.7rem' }}
                      value={atk.name || ''} 
                      onChange={(e) => updateAttack(i, 'name', e.target.value)}
                    />
                  ) : (
                    atk.name || <span className="cs-empty">—</span>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="cs-textarea" 
                      style={{ padding: '0.2rem', fontSize: '0.7rem', width: '3rem' }}
                      value={atk.attack_bonus || ''} 
                      onChange={(e) => updateAttack(i, 'attack_bonus', e.target.value)}
                    />
                  ) : (
                    atk.attack_bonus || '—'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <input 
                        type="text" 
                        className="cs-textarea" 
                        style={{ padding: '0.2rem', fontSize: '0.7rem' }}
                        placeholder="Damage"
                        value={atk.damage || ''} 
                        onChange={(e) => updateAttack(i, 'damage', e.target.value)}
                      />
                      <input 
                        type="text" 
                        className="cs-textarea" 
                        style={{ padding: '0.2rem', fontSize: '0.7rem' }}
                        placeholder="Type"
                        value={atk.damage_type || ''} 
                        onChange={(e) => updateAttack(i, 'damage_type', e.target.value)}
                      />
                    </div>
                  ) : (
                    atk.damage
                      ? `${atk.damage}${atk.damage_type ? ` ${atk.damage_type}` : ''}`
                      : <span className="cs-empty">—</span>
                  )}
                </td>
                {isEditing && (
                  <td>
                    <button 
                      onClick={() => removeAttack(i)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {attacks.length === 0 && !isEditing && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--cs-text-dim)', fontStyle: 'italic' }}>
                  No attacks
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import React from 'react'

function TextField({ label, value, onChange, isEditing, placeholder = 'Not set' }) {
  return (
    <div className="cs-field">
      <div className="cs-field__label">{label}</div>
      {isEditing ? (
        <textarea
          className="cs-textarea"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
        />
      ) : (
        <>
          {value
            ? <div className="cs-field__text">{value}</div>
            : <div className="cs-field__text--empty">{placeholder}</div>}
        </>
      )}
    </div>
  )
}

export default function BackstoryPanel({ character, isEditing, onEdit }) {
  const allies = character.allies_organizations ?? {}
  const alliesText = allies.text || ''

  const physicalLabels = {
    age: 'Age',
    height: 'Height',
    weight: 'Weight',
    eyes: 'Eyes',
    skin: 'Skin',
    hair: 'Hair'
  }

  const physicalFields = Object.keys(physicalLabels).map(key => ({
    key,
    label: physicalLabels[key],
    value: character[key]
  }))

  const hasPhysical = physicalFields.some(f => f.value)

  return (
    <>
      <div className="cs-section">
        <div className="cs-section__header">Backstory</div>
        <div className="cs-section__body">
          <TextField
            label="Character Backstory"
            value={character.backstory}
            onChange={(v) => onEdit({ backstory: v })}
            isEditing={isEditing}
            placeholder="No backstory written yet"
          />
        </div>
      </div>

      <div className="cs-section">
        <div className="cs-section__header">Allies &amp; Organizations</div>
        <div className="cs-section__body">
          <TextField
            label="Allies &amp; Organizations"
            value={alliesText}
            onChange={(v) => onEdit({ allies_organizations: { ...allies, text: v } })}
            isEditing={isEditing}
            placeholder="No allies or organizations noted"
          />
        </div>
      </div>

      <div className="cs-section">
        <div className="cs-section__header">Physical Appearance</div>
        <div className="cs-section__body">
          {(hasPhysical || isEditing) && (
            <div className="cs-appearance-grid" style={{ marginBottom: '0.6rem' }}>
              {physicalFields.map(({ key, label, value }) => (
                <div key={key} className="cs-appearance-item">
                  <div className="cs-appearance-item__label">{label}</div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="cs-combat-input" 
                      style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                      value={value || ''} 
                      onChange={(e) => onEdit({ [key]: e.target.value })}
                    />
                  ) : (
                    value && <div className="cs-appearance-item__value">{value}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <TextField
            label="Physical Description"
            value={character.appearance}
            onChange={(v) => onEdit({ appearance: v })}
            isEditing={isEditing}
            placeholder="No appearance described"
          />
        </div>
      </div>
    </>
  )
}

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
          rows={3}
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

export default function PersonalityPanel({ character, isEditing, onEdit }) {
  return (
    <div className="cs-section">
      <div className="cs-section__header">Personality</div>
      <div className="cs-section__body">
        <TextField 
          label="Personality Traits" 
          value={character.personality_traits} 
          onChange={(v) => onEdit({ personality_traits: v })}
          isEditing={isEditing}
          placeholder="No personality traits" 
        />
        <TextField 
          label="Ideals" 
          value={character.ideals} 
          onChange={(v) => onEdit({ ideals: v })}
          isEditing={isEditing}
          placeholder="No ideals" 
        />
        <TextField 
          label="Bonds" 
          value={character.bonds} 
          onChange={(v) => onEdit({ bonds: v })}
          isEditing={isEditing}
          placeholder="No bonds" 
        />
        <TextField 
          label="Flaws" 
          value={character.flaws} 
          onChange={(v) => onEdit({ flaws: v })}
          isEditing={isEditing}
          placeholder="No flaws" 
        />
      </div>
    </div>
  )
}

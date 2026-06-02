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

export default function FeaturesPanel({ character, onSelectItem, isEditing, onEdit }) {
  const features = character.features_traits || ''
  
  // Try to parse as JSON array (if stored that way)
  let featuresList = []
  try {
    const parsed = JSON.parse(features)
    if (Array.isArray(parsed)) {
      featuresList = parsed
    }
  } catch {
    // If not JSON, treat as plain text
    if (features && typeof features === 'string') {
      featuresList = features.split('\n').filter(f => f.trim().length > 0).map(f => ({ name: f.trim() }))
    }
  }

  const handleClickFeature = (featureName) => {
    if (onSelectItem) {
      onSelectItem(featureName, 'trait')
    }
  }

  return (
    <div className="cs-section">
      <div className="cs-section__header">Features, Traits &amp; Languages</div>
      <div className="cs-section__body">
        {/* Features & Traits */}
        <div className="cs-field">
          <div className="cs-field__label">Features &amp; Traits</div>
          {isEditing ? (
            <textarea
              className="cs-textarea"
              placeholder="Enter features (one per line)"
              value={typeof features === 'string' ? features : JSON.stringify(featuresList.map(f => typeof f === 'string' ? f : f.name), null, 2)}
              onChange={(e) => onEdit({ features_traits: e.target.value })}
              rows={6}
            />
          ) : (
            <>
              {featuresList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {featuresList.map((feature, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleClickFeature(typeof feature === 'string' ? feature : feature.name)}
                      className="cs-feature-btn"
                      style={{
                        textAlign: 'left',
                        background: 'rgba(217,83,30,0.08)',
                        border: '1px solid rgba(217,83,30,0.2)',
                        borderRadius: 6,
                        padding: '0.5rem 0.75rem',
                        color: 'var(--fantasy-gold)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {typeof feature === 'string' ? feature : feature.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="cs-field__text--empty">No features or traits listed</div>
              )}
            </>
          )}
        </div>

        {/* Proficiencies */}
        <TextField
          label="Other Proficiencies &amp; Languages"
          value={character.other_proficiencies}
          onChange={(v) => onEdit({ other_proficiencies: v })}
          isEditing={isEditing}
          placeholder="No proficiencies or languages listed"
        />

        {/* Additional Features */}
        {(character.additional_features || isEditing) && (
          <TextField
            label="Additional Features"
            value={character.additional_features}
            onChange={(v) => onEdit({ additional_features: v })}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  )
}

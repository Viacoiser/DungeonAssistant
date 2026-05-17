import React from 'react'

const COIN_COLORS = {
  cp: '#b87333', sp: '#c0c0c0', ep: '#b0c4de', gp: '#ffd700', pp: '#e5e4e2',
}

export default function EquipmentPanel({ character, onSelectItem, isEditing, onEdit }) {
  const currency  = character.currency  ?? {}
  const equipment = character.equipment ?? ''
  const treasure  = character.treasure  ?? ''

  // Try to parse JSON equipment (from CharacterForm's item picker)
  let parsedEquipment = []
  try {
    const parsed = JSON.parse(equipment)
    if (Array.isArray(parsed) && parsed.length > 0) {
      parsedEquipment = parsed
    }
  } catch { /* plain text, keep as-is */ }

  const hasEquipmentItems = parsedEquipment.length > 0

  const handleClickItem = (itemName) => {
    if (onSelectItem) {
      onSelectItem(itemName, 'equipment')
    }
  }

  const handleCurrencyChange = (coin, val) => {
    onEdit({
      currency: {
        ...currency,
        [coin]: parseInt(val) || 0
      }
    })
  }

  return (
    <div className="cs-section">
      <div className="cs-section__header">Equipment &amp; Treasure</div>
      <div className="cs-section__body">
        {/* Currency */}
        <div className="cs-currency" style={{ marginBottom: '0.75rem' }}>
          {['cp','sp','ep','gp','pp'].map(coin => (
            <div key={coin} className="cs-coin" style={{ borderColor: `${COIN_COLORS[coin]}44` }}>
              <div className="cs-coin__type" style={{ color: COIN_COLORS[coin] }}>{coin.toUpperCase()}</div>
              {isEditing ? (
                <input 
                  type="number" 
                  className="cs-stat-input" 
                  style={{ width: '100%', fontSize: '0.9rem', marginTop: '0.2rem' }}
                  value={currency[coin] ?? 0}
                  onChange={(e) => handleCurrencyChange(coin, e.target.value)}
                />
              ) : (
                <div className="cs-coin__val">{currency[coin] ?? 0}</div>
              )}
            </div>
          ))}
        </div>

        {/* Equipment list */}
        <div className="cs-field">
          <div className="cs-field__label">Equipment</div>
          {isEditing ? (
            <textarea
              className="cs-textarea"
              placeholder="Enter equipment (one per line)"
              value={typeof equipment === 'string' ? equipment : JSON.stringify(parsedEquipment.map(i => `${i.quantity > 1 ? i.quantity + 'x ' : ''}${i.name}`), null, 2)}
              onChange={(e) => onEdit({ equipment: e.target.value })}
              rows={6}
            />
          ) : (
            <>
              {hasEquipmentItems ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {parsedEquipment.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleClickItem(item.name)}
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
                      {item.quantity && item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="cs-field__text--empty">No equipment listed</span>
              )}
            </>
          )}
        </div>

        {/* Treasure */}
        <div className="cs-field">
          <div className="cs-field__label">Treasure</div>
          {isEditing ? (
            <textarea
              className="cs-textarea"
              placeholder="List gems, art, etc."
              value={treasure}
              onChange={(e) => onEdit({ treasure: e.target.value })}
              rows={3}
            />
          ) : (
            treasure ? <div className="cs-field__text">{treasure}</div> : <div className="cs-field__text--empty">No treasure noted</div>
          )}
        </div>
      </div>
    </div>
  )
}

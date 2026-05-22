import React from 'react'

export default function CharacterListItem({ char, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(26,26,26,0.65)',
        backdropFilter: 'blur(16px)',
        border: selected 
          ? '1px solid rgba(217,83,30,0.4)' 
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '0.75rem',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: selected 
          ? '0 12px 40px rgba(217,83,30,0.18)' 
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.75rem',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'rgba(217,83,30,0.15)',
          border: '1px solid rgba(217,83,30,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Almendra, serif',
          fontSize: '1.1rem',
          fontWeight: 900,
          color: '#fbbf24',
          textShadow: '0 0 10px rgba(217,83,30,0.5)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {char.image_url ? (
            <img 
              src={char.image_url} 
              alt={char.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            char.name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            color: selected ? '#ffffff' : '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
            margin: 0,
            fontFamily: 'Almendra, serif',
          }}>
            {char.name}
          </div>
          <div style={{
            fontSize: '0.65rem',
            color: 'rgba(226,209,166,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: 0,
          }}>
            Nivel {char.level} • {char.race} • <span style={{ color: '#f87171', fontWeight: 900 }}>{char.hp_current}/{char.hp_max}</span> HP
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '0.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.4rem',
      }}>
        {/* Row 1 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#ccccc9',
            fontWeight: 700,
            fontFamily: 'monospace',
          }}>
            {char.armor_class || 10}
          </div>
          <div style={{
            fontSize: '0.55rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(226,209,166,0.5)',
          }}>Armor Class</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#60a5fa',
            fontWeight: 700,
            fontFamily: 'monospace',
            marginBottom: 3,
          }}>
            {char.initiative !== undefined ? (char.initiative >= 0 ? '+' : '') + char.initiative : '+0'}
          </div>
          <div style={{
            fontSize: '0.55rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(226,209,166,0.5)',
          }}>Initiative</div>
        </div>

        {/* Row 2 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#22c55e',
            fontWeight: 700,
            fontFamily: 'monospace',
            marginBottom: 3,
          }}>
            {char.speed || 30}
          </div>
          <div style={{
            fontSize: '0.55rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(226,209,166,0.5)',
          }}>Speed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#8324ef',
            fontWeight: 700,
            fontFamily: 'monospace',
            marginBottom: 3,
          }}>
            {char.passive_perception || 10}
          </div>
          <div style={{
            fontSize: '0.55rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(226,209,166,0.5)',
          }}>P.Perception</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#ffb700',
            fontWeight: 700,
            fontFamily: 'monospace',
            marginBottom: 3,
          }}>
            +{char.proficiency_bonus || 2}
          </div>
          <div style={{
            fontSize: '0.55rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(226,209,166,0.5)',
          }}>P. Bonus</div>
        </div>

        {/* Row 3 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#f87171',
            fontWeight: 700,
            fontFamily: 'monospace',
            marginBottom: 3,
          }}>
            d{char.hit_dice_size || 6}
          </div>
          <div style={{
            fontSize: '0.55rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(226,209,166,0.5)',
          }}>Hit Dice</div>
        </div>
      </div>
    </button>
  )
}

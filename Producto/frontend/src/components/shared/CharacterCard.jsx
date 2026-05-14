import React, { useState } from 'react'

export default function CharacterCard({ character, onSelect, index }) {
  const [hovered, setHovered] = useState(false)

  const getAvatarContent = () => {
    return character.name ? character.name[0].toUpperCase() : '?'
  }

  const hpPercent = Math.max(0, (character.hp_current / character.hp_max) * 100)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        background: 'rgba(26,26,26,0.65)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${hovered ? 'rgba(217,83,30,0.4)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 40px rgba(217,83,30,0.18)' : '0 4px 20px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
        animation: `fadeInUp 0.4s ease ${index * 0.08}s forwards`,
        opacity: 0,
      }}
    >
      {/* Header: Avatar + Nombre Centered */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(217,83,30,0.15)',
          border: '2px solid rgba(217,83,30,0.4)',
          boxShadow: '0 0 15px rgba(217,83,30,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Almendra, serif', fontSize: '2.5rem', fontWeight: 500,
          color: '#fbbf24',
          textShadow: '0 0 10px rgba(217,83,30,0.5)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {character.image_url ? (
            <img
              src={character.image_url}
              alt={character.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            getAvatarContent()
          )}
        </div>
        <div>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '0.65rem', fontWeight: 700, fontFamily: 'Cinzel, serif',
            color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.15em',
            background: 'rgba(217,83,30,0.15)', border: '1px solid rgba(217,83,30,0.4)',
            padding: '0.2rem 0.6rem', borderRadius: 20, marginBottom: '0.6rem',
            boxShadow: '0 0 10px rgba(217,83,30,0.2)'
          }}>
            Nivel {character.level}
          </div>
          <h3 style={{
            fontFamily: 'Almendra, serif',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: hovered ? 'var(--fantasy-gold)' : '#fff',
            margin: '0 0 0.2rem 0',
            transition: 'color 0.2s',
            wordBreak: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            maxHeight: '3em',
          }}>
            {character.name.length > 25 ? character.name.substring(0, 25) + '...' : character.name}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'rgba(226,209,166,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            {character.race} {character.class}
          </p>
        </div>
      </div>

      {/* HP Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(226,209,166,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>HP</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#f87171', fontFamily: 'monospace' }}>
            {character.hp_current} / {character.hp_max}
          </div>
        </div>
        {/* HP Bar */}
        <div style={{
          height: '6px',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid rgba(169, 21, 21, 0.2)',
        }}>
          <div style={{
            height: '100%',
            background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444',
            width: `${hpPercent}%`,
            transition: 'width 0.3s ease, background 0.3s ease',
          }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {/* Row 1 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ccccc9', fontFamily: 'monospace', marginBottom: '0.01rem' }}>
            {character.armor_class || 10}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(226,209,166,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Armor Class
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace', marginBottom: '0.01rem' }}>
            {character.initiative !== undefined ? (character.initiative >= 0 ? '+' : '') + character.initiative : '+0'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(226,209,166,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Initiative
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#22c55e', fontFamily: 'monospace', marginBottom: '0.01rem' }}>
            {character.speed || 30}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(226,209,166,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Speed
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#8324ef', fontFamily: 'monospace', marginBottom: '0.01rem' }}>
            {character.passive_perception || 10}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(226,209,166,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Passive Perception
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffb700', fontFamily: 'monospace', marginBottom: '0.01rem' }}>
            +{character.proficiency_bonus || 2}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(226,209,166,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Proficiency Bonus
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f87171', fontFamily: 'monospace', marginBottom: '0.01rem' }}>
            {character.hit_dice_count || 1}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(226,209,166,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hit Dice (d{character.hit_dice_size || 6})
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

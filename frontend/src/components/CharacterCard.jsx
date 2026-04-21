import React, { useState } from 'react'
import { Clock } from 'lucide-react'

export default function CharacterCard({ character, onSelect, index }) {
  const [hovered, setHovered] = useState(false)

  const getAvatarContent = () => {
    return character.name ? character.name[0].toUpperCase() : '?'
  }

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
        gap: '1rem',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 50, height: 50, borderRadius: 12,
          background: 'rgba(217,83,30,0.15)',
          border: '1px solid rgba(217,83,30,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Cinzel, serif', fontSize: '1.5rem', fontWeight: 900,
          color: 'var(--fantasy-gold)',
          textShadow: '0 0 10px rgba(217,83,30,0.5)',
        }}>
          {getAvatarContent()}
        </div>
        <div>
          <h3 style={{
            fontFamily: 'Almendra, serif',
            fontSize: '1.25rem', fontWeight: 700,
            color: hovered ? 'var(--fantasy-gold)' : '#fff',
            margin: 0, transition: 'color 0.2s',
          }}>
            {character.name}
          </h3>
          <p style={{ fontSize: '0.7rem', color: 'rgba(226,209,166,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Nivel {character.level} • {character.race} {character.class}
          </p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.3)', marginBottom: 4 }}>Vida</div>
          <div style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>
            {character.hp_current} / {character.hp_max} HP
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.3)', marginBottom: 4 }}>Defensa</div>
          <div style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700, fontFamily: 'monospace' }}>
            {character.armor_class} AC
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'rgba(226,209,166,0.45)', marginTop: '0.5rem' }}>
        <Clock size={12} />
        <span>Actualizado hace poco</span>
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

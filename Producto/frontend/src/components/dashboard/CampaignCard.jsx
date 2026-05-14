import React, { useState } from 'react'
import { Crown, Users, Clock } from 'lucide-react'

export default function CampaignCard({ campaign, isGM, onEnter, index, loading }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(26,26,26,0.65)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${hovered
          ? isGM ? 'rgba(217,119,6,0.5)' : 'rgba(217,83,30,0.4)'
          : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        cursor: 'default',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered
          ? isGM ? '0 12px 40px rgba(217,119,6,0.18)' : '0 12px 40px rgba(217,83,30,0.18)'
          : '0 4px 20px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
        animation: `fadeInUp 0.4s ease ${index * 0.08}s forwards`,
        opacity: 0,
      }}
    >
      {/* Decorative glow */}
      <div style={{
        position: 'absolute', right: -24, top: -24,
        width: 100, height: 100,
        background: isGM ? 'rgba(217,119,6,0.07)' : 'rgba(217,83,30,0.06)',
        borderRadius: '50%',
        filter: 'blur(24px)',
        transition: 'opacity 0.3s',
        opacity: hovered ? 1 : 0,
      }} />

      {/* Title + role */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
          fontSize: '0.65rem', fontWeight: 700, 
          fontFamily: 'Cinzel, serif',
          color: isGM ? '#fbbf24' : '#ff8a65', 
          textTransform: 'uppercase', letterSpacing: '0.15em',
          background: isGM ? 'rgba(217,119,6,0.15)' : 'rgba(217,83,30,0.15)',
          border: `1px solid ${isGM ? 'rgba(217,119,6,0.4)' : 'rgba(217,83,30,0.4)'}`,
          padding: '0.2rem 0.6rem', borderRadius: 20,
          boxShadow: isGM ? '0 0 10px rgba(217,119,6,0.2)' : '0 0 10px rgba(217,83,30,0.2)'
        }}>
          {isGM ? <Crown size={12} /> : <Users size={12} />}
          <span>{isGM ? 'Dungeon Master' : 'Jugador'}</span>
        </div>

        <h3 style={{
          fontFamily: 'Almendra, serif',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: hovered ? 'var(--fantasy-gold)' : '#fff',
          margin: 0,
          transition: 'color 0.2s',
          wordBreak: 'break-word',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          maxHeight: '3em',
        }}>
          {campaign.name.length > 30 ? campaign.name.substring(0, 30) + '...' : campaign.name}
        </h3>
      </div>

      <p style={{
        fontFamily: 'Almendra, serif',
        color: 'rgba(226,209,166,0.65)',
        fontSize: '0.95rem',
        margin: '0 auto',
        lineHeight: 1.5,
        textAlign: 'center',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        minHeight: 45,
      }}>
        {campaign.description || 'Una campaña sin descripción aguarda por ti...'}
      </p>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.3)', marginBottom: 4 }}>Estado</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '0.75rem', color: 'rgba(226,209,166,0.65)' }}>
            <Clock size={11} />
            <span>Activa</span>
          </div>
        </div>
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)' }}></div>
        <div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.3)', marginBottom: 4 }}>Código</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(226,209,166,0.65)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            {campaign.invite_code || '—'}
          </div>
        </div>
      </div>

      <button
        onClick={onEnter}
        disabled={loading}
        style={{
          fontFamily: 'Almendra, serif',
          width: '100%',
          background: loading
            ? 'rgba(255,255,255,0.05)'
            : isGM
              ? 'linear-gradient(135deg, #664c1cff, #c9873cff), var(--fantasy-gold)'
              : 'linear-gradient(135deg, rgba(182, 78, 37, 0.8), var(--fantasy-accent))',
          color: loading ? 'rgba(226,209,166,0.4)' : '#fff',
          border: loading ? '1px solid rgba(255,255,255,0.08)' : 'none',
          borderRadius: 12,
          padding: '0.7rem',
          fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          transition: 'all 0.25s',
          boxShadow: loading ? 'none' : isGM ? '0 4px 16px rgba(217,119,6,0.25)' : '0 5px 16px var(--fantasy-accent-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1' }}
      >
        {loading ? (
          <>
            <svg
              width={18} height={18}
              viewBox="0 0 100 100"
              style={{ animation: 'spin 1.4s linear infinite', flexShrink: 0 }}
              fill="none"
            >
              <path d="M 50 8 A 42 42 0 1 1 18 68" stroke="var(--fantasy-gold)" strokeWidth="10" strokeLinecap="round" opacity="0.7" />
              <circle cx="50" cy="50" r="9" fill="var(--fantasy-gold)" opacity="0.7" />
            </svg>
            Entrando...
          </>
        ) : (
          isGM ? 'Gestionar Campaña' : 'Entrar a Campaña'
        )}
      </button>
    </div>
  )
}

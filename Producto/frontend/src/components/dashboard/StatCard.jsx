import React from 'react'

export default function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: '1.25rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.35rem',
      transition: 'all 0.2s ease',
    }}>
      <span style={{
        fontSize: '0.65rem',
        color: 'rgba(226,209,166,0.35)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
        textAlign: 'center'
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'Cinzel, serif',
        fontSize: '1.75rem',
        fontWeight: 900,
        color: accent ? 'var(--fantasy-accent)' : 'var(--fantasy-gold)',
        textShadow: accent ? '0 0 15px rgba(217,83,30,0.3)' : '0 0 15px rgba(226,209,166,0.1)',
        lineHeight: 1,
      }}>
        {value}
      </span>
    </div>
  )
}

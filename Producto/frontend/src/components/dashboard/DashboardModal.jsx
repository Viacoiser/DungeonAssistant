import React from 'react'

export default function DashboardModal({ onClose, title, children }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
        backdropFilter: 'blur(6px)',
        padding: '1rem',
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, #181818, #0d0d0d)',
        border: '1px solid rgba(217,83,30,0.25)',
        borderRadius: 22,
        padding: '2rem',
        width: '100%',
        maxWidth: 600,
        maxHeight: '85vh',
        overflowY: 'auto',
        animation: 'fadeInScale 0.22s ease forwards',
        boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 0 40px rgba(217,83,30,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'linear-gradient(160deg, #181818, #0d0d0d)', zIndex: 10 }}>
          <h2 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(226,209,166,0.4)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 4, borderRadius: 6, transition: 'color 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--fantasy-gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(226,209,166,0.4)'}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

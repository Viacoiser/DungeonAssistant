import React from 'react'
import { ChevronLeft } from 'lucide-react'
import CharacterForm from '../shared/CharacterForm'

export default function CreateCharacterView({ onBack, onSubmit, loading, error }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'transparent',
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.75rem',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <button
          onClick={onBack}
          title="Volver"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(226,209,166,0.55)',
            cursor: 'pointer', transition: 'all 0.18s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'var(--fantasy-gold)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = 'rgba(226,209,166,0.55)'
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ flex: 1 }}>
          <h2 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '1.25rem', fontWeight: 700,
            color: '#fff', margin: 0,
          }}>
            Crear Nuevo Personaje
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(226,209,166,0.4)', margin: '0.15rem 0 0' }}>
            Define las estadísticas y el trasfondo de tu héroe
          </p>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.75rem' }} className="custom-scrollbar">
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '1rem', color: '#fca5a5', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}
          <CharacterForm onSubmit={onSubmit} loading={loading} />
        </div>
      </div>
    </div>
  )
}

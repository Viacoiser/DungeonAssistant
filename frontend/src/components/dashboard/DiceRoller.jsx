import React, { useState } from 'react'

export default function DiceRoller() {
  const [result, setResult] = useState(null)
  const [lastDie, setLastDie] = useState(null)
  const [rolling, setRolling] = useState(false)
  const dice = [4, 6, 8, 10, 12, 20, 100]

  const roll = (sides) => {
    setRolling(true)
    setLastDie(sides)
    setTimeout(() => {
      setResult(Math.floor(Math.random() * sides) + 1)
      setRolling(false)
    }, 350)
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 0' }}>
      <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: '#fff', marginBottom: '0.5rem' }}>🎲 Lanzador de Dados</h2>
      <p style={{ color: 'rgba(226,209,166,0.4)', marginBottom: '2rem', fontSize: '0.9rem' }}>Selecciona un dado para lanzar.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
        {dice.map(d => (
          <button
            key={d}
            onClick={() => roll(d)}
            style={{
              background: lastDie === d ? 'rgba(217,83,30,0.25)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${lastDie === d ? 'rgba(217,83,30,0.6)' : 'rgba(255,255,255,0.1)'}`,
              color: lastDie === d ? 'var(--fantasy-accent)' : 'var(--fantasy-gold)',
              borderRadius: 12, padding: '0.75rem 1.1rem',
              fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer', transition: 'all 0.18s',
              minWidth: 60, textAlign: 'center',
            }}
          >
            d{d}
          </button>
        ))}
      </div>
      {result !== null && (
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.25s ease' }}>
          <p style={{ color: 'rgba(226,209,166,0.45)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
            {rolling ? 'Lanzando...' : `Resultado — d${lastDie}`}
          </p>
          <span style={{
            fontFamily: 'Cinzel, serif',
            fontSize: rolling ? '3rem' : '5rem',
            fontWeight: 900,
            color: result === lastDie ? '#fbbf24' : result === 1 ? '#f87171' : 'var(--fantasy-gold)',
            textShadow: result === lastDie ? '0 0 30px rgba(251,191,36,0.5)' : result === 1 ? '0 0 30px rgba(248,113,113,0.4)' : '0 0 20px rgba(217,83,30,0.3)',
            transition: 'all 0.35s ease',
            display: 'block',
            lineHeight: 1,
          }}>
            {rolling ? '•••' : result}
          </span>
          {!rolling && result === lastDie && <p style={{ color: '#fbbf24', marginTop: '0.5rem', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>✨ CRÍTICO!</p>}
          {!rolling && result === 1 && <p style={{ color: '#f87171', marginTop: '0.5rem', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>💥 Pifia!</p>}
        </div>
      )}
    </div>
  )
}

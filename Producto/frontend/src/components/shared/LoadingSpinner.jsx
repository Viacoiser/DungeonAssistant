import React from 'react'

/**
 * LoadingSpinner — Símbolo ouroboros (anillo + punto) rotando al centro.
 * Basado en el símbolo compartido por el usuario: trazo circular con punto.
 * @param {number}  size     — Tamaño en px (default 64)
 * @param {string}  text     — Texto opcional debajo
 * @param {boolean} fullPage — Si true, ocupa h-screen con fondo fantasy
 * @param {string}  color    — Color del símbolo (default fantasy-gold)
 */
export default function LoadingSpinner({
  size = 64,
  text,
  fullPage = false,
  color = 'var(--fantasy-gold)',
  padding = '3rem 0',
}) {
  const wrapperStyle = fullPage
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--fantasy-bg)',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: padding,
      }

  return (
    <div style={wrapperStyle}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ animation: 'spin 1.4s linear infinite' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Trazo circular exterior (abierto, tipo ouroboros/pincelada) */}
        <path
          d="
            M 50 8
            A 42 42 0 1 1 18 68
          "
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        {/* Punto sólido interior */}
        <circle cx="50" cy="50" r="9" fill={color} opacity="0.9" />
      </svg>

      {text && (
        <p style={{
          marginTop: '1.25rem',
          color: 'rgba(226,209,166,0.5)',
          fontFamily: 'Cinzel, serif',
          fontSize: '0.8rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          {text}
        </p>
      )}
    </div>
  )
}

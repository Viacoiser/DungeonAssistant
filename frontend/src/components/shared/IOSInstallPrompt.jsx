import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share, Plus } from 'lucide-react'

/**
 * IOSInstallPrompt
 *
 * Muestra un banner de instalación únicamente cuando:
 *  1. El usuario está en iOS/iPadOS + Safari
 *  2. La app NO está corriendo en modo standalone (no instalada aún)
 *  3. El usuario no ha cerrado el banner antes (localStorage)
 *
 * En Android Chrome el navegador ya muestra su propio prompt nativo.
 */

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPad OS 13+ reporta userAgent de Mac desktop
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

const DISMISSED_KEY = 'pwa_ios_prompt_dismissed'
// Mostrar el banner de nuevo si han pasado más de 7 días desde que lo cerró
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000

export default function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIOS() || isInStandaloneMode()) return

    const stored = localStorage.getItem(DISMISSED_KEY)
    if (stored) {
      const dismissedAt = parseInt(stored, 10)
      if (Date.now() - dismissedAt < DISMISS_TTL_MS) return
    }

    // Delay de 3 segundos para no interrumpir la carga inicial
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom) + 80px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 2rem)',
            maxWidth: '420px',
            zIndex: 9999,
            // Glassmorphism oscuro acorde al estilo de la app
            background: 'linear-gradient(135deg, rgba(13,11,8,0.96) 0%, rgba(30,18,10,0.98) 100%)',
            border: '1px solid rgba(217,83,30,0.35)',
            borderRadius: '16px',
            boxShadow: '0 0 0 1px rgba(217,83,30,0.1), 0 8px 40px rgba(0,0,0,0.7), 0 0 30px rgba(217,83,30,0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '1rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* App icon mini */}
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
                border: '1px solid rgba(217,83,30,0.4)',
                boxShadow: '0 0 12px rgba(217,83,30,0.25)',
              }}>
                <img src="/app-icon.png" alt="DungeonAssistant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#e2d1a6',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}>
                  Instala DungeonAssistant
                </p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(226,209,166,0.5)', marginTop: '0.1rem' }}>
                  Acceso rápido desde tu pantalla de inicio
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              aria-label="Cerrar"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(226,209,166,0.5)',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(217,83,30,0.15)' }} />

          {/* Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <Step number={1} icon={<Share size={14} />} color="#d9531e">
              Toca el botón{' '}
              <span style={{ fontWeight: 700, color: '#e2d1a6' }}>Compartir</span>
              {' '}
              <Share size={12} style={{ display: 'inline', verticalAlign: 'middle', color: '#d9531e' }} />
              {' '}en Safari
            </Step>
            <Step number={2} icon={<Plus size={14} />} color="#c8a84b">
              Selecciona{' '}
              <span style={{ fontWeight: 700, color: '#e2d1a6' }}>"Añadir a pantalla de inicio"</span>
            </Step>
            <Step number={3} icon={<span style={{ fontSize: '12px' }}>⚔️</span>} color="#7c6b3a">
              ¡Listo! La app abrirá sin barra de Safari
            </Step>
          </div>

          {/* Arrow pointing down to navbar */}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(217,83,30,0.35)',
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Step({ number, icon, color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%',
        background: `rgba(${hexToRgb(color)}, 0.15)`,
        border: `1px solid rgba(${hexToRgb(color)}, 0.4)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color,
        fontSize: '11px',
        fontWeight: 700,
      }}>
        {number}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'rgba(226,209,166,0.7)', lineHeight: 1.4 }}>
        {children}
      </p>
    </div>
  )
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255'
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share } from 'lucide-react'

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleDismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'calc(100% - 2rem)',
              maxWidth: '420px',
              background: 'linear-gradient(135deg, rgba(13,11,8,0.98) 0%, rgba(30,18,10,0.99) 100%)',
              border: '1px solid rgba(217,83,30,0.35)',
              borderRadius: '20px',
              boxShadow: '0 0 0 1px rgba(217,83,30,0.1), 0 8px 60px rgba(0,0,0,0.8), 0 0 40px rgba(217,83,30,0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                  border: '1px solid rgba(217,83,30,0.4)',
                  boxShadow: '0 0 16px rgba(217,83,30,0.3)',
                }}>
                  <img src="/app-icon.png" alt="DungeonAssistant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#e2d1a6',
                    letterSpacing: '0.05em',
                    lineHeight: 1.2,
                  }}>
                    Instala DungeonAssistant
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(226,209,166,0.5)', marginTop: '0.15rem' }}>
                    Acceso rápido desde tu pantalla de inicio
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                aria-label="Cerrar"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(226,209,166,0.5)',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(217,83,30,0.15)' }} />

            {/* Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <Step number={1} color="#d9531e">
                Toca el botón{' '}
                <span style={{ fontWeight: 700, color: '#e2d1a6' }}>Compartir</span>
                {' '}
                <Share size={12} style={{ display: 'inline', verticalAlign: 'middle', color: '#d9531e' }} />
                {' '}en Safari
              </Step>
              <Step number={2} color="#c8a84b">
                Selecciona{' '}
                <span style={{ fontWeight: 700, color: '#e2d1a6' }}>"Añadir a pantalla de inicio"</span>
              </Step>
              <Step number={3} color="#7c6b3a">
                ¡Listo! La app abrirá sin barra de Safari
              </Step>
            </div>

            {/* Cerrar button */}
            <button
              onClick={handleDismiss}
              style={{
                width: '100%', padding: '0.7rem',
                background: 'linear-gradient(135deg, rgba(217,83,30,0.2), rgba(180,60,20,0.2))',
                border: '1px solid rgba(217,83,30,0.3)',
                borderRadius: '12px',
                color: '#e2d1a6',
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Step({ number, color, children }) {
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

import React, { useState } from 'react'
import { campaignAPI } from '../../../services/api'

export default function InviteCodePanel({ campaign, onUpdate }) {
  const [currentCode, setCurrentCode] = useState(campaign?.invite_code || null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const handleCopyCode = () => {
    if (!currentCode) return
    navigator.clipboard.writeText(currentCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleGenerateCode = async () => {
    setGeneratingCode(true)
    try {
      const res = await campaignAPI.regenerateCode(campaign.id)
      const newCode = res.data.invite_code || res.data.new_code
      setCurrentCode(newCode)
      setShowCode(true) // Mostrar el código automáticamente al generar
      if (onUpdate) onUpdate({ ...campaign, invite_code: newCode })
    } catch (e) {
      console.error('Error generando código:', e)
    } finally {
      setGeneratingCode(false)
    }
  }

  return (
    <div className="bg-gray-800/50 rounded-xl border border-yellow-500/30 p-6">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider" style={{ margin: 0 }}>
          Código de Invitación
        </h3>
        {currentCode && (
          <button
            onClick={() => setShowCode(v => !v)}
            style={{
              background: 'none', border: 'none',
              color: '#a78bfa', fontSize: '0.8rem',
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            {showCode ? '👁 Ocultar' : '🔑 Ver código'}
          </button>
        )}
      </div>
      <p className="text-gray-400 text-sm" style={{ marginBottom: '1rem' }}>
        Comparte este código con tus jugadores para que puedan unirse a la campaña.
      </p>

      {currentCode ? (
        <>
          <div style={{
            maxHeight: showCode ? '120px' : '0',
            opacity: showCode ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: showCode ? 'auto' : 'none',
            marginBottom: showCode ? '1.5rem' : '0'
          }}>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-black/40 border border-yellow-500/30 rounded-xl px-5 py-3 text-center">
                <span style={{ fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.3em', color: '#fbbf24' }}>
                  {currentCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                style={{
                  background: codeCopied ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.15)',
                  border: `1px solid ${codeCopied ? 'rgba(34,197,94,0.5)' : 'rgba(251,191,36,0.4)'}`,
                  color: codeCopied ? '#86efac' : '#fbbf24',
                  borderRadius: 10, padding: '0.5rem 1rem',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                  whiteSpace: 'nowrap', transition: 'all 0.2s'
                }}
              >
                {codeCopied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
          <button
            onClick={handleGenerateCode}
            disabled={generatingCode}
            title="El código anterior dejará de funcionar"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#6b7280', borderRadius: 8,
              padding: '0.4rem 0.9rem', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s'
            }}
          >
            {generatingCode ? '⏳ Generando...' : 'Generar nuevo código'}
          </button>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-3">Esta campaña aún no tiene código de invitación.</p>
          <button
            onClick={handleGenerateCode}
            disabled={generatingCode}
            style={{
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.4)',
              color: '#fbbf24', borderRadius: 10,
              padding: '0.65rem 1.5rem', fontWeight: 700,
              cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s'
            }}
          >
            {generatingCode ? '⏳ Generando...' : '✨ Generar Código de Invitación'}
          </button>
        </div>
      )}
    </div>
  )
}

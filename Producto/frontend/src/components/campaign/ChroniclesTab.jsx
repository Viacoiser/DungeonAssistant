import React, { useState, useEffect } from 'react'
import { sessionAPI } from '../../services/api'

// ============================================================================
// Tab: Crónicas de Campaña (solo lectura)
// ============================================================================

export default function ChroniclesTab({ campaignId }) {
  const [chronicles, setChronicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchChronicles()
  }, [campaignId])

  const fetchChronicles = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await sessionAPI.getChronicles(campaignId)
      setChronicles(res.data || [])
    } catch (e) {
      console.error('Error fetching chronicles:', e)
      setError('No se pudieron cargar las crónicas')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[var(--fantasy-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--fantasy-gold-muted)] text-sm">Cargando crónicas...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchChronicles}
            className="text-xs text-[var(--fantasy-accent)] hover:underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (chronicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <div className="text-center max-w-md space-y-6">
          {/* Decorative scroll icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--fantasy-accent)]/20 to-amber-900/10 rounded-full blur-xl" />
            <div className="relative w-24 h-24 rounded-full border border-[var(--fantasy-accent)]/30 bg-black/40 flex items-center justify-center">
              <span className="text-4xl opacity-60">📜</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-serif font-semibold text-[var(--fantasy-gold)]">
              Las crónicas aún no han sido escritas
            </h3>
            <p className="text-sm text-[var(--fantasy-gold-muted)] leading-relaxed">
              Las crónicas se generan automáticamente cada <strong className="text-[var(--fantasy-gold)]">3 sesiones</strong> completadas.
              Cuando la campaña acumule suficiente historia, el cronista plasmará aquí
              los eventos más importantes de vuestras aventuras.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xs text-[var(--fantasy-gold-muted)]">
              💡 Necesitas al menos <strong className="text-[var(--fantasy-accent)]">6 sesiones finalizadas</strong> para
              que aparezca la primera crónica.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Chronicles list
  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">📜</span>
        <div>
          <h2 className="text-lg font-serif font-semibold text-[var(--fantasy-gold)]">
            Crónicas de la Campaña
          </h2>
          <p className="text-xs text-[var(--fantasy-gold-muted)]">
            {chronicles.length} {chronicles.length === 1 ? 'crónica' : 'crónicas'} registradas
          </p>
        </div>
      </div>

      {/* Chronicle cards */}
      {chronicles.map((entry, index) => {
        const chronicle = entry.chronicle || {}
        const isExpanded = expandedId === entry.id
        const keyEvents = chronicle.key_events || []
        const npcs = chronicle.npcs_encountered || []
        const items = chronicle.items_obtained || []
        const locations = chronicle.locations_visited || []
        const decisions = chronicle.decisions_made || []
        const narrative = chronicle.narrative_summary || ''

        return (
          <div
            key={entry.id}
            className="group animate-fade-in-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-amber-800/30 bg-gradient-to-br from-[#1c1610] to-[#13100c] hover:border-amber-700/50 transition-all duration-300">
              {/* Decorative top border gradient */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />

              {/* Main content */}
              <div className="p-5">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700/30 to-amber-900/20 border border-amber-700/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📖</span>
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-semibold text-amber-200 leading-tight">
                        {entry.event_title || `Sesiones ${entry.session_number}`}
                      </h3>
                      <p className="text-[10px] text-[var(--fantasy-gold-muted)] mt-0.5">
                        {new Date(entry.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Narrative summary */}
                {narrative && (
                  <div className="mb-4 pl-[52px]">
                    <p className="text-sm text-[var(--fantasy-gold)] leading-relaxed italic">
                      "{narrative}"
                    </p>
                  </div>
                )}

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5 pl-[52px] mb-3">
                  {npcs.map((npc, i) => (
                    <span key={`npc-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-900/30 border border-blue-700/30 text-blue-300">
                      👤 {npc}
                    </span>
                  ))}
                  {items.map((item, i) => (
                    <span key={`item-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-900/30 border border-emerald-700/30 text-emerald-300">
                      ⚔️ {item}
                    </span>
                  ))}
                  {locations.map((loc, i) => (
                    <span key={`loc-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-900/30 border border-purple-700/30 text-purple-300">
                      📍 {loc}
                    </span>
                  ))}
                </div>

                {/* Expand/collapse button */}
                {(keyEvents.length > 0 || decisions.length > 0) && (
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="flex items-center gap-2 pl-[52px] text-xs text-[var(--fantasy-accent)] hover:text-amber-400 transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {isExpanded ? 'Ocultar detalles' : `Ver detalles (${keyEvents.length + decisions.length})`}
                  </button>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 pl-[52px] space-y-3 animate-fade-in-up">
                    {/* Key events */}
                    {keyEvents.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                          ⚡ Eventos Clave
                        </h4>
                        <ul className="space-y-1">
                          {keyEvents.map((event, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--fantasy-gold-muted)]">
                              <span className="text-amber-600 mt-0.5 flex-shrink-0">•</span>
                              {event}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Decisions */}
                    {decisions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                          ⚖️ Decisiones Importantes
                        </h4>
                        <ul className="space-y-1">
                          {decisions.map((decision, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--fantasy-gold-muted)]">
                              <span className="text-amber-600 mt-0.5 flex-shrink-0">•</span>
                              {decision}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

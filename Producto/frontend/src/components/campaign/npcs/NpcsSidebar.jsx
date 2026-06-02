import React from 'react'

export default function NpcsSidebar({
  npcs,
  loading,
  selectedNpc,
  setSelectedNpc,
  isGM,
  prompt,
  setPrompt,
  handleGenerate,
  generating,
  generateError
}) {
  return (
    <div className={`
      ${selectedNpc ? 'hidden md:flex' : 'flex'}
      w-full md:w-52 flex-shrink-0 flex-col overflow-y-auto
    `}>
      <span className="text-xs font-semibold text-[var(--fantasy-gold)] uppercase tracking-wider mb-3">NPCs de campaña</span>

      {loading ? (
        <div className="text-gray-500 text-sm">Cargando...</div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1 mb-3">
          {npcs.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-6">
              <div className="text-2xl mb-2">🎭</div>
              <p>Sin NPCs registrados</p>
            </div>
          ) : (
            npcs.map(npc => (
              <button
                key={npc.id}
                onClick={() => setSelectedNpc(npc)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedNpc?.id === npc.id
                  ? 'bg-[var(--fantasy-accent)]/30 text-[var(--fantasy-gold)]'
                  : 'text-[var(--fantasy-gold-muted)] hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span>{npc.is_alive ? '🟢' : '💀'}</span>
                  <span className="font-medium truncate">{npc.name}</span>
                </div>
                {npc.race && <div className="text-xs text-gray-400">{npc.race}</div>}
              </button>
            ))
          )}
        </div>
      )}

      {/* Generar NPC — Solo GM */}
      {isGM && (
        <div className="border-t border-gray-700/50 pt-3">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ej: Un mercader enano corrupto..."
            rows={3}
            className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[var(--fantasy-gold)] text-xs placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 resize-none transition-colors"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full mt-2 py-2 bg-[var(--fantasy-accent)] hover:bg-[#e86424] disabled:opacity-40 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 fantasy-button-glow"
          >
            {generating ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>✨ Generar NPC</>
            )}
          </button>
          {generateError && (
            <div className="mt-2 bg-red-900/30 border border-red-500/30 rounded-lg px-2 py-1.5 text-xs text-red-300">
              ⚠️ {generateError}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

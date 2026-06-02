import React from 'react'

export default function NpcDetail({
  selectedNpc,
  setSelectedNpc,
  isGM,
  editingNpc,
  setEditingNpc,
  editForm,
  setEditForm,
  handleUpdateNpc,
  savingNpc,
  setNpcDeleteModal,
  handleGenerateTrait,
  generatingTrait,
  startEditing,
  relationColors
}) {
  if (!selectedNpc) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center text-gray-500 relative h-full">
        <div className="text-center">
          <div className="text-4xl mb-3">🎭</div>
          <p>Selecciona un NPC o genera uno nuevo</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 overflow-y-auto relative h-full block`}>
      <div className="flex flex-col relative h-full">
        <div className="md:hidden flex-shrink-0 w-full mb-3 sticky top-0 z-10 bg-[#1a1a1a] pb-2">
          <button 
            onClick={() => setSelectedNpc(null)} 
            className="text-fantasy-gold hover:text-white flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-fantasy-gold/20 bg-white/5 active:scale-95 transition"
          >
            ← Volver a NPCs
          </button>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-start justify-between mb-4">
            {editingNpc ? (
              <div className="flex-1 mr-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Nombre</label>
                  <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase">Raza/Clase</label>
                    <input value={editForm.race || ''} onChange={e => setEditForm({ ...editForm, race: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase">Estado Vital</label>
                    <select value={editForm.is_alive ? 'alive' : 'dead'} onChange={e => setEditForm({ ...editForm, is_alive: e.target.value === 'alive' })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm">
                      <option value="alive">🟢 Vivo</option><option value="dead">💀 Muerto</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase">Relación</label>
                    <select value={editForm.relationship_to_party || 'neutral'} onChange={e => setEditForm({ ...editForm, relationship_to_party: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm">
                      <option value="aliado">Aliado</option><option value="enemigo">Enemigo</option>
                      <option value="neutral">Neutral</option><option value="desconocido">Desconocido</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedNpc.name}
                  <span className="text-sm">{selectedNpc.is_alive ? '🟢' : '💀'}</span>
                </h3>
                {selectedNpc.race && (
                  <span className="text-purple-300 text-sm">{selectedNpc.race}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 flex-col sm:flex-row">
              {editingNpc ? (
                <>
                  <button onClick={() => setEditingNpc(false)} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition">Cancelar</button>
                  <button onClick={handleUpdateNpc} disabled={savingNpc} className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded transition">{savingNpc ? 'Guardando...' : 'Guardar'}</button>
                  <button onClick={() => setNpcDeleteModal(selectedNpc)} className="px-3 py-1 text-sm bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded transition border border-red-500/30">🗑️ Borrar</button>
                </>
              ) : (
                <>
                  {isGM && (
                    <button onClick={startEditing} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition border border-gray-600"> Editar</button>
                  )}
                  <span className={`capitalize px-2 py-0.5 text-xs border rounded-full ${relationColors[selectedNpc.relationship_to_party] || relationColors.desconocido}`}>
                    {selectedNpc.relationship_to_party || 'desconocido'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {editingNpc ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500 uppercase">Personalidad</label>
                    <button onClick={handleGenerateTrait} disabled={generatingTrait} className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1">
                      {generatingTrait ? '⏳ Generando...' : '🎲 Tirar rasgo aleatorio'}
                    </button>
                  </div>
                  <textarea value={editForm.personality || ''} onChange={e => setEditForm({ ...editForm, personality: e.target.value })} rows={3} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs text-red-400 uppercase">Secrecto</label>
                  <textarea value={editForm.secrets || ''} onChange={e => setEditForm({ ...editForm, secrets: e.target.value })} rows={2} className="w-full bg-red-900/20 border border-red-500/40 rounded px-3 py-2 text-white text-sm resize-none" />
                </div>
              </>
            ) : (
              <>
                {selectedNpc.personality && (
                  <div className="group relative">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personalidad</h4>
                      {isGM && (
                        <button onClick={handleGenerateTrait} disabled={generatingTrait} className="opacity-0 group-hover:opacity-100 text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 px-2 py-0.5 rounded transition inline-flex items-center gap-1">
                          {generatingTrait ? '⏳' : '🎲 Generar rasgo'}
                        </button>
                      )}
                    </div>
                    <p className="text-gray-200 text-sm whitespace-pre-wrap">{selectedNpc.personality}</p>
                  </div>
                )}

                {selectedNpc.secrets && (
                  <details className="bg-red-900/20 border border-red-500/20 rounded-lg group">
                    <summary className="p-3 cursor-pointer text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center justify-between opacity-80 hover:opacity-100 transition list-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center italic">Secreto</span>
                      <span className="text-[10px] bg-red-900/50 px-2 py-0.5 rounded border border-red-500/30 font-medium group-open:hidden">Revelar</span>
                      <span className="text-[10px] bg-red-900/50 px-2 py-0.5 rounded border border-red-500/30 font-medium hidden group-open:block">Ocultar</span>
                    </summary>
                    <div className="px-3 pb-3 pt-1 border-t border-red-500/10 mt-1">
                      <p className="text-gray-200 text-sm whitespace-pre-wrap">{selectedNpc.secrets}</p>
                    </div>
                  </details>
                )}
              </>
            )}

            {editingNpc ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stats y Habilidades</h4>
                  <button onClick={() => {
                    const no = String(Date.now()).slice(-4);
                    setEditForm(prev => ({ ...prev, stats: { ...(prev.stats || {}), [`Nuevo-${no}`]: '' } }))
                  }}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white"
                  >+ Agregar</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(editForm.stats || {})
                    .filter(([key]) => key !== '_prompt')
                    .map(([key, val]) => (
                      <div key={key} className="flex flex-col gap-1 bg-gray-800/80 p-2 rounded border border-gray-700 relative group">
                        <input value={key} onChange={e => {
                          const newStats = { ...editForm.stats };
                          const v = newStats[key];
                          delete newStats[key];
                          newStats[e.target.value] = v;
                          setEditForm({ ...editForm, stats: newStats });
                        }} className="w-full bg-transparent text-xs text-gray-400 focus:outline-none focus:text-gray-200" />
                        <input value={val} onChange={e => setEditForm({ ...editForm, stats: { ...editForm.stats, [key]: e.target.value } })} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm" />
                        <button onClick={() => {
                          const newStats = { ...editForm.stats };
                          delete newStats[key];
                          setEditForm({ ...editForm, stats: newStats });
                        }} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              selectedNpc.stats && Object.keys(selectedNpc.stats).filter(k => k !== '_prompt').length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stats</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedNpc.stats)
                      .filter(([key]) => key !== '_prompt')
                      .map(([key, val]) => (
                        <div key={key} className="bg-gray-700/50 rounded-lg px-3 py-1 flex items-center gap-2">
                          <span className="text-gray-400 text-xs font-medium">{key}</span>
                          <span className="text-white text-sm font-bold">{val}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )
            )}

            {selectedNpc.stats?._prompt && (
              <div className="mt-4 border-t border-gray-700/50 pt-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prompt original</h4>
                <div
                  className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-900/50 p-3 flex"
                  onClick={(e) => {
                    const el = e.currentTarget.querySelector('p');
                    if (el.classList.contains('blur-[4px]')) {
                      el.classList.remove('blur-[4px]', 'select-none');
                    } else {
                      el.classList.add('blur-[4px]', 'select-none');
                    }
                  }}
                >
                  <p className="text-gray-400 text-sm italic blur-[4px] select-none transition-all duration-300 w-full">
                    "{selectedNpc.stats._prompt}"
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
                    <span className="bg-black/90 border border-gray-600 text-white text-xs px-3 py-1.5 rounded shadow-xl">
                      Clic para revelar / ocultar
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function NotesSidebar({
  sessions,
  activeSession,
  selectSession,
  handleCreateSession,
  creatingSession,
  createSessionError,
  loadingSessions,
  openDeleteModal
}) {
  return (
    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto min-h-0">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-widest text-fantasy-accent/60 font-bold">Sesiones</h4>
        <button
          onClick={handleCreateSession}
          disabled={creatingSession}
          className="p-1.5 bg-fantasy-accent/20 text-fantasy-accent rounded hover:bg-fantasy-accent/30 transition-colors disabled:opacity-50"
        >
          <Plus size={14} />
        </button>
      </div>

      {createSessionError && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-2 py-1.5 text-xs text-red-300">
          ⚠️ {createSessionError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {loadingSessions ? (
          <div className="text-gray-500 text-sm">Cargando...</div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-6">
            <p>Sin sesiones</p>
          </div>
        ) : (
          sessions.map(s => (
            <button
              key={s.id}
              onClick={() => selectSession(s)}
              className={`group relative text-left px-4 py-2 rounded-lg transition-colors text-sm ${activeSession?.id === s.id
                ? 'bg-[var(--fantasy-accent)]/30 text-[var(--fantasy-gold)]'
                : 'bg-white/5 text-[var(--fantasy-gold-muted)] hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-2">
                {s.is_active && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                <span className="truncate">{s.title || `Sesión ${s.session_number}`}</span>
              </div>
              <div
                onClick={(e) => openDeleteModal(e, s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 size={12} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

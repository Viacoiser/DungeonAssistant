import React from 'react'
import { Trash2, Edit2 } from 'lucide-react'

export default function NoteItem({
  note,
  togglingNoteId,
  handleToggleNoteVisibility,
  handleStartEditNote,
  handleDeleteNote,
  editingNoteId,
  editNoteText,
  setEditNoteText,
  handleCancelEditNote,
  handleUpdateNote,
  updatingNote
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 pt-12 border border-white/5 group relative hover:border-white/10 transition-colors">
      {/* Indicador de privacidad */}
      <div className="absolute top-3 left-4 text-xs flex items-center gap-1.5 text-[var(--fantasy-gold-muted)]">
        <span className="text-lg">
          {note.is_public ? '🔓' : '🔒'}
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold">
          {note.is_public ? 'Pública' : 'Privada'}
        </span>
      </div>

      {/* Botones de acción nota */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-1.5 bg-black/40 px-1.5 py-1 rounded-lg border border-white/5 backdrop-blur-sm">
        <button 
          onClick={() => handleToggleNoteVisibility(note)} 
          disabled={togglingNoteId === note.id}
          className="text-gray-400 hover:text-[var(--fantasy-gold)] disabled:opacity-50 transition" 
          title={note.is_public ? "Hacer privada" : "Compartir públicamente"}
        >
          {togglingNoteId === note.id ? (
            <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            note.is_public ? '🔓' : '🔒'
          )}
        </button>
        <button onClick={() => handleStartEditNote(note)} className="text-gray-400 hover:text-fantasy-accent" title="Editar nota">
          <Edit2 size={14} />
        </button>
        <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-400" title="Eliminar nota">
          <Trash2 size={14} />
        </button>
      </div>

      {editingNoteId === note.id ? (
        <div className="mt-1">
          <textarea
            value={editNoteText}
            onChange={e => setEditNoteText(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[var(--fantasy-gold)] text-sm focus:outline-none focus:border-[var(--fantasy-accent)]/50 resize-none min-h-[100px]"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={handleCancelEditNote} className="px-3 py-1 text-xs text-[var(--fantasy-gold-muted)] hover:text-[var(--fantasy-gold)] transition">Cancelar</button>
            <button onClick={() => handleUpdateNote(note.id)} disabled={updatingNote || !editNoteText.trim()} className="px-3 py-1 bg-[var(--fantasy-accent)] hover:bg-[#e86424] disabled:opacity-50 text-white rounded-lg text-xs transition fantasy-button-glow">
              {updatingNote ? 'Guardando...' : 'Re-analizar y Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className={`text-[var(--fantasy-gold)]/90 text-sm whitespace-pre-wrap pr-12 leading-relaxed ${note.is_optimistic ? 'opacity-50 italic' : ''}`}>
            {note.content}
          </p>

          {note.is_optimistic && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-fantasy-accent font-bold uppercase tracking-widest animate-pulse">
              <div className="w-2 h-2 rounded-full bg-fantasy-accent" />
              Sincronizando...
            </div>
          )}

          {note.detected_items?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {note.detected_items.map((item, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${item.is_magical
                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                    : 'bg-fantasy-accent/10 text-fantasy-accent border border-fantasy-accent/20'
                    }`}
                >
                  {item.is_magical && <span className="text-[8px]">✨</span>}
                  {(item.name || item.item_name)} {item.quantity > 1 && `×${item.quantity}`}
                </span>
              ))}
            </div>
          )}

          {note.detected_npcs?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.detected_npcs.map((npc, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20"
                >
                  👤 {npc.name}
                </span>
              ))}
            </div>
          )}

          <div className="text-[10px] text-white/20 mt-3 font-medium">
            {note.is_optimistic ? 'Recién ahora' : new Date(note.created_at).toLocaleString('es-CL')}
          </div>

        </>
      )}
    </div>
  )
}

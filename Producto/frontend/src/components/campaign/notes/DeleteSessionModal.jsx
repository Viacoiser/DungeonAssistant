import React from 'react'
import { Trash2 } from 'lucide-react'

export default function DeleteSessionModal({
  deleteModal,
  deleteConfirmText,
  setDeleteConfirmText,
  handleDeleteSession,
  closeDeleteModal,
  deleting
}) {
  if (!deleteModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-red-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Eliminar sesión</h3>
            <p className="text-gray-400 text-sm">Esta acción no se puede deshacer</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Se eliminarán la sesión y <span className="text-red-300 font-medium">todas sus notas</span> permanentemente.
          Para confirmar, escribí el nombre exacto de la sesión:
        </p>
        <div className="bg-gray-800 rounded-lg px-3 py-2 mb-3 text-center">
          <span className="text-[var(--fantasy-gold)] font-mono font-semibold">
            {deleteModal.title || `Sesión ${deleteModal.session_number}`}
          </span>
        </div>
        <input
          type="text"
          value={deleteConfirmText}
          onChange={e => setDeleteConfirmText(e.target.value)}
          placeholder="Escribe el nombre aquí..."
          autoFocus
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400 mb-4"
          onKeyDown={e => {
            if (e.key === 'Enter') handleDeleteSession()
            if (e.key === 'Escape') closeDeleteModal()
          }}
        />
        <div className="flex gap-3">
          <button onClick={closeDeleteModal} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition">Cancelar</button>
          <button
            onClick={handleDeleteSession}
            disabled={deleteConfirmText !== (deleteModal.title || `Sesión ${deleteModal.session_number}`) || deleting}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition"
          >
            {deleting ? 'Eliminando...' : 'Eliminar sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}

import React from 'react'

export default function DeleteNpcModal({
  npcDeleteModal,
  npcDeleteConfirmText,
  setNpcDeleteConfirmText,
  handleDeleteNpc,
  setNpcDeleteModal,
  npcDeleting
}) {
  if (!npcDeleteModal) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-red-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-2">¿Eliminar NPC?</h3>
        <p className="text-gray-300 text-sm mb-4">
          Esta acción eliminará a este personaje permanentemente.
          Para confirmar, escribe <span className="text-red-300 font-medium font-mono border-b border-red-500/50">{npcDeleteModal.name}</span>
        </p>
        <input
          type="text"
          value={npcDeleteConfirmText}
          onChange={e => setNpcDeleteConfirmText(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400 mb-4"
          placeholder={npcDeleteModal.name}
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              setNpcDeleteModal(null)
              setNpcDeleteConfirmText('')
            }}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteNpc}
            disabled={npcDeleteConfirmText !== npcDeleteModal.name || npcDeleting}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
          >
            {npcDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

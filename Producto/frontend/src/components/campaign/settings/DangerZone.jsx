import React, { useState } from 'react'
import { campaignAPI } from '../../../services/api'

export default function DangerZone({ campaign, onCampaignDeleted }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleDelete = async () => {
    if (deleteConfirmText !== campaign.name) return
    setDeleting(true)
    setErrorMsg('')
    try {
      await campaignAPI.delete(campaign.id)
      setShowDeleteModal(false)
      setDeleteConfirmText('')
      if (onCampaignDeleted) {
        setTimeout(() => onCampaignDeleted(), 300)
      }
    } catch (e) {
      console.error('❌ Error deleting campaign:', e)
      setDeleting(false)
      setErrorMsg('⚠️ Error al eliminar: ' + (e?.response?.data?.detail || e.message))
    }
  }

  return (
    <>
      <div className="bg-red-900/10 border border-red-900/50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-red-400 mb-2">Zona de Peligro</h3>
        <p className="text-gray-400 text-sm mb-4">
          Una vez que elimines una campaña, no hay vuelta atrás. Esto borrará permanentemente la campaña, sus sesiones, NPCs y miembros.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 font-medium rounded-lg transition"
        >
          Eliminar campaña
        </button>
        {errorMsg && <p className="text-red-400 text-sm mt-2">{errorMsg}</p>}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-red-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">¿Estás absolutamente seguro?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Esta acción eliminará la campaña y todos sus datos asociados.
              Para confirmar, escribe <span className="text-red-300 font-medium font-mono border-b border-red-500/50">{campaign.name}</span>
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400 mb-4"
              placeholder={campaign.name}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== campaign.name || deleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
              >
                {deleting ? 'Eliminando...' : 'Eliminar permanente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

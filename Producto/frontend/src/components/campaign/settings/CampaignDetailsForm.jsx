import React, { useState } from 'react'
import { campaignAPI } from '../../../services/api'

export default function CampaignDetailsForm({ campaign, onUpdate }) {
  const [name, setName] = useState(campaign?.name || '')
  const [description, setDescription] = useState(campaign?.description || '')
  const [loreSummary, setLoreSummary] = useState(campaign?.lore_summary || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await campaignAPI.update(campaign.id, {
        name,
        description,
        lore_summary: loreSummary
      })
      setSaveMsg('✅ Cambios guardados')
      if (onUpdate) onUpdate(res.data)
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      setSaveMsg('⚠️ ' + (e?.response?.data?.detail || 'Error guardando'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 flex flex-col gap-4">
      <h3 className="text-xl font-bold text-white mb-2">Ajustes de Campaña</h3>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nombre</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-[var(--fantasy-gold)] placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descripción Breve</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-[var(--fantasy-gold)] placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 resize-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Lore / Tono de campaña</label>
        <p className="text-xs text-gray-500 mb-2">Guía para el asistente IA y generador de NPCs. Describe aquí el mundo y el progreso de la aventura.</p>
        <textarea
          value={loreSummary}
          onChange={e => setLoreSummary(e.target.value)}
          rows={6}
          className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-[var(--fantasy-gold)] placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 resize-none transition-colors"
        />
      </div>

      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[var(--fantasy-accent)] hover:bg-[#e86424] disabled:opacity-50 text-white font-medium rounded-lg transition fantasy-button-glow"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        {saveMsg && <span className="text-sm text-gray-300">{saveMsg}</span>}
      </div>
    </div>
  )
}

import React from 'react'
import InviteCodePanel from './settings/InviteCodePanel'
import CampaignDetailsForm from './settings/CampaignDetailsForm'
import DangerZone from './settings/DangerZone'

export default function SettingsTab({ campaign, onUpdate, isGM = false, onCampaignDeleted = null }) {
  if (!isGM) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-8">
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">⚔️</div>
          <h3 className="text-white font-bold text-lg mb-2">Modo Jugador</h3>
          <p className="text-gray-400 text-sm">Solo el Dungeon Master puede acceder a la configuración de la campaña.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-8">
      <InviteCodePanel campaign={campaign} onUpdate={onUpdate} />
      <CampaignDetailsForm campaign={campaign} onUpdate={onUpdate} />
      <DangerZone campaign={campaign} onCampaignDeleted={onCampaignDeleted} />
    </div>
  )
}

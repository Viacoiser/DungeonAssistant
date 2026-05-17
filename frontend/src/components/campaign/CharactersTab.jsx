import React, { useState, useEffect } from 'react'
import { characterAPI } from '../../services/api'
import LoadingSpinner from '../shared/LoadingSpinner'
import CharacterDetail from '../shared/CharacterDetail'
import CharacterSidebar from './characters/CharacterSidebar'

export default function CharactersTab({ campaignId, isGM, user }) {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await characterAPI.list(campaignId)
        setCharacters(res.data?.characters || [])
      } catch (e) {
        console.error('Error cargando personajes:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campaignId])

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId)

  const handleSelectCharacter = (charId) => {
    setSelectedCharacterId(charId)
    // Guardar el nombre del personaje en localStorage si es del jugador
    const character = characters.find(c => c.id === charId)
    if (character && !isGM && character.player_id === user?.id) {
      localStorage.setItem(`campaign_${campaignId}_player_name`, character.name)
    }
  }

  if (loading) return <LoadingSpinner text="Cargando personajes..." />

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-4 h-full overflow-hidden relative">
      <CharacterSidebar 
        characters={characters}
        selectedCharacterId={selectedCharacterId}
        onSelectCharacter={handleSelectCharacter}
      />

      {/* Main Panel - Character Details */}
      <div className={`
        ${!selectedCharacterId ? 'hidden md:flex' : 'flex'}
        flex-1 overflow-hidden relative flex-col
      `}>
        {!selectedCharacter ? (
          <div className="text-center text-[rgba(226,209,166,0.5)] text-sm md:text-base">
            Selecciona un personaje para ver sus detalles
          </div>
        ) : (
          <div className="w-full h-full flex flex-col relative">
            <div className="md:hidden flex-shrink-0 w-full p-1.5 border-b border-white/10 bg-black/60 sticky top-0 z-10">
              <button 
                onClick={() => setSelectedCharacterId(null)} 
                className="text-fantasy-gold hover:text-white flex items-center gap-2 text-xs px-2.5 py-1 rounded-lg border border-fantasy-gold/20 bg-white/5 active:scale-95 transition"
              >
                ← Volver a la lista
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex relative">
              <CharacterDetail
                character={selectedCharacter}
                campaignId={campaignId}
                isGM={isGM}
                onUpdate={async (updatedChar) => {
                  try {
                    // 1. Guardar en backend (Supabase via API)
                    await characterAPI.update(updatedChar.id, updatedChar)
                    
                    // 2. Refrescar la lista local
                    const res = await characterAPI.list(campaignId)
                    setCharacters(res.data?.characters || [])
                  } catch (e) {
                    console.error('Error actualizando personaje en backend:', e)
                    alert('Error al guardar cambios en la base de datos.')
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

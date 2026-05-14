import React from 'react'
import CharacterListItem from './CharacterListItem'

export default function CharacterSidebar({ 
  characters, 
  selectedCharacterId, 
  onSelectCharacter 
}) {
  return (
    <div className={`
      ${selectedCharacterId ? 'hidden md:flex' : 'flex'}
      w-full md:w-[300px] border-b md:border-b-0 md:border-r border-[rgba(217,83,30,0.2)]
      flex-col gap-3 p-3 md:p-4 overflow-y-auto
    `}>
      {characters.length === 0 ? (
        <div className="text-center text-white/50 text-sm py-8 px-4">
          No hay personajes en esta campaña.
        </div>
      ) : (
        characters.map((char) => (
          <CharacterListItem
            key={char.id}
            char={char}
            selected={selectedCharacterId === char.id}
            onClick={() => onSelectCharacter(char.id)}
          />
        ))
      )}
    </div>
  )
}

import React from 'react'
import CharacterSheet5e from '../sheet/CharacterSheet5e'

/**
 * CharacterDetail.jsx
 * Thin wrapper that delegates to the new CharacterSheet5e component.
 * Used inline within the Campaign View / Characters Tab.
 */
export default function CharacterDetail({ character, campaignId, onUpdate, isGM }) {
  return (
    <CharacterSheet5e
      character={character}
      campaignId={campaignId}
      onUpdate={onUpdate}
      isGM={isGM}
      mode="split-view"
      onClose={() => {}} // No close button needed in inline view
    />
  )
}

import React, { useState } from 'react'
import CharacterSheet5e from '../sheet/CharacterSheet5e'
import CameraCapture from '../CharacterCreation/CameraCapture'
import OCRReviewModal from '../CharacterCreation/OCRReviewModal'
import { normalizeCharacter } from '../../utils/normalizeCharacter'

/** Personaje vacío para empezar de cero */
const EMPTY_CHARACTER = {
  name: '', race: '', class_: '', subclass: '', level: 1,
  background: '', alignment: '', experience_points: 0, player_name: '',
  stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  hp_max: 1, hp_current: 1, hp_temporary: 0,
  armor_class: 10, initiative: 0, speed: 30,
  proficiency_bonus: 2, hit_dice: '1d8', passive_perception: 10,
  inspiration: false, is_alive: true,
  saving_throws: {}, skills: {}, attacks: [],
  equipment: '', currency: null, spellcasting: null,
  personality_traits: '', ideals: '', bonds: '', flaws: '',
  features_traits: '', other_proficiencies: '', backstory: '', image_url: null,
}

/** Convierte alineamiento en texto libre al slug que usa el sheet */
function normalizeAlignment(raw) {
  if (!raw) return ''
  const s = raw.toLowerCase().trim()
  const map = {
    'lawful good': 'lawful-good', 'neutral good': 'neutral-good', 'chaotic good': 'chaotic-good',
    'lawful neutral': 'lawful-neutral', 'true neutral': 'true-neutral', 'neutral': 'true-neutral',
    'chaotic neutral': 'chaotic-neutral', 'lawful evil': 'lawful-evil',
    'neutral evil': 'neutral-evil', 'chaotic evil': 'chaotic-evil',
    // slugs ya correctos
    'lawful-good': 'lawful-good', 'neutral-good': 'neutral-good', 'chaotic-good': 'chaotic-good',
    'lawful-neutral': 'lawful-neutral', 'true-neutral': 'true-neutral',
    'chaotic-neutral': 'chaotic-neutral', 'lawful-evil': 'lawful-evil',
    'neutral-evil': 'neutral-evil', 'chaotic-evil': 'chaotic-evil',
  }
  return map[s] ?? raw
}

/** Mapea datos OCR (planos) al contrato del sheet */
function ocrToCharacter(data) {
  const spellcasting = (data.spellcasting_class || data.cantrips?.length || data.spells?.length)
    ? {
        class: data.spellcasting_class || '',
        ability: (data.spellcasting_ability || '').toLowerCase(),
        save_dc: data.spell_save_dc || 0,
        attack_bonus: data.spell_attack_bonus || 0,
        slots: Object.fromEntries(
          Array.from({ length: 9 }, (_, i) => [String(i + 1), { total: 0, used: 0 }])
        ),
        cantrips: data.cantrips || [],
        spells: (data.spells || []).map(s => (typeof s === 'string' ? s : s.name)),
      }
    : data.spellcasting || null

  return normalizeCharacter({
    name: data.character_name || data.name || '',
    race: data.race || '',
    class_: data.class || data.class_ || '',
    subclass: data.subclass || '',
    level: data.level || 1,
    background: data.background || '',
    alignment: normalizeAlignment(data.alignment),
    experience_points: data.experience_points || 0,
    player_name: data.player_name || '',
    stats: data.stats || {},
    hp_max: data.hp_max || 0,
    hp_current: data.hp_current || data.hp_max || 0,
    hp_temporary: data.hp_temporary || 0,
    armor_class: data.armor_class || 10,
    proficiency_bonus: data.proficiency_bonus || 2,
    initiative: data.initiative || 0,
    speed: data.speed || 30,
    hit_dice: data.hit_dice || '1d8',
    passive_perception: data.passive_perception || 10,
    inspiration: data.inspiration || false,
    saving_throws: data.saving_throws || {},
    skills: data.skills || {},
    attacks: data.attacks || [],
    equipment: data.equipment || '',
    currency: data.currency || null,
    personality_traits: data.personality_traits || '',
    ideals: data.ideals || '',
    bonds: data.bonds || '',
    flaws: data.flaws || '',
    features_traits: data.features_traits || '',
    other_proficiencies: data.other_proficiencies || '',
    backstory: data.backstory || '',
    spellcasting,
  })
}

export default function CreateCharacterView({ onBack, onSubmit, loading, error }) {
  const [showCamera, setShowCamera] = useState(false)
  const [rawOcrData, setRawOcrData] = useState(null)
  const [showReview, setShowReview] = useState(false)
  const [ocrFields, setOcrFields] = useState(new Set())
  const [ocrCharacter, setOcrCharacter] = useState(null) // mapped character from OCR

  // Paso 1: OCR terminó → mostrar modal de revisión
  const handleOcrExtracted = (extractedData) => {
    setRawOcrData(extractedData)
    setShowCamera(false)
    setShowReview(true)
  }

  // Paso 2: usuario confirma/edita en modal → mapear al sheet
  const handleOcrConfirm = (data) => {
    const filled = new Set()
    const simpleKeys = [
      'character_name', 'name', 'race', 'class', 'subclass', 'level', 'background',
      'alignment', 'player_name', 'experience_points', 'armor_class', 'hp_max', 'hp_current',
      'hp_temporary', 'speed', 'initiative', 'proficiency_bonus', 'hit_dice',
      'passive_perception', 'equipment', 'personality_traits', 'ideals', 'bonds', 'flaws',
      'features_traits', 'other_proficiencies',
    ]
    simpleKeys.forEach(k => { if (data[k] !== null && data[k] !== undefined && data[k] !== '') filled.add(k) })
    if (data.stats && Object.values(data.stats).some(v => v && v !== 10)) filled.add('stats')
    if (data.saving_throws && Object.values(data.saving_throws).some(s => s?.proficient)) filled.add('saving_throws')
    if (data.skills && Object.values(data.skills).some(s => s?.proficient)) filled.add('skills')
    if (data.attacks?.some(a => a?.name)) filled.add('attacks')
    if (data.spellcasting_class || data.cantrips?.length || data.spells?.length) filled.add('spellcasting')

    setOcrFields(filled)
    setOcrCharacter(ocrToCharacter(data))
    setRawOcrData(data)
    setShowReview(false)
  }

  // Submit: convertir el character del sheet al formato que espera el backend
  const handleSubmit = async (characterData) => {
    // El backend espera "class" no "class_", y ciertos campos planos
    const payload = {
      name: characterData.name,
      race: characterData.race,
      class: characterData.class_,
      subclass: characterData.subclass,
      level: characterData.level,
      background: characterData.background,
      alignment: characterData.alignment,
      experience_points: characterData.experience_points,
      player_name: characterData.player_name,
      stats: characterData.stats,
      hp_max: characterData.hp_max,
      hp_current: characterData.hp_current,
      hp_temporary: characterData.hp_temporary,
      armor_class: characterData.armor_class,
      initiative: characterData.initiative,
      speed: characterData.speed,
      proficiency_bonus: characterData.proficiency_bonus,
      hit_dice: characterData.hit_dice,
      passive_perception: characterData.passive_perception,
      inspiration: characterData.inspiration,
      is_alive: characterData.is_alive,
      saving_throws: characterData.saving_throws,
      skills: characterData.skills,
      attacks: characterData.attacks,
      equipment: characterData.equipment,
      currency: characterData.currency,
      spellcasting: characterData.spellcasting,
      personality_traits: characterData.personality_traits,
      ideals: characterData.ideals,
      bonds: characterData.bonds,
      flaws: characterData.flaws,
      features_traits: characterData.features_traits,
      other_proficiencies: characterData.other_proficiencies,
      backstory: characterData.backstory,
      image_url: characterData.image_url,
    }
    await onSubmit(payload)
  }

  const baseCharacter = ocrCharacter || normalizeCharacter(EMPTY_CHARACTER)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Cámara y Modal de Revisión ────────────────────────── */}
      {showCamera && (
        <CameraCapture
          onCharacterDataExtracted={handleOcrExtracted}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {showReview && rawOcrData && (
        <OCRReviewModal
          ocrData={rawOcrData}
          onConfirm={handleOcrConfirm}
          onRescan={() => { setShowReview(false); setShowCamera(true) }}
          onCancel={() => setShowReview(false)}
        />
      )}

      {/* Error banner si lo hay */}
      {error && (
        <div style={{
          padding: '0.75rem 1.5rem', flexShrink: 0,
          background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {/* ── CharacterSheet5e en modo create ──────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="cs-root">
        <CharacterSheet5e
          key={ocrCharacter ? 'ocr' : 'empty'}
          character={baseCharacter}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={onBack}
          onScanOCR={() => setShowCamera(true)}
          ocrFields={ocrFields}
        />
      </div>
    </div>
  )
}

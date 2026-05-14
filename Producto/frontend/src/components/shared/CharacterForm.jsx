import React, { useState, useEffect } from 'react'
import { useDndData } from '../../hooks/useDndData'
import { useDnd5eAPI } from '../../hooks/useDnd5eAPI'
import { Save, AlertCircle, Plus, Trash2, Search, Upload, X, Camera } from 'lucide-react'
import { commonItems } from '../../services/equipmentService'
import CameraCapture from '../CharacterCreation/CameraCapture'
import equipmentData from '../../data/encyclopedia/equipment.json'
import traitsData from '../../data/encyclopedia/traits.json'
import spellsData from '../../data/encyclopedia/spells.json'
import {
  getProficiencyBonus,
} from '../../utils/normalizeCharacter'

// ── Helpers de defaults JSONB ──────────────────────────────────────────────────

function makeSavingThrows() {
  return Object.fromEntries(
    ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
      .map(s => [s, { proficient: false }])
  )
}

function makeSkills() {
  return Object.fromEntries(
    [
      'acrobatics', 'animal_handling', 'arcana', 'athletics',
      'deception', 'history', 'insight', 'intimidation',
      'investigation', 'medicine', 'nature', 'perception',
      'performance', 'persuasion', 'religion', 'sleight_of_hand',
      'stealth', 'survival',
    ].map(s => [s, { proficient: false, expertise: false }])
  )
}

function makeAttacks() {
  return Array(3).fill(null).map(() => ({
    name: '', attack_bonus: '+0', damage: '', damage_type: '',
  }))
}

function makeSpellcasting() {
  return {
    class: '', ability: '', save_dc: 0, attack_bonus: 0,
    slots: Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [String(i + 1), { total: 0, used: 0 }])
    ),
    cantrips: [], spells: [],
  }
}

export default function CharacterForm({ campaignId, onSubmit, loading, initialData }) {
  const { races, classes, backgrounds, alignments } = useDndData()
  const { calculateBaseStats, calculateMaxHP } = useDnd5eAPI()

  const [formData, setFormData] = useState({
    // ── Identificación ─────────────────────────────────────────────────────────
    name: initialData?.name || '',
    race: initialData?.race || '',
    class_: initialData?.class_ || '',
    subclass: initialData?.subclass || '',
    level: initialData?.level || 1,
    background: initialData?.background || '',
    alignment: initialData?.alignment || '',
    experience_points: initialData?.experience_points || 0,
    player_name: initialData?.player_name || '',

    // ── Stats ──────────────────────────────────────────────────────────────────
    stats: {
      strength: initialData?.stats?.strength || 10,
      dexterity: initialData?.stats?.dexterity || 10,
      constitution: initialData?.stats?.constitution || 10,
      intelligence: initialData?.stats?.intelligence || 10,
      wisdom: initialData?.stats?.wisdom || 10,
      charisma: initialData?.stats?.charisma || 10,
    },

    // ── Combate ────────────────────────────────────────────────────────────────
    hp_max: initialData?.hp_max || 10,
    hp_current: initialData?.hp_current || initialData?.hp_max || 10,
    hp_temporary: initialData?.hp_temporary || 0,
    armor_class: initialData?.armor_class || 10,
    initiative: initialData?.initiative || 0,
    speed: initialData?.speed || 30,
    proficiency_bonus: initialData?.proficiency_bonus || 2,
    hit_dice: initialData?.hit_dice || '1d8',
    hit_dice_used: initialData?.hit_dice_used || 0,
    passive_perception: initialData?.passive_perception || 10,
    inspiration: initialData?.inspiration || false,

    // ── Tiradas de salvación y habilidades ─────────────────────────────────────
    saving_throws: initialData?.saving_throws || makeSavingThrows(),
    skills: initialData?.skills || makeSkills(),

    // ── Death saves ────────────────────────────────────────────────────────────
    death_saves: initialData?.death_saves || { successes: 0, failures: 0 },

    // ── Ataques ────────────────────────────────────────────────────────────────
    attacks: initialData?.attacks || makeAttacks(),

    // ── Equipo e inventario ────────────────────────────────────────────────────
    equipment: initialData?.equipment || '',
    currency: initialData?.currency || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    treasure: initialData?.treasure || '',

    // ── Spellcasting ───────────────────────────────────────────────────────────
    spellcasting: initialData?.spellcasting || makeSpellcasting(),

    // ── Personalidad ───────────────────────────────────────────────────────────
    personality_traits: initialData?.personality_traits || '',
    ideals: initialData?.ideals || '',
    bonds: initialData?.bonds || '',
    flaws: initialData?.flaws || '',

    // ── Rasgos y características ────────────────────────────────────────────────
    features_traits: initialData?.features_traits || '',
    other_proficiencies: initialData?.other_proficiencies || '',
    additional_features: initialData?.additional_features || '',

    // ── Trasfondo ──────────────────────────────────────────────────────────────
    backstory: initialData?.backstory || '',
    allies_organizations: initialData?.allies_organizations || { text: '', symbol: '' },

    // ── Apariencia física ──────────────────────────────────────────────────────
    age: initialData?.age || '',
    height: initialData?.height || '',
    weight: initialData?.weight || '',
    eyes: initialData?.eyes || '',
    skin: initialData?.skin || '',
    hair: initialData?.hair || '',
    appearance: initialData?.appearance || '',

    // ── Imagen ────────────────────────────────────────────────────────────────
    image_url: initialData?.image_url || null,
  })

  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [startingEquipment, setStartingEquipment] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('weapon')
  const [imagePreview, setImagePreview] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // ── Encyclopedia-based pickers (from Cajas branch) ──────────────────────────
  const equipmentCategories = [...new Set(equipmentData.map(item => item.equipment_type || item.equipment_category?.name || 'other'))].sort()
  const traitCategories = ['all', 'races', 'classes', 'backgrounds', 'proficiencies']
  const spellLevels = ['all', 'cantrip', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const [selectedEncCategory, setSelectedEncCategory] = useState(equipmentCategories[0] || 'armor')
  const [selectedTraitCategory, setSelectedTraitCategory] = useState('all')
  const [selectedSpellLevel, setSelectedSpellLevel] = useState('all')
  const [startingTraits, setStartingTraits] = useState([])
  const [startingSpells, setStartingSpells] = useState([])
  const [encSearchTerm, setEncSearchTerm] = useState('')
  const fileInputRef = React.useRef(null)

  // ── Fuzzy matching para selects ──────────────────────────────────────────────
  // Convierte texto OCR como "Elf", "half elf", "CHAOTIC GOOD" al index del dropdown
  const findBestMatch = (ocrText, options) => {
    if (!ocrText || !options?.length) return ''
    const normalized = ocrText.toLowerCase().replace(/[\s_-]+/g, '-').trim()
    
    // 1. Match exacto por index
    const exactIndex = options.find(o => o.index === normalized)
    if (exactIndex) return exactIndex.index
    
    // 2. Match exacto por name (case insensitive)
    const exactName = options.find(o => o.name.toLowerCase() === ocrText.toLowerCase().trim())
    if (exactName) return exactName.index
    
    // 3. Match parcial: el texto OCR contiene el name o viceversa
    const partial = options.find(o => 
      ocrText.toLowerCase().includes(o.name.toLowerCase()) ||
      o.name.toLowerCase().includes(ocrText.toLowerCase().trim())
    )
    if (partial) return partial.index
    
    // 4. Match por similitud de caracteres (Levenshtein simplificado)
    let bestScore = Infinity
    let bestMatch = ''
    for (const opt of options) {
      const a = opt.name.toLowerCase()
      const b = ocrText.toLowerCase().trim()
      let score = 0
      const longer = a.length > b.length ? a : b
      const shorter = a.length > b.length ? b : a
      for (let i = 0; i < longer.length; i++) {
        if (shorter[i] !== longer[i]) score++
      }
      score += Math.abs(a.length - b.length)
      if (score < bestScore) {
        bestScore = score
        bestMatch = opt.index
      }
    }
    // Solo aceptar si la diferencia es razonable (menos de 40% de chars diferentes)
    const maxLen = Math.max(ocrText.length, 3)
    if (bestScore <= maxLen * 0.4) return bestMatch
    
    return '' // No match found
  }

  // ── useEffect: aplicar initialData con fuzzy matching en selects ──────────────
  useEffect(() => {
    if (!initialData) return
    
    setFormData(prev => {
      const updated = { ...prev }
      
      // Fuzzy match para selects de lista
      if (initialData.race) {
        updated.race = findBestMatch(initialData.race, races) || initialData.race
      }
      if (initialData.class_) {
        updated.class_ = findBestMatch(initialData.class_, classes) || initialData.class_
      }
      if (initialData.background) {
        updated.background = findBestMatch(initialData.background, backgrounds) || initialData.background
      }
      if (initialData.alignment) {
        updated.alignment = findBestMatch(initialData.alignment, alignments) || initialData.alignment
      }
      
      // Campos directos (ya aplicados en useState, pero este effect cubre el caso de scan posterior)
      if (initialData.name) updated.name = initialData.name
      if (initialData.subclass) updated.subclass = initialData.subclass
      if (initialData.level) updated.level = initialData.level
      if (initialData.experience_points) updated.experience_points = initialData.experience_points
      if (initialData.player_name) updated.player_name = initialData.player_name
      
      if (initialData.stats) {
        updated.stats = {
          strength: initialData.stats.strength || 10,
          dexterity: initialData.stats.dexterity || 10,
          constitution: initialData.stats.constitution || 10,
          intelligence: initialData.stats.intelligence || 10,
          wisdom: initialData.stats.wisdom || 10,
          charisma: initialData.stats.charisma || 10,
        }
      }
      
      // Combate
      if (initialData.hp_max) { updated.hp_max = initialData.hp_max; updated.hp_current = initialData.hp_current || initialData.hp_max }
      if (initialData.hp_temporary) updated.hp_temporary = initialData.hp_temporary
      if (initialData.armor_class) updated.armor_class = initialData.armor_class
      if (initialData.initiative) updated.initiative = initialData.initiative
      if (initialData.speed) updated.speed = initialData.speed
      if (initialData.proficiency_bonus) updated.proficiency_bonus = initialData.proficiency_bonus
      if (initialData.hit_dice) updated.hit_dice = initialData.hit_dice
      if (initialData.passive_perception) updated.passive_perception = initialData.passive_perception
      if (initialData.inspiration !== undefined) updated.inspiration = initialData.inspiration
      
      // JSONB estructurados
      if (initialData.saving_throws) updated.saving_throws = initialData.saving_throws
      if (initialData.skills) updated.skills = initialData.skills
      if (initialData.attacks) updated.attacks = initialData.attacks
      if (initialData.equipment) updated.equipment = initialData.equipment
      if (initialData.currency) updated.currency = initialData.currency
      if (initialData.spellcasting) updated.spellcasting = initialData.spellcasting
      
      // Personalidad y rasgos
      if (initialData.personality_traits) updated.personality_traits = initialData.personality_traits
      if (initialData.ideals) updated.ideals = initialData.ideals
      if (initialData.bonds) updated.bonds = initialData.bonds
      if (initialData.flaws) updated.flaws = initialData.flaws
      if (initialData.features_traits) updated.features_traits = initialData.features_traits
      if (initialData.other_proficiencies) updated.other_proficiencies = initialData.other_proficiencies
      if (initialData.backstory) updated.backstory = initialData.backstory
      
      // Apariencia
      if (initialData.age) updated.age = initialData.age
      if (initialData.height) updated.height = initialData.height
      if (initialData.weight) updated.weight = initialData.weight
      if (initialData.eyes) updated.eyes = initialData.eyes
      if (initialData.skin) updated.skin = initialData.skin
      if (initialData.hair) updated.hair = initialData.hair
      
      return updated
    })
  }, [initialData, races, classes, backgrounds, alignments])

  // Get unique categories
  const categories = [...new Set(commonItems.map(item => item.category))].sort()

  const handleChange = (e) => {
    const { name, value, type } = e.target
    const parsedValue = type === 'number' ? parseInt(value) || 0 : value

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: parsedValue
      }

      // Si cambió la raza, actualizar stats base
      if (name === 'race' && value) {
        const baseStats = calculateBaseStats(value)
        updated.stats = baseStats
      }

      // Si cambió la clase o el nivel, recalcular HP y prof bonus
      if ((name === 'class_' || name === 'level') && updated.class_) {
        const className = name === 'class_' ? value : updated.class_
        const level = name === 'level' ? parsedValue : updated.level
        const constitution = updated.stats.constitution

        const maxHP = calculateMaxHP(className, level, constitution)
        updated.hp_max = maxHP
        updated.hp_current = maxHP
        updated.proficiency_bonus = getProficiencyBonus(level)
        updated.hit_dice_used = 0
      }

      return updated
    })
    
    // Limpiar error para este campo cuando el usuario empieza a editar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleStatChange = (stat, value) => {
    const parsedValue = parseInt(value) || 3
    const clampedValue = Math.min(20, Math.max(3, parsedValue))

    setFormData(prev => {
      const updated = {
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: clampedValue
        }
      }

      // Si cambió CON, recalcular HP
      if (stat === 'constitution') {
        const maxHP = calculateMaxHP(prev.class_, prev.level, clampedValue)
        updated.hp_max = maxHP
        updated.hp_current = maxHP
      }

      return updated
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    if (!formData.race) {
      newErrors.race = 'La raza es requerida'
    }
    if (!formData.class_) {
      newErrors.class_ = 'La clase es requerida'
    }
    if (formData.hp_max < 1) {
      newErrors.hp_max = 'Los HP máximos deben ser al menos 1'
    }
    if (formData.level < 1 || formData.level > 20) {
      newErrors.level = 'El nivel debe estar entre 1 y 20'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'La imagen no debe superar 5MB' }))
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target.result)
        setFormData(prev => ({ ...prev, image_url: event.target.result }))
        setErrors(prev => ({ ...prev, image: '' }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCharacterDataExtracted = (extractedData) => {
    // Actualizar el formulario con TODOS los datos escaneados de una vez
    setFormData(prev => {
      const updated = { ...prev }
      
      // Identificación — con fuzzy matching para selects
      if (extractedData.character_name) updated.name = extractedData.character_name
      if (extractedData.race) updated.race = findBestMatch(extractedData.race, races) || extractedData.race
      if (extractedData.class) updated.class_ = findBestMatch(extractedData.class, classes) || extractedData.class
      if (extractedData.subclass) updated.subclass = extractedData.subclass
      if (extractedData.level) updated.level = extractedData.level
      if (extractedData.background) updated.background = findBestMatch(extractedData.background, backgrounds) || extractedData.background
      if (extractedData.alignment) updated.alignment = findBestMatch(extractedData.alignment, alignments) || extractedData.alignment
      if (extractedData.experience_points) updated.experience_points = extractedData.experience_points
      if (extractedData.player_name) updated.player_name = extractedData.player_name
      
      // Stats
      if (extractedData.stats) {
        updated.stats = {
          strength: extractedData.stats.strength || prev.stats.strength,
          dexterity: extractedData.stats.dexterity || prev.stats.dexterity,
          constitution: extractedData.stats.constitution || prev.stats.constitution,
          intelligence: extractedData.stats.intelligence || prev.stats.intelligence,
          wisdom: extractedData.stats.wisdom || prev.stats.wisdom,
          charisma: extractedData.stats.charisma || prev.stats.charisma,
        }
      }
      
      // Combate
      if (extractedData.armor_class) updated.armor_class = extractedData.armor_class
      if (extractedData.hp_max) {
        updated.hp_max = extractedData.hp_max
        updated.hp_current = extractedData.hp_current || extractedData.hp_max
      }
      if (extractedData.hp_temporary) updated.hp_temporary = extractedData.hp_temporary
      if (extractedData.proficiency_bonus) updated.proficiency_bonus = extractedData.proficiency_bonus
      if (extractedData.initiative) updated.initiative = extractedData.initiative
      if (extractedData.speed) updated.speed = extractedData.speed
      if (extractedData.hit_dice) updated.hit_dice = extractedData.hit_dice
      if (extractedData.passive_perception) updated.passive_perception = extractedData.passive_perception
      if (extractedData.inspiration !== undefined) updated.inspiration = extractedData.inspiration
      
      // Saving throws y skills (estructurados)
      if (extractedData.saving_throws) updated.saving_throws = extractedData.saving_throws
      if (extractedData.skills) updated.skills = extractedData.skills
      
      // Ataques
      if (extractedData.attacks) updated.attacks = extractedData.attacks
      
      // Equipo
      if (extractedData.equipment) updated.equipment = extractedData.equipment
      if (extractedData.currency) updated.currency = extractedData.currency
      
      // Personalidad
      if (extractedData.personality_traits) updated.personality_traits = extractedData.personality_traits
      if (extractedData.ideals) updated.ideals = extractedData.ideals
      if (extractedData.bonds) updated.bonds = extractedData.bonds
      if (extractedData.flaws) updated.flaws = extractedData.flaws
      
      // Rasgos
      if (extractedData.features_traits) updated.features_traits = extractedData.features_traits
      if (extractedData.other_proficiencies) updated.other_proficiencies = extractedData.other_proficiencies
      
      // Spellcasting
      if (extractedData.spellcasting) updated.spellcasting = extractedData.spellcasting
      
      // Apariencia
      if (extractedData.age) updated.age = extractedData.age
      if (extractedData.height) updated.height = extractedData.height
      if (extractedData.weight) updated.weight = extractedData.weight
      if (extractedData.eyes) updated.eyes = extractedData.eyes
      if (extractedData.skin) updated.skin = extractedData.skin
      if (extractedData.hair) updated.hair = extractedData.hair
      if (extractedData.backstory) updated.backstory = extractedData.backstory
      
      return updated
    })
    
    // Cerrar la cámara
    setShowCamera(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitAttempted(true)
    
    if (validateForm()) {
      // Preparar datos para enviar al backend — todos los campos del contrato
      const submitData = {
        // ── Identificación ────────────────────────────────────────────────────
        campaign_id:       campaignId || formData.campaign_id,
        name:              formData.name,
        class:             formData.class_,   // BD usa "class", no "class_"
        race:              formData.race,
        level:             formData.level,
        background:        formData.background,
        alignment:         formData.alignment,
        experience_points: formData.experience_points,
        player_name:       formData.player_name,

        // ── Stats ─────────────────────────────────────────────────────────────
        stats: formData.stats,

        // ── Combate ───────────────────────────────────────────────────────────
        hp_max:            formData.hp_max,
        hp_current:        formData.hp_current,
        hp_temporary:      formData.hp_temporary,
        armor_class:       formData.armor_class,
        initiative:        formData.initiative,
        speed:             formData.speed,
        proficiency_bonus: formData.proficiency_bonus,
        hit_dice:          formData.hit_dice,
        hit_dice_used:     formData.hit_dice_used,
        passive_perception:formData.passive_perception,
        inspiration:       formData.inspiration,

        // ── JSONB estructurados ────────────────────────────────────────────────
        saving_throws:     formData.saving_throws,
        skills:            formData.skills,
        death_saves:       formData.death_saves,
        attacks:           formData.attacks,
        spellcasting: {
          ...formData.spellcasting,
          spells: startingSpells.length > 0 
            ? startingSpells.map(s => ({ name: s.name, level: s.level, prepared: false }))
            : formData.spellcasting.spells,
        },
        currency:          formData.currency,
        allies_organizations: formData.allies_organizations,

        // ── Equipo ────────────────────────────────────────────────────────────
        // Si seleccionó ítems del picker, serializarlos; si no, el texto del campo
        equipment: startingEquipment.length > 0
          ? JSON.stringify(startingEquipment)
          : formData.equipment,
        treasure: formData.treasure,

        // ── Personalidad ──────────────────────────────────────────────────────
        personality_traits: formData.personality_traits,
        ideals:             formData.ideals,
        bonds:              formData.bonds,
        flaws:              formData.flaws,

        // ── Rasgos ────────────────────────────────────────────────────────────
        features_traits: startingTraits.length > 0
          ? JSON.stringify(startingTraits.map(t => ({ name: t.name, id: t.id })))
          : formData.features_traits,
        other_proficiencies: formData.other_proficiencies,
        additional_features: formData.additional_features,

        // ── Trasfondo ─────────────────────────────────────────────────────────
        backstory: formData.backstory,

        // ── Apariencia ────────────────────────────────────────────────────────
        age:        formData.age,
        height:     formData.height,
        weight:     formData.weight,
        eyes:       formData.eyes,
        skin:       formData.skin,
        hair:       formData.hair,
        appearance: formData.appearance,

        // ── Imagen ────────────────────────────────────────────────────────────
        image_url: formData.image_url,
      }
      onSubmit(submitData)
    }
  }


  const handleAddEquipment = (item) => {
    // Check if already added (by name for encyclopedia items)
    if (!startingEquipment.find(i => i.name === item.name)) {
      const newItem = {
        id: item.id || Date.now().toString(),
        name: item.name,
        quantity: 1,
        type: item.equipment_type || item.equipment_category?.name || item.type,
        weight: item.weight || 0,
      }
      setStartingEquipment([...startingEquipment, newItem])
    }
  }

  const handleRemoveEquipment = (itemId) => {
    setStartingEquipment(startingEquipment.filter(item => item.id !== itemId))
  }

  const handleQuantityChange = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveEquipment(itemId)
    } else {
      setStartingEquipment(startingEquipment.map(item =>
        item.id === itemId ? { ...item, quantity: parseInt(quantity) || 1 } : item
      ))
    }
  }

  // ── Traits functions (from Cajas branch) ─────────────────────────────────────
  const handleAddTrait = (trait) => {
    if (!startingTraits.find(t => t.id === trait.id)) {
      setStartingTraits([...startingTraits, {
        id: trait.id,
        name: trait.name,
        category: trait.trait_type || trait.category,
      }])
    }
  }

  const handleRemoveTrait = (traitId) => {
    setStartingTraits(startingTraits.filter(t => t.id !== traitId))
  }

  // ── Spells functions (from Cajas branch) ─────────────────────────────────────
  const handleAddSpell = (spell) => {
    if (!startingSpells.find(s => s.id === spell.id)) {
      setStartingSpells([...startingSpells, {
        id: spell.id,
        name: spell.name,
        level: spell.level || 0,
      }])
    }
  }

  const handleRemoveSpell = (spellId) => {
    setStartingSpells(startingSpells.filter(s => s.id !== spellId))
  }

  // ── Encyclopedia-based filters ───────────────────────────────────────────────
  const filteredEncEquipment = encSearchTerm 
    ? equipmentData.filter(item => 
        item.name.toLowerCase().includes(encSearchTerm.toLowerCase())
      )
    : equipmentData.filter(item => {
        const itemType = item.equipment_type || item.equipment_category?.name || 'other'
        return itemType === selectedEncCategory
      })

  const filteredTraits = traitsData.filter(trait => {
    let matches = true
    if (selectedTraitCategory !== 'all') {
      const traitType = trait.trait_type || trait.category
      matches = traitType === selectedTraitCategory
    }
    if (encSearchTerm) {
      matches = matches && trait.name.toLowerCase().includes(encSearchTerm.toLowerCase())
    }
    return matches
  }).sort((a, b) => a.name.localeCompare(b.name))

  const filteredSpells = spellsData.filter(spell => {
    let matches = true
    if (selectedSpellLevel !== 'all') {
      const levelNum = selectedSpellLevel === 'cantrip' ? 0 : parseInt(selectedSpellLevel)
      matches = spell.level === levelNum
    }
    if (encSearchTerm) {
      matches = matches && spell.name.toLowerCase().includes(encSearchTerm.toLowerCase())
    }
    return matches
  }).sort((a, b) => a.name.localeCompare(b.name))

  // Legacy filter for commonItems (kept for backwards compatibility)
  const filteredItems = searchTerm 
    ? commonItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : commonItems.filter(item => item.category === selectedCategory)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">Información Básica</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del Personaje *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600 ${
                submitAttempted && errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Aragorn, Merlin, etc..."
            />
            {submitAttempted && errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nivel *
            </label>
            <input
              type="number"
              name="level"
              min="1"
              max="20"
              value={formData.level}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-yellow-600 ${
                submitAttempted && errors.level ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {submitAttempted && errors.level && <p className="text-red-400 text-sm mt-1">{errors.level}</p>}
          </div>

          {/* Race */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Raza *
            </label>
            <select
              name="race"
              value={formData.race}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-yellow-600 ${
                submitAttempted && errors.race ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Seleccionar raza...</option>
              {races.map((race) => (
                <option key={race.index} value={race.index} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {race.name}
                </option>
              ))}
            </select>
            {submitAttempted && errors.race && <p className="text-red-400 text-sm mt-1">{errors.race}</p>}
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Clase *
            </label>
            <select
              name="class_"
              value={formData.class_}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-yellow-600 ${
                submitAttempted && errors.class_ ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Seleccionar clase...</option>
              {classes.map((cls) => (
                <option key={cls.index} value={cls.index} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {cls.name}
                </option>
              ))}
            </select>
            {submitAttempted && errors.class_ && <p className="text-red-400 text-sm mt-1">{errors.class_}</p>}
          </div>

          {/* Background */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trasfondo
            </label>
            <select
              name="background"
              value={formData.background}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            >
              <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Seleccionar trasfondo...</option>
              {backgrounds.map((bg) => (
                <option key={bg.index} value={bg.index} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {bg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alineación
            </label>
            <select
              name="alignment"
              value={formData.alignment}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            >
              <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Seleccionar alineación...</option>
              {alignments.map((align) => (
                <option key={align.index} value={align.index} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {align.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">🖼️ Imagen del Personaje</h2>

        {/* Image Preview */}
        <div className="mb-4">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Vista previa del personaje"
                className="w-full h-48 object-cover rounded-lg border border-gray-600"
              />
              <button
                onClick={handleRemoveImage}
                type="button"
                className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-700/30 hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-300 font-medium">Haz clic para subir una imagen</p>
                <p className="text-gray-500 text-sm">PNG, JPG, WebP • Máx 5MB</p>
              </div>
            </div>
          )}
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Buttons Section */}
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            {imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
          </button>

          <button
            onClick={() => setShowCamera(true)}
            type="button"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Camera size={18} />
            📸 Escanear
          </button>
        </div>

        {/* Camera Capture Modal */}
        {showCamera && (
          <CameraCapture
            onCharacterDataExtracted={handleCharacterDataExtracted}
            onCancel={() => setShowCamera(false)}
          />
        )}

        {errors.image && <p className="text-red-400 text-sm mt-2">{errors.image}</p>}

        <p className="text-gray-400 text-sm mt-4 text-center">
          La imagen se mostrará en la tarjeta del personaje y será visible para otros jugadores
        </p>
      </div>

      {/* Abilities Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">Habilidades (Abilities)</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(formData.stats).map(([stat, value]) => (
            <div key={stat}>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">
                {stat.slice(0, 3)}
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={value}
                onChange={(e) => handleStatChange(stat, e.target.value)}
                className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:border-yellow-600"
              />
              <p className="text-xs text-gray-400 mt-1 text-center">
                {value > 10 ? '+' : ''}{Math.floor((value - 10) / 2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Combat Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">Combate</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* HP Max */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              HP Máximos *
            </label>
            <input
              type="number"
              name="hp_max"
              min="1"
              value={formData.hp_max}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:border-yellow-600 ${
                submitAttempted && errors.hp_max ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {submitAttempted && errors.hp_max && <p className="text-red-400 text-sm mt-1">{errors.hp_max}</p>}
          </div>

          {/* HP Current */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              HP Actuales
            </label>
            <input
              type="number"
              name="hp_current"
              min="0"
              max={formData.hp_max}
              value={formData.hp_current}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            />
          </div>

          {/* AC */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Clase de Armadura (AC)
            </label>
            <input
              type="number"
              name="armor_class"
              value={formData.armor_class}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            />
          </div>

          {/* Initiative */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Iniciativa
            </label>
            <input
              type="number"
              name="initiative"
              value={formData.initiative}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            />
          </div>

          {/* Speed */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Velocidad
            </label>
            <input
              type="number"
              name="speed"
              value={formData.speed}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            />
          </div>

          {/* Proficiency Bonus */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bonificación de Pericia
            </label>
            <input
              type="number"
              name="proficiency_bonus"
              value={formData.proficiency_bonus}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            />
          </div>

          {/* Hit Dice */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dado de Golpe
            </label>
            <input
              type="text"
              name="hit_dice"
              value={formData.hit_dice}
              onChange={handleChange}
              placeholder="1d8"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
            />
          </div>

          {/* Passive Perception */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Percepción Pasiva
            </label>
            <input
              type="number"
              name="passive_perception"
              value={formData.passive_perception}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            />
          </div>
        </div>
      </div>

      {/* Character Details Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">Detalles del Personaje</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personality Traits */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rasgos de Personalidad
            </label>
            <textarea
              name="personality_traits"
              value={formData.personality_traits}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
              placeholder="Describe los rasgos de personalidad..."
            />
          </div>

          {/* Ideals */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ideales
            </label>
            <textarea
              name="ideals"
              value={formData.ideals}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
              placeholder="¿Qué ideales defiende tu personaje?"
            />
          </div>

          {/* Bonds */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vínculos
            </label>
            <textarea
              name="bonds"
              value={formData.bonds}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
              placeholder="¿A qué personas u organizaciones está vinculado?"
            />
          </div>

          {/* Flaws */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Defectos
            </label>
            <textarea
              name="flaws"
              value={formData.flaws}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
              placeholder="¿Cuáles son sus debilidades o defectos?"
            />
          </div>

          {/* Other Proficiencies */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Otras Pericias
            </label>
            <textarea
              name="other_proficiencies"
              value={formData.other_proficiencies}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
              placeholder="Idiomas, herramientas, etc..."
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Equipo
            </label>
            <textarea
              name="equipment"
              value={formData.equipment}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
              placeholder="Armas, armaduras, objetos especiales..."
            />
          </div>

          {/* Features & Traits */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rasgos y Características
            </label>
            <textarea
              name="features_traits"
              value={formData.features_traits}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
              placeholder="Habilidades especiales, talentos, etc..."
            />
          </div>

          {/* Backstory */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trasfondo (Historia)
            </label>
            <textarea
              name="backstory"
              value={formData.backstory}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
              placeholder="Cuéntanos la historia de tu personaje..."
            />
          </div>
        </div>
      </div>

      {/* Spellcasting Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">✨ Hechicería (Spellcasting)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Spellcasting Class */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Clase de Hechicería
            </label>
            <input
              type="text"
              value={formData.spellcasting?.class || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                spellcasting: { ...prev.spellcasting, class: e.target.value }
              }))}
              placeholder="Wizard, Cleric..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
            />
          </div>

          {/* Spellcasting Ability */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Habilidad
            </label>
            <select
              value={formData.spellcasting?.ability || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                spellcasting: { ...prev.spellcasting, ability: e.target.value }
              }))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            >
              <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Seleccionar...</option>
              <option value="intelligence" style={{ background: '#1a1a1a', color: '#fff' }}>Intelligence</option>
              <option value="wisdom" style={{ background: '#1a1a1a', color: '#fff' }}>Wisdom</option>
              <option value="charisma" style={{ background: '#1a1a1a', color: '#fff' }}>Charisma</option>
            </select>
          </div>

          {/* Spell Save DC */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spell Save DC
            </label>
            <input
              type="number"
              value={formData.spellcasting?.save_dc || 0}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                spellcasting: { ...prev.spellcasting, save_dc: parseInt(e.target.value) || 0 }
              }))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            />
          </div>

          {/* Spell Attack Bonus */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spell Attack Bonus
            </label>
            <input
              type="number"
              value={formData.spellcasting?.attack_bonus || 0}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                spellcasting: { ...prev.spellcasting, attack_bonus: parseInt(e.target.value) || 0 }
              }))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-600"
            />
          </div>
        </div>

        {/* Cantrips */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🔮 Cantrips
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(formData.spellcasting?.cantrips || []).map((cantrip, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1">
                <span className="text-sm text-purple-200">{cantrip}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...(formData.spellcasting?.cantrips || [])]
                    updated.splice(idx, 1)
                    setFormData(prev => ({
                      ...prev,
                      spellcasting: { ...prev.spellcasting, cantrips: updated }
                    }))
                  }}
                  className="text-purple-400 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              id="new-cantrip-input"
              placeholder="Nombre del cantrip..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const val = e.target.value.trim()
                  if (val) {
                    setFormData(prev => ({
                      ...prev,
                      spellcasting: {
                        ...prev.spellcasting,
                        cantrips: [...(prev.spellcasting?.cantrips || []), val]
                      }
                    }))
                    e.target.value = ''
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('new-cantrip-input')
                const val = input?.value?.trim()
                if (val) {
                  setFormData(prev => ({
                    ...prev,
                    spellcasting: {
                      ...prev.spellcasting,
                      cantrips: [...(prev.spellcasting?.cantrips || []), val]
                    }
                  }))
                  input.value = ''
                }
              }}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Spells */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📜 Hechizos
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(formData.spellcasting?.spells || []).map((spell, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 rounded-full px-3 py-1">
                <span className="text-sm text-blue-200">{spell}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...(formData.spellcasting?.spells || [])]
                    updated.splice(idx, 1)
                    setFormData(prev => ({
                      ...prev,
                      spellcasting: { ...prev.spellcasting, spells: updated }
                    }))
                  }}
                  className="text-blue-400 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              id="new-spell-input"
              placeholder="Nombre del hechizo..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const val = e.target.value.trim()
                  if (val) {
                    setFormData(prev => ({
                      ...prev,
                      spellcasting: {
                        ...prev.spellcasting,
                        spells: [...(prev.spellcasting?.spells || []), val]
                      }
                    }))
                    e.target.value = ''
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('new-spell-input')
                const val = input?.value?.trim()
                if (val) {
                  setFormData(prev => ({
                    ...prev,
                    spellcasting: {
                      ...prev.spellcasting,
                      spells: [...(prev.spellcasting?.spells || []), val]
                    }
                  }))
                  input.value = ''
                }
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {formData.spellcasting?.spells?.length === 0 && formData.spellcasting?.cantrips?.length === 0 && (
            <p className="text-gray-500 text-xs mt-2 italic">
              Los hechizos detectados por el escáner aparecerán aquí automáticamente
            </p>
          )}
        </div>
      </div>

      {/* Starting Equipment Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">⚔️ Inventario Inicial</h2>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar objetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!searchTerm && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
                className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Available Items List */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Objetos Disponibles</h3>
          <div className="max-h-48 overflow-y-auto bg-gray-700/20 border border-gray-600/30 rounded-lg p-3 space-y-1">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <button
                  key={item.name}
                  onClick={() => handleAddEquipment(item)}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/40 hover:bg-yellow-600/30 border border-gray-600/50 hover:border-yellow-600/50 rounded text-left text-sm text-gray-200 hover:text-yellow-300 transition-colors"
                >
                  <span>{item.name}</span>
                  <Plus size={16} className="text-yellow-500" />
                </button>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                No hay items que coincidan
              </p>
            )}
          </div>
        </div>

        {/* Selected Equipment */}
        <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            {startingEquipment.length === 0 
              ? 'Sin objetos. Agrega algunos para comenzar.' 
              : `Equipamiento (${startingEquipment.length} objetos)`}
          </h3>

          {startingEquipment.length > 0 && (
            <div className="space-y-2">
              {startingEquipment.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-600/30 border border-gray-500/30 rounded px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-gray-400 text-xs">{item.type}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      min="1"
                      className="w-12 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center text-sm focus:outline-none focus:border-yellow-600"
                    />
                    <button
                      onClick={() => handleRemoveEquipment(item.id)}
                      type="button"
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
           ENCYCLOPEDIA PICKERS (merged from Cajas branch)
           ═══════════════════════════════════════════════════════════════════ */}

      {/* Encyclopedia Equipment Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">📦 Equipo (Enciclopedia D&D 5e)</h2>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar en la enciclopedia..."
              value={encSearchTerm}
              onChange={(e) => setEncSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!encSearchTerm && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {equipmentCategories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedEncCategory(category)}
                type="button"
                className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedEncCategory === category
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Available Items List */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Objetos de Enciclopedia</h3>
          <div className="max-h-48 overflow-y-auto bg-gray-700/20 border border-gray-600/30 rounded-lg p-3 space-y-1">
            {filteredEncEquipment.length > 0 ? (
              filteredEncEquipment.map(item => (
                <button
                  key={item.name}
                  onClick={() => handleAddEquipment(item)}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/40 hover:bg-yellow-600/30 border border-gray-600/50 hover:border-yellow-600/50 rounded text-left text-sm text-gray-200 hover:text-yellow-300 transition-colors"
                >
                  <span>{item.name}</span>
                  <Plus size={16} className="text-yellow-500" />
                </button>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                No hay items que coincidan
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Starting Traits Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">✨ Rasgos Iniciales</h2>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar rasgos..."
              value={encSearchTerm}
              onChange={(e) => setEncSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!encSearchTerm && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {traitCategories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedTraitCategory(category)}
                type="button"
                className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedTraitCategory === category
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Available Traits List */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Rasgos Disponibles</h3>
          <div className="max-h-48 overflow-y-auto bg-gray-700/20 border border-gray-600/30 rounded-lg p-3 space-y-1">
            {filteredTraits.length > 0 ? (
              filteredTraits.map(trait => (
                <button
                  key={trait.id}
                  onClick={() => handleAddTrait(trait)}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/40 hover:bg-yellow-600/30 border border-gray-600/50 hover:border-yellow-600/50 rounded text-left text-sm text-gray-200 hover:text-yellow-300 transition-colors"
                >
                  <span>{trait.name}</span>
                  <Plus size={16} className="text-yellow-500" />
                </button>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                No hay rasgos que coincidan
              </p>
            )}
          </div>
        </div>

        {/* Selected Traits */}
        <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            {startingTraits.length === 0 
              ? 'Sin rasgos seleccionados' 
              : `Rasgos (${startingTraits.length})`}
          </h3>

          {startingTraits.length > 0 && (
            <div className="space-y-2">
              {startingTraits.map(trait => (
                <div
                  key={trait.id}
                  className="flex items-center justify-between bg-gray-600/30 border border-gray-500/30 rounded px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{trait.name}</p>
                    <p className="text-gray-400 text-xs">{trait.category}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveTrait(trait.id)}
                    type="button"
                    className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Starting Spells Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-yellow-600 mb-6">🔮 Hechizos Iniciales</h2>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar hechizos..."
              value={encSearchTerm}
              onChange={(e) => setEncSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-600"
            />
          </div>
        </div>

        {/* Level Tabs */}
        {!encSearchTerm && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {spellLevels.map(level => (
              <button
                key={level}
                onClick={() => setSelectedSpellLevel(level)}
                type="button"
                className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSpellLevel === level
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {level === 'all' ? 'Todos' : level === 'cantrip' ? 'Cantrips' : `Lvl ${level}`}
              </button>
            ))}
          </div>
        )}

        {/* Available Spells List */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Hechizos Disponibles</h3>
          <div className="max-h-48 overflow-y-auto bg-gray-700/20 border border-gray-600/30 rounded-lg p-3 space-y-1">
            {filteredSpells.length > 0 ? (
              filteredSpells.map(spell => (
                <button
                  key={spell.id}
                  onClick={() => handleAddSpell(spell)}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/40 hover:bg-yellow-600/30 border border-gray-600/50 hover:border-yellow-600/50 rounded text-left text-sm text-gray-200 hover:text-yellow-300 transition-colors"
                >
                  <span>{spell.name} {spell.level > 0 && `(Lvl ${spell.level})`}</span>
                  <Plus size={16} className="text-yellow-500" />
                </button>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                No hay hechizos que coincidan
              </p>
            )}
          </div>
        </div>

        {/* Selected Spells */}
        <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            {startingSpells.length === 0 
              ? 'Sin hechizos seleccionados' 
              : `Hechizos (${startingSpells.length})`}
          </h3>

          {startingSpells.length > 0 && (
            <div className="space-y-2">
              {startingSpells.map(spell => (
                <div
                  key={spell.id}
                  className="flex items-center justify-between bg-gray-600/30 border border-gray-500/30 rounded px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{spell.name}</p>
                    <p className="text-gray-400 text-xs">Nivel {spell.level === 0 ? 'Cantrip' : spell.level}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveSpell(spell.id)}
                    type="button"
                    className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold rounded-lg transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Save size={20} />
          {loading ? 'Creando...' : 'Crear Personaje'}
        </button>
      </div>
    </form>
  )
}

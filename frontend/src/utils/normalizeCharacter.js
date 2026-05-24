const STAT_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

const SKILL_STAT_MAP = {
  acrobatics:     'dexterity',
  animal_handling:'wisdom',
  arcana:         'intelligence',
  athletics:      'strength',
  deception:      'charisma',
  history:        'intelligence',
  insight:        'wisdom',
  intimidation:   'charisma',
  investigation:  'intelligence',
  medicine:       'wisdom',
  nature:         'intelligence',
  perception:     'wisdom',
  performance:    'charisma',
  persuasion:     'charisma',
  religion:       'intelligence',
  sleight_of_hand:'dexterity',
  stealth:        'dexterity',
  survival:       'wisdom',
}

export const SKILL_NAMES = Object.keys(SKILL_STAT_MAP)

export { SKILL_STAT_MAP }

function defaultSavingThrows() {
  return Object.fromEntries(
    STAT_NAMES.map(s => [s, { proficient: false }])
  )
}

function defaultSkills() {
  return Object.fromEntries(
    SKILL_NAMES.map(s => [s, { proficient: false, expertise: false }])
  )
}

function defaultAttacks() {
  return [
    { name: '', attack_bonus: '+0', damage: '', damage_type: '' },
    { name: '', attack_bonus: '+0', damage: '', damage_type: '' },
    { name: '', attack_bonus: '+0', damage: '', damage_type: '' },
  ]
}

function defaultDeathSaves() {
  return { successes: 0, failures: 0 }
}

function defaultSpellcasting() {
  return {
    class: '',
    ability: '',
    save_dc: 0,
    attack_bonus: 0,
    slots: Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [String(i + 1), { total: 0, used: 0 }])
    ),
    cantrips: [],
    spells: [],
  }
}

function defaultCurrency() {
  return { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
}

function defaultAlliesOrganizations() {
  return { text: '', symbol: '' }
}

function mergeWithDefaults(existing, defaults) {
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    return defaults
  }
  const merged = { ...defaults }
  for (const key of Object.keys(existing)) {
    if (existing[key] !== undefined && existing[key] !== null) {
      merged[key] = existing[key]
    }
  }
  return merged
}

function normalizeSavingThrows(raw) {
  const defaults = defaultSavingThrows()
  if (!raw || typeof raw !== 'object') return defaults
  return Object.fromEntries(
    STAT_NAMES.map(s => [
      s,
      {
        proficient: raw[s]?.proficient ?? false,
      },
    ])
  )
}

function normalizeSkills(raw) {
  const defaults = defaultSkills()
  if (!raw || typeof raw !== 'object') return defaults
  return Object.fromEntries(
    SKILL_NAMES.map(s => [
      s,
      {
        proficient: raw[s]?.proficient ?? false,
        expertise:  raw[s]?.expertise  ?? false,
      },
    ])
  )
}

function normalizeSpellcasting(raw) {
  const defaults = defaultSpellcasting()
  if (!raw || typeof raw !== 'object') return defaults

  return {
    class:        raw.class        ?? defaults.class,
    ability:      raw.ability      ?? defaults.ability,
    save_dc:      raw.save_dc      ?? defaults.save_dc,
    attack_bonus: raw.attack_bonus ?? defaults.attack_bonus,
    slots: Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => {
        const lvl = String(i + 1)
        return [lvl, {
          total: raw.slots?.[lvl]?.total ?? 0,
          used:  raw.slots?.[lvl]?.used  ?? 0,
        }]
      })
    ),
    cantrips: Array.isArray(raw.cantrips) ? raw.cantrips : [],
    spells:   Array.isArray(raw.spells)   ? raw.spells   : [],
  }
}

function normalizeAttacks(raw) {
  const base = defaultAttacks()
  if (!Array.isArray(raw) || raw.length === 0) return base

  const normalized = raw.map(a => ({
    name:         a.name         ?? '',
    attack_bonus: a.attack_bonus ?? '+0',
    damage:       a.damage       ?? '',
    damage_type:  a.damage_type  ?? '',
  }))

  // Rellenar hasta 3 si hay menos
  while (normalized.length < 3) {
    normalized.push({ name: '', attack_bonus: '+0', damage: '', damage_type: '' })
  }
  return normalized
}

export function normalizeCharacter(raw) {
  if (!raw) return null

  return {
    id:                  raw.id,
    campaign_id:         raw.campaign_id ?? null,
    player_id:           raw.player_id   ?? null,

    name:                raw.name        ?? '',
    race:                raw.race        ?? '',
    class_:              raw.class_      ?? raw.class ?? '',   // BD usa "class"
    subclass:            raw.subclass    ?? '',
    level:               raw.level       ?? 1,
    background:          raw.background  ?? '',
    alignment:           raw.alignment   ?? '',
    experience_points:   raw.experience_points ?? 0,
    player_name:         raw.player_name ?? '',

    stats: {
      strength:     raw.stats?.strength     ?? 10,
      dexterity:    raw.stats?.dexterity    ?? 10,
      constitution: raw.stats?.constitution ?? 10,
      intelligence: raw.stats?.intelligence ?? 10,
      wisdom:       raw.stats?.wisdom       ?? 10,
      charisma:     raw.stats?.charisma     ?? 10,
    },

    hp_max:           raw.hp_max          ?? 1,
    hp_current:       raw.hp_current      ?? 1,
    hp_temporary:     raw.hp_temporary    ?? 0,
    armor_class:      raw.armor_class     ?? 10,
    initiative:       raw.initiative      ?? 0,
    speed:            raw.speed           ?? 30,
    proficiency_bonus: raw.proficiency_bonus ?? 2,
    hit_dice:         raw.hit_dice        ?? '1d8',
    hit_dice_used:    raw.hit_dice_used   ?? 0,
    passive_perception: raw.passive_perception ?? 10,
    inspiration:      raw.inspiration     ?? false,
    is_alive:         raw.is_alive        ?? true,

    saving_throws: normalizeSavingThrows(raw.saving_throws),
    skills:        normalizeSkills(raw.skills),

    death_saves: mergeWithDefaults(raw.death_saves, defaultDeathSaves()),

    attacks: normalizeAttacks(raw.attacks),

    equipment: raw.equipment ?? '',
    currency:  mergeWithDefaults(raw.currency, defaultCurrency()),
    treasure:  raw.treasure  ?? '',

    spellcasting: normalizeSpellcasting(raw.spellcasting),

    personality_traits: raw.personality_traits ?? '',
    ideals:             raw.ideals             ?? '',
    bonds:              raw.bonds              ?? '',
    flaws:              raw.flaws              ?? '',

    features_traits:     raw.features_traits     ?? '',
    other_proficiencies: raw.other_proficiencies ?? '',
    additional_features: raw.additional_features ?? '',

    backstory:            raw.backstory ?? '',
    allies_organizations: mergeWithDefaults(raw.allies_organizations, defaultAlliesOrganizations()),

    age:        raw.age        ?? '',
    height:     raw.height     ?? '',
    weight:     raw.weight     ?? '',
    eyes:       raw.eyes       ?? '',
    skin:       raw.skin       ?? '',
    hair:       raw.hair       ?? '',
    appearance: raw.appearance ?? '',

    image_url: raw.image_url ?? null,

    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  }
}

export function getAbilityModifier(score) {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

/** Proficiency bonus por nivel (tabla oficial D&D 5e) */
export function getProficiencyBonus(level) {
  if (level >= 17) return 6
  if (level >= 13) return 5
  if (level >= 9)  return 4
  if (level >= 5)  return 3
  return 2
}

/** Valor de una skill: statMod + (prof ? profBonus : 0) + (expertise ? profBonus : 0) */
export function getSkillValue(character, skillName) {
  const stat  = SKILL_STAT_MAP[skillName]
  const score = character.stats?.[stat] ?? 10
  const mod   = getAbilityModifier(score)
  const prof  = getProficiencyBonus(character.level ?? 1)
  const skillData = character.skills?.[skillName] ?? {}
  const bonus = skillData.expertise ? prof * 2 : skillData.proficient ? prof : 0
  return mod + bonus
}

/** Valor de un saving throw: statMod + (prof ? profBonus : 0) */
export function getSavingThrowValue(character, statName) {
  const score = character.stats?.[statName] ?? 10
  const mod   = getAbilityModifier(score)
  const prof  = getProficiencyBonus(character.level ?? 1)
  const stData = character.saving_throws?.[statName] ?? {}
  return stData.proficient ? mod + prof : mod
}

/** Passive Perception: 10 + Perception skill value */
export function getPassivePerception(character) {
  return 10 + getSkillValue(character, 'perception')
}


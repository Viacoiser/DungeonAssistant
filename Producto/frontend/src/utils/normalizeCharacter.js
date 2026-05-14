/**
 * normalizeCharacter.js
 * Normaliza un personaje crudo de la BD al contrato completo D&D 5e.
 * Aplica defaults para campos JSONB faltantes o vacíos sin sobrescribir
 * datos existentes — compatible con personajes creados antes de la Fase 1.
 */

// ── Defaults JSONB ─────────────────────────────────────────────────────────────

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

/** Skill → stat base */
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

// ── Merge helpers ──────────────────────────────────────────────────────────────

/**
 * Fusiona un objeto existente con defaults, sin sobrescribir claves ya presentes.
 * Recorre un nivel de profundidad (suficiente para JSONB planos).
 */
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

/**
 * Normaliza saving_throws: garantiza que los 6 stats tengan la estructura
 * { proficient: bool } sin borrar lo que ya tiene.
 */
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

/**
 * Normaliza skills: garantiza que las 18 habilidades tengan
 * { proficient: bool, expertise: bool } sin borrar lo que ya tiene.
 */
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

/**
 * Normaliza spellcasting: fusiona con la estructura completa.
 */
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

/**
 * Normaliza attacks: garantiza exactamente 3 filas con la estructura correcta.
 * Si hay más de 3, las preserva todas.
 */
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

// ── Normalizer principal ───────────────────────────────────────────────────────

/**
 * normalizeCharacter(rawCharacter)
 * 
 * Recibe el objeto crudo tal como viene de la BD/API y retorna
 * un objeto con todos los campos del contrato D&D 5e correctamente
 * tipados y con defaults aplicados.
 * 
 * Es seguro llamarlo múltiples veces (idempotente).
 */
export function normalizeCharacter(raw) {
  if (!raw) return null

  return {
    // ── Identificadores ────────────────────────────────────────────────────────
    id:                  raw.id,
    campaign_id:         raw.campaign_id ?? null,
    player_id:           raw.player_id   ?? null,

    // ── Identificación del personaje ──────────────────────────────────────────
    name:                raw.name        ?? '',
    race:                raw.race        ?? '',
    class_:              raw.class_      ?? raw.class ?? '',   // BD usa "class"
    subclass:            raw.subclass    ?? '',
    level:               raw.level       ?? 1,
    background:          raw.background  ?? '',
    alignment:           raw.alignment   ?? '',
    experience_points:   raw.experience_points ?? 0,
    player_name:         raw.player_name ?? '',

    // ── Stats base ────────────────────────────────────────────────────────────
    stats: {
      strength:     raw.stats?.strength     ?? 10,
      dexterity:    raw.stats?.dexterity    ?? 10,
      constitution: raw.stats?.constitution ?? 10,
      intelligence: raw.stats?.intelligence ?? 10,
      wisdom:       raw.stats?.wisdom       ?? 10,
      charisma:     raw.stats?.charisma     ?? 10,
    },

    // ── Combate ───────────────────────────────────────────────────────────────
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

    // ── Tiradas de salvación y habilidades ────────────────────────────────────
    saving_throws: normalizeSavingThrows(raw.saving_throws),
    skills:        normalizeSkills(raw.skills),

    // ── Death saves ───────────────────────────────────────────────────────────
    death_saves: mergeWithDefaults(raw.death_saves, defaultDeathSaves()),

    // ── Ataques ───────────────────────────────────────────────────────────────
    attacks: normalizeAttacks(raw.attacks),

    // ── Equipo e inventario ───────────────────────────────────────────────────
    equipment: raw.equipment ?? '',
    currency:  mergeWithDefaults(raw.currency, defaultCurrency()),
    treasure:  raw.treasure  ?? '',

    // ── Spellcasting ──────────────────────────────────────────────────────────
    spellcasting: normalizeSpellcasting(raw.spellcasting),

    // ── Personalidad ──────────────────────────────────────────────────────────
    personality_traits: raw.personality_traits ?? '',
    ideals:             raw.ideals             ?? '',
    bonds:              raw.bonds              ?? '',
    flaws:              raw.flaws              ?? '',

    // ── Rasgos y características ──────────────────────────────────────────────
    features_traits:     raw.features_traits     ?? '',
    other_proficiencies: raw.other_proficiencies ?? '',
    additional_features: raw.additional_features ?? '',

    // ── Trasfondo ─────────────────────────────────────────────────────────────
    backstory:            raw.backstory ?? '',
    allies_organizations: mergeWithDefaults(raw.allies_organizations, defaultAlliesOrganizations()),

    // ── Apariencia física ─────────────────────────────────────────────────────
    age:        raw.age        ?? '',
    height:     raw.height     ?? '',
    weight:     raw.weight     ?? '',
    eyes:       raw.eyes       ?? '',
    skin:       raw.skin       ?? '',
    hair:       raw.hair       ?? '',
    appearance: raw.appearance ?? '',

    // ── Imagen ────────────────────────────────────────────────────────────────
    image_url: raw.image_url ?? null,

    // ── Timestamps ────────────────────────────────────────────────────────────
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  }
}

// ── Calculadores derivados ─────────────────────────────────────────────────────

/** Modificador de habilidad estándar D&D 5e */
export function getAbilityModifier(score) {
  return Math.floor((score - 10) / 2)
}

/** Signo + para positivos */
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

/** Spell Save DC: 8 + profBonus + spellcasting ability mod */
export function getSpellSaveDC(character) {
  const ability = character.spellcasting?.ability
  if (!ability) return 8 + getProficiencyBonus(character.level ?? 1)
  const score = character.stats?.[ability.toLowerCase()] ?? 10
  return 8 + getProficiencyBonus(character.level ?? 1) + getAbilityModifier(score)
}

import React, { useState, useCallback } from 'react'
import {
  Camera, RotateCcw, ArrowRight, Plus, X
} from 'lucide-react'

// ─── Alignment slug normalization ──────────────────────────────────────────────
function normalizeAlignment(raw) {
  if (!raw) return ''
  const s = raw.toLowerCase().trim()
  const map = {
    'lawful good': 'lawful-good', 'neutral good': 'neutral-good', 'chaotic good': 'chaotic-good',
    'lawful neutral': 'lawful-neutral', 'true neutral': 'true-neutral', 'neutral': 'true-neutral',
    'chaotic neutral': 'chaotic-neutral', 'lawful evil': 'lawful-evil',
    'neutral evil': 'neutral-evil', 'chaotic evil': 'chaotic-evil',
    'lawful-good': 'lawful-good', 'neutral-good': 'neutral-good', 'chaotic-good': 'chaotic-good',
    'lawful-neutral': 'lawful-neutral', 'true-neutral': 'true-neutral',
    'chaotic-neutral': 'chaotic-neutral', 'lawful-evil': 'lawful-evil',
    'neutral-evil': 'neutral-evil', 'chaotic-evil': 'chaotic-evil',
  }
  return map[s] ?? raw
}

// ─── Same labels as the sheet components ───────────────────────────────────────

// AbilityScores.jsx: STR/DEX/CON/INT/WIS/CHA
const STAT_LABELS = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
}
const STATS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

// SavingThrows.jsx: exact labels
const SAVES = [
  { key: 'strength', label: 'Strength' },
  { key: 'dexterity', label: 'Dexterity' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'wisdom', label: 'Wisdom' },
  { key: 'charisma', label: 'Charisma' },
]

// SkillList.jsx: exact labels
const SKILL_LABELS = {
  acrobatics: 'Acrobatics', animal_handling: 'Animal Handling', arcana: 'Arcana',
  athletics: 'Athletics', deception: 'Deception', history: 'History',
  insight: 'Insight', intimidation: 'Intimidation', investigation: 'Investigation',
  medicine: 'Medicine', nature: 'Nature', perception: 'Perception',
  performance: 'Performance', persuasion: 'Persuasion', religion: 'Religion',
  sleight_of_hand: 'Sleight of Hand', stealth: 'Stealth', survival: 'Survival',
}

// SpellcastingPanel.jsx ability abbreviations
const ABILITY_ABBR = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
}

// SheetHeader alignment map
const ALIGNMENT_MAP = {
  'lawful-good': 'Lawful Good', 'neutral-good': 'Neutral Good', 'chaotic-good': 'Chaotic Good',
  'lawful-neutral': 'Lawful Neutral', 'true-neutral': 'True Neutral', 'chaotic-neutral': 'Chaotic Neutral',
  'lawful-evil': 'Lawful Evil', 'neutral-evil': 'Neutral Evil', 'chaotic-evil': 'Chaotic Evil',
}

// ─── Shared style primitives (matching cs- variables from CharacterSheet5e.css) ─
const CS_SURFACE = 'rgba(33,27,18,0.95)'
const CS_SURFACE_2 = 'rgba(45,35,24,0.95)'
const CS_BORDER = 'rgba(180,140,60,0.18)'
const CS_BORDER_A = 'rgba(200,147,42,0.45)'
const CS_GOLD = '#c8932a'
const CS_GOLD_L = '#e4b86a'
const CS_TEXT = '#e8d5a3'
const CS_TEXT_MUT = 'rgba(232,213,163,0.55)'
const CS_TEXT_DIM = 'rgba(232,213,163,0.3)'
const CS_PROF = '#5a9fd4'

// ─── Sub-components matching the sheet UI ──────────────────────────────────────



function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ background: CS_SURFACE, border: `1px solid ${CS_BORDER}`, borderRadius: 4, overflow: 'hidden', marginBottom: '0.75rem' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: CS_SURFACE_2, border: 'none', borderBottom: open ? `1px solid ${CS_BORDER_A}` : 'none',
          padding: '0.35rem 0.75rem', cursor: 'pointer',
          fontFamily: 'Cinzel, serif', fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase', color: CS_GOLD,
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '0.65rem', color: CS_TEXT_DIM }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '0.75rem' }}>{children}</div>}
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'Cinzel, serif', fontSize: '0.52rem', letterSpacing: '0.14em',
      textTransform: 'uppercase', color: CS_GOLD,
      borderBottom: `1px solid ${CS_BORDER}`, paddingBottom: '0.2rem', marginBottom: '0.4rem',
    }}>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.35rem 0.5rem', boxSizing: 'border-box',
  background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`,
  borderRadius: 4, color: CS_TEXT, fontSize: '0.82rem', outline: 'none',
  fontFamily: 'Inter, sans-serif',
}

const textareaStyle = {
  ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.5,
}

function Input({ value, onChange, type = 'text', placeholder = '', min, max, style }) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      min={min} max={max}
      onChange={onChange}
      style={{ ...inputStyle, ...style }}
    />
  )
}

function Textarea({ value, onChange, placeholder = '', rows = 3 }) {
  return (
    <textarea
      value={value} placeholder={placeholder} rows={rows}
      onChange={onChange}
      style={textareaStyle}
    />
  )
}

function CsField({ label, children }) {
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

// ─── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }) {
  const pct = Math.round((confidence || 0) * 100)
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const icon = pct >= 80 ? '✅' : pct >= 50 ? '⚠️' : '❌'
  const label = pct >= 80 ? 'Alta confianza' : pct >= 50 ? 'Confianza media' : 'Confianza baja'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.3rem 0.8rem', borderRadius: 999,
      background: `${color}22`, border: `1px solid ${color}55`,
      fontSize: '0.78rem', fontWeight: 700, color,
      fontFamily: 'Inter, sans-serif',
    }}>
      {icon} {label} — {pct}%
    </span>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OCRReviewModal({ ocrData, onConfirm, onRescan, onCancel }) {
  const [data, setData] = useState(() => ({
    // Header fields (SheetHeader)
    character_name: ocrData?.character_name || '',
    race: ocrData?.race || '',
    class: ocrData?.class || '',
    subclass: ocrData?.subclass || '',
    level: ocrData?.level || 1,
    background: ocrData?.background || '',
    alignment: ocrData?.alignment || '',
    player_name: ocrData?.player_name || '',
    experience_points: ocrData?.experience_points || 0,

    // Ability Scores (AbilityScores.jsx)
    stats: {
      strength: ocrData?.stats?.strength ?? 10,
      dexterity: ocrData?.stats?.dexterity ?? 10,
      constitution: ocrData?.stats?.constitution ?? 10,
      intelligence: ocrData?.stats?.intelligence ?? 10,
      wisdom: ocrData?.stats?.wisdom ?? 10,
      charisma: ocrData?.stats?.charisma ?? 10,
    },
    proficiency_bonus: ocrData?.proficiency_bonus ?? 2,
    inspiration: ocrData?.inspiration || false,

    // Combat (CombatStats.jsx)
    armor_class: ocrData?.armor_class ?? 10,
    initiative: ocrData?.initiative ?? 0,
    speed: ocrData?.speed ?? 30,
    hp_max: ocrData?.hp_max ?? 0,
    hp_current: ocrData?.hp_current ?? 0,
    hp_temporary: ocrData?.hp_temporary ?? 0,
    hit_dice: ocrData?.hit_dice || '',
    passive_perception: ocrData?.passive_perception ?? 10,

    // Saving Throws (SavingThrows.jsx)
    saving_throws: ocrData?.saving_throws || {},

    // Skills (SkillList.jsx)
    skills: ocrData?.skills || {},

    // Attacks & Spellcasting (AttacksTable.jsx)
    attacks: ocrData?.attacks || [],

    // Spellcasting (SpellcastingPanel.jsx)
    spellcasting_class: ocrData?.spellcasting_class || '',
    spellcasting_ability: ocrData?.spellcasting_ability || '',
    spell_save_dc: ocrData?.spell_save_dc ?? 0,
    spell_attack_bonus: ocrData?.spell_attack_bonus ?? 0,
    cantrips: ocrData?.cantrips || [],
    spells: ocrData?.spells || [],

    // Equipment & Treasure (EquipmentPanel.jsx)
    equipment: ocrData?.equipment || '',
    currency: {
      cp: ocrData?.currency?.cp ?? 0,
      sp: ocrData?.currency?.sp ?? 0,
      ep: ocrData?.currency?.ep ?? 0,
      gp: ocrData?.currency?.gp ?? 0,
      pp: ocrData?.currency?.pp ?? 0,
    },

    // Personality (PersonalityPanel.jsx)
    personality_traits: ocrData?.personality_traits || '',
    ideals: ocrData?.ideals || '',
    bonds: ocrData?.bonds || '',
    flaws: ocrData?.flaws || '',

    // Features (FeaturesPanel.jsx)
    features_traits: ocrData?.features_traits || '',
    other_proficiencies: ocrData?.other_proficiencies || '',

    // Backstory (BackstoryPanel.jsx)
    backstory: ocrData?.backstory || '',

    confidence: ocrData?.confidence,
  }))

  const set = useCallback((field, value) => setData(d => ({ ...d, [field]: value })), [])

  const setStat = useCallback((stat, value) =>
    setData(d => ({ ...d, stats: { ...d.stats, [stat]: parseInt(value) || 0 } })), [])

  const setCurrency = useCallback((coin, value) =>
    setData(d => ({ ...d, currency: { ...d.currency, [coin]: parseInt(value) || 0 } })), [])

  const setAtk = useCallback((i, field, value) =>
    setData(d => {
      const attacks = [...d.attacks]
      attacks[i] = { ...attacks[i], [field]: value }
      return { ...d, attacks }
    }), [])

  const addAtk = () => setData(d => ({
    ...d,
    attacks: [...d.attacks, { name: '', attack_bonus: '+0', damage: '', damage_type: '' }]
  }))
  const removeAtk = (i) => setData(d => ({ ...d, attacks: d.attacks.filter((_, j) => j !== i) }))

  // SavingThrows: click cycles proficiency (matching SavingThrows.jsx toggleProficiency)
  const toggleSave = (key) => setData(d => ({
    ...d,
    saving_throws: {
      ...d.saving_throws,
      [key]: { proficient: !d.saving_throws?.[key]?.proficient }
    }
  }))

  // Skills: click cycles none → proficient → expertise (matching SkillList.jsx cycleSkill)
  const cycleSkill = (skill) => setData(d => {
    const current = d.skills?.[skill] || {}
    let next
    if (!current.proficient) {
      next = { proficient: true, expertise: false }
    } else if (!current.expertise) {
      next = { proficient: true, expertise: true }
    } else {
      next = { proficient: false, expertise: false }
    }
    return { ...d, skills: { ...d.skills, [skill]: next } }
  })

  const COIN_COLORS = { cp: '#b87333', sp: '#c0c0c0', ep: '#b0c4de', gp: '#ffd700', pp: '#e5e4e2' }

  const handleConfirm = () => {
    onConfirm({ ...data, alignment: normalizeAlignment(data.alignment) })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#0d0b08',
        border: `1px solid ${CS_BORDER_A}`,
        borderRadius: 8, width: '100%', maxWidth: 860,
        maxHeight: '94vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 0 1px rgba(200,147,42,0.1), 0 24px 80px rgba(0,0,0,0.9)',
        fontFamily: 'Inter, sans-serif',
      }}>

        {/* ── Header (matches cs-header style) ──────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1208 0%, #130f07 60%, #1e1a0e 100%)',
          borderBottom: `1px solid ${CS_BORDER_A}`,
          padding: '0.85rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0,
          position: 'relative',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 6,
            border: `2px solid ${CS_BORDER_A}`,
            background: CS_SURFACE_2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: CS_GOLD, flexShrink: 0,
          }}>
            <Camera size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
              Revisar OCR
            </div>
            <div style={{ fontSize: '0.75rem', color: CS_GOLD_L, marginTop: '0.15rem', letterSpacing: '0.04em' }}>
              Editar y confirmar — los campos coinciden con la hoja de personaje exactamente
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <ConfidenceBadge confidence={data.confidence} />
            </div>
          </div>
          <button onClick={onCancel} style={{
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${CS_BORDER}`,
            borderRadius: 4, color: CS_TEXT_MUT, cursor: 'pointer',
            padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontFamily: 'Cinzel, serif',
          }}>✕ Cerrar</button>
          {/* gold line bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${CS_GOLD}, transparent)`,
            opacity: 0.4,
          }} />
        </div>

        {/* ── Scrollable body ───────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>

          {/* ══ CHARACTER IDENTITY (matches SheetHeader) ══════════ */}
          <Section title="Character Identity" defaultOpen={true}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <CsField label="Character Name">
                <Input value={data.character_name} onChange={e => set('character_name', e.target.value)} placeholder="Character name" />
              </CsField>
              <CsField label="Level">
                <Input type="number" value={data.level} min={1} max={20} onChange={e => set('level', parseInt(e.target.value) || 1)} />
              </CsField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <CsField label="Race">
                <Input value={data.race} onChange={e => set('race', e.target.value)} placeholder="Elf, Dwarf..." />
              </CsField>
              <CsField label="Class">
                <Input value={data.class} onChange={e => set('class', e.target.value)} placeholder="Fighter, Wizard..." />
              </CsField>
              <CsField label="Subclass">
                <Input value={data.subclass} onChange={e => set('subclass', e.target.value)} placeholder="Subclass..." />
              </CsField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.6rem' }}>
              <CsField label="Background">
                <Input value={data.background} onChange={e => set('background', e.target.value)} placeholder="Soldier, Noble..." />
              </CsField>
              <CsField label="Alignment">
                <select value={data.alignment} onChange={e => set('alignment', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', background: CS_SURFACE_2 }}>
                  <option value="">None</option>
                  {Object.entries(ALIGNMENT_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </CsField>
              <CsField label="Player Name">
                <Input value={data.player_name} onChange={e => set('player_name', e.target.value)} placeholder="Your name..." />
              </CsField>
              <CsField label="Experience">
                <Input type="number" value={data.experience_points} min={0} onChange={e => set('experience_points', parseInt(e.target.value) || 0)} />
              </CsField>
            </div>
          </Section>

          {/* ══ ABILITY SCORES (matches AbilityScores.jsx exactly) ══ */}
          <Section title="Ability Scores">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) auto', gap: '0.4rem', alignItems: 'end' }}>
              {STATS.map(stat => {
                const score = data.stats[stat] ?? 10
                const mod = Math.floor((score - 10) / 2)
                return (
                  <div key={stat} style={{
                    background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`,
                    borderRadius: 4, padding: '0.5rem 0.3rem', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.12em', color: CS_TEXT_DIM, textTransform: 'uppercase', marginBottom: 4 }}>
                      {STAT_LABELS[stat]}
                    </div>
                    <input
                      type="number" min={1} max={30} value={score}
                      onChange={e => setStat(stat, e.target.value)}
                      style={{
                        width: '100%', padding: '0.3rem 0.15rem', textAlign: 'center',
                        background: 'rgba(0,0,0,0.3)', border: `1px solid ${CS_BORDER}`,
                        borderRadius: 3, color: '#fff', fontSize: '1.35rem',
                        fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <div style={{
                      fontFamily: 'Oswald, Inter, sans-serif', fontSize: '0.85rem', fontWeight: 500,
                      color: mod >= 0 ? CS_GOLD_L : '#fca5a5', marginTop: 3,
                    }}>
                      {mod >= 0 ? '+' : ''}{mod}
                    </div>
                  </div>
                )
              })}
              {/* Proficiency Bonus - matches AbilityScores.jsx */}
              <div style={{
                background: CS_SURFACE_2, border: `1px solid ${CS_BORDER_A}`,
                borderRadius: 4, padding: '0.6rem 0.4rem', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.48rem', letterSpacing: '0.12em', color: CS_TEXT_DIM, textTransform: 'uppercase', marginBottom: 4 }}>
                  Prof<br />Bonus
                </div>
                <input
                  type="number" value={data.proficiency_bonus}
                  onChange={e => set('proficiency_bonus', parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.3rem 0.1rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${CS_BORDER}`, borderRadius: 3, color: CS_GOLD, fontSize: '1.1rem', fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            {/* Inspiration */}
            <div
              onClick={() => set('inspiration', !data.inspiration)}
              style={{
                marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.3rem 0.75rem', borderRadius: 4, cursor: 'pointer',
                background: data.inspiration ? 'rgba(200,147,42,0.15)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${data.inspiration ? CS_GOLD : CS_BORDER}`,
                color: data.inspiration ? CS_GOLD : CS_TEXT_DIM,
                fontFamily: 'Cinzel, serif', fontSize: '0.65rem', letterSpacing: '0.1em',
                userSelect: 'none',
              }}
            >
              ✦ Inspiration {data.inspiration ? '(active)' : ''}
            </div>
          </Section>

          {/* ══ COMBAT STATS (matches CombatStats.jsx) ═══════════ */}
          <Section title="Combat" defaultOpen={true}>
            {/* Row 1: Armor Class / Initiative / Speed */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[
                { label: 'Armor Class', field: 'armor_class' },
                { label: 'Initiative', field: 'initiative' },
                { label: 'Speed', field: 'speed', suffix: 'ft' },
              ].map(({ label, field, suffix }) => (
                <div key={field} style={{ background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`, borderRadius: 4, padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.48rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: CS_TEXT_DIM, marginBottom: '0.25rem' }}>{label}</div>
                  <input
                    type="number" value={data[field]}
                    onChange={e => set(field, parseInt(e.target.value) || 0)}
                    style={{ width: '100%', textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${CS_BORDER}`, borderRadius: 3, color: '#fff', fontSize: '1.35rem', fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 700, outline: 'none', padding: '0.25rem 0', boxSizing: 'border-box' }}
                  />
                  {suffix && <span style={{ fontSize: '0.6rem', color: CS_TEXT_DIM }}>{suffix}</span>}
                </div>
              ))}
            </div>

            {/* Hit Points */}
            <div style={{ background: 'rgba(139,32,32,0.08)', border: '1px solid rgba(139,32,32,0.2)', borderRadius: 4, padding: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.52rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: CS_TEXT_DIM, textAlign: 'center', marginBottom: '0.5rem' }}>
                Hit Points
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.5rem', color: CS_TEXT_DIM, marginBottom: 2 }}>Current</div>
                  <input type="number" value={data.hp_current} onChange={e => set('hp_current', parseInt(e.target.value) || 0)}
                    style={{ width: '4rem', textAlign: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(139,32,32,0.3)', borderRadius: 3, color: '#f87171', fontSize: '1.6rem', fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 700, outline: 'none', padding: '0.1rem', boxSizing: 'border-box' }} />
                </div>
                <span style={{ color: CS_TEXT_DIM, fontSize: '1.2rem' }}>/</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.5rem', color: CS_TEXT_DIM, marginBottom: 2 }}>Max</div>
                  <input type="number" value={data.hp_max} onChange={e => set('hp_max', parseInt(e.target.value) || 0)}
                    style={{ width: '4rem', textAlign: 'center', background: 'rgba(0,0,0,0.4)', border: `1px solid ${CS_BORDER}`, borderRadius: 3, color: CS_TEXT_MUT, fontSize: '1.1rem', fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 600, outline: 'none', padding: '0.1rem', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Temp HP + Hit Dice */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`, borderRadius: 4, padding: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CS_TEXT_DIM, marginBottom: '0.2rem' }}>Temp HP</div>
                <input type="number" value={data.hp_temporary} onChange={e => set('hp_temporary', parseInt(e.target.value) || 0)}
                  style={{ width: '100%', textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${CS_BORDER}`, borderRadius: 3, color: CS_GOLD_L, fontSize: '1.1rem', fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 600, outline: 'none', padding: '0.2rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`, borderRadius: 4, padding: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CS_TEXT_DIM, marginBottom: '0.2rem' }}>Hit Dice</div>
                <input value={data.hit_dice} onChange={e => set('hit_dice', e.target.value)} placeholder="1d8"
                  style={{ width: '100%', textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${CS_BORDER}`, borderRadius: 3, color: CS_GOLD_L, fontSize: '1rem', fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 600, outline: 'none', padding: '0.2rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Passive Perception */}
            <div style={{ background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`, borderRadius: 4, padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.65rem', color: CS_TEXT_DIM, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Passive Perception</span>
              <input type="number" value={data.passive_perception} onChange={e => set('passive_perception', parseInt(e.target.value) || 0)}
                style={{ width: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${CS_BORDER}`, borderRadius: 3, color: CS_TEXT, fontSize: '0.9rem', fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 600, outline: 'none', padding: '0.2rem', boxSizing: 'border-box' }} />
            </div>
          </Section>

          {/* ══ SAVING THROWS (matches SavingThrows.jsx) ════════ */}
          <Section title="Saving Throws" defaultOpen={false}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem' }}>
              {SAVES.map(({ key, label }) => {
                const prof = data.saving_throws?.[key]?.proficient ?? false
                return (
                  <div
                    key={key}
                    onClick={() => toggleSave(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.3rem 0.5rem', borderRadius: 3, cursor: 'pointer',
                      background: prof ? 'rgba(90,159,212,0.1)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${prof ? CS_PROF : CS_BORDER}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      border: `1px solid ${prof ? CS_PROF : CS_TEXT_DIM}`,
                      background: prof ? CS_PROF : 'transparent',
                    }} />
                    <span style={{ fontSize: '0.72rem', color: prof ? '#93c5fd' : CS_TEXT_MUT, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'none' }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* ══ SKILLS (matches SkillList.jsx) ════════════════════ */}
          <Section title="Skills" defaultOpen={false}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
              {Object.entries(SKILL_LABELS).map(([skill, label]) => {
                const d = data.skills?.[skill] || {}
                const prof = d.proficient ?? false
                const exp = d.expertise ?? false
                const dotClass = exp ? '#9c6bcf' : prof ? CS_PROF : 'transparent'
                const dotBorder = exp ? '#9c6bcf' : prof ? CS_PROF : CS_TEXT_DIM
                return (
                  <div
                    key={skill}
                    onClick={() => cycleSkill(skill)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.25rem 0.5rem', borderRadius: 3, cursor: 'pointer',
                      background: exp ? 'rgba(156,107,207,0.08)' : prof ? 'rgba(90,159,212,0.08)' : 'transparent',
                      border: `1px solid ${exp ? 'rgba(156,107,207,0.3)' : prof ? 'rgba(90,159,212,0.25)' : CS_BORDER}`,
                      transition: 'all 0.12s',
                    }}
                    title={exp ? 'Expertise (click to remove)' : prof ? 'Proficient (click for Expertise)' : 'Not proficient (click to add)'}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: dotClass, border: `1px solid ${dotBorder}` }} />
                    <span style={{ fontSize: '0.68rem', color: exp ? '#c4b5fd' : prof ? '#93c5fd' : CS_TEXT_MUT, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'none' }}>
                      {exp ? '★ ' : ''}{label}
                    </span>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: '0.65rem', color: CS_TEXT_DIM, marginTop: '0.5rem', margin: '0.5rem 0 0' }}>
              Click once = Proficient · Click twice = Expertise · Click three times = Remove
            </p>
          </Section>

          {/* ══ ATTACKS & SPELLCASTING (matches AttacksTable.jsx) ═ */}
          <Section title="Attacks & Spellcasting" defaultOpen={false}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  {['Name', 'Atk Bonus', 'Damage / Type', ''].map((h, i) => (
                    <th key={i} style={{ fontFamily: 'Cinzel, serif', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CS_TEXT_DIM, padding: '0.3rem 0.4rem', textAlign: 'left', borderBottom: `1px solid ${CS_BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.attacks.map((atk, i) => (
                  <tr key={i}>
                    <td style={{ padding: '0.25rem 0.4rem' }}>
                      <input value={atk.name || ''} placeholder="Attack name" onChange={e => setAtk(i, 'name', e.target.value)}
                        style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} />
                    </td>
                    <td style={{ padding: '0.25rem 0.4rem' }}>
                      <input value={atk.attack_bonus || ''} placeholder="+5" onChange={e => setAtk(i, 'attack_bonus', e.target.value)}
                        style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: '4rem' }} />
                    </td>
                    <td style={{ padding: '0.25rem 0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <input value={atk.damage || ''} placeholder="1d6" onChange={e => setAtk(i, 'damage', e.target.value)}
                          style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} />
                        <input value={atk.damage_type || ''} placeholder="Type" onChange={e => setAtk(i, 'damage_type', e.target.value)}
                          style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} />
                      </div>
                    </td>
                    <td style={{ padding: '0.25rem 0.4rem' }}>
                      <button onClick={() => removeAtk(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addAtk} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              marginTop: '0.5rem', padding: '0.3rem 0.7rem',
              background: 'none', border: `1px solid ${CS_BORDER}`, borderRadius: 4,
              color: CS_GOLD, cursor: 'pointer', fontSize: '0.7rem',
              fontFamily: 'Cinzel, serif', letterSpacing: '0.1em',
            }}>
              <Plus size={12} /> Add
            </button>
          </Section>

          {/* ══ SPELLCASTING (matches SpellcastingPanel.jsx) ══════ */}
          <Section title="Spellcasting" defaultOpen={false}>
            {/* Info row: Class / Ability / Save DC / Atk Bonus */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`, borderRadius: 4, padding: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CS_TEXT_DIM, marginBottom: '0.2rem' }}>Class</div>
                <input value={data.spellcasting_class} onChange={e => set('spellcasting_class', e.target.value)} placeholder="Wizard..."
                  style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.2rem', textAlign: 'center' }} />
              </div>
              <div style={{ background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`, borderRadius: 4, padding: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CS_TEXT_DIM, marginBottom: '0.2rem' }}>Ability</div>
                <select value={data.spellcasting_ability} onChange={e => set('spellcasting_ability', e.target.value)}
                  style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.2rem', textAlign: 'center', background: CS_SURFACE_2, cursor: 'pointer' }}>
                  <option value="">None</option>
                  {Object.entries(ABILITY_ABBR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`, borderRadius: 4, padding: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CS_TEXT_DIM, marginBottom: '0.2rem' }}>Save DC</div>
                <input type="number" value={data.spell_save_dc} onChange={e => set('spell_save_dc', parseInt(e.target.value) || 0)}
                  style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.2rem', textAlign: 'center' }} />
              </div>
              <div style={{ background: CS_SURFACE_2, border: `1px solid ${CS_BORDER}`, borderRadius: 4, padding: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CS_TEXT_DIM, marginBottom: '0.2rem' }}>Atk Bonus</div>
                <input type="number" value={data.spell_attack_bonus} onChange={e => set('spell_attack_bonus', parseInt(e.target.value) || 0)}
                  style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.2rem', textAlign: 'center' }} />
              </div>
            </div>

            {/* Cantrips + Spells (matching SpellcastingPanel editing: "one per line" textarea) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <CsField label="Cantrips (one per line)">
                <Textarea
                  value={(data.cantrips || []).join('\n')}
                  onChange={e => set('cantrips', e.target.value.split('\n').filter(s => s.trim()))}
                  placeholder="Fire Bolt\nPrestidigitation..."
                  rows={5}
                />
              </CsField>
              <CsField label="Spells (one per line)">
                <Textarea
                  value={(data.spells || []).join('\n')}
                  onChange={e => set('spells', e.target.value.split('\n').filter(s => s.trim()))}
                  placeholder="Magic Missile\nShield..."
                  rows={5}
                />
              </CsField>
            </div>
          </Section>

          {/* ══ EQUIPMENT & TREASURE (matches EquipmentPanel.jsx) ═ */}
          <Section title="Equipment & Treasure" defaultOpen={false}>
            {/* Currency: CP/SP/EP/GP/PP */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem' }}>
              {['cp', 'sp', 'ep', 'gp', 'pp'].map(coin => (
                <div key={coin} style={{
                  flex: 1, background: CS_SURFACE_2, border: `1px solid ${COIN_COLORS[coin]}44`,
                  borderRadius: 4, padding: '0.4rem 0.2rem', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: COIN_COLORS[coin] }}>{coin.toUpperCase()}</div>
                  <input type="number" value={data.currency[coin] ?? 0} onChange={e => setCurrency(coin, e.target.value)}
                    style={{ width: '100%', textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${CS_BORDER}`, borderRadius: 3, color: CS_GOLD_L, fontSize: '0.9rem', fontFamily: 'Oswald, Inter, sans-serif', fontWeight: 600, outline: 'none', padding: '0.15rem', boxSizing: 'border-box', marginTop: '0.15rem' }} />
                </div>
              ))}
            </div>
            <CsField label="Equipment">
              <Textarea value={data.equipment} onChange={e => set('equipment', e.target.value)} placeholder="Enter equipment (one per line)" rows={4} />
            </CsField>
          </Section>

          {/* ══ PERSONALITY (matches PersonalityPanel.jsx) ════════ */}
          <Section title="Personality" defaultOpen={false}>
            <CsField label="Personality Traits">
              <Textarea value={data.personality_traits} onChange={e => set('personality_traits', e.target.value)} placeholder="No personality traits" />
            </CsField>
            <CsField label="Ideals">
              <Textarea value={data.ideals} onChange={e => set('ideals', e.target.value)} placeholder="No ideals" />
            </CsField>
            <CsField label="Bonds">
              <Textarea value={data.bonds} onChange={e => set('bonds', e.target.value)} placeholder="No bonds" />
            </CsField>
            <CsField label="Flaws">
              <Textarea value={data.flaws} onChange={e => set('flaws', e.target.value)} placeholder="No flaws" />
            </CsField>
          </Section>

          {/* ══ FEATURES, TRAITS & LANGUAGES (matches FeaturesPanel.jsx) ══ */}
          <Section title="Features, Traits & Languages" defaultOpen={false}>
            <CsField label="Features & Traits">
              <Textarea value={data.features_traits} onChange={e => set('features_traits', e.target.value)} placeholder="Enter features (one per line)" rows={5} />
            </CsField>
            <CsField label="Other Proficiencies & Languages">
              <Textarea value={data.other_proficiencies} onChange={e => set('other_proficiencies', e.target.value)} placeholder="No proficiencies or languages listed" />
            </CsField>
          </Section>

          {/* ══ BACKSTORY (matches BackstoryPanel.jsx) ════════════ */}
          <Section title="Backstory" defaultOpen={false}>
            <CsField label="Character Backstory">
              <Textarea value={data.backstory} onChange={e => set('backstory', e.target.value)} placeholder="No backstory written yet" rows={5} />
            </CsField>
          </Section>

        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div style={{
          padding: '0.85rem 1.25rem', borderTop: `1px solid ${CS_BORDER}`,
          display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', flexWrap: 'wrap',
          background: CS_SURFACE_2, flexShrink: 0,
        }}>
          <button type="button" onClick={onRescan} style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.6rem 1.1rem', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${CS_BORDER}`,
            color: CS_TEXT_MUT, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
            fontFamily: 'Cinzel, serif', letterSpacing: '0.08em',
          }}>
            <RotateCcw size={14} /> Reanalizar
          </button>
          <button type="button" onClick={handleConfirm} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.5rem', borderRadius: 6,
            background: `linear-gradient(135deg, rgba(200,147,42,0.25), rgba(200,147,42,0.15))`,
            border: `1px solid ${CS_BORDER_A}`,
            color: CS_GOLD_L, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
            fontFamily: 'Cinzel, serif', letterSpacing: '0.1em',
            boxShadow: `0 4px 18px rgba(200,147,42,0.15)`,
          }}>
            <ArrowRight size={16} /> Actualizar hoja de personaje
          </button>
        </div>
      </div>
    </div>
  )
}

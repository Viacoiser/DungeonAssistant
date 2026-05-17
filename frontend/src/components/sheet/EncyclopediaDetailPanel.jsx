import React from 'react'
import { X, CheckCircle } from 'lucide-react'

const detailPanelStyle = {
  position: 'sticky',
  top: 0,
  right: 'auto',
  width: '100%',
  maxWidth: '380px',
  height: 'fit-content',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1.5rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(217,83,30,0.2)',
  borderRadius: 15,
  maxHeight: 'calc(100vh - 7.5rem)',
  overflowY: 'auto',
  zIndex: 30,
  minWidth: 0,
}

const metaBoxStyle = {
  fontSize: '0.8rem',
  borderRadius: 8,
  padding: '0.65rem 0.75rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'rgba(226,209,166,0.75)',
}

/**
 * Reusable Encyclopedia Detail Panel Component
 * Displays details for spells, equipment, or traits
 * 
 * @param {Object} item - The encyclopedia item to display
 * @param {string} type - Type of item: 'spell', 'equipment', or 'trait'
 * @param {Function} onClose - Callback when close button clicked
 * @param {boolean} showMobileButton - Show mobile back button
 */
export default function EncyclopediaDetailPanel({ item, type, onClose, showMobileButton = true }) {
  if (!item) return null

  return (
    <div style={detailPanelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
        <h2 style={{
          fontFamily: 'Almendra, serif',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--fantasy-gold)',
          margin: 0,
        }}>
          {item.name}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(226,209,166,0.5)',
            cursor: 'pointer',
            fontSize: '1.5rem',
            padding: 0,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--fantasy-gold)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(226,209,166,0.5)'}
        >
          <X size={24} />
        </button>
      </div>

      {/* Mobile Back Button */}
      {showMobileButton && (
        <button
          onClick={onClose}
          className="md:hidden flex items-center justify-center gap-2 w-full py-3 mt-2 bg-white/5 border border-white/10 rounded-xl text-fantasy-gold hover:bg-white/10 transition-colors"
        >
          <CheckCircle size={16} />
          Cerrar panel
        </button>
      )}

      {/* Content based on type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'rgba(226,209,166,0.75)', lineHeight: 1.6 }}>
        {type === 'spell' && <SpellContent item={item} />}
        {type === 'equipment' && <EquipmentContent item={item} />}
        {type === 'trait' && <TraitContent item={item} />}
      </div>
    </div>
  )
}

function SpellContent({ item }) {
  return (
    <>
      {/* Meta boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={metaBoxStyle}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.35)', marginBottom: 4 }}>Nivel</div>
          <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700 }}>{item.level === 0 ? 'Cantrip' : item.level}</div>
        </div>
        <div style={metaBoxStyle}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.35)', marginBottom: 4 }}>Escuela</div>
          <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700 }}>{item.school?.name || item.school || '—'}</div>
        </div>
        <div style={metaBoxStyle}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.35)', marginBottom: 4 }}>Tiempo</div>
          <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700 }}>{item.casting_time || '—'}</div>
        </div>
        <div style={metaBoxStyle}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.35)', marginBottom: 4 }}>Alcance</div>
          <div style={{ color: 'var(--fantasy-gold)', fontWeight: 700 }}>{item.range || '—'}</div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 style={{
          fontFamily: 'Almendra, serif',
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'rgba(226,209,166,0.9)',
          margin: '1rem 0 0.75rem 0',
        }}>
          Descripción
        </h3>
        <div style={{ color: 'rgba(226,209,166,0.75)', lineHeight: 1.6 }}>
          {item.desc?.map((paragraph, idx) => (
            <p key={idx} style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{paragraph}</p>
          ))}
          {item.higher_level && item.higher_level.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(217,83,30,0.1)', borderRadius: 8 }}>
              <strong style={{ color: 'var(--fantasy-gold)', fontSize: '0.8rem' }}>A niveles superiores:</strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>{item.higher_level[0]}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function EquipmentContent({ item }) {
  return (
    <>
      {/* Type/Classification */}
      <div>
        <h3 style={{
          fontFamily: 'Almendra, serif',
          fontSize: '1rem',
          fontWeight: 700,
          color: 'rgba(226,209,166,0.9)',
          margin: '0 0 0.5rem 0',
        }}>
          Clasificación
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(217,83,30,0.2)', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem', textTransform: 'capitalize', fontWeight: 600 }}>
            {item.equipment_category?.name || item.equipment_type || '—'}
          </span>
          {item.gear_category?.name && (
            <span style={{ background: 'rgba(217,83,30,0.15)', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem' }}>
              {item.gear_category.name}
            </span>
          )}
        </div>
      </div>

      {/* Cost and Weight */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Costo</p>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--fantasy-gold)' }}>
            {item.cost?.quantity || '—'} {item.cost?.unit || ''}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Peso</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{item.weight || '—'} lb.</p>
        </div>
      </div>

      {/* Weapon Properties */}
      {item.damage && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <h3 style={{
            fontFamily: 'Almendra, serif',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'rgba(226,209,166,0.9)',
            margin: '0 0 0.5rem 0',
          }}>
            Daño
          </h3>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--fantasy-gold)' }}>
            {item.damage.damage_dice} {item.damage.damage_type?.name || ''}
          </p>
          {item.properties && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {item.properties.map(p => (
                <span key={p.index} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {item.desc && item.desc.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Descripción:</p>
          {item.desc.map((d, i) => <p key={i} style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>{d}</p>)}
        </div>
      )}

      {/* Source */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.75rem',
        color: 'rgba(226,209,166,0.3)',
      }}>
        Fuente: Enciclopedia Local (D&D 5e)
      </div>
    </>
  )
}

function TraitContent({ item }) {
  return (
    <>
      {/* Main Description */}
      <div>
        <h4 style={{
          fontFamily: 'Almendra, serif',
          fontSize: '1rem',
          fontWeight: 700,
          color: 'rgba(226,209,166,0.9)',
          margin: '0 0 0.75rem 0',
        }}>
          Información
        </h4>
        <div style={{ color: 'rgba(226,209,166,0.75)', lineHeight: 1.6, fontSize: '0.9rem' }}>
          {/* General description */}
          {item.desc && item.desc.length > 0 && item.desc.map((paragraph, idx) => (
            <p key={idx} style={{ margin: '0.5rem 0' }}>{paragraph}</p>
          ))}

          {/* Races: age, alignment, size, languages */}
          {item.age && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Edad:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.age}</p>
            </>
          )}
          {item.alignment && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Alineamiento:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.alignment}</p>
            </>
          )}
          {item.size_description && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Tamaño:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.size_description}</p>
            </>
          )}
          {item.language_desc && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Idiomas:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.language_desc}</p>
            </>
          )}

          {/* Classes: hit die, saving throws */}
          {item.hit_die && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Dado de Golpe:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>d{item.hit_die}</p>
            </>
          )}
          {item.saving_throws && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Tiradas de Salvación:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.saving_throws.map(st => st.name).join(', ')}</p>
            </>
          )}

          {/* Ability score */}
          {item.ability_score && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Aumento de Puntuación:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>+{item.ability_score.increase} {item.ability_score.name}</p>
            </>
          )}

          {/* Backgrounds: feature */}
          {item.feature && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Característica:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.feature.name}</p>
            </>
          )}

          {/* Proficiencies: type */}
          {item.type && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Tipo:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.type}</p>
            </>
          )}

          {/* Classes list */}
          {item.classes && item.classes.length > 0 && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Clases:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.classes.map(c => c.name).join(', ')}</p>
            </>
          )}

          {/* Races list */}
          {item.races && item.races.length > 0 && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Razas:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>{item.races.map(r => r.name).join(', ')}</p>
            </>
          )}

          {/* Prerequisites */}
          {item.prerequisites && item.prerequisites.length > 0 && (
            <>
              <p style={{ margin: '0.5rem 0', fontWeight: 700, color: 'rgba(226,209,166,0.9)' }}>Prerrequisitos:</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                {item.prerequisites.map((p, i) => {
                  if (typeof p === 'string') return p
                  if (p.ability_score && p.minimum_score) {
                    const scoreName = typeof p.ability_score === 'object' ? p.ability_score.name : p.ability_score
                    return `${scoreName} ${p.minimum_score}`
                  }
                  if (p.feature) return p.feature
                  return JSON.stringify(p)
                }).join(', ')}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Source */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.75rem',
        color: 'rgba(226,209,166,0.3)',
      }}>
        Fuente: Enciclopedia Local (D&D 5e)
      </div>
    </>
  )
}

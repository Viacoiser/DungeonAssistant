import React from 'react'
import CharacterInspect from '../shared/CharacterInspect'

export default function CharacterInspectSplitView({ inspectingCharacter, characters, onClose, onSelectCharacter, onUpdate }) {
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      flex: 1,
      background: 'var(--fantasy-bg)',
      fontFamily: 'monospace, monospace',
      overflow: 'hidden',
      flexDirection: 'row',
    }}>
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .character-sidebar-card {
          animation: slideInLeft 0.5s ease forwards;
        }
        @media (max-width: 768px) {
          .character-sidebar {
            display: none !important;
          }
          .character-content {
            width: 100% !important;
            max-height: calc(100vh - 80px) !important;
            overflow-y: auto !important;
          }
          .character-back-button {
            display: block !important;
          }
        }
      `}</style>

      {/* ── Left Sidebar: Character List (desktop only) ── */}
      <aside className="character-sidebar" style={{
        width: 300,
        borderRight: '1px solid rgba(217,83,30,0.2)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.95rem',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {characters.map((char, idx) => (
            <div
              key={char.id}
              className="character-sidebar-card"
              style={{
                animationDelay: `${idx * 50}ms`,
              }}
            >
              <button
                onClick={() => onSelectCharacter(char)}
                style={{
                  width: '100%',
                  background: 'rgba(26,26,26,0.65)',
                  backdropFilter: 'blur(16px)',
                  border: inspectingCharacter.id === char.id
                    ? '1px solid rgba(217,83,30,0.4)'
                    : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: '0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: inspectingCharacter.id === char.id
                    ? '0 12px 40px rgba(217,83,30,0.18)'
                    : '0 4px 20px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => {
                  if (inspectingCharacter.id !== char.id) {
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)'
                    e.currentTarget.style.borderColor = 'rgba(217,83,30,0.3)'
                  }
                }}
                onMouseLeave={e => {
                  if (inspectingCharacter.id !== char.id) {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(217,83,30,0.15)',
                    border: '1px solid rgba(217,83,30,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Almendra, serif',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    textShadow: '0 0 10px rgba(217,83,30,0.5)',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {char.image_url ? (
                      <img
                        src={char.image_url}
                        alt={char.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      char.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: inspectingCharacter.id === char.id ? '#ffffff' : '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      margin: 0,
                      fontFamily: 'Almendra, serif',
                    }}>
                      {char.name}
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: 'rgba(226,209,166,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      margin: 0,
                    }}>
                      Nivel {char.level} • {char.race} • <span style={{ color: '#f87171', fontWeight: 900 }}>{char.hp_current}/{char.hp_max}</span> HP
                    </div>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '0.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.4rem',
                }}>
                  {/* Row 1 */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#ccccc9',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}>
                      {char.armor_class || 10}
                    </div>
                    <div style={{
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(226,209,166,0.5)',
                    }}>Armor Class</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#60a5fa',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      marginBottom: 3,
                    }}>
                      {char.initiative !== undefined ? (char.initiative >= 0 ? '+' : '') + char.initiative : '+0'}
                    </div>
                    <div style={{
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(226,209,166,0.5)',
                    }}>Initiative</div>
                  </div>

                  {/* Row 2 */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#22c55e',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      marginBottom: 3,
                    }}>
                      {char.speed || 30}
                    </div>
                    <div style={{
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(226,209,166,0.5)',
                    }}>Speed</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#8324ef',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      marginBottom: 3,
                    }}>
                      {char.passive_perception || 10}
                    </div>
                    <div style={{
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(226,209,166,0.5)',
                    }}>P.Perception</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#ffb700',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      marginBottom: 3,
                    }}>
                      +{char.proficiency_bonus || 2}
                    </div>
                    <div style={{
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(226,209,166,0.5)',
                    }}>P. Bonus</div>
                  </div>

                  {/* Row 3 */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#f87171',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      marginBottom: 3,
                    }}>
                      d{char.hit_dice_size || 6}
                    </div>
                    <div style={{
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(226,209,166,0.5)',
                    }}>Hit Dice</div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right Content: Character Inspect ── */}
      <div className="character-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Mobile Back Button */}
        <div className="character-back-button" style={{
          display: 'none',
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 100,
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(217,83,30,0.8)',
              border: 'none',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,83,30,1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(217,83,30,0.8)'}
          >
            ← Volver
          </button>
        </div>

        <CharacterInspect
          character={inspectingCharacter}
          mode="split-view"
          onClose={onClose}
          onUpdate={onUpdate}
          isGM={true}
        />
      </div>
    </div>
  )
}

import React from 'react'
import DiceRoller from './DiceRoller'
import DiceBoxRollerResponsive from '../shared/DiceBoxRollerResponsive'
import TraitsReference from '../shared/TraitsReference'
import EquipmentReference from '../shared/EquipmentReference'
import MonstersReference from '../shared/MonstersReference'
import SpellsReference from '../shared/SpellsReference'
import SettingsPanel from '../shared/SettingsPanel'
import StatCard from './StatCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import CharacterCard from '../shared/CharacterCard'
import { Plus, Crown, Users, BarChart2 } from 'lucide-react'
import { btnStyles } from '../../styles/dashboardStyles'

export default function SidebarTabContent({ tab, campaigns = [], characters = [], onCreateCharacter, onSelectCharacter, loading, searchQuery, user, onOpenInsertCharacterModal, onCharacterUpdated }) {
  const tabLabels = {
    characters: { label: 'Personajes', icon: '🧙' },
    traits: { label: 'Rasgos', icon: '📜' },
    equipment: { label: 'Equipamiento y Objetos', icon: '🎒' },
    monsters: { label: 'Monsters', icon: '👹' },
    spells: { label: 'Spells', icon: '✨' },
    dicebox: { label: 'Dado 3D', icon: '🎲' },
    settings: { label: 'Ajustes', icon: '⚙️' },
  }
  const info = tabLabels[tab] || { label: tab, icon: '⭐' }

  if (tab === 'dice') return <DiceRoller />
  if (tab === 'dicebox') return <DiceBoxRollerResponsive />
  if (tab === 'traits') return <TraitsReference />
  if (tab === 'equipment') return <EquipmentReference />
  if (tab === 'monsters') return <MonstersReference />
  if (tab === 'spells') return <SpellsReference />
  if (tab === 'settings') return <SettingsPanel characters={characters} onCharacterUpdated={onCharacterUpdated} />

  // Stats Panel - Show both campaigns and characters stats
  if (tab === 'stats') {
    const gmCount = campaigns.filter(c => c.is_owner).length
    const playerCount = campaigns.filter(c => !c.is_owner).length

    return (
      <div style={{ padding: '2rem', maxWidth: '800px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Campaigns Stats */}
          <div>
            <h3 style={{
              fontFamily: 'Almendra, serif',
              fontSize: '1.25rem',
              color: 'var(--fantasy-gold)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <BarChart2 size={20} color="var(--fantasy-accent)" />
              Mis Campañas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              <StatCard label="Total Campañas" value={campaigns.length} />
              <StatCard label="Como GM" value={gmCount} accent />
              <StatCard label="Como Jugador" value={playerCount} />
            </div>
          </div>

          {/* Characters Stats */}
          <div>
            <h3 style={{
              fontFamily: 'Almendra, serif',
              fontSize: '1.25rem',
              color: 'var(--fantasy-gold)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Users size={20} color="var(--fantasy-accent)" />
              Mis Personajes
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              <StatCard label="Total Personajes" value={characters.length} />
              <StatCard label="Personajes Vivos" value={characters.filter(c => c.is_alive !== false).length} accent />
              <StatCard label="Nivel Máximo" value={characters.length > 0 ? Math.max(...characters.map(c => c.level || 1)) : 0} />
            </div>
          </div>
        </div>

        {/* Role Legend */}
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,209,166,0.35)', marginBottom: '1rem', fontWeight: 600 }}>
            Leyenda de Roles
          </h4>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'rgba(226,209,166,0.65)' }}>
              <Crown size={16} color="#d97706" />
              <span>Dungeon Master</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'rgba(226,209,166,0.65)' }}>
              <Users size={16} color="rgba(226,209,166,0.5)" />
              <span>Jugador</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (tab === 'characters') {
    return (
      <>
        {/* Section header similarly styled to Mis Campañas */}
        <div className="flex flex-col items-center relative mt-8 md:mt-12 mb-8 w-full min-h-[40px]">
          <div style={{ animation: 'fadeInUp 0.4s ease forwards' }} className="flex flex-col items-center text-center">
            <h2 style={{
              fontFamily: 'Almendra, serif',
              fontStyle: 'normal',
              fontSize: 'clamp(3rem, 5vw, 2.5rem)', fontWeight: 700,
              color: 'var(--fantasy-gold)', margin: 0, marginBottom: '0.1rem',
              textShadow: '0 0 30px rgba(217,83,30,0.2)',
            }}>
              Mis Personajes
            </h2>
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mt-1 mb-2 opacity-80">
              <div className="h-[1px] w-16 md:w-24 bg-gradient-to-r from-transparent to-[var(--fantasy-gold)]"></div>
              <div className="text-[var(--fantasy-gold)] text-xs">✧</div>
              <div className="h-[1px] w-16 md:w-24 bg-gradient-to-l from-transparent to-[var(--fantasy-gold)]"></div>
            </div>
            <p style={{ color: 'rgba(226,209,166,0.55)', fontSize: '0.875rem', margin: 0 }} className="hidden sm:block mt-1">
              Gestiona tus héroes, <strong style={{ color: 'var(--fantasy-gold)' }}>{user?.username || 'Aventurero'}</strong>. La gloria te espera.
            </p>
          </div>

          <div className="fixed bottom-[96px] right-4 flex flex-col gap-3 z-40 lg:static lg:w-full lg:flex-row lg:justify-end lg:mt-4 lg:gap-3 lg:z-auto">
            <button
              onClick={() => {
                onOpenInsertCharacterModal()
              }}
              className="flex items-center justify-center transition-all h-14 w-14 rounded-full lg:h-10 lg:w-auto lg:rounded-lg lg:px-4 shadow-[0_4px_20px_rgba(217,83,30,0.4)] lg:shadow-none"
              style={{
                background: 'rgba(217,83,30,0.9)',
                border: '1px solid rgba(217,83,30,0.4)',
                color: '#fff',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(217,83,30,1)'
                e.currentTarget.style.boxShadow = '0 0 25px rgba(217,83,30,0.6)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(217,83,30,0.9)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(217,83,30,0.4)'
              }}
            >
              <Plus size={24} className="lg:mr-2" />
              <span className="hidden lg:inline font-bold font-serif text-sm">Añadir a Campaña</span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <LoadingSpinner text="Cargando personajes..." />
        ) : characters.length === 0 && searchQuery ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'rgba(226,209,166,0.4)', fontFamily: 'Cinzel, serif' }}>No se encontraron personajes para «{searchQuery}»</p>
          </div>
        ) : characters.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '5rem 0', animation: 'fadeInUp 0.4s ease forwards' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '2px dashed rgba(217,83,30,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'rgba(217,83,30,0.4)',
              fontSize: '2rem',
            }}>
              🧙
            </div>
            <h3 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '1.4rem', marginBottom: 8 }}>
              No tienes personajes aún
            </h3>
            <p style={{ color: 'rgba(226,209,166,0.45)', marginBottom: '2rem' }}>
              Crea tu primer héroe para comenzar tu aventura
            </p>
            <button onClick={onCreateCharacter} style={btnStyles.primary}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(226, 209, 166, 0.15)'
                e.currentTarget.style.boxShadow = '0 0 25px var(--fantasy-gold)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(226, 209, 166, 0.08)'
                e.currentTarget.style.boxShadow = '0 0 15px var(--fantasy-gold)'
              }}
            >
              Crear Primer Personaje
            </button>
          </div>
        ) : (
          /* Characters grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {characters.map((char, idx) => (
              <CharacterCard
                key={char.id}
                character={char}
                index={idx}
                onSelect={() => onSelectCharacter(char)}
              />
            ))}

            {/* Add new placeholder */}
            {!searchQuery && (
              <button
                onClick={onCreateCharacter}
                style={{
                  border: '2px dashed rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  color: 'rgba(226,209,166,0.2)',
                  background: 'transparent',
                  cursor: 'pointer',
                  minHeight: 220,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(217,83,30,0.3)'
                  e.currentTarget.style.color = 'rgba(217,83,30,0.5)'
                  e.currentTarget.style.background = 'rgba(217,83,30,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'rgba(226,209,166,0.2)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{
                  width: 52, height: 52,
                  borderRadius: '50%',
                  border: '2px dashed currentColor',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Plus size={26} />
                </div>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Crear Nuevo Personaje
                </span>
              </button>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>{info.icon}</div>
      <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: '#fff', marginBottom: '0.75rem' }}>{info.label}</h2>
      <p style={{ color: 'rgba(226,209,166,0.4)', fontSize: '0.95rem', maxWidth: 360 }}>Esta sección está en construcción. Vuelve pronto para descubrir nuevas funcionalidades.</p>
    </div>
  )
}

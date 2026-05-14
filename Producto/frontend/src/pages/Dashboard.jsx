import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { campaignAPI, characterAPI } from '../services/api'
import DesktopSidebar from '../components/dashboard/Sidebar'
import BottomNavResponsive from '../components/shared/BottomNavResponsive'

import { useMediaQuery } from '../hooks/useMediaQuery'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import CharacterForm from '../components/shared/CharacterForm'
import CharacterInspect from '../components/shared/CharacterInspect'
import DiceBoxRollerResponsive from '../components/shared/DiceBoxRollerResponsive'
import CharacterCard from '../components/shared/CharacterCard'
import TraitsReference from '../components/shared/TraitsReference'
import EquipmentReference from '../components/shared/EquipmentReference'
import MonstersReference from '../components/shared/MonstersReference'
import SpellsReference from '../components/shared/SpellsReference'
import SettingsPanel from '../components/shared/SettingsPanel'
import useEncyclopediaStore from '../store/useEncyclopediaStore'

import { labelStyle, inputStyle, btnStyles } from '../styles/dashboardStyles'
import CampaignCard from '../components/dashboard/CampaignCard'
import DashboardModal from '../components/dashboard/DashboardModal'
import CreateCharacterView from '../components/dashboard/CreateCharacterView'
import CharacterInspectSplitView from '../components/dashboard/CharacterInspectSplitView'
import SidebarTabContent from '../components/dashboard/SidebarTabContent'
import {
  Search,
  Crown,
  User,
  Plus,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  Filter,
  BarChart2,
  LogOut,
  Key,
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, setToken, setUser } = useAuthStore()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const [campaigns, setCampaigns] = useState([])
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCharacters, setLoadingCharacters] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('campaigns')

  // Modal: Crear campaña
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  // Modal: Crear personaje
  const [showCreateCharacterModal, setShowCreateCharacterModal] = useState(false)
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false) // Nueva vista interna
  const [creatingCharacter, setCreatingCharacter] = useState(false)
  const [createCharacterError, setCreateCharacterError] = useState('')

  // Modal: Unirse a campaña
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState('')

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('')

  // ── Campaña seleccionada (navegación interna) ─────────────────────────────
  const [enteringCampaign, setEnteringCampaign] = useState(null) // id loading

  // Detalle de personaje - Split View (characters en sidebar + sheet a la derecha)
  const [inspectingCharacter, setInspectingCharacter] = useState(null)

  // Modal: Insertar personaje a campaña
  const [showInsertCharacterModal, setShowInsertCharacterModal] = useState(false)
  const [insertCharacterForm, setInsertCharacterForm] = useState({ characterId: '', campaignId: '', useCode: false, campaignCode: '' })
  const [insertingCharacter, setInsertingCharacter] = useState(false)
  const [insertCharacterError, setInsertCharacterError] = useState('')

  const loadCampaigns = async () => {
    try {
      const response = await campaignAPI.list()
      setCampaigns(response.data || [])
    } catch (err) {
      console.error('Error cargando campañas:', err)
      setError('No se pudieron cargar las campañas')
    } finally {
      setLoading(false)
    }
  }

  const loadCharacters = async () => {
    try {
      setLoadingCharacters(true)
      const resp = await characterAPI.list()
      setCharacters(resp.data?.characters || [])
    } catch (err) {
      console.error('Error cargando personajes:', err)
    } finally {
      setLoadingCharacters(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
    loadCharacters()
  }, [])

  // Prefetch de la enciclopedia en segundo plano
  const { prefetchCategory } = useEncyclopediaStore()
  useEffect(() => {
    // Precargamos las categorías más ligeras y usadas
    const categoriesToPrefetch = ['traits', 'races', 'classes', 'equipment']

    // Lo hacemos con un pequeño delay para no afectar la carga inicial del dashboard
    const timer = setTimeout(() => {
      categoriesToPrefetch.forEach(cat => prefetchCategory(cat))
    }, 2000)

    return () => clearTimeout(timer)
  }, [prefetchCategory])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
    logout()
    navigate('/login')
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) {
      setError('El nombre de la campaña es requerido')
      return
    }
    setCreating(true)
    try {
      await campaignAPI.create(createForm.name, createForm.description)
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '' })
      setError('')
      setLoading(true)
      await loadCampaigns()
    } catch (err) {
      console.error('Error creando campaña:', err)
      setError('Error al crear la campaña')
    } finally {
      setCreating(false)
    }
  }

  const handleJoinCampaign = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) {
      setJoinError('Ingresa un código de invitación')
      return
    }
    setJoining(true)
    setJoinError('')
    setJoinSuccess('')
    try {
      const res = await campaignAPI.joinByCode(joinCode.trim().toUpperCase())
      setJoinSuccess(res.data?.message || '¡Te uniste a la campaña!')
      setJoinCode('')
      await loadCampaigns()
      setTimeout(() => {
        setShowJoinModal(false)
        setJoinSuccess('')
      }, 1500)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Código inválido o ya eres miembro de esta campaña.'
      setJoinError(detail)
    } finally {
      setJoining(false)
    }
  }

  const handleUpdateCharacter = async (updatedChar) => {
    try {
      await characterAPI.update(updatedChar.id, updatedChar)
      setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c))
    } catch (e) {
      console.error('Error actualizando personaje:', e)
      alert('Error al guardar cambios en la base de datos.')
    }
  }

  const handleCreateCharacterSubmit = async (formData) => {
    try {
      setCreatingCharacter(true)
      setCreateCharacterError('')

      await characterAPI.create(formData)
      setIsCreatingCharacter(false)
      setShowCreateCharacterModal(false)
      loadCharacters()
    } catch (err) {
      console.error('Error creando personaje:', err)
      const errorMsg = err.response?.data?.detail || 'Error al crear el personaje'
      setCreateCharacterError(errorMsg)
    } finally {
      setCreatingCharacter(false)
    }
  }

  const isGM = (campaign) => campaign.user_role === 'GM'

  // Handle insert character to campaign
  const handleInsertCharacterToCampaign = async (e) => {
    e.preventDefault()
    if (!insertCharacterForm.characterId) {
      setInsertCharacterError('Por favor selecciona un personaje')
      return
    }

    let campaignId = insertCharacterForm.campaignId

    // Si usa código, buscar la campaña
    if (insertCharacterForm.useCode) {
      if (!insertCharacterForm.campaignCode.trim()) {
        setInsertCharacterError('Por favor ingresa el código de la campaña')
        return
      }

      // Buscar campaña por código
      const campaignWithCode = campaigns.find(c =>
        c.invite_code?.toUpperCase() === insertCharacterForm.campaignCode.trim().toUpperCase()
      )

      if (!campaignWithCode) {
        setInsertCharacterError('No se encontró una campaña con ese código')
        return
      }

      campaignId = campaignWithCode.id
    } else {
      if (!campaignId) {
        setInsertCharacterError('Por favor selecciona una campaña')
        return
      }
    }

    setInsertingCharacter(true)
    setInsertCharacterError('')

    try {
      await characterAPI.update(insertCharacterForm.characterId, {
        campaign_id: campaignId,
      })

      // Reload characters to reflect changes
      const response = await characterAPI.list()
      setCharacters(response.data?.characters || [])

      // Reset and close modal
      setInsertCharacterForm({ characterId: '', campaignId: '', useCode: false, campaignCode: '' })
      setShowInsertCharacterModal(false)
    } catch (err) {
      console.error('Error inserting character:', err)
      setInsertCharacterError(err.response?.data?.detail || 'Error al insertar personaje en la campaña')
    } finally {
      setInsertingCharacter(false)
    }
  }

  // ── Abrir campaña como navegación interna ────────────────────────────────
  const handleEnterCampaign = (campaign) => {
    setEnteringCampaign(campaign.id)
    navigate(`/campaign/${campaign.id}`)
  }

  // Quick stats
  const gmCount = campaigns.filter(c => c.user_role === 'GM').length
  const playerCount = campaigns.filter(c => c.user_role !== 'GM').length

  // Filtered campaigns by search
  const filteredCampaigns = campaigns.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCharacters = characters.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.race?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.class?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col md:flex-row bg-fantasy-bg font-sans overflow-hidden">
      {/* ── Desktop Sidebar (lg+) ── */}
      {!isMobile && (
        <DesktopSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab)
            setIsCreatingCharacter(false)
            setInspectingCharacter(null)
          }}
        />
      )}

      {/* ── Mobile/Tablet Bottom Nav ── */}
      {isMobile && (
        <BottomNavResponsive
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab)
            setIsCreatingCharacter(false)
            setInspectingCharacter(null)
          }}
        />
      )}

      {/* Main content - responsive */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        
        {/* ── GLOBAL HEADER ── */}
        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          minHeight: '44px'
        }} className="px-2 md:px-8 py-0 gap-2 md:gap-4">

          {/* Left Side: Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 auto', maxWidth: '180px' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(226,209,166,0.35)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                height: '28px',
                padding: '0 0.5rem 0 1.8rem',
                color: 'var(--fantasy-gold)',
                fontSize: '0.75rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Right Side: Logout (Always visible) + "Jugando como" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'flex-end' }} className="flex-shrink-0">
            <div style={{ textAlign: 'right', lineHeight: '1' }} className="hidden xs:block">
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(226,209,166,0.6)' }}>
                Jugando como: <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: '#ff8a65', letterSpacing: '0.05em', textShadow: '0 0 8px rgba(217,83,30,0.4)' }}>{user?.username || user?.email}</span>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'rgba(217,83,30,0.1)',
                border: '1px solid rgba(217,83,30,0.3)',
                borderRadius: '4px',
                padding: '0.2rem 0.4rem',
                color: '#ff6b4aff',
                fontSize: '0.6rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Almendra, serif'
              }}
            >
              <LogOut size={10} />
              SALIR
            </button>
          </div>
        </header>

        {/* ── Content Wrapper ── */}
        <div className="flex-1 flex flex-col min-h-0 relative" style={{ paddingTop: '44px' }}>
          {/* Global Background image overlay */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.08, pointerEvents: 'none' }}>
            <img
              src="https://picsum.photos/seed/dungeon-bg/1920/1080?blur=8"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              referrerPolicy="no-referrer"
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--fantasy-bg) 0%, transparent 50%, var(--fantasy-bg) 100%)' }} />
          </div>

          {isCreatingCharacter ? (
          <CreateCharacterView
            onBack={() => setIsCreatingCharacter(false)}
            onSubmit={handleCreateCharacterSubmit}
            loading={creatingCharacter}
            error={createCharacterError}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, position: 'relative' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

              {/* ── Main ── */}
              <main style={{ flex: 1, padding: inspectingCharacter ? 0 : '44px 0.75rem 3rem', overflowY: 'auto', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }} className="lg:pb-8 pb-24">
                {inspectingCharacter ? (
                  <CharacterInspectSplitView
                    inspectingCharacter={inspectingCharacter}
                    characters={characters}
                    onClose={() => setInspectingCharacter(null)}
                    onSelectCharacter={setInspectingCharacter}
                    onUpdate={handleUpdateCharacter}
                  />
                ) : (
                  <div style={{ maxWidth: ['campaigns', 'characters'].includes(activeTab) ? 960 : '100%', margin: ['campaigns', 'characters'].includes(activeTab) ? '0 auto' : '0', width: '100%' }} className="px-2 md:px-6 lg:px-8">

                    {/* ── Contenido por Tab ── */}
                    {activeTab !== 'campaigns' ? (
                      <SidebarTabContent
                        tab={activeTab}
                        campaigns={campaigns}
                        characters={filteredCharacters}
                        onCreateCharacter={() => setIsCreatingCharacter(true)}
                        onSelectCharacter={setInspectingCharacter}
                        loading={loadingCharacters}
                        searchQuery={searchQuery}
                        user={user}
                        onOpenInsertCharacterModal={() => {
                          setInsertCharacterForm({ characterId: '', campaignId: '', useCode: false, campaignCode: '' })
                          setInsertCharacterError('')
                          setShowInsertCharacterModal(true)
                        }}
                        onCharacterUpdated={loadCharacters}
                      />
                    ) : (
                      <>
                        <div className="flex flex-col items-center mt-8 mb-8 w-full">
                          <div className="flex flex-col items-center text-center">
                            <h2 className="text-4xl font-bold text-[var(--fantasy-gold)] font-serif mb-2">
                              Mis Campañas
                            </h2>
                            <p className="text-[var(--fantasy-gold)] opacity-60 text-sm hidden sm:block">
                              Bienvenido, <strong>{user?.username || 'Aventurero'}</strong>.
                            </p>
                          </div>

                          <div className="fixed bottom-[96px] right-4 flex flex-col gap-3 z-40 lg:static lg:w-full lg:flex-row lg:justify-end lg:mt-4 lg:gap-3 lg:z-auto">
                            <button
                              onClick={() => { setShowJoinModal(true); setJoinCode(''); setJoinError(''); setJoinSuccess('') }}
                              className="flex items-center justify-center h-14 w-14 rounded-full lg:h-10 lg:w-auto lg:rounded-lg lg:px-4 bg-gray-800/80 border border-white/10 text-gold-200"
                              title="Unirse con Código"
                            >
                              <Key size={20} className="md:mr-2" />
                              <span className="hidden lg:inline font-bold text-sm">Unirse con Código</span>
                            </button>
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="flex items-center justify-center h-14 w-14 rounded-full lg:h-10 lg:w-auto lg:rounded-lg lg:px-4 bg-orange-600 text-white"
                              title="Nueva Campaña"
                            >
                              <Plus size={24} className="lg:mr-2" />
                              <span className="hidden lg:inline font-bold text-sm">Nueva Campaña</span>
                            </button>
                          </div>
                        </div>

                        {/* Error */}
                        {error && (
                          <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 12, padding: '0.9rem 1.25rem', marginBottom: '1.5rem' }}>
                            <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.9rem' }}>{error}</p>
                          </div>
                        )}

                        {/* Loading */}
                        {loading ? (
                          <LoadingSpinner text="Cargando campañas..." />

                        ) : filteredCampaigns.length === 0 && searchQuery ? (
                          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <p style={{ color: 'rgba(226,209,166,0.4)', fontFamily: 'Cinzel, serif' }}>No se encontraron campañas para «{searchQuery}»</p>
                          </div>

                        ) : campaigns.length === 0 ? (
                          <div className="text-center py-20">
                            <h3 className="text-white font-serif text-2xl mb-2">
                              No tienes campañas aún
                            </h3>
                            <p className="text-gray-400 mb-8">
                              Crea una o únete a una campaña existente
                            </p>
                            <div className="flex gap-4 justify-center">
                              <button onClick={() => setShowJoinModal(true)} style={btnStyles.secondary}>
                                Unirse con Código
                              </button>
                              <button onClick={() => setShowCreateModal(true)} style={btnStyles.primary}>
                                Crear Primera Campaña
                              </button>
                            </div>
                          </div>

                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCampaigns.map((campaign, idx) => (
                              <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                isGM={isGM(campaign)}
                                index={idx}
                                loading={enteringCampaign === campaign.id}
                                onEnter={() => handleEnterCampaign(campaign)}
                              />
                            ))}

                            {!searchQuery && (
                              <button
                                onClick={() => setShowCreateModal(true)}
                                className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-white/20 hover:border-orange-500/30 hover:text-orange-500/50 hover:bg-orange-500/5 transition-all min-h-[220px]"
                              >
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                                  <Plus size={26} />
                                </div>
                                <span className="font-serif text-sm tracking-widest uppercase font-bold">
                                  Crear Nuevo Mundo
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </main>
            </div>
          </div>
        )}

        {/* ── Modal: Crear campaña ── */}
        {showCreateModal && (
          <DashboardModal onClose={() => setShowCreateModal(false)} title="Nueva Campaña">
            <form onSubmit={handleCreateCampaign}>
              <label style={labelStyle}>Nombre de la Campaña *</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ej: El Reino Perdido"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(217,83,30,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                autoFocus
              />
              <label style={{ ...labelStyle, marginTop: '1rem' }}>Descripción</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe tu campaña..."
                rows={4}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(217,83,30,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={btnStyles.ghost} disabled={creating}>
                  Cancelar
                </button>
                <button type="submit" style={btnStyles.primary} disabled={creating}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(226, 209, 166, 0.15)'
                    e.currentTarget.style.boxShadow = '0 0 25px var(--fantasy-gold)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(226, 209, 166, 0.08)'
                    e.currentTarget.style.boxShadow = '0 0 15px var(--fantasy-gold)'
                  }}
                >
                  {creating ? 'Creando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </DashboardModal>
        )}

        {/* ── Modal: Unirse con código ── */}
        {showJoinModal && (
          <DashboardModal onClose={() => setShowJoinModal(false)} title="Unirse a Campaña">
            <p style={{ color: 'rgba(226,209,166,0.55)', marginBottom: '1.25rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
              Ingresa el código de invitación que te compartió el Dungeon Master.
            </p>
            <form onSubmit={handleJoinCampaign}>
              <label style={labelStyle}>Código de Invitación</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ej: AB3X9KPQ"
                maxLength={8}
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1.3rem', letterSpacing: '0.25em', textAlign: 'center', textTransform: 'uppercase' }}
                onFocus={e => e.target.style.borderColor = 'rgba(217,83,30,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                autoFocus
              />

              {joinError && (
                <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 10, padding: '0.75rem 1rem', marginTop: '0.75rem' }}>
                  <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.875rem' }}>{joinError}</p>
                </div>
              )}
              {joinSuccess && (
                <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 10, padding: '0.75rem 1rem', marginTop: '0.75rem' }}>
                  <p style={{ color: '#86efac', margin: 0, fontSize: '0.875rem' }}>✅ {joinSuccess}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowJoinModal(false)} style={btnStyles.ghost} disabled={joining}>
                  Cancelar
                </button>
                <button type="submit" style={btnStyles.accent} disabled={joining}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {joining ? 'Uniéndose...' : 'Unirme'}
                </button>
              </div>
            </form>
          </DashboardModal>
        )}
        {/* ── Modal: Insertar Personaje a Campaña ── */}
        {showInsertCharacterModal && (
          <DashboardModal onClose={() => setShowInsertCharacterModal(false)} title="Insertar Personaje en Campaña">
            {insertCharacterError && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                {insertCharacterError}
              </div>
            )}

            {characters.length === 0 && (
              <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: '#93c5fd', fontSize: '0.875rem' }}>
                ℹ️ Primero crea un personaje antes que puedas insertarlo en una campaña
              </div>
            )}

            {characters.length > 0 && (
              <form onSubmit={handleInsertCharacterToCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Personaje */}
                <div>
                  <label style={labelStyle}>1. Selecciona un Personaje *</label>
                  <select
                    value={insertCharacterForm.characterId}
                    onChange={(e) => setInsertCharacterForm({ ...insertCharacterForm, characterId: e.target.value })}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">--Elige un personaje--</option>
                    {characters.map((char) => (
                      <option key={char.id} value={char.id}>
                        {char.name} - Nivel {char.level} {char.class} ({char.race})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de tipo */}
                <div>
                  <label style={labelStyle}>2. ¿Cómo agregarás el personaje? *</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setInsertCharacterForm({ ...insertCharacterForm, useCode: false, campaignCode: '' })}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 10,
                        border: insertCharacterForm.useCode ? '1px solid rgba(255,255,255,0.1)' : '2px solid var(--fantasy-gold)',
                        background: insertCharacterForm.useCode ? 'rgba(255,255,255,0.03)' : 'rgba(226,209,166,0.1)',
                        color: insertCharacterForm.useCode ? 'rgba(226,209,166,0.6)' : 'var(--fantasy-gold)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        fontFamily: 'Almendra, serif',
                      }}
                    >
                      Por Campaña
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsertCharacterForm({ ...insertCharacterForm, useCode: true, campaignId: '' })}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 10,
                        border: !insertCharacterForm.useCode ? '1px solid rgba(255,255,255,0.1)' : '2px solid var(--fantasy-gold)',
                        background: !insertCharacterForm.useCode ? 'rgba(255,255,255,0.03)' : 'rgba(226,209,166,0.1)',
                        color: !insertCharacterForm.useCode ? 'rgba(226,209,166,0.6)' : 'var(--fantasy-gold)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        fontFamily: 'Almendra, serif',
                      }}
                    >
                      Por Código
                    </button>
                  </div>
                </div>

                {/* Por campaña */}
                {!insertCharacterForm.useCode ? (
                  <div>
                    <label style={labelStyle}>3. Selecciona una Campaña *</label>
                    {campaigns.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(226,209,166,0.4)', fontSize: '0.875rem' }}>
                        No tienes campañas aún. Crea una o únete con código.
                      </div>
                    ) : (
                      <select
                        value={insertCharacterForm.campaignId}
                        onChange={(e) => setInsertCharacterForm({ ...insertCharacterForm, campaignId: e.target.value })}
                        style={{
                          ...inputStyle,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">--Elige una campaña--</option>
                        {campaigns.map((camp) => (
                          <option key={camp.id} value={camp.id}>
                            {camp.name} {camp.user_role === 'GM' ? '[Tu campaña - GM]' : '[Jugador]'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div>
                    <label style={labelStyle}>3. Ingresa el código de la campaña *</label>
                    <input
                      type="text"
                      placeholder="Ej: ABC123"
                      value={insertCharacterForm.campaignCode}
                      onChange={(e) => setInsertCharacterForm({ ...insertCharacterForm, campaignCode: e.target.value.toUpperCase() })}
                      style={{
                        ...inputStyle,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        textAlign: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                      }}
                    />
                  </div>
                )}

                {/* Botones */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowInsertCharacterModal(false)} style={btnStyles.ghost} disabled={insertingCharacter}>
                    Cancelar
                  </button>
                  <button type="submit" style={btnStyles.accent} disabled={insertingCharacter}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {insertingCharacter ? 'Insertando...' : 'Insertar Personaje'}
                  </button>
                </div>
              </form>
            )}
          </DashboardModal>
        )}
        {/* ── Modal: Crear Personaje ── */}
        {showCreateCharacterModal && (
          <DashboardModal onClose={() => setShowCreateCharacterModal(false)} title="Crear Personaje">
            {createCharacterError && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#fca5a5', marginBottom: '1rem' }}>
                {createCharacterError}
              </div>
            )}
            <CharacterForm onSubmit={handleCreateCharacterSubmit} loading={creatingCharacter} />
          </DashboardModal>
        )}

        {/* ── Modal: Detalle de Personaje ── */}
        {/* Now handled via split-view layout - see return statement */}
        </div>
      </div>
    </div>
  )
}



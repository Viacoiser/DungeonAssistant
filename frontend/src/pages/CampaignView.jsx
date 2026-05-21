import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { campaignAPI, characterAPI } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import DiceBoxRollerResponsive from '../components/shared/DiceBoxRollerResponsive'
import Sidebar from '../components/dashboard/Sidebar'
import { getSocket, joinCampaign, leaveCampaign } from '../services/socket'
import { AnimatePresence } from 'framer-motion'
import LiveInitiativeTracker from '../components/campaign/LiveInitiativeTracker'

// Campaign Tabs
import NotesTab from '../components/campaign/NotesTab'
import NpcsTab from '../components/campaign/NpcsTab'
import AssistantTab from '../components/campaign/AssistantTab'
import SettingsTab from '../components/campaign/SettingsTab'
import CharactersTab from '../components/campaign/CharactersTab'
import MembersTab from '../components/campaign/MembersTab'
import { Icon } from '../components/shared/CampaignIcons'
import { useSocketStore } from '../store/useSocketStore'

export default function CampaignView() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isConnected } = useSocketStore()
  const [campaign, setCampaign] = useState(null)
  const [userRole, setUserRole] = useState(null) // 'GM' | 'PLAYER'
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [playerName, setPlayerName] = useState(null) // Para mostrar el nombre del personaje del player
  const [combatState, setCombatState] = useState({ status: 'inactive', turns: [], history: [], current_turn: 0 })
  const [isTrackerOpen, setIsTrackerOpen] = useState(false)

  // ── SOCKET SETUP ──────────────────────────────────────────────────────────
  const joinedCampaignRef = useRef(null)

  // 1. Join campaign room when connected
  useEffect(() => {
    if (isConnected && campaignId) {
      console.log('🔄 Socket conectado — uniéndose a campaña:', campaignId)
      joinCampaign(campaignId)
      joinedCampaignRef.current = campaignId
    }
  }, [campaignId, isConnected])

  // 2. Leave campaign room ONLY when campaignId changes or component unmounts
  useEffect(() => {
    return () => {
      if (joinedCampaignRef.current) {
        console.log('🚪 Saliendo de campaña:', joinedCampaignRef.current)
        leaveCampaign(joinedCampaignRef.current)
        joinedCampaignRef.current = null
      }
    }
  }, [campaignId])

  // 3. Register combat update listeners
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleCombatUpdate = (state) => {
      console.log('⚔️ Combate actualizado:', state)
      setCombatState(state)
    }

    socket.off('combat_state_update')
    socket.on('combat_state_update', handleCombatUpdate)

    return () => {
      socket.off('combat_state_update', handleCombatUpdate)
    }
  }, [campaignId])

  useEffect(() => {
    const load = async () => {
      try {
        const [campRes, membersRes] = await Promise.all([
          campaignAPI.getDetail(campaignId),
          campaignAPI.getMembers(campaignId)
        ])
        setCampaign(campRes.data)
        const role = membersRes.data?.user_role || 'PLAYER'
        setUserRole(role)

        // Si es PLAYER, obtener el nombre del personaje del usuario desde localStorage
        if (role !== 'GM') {
          const savedPlayerName = localStorage.getItem(`campaign_${campaignId}_player_name`)
          if (savedPlayerName) {
            setPlayerName(savedPlayerName)
          } else {
            // Intentar obtener del backend si no está guardado
            try {
              const charsRes = await characterAPI.list(campaignId)
              const playerChars = charsRes.data?.characters?.filter(c => c.player_id === user?.id) || []
              if (playerChars.length > 0) {
                const charName = playerChars[0].name
                setPlayerName(charName)
                localStorage.setItem(`campaign_${campaignId}_player_name`, charName)
              }
            } catch (e) {
              console.error('Error obtener personajes:', e)
            }
          }
        }
      } catch {
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campaignId, user?.id])

  const isGM = userRole === 'GM'

  const tabs = [
    { id: 'notes', label: 'Notas', icon: <Icon.scroll /> },
    { id: 'characters', label: 'Personajes', icon: <Icon.users /> },
    { id: 'dice', label: 'Dados 3D', icon: <Icon.dice /> },
    ...(isGM ? [{ id: 'npcs', label: 'NPCs', icon: <Icon.npc /> }] : []),
    { id: 'assistant', label: 'Asistente', icon: <Icon.chat /> },
    { id: 'members', label: 'Miembros', icon: <Icon.users /> },
    // Settings solo para GM
    ...(isGM ? [{ id: 'settings', label: 'Configuración', icon: <Icon.settings /> }] : []),
  ]

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-fantasy-bg relative">
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.08, pointerEvents: 'none' }}>
          <img src="https://picsum.photos/seed/dungeon-bg/1920/1080?blur=8" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--fantasy-bg) 0%, transparent 50%, var(--fantasy-bg) 100%)' }} />
        </div>
        <div className="relative z-10">
          <LoadingSpinner size={72} text="Cargando campaña..." />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-fantasy-bg font-sans overflow-hidden relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block z-40">
        <Sidebar activeTab="campaigns" setActiveTab={(tab) => navigate('/dashboard')} />
      </div>

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

      <div className="flex-1 flex flex-col relative z-10 min-h-0 overflow-hidden">

      {/* ── Desktop Campaign Header & Tabs ── */}
      <div className="flex-shrink-0 z-10 w-full px-4 lg:px-10 pt-4 lg:pt-6 pb-1 lg:pb-2 flex flex-col gap-3 lg:gap-5">
        {/* Campaign Header */}
        <div className="flex flex-col gap-1 w-full lg:max-w-7xl lg:mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-fantasy-gold/60 mb-1 lg:mb-2">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 hover:text-white transition-colors text-xs lg:text-sm font-semibold tracking-wide"
              >
                <Icon.back size={14} />
                <span>Volver al Dashboard</span>
              </button>
            </div>
            
            {/* User Info (Desktop only) */}
            <div className="hidden lg:flex items-center gap-4 text-sm font-semibold">
              <div className="text-right">
                <div className="text-[0.65rem] uppercase tracking-widest text-fantasy-gold/50">Jugando como</div>
                <div className="text-fantasy-gold">{user?.username || user?.email}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-fantasy-accent/20 border-2 border-fantasy-accent/40 shadow-[0_0_12px_rgba(217,83,30,0.3)] flex items-center justify-center">
                <User size={20} className="text-fantasy-gold" />
              </div>
            </div>
          </div>

          <h1 className="text-xl md:text-4xl font-serif font-bold text-white tracking-wide text-shadow-sm flex items-center gap-2 lg:gap-3">
            {campaign?.name}
            {userRole && (
              <span className={`
                text-[10px] lg:text-xs font-bold px-2 py-0.5 rounded-full border tracking-wide
                ${isGM ? 'border-amber-500/50 bg-amber-500/15 text-amber-500' : 'border-fantasy-accent/50 bg-fantasy-accent/15 text-fantasy-accent'}
              `}>
                {isGM ? 'GM' : 'Jugador'}
              </span>
            )}
          </h1>
          {(!isGM && playerName) && (
            <div className="text-xs lg:text-sm text-fantasy-gold/80 font-medium">
              Personaje: <span className="text-fantasy-accent">{playerName}</span>
            </div>
          )}
        </div>

        {/* Tabs Bar (Scrollable on all devices) */}
        {/* Floating Tabs Bar (Responsive) */}
        <div className="w-full lg:max-w-7xl lg:mx-auto">
          <div className="relative flex items-center gap-1 p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-x-auto no-scrollbar shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center justify-center gap-2 px-3 lg:px-5 py-1.5 lg:py-2.5 
                  text-[10px] lg:text-sm font-semibold rounded-xl whitespace-nowrap
                  transition-colors duration-300 outline-none select-none
                  ${active ? 'text-white' : 'text-fantasy-gold/60 hover:text-fantasy-gold/90'}
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className={`
                  absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none
                  ${active ? 'bg-gradient-to-br from-fantasy-accent/20 to-transparent border border-fantasy-accent/30' : 'opacity-0'}
                `} />
                <div className={`relative z-10 flex items-center ${active ? 'text-fantasy-accent drop-shadow-[0_0_8px_rgba(217,83,30,0.6)]' : ''}`}>
                  {tab.icon}
                </div>
                <span className="relative z-10 font-display tracking-widest">{tab.label}</span>
              </button>
            )
          })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="flex-1 overflow-hidden px-0 lg:px-6 lg:py-5 pt-2 lg:pt-5 pb-24">
        <div className="w-full lg:max-w-6xl lg:mx-auto h-full">
          {activeTab === 'notes' && <NotesTab campaignId={campaignId} />}
          {activeTab === 'characters' && <CharactersTab campaignId={campaignId} isGM={isGM} user={user} />}
          {activeTab === 'dice' && (
            <div className="h-full overflow-hidden flex flex-col">
              <DiceBoxRollerResponsive />
            </div>
          )}
          {activeTab === 'npcs' && <NpcsTab campaignId={campaignId} isGM={isGM} />}
          {activeTab === 'assistant' && <AssistantTab campaignId={campaignId} />}

          {activeTab === 'members' && <MembersTab campaignId={campaignId} />}
          {activeTab === 'settings' && <SettingsTab campaign={campaign} onUpdate={setCampaign} isGM={isGM} onCampaignDeleted={() => navigate('/dashboard')} />}
        </div>
      </main>

      {/* Floating Initiative Tracker Alert Bar */}
      {combatState && combatState.status !== 'inactive' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <button
            onClick={() => setIsTrackerOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-700 via-fantasy-accent to-amber-700 hover:brightness-110 border border-fantasy-gold/30 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(217,83,30,0.4)] text-white text-xs lg:text-sm font-semibold font-display tracking-widest flex items-center gap-3 active:scale-95 transition-all duration-300"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="flex items-center gap-2">
              ⚔️ COMBATE EN CURSO — VER INICIATIVA EN VIVO
            </span>
          </button>
        </div>
      )}

      {/* Floating Round Action Button to open Initiative Tracker */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsTrackerOpen(true)}
          className="w-14 h-14 rounded-full bg-[#18120e] hover:bg-[#201813] border border-fantasy-gold/30 hover:border-fantasy-gold text-fantasy-gold hover:text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_12px_rgba(226,209,166,0.15)] active:scale-95 hover:scale-105 transition-all duration-300 relative group"
          title="Iniciativa en Vivo"
        >
          {/* Glow pulse if combat is active */}
          {combatState && combatState.status !== 'inactive' && (
            <span className="absolute inset-0 rounded-full border-2 border-fantasy-accent animate-ping opacity-60 pointer-events-none" />
          )}
          <Icon.dice size={24} className={combatState && combatState.status !== 'inactive' ? 'animate-pulse text-fantasy-accent' : ''} />
          
          {/* Tooltip */}
          <span className="absolute right-16 px-2.5 py-1 rounded bg-[#0d0a08] border border-fantasy-gold/15 text-[10px] uppercase font-bold tracking-widest text-fantasy-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-md">
            Iniciativa en Vivo {combatState && combatState.status !== 'inactive' && '• ¡Activo!'}
          </span>
        </button>
      </div>

      {/* Live Initiative Tracker Drawer Overlay */}
      <AnimatePresence>
        {isTrackerOpen && (
          <LiveInitiativeTracker
            campaignId={campaignId}
            isGM={isGM}
            user={user}
            combatState={combatState}
            onClose={() => setIsTrackerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
    </div>
  )
}


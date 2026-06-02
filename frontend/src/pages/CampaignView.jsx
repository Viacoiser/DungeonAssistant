import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Swords, Maximize2, X, Sparkles, Play, Dices, Check } from 'lucide-react'
import { campaignAPI, characterAPI } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import DiceBoxRollerResponsive from '../components/shared/DiceBoxRollerResponsive'
import Sidebar from '../components/dashboard/Sidebar'
import { getSocket, joinCampaign, leaveCampaign } from '../services/socket'

// Campaign Tabs
import NotesTab from '../components/campaign/NotesTab'
import NpcsTab from '../components/campaign/NpcsTab'
import AssistantTab from '../components/campaign/AssistantTab'
import SettingsTab from '../components/campaign/SettingsTab'
import CharactersTab from '../components/campaign/CharactersTab'
import MembersTab from '../components/campaign/MembersTab'
import ChroniclesTab from '../components/campaign/ChroniclesTab'
import { Icon } from '../components/shared/CampaignIcons'
import { useSocketStore } from '../store/useSocketStore'

export default function CampaignView() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    isConnected,
    combatState: globalCombatState,
    isTrackerOpen: globalIsTrackerOpen,
    combatCampaignId: globalCombatCampaignId,
    combatActiveUsers: globalActiveUsers,
    setCombatState: setGlobalCombatState,
    setCombatCampaignId,
    setCombatIsGM,
    setCombatActiveUsers,
    resetCombat,
  } = useSocketStore()
  const [campaign, setCampaign] = useState(null)
  const [userRole, setUserRole] = useState(null) // 'GM' | 'PLAYER'
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [playerName, setPlayerName] = useState(null) // Para mostrar el nombre del personaje del player
  const [combatState, setLocalCombatState] = useState(
    globalCombatCampaignId === campaignId ? globalCombatState : { status: 'inactive', turns: [], history: [], current_turn: 0, campaign_id: campaignId }
  )
  const [isTrackerOpen, setLocalTrackerOpen] = useState(
    globalIsTrackerOpen && globalCombatCampaignId === campaignId
  )
  const [isMiniTrackerHidden, setIsMiniTrackerHidden] = useState(false)

  // Estados adicionales para la tirada de iniciativa desde el Mini-Tracker
  const [characterId, setCharacterId] = useState(null)
  const [characterInitiative, setCharacterInitiative] = useState(0)
  const [miniIsRolling, setMiniIsRolling] = useState(false)
  const [miniRollingNum, setMiniRollingNum] = useState(20)
  const [miniTempTotal, setMiniTempTotal] = useState(null)
  const [miniRollValue, setMiniRollValue] = useState(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [miniPos, setMiniPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  const handleDragStart = useCallback((e) => {
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, posX: miniPos.x, posY: miniPos.y }
    setIsDragging(true)
  }, [miniPos])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY
    setMiniPos({
      x: dragStart.current.posX + (clientX - dragStart.current.x),
      y: dragStart.current.posY + (clientY - dragStart.current.y),
    })
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Sincronizar el rol GM con store global
  useEffect(() => {
    if (userRole) {
      setCombatIsGM(userRole === 'GM')
    }
  }, [userRole, setCombatIsGM])

  // Sincronizar tracker state con store global (persiste entre páginas)
  const syncTrackerOpen = useCallback((open) => {
    setLocalTrackerOpen(open)
    useSocketStore.getState().setIsTrackerOpen?.(open)
    if (open && campaignId) {
      useSocketStore.getState().setCombatCampaignId(campaignId)
    }
  }, [campaignId])

  const syncCombatState = useCallback((state) => {
    setLocalCombatState(state)
    useSocketStore.getState().setCombatState(state)
    if (campaignId) {
      useSocketStore.getState().setCombatCampaignId(campaignId)
    }
  }, [campaignId])

  const syncActiveUsers = useCallback((users) => {
    setActiveUsers(users)
    useSocketStore.getState().setCombatActiveUsers(users)
  }, [])

  const formatModifier = (val) => {
    const num = parseInt(val)
    if (isNaN(num)) return '+0'
    return num >= 0 ? `+${num}` : `${num}`
  }

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
      syncCombatState(state)
    }

    const handleJoinedCampaign = (data) => {
      if (data && data.active_users) {
        syncActiveUsers(data.active_users)
      }
    }

    const handleUserJoined = (data) => {
      if (data && data.active_users) {
        syncActiveUsers(data.active_users)
      }
    }

    const handleUserLeft = (data) => {
      if (data && data.active_users) {
        syncActiveUsers(data.active_users)
      } else if (data && data.user_id) {
        setActiveUsers(prev => prev.filter(u => u.user_id !== data.user_id))
        useSocketStore.getState().setCombatActiveUsers(
          useSocketStore.getState().combatActiveUsers.filter(u => u.user_id !== data.user_id)
        )
      }
    }

    socket.off('combat_state_update')
    socket.on('combat_state_update', handleCombatUpdate)

    socket.on('joined_campaign', handleJoinedCampaign)
    socket.on('user_joined', handleUserJoined)
    socket.on('user_left', handleUserLeft)

    return () => {
      socket.off('combat_state_update', handleCombatUpdate)
      socket.off('joined_campaign', handleJoinedCampaign)
      socket.off('user_joined', handleUserJoined)
      socket.off('user_left', handleUserLeft)
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
          const savedCharId = localStorage.getItem(`campaign_${campaignId}_player_char_id`)
          const savedCharInit = localStorage.getItem(`campaign_${campaignId}_player_char_init`)
          
          if (savedPlayerName && savedCharId) {
            setPlayerName(savedPlayerName)
            setCharacterId(savedCharId)
            setCharacterInitiative(parseInt(savedCharInit) || 0)
          } else {
            // Intentar obtener del backend si no está guardado
            try {
              const charsRes = await characterAPI.list(campaignId)
              const playerChars = charsRes.data?.characters?.filter(c => c.player_id === user?.id) || []
              if (playerChars.length > 0) {
                const char = playerChars[0]
                setPlayerName(char.name)
                setCharacterId(char.id)
                setCharacterInitiative(char.initiative || 0)
                
                localStorage.setItem(`campaign_${campaignId}_player_name`, char.name)
                localStorage.setItem(`campaign_${campaignId}_player_char_id`, char.id)
                localStorage.setItem(`campaign_${campaignId}_player_char_init`, char.initiative || 0)
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

  // Reset mini tracker visibility when combat ends or starts
  useEffect(() => {
    if (combatState.status === 'inactive') {
      setIsMiniTrackerHidden(false)
    }
  }, [combatState.status])

  // Controlar la apertura automática del tracker cuando el combate se activa
  const prevCombatStatusRef = useRef('inactive')
  useEffect(() => {
    const prev = prevCombatStatusRef.current
    const curr = combatState?.status || 'inactive'
    prevCombatStatusRef.current = curr
    
    if (prev === 'inactive' && (curr === 'rolling' || curr === 'active')) {
      syncTrackerOpen(true)
    }
  }, [combatState?.status])

  // Obtener mi personaje en el combate actual
  const getMyCombatParticipant = () => {
    if (!combatState || !combatState.turns || !characterId) return null
    return combatState.turns.find(t => t.id === characterId)
  }
  const myParticipant = getMyCombatParticipant()

  // Tirar iniciativa directamente desde el Mini-Tracker
  const startMiniRoll = () => {
    if (!characterId || miniIsRolling) return
    setMiniIsRolling(true)
    let counter = 0
    const interval = setInterval(() => {
      setMiniRollingNum(Math.floor(Math.random() * 20) + 1)
      counter++
      if (counter > 10) {
        clearInterval(interval)
        const d20 = Math.floor(Math.random() * 20) + 1
        const total = d20 + characterInitiative
        setMiniRollValue(d20)
        setMiniTempTotal(total)
        setMiniIsRolling(false)
        
        // Enviar tirada tentativa al socket
        const socket = getSocket()
        if (socket) {
          socket.emit('submit_initiative', {
            campaign_id: campaignId,
            participant_id: characterId,
            name: playerName,
            roll: d20,
            modifier: characterInitiative,
            total: total,
            is_monster: false
          })
        }
      }
    }, 60)
  }

  const confirmMiniRoll = () => {
    const socket = getSocket()
    if (socket && characterId) {
      socket.emit('confirm_initiative', {
        campaign_id: campaignId,
        participant_id: characterId
      })
    }
  }

  const startCombatFromMini = () => {
    const socket = getSocket()
    if (socket) {
      socket.emit('finish_rolling_phase', { campaign_id: campaignId })
    }
  }

  const isGM = userRole === 'GM'

  // Obtener los participantes visibles a partir del turno actual circularmente
  const getMiniTrackerData = () => {
    if (!combatState || combatState.status === 'inactive' || !combatState.turns?.length) {
      return { activeParticipant: null, nextParticipants: [], isMonsterTurn: false }
    }

    const turns = combatState.turns
    const currentIdx = combatState.current_turn
    const activeParticipant = turns[currentIdx]
    const isMonsterTurn = activeParticipant?.is_monster === true

    // Obtener los siguientes participantes visibles (hasta 2 después del actual, circularmente)
    const nextParticipants = []
    const totalTurns = turns.length
    for (let i = 1; i < totalTurns; i++) {
      const idx = (currentIdx + i) % totalTurns
      const p = turns[idx]
      // Filtrar monstruos si no es GM
      if (isGM || !p.is_monster) {
        nextParticipants.push(p)
      }
      if (nextParticipants.length >= 2) break
    }

    return { activeParticipant, nextParticipants, isMonsterTurn }
  }

  const { activeParticipant, nextParticipants, isMonsterTurn } = getMiniTrackerData()

  const tabs = [
    { id: 'notes', label: 'Notas', icon: <Icon.scroll /> },
    { id: 'characters', label: 'Personajes', icon: <Icon.users /> },
    { id: 'dice', label: 'Dados 3D', icon: <Icon.dice /> },
    ...(isGM ? [{ id: 'npcs', label: 'NPCs', icon: <Icon.npc /> }] : []),
    { id: 'chronicles', label: 'Crónicas', icon: <Icon.chronicle /> },
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
          {activeTab === 'notes' && <NotesTab campaignId={campaignId} isGM={isGM} />}
          {activeTab === 'characters' && <CharactersTab campaignId={campaignId} isGM={isGM} user={user} />}
          {activeTab === 'dice' && (
            <div className="h-full overflow-hidden flex flex-col">
              <DiceBoxRollerResponsive />
            </div>
          )}
          {activeTab === 'npcs' && <NpcsTab campaignId={campaignId} isGM={isGM} />}
          {activeTab === 'chronicles' && <ChroniclesTab campaignId={campaignId} />}
          {activeTab === 'assistant' && <AssistantTab campaignId={campaignId} />}

          {activeTab === 'members' && <MembersTab campaignId={campaignId} />}
          {activeTab === 'settings' && <SettingsTab campaign={campaign} onUpdate={setCampaign} isGM={isGM} onCampaignDeleted={() => navigate('/dashboard')} />}
        </div>
      </main>

      {/* Mini Tracker de Iniciativa Flotante (Minimizado) */}
      {combatState && combatState.status !== 'inactive' && !isTrackerOpen && !isMiniTrackerHidden && (
        <div
          className={`fixed z-40 w-full max-w-sm px-4 ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{
            left: `calc(50% + ${miniPos.x}px)`,
            top: `calc(100vh - 180px + ${miniPos.y}px)`,
            transform: 'translateX(-50%)',
          }}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          <div
            className="bg-[#0d0a08]/95 backdrop-blur-md border border-fantasy-gold/20 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex flex-col gap-2.5 transition-all duration-300"
            style={isDragging ? { transition: 'none' } : {}}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-white/5 pb-1.5 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <span className="font-serif text-[10px] font-bold text-fantasy-gold/75 tracking-wider uppercase flex items-center gap-1.5">
                <Swords size={12} className="text-fantasy-accent" />
                Iniciativa Activa
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => syncTrackerOpen(true)}
                  className="p-1 hover:bg-white/5 rounded text-fantasy-gold/60 hover:text-white transition"
                  title="Maximizar Combate"
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  onClick={() => setIsMiniTrackerHidden(true)}
                  className="p-1 hover:bg-white/5 rounded text-fantasy-gold/60 hover:text-red-400 transition"
                  title="Ocultar Widget"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Contenido Dinámico del Mini-Tracker */}
            {(!isGM && characterId && (!myParticipant || !myParticipant.confirmed)) ? (
              /* PANEL DE TIRADA DEL JUGADOR EN EL MINI-TRACKER */
              <div className="bg-gradient-to-r from-fantasy-accent/15 to-amber-950/15 border border-fantasy-gold/30 rounded-xl p-2.5 flex flex-col gap-2 shadow-[0_0_15px_rgba(217,83,30,0.15)]">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-fantasy-gold uppercase tracking-wider flex items-center gap-1">
                    <Dices size={10} className="text-fantasy-accent animate-pulse" />
                    Tu Tirada de Iniciativa
                  </span>
                  <span className="text-[8px] text-fantasy-gold/50">Modificador: {formatModifier(characterInitiative)}</span>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <button
                    disabled={miniIsRolling || (myParticipant?.roll !== undefined && !miniTempTotal)}
                    onClick={startMiniRoll}
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br from-fantasy-accent to-red-700 hover:brightness-110 border border-fantasy-gold/35 flex items-center justify-center font-serif text-sm font-bold text-white shadow-md active:scale-95 transition-all duration-300
                      ${miniIsRolling ? 'animate-bounce' : ''}
                      ${(myParticipant?.roll !== undefined || miniTempTotal !== null) ? 'opacity-75' : ''}
                    `}
                  >
                    {miniIsRolling ? (
                      <span className="text-white animate-pulse">{miniRollingNum}</span>
                    ) : (
                      <span>{myParticipant?.roll !== undefined ? myParticipant.roll : (miniRollValue || 'd20')}</span>
                    )}
                  </button>

                  <div className="flex-1 flex items-center justify-between">
                    {(myParticipant?.roll !== undefined || miniTempTotal !== null) ? (
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="text-[8px] text-fantasy-gold/50">Total</div>
                          <div className="text-xs font-bold text-white">
                            {myParticipant?.total !== undefined ? myParticipant.total : miniTempTotal} 
                            <span className="text-[8px] text-fantasy-gold/60 ml-1 font-normal">
                              ({myParticipant?.roll !== undefined ? myParticipant.roll : miniRollValue} {formatModifier(characterInitiative)})
                            </span>
                          </div>
                        </div>
                        {!(myParticipant?.confirmed) ? (
                          <button
                            onClick={confirmMiniRoll}
                            className="px-2.5 py-1 bg-green-700 hover:bg-green-600 text-white font-display font-semibold text-[9px] tracking-wider rounded transition active:scale-95 flex items-center gap-1 shadow-md border border-green-500/30"
                          >
                            <Check size={9} />
                            CONFIRMAR
                          </button>
                        ) : (
                          <span className="text-[8px] text-green-400 font-semibold tracking-wider flex items-center gap-1">
                            <Check size={10} /> CONFIRMADA
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[9px] text-fantasy-gold/70 leading-snug">Lanza tu d20 para entrar al combate.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (isGM && combatState.status === 'rolling') ? (
              /* PANEL DEL GM EN EL MINI-TRACKER (Rolling Phase) */
              <div className="bg-white/3 border border-white/5 rounded-xl p-2.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-fantasy-gold uppercase tracking-wider">
                    Fase de Tiradas
                  </span>
                  <span className="text-[8px] text-fantasy-accent font-semibold">
                    {combatState.turns?.filter(t => t.confirmed).length || 0} / {combatState.turns?.filter(t => !t.is_monster).length || 0} Confirmados
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[9px] text-fantasy-gold/60 leading-snug">
                    Los jugadores están tirando. Puedes iniciar el combate ya.
                  </div>
                  <button
                    onClick={startCombatFromMini}
                    className="px-2.5 py-1.5 bg-fantasy-accent hover:brightness-110 text-white font-display font-semibold text-[9px] tracking-wider rounded transition active:scale-95 flex items-center gap-1 shadow-[0_0_8px_rgba(217,83,30,0.3)] border border-fantasy-accent/30"
                  >
                    <Play size={9} />
                    INICIAR
                  </button>
                </div>
              </div>
            ) : activeParticipant ? (
              playerName && activeParticipant.name === playerName ? (
                /* ¡Es tu Turno! */
                <div className="bg-gradient-to-r from-fantasy-accent/25 via-amber-950/20 to-transparent border border-fantasy-accent/60 rounded-xl p-2.5 flex items-center justify-between shadow-[0_0_15px_rgba(217,83,30,0.2)] animate-pulse">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-fantasy-accent animate-spin-slow" />
                    <div>
                      <div className="text-[9px] uppercase font-bold tracking-widest text-fantasy-accent">¡Tu Turno!</div>
                      <div className="text-xs font-bold text-white">¡Te toca actuar, {playerName}!</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => syncTrackerOpen(true)}
                    className="px-2.5 py-1 bg-fantasy-accent hover:brightness-110 text-white font-display font-semibold text-[10px] tracking-wider rounded-lg transition active:scale-95"
                  >
                    ABRIR
                  </button>
                </div>
              ) : (
                /* Turno de otro personaje / criatura */
                <div className="flex items-center justify-between p-2.5 bg-white/3 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-fantasy-gold/10 border border-fantasy-gold/20 flex items-center justify-center font-display text-[10px] text-fantasy-gold font-bold">
                      🛡️
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-wider text-fantasy-gold/50">Turno Activo</div>
                      <div className={`text-xs font-semibold ${isMonsterTurn ? 'text-red-400' : 'text-fantasy-gold'}`}>
                        {isMonsterTurn && !isGM ? 'Criatura Misteriosa 👾' : activeParticipant.name}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => syncTrackerOpen(true)}
                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 text-fantasy-gold font-display font-semibold text-[9px] tracking-wider rounded transition active:scale-95"
                  >
                    VER
                  </button>
                </div>
              )
            ) : (
              <div className="text-xs text-fantasy-gold/30 italic py-1 text-center">Fase de tiradas...</div>
            )}

            {/* Siguientes Turnos */}
            {nextParticipants.length > 0 && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 text-[9px] text-fantasy-gold/60">
                <span className="font-semibold uppercase tracking-wider text-[8px] text-fantasy-gold/45">Siguientes:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {nextParticipants.map((p) => (
                    <span 
                      key={p.id} 
                      className={`px-2 py-0.5 rounded border text-[9px] font-medium
                        ${p.is_monster 
                          ? 'bg-red-950/20 border-red-500/20 text-red-300' 
                          : 'bg-white/5 border-white/5 text-fantasy-gold/85'
                        }
                      `}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Round Action Button to open Initiative Tracker */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => syncTrackerOpen(true)}
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

      {/* Live Initiative Tracker renderizado globalmente en App.jsx */}
    </div>
    </div>
  )
}


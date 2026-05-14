import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Send, Trash2, Edit2, History, Users, Settings, MessageSquare, Theater, Camera, Mic, Upload, Image, StopCircle, Play, User } from 'lucide-react'
import { campaignAPI, sessionAPI, npcAPI, assistantAPI, characterAPI, dnd5eAPI } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import CharacterDetail from '../components/shared/CharacterDetail'
import CharacterCard from '../components/shared/CharacterCard'
import DiceBoxRollerResponsive from '../components/shared/DiceBoxRollerResponsive'
import VoiceRecorder from '../components/shared/VoiceRecorder'
import Sidebar from '../components/dashboard/Sidebar'


// ============================================================================
// Tab: Notas de Sesión (con análisis IA)
// ============================================================================

// Extracted Subcomponents
import NotesTab from '../components/campaign/NotesTab'
import NpcsTab from '../components/campaign/NpcsTab'
import AssistantTab from '../components/campaign/AssistantTab'
import SettingsTab from '../components/campaign/SettingsTab'
import CharactersTab from '../components/campaign/CharactersTab'
import MembersTab from '../components/campaign/MembersTab'
import OCRTab from '../components/campaign/OCRTab'
import { Icon } from '../components/shared/CampaignIcons'

export default function CampaignView() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [campaign, setCampaign] = useState(null)
  const [userRole, setUserRole] = useState(null) // 'GM' | 'PLAYER'
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [playerName, setPlayerName] = useState(null) // Para mostrar el nombre del personaje del player

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
    { id: 'ocr', label: 'OCR', icon: <Icon.ocr /> },
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
          {activeTab === 'ocr' && <OCRTab />}
          {activeTab === 'members' && <MembersTab campaignId={campaignId} />}
          {activeTab === 'settings' && <SettingsTab campaign={campaign} onUpdate={setCampaign} isGM={isGM} onCampaignDeleted={() => navigate('/dashboard')} />}
        </div>
      </main>
    </div>
    </div>
  )
}


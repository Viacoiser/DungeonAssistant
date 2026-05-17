import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
  Theater,
  Camera,
  Mic,
  User,
} from 'lucide-react'
import { campaignAPI, characterAPI } from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import {
  NotesTab,
  NpcsTab,
  CharactersTab,
  AssistantTab,
  MembersTab,
  SettingsTab,
  OCRTab,
} from '../../pages/CampaignView'
import CharacterInspect from './CharacterInspect'
import DiceBoxRollerResponsive from './DiceBoxRollerResponsive'

// ── Animación de tab ────────────────────────────────────────────────────────
const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' } },
}

// ── Definición de tabs ───────────────────────────────────────────────────────
function buildTabs(isGM) {
  return [
    { id: 'notas', label: 'Notas', Icon: BookOpen },
    { id: 'personajes', label: 'Personajes', Icon: Users },
    { id: 'dice', label: 'Dados 3D', Icon: MessageSquare },
    ...(isGM ? [{ id: 'npcs', label: 'NPCs', Icon: Theater }] : []),
    { id: 'asistente', label: 'Asistente', Icon: MessageSquare },
    { id: 'ocr', label: 'OCR', Icon: Camera },
    { id: 'miembros', label: 'Miembros', Icon: Users },
    ...(isGM ? [{ id: 'configuracion', label: 'Configuración', Icon: Settings }] : []),
  ]
}

/**
 * ✅ CampaignDetailResponsive - Versión Tailwind, completamente responsiva
 * - Funciona en móvil, tablet y desktop
 * - Header sticky con ajustes para pantalla pequeña
 * - Tabs scrollable en móvil
 * - Content area adaptable
 */
export default function CampaignDetailResponsive({ campaign: initialCampaign, userRole, onBack }) {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('notas')
  const [campaign, setCampaign] = useState(initialCampaign)
  const [viewingCharacter, setViewingCharacter] = useState(null)
  const [playerName, setPlayerName] = useState(null)

  const isGM = userRole === 'GM'
  const tabs  = buildTabs(isGM)

  // Sincronizar si el padre actualiza la campaña
  useEffect(() => { setCampaign(initialCampaign) }, [initialCampaign])

  // Cargar nombre del personaje del jugador
  useEffect(() => {
    if (!isGM && initialCampaign?.id) {
      const savedPlayerName = localStorage.getItem(`campaign_${initialCampaign.id}_player_name`)
      if (savedPlayerName) {
        setPlayerName(savedPlayerName)
      }
    }
  }, [initialCampaign?.id, isGM])

  // Actualizar playerName cuando se selecciona un personaje
  const handleSelectCharacter = (charId, charName) => {
    if (!isGM && charName) {
      setPlayerName(charName)
      localStorage.setItem(`campaign_${initialCampaign.id}_player_name`, charName)
    }
    setViewingCharacter(charId)
  }

  // Monitorear cambios en localStorage para playerName
  useEffect(() => {
    const handleStorageChange = () => {
      if (!isGM && initialCampaign?.id) {
        const savedPlayerName = localStorage.getItem(`campaign_${initialCampaign.id}_player_name`)
        if (savedPlayerName) {
          setPlayerName(savedPlayerName)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [initialCampaign?.id, isGM])

  // Actualizar playerName cuando se abre la pestaña de personajes
  useEffect(() => {
    if (activeTab === 'personajes' && !isGM && initialCampaign?.id) {
      const savedPlayerName = localStorage.getItem(`campaign_${initialCampaign.id}_player_name`)
      if (savedPlayerName) {
        setPlayerName(savedPlayerName)
      }
    }
  }, [activeTab, initialCampaign?.id, isGM])

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent">

      {/* ── Campaign Header ── */}
      <header className="flex-shrink-0 flex items-center gap-4 px-3 md:px-7 py-2 md:py-3 bg-black/45 backdrop-blur-lg border-b border-white/8 sticky top-0 z-20">
        
        {/* Back button */}
        <button
          onClick={onBack}
          title="Volver"
          className="flex items-center justify-center w-9 h-9 md:w-9 md:h-9 rounded-lg bg-white/5 border border-white/8 text-fantasy-gold/55 hover:bg-white/10 hover:text-fantasy-gold transition-all duration-200 flex-shrink-0"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Campaign info - responsive text sizing */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3">
            <h2 className="font-display text-lg md:text-xl font-bold text-white truncate">
              {campaign?.name || 'Campaña'}
            </h2>
            <span className={`
              text-xs font-black px-2 py-1 md:px-3 md:py-1 rounded-full
              flex-shrink-0 uppercase tracking-wider
              ${isGM 
                ? 'border border-yellow-600/45 bg-yellow-600/12 text-yellow-400' 
                : 'border border-purple-600/45 bg-purple-600/12 text-purple-300'
              }
            `}>
              {isGM ? 'GM' : 'Jugador'}
            </span>
          </div>
          {campaign?.description && (
            <p className="text-xs md:text-sm text-fantasy-gold/40 mt-1 truncate">
              {campaign.description}
            </p>
          )}
        </div>

        {/* User Info Section - hidden on small mobile, visible md+ */}
        <div className="hidden sm:flex items-center gap-2 md:gap-3 pl-3 md:pl-4 border-l border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-right whitespace-nowrap hidden md:block">
              <div className="text-xs uppercase tracking-wider text-fantasy-gold/35">Jugando como</div>
              <div className="text-sm font-bold text-fantasy-gold">{user?.username || user?.email}</div>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden border-2 border-fantasy-accent/40 shadow-[0_0_12px_rgba(217,83,30,0.4)] bg-fantasy-accent/20 flex items-center justify-center flex-shrink-0">
              <User size={18} color="var(--fantasy-gold)" />
            </div>
          </div>
          {!isGM && playerName && (
            <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-white/8">
              <span className="text-xs font-semibold px-2 py-1 md:px-3 md:py-1 rounded-full border border-purple-600/40 bg-purple-600/10 text-purple-300 whitespace-nowrap flex-shrink-0">
                {playerName}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Sub-Tabs Bar ── */}
      <div className="flex-shrink-0 flex items-stretch gap-0 px-3 md:px-7 bg-black/22 border-b border-white/5 overflow-x-auto no-scrollbar">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-3
                text-xs md:text-sm font-medium md:font-semibold
                whitespace-nowrap flex-shrink-0
                border-b-2 transition-all duration-200
                ${
                  active
                    ? 'border-fantasy-accent text-fantasy-accent'
                    : 'border-transparent text-fantasy-gold/40 hover:text-fantasy-gold/70 hover:bg-white/3'
                }
              `}
            >
              <Icon size={16} className="hidden md:inline" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 overflow-hidden flex flex-col"
          >
            {/* Inner scroll wrapper for each tab */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 md:px-7 py-3 md:py-6 h-full">
              {activeTab === 'notas' && <NotesTab campaignId={campaign?.id} />}
              {activeTab === 'personajes' && <CharactersTab campaignId={campaign?.id} isGM={isGM} user={user} onSelectCharacter={setViewingCharacter} />}
              {activeTab === 'dice' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <DiceBoxRollerResponsive />
                </div>
              )}
              {activeTab === 'npcs' && <NpcsTab campaignId={campaign?.id} isGM={isGM} />}
              {activeTab === 'asistente' && <AssistantTab campaignId={campaign?.id} />}
              {activeTab === 'ocr' && <OCRTab />}
              {activeTab === 'miembros' && <MembersTab campaignId={campaign?.id} />}
              {activeTab === 'configuracion' && (
                <SettingsTab
                  campaign={campaign}
                  onUpdate={setCampaign}
                  isGM={isGM}
                  onCampaignDeleted={onBack}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

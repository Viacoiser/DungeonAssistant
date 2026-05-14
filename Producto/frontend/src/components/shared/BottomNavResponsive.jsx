import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import {
  Castle,
  Users,
  BookOpen,
  Settings,
  Sparkles,
  Dice6,
  Dices,
  BarChart2,
  SmilePlus,
  Sword,
  Skull,
} from 'lucide-react'

const D20Icon = () => (
  <svg
    viewBox="0 0 512 512"
    className="w-full h-full"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M256 24L50 120v272l206 113 206-113V120L256 24zM256 60l145 80-145 28-145-28 145-80zm-170 100l135 25-100 150-35-175zm170 40l120 70-120 70-120-70 120-70zm135-15l35 175-135-25 100-150zM85 320l110 20 61 112-171-132zm342 0l-171 132 61-112 110-20z" />
  </svg>
)

const NAV_ITEMS_LEFT = [
  { icon: Castle, label: 'Campañas', id: 'campaigns' },
  { icon: Users, label: 'Personajes', id: 'characters' },
]

const NAV_ITEMS_RIGHT = [
  { icon: BookOpen, label: 'Wiki', id: 'encyclopedia', isMenu: true },
  { icon: Settings, label: 'Ajustes', id: 'settings' },
]

const ENCYCLOPEDIA_ITEMS = [
  { label: 'Rasgos', id: 'traits', icon: SmilePlus },
  { label: 'Equipamiento', id: 'equipment', icon: Sword },
  { label: 'Monstruos', id: 'monsters', icon: Skull },
  { label: 'Hechizos', id: 'spells', icon: Sparkles },
  { label: 'Dice 3D', id: 'dicebox', icon: Dices },
]

/**
 * ✅ BottomNavResponsive - Versión mejorada para móvil
 * - md:hidden → Invisible en tablet+, visible en móvil
 * - Colores consistentes con SidebarResponsive
 * - Iconos en encyclopedias
 * - Incluye espaciador para no ocultar contenido
 */
export default function BottomNavResponsive({ activeTab, setActiveTab }) {
  const [showEncyclopedia, setShowEncyclopedia] = useState(false)

  const handleNavClick = (id) => {
    if (id === 'encyclopedia') {
      setShowEncyclopedia(!showEncyclopedia)
    } else {
      setActiveTab(id)
      setShowEncyclopedia(false)
    }
  }

  const handleEncyclopediaSelect = (id) => {
    setActiveTab(id)
    setShowEncyclopedia(false)
  }

  const [isRolling, setIsRolling] = useState(false)
  const [rotation, setRotation] = useState(0)

  const handleDiceClick = () => {
    if (isRolling) return
    setIsRolling(true)
    setRotation(prev => prev + 720)
    
    if (activeTab === 'dicebox') {
      window.dispatchEvent(new CustomEvent('roll-d20'))
    } else {
      sessionStorage.setItem('pending_d20_roll', 'true')
      setActiveTab('dicebox')
    }
    
    setShowEncyclopedia(false)
    setTimeout(() => setIsRolling(false), 800)
  }

  return (
    <>
      {/* ✅ Navigation Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-28 flex flex-col justify-end pointer-events-none z-50">
        {/* Decorative center notch */}
        <div className="relative h-16 bg-black/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-2 z-10 pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">

          {/* Left Items */}
          <div className="flex flex-1 justify-evenly items-center max-w-[42%]">
            {NAV_ITEMS_LEFT.map((item, index) => {
              const isActive = activeTab === item.id
              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`flex flex-col items-center group transition-all ${isActive ? 'scale-110' : ''}`}
                  >
                    <item.icon size={24} className={`${isActive ? 'text-fantasy-accent' : 'text-zinc-500 group-hover:text-white'} transition-colors`} />
                  </button>
                  {index < NAV_ITEMS_LEFT.length - 1 && (
                    <div className="w-[1px] h-6 bg-white/10 rounded-full" />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Central Die - Always rolls forward */}
          <div className="relative bottom-5 mx-2 z-20 flex justify-center items-center">
            {/* Silueta de fondo (Notch hexagonal) para incorporar el dado */}
            <div className="absolute w-[92px] h-[92px] text-black pointer-events-none drop-shadow-[0_-1px_2px_rgba(255,255,255,0.15)]" style={{ zIndex: -1 }}>
              <D20Icon />
            </div>

            <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full scale-150 pointer-events-none" style={{ zIndex: -1 }} />

            <motion.button
              onClick={handleDiceClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                rotateX: rotation,
                scale: isRolling ? [1, 1.2, 1] : 1,
                y: isRolling ? [0, -12, 0] : 0,
              }}
              transition={{
                rotateX: { duration: 0.8, ease: "circOut" },
                scale: { duration: 0.8, times: [0, 0.5, 1] },
                y: { duration: 0.8, ease: "easeOut" }
              }}
              className="w-20 h-20 text-orange-500 drop-shadow-[0_0_20px_rgba(234,88,12,0.6)] cursor-pointer focus:outline-none flex items-center justify-center"
              style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
            >
              <D20Icon />
            </motion.button>
          </div>

          {/* Right Items */}
          <div className="flex flex-1 justify-evenly items-center max-w-[42%]">
            {NAV_ITEMS_RIGHT.map((item, index) => {
              const isActive = activeTab === item.id || (item.isMenu && showEncyclopedia)

              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`flex flex-col items-center group transition-all ${isActive ? 'scale-110' : ''}`}
                  >
                    <item.icon size={24} className={`${isActive ? 'text-fantasy-accent' : 'text-zinc-500 group-hover:text-white'} transition-colors`} />
                  </button>
                  {index < NAV_ITEMS_RIGHT.length - 1 && (
                    <div className="w-[1px] h-6 bg-white/10 rounded-full" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ✅ Encyclopedia Menu - Mobile Only */}
      {showEncyclopedia && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-md border-t border-white/10 z-40 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 p-3">
            {ENCYCLOPEDIA_ITEMS.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleEncyclopediaSelect(item.id)}
                  className={`
                    flex flex-col items-center gap-2 px-3 py-3 rounded-lg
                    text-xs font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-fantasy-accent/15 text-fantasy-accent border border-fantasy-accent/30'
                      : 'bg-white/5 text-fantasy-gold/60 border border-white/10 hover:bg-white/10'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

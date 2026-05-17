import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import {
  Castle,
  Users,
  ScrollText,
  Backpack,
  Dices,
  Settings,
  LogOut,
  ChevronDown,
  BookOpen,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    items: [
      { icon: Castle, label: 'Campañas', id: 'campaigns' },
      { icon: Users, label: 'Personajes', id: 'characters' },
    ]
  },
  {
    title: 'Enciclopedia',
    icon: BookOpen,
    collapsible: true,
    items: [
      { icon: ScrollText, label: 'Rasgos', id: 'traits' },
      { icon: Backpack, label: 'Equipamiento', id: 'equipment' },
      { icon: Dices, label: 'Dados', id: 'dice' },
      { icon: Dices, label: 'Dice Box', id: 'dicebox' },
    ]
  },
  {
    items: [
      { icon: Settings, label: 'Ajustes', id: 'settings' },
    ]
  },
]

export default function Sidebar({ activeTab, setActiveTab }) {
  const [expandedSections, setExpandedSections] = useState({ 'Enciclopedia': true })

  const toggleSection = (title) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }
  return (
    <aside style={{
      display: 'flex',
      flexDirection: 'column',
      width: 256,
      background: 'rgba(0,0,0,0.6)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 0,
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div
        onClick={() => setActiveTab?.('campaigns')}
        style={{ padding: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1.1,
        }}>
          <span style={{
            fontFamily: 'Almendra, serif',
            fontSize: '1.3rem',
            fontWeight: 900,
            color: 'var(--fantasy-gold)',
            letterSpacing: '0.2em',
          }}>
            DUNGEON
          </span>
          <span style={{
            fontFamily: 'Almendra, serif',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--fantasy-accent)',
            marginLeft: '2.2rem',
            letterSpacing: '0.4em',
            marginTop: '-5px',
          }}>
            ASSISTANT
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 0.75rem' }}>
        {NAV_SECTIONS.map((section, secIdx) => (
          <div key={secIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {/* Section Header (if collapsible) */}
            {section.title && (
              <button
                onClick={() => toggleSection(section.title)}
                style={{
                  fontFamily: 'Almendra, serif',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  display: 'flex',
                  fontSize: '0.75rem',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'rgba(226,209,166,0.4)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  border: 'none',
                  marginTop: secIdx > 0 ? '0.5rem' : 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'rgba(226,209,166,0.7)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(226,209,166,0.4)'
                }}
              >
                {section.icon && <section.icon size={14} />}
                <span style={{ flex: 1 }}>{section.title}</span>
                {section.collapsible && (
                  <ChevronDown 
                    size={14} 
                    style={{ 
                      transform: expandedSections[section.title] ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                )}
              </button>
            )}

            {/* Section Items */}
            {(!section.collapsible || expandedSections[section.title]) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: section.title ? '0.5rem' : 0 }}>
                {section.items.map((item) => {
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab?.(item.id)}
                      style={{
                        fontFamily: 'Almendra, serif',
                        fontStyle: 'normal',
                        fontWeight: 600,
                        display: 'flex',
                        fontSize: '1rem',
                        alignItems: 'center',
                        gap: '1.3rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: isActive ? 'rgba(217,83,30,0.12)' : 'transparent',
                        color: isActive ? 'var(--fantasy-accent)' : 'rgba(226,209,166,0.55)',
                        letterSpacing: '0.05em',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                        position: 'relative',
                        border: 'none',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                          e.currentTarget.style.color = 'var(--fantasy-gold)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'rgba(226,209,166,0.55)'
                        }
                      }}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          width: 3,
                          height: 24,
                          background: 'var(--fantasy-accent)',
                          borderRadius: '0 4px 4px 0',
                        }} />
                      )}
                      <item.icon size={20} style={{ filter: isActive ? 'drop-shadow(0 0 6px var(--fantasy-accent-glow))' : 'none', flexShrink: 0 }} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding: '1rem 0.75rem', fontFamily: 'Almendra, serif', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <SidebarLogoutButton />
      </div>
    </aside>
  )
}

function SidebarLogoutButton() {
  const navigate = useNavigate()
  const { logout, setToken, setUser } = useAuthStore()

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
    logout()
    navigate('/login')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        width: '100%', padding: '0.75rem 1rem',
        background: 'transparent', border: 'none', borderRadius: 12,
        color: 'rgba(248,113,113,0.7)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(220,38,38,0.1)'
        e.currentTarget.style.color = '#f87171'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'rgba(248,113,113,0.7)'
      }}
    >
      <LogOut size={20} />
      <span>Cerrar Sesión</span>
    </button>
  )
}

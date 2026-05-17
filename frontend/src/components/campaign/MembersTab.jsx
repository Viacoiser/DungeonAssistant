import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Send, Trash2, Edit2, History, Users, Settings, MessageSquare, Theater, Camera, Mic, Upload, Image, StopCircle, Play, User } from 'lucide-react'
import { campaignAPI, sessionAPI, npcAPI, assistantAPI, characterAPI, dnd5eAPI } from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import LoadingSpinner from '../shared/LoadingSpinner'
import CharacterDetail from '../shared/CharacterDetail'
import CharacterCard from '../shared/CharacterCard'
import DiceBoxRollerResponsive from '../shared/DiceBoxRollerResponsive'
import VoiceRecorder from '../shared/VoiceRecorder'
import BottomNavResponsive from '../shared/BottomNavResponsive'
import { Icon } from '../shared/CampaignIcons'


// ============================================================================
// Tab: Notas de Sesión (con análisis IA)
// ============================================================================

export default function MembersTab({ campaignId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await campaignAPI.getMembers(campaignId)
        setMembers(res.data?.members || [])
      } catch (e) {
        console.error('Error cargando miembros:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campaignId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={52} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="bg-gray-800/40 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-800/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon.users /> Miembros de la Campaña
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
            {members.length} {members.length === 1 ? 'Usuario' : 'Usuarios'} en esta aventura
          </p>
        </div>

        <div className="divide-y divide-gray-700/30">
          {members.map((member, i) => {
            const isGM = member.role === 'GM'
            return (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="text-white font-medium">{member.username || 'Sin nombre'}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.6rem',
                    borderRadius: 20, border: `1px solid ${isGM ? 'rgba(251,191,36,0.4)' : 'rgba(139,92,246,0.35)'}`,
                    background: isGM ? 'rgba(251,191,36,0.1)' : 'rgba(139,92,246,0.1)',
                    color: isGM ? '#fbbf24' : '#a78bfa', letterSpacing: '0.05em'
                  }}>
                    {isGM ? 'DM' : 'Player'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CampaignView — Pantalla principal
// ============================================================================

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

export default function AssistantTab({ campaignId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '¡Hola! Soy el asistente de tu campaña. Pregúntame sobre NPCs, eventos pasados, el trasfondo del mundo o cualquier detalle de la campaña.'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [voiceTranscribed, setVoiceTranscribed] = useState('') // Guardar texto transcrito para revisar
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (textToSend = null) => {
    const textToUse = textToSend || input.trim()
    if (!textToUse || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: textToUse }])
    setLoading(true)

    try {
      const res = await assistantAPI.chat(campaignId, textToUse)
      // Asegurar que obtenemos el string answer correctamente
      const answer = res.data?.answer || res.data || ''

      if (typeof answer !== 'string') {
        throw new Error('Respuesta inválida del asistente')
      }

      setMessages(prev => [...prev, { role: 'assistant', text: answer }])
    } catch (e) {
      console.error('Error en chat:', e)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Hubo un error al consultar el asistente. Verifica que el backend esté corriendo.',
        error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[var(--fantasy-accent)]/30 border border-[var(--fantasy-accent)]/50 flex items-center justify-center mr-2 flex-shrink-0 mt-1 text-sm text-[var(--fantasy-gold)]">
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-[var(--fantasy-accent)]/20 text-[var(--fantasy-gold)] border border-[var(--fantasy-accent)]/30 rounded-tr-sm'
              : msg.error
                ? 'bg-red-900/30 border border-red-500/30 text-red-200 rounded-tl-sm'
                : 'bg-white/5 text-[var(--fantasy-gold-muted)] border border-white/10 rounded-tl-sm'
              }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-[var(--fantasy-gold-muted)] text-sm">
            <div className="w-8 h-8 rounded-full bg-[var(--fantasy-accent)]/30 border border-[var(--fantasy-accent)]/50 flex items-center justify-center text-sm">
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[var(--fantasy-accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[var(--fantasy-accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[var(--fantasy-accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="space-y-2">
        <VoiceRecorder
          onTranscribed={(text) => {
            setInput(text) // Guardar en input para que se pueda revisar
            setVoiceTranscribed(text)
            setVoiceError('')
          }}
          onError={(error) => {
            setVoiceError(error)
          }}
        />
        {voiceError && (
          <p className="text-xs text-red-400">{voiceError}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="¿Quién es Aldric el Sombrío? ¿Qué pasó en la sesión 2?..."
            className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-[var(--fantasy-gold)] text-sm placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-[var(--fantasy-accent)] hover:bg-[#e86424] disabled:opacity-40 text-white rounded-xl transition fantasy-button-glow"
          >
            <Icon.send />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Tab: Configuración de Campaña
// ============================================================================

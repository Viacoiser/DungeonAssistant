import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Send, Trash2, Edit2, History, Users, Settings, MessageSquare, Theater, Camera, Mic, Upload, Image, StopCircle, Play } from 'lucide-react'
import { campaignAPI, sessionAPI, npcAPI, assistantAPI, characterAPI, dnd5eAPI } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import LoadingSpinner from '../components/LoadingSpinner'
import LevelUpModal from '../components/LevelUpModal'
import CharacterCard from '../components/CharacterCard'
import DiceBoxRoller from '../components/desktop/DiceBoxRoller'
import VoiceRecorder from '../components/VoiceRecorder'

// ============================================================================
// Iconos inline SVG para evitar dependencias extra
// ============================================================================
const Icon = {
  back: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  scroll: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  npc: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chat: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  send: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  sword: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  magic: () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  dice: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7V4a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V21a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m0-10l5 5m5-5l-5 5" />
    </svg>
  ),
  settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  ocr: () => <Camera className="w-5 h-5" />,
  voice: () => <Mic className="w-5 h-5" />,
}

// ============================================================================
// Tab: Notas de Sesión (con análisis IA)
// ============================================================================
export function NotesTab({ campaignId }) {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [creatingSession, setCreatingSession] = useState(false)
  const [createSessionError, setCreateSessionError] = useState('')

  // Estado del modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState(null) // { session } | null
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Estado para editar nota
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteText, setEditNoteText] = useState('')
  const [updatingNote, setUpdatingNote] = useState(false)
  
  // Estado para cambiar privacidad de nota
  const [togglingNoteId, setTogglingNoteId] = useState(null)

  // Estados para autocompletado D&D5e
  const [autocomplete, setAutocomplete] = useState([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompletePosition, setAutocompletePosition] = useState('bottom') // 'top' o 'bottom'
  const textareaRef = useRef(null)

  useEffect(() => {
    loadSessions()
  }, [campaignId])

  const loadSessions = async () => {
    try {
      const res = await sessionAPI.listByCampaign(campaignId)
      setSessions(res.data || [])
    } catch {
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }

  const loadNotes = async (sessionId) => {
    try {
      const res = await sessionAPI.getNotes(sessionId)
      setNotes(res.data?.notes || [])
    } catch {
      setNotes([])
    }
  }

  const selectSession = (session) => {
    setActiveSession(session)
    setAnalysis(null)
    setSendError('')
    loadNotes(session.id)
  }

  const handleCreateSession = async () => {
    setCreatingSession(true)
    setCreateSessionError('')
    try {
      const nextNumber = (sessions.length || 0) + 1
      await sessionAPI.create(campaignId, nextNumber, `Sesión ${nextNumber}`)
      await loadSessions()
    } catch (e) {
      console.error(e)
      const msg = e?.response?.data?.detail || 'Error al crear la sesión. ¿Está el backend corriendo?'
      setCreateSessionError(msg)
    } finally {
      setCreatingSession(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !activeSession) return
    setSending(true)
    setAnalysis(null)
    setSendError('')
    try {
      const res = await sessionAPI.addNote(activeSession.id, noteText)
      const data = res.data
      setAnalysis(data.analysis)
      setNoteText('')
      await loadNotes(activeSession.id)
    } catch (e) {
      console.error('Error agregando nota:', e)
      const msg = e?.response?.data?.detail || 'Error al enviar la nota. Revisá que el backend esté corriendo.'
      setSendError(msg)
    } finally {
      setSending(false)
    }
  }

  const handleStartEditNote = (note) => {
    setEditingNoteId(note.id)
    setEditNoteText(note.content)
  }

  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setEditNoteText('')
    setSendError('')
  }

  const handleUpdateNote = async (noteId) => {
    if (!editNoteText.trim()) return
    setUpdatingNote(true)
    setSendError('')
    try {
      const res = await sessionAPI.updateNote(noteId, editNoteText)
      setAnalysis(res.data.analysis)
      await loadNotes(activeSession.id)
      setEditingNoteId(null)
      setEditNoteText('')
    } catch (e) {
      console.error('Error actualizando nota:', e)
      setSendError(e?.response?.data?.detail || 'Error al actualizar nota.')
    } finally {
      setUpdatingNote(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('¿Seguro que deseas eliminar permanentemente esta nota?')) return
    try {
      await sessionAPI.deleteNote(noteId)
      await loadNotes(activeSession.id)
      setAnalysis(null)
    } catch (e) {
      console.error('Error eliminando nota:', e)
      setSendError(e?.response?.data?.detail || 'Error al eliminar nota.')
    }
  }

  const handleToggleNoteVisibility = async (note) => {
    setTogglingNoteId(note.id)
    try {
      const newIsPublic = !note.is_public
      await sessionAPI.toggleNoteVisibility(note.id, newIsPublic)
      await loadNotes(activeSession.id)
      const statusMsg = newIsPublic ? 'Nota compartida públicamente' : 'Nota volvió a ser privada'
      setSendError(null)
    } catch (e) {
      console.error('Error cambiando privacidad:', e)
      setSendError(e?.response?.data?.detail || 'Error al cambiar privacidad de nota.')
    } finally {
      setTogglingNoteId(null)
    }
  }

  const handleNoteTextChange = async (e) => {
    const text = e.target.value
    setNoteText(text)
    
    // Extraer la última palabra (desde el último espacio hasta el final)
    const words = text.split(/\s+/)
    const lastWord = words[words.length - 1]
    
    // Buscar autocompletado si la última palabra tiene al menos 2 caracteres
    if (lastWord.length >= 2) {
      try {
        const res = await dnd5eAPI.autocomplete(lastWord, ['items', 'spells', 'classes', 'races'], 5)
        setAutocomplete(res.data?.suggestions || [])
        
        // Detectar espacio disponible
        if (textareaRef.current && res.data?.suggestions?.length > 0) {
          const rect = textareaRef.current.getBoundingClientRect()
          const spaceBelow = window.innerHeight - rect.bottom
          const spaceAbove = rect.top
          
          // Si no hay 200px de espacio abajo, mostrar arriba
          if (spaceBelow < 200 && spaceAbove > 200) {
            setAutocompletePosition('top')
          } else {
            setAutocompletePosition('bottom')
          }
        }
        
        setShowAutocomplete(res.data?.suggestions?.length > 0)
      } catch (e) {
        console.error('Error en autocompletado:', e)
        setShowAutocomplete(false)
      }
    } else {
      setShowAutocomplete(false)
    }
  }

  const handleSelectSuggestion = (suggestion) => {
    // Obtener la última palabra que estábamos escribiendo
    const words = noteText.split(/(\s+)/)
    const lastWord = words[words.length - 1]
    
    // Reemplazar la última palabra con la sugerencia
    const textBeforeLastWord = noteText.substring(0, noteText.length - lastWord.length)
    const newText = textBeforeLastWord + suggestion.label + ' '
    
    setNoteText(newText)
    setShowAutocomplete(false)
    textareaRef.current?.focus()
  }

  // Abrir modal de confirmación
  const openDeleteModal = (e, session) => {
    e.stopPropagation() // no seleccionar la sesión al hacer click en eliminar
    setDeleteModal(session)
    setDeleteConfirmText('')
  }

  const closeDeleteModal = () => {
    setDeleteModal(null)
    setDeleteConfirmText('')
  }

  const handleDeleteSession = async () => {
    if (!deleteModal) return
    const sessionName = deleteModal.title || `Sesión ${deleteModal.session_number}`
    if (deleteConfirmText !== sessionName) return

    setDeleting(true)
    try {
      await sessionAPI.delete(deleteModal.id)
      // Si era la sesión activa, deseleccionar
      if (activeSession?.id === deleteModal.id) {
        setActiveSession(null)
        setNotes([])
      }
      await loadSessions()
      closeDeleteModal()
    } catch (e) {
      console.error('Error eliminando sesión:', e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={campaignId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col md:flex-row h-full"
        >
          {/* Sidebar de Sesiones */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] uppercase tracking-widest text-fantasy-accent/60 font-bold">Sesiones</h4>
              <button
                onClick={handleCreateSession}
                disabled={creatingSession}
                className="p-1.5 bg-fantasy-accent/20 text-fantasy-accent rounded hover:bg-fantasy-accent/30 transition-colors disabled:opacity-50"
              >
                <Plus size={14} />
              </button>
            </div>

            {createSessionError && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-2 py-1.5 text-xs text-red-300">
                ⚠️ {createSessionError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {loadingSessions ? (
                <div className="text-gray-500 text-sm">Cargando...</div>
              ) : sessions.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-6">
                  <p>Sin sesiones</p>
                </div>
              ) : (
                sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectSession(s)}
                    className={`group relative text-left px-4 py-2 rounded-lg transition-colors text-sm ${activeSession?.id === s.id
                      ? 'bg-[var(--fantasy-accent)]/30 text-[var(--fantasy-gold)]'
                      : 'bg-white/5 text-[var(--fantasy-gold-muted)] hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {s.is_active && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                      <span className="truncate">{s.title || `Sesión ${s.session_number}`}</span>
                    </div>
                    {/* Botón eliminar sesión */}
                    <div
                      onClick={(e) => openDeleteModal(e, s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Panel de Contenido / Notas */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {!activeSession ? (
              <div className="absolute inset-0 flex items-center justify-center text-fantasy-gold/20 flex-col gap-4">
                <BookOpen size={48} />
                <p className="text-sm">Selecciona una sesión para ver sus notas</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 overflow-hidden">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">
                      {activeSession.title || `Sesión ${activeSession.session_number}`}
                    </h3>
                    {activeSession.is_active && (
                      <span className="px-2 py-0.5 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-bold uppercase">
                        En curso
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de notas */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                  {notes.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-12">
                      <div className="text-3xl mb-2 opacity-20">📜</div>
                      <p>Sin notas en esta sesión. ¡Escribe la primera!</p>
                    </div>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className="bg-white/5 rounded-xl p-4 pt-12 border border-white/5 group relative hover:border-white/10 transition-colors">
                        {/* Indicador de privacidad */}
                        <div className="absolute top-3 left-4 text-xs flex items-center gap-1.5 text-[var(--fantasy-gold-muted)]">
                          <span className="text-lg">
                            {note.is_public ? '🔓' : '🔒'}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest font-bold">
                            {note.is_public ? 'Pública' : 'Privada'}
                          </span>
                        </div>

                        {/* Botones de acción nota */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex gap-1.5 bg-black/40 px-1.5 py-1 rounded-lg border border-white/5 backdrop-blur-sm">
                          <button 
                            onClick={() => handleToggleNoteVisibility(note)} 
                            disabled={togglingNoteId === note.id}
                            className="text-gray-400 hover:text-[var(--fantasy-gold)] disabled:opacity-50 transition" 
                            title={note.is_public ? "Hacer privada" : "Compartir públicamente"}
                          >
                            {togglingNoteId === note.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              note.is_public ? '🔓' : '🔒'
                            )}
                          </button>
                          <button onClick={() => handleStartEditNote(note)} className="text-gray-400 hover:text-fantasy-accent" title="Editar nota">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-400" title="Eliminar nota">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {editingNoteId === note.id ? (
                          <div className="mt-1">
                            <textarea
                              value={editNoteText}
                              onChange={e => setEditNoteText(e.target.value)}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[var(--fantasy-gold)] text-sm focus:outline-none focus:border-[var(--fantasy-accent)]/50 resize-none min-h-[100px]"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={handleCancelEditNote} className="px-3 py-1 text-xs text-[var(--fantasy-gold-muted)] hover:text-[var(--fantasy-gold)] transition">Cancelar</button>
                              <button onClick={() => handleUpdateNote(note.id)} disabled={updatingNote || !editNoteText.trim()} className="px-3 py-1 bg-[var(--fantasy-accent)] hover:bg-[#e86424] disabled:opacity-50 text-white rounded-lg text-xs transition fantasy-button-glow">
                                {updatingNote ? 'Guardando...' : 'Re-analizar y Guardar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[var(--fantasy-gold)]/90 text-sm whitespace-pre-wrap pr-12 leading-relaxed">{note.content}</p>

                            {note.detected_items?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {note.detected_items.map((item, i) => (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${item.is_magical
                                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                      : 'bg-fantasy-accent/10 text-fantasy-accent border border-fantasy-accent/20'
                                      }`}
                                  >
                                    {item.is_magical && <span className="text-[8px]">✨</span>}
                                    {item.item_name} {item.quantity > 1 && `×${item.quantity}`}
                                  </span>
                                ))}
                              </div>
                            )}

                            {note.detected_npcs?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {note.detected_npcs.map((npc, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                  >
                                    👤 {npc.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="text-[10px] text-white/20 mt-3 font-medium">
                              {new Date(note.created_at).toLocaleString('es-CL')}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Resultado del análisis IA flotante o integrado */}
                {analysis && (analysis.detected_items?.length > 0 || analysis.detected_npcs?.length > 0) && (
                  <div className="mb-4 bg-fantasy-accent/10 border border-fantasy-accent/20 rounded-xl p-3 text-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="text-fantasy-accent/80 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="animate-pulse">🤖</span> Gemini detectó:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.detected_items.map((item, i) => (
                        <span key={i} className="bg-fantasy-accent/10 text-fantasy-accent px-2 py-0.5 rounded-lg text-[10px] font-bold border border-fantasy-accent/20">
                          📦 {item.item_name}
                        </span>
                      ))}
                      {analysis.detected_npcs.map((npc, i) => (
                        <span key={i} className="bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-blue-500/20">
                          👤 {npc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input de nota */}
                <div className="mt-auto space-y-2">
                  <VoiceRecorder
                    onTranscribed={(text) => {
                      setNoteText(text)
                      setVoiceError('')
                    }}
                    onError={(error) => {
                      setVoiceError(error)
                    }}
                  />
                  {voiceError && (
                    <p className="text-xs text-red-400">{voiceError}</p>
                  )}
                  <div className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/5 focus-within:border-fantasy-accent/30 transition-colors relative">
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={noteText}
                        onChange={handleNoteTextChange}
                        placeholder="Escribe la nota de sesión..."
                        rows={2}
                        className="w-full bg-transparent border-none rounded-xl px-4 py-2 text-[var(--fantasy-gold)] text-sm placeholder-[var(--fantasy-gold-muted)]/50 focus:outline-none resize-none"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.ctrlKey) handleAddNote()
                        }}
                      />
                      
                      {/* Dropdown de autocompletado - Flexible position */}
                      {showAutocomplete && autocomplete.length > 0 && (
                        <div className={`absolute left-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto ${
                          autocompletePosition === 'top' 
                            ? 'bottom-full mb-1' 
                            : 'top-full mt-1'
                        }`}>
                          {autocomplete.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectSuggestion(suggestion)}
                              className="w-full text-left px-4 py-2 text-[var(--fantasy-gold)] text-sm hover:bg-fantasy-accent/20 hover:text-fantasy-accent transition flex items-center justify-between"
                            >
                              <span>{suggestion.label}</span>
                              <span className="text-[10px] text-[var(--fantasy-gold-muted)]">{suggestion.category}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAddNote}
                      disabled={sending || !noteText.trim()}
                      className="w-12 h-12 flex items-center justify-center bg-fantasy-accent text-white rounded-xl hover:bg-[#e86424] active:scale-95 disabled:opacity-40 transition-all fantasy-button-glow flex-shrink-0"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/20 mt-2 text-center uppercase tracking-widest font-bold">Ctrl+Enter para enviar • 🔒 Privada por defecto • 🔓 Haz clic para compartir</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal de confirmación de eliminación */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-red-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Eliminar sesión</h3>
                <p className="text-gray-400 text-sm">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Se eliminarán la sesión y <span className="text-red-300 font-medium">todas sus notas</span> permanentemente.
              Para confirmar, escribí el nombre exacto de la sesión:
            </p>
            <div className="bg-gray-800 rounded-lg px-3 py-2 mb-3 text-center">
              <span className="text-[var(--fantasy-gold)] font-mono font-semibold">
                {deleteModal.title || `Sesión ${deleteModal.session_number}`}
              </span>
            </div>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe el nombre aquí..."
              autoFocus
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400 mb-4"
              onKeyDown={e => {
                if (e.key === 'Enter') handleDeleteSession()
                if (e.key === 'Escape') closeDeleteModal()
              }}
            />
            <div className="flex gap-3">
              <button onClick={closeDeleteModal} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition">Cancelar</button>
              <button
                onClick={handleDeleteSession}
                disabled={deleteConfirmText !== (deleteModal.title || `Sesión ${deleteModal.session_number}`) || deleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition"
              >
                {deleting ? 'Eliminando...' : 'Eliminar sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Tab: NPCs
// ============================================================================
export function NpcsTab({ campaignId, isGM = false }) {
  const [npcs, setNpcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [selectedNpc, setSelectedNpc] = useState(null)
  const [editingNpc, setEditingNpc] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [savingNpc, setSavingNpc] = useState(false)

  const [npcDeleteModal, setNpcDeleteModal] = useState(null)
  const [npcDeleteConfirmText, setNpcDeleteConfirmText] = useState('')
  const [npcDeleting, setNpcDeleting] = useState(false)
  const [generatingTrait, setGeneratingTrait] = useState(false)

  const relationColors = {
    aliado: 'text-green-300 border-green-500/30 bg-green-500/10',
    enemigo: 'text-red-300 border-red-500/30 bg-red-500/10',
    neutral: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
    desconocido: 'text-gray-300 border-gray-500/30 bg-gray-500/10',
  }

  useEffect(() => {
    loadNpcs()
  }, [campaignId])

  const loadNpcs = async () => {
    try {
      const res = await npcAPI.list(campaignId)
      setNpcs(res.data || [])
    } catch {
      setNpcs([])
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await npcAPI.generate(campaignId, prompt)
      await loadNpcs()
      setSelectedNpc(res.data)
      setPrompt('')
    } catch (e) {
      console.error('Error generando NPC:', e)
      const msg = e?.response?.data?.detail || 'Error al generar el NPC. Revisá que el backend esté corriendo.'
      setGenerateError(msg)
    } finally {
      setGenerating(false)
    }
  }

  const startEditing = () => {
    setEditForm({ ...selectedNpc, stats: { ...selectedNpc.stats } })
    setEditingNpc(true)
  }

  const handleUpdateNpc = async () => {
    setSavingNpc(true)
    try {
      const res = await npcAPI.update(campaignId, selectedNpc.id, editForm)
      const updatedNpc = res.data
      setNpcs(prev => prev.map(n => n.id === updatedNpc.id ? updatedNpc : n))
      setSelectedNpc({ ...selectedNpc, ...editForm })
      setEditingNpc(false)
    } catch (e) {
      console.error('Error actualizando NPC:', e)
      alert(e?.response?.data?.detail || 'Error al guardar NPC.')
    } finally {
      setSavingNpc(false)
    }
  }

  const handleDeleteNpc = async () => {
    if (npcDeleteConfirmText !== selectedNpc.name) return
    setNpcDeleting(true)
    try {
      await npcAPI.delete(campaignId, selectedNpc.id)
      await loadNpcs()
      setSelectedNpc(null)
      setNpcDeleteModal(null)
      setEditingNpc(false)
    } catch (e) {
      console.error('Error eliminando NPC:', e)
      alert(e?.response?.data?.detail || 'Error al eliminar NPC.')
    } finally {
      setNpcDeleting(false)
    }
  }

  const handleGenerateTrait = async () => {
    setGeneratingTrait(true)
    try {
      const res = await npcAPI.generateTrait(campaignId, selectedNpc.id)
      setNpcs(prev => prev.map(n => n.id === res.data.npc.id ? res.data.npc : n))
      setSelectedNpc(res.data.npc)
      if (editingNpc) {
        setEditForm(prev => ({ ...prev, personality: res.data.npc.personality }))
      }
    } catch (e) {
      console.error('Error generando rasgo:', e)
      alert(e?.response?.data?.detail || 'Error al generar el rasgo.')
    } finally {
      setGeneratingTrait(false)
    }
  }

  return (
    <div className="flex gap-4 h-full">
      {!isGM && (
        <div className="absolute top-0 left-0 right-0 bg-amber-900/30 border border-amber-500/30 rounded-lg px-4 py-2 text-xs text-amber-300 mb-2" style={{ position: 'relative', marginBottom: '0.75rem' }}>
          ⚔️ Modo Jugador — Solo el GM puede generar o editar NPCs.
        </div>
      )}
      {/* Lista de NPCs */}
      <div className="w-52 flex-shrink-0 flex flex-col">
        <span className="text-xs font-semibold text-[var(--fantasy-gold)] uppercase tracking-wider mb-3">NPCs de campaña</span>

        {loading ? (
          <div className="text-gray-500 text-sm">Cargando...</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1 mb-3">
            {npcs.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-6">
                <div className="text-2xl mb-2">🎭</div>
                <p>Sin NPCs registrados</p>
              </div>
            ) : (
              npcs.map(npc => (
                <button
                  key={npc.id}
                  onClick={() => setSelectedNpc(npc)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedNpc?.id === npc.id
                    ? 'bg-[var(--fantasy-accent)]/30 text-[var(--fantasy-gold)]'
                    : 'text-[var(--fantasy-gold-muted)] hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{npc.is_alive ? '🟢' : '💀'}</span>
                    <span className="font-medium truncate">{npc.name}</span>
                  </div>
                  {npc.race && <div className="text-xs text-gray-400">{npc.race}</div>}
                </button>
              ))
            )}
          </div>
        )}

        {/* Generar NPC — Solo GM */}
        {isGM && (
          <div className="border-t border-gray-700/50 pt-3">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ej: Un mercader enano corrupto..."
              rows={3}
              className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-[var(--fantasy-gold)] text-xs placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 resize-none transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full mt-2 py-2 bg-[var(--fantasy-accent)] hover:bg-[#e86424] disabled:opacity-40 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 fantasy-button-glow"
            >
              {generating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>✨ Generar NPC</>
              )}
            </button>
            {generateError && (
              <div className="mt-2 bg-red-900/30 border border-red-500/30 rounded-lg px-2 py-1.5 text-xs text-red-300">
                ⚠️ {generateError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detalle del NPC */}
      <div className="flex-1">
        {!selectedNpc ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-3">🎭</div>
              <p>Selecciona un NPC o genera uno nuevo</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-start justify-between mb-4">
              {editingNpc ? (
                <div className="flex-1 mr-4 space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Nombre</label>
                    <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase">Raza/Clase</label>
                      <input value={editForm.race || ''} onChange={e => setEditForm({ ...editForm, race: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase">Estado Vital</label>
                      <select value={editForm.is_alive ? 'alive' : 'dead'} onChange={e => setEditForm({ ...editForm, is_alive: e.target.value === 'alive' })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm">
                        <option value="alive">🟢 Vivo</option><option value="dead">💀 Muerto</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 uppercase">Relación</label>
                      <select value={editForm.relationship_to_party || 'neutral'} onChange={e => setEditForm({ ...editForm, relationship_to_party: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm">
                        <option value="aliado">Aliado</option><option value="enemigo">Enemigo</option>
                        <option value="neutral">Neutral</option><option value="desconocido">Desconocido</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedNpc.name}
                    <span className="text-sm">{selectedNpc.is_alive ? '🟢' : '💀'}</span>
                  </h3>
                  {selectedNpc.race && (
                    <span className="text-purple-300 text-sm">{selectedNpc.race}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 flex-col sm:flex-row">
                {editingNpc ? (
                  <>
                    <button onClick={() => setEditingNpc(false)} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition">Cancelar</button>
                    <button onClick={handleUpdateNpc} disabled={savingNpc} className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded transition">{savingNpc ? 'Guardando...' : 'Guardar'}</button>
                    <button onClick={() => setNpcDeleteModal(selectedNpc)} className="px-3 py-1 text-sm bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded transition border border-red-500/30">🗑️ Borrar</button>
                  </>
                ) : (
                  <>
                    {isGM && (
                      <button onClick={startEditing} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition border border-gray-600"> Editar</button>
                    )}
                    <span className={`capitalize px-2 py-0.5 text-xs border rounded-full ${relationColors[selectedNpc.relationship_to_party] || relationColors.desconocido}`}>
                      {selectedNpc.relationship_to_party || 'desconocido'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {editingNpc ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-500 uppercase">Personalidad</label>
                      <button onClick={handleGenerateTrait} disabled={generatingTrait} className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1">
                        {generatingTrait ? '⏳ Generando...' : '🎲 Tirar rasgo aleatorio'}
                      </button>
                    </div>
                    <textarea value={editForm.personality || ''} onChange={e => setEditForm({ ...editForm, personality: e.target.value })} rows={3} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm resize-none" />
                  </div>
                  <div>
                    <label className="text-xs text-red-400 uppercase">Secrecto</label>
                    <textarea value={editForm.secrets || ''} onChange={e => setEditForm({ ...editForm, secrets: e.target.value })} rows={2} className="w-full bg-red-900/20 border border-red-500/40 rounded px-3 py-2 text-white text-sm resize-none" />
                  </div>
                </>
              ) : (
                <>
                  {selectedNpc.personality && (
                    <div className="group relative">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personalidad</h4>
                        <button onClick={handleGenerateTrait} disabled={generatingTrait} className="opacity-0 group-hover:opacity-100 text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 px-2 py-0.5 rounded transition inline-flex items-center gap-1">
                          {generatingTrait ? '⏳' : '🎲 Generar rasgo'}
                        </button>
                      </div>
                      <p className="text-gray-200 text-sm whitespace-pre-wrap">{selectedNpc.personality}</p>
                    </div>
                  )}

                  {selectedNpc.secrets && (
                    <details className="bg-red-900/20 border border-red-500/20 rounded-lg group">
                      <summary className="p-3 cursor-pointer text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center justify-between opacity-80 hover:opacity-100 transition list-none [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center italic">Secreto</span>
                        <span className="text-[10px] bg-red-900/50 px-2 py-0.5 rounded border border-red-500/30 font-medium group-open:hidden">Revelar</span>
                        <span className="text-[10px] bg-red-900/50 px-2 py-0.5 rounded border border-red-500/30 font-medium hidden group-open:block">Ocultar</span>
                      </summary>
                      <div className="px-3 pb-3 pt-1 border-t border-red-500/10 mt-1">
                        <p className="text-gray-200 text-sm whitespace-pre-wrap">{selectedNpc.secrets}</p>
                      </div>
                    </details>
                  )}
                </>
              )}

              {editingNpc ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stats y Habilidades</h4>
                    <button onClick={() => {
                      const no = String(Date.now()).slice(-4);
                      setEditForm(prev => ({ ...prev, stats: { ...(prev.stats || {}), [`Nuevo-${no}`]: '' } }))
                    }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white"
                    >+ Agregar</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(editForm.stats || {})
                      .filter(([key]) => key !== '_prompt')
                      .map(([key, val]) => (
                        <div key={key} className="flex flex-col gap-1 bg-gray-800/80 p-2 rounded border border-gray-700 relative group">
                          <input value={key} onChange={e => {
                            const newStats = { ...editForm.stats };
                            const v = newStats[key];
                            delete newStats[key];
                            newStats[e.target.value] = v;
                            setEditForm({ ...editForm, stats: newStats });
                          }} className="w-full bg-transparent text-xs text-gray-400 focus:outline-none focus:text-gray-200" />
                          <input value={val} onChange={e => setEditForm({ ...editForm, stats: { ...editForm.stats, [key]: e.target.value } })} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm" />
                          <button onClick={() => {
                            const newStats = { ...editForm.stats };
                            delete newStats[key];
                            setEditForm({ ...editForm, stats: newStats });
                          }} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition">×</button>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                selectedNpc.stats && Object.keys(selectedNpc.stats).filter(k => k !== '_prompt').length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stats</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedNpc.stats)
                        .filter(([key]) => key !== '_prompt')
                        .map(([key, val]) => (
                          <div key={key} className="bg-gray-700/50 rounded-lg px-3 py-1 flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-medium">{key}</span>
                            <span className="text-white text-sm font-bold">{val}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              )}

              {selectedNpc.stats?._prompt && (
                <div className="mt-4 border-t border-gray-700/50 pt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prompt original</h4>
                  <div
                    className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-900/50 p-3 flex"
                    onClick={(e) => {
                      const el = e.currentTarget.querySelector('p');
                      if (el.classList.contains('blur-[4px]')) {
                        el.classList.remove('blur-[4px]', 'select-none');
                      } else {
                        el.classList.add('blur-[4px]', 'select-none');
                      }
                    }}
                  >
                    <p className="text-gray-400 text-sm italic blur-[4px] select-none transition-all duration-300 w-full">
                      "{selectedNpc.stats._prompt}"
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
                      <span className="bg-black/90 border border-gray-600 text-white text-xs px-3 py-1.5 rounded shadow-xl">
                        Clic para revelar / ocultar
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Eliminar NPC */}
      {npcDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-red-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar NPC?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Esta acción eliminará a este personaje permanentemente.
              Para confirmar, escribe <span className="text-red-300 font-medium font-mono border-b border-red-500/50">{npcDeleteModal.name}</span>
            </p>
            <input
              type="text"
              value={npcDeleteConfirmText}
              onChange={e => setNpcDeleteConfirmText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400 mb-4"
              placeholder={npcDeleteModal.name}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setNpcDeleteModal(null)
                  setNpcDeleteConfirmText('')
                }}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteNpc}
                disabled={npcDeleteConfirmText !== npcDeleteModal.name || npcDeleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
              >
                {npcDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Tab: Asistente Chat (RAG)
// ============================================================================
export function AssistantTab({ campaignId }) {
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
export function SettingsTab({ campaign, onUpdate, isGM = false, onCampaignDeleted = null }) {
  const [name, setName] = useState(campaign?.name || '')
  const [description, setDescription] = useState(campaign?.description || '')
  const [loreSummary, setLoreSummary] = useState(campaign?.lore_summary || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const navigate = useNavigate()

  // Modal eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleCopyCode = () => {
    if (!currentCode) return
    navigator.clipboard.writeText(currentCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await campaignAPI.update(campaign.id, {
        name,
        description,
        lore_summary: loreSummary
      })
      setSaveMsg('✅ Cambios guardados')
      if (onUpdate) onUpdate(res.data)
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      setSaveMsg('⚠️ ' + (e?.response?.data?.detail || 'Error guardando'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== campaign.name) return
    setDeleting(true)
    try {
      const response = await campaignAPI.delete(campaign.id)
      console.log('✅ Campaign deleted successfully:', response.status)
      // Cerrar modal primero
      setShowDeleteModal(false)
      setDeleteConfirmText('')
      // Llamar callback para volver a Dashboard
      if (onCampaignDeleted) {
        setTimeout(() => {
          onCampaignDeleted()
        }, 300)
      }
    } catch (e) {
      console.error('❌ Error deleting campaign:', e)
      setDeleting(false)
      setSaveMsg('⚠️ Error al eliminar: ' + (e?.response?.data?.detail || e.message))
    }
  }

  if (!isGM) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-8">
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">⚔️</div>
          <h3 className="text-white font-bold text-lg mb-2">Modo Jugador</h3>
          <p className="text-gray-400 text-sm">Solo el Dungeon Master puede acceder a la configuración de la campaña.</p>
        </div>
      </div>
    )
  }

  const [currentCode, setCurrentCode] = useState(campaign?.invite_code || null)
  const [generatingCode, setGeneratingCode] = useState(false)

  const handleGenerateCode = async () => {
    setGeneratingCode(true)
    try {
      const res = await campaignAPI.regenerateCode(campaign.id)
      setCurrentCode(res.data.invite_code)
      if (onUpdate) onUpdate({ ...campaign, invite_code: res.data.invite_code })
    } catch (e) {
      console.error('Error generando código:', e)
    } finally {
      setGeneratingCode(false)
    }
  }

  const [showCode, setShowCode] = React.useState(false)

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-8">

      {/* ── Código de invitación ── */}
      <div className="bg-gray-800/50 rounded-xl border border-yellow-500/30 p-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider" style={{ margin: 0 }}>
            Código de Invitación
          </h3>
          {currentCode && (
            <button
              onClick={() => setShowCode(v => !v)}
              style={{
                background: 'none', border: 'none',
                color: '#a78bfa', fontSize: '0.8rem',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              {showCode ? '👁 Ocultar' : '🔑 Ver código'}
            </button>
          )}
        </div>
        <p className="text-gray-400 text-sm" style={{ marginBottom: '1rem' }}>
          Comparte este código con tus jugadores para que puedan unirse a la campaña.
        </p>

        {currentCode ? (
          <>
            <div style={{
              maxHeight: showCode ? '120px' : '0',
              opacity: showCode ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: showCode ? 'auto' : 'none',
              marginBottom: showCode ? '1.5rem' : '0'
            }}>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-black/40 border border-yellow-500/30 rounded-xl px-5 py-3 text-center">
                  <span style={{ fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.3em', color: '#fbbf24' }}>
                    {currentCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  style={{
                    background: codeCopied ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.15)',
                    border: `1px solid ${codeCopied ? 'rgba(34,197,94,0.5)' : 'rgba(251,191,36,0.4)'}`,
                    color: codeCopied ? '#86efac' : '#fbbf24',
                    borderRadius: 10, padding: '0.5rem 1rem',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                    whiteSpace: 'nowrap', transition: 'all 0.2s'
                  }}
                >
                  {codeCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
            <button
              onClick={handleGenerateCode}
              disabled={generatingCode}
              title="El código anterior dejará de funcionar"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#6b7280', borderRadius: 8,
                padding: '0.4rem 0.9rem', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s'
              }}
            >
              {generatingCode ? '⏳ Generando...' : 'Generar nuevo código'}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-3">Esta campaña aún no tiene código de invitación.</p>
            <button
              onClick={handleGenerateCode}
              disabled={generatingCode}
              style={{
                background: 'rgba(251,191,36,0.15)',
                border: '1px solid rgba(251,191,36,0.4)',
                color: '#fbbf24', borderRadius: 10,
                padding: '0.65rem 1.5rem', fontWeight: 700,
                cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s'
              }}
            >
              {generatingCode ? '⏳ Generando...' : '✨ Generar Código de Invitación'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 flex flex-col gap-4">
        <h3 className="text-xl font-bold text-white mb-2">Ajustes de Campaña</h3>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nombre</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-[var(--fantasy-gold)] placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descripción Breve</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-[var(--fantasy-gold)] placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 resize-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Lore / Tono de campaña</label>
          <p className="text-xs text-gray-500 mb-2">Guía para el asistente IA y generador de NPCs. Describe aquí el mundo y el progreso de la aventura.</p>
          <textarea
            value={loreSummary}
            onChange={e => setLoreSummary(e.target.value)}
            rows={6}
            className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-[var(--fantasy-gold)] placeholder-[var(--fantasy-gold-muted)] focus:outline-none focus:border-[var(--fantasy-accent)]/50 resize-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[var(--fantasy-accent)] hover:bg-[#e86424] disabled:opacity-50 text-white font-medium rounded-lg transition fantasy-button-glow"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          {saveMsg && <span className="text-sm text-gray-300">{saveMsg}</span>}
        </div>
      </div>

      <div className="bg-red-900/10 border border-red-900/50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-red-400 mb-2">Zona de Peligro</h3>
        <p className="text-gray-400 text-sm mb-4">
          Una vez que elimines una campaña, no hay vuelta atrás. Esto borrará permanentemente la campaña, sus sesiones, NPCs y miembros.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 font-medium rounded-lg transition"
        >
          Eliminar campaña
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-red-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">¿Estás absolutamente seguro?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Esta acción eliminará la campaña y todos sus datos asociados.
              Para confirmar, escribe <span className="text-red-300 font-medium font-mono border-b border-red-500/50">{campaign.name}</span>
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400 mb-4"
              placeholder={campaign.name}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== campaign.name || deleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
              >
                {deleting ? 'Eliminando...' : 'Eliminar permanente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Tab: Personajes de la Campaña
// ============================================================================
export function CharactersTab({ campaignId, onSelectCharacter }) {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await characterAPI.list(campaignId)
        setCharacters(res.data?.characters || [])
      } catch (e) {
        console.error('Error cargando personajes:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campaignId])

  if (loading) return <LoadingSpinner text="Cargando personajes..." />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
      {characters.length === 0 ? (
        <div className="col-span-full py-12 text-center">
          <p className="text-gray-400 font-medium">No hay personajes en esta campaña.</p>
        </div>
      ) : (
        characters.map((char, idx) => (
          <CharacterCard
            key={char.id}
            character={char}
            index={idx}
            onSelect={() => onSelectCharacter(char)}
          />
        ))
      )}
    </div>
  )
}

// ============================================================================
// Tab: Miembros de la Campaña
// ============================================================================
export function MembersTab({ campaignId }) {
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
export default function CampaignView() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [campaign, setCampaign] = useState(null)
  const [userRole, setUserRole] = useState(null) // 'GM' | 'PLAYER'
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [viewingCharacter, setViewingCharacter] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [campRes, membersRes] = await Promise.all([
          campaignAPI.getDetail(campaignId),
          campaignAPI.getMembers(campaignId)
        ])
        setCampaign(campRes.data)
        setUserRole(membersRes.data?.user_role || 'PLAYER')
      } catch {
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campaignId])

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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <LoadingSpinner size={72} text="Cargando campaña..." />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-black/60 border-b border-purple-500/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition"
          >
            <Icon.back />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{campaign?.name || 'Campaña'}</h1>
              {userRole && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                  borderRadius: 20, border: `1px solid ${isGM ? 'rgba(251,191,36,0.5)' : 'rgba(139,92,246,0.5)'}`,
                  background: isGM ? 'rgba(251,191,36,0.15)' : 'rgba(139,92,246,0.15)',
                  color: isGM ? '#fbbf24' : '#a78bfa', letterSpacing: '0.05em'
                }}>
                  {isGM ? 'GM' : 'Jugador'}
                </span>
              )}
            </div>
            {campaign?.description && (
              <p className="text-sm text-gray-400 mt-0.5 truncate max-w-xl">{campaign.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex-shrink-0 bg-black/30 border-b border-gray-700/50 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 ${activeTab === tab.id
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="flex-1 overflow-hidden px-6 py-5">
        <div className="max-w-6xl mx-auto h-full">
          {activeTab === 'notes' && <NotesTab campaignId={campaignId} />}
          {activeTab === 'characters' && <CharactersTab campaignId={campaignId} onSelectCharacter={setViewingCharacter} />}
          {activeTab === 'dice' && (
            <div className="h-full overflow-hidden flex flex-col">
              <DiceBoxRoller />
            </div>
          )}
          {activeTab === 'npcs' && <NpcsTab campaignId={campaignId} isGM={isGM} />}
          {activeTab === 'assistant' && <AssistantTab campaignId={campaignId} />}
          {activeTab === 'ocr' && <OCRTab />}
          {activeTab === 'members' && <MembersTab campaignId={campaignId} />}
          {activeTab === 'settings' && <SettingsTab campaign={campaign} onUpdate={setCampaign} isGM={isGM} />}
        </div>
      </main>

      {viewingCharacter && (
        <LevelUpModal
          character={viewingCharacter}
          campaignId={campaignId}
          onClose={() => setViewingCharacter(null)}
          onUpdate={(updated) => {
            // No reseteamos setViewingCharacter(null) para permitir seguir viendo tras editar, 
            // a menos que sea necesario refrescar la lista. Por ahora cerramos para simplificar.
            setViewingCharacter(null)
          }}
          isGM={isGM}
        />
      )}
    </div>
  )
}

// ============================================================================
// Tab: OCR — Leer Imagen (Frontend Only)
// ============================================================================
export function OCRTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-8 overflow-y-auto h-full"
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="text-center">
          <h3 className="font-serif text-2xl font-bold text-white mb-2 underline decoration-purple-500/30">OCR — Leer Imagen</h3>
          <p className="text-sm text-gray-400">Sube una foto de tus notas, mapas o libros para extraer el texto automáticamente.</p>
        </div>

        {/* Drop Zone */}
        <label
          htmlFor="ocr-file-input"
          className="group flex flex-col items-center justify-center gap-6 border-2 border-dashed border-purple-500/40 hover:border-purple-500/80 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl p-12 cursor-pointer transition-all duration-300"
        >
          <div className="w-20 h-20 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 flex items-center justify-center transition-all duration-300">
            <Camera size={36} className="text-purple-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-200 text-lg mb-1">Arrastra una imagen aquí</p>
            <p className="text-sm text-gray-500">o haz clic para seleccionar un archivo</p>
            <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">PNG · JPG · WEBP · PDF</p>
          </div>
          <div className="flex items-center gap-3 px-6 py-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300 font-bold text-sm group-hover:bg-purple-500/30 transition-all">
            <Upload size={16} />
            Seleccionar Archivo
          </div>
          <input id="ocr-file-input" type="file" accept="image/*,.pdf" className="hidden" />
        </label>

        {/* Preview placeholder */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <Image size={18} className="text-gray-500" />
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Vista Previa / Resultado</span>
          </div>
          <div className="min-h-[120px] flex items-center justify-center">
            <p className="text-sm text-gray-600 italic">El texto extraído aparecerá aquí…</p>
          </div>
        </div>

        <button className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 uppercase tracking-widest text-xs">
          <Camera size={16} />
          Analizar Imagen
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Tab: Voice — Enviar Audio (Frontend Only)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { sessionAPI, dnd5eAPI } from '../../services/api'
import NotesSidebar from './notes/NotesSidebar'
import DeleteSessionModal from './notes/DeleteSessionModal'
import NoteItem from './notes/NoteItem'
import NotesInput from './notes/NotesInput'

// ============================================================================
// Tab: Notas de Sesión (con análisis IA)
// ============================================================================

export default function NotesTab({ campaignId, isGM }) {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [sending, setSending] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [creatingSession, setCreatingSession] = useState(false)
  const [createSessionError, setCreateSessionError] = useState('')
  const [endingSession, setEndingSession] = useState(false)
  const [startingSession, setStartingSession] = useState(false)

  // Estado del modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState(null) // { session } | null
  
  // Cargar borrador guardado al cambiar de sesión
  useEffect(() => {
    if (activeSession) {
      const savedDraft = localStorage.getItem(`note_draft_${activeSession.id}`)
      if (savedDraft) setNoteText(savedDraft)
      else setNoteText('')
    }
  }, [activeSession])

  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Estado para editar nota
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteText, setEditNoteText] = useState('')
  const [updatingNote, setUpdatingNote] = useState(false)
  
  // Estado para cambiar privacidad de nota
  const [togglingNoteId, setTogglingNoteId] = useState(null)

  // Polling de análisis de notas
  const [pendingAnalysis, setPendingAnalysis] = useState(new Set())
  const pendingRef = useRef(pendingAnalysis)
  pendingRef.current = pendingAnalysis

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

  const handleEndSession = async () => {
    if (!activeSession) return
    if (!window.confirm('¿Seguro que deseas finalizar esta sesión? Esto la cerrará y evaluará si corresponde generar una crónica por lotes.')) return
    
    setEndingSession(true)
    try {
      const res = await sessionAPI.end(activeSession.id)
      await loadSessions()
      setActiveSession(prev => prev ? { ...prev, is_active: false } : null)
      
      if (res.data?.chronicle) {
        alert(`🎉 ¡Sesión finalizada con éxito! Se ha generado una nueva Crónica: "${res.data.chronicle.chronicle_title}"`)
      } else {
        alert('✅ Sesión finalizada con éxito.')
      }
    } catch (e) {
      console.error('Error finalizando sesión:', e)
      alert('Error al finalizar la sesión. Inténtalo de nuevo.')
    } finally {
      setEndingSession(false)
    }
  }

  const handleStartSession = async () => {
    if (!activeSession) return
    if (!window.confirm('¿Seguro que deseas reabrir esta sesión? Volverá a estar "En curso" para agregar o editar notas.')) return
    
    setStartingSession(true)
    try {
      await sessionAPI.start(activeSession.id)
      await loadSessions()
      setActiveSession(prev => prev ? { ...prev, is_active: true } : null)
      alert('🎉 Sesión reabierta con éxito. ¡Vuelve a estar en curso!')
    } catch (e) {
      console.error('Error iniciando sesión:', e)
      alert('Error al reabrir la sesión. Inténtalo de nuevo.')
    } finally {
      setStartingSession(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !activeSession) return
    
    const content = noteText
    const tempId = `temp-${Date.now()}`
    
    // 1. Optimistic Update
    const optimisticNote = {
      id: tempId,
      content: content,
      created_at: new Date().toISOString(),
      author_id: 'me',
      is_public: false,
      is_optimistic: true
    }
    
    setNotes(prev => [...prev, optimisticNote])
    setNoteText('')
    if (activeSession) {
      localStorage.removeItem(`note_draft_${activeSession.id}`)
    }
    
    setSending(true)
    setAnalysis(null)
    
    try {
      const res = await sessionAPI.addNote(activeSession.id, content)
      const data = res.data
      
      // 2. Replace optimistic note with real one
      setNotes(prev => prev.map(n => n.id === tempId ? data.note : n))
      
      // 3. Marcar como pendiente de análisis si no tiene items/NPCs detectados
      if (data.note && data.status === 'pending_analysis') {
        setPendingAnalysis(prev => new Set(prev).add(data.note.id))
      }
      
      if (data.analysis) {
        setAnalysis(data.analysis)
      }
    } catch (e) {
      console.error('Error agregando nota:', e)
      
      // 3. Rollback optimistic update on error
      setNotes(prev => prev.filter(n => n.id !== tempId))
      setNoteText(content)
      if (activeSession) {
        localStorage.setItem(`note_draft_${activeSession.id}`, content)
      }
    } finally {
      setSending(false)
    }
  }



  // Polling: cuando hay notas pendientes de análisis, refrescar cada 3s
  useEffect(() => {
    if (pendingAnalysis.size === 0 || !activeSession) return
    const interval = setInterval(async () => {
      try {
        const res = await sessionAPI.getNotes(activeSession.id)
        const freshNotes = res.data?.notes || []
        setNotes(freshNotes)
        // Verificar si las notas pendientes ya tienen análisis
        const stillPending = freshNotes
          .filter(n => pendingRef.current.has(n.id))
          .filter(n => !n.detected_items?.length && !n.detected_npcs?.length)
          .map(n => n.id)
        if (stillPending.length === 0) {
          clearInterval(interval)
        }
        setPendingAnalysis(new Set(stillPending))
      } catch {
        // ignore polling errors
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [activeSession, pendingAnalysis.size])

  const handleStartEditNote = (note) => {
    setEditingNoteId(note.id)
    setEditNoteText(note.content)
  }

  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setEditNoteText('')
  }

  const handleUpdateNote = async (noteId) => {
    if (!editNoteText.trim()) return
    setUpdatingNote(true)
    try {
      const res = await sessionAPI.updateNote(noteId, editNoteText)
      setAnalysis(res.data.analysis)
      await loadNotes(activeSession.id)
      setEditingNoteId(null)
      setEditNoteText('')
    } catch (e) {
      console.error('Error actualizando nota:', e)
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
    }
  }

  const handleToggleNoteVisibility = async (note) => {
    setTogglingNoteId(note.id)
    try {
      const newIsPublic = !note.is_public
      await sessionAPI.toggleNoteVisibility(note.id, newIsPublic)
      await loadNotes(activeSession.id)
      const statusMsg = newIsPublic ? 'Nota compartida públicamente' : 'Nota volvió a ser privada'
    } catch (e) {
      console.error('Error cambiando privacidad:', e)
    } finally {
      setTogglingNoteId(null)
    }
  }

  const handleNoteTextChange = async (e) => {
    const text = e.target.value
    setNoteText(text)
    
    // Guardar borrador local
    if (activeSession) {
      localStorage.setItem(`note_draft_${activeSession.id}`, text)
    }
    
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
    <div className="w-full h-full overflow-hidden relative flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={campaignId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col md:flex-row h-full"
        >
          <NotesSidebar 
            sessions={sessions}
            activeSession={activeSession}
            selectSession={selectSession}
            handleCreateSession={handleCreateSession}
            creatingSession={creatingSession}
            createSessionError={createSessionError}
            loadingSessions={loadingSessions}
            openDeleteModal={openDeleteModal}
          />

          {/* Panel de Contenido / Notas */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {!activeSession ? (
              <div className="absolute inset-0 flex items-center justify-center text-fantasy-gold/20 flex-col gap-4">
                <BookOpen size={48} />
                <p className="text-sm">Selecciona una sesión para ver sus notas</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 overflow-hidden">
                <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold font-serif text-lg">
                      {activeSession.title || `Sesión ${activeSession.session_number}`}
                    </h3>
                    {activeSession.is_active ? (
                      <span className="px-2.5 py-0.5 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-bold uppercase tracking-wider animate-pulse">
                        En curso
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[10px] bg-white/5 text-gray-400 border border-white/10 rounded-full font-bold uppercase tracking-wider">
                        Finalizada
                      </span>
                    )}
                  </div>

                  {activeSession.is_active && isGM && (
                    <button
                      onClick={handleEndSession}
                      disabled={endingSession}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white font-display font-semibold text-xs tracking-wider rounded-xl transition duration-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(220,38,38,0.2)] border border-red-500/30 flex-shrink-0"
                    >
                      {endingSession ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>CERRANDO...</span>
                        </>
                      ) : (
                        <>
                          <span>🏁</span>
                          <span>FINALIZAR SESIÓN</span>
                        </>
                      )}
                    </button>
                  )}

                  {!activeSession.is_active && isGM && (
                    <button
                      onClick={handleStartSession}
                      disabled={startingSession}
                      className="px-3.5 py-1.5 bg-green-600 hover:bg-green-500 active:scale-95 disabled:opacity-50 text-white font-display font-semibold text-xs tracking-wider rounded-xl transition duration-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(22,163,74,0.2)] border border-green-500/30 flex-shrink-0"
                    >
                      {startingSession ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>ABRIENDO...</span>
                        </>
                      ) : (
                        <>
                          <span>▶️</span>
                          <span>REABRIR SESIÓN</span>
                        </>
                      )}
                    </button>
                  )}
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
                      <NoteItem 
                        key={note.id}
                        note={note}
                        togglingNoteId={togglingNoteId}
                        handleToggleNoteVisibility={handleToggleNoteVisibility}
                        handleStartEditNote={handleStartEditNote}
                        handleDeleteNote={handleDeleteNote}
                        editingNoteId={editingNoteId}
                        editNoteText={editNoteText}
                        setEditNoteText={setEditNoteText}
                        handleCancelEditNote={handleCancelEditNote}
                        handleUpdateNote={handleUpdateNote}
                        updatingNote={updatingNote}
                        isAnalyzing={pendingAnalysis.has(note.id)}
                      />
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

                <NotesInput 
                  noteText={noteText}
                  setNoteText={setNoteText}
                  handleNoteTextChange={handleNoteTextChange}
                  handleAddNote={handleAddNote}
                  sending={sending}
                  voiceError={voiceError}
                  setVoiceError={setVoiceError}
                  textareaRef={textareaRef}
                  showAutocomplete={showAutocomplete}
                  autocomplete={autocomplete}
                  autocompletePosition={autocompletePosition}
                  handleSelectSuggestion={handleSelectSuggestion}
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <DeleteSessionModal 
        deleteModal={deleteModal}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        handleDeleteSession={handleDeleteSession}
        closeDeleteModal={closeDeleteModal}
        deleting={deleting}
      />
    </div>
  )
}

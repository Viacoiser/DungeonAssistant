import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Swords, Shield, Skull, Plus, Trash2, ChevronRight, 
  History, UserPlus, Check, Lock, RefreshCw, Dices, Play, Square,
  AlertTriangle, User, Sparkles
} from 'lucide-react'
import { getSocket } from '../../services/socket'
import { characterAPI, npcAPI } from '../../services/api'

// Beautiful sub-component to render rapidly rolling dice numbers for active rolls
function RollingBadge({ modifier }) {
  const [num, setNum] = useState(10)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setNum(Math.floor(Math.random() * 20) + 1)
    }, 70)
    return () => clearInterval(interval)
  }, [])

  const displayTotal = num + parseInt(modifier || 0)

  return (
    <div className="px-3 py-1 bg-[#18120e] border border-fantasy-accent/30 rounded-lg font-display font-black text-sm text-fantasy-accent/90 flex items-center gap-1.5 shadow-[0_0_12px_rgba(217,83,30,0.15)] animate-pulse">
      <RefreshCw size={11} className="animate-spin text-fantasy-accent" />
      <span>{displayTotal}</span>
    </div>
  )
}

export default function LiveInitiativeTracker({ campaignId, isGM, user, combatState, onClose }) {
  const socket = getSocket()
  
  // Local states
  const [character, setCharacter] = useState(null)
  const [npcs, setNpcs] = useState([])
  const [loadingChar, setLoadingChar] = useState(false)
  
  // Rolling phase states (Player/GM)
  const [isRolling, setIsRolling] = useState(false)
  const [rollValue, setRollValue] = useState(null)
  const [tempTotal, setTempTotal] = useState(null)
  const [hasRolled, setHasRolled] = useState(false)
  const [confirmedRoll, setConfirmedRoll] = useState(null)
  
  // GM Monster entry states
  const [monsterName, setMonsterName] = useState('')
  const [monsterMod, setMonsterMod] = useState(0)
  const [monsterQty, setMonsterQty] = useState(1)
  const [selectedNpcId, setSelectedNpcId] = useState('')
  const [monsterRolling, setMonsterRolling] = useState(false) // local animation state for GM
  const [combatError, setCombatError] = useState(null)
  
  // Visual rolling effect
  const [rollingNumber, setRollingNumber] = useState(20)
  const rollIntervalRef = useRef(null)

  // Load player character (if PLAYER) and campaign NPCs (if GM)
  // NOTE: This runs only on mount / when campaign/user changes — NOT on every combat turn update
  useEffect(() => {
    const loadData = async () => {
      if (!isGM && user) {
        setLoadingChar(true)
        try {
          const res = await characterAPI.list(campaignId)
          const playerChars = res.data?.characters?.filter(c => c.player_id === user.id) || []
          if (playerChars.length > 0) {
            setCharacter(playerChars[0])
          }
        } catch (e) {
          console.error('Error cargando personaje del jugador:', e)
        } finally {
          setLoadingChar(false)
        }
      }
      
      if (isGM) {
        try {
          const res = await npcAPI.list(campaignId)
          setNpcs(res.data || [])
        } catch (e) {
          console.error('Error cargando NPCs de la campaña:', e)
        }
      }
    }
    
    loadData()
  }, [campaignId, isGM, user])

  // Listen for combat_error events from backend
  useEffect(() => {
    if (!socket) return
    const handleError = (data) => {
      setCombatError(data.message || 'Error en combate')
      setMonsterRolling(false)
      setTimeout(() => setCombatError(null), 4000)
    }
    socket.on('combat_error', handleError)
    return () => socket.off('combat_error', handleError)
  }, [socket])

  // When combat state updates, clear local monster rolling state
  useEffect(() => {
    if (monsterRolling) {
      // Server broadcast received — animation shown on server side now
      setMonsterRolling(false)
    }
  }, [combatState.turns?.length])

  // Monitor updates to combat turns to sync lock states
  useEffect(() => {
    if (character && combatState.turns) {
      const myTurn = combatState.turns.find(t => t.id === character.id)
      if (myTurn) {
        setRollValue(myTurn.roll)
        setTempTotal(myTurn.total)
        setHasRolled(true)
        if (myTurn.confirmed) {
          setConfirmedRoll(myTurn.total)
        }
      } else {
        // Reset local states if character is no longer in active combat turns list
        setRollValue(null)
        setTempTotal(null)
        setHasRolled(false)
        setConfirmedRoll(null)
      }
    }
  }, [combatState.turns, character])

  // Auto-close drawer when combat ends (status goes back to 'inactive')
  const prevStatusRef = useRef(combatState.status)
  useEffect(() => {
    const prev = prevStatusRef.current
    const curr = combatState.status
    prevStatusRef.current = curr
    // Only close if we were in an active combat and it just ended
    if ((prev === 'rolling' || prev === 'active') && curr === 'inactive') {
      onClose()
    }
  }, [combatState.status])

  // Scroll to bottom of history log
  const historyEndRef = useRef(null)
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [combatState.history])

  // Custom visual D20 rolling animation
  const startRollAnimation = () => {
    setIsRolling(true)
    let counter = 0
    rollIntervalRef.current = setInterval(() => {
      setRollingNumber(Math.floor(Math.random() * 20) + 1)
      counter++
      if (counter > 15) {
        clearInterval(rollIntervalRef.current)
        finalizeRoll()
      }
    }, 60)
  }

  const finalizeRoll = () => {
    const d20Roll = Math.floor(Math.random() * 20) + 1
    const mod = character ? (character.initiative ?? 0) : 0
    const total = d20Roll + mod
    
    setRollValue(d20Roll)
    setTempTotal(total)
    setIsRolling(false)
    setHasRolled(true)
    
    // Send preliminary roll to server via socket
    if (socket && character) {
      socket.emit('submit_initiative', {
        campaign_id: campaignId,
        participant_id: character.id,
        name: character.name,
        roll: d20Roll,
        modifier: mod,
        total: total,
        is_monster: false
      })
    }
  }

  const handleConfirm = () => {
    if (socket && character && rollValue !== null) {
      socket.emit('confirm_initiative', {
        campaign_id: campaignId,
        participant_id: character.id
      })
      setConfirmedRoll(tempTotal)
    }
  }

  // GM functions
  const handleStartCombat = () => {
    if (socket) {
      socket.emit('start_combat', { campaign_id: campaignId })
    }
  }

  const handleFinishRolling = () => {
    if (socket) {
      socket.emit('finish_rolling_phase', { campaign_id: campaignId })
    }
  }

  const handleNextTurn = () => {
    if (socket) {
      socket.emit('next_turn', { campaign_id: campaignId })
    }
  }

  const handlePrevTurn = () => {
    if (socket) {
      socket.emit('prev_turn', { campaign_id: campaignId })
    }
  }

  const handleEndCombat = () => {
    if (window.confirm('¿Estás seguro de que deseas finalizar este combate? Se limpiará el listado actual.')) {
      if (socket) {
        socket.emit('end_combat', { campaign_id: campaignId })
      }
    }
  }

  const handleDeleteParticipant = (id, name) => {
    if (window.confirm(`¿Remover a ${name} del combate?`)) {
      if (socket) {
        socket.emit('delete_participant', { campaign_id: campaignId, participant_id: id })
      }
    }
  }

  // GM Monster Actions
  const handleAddMonster = () => {
    if (!monsterName.trim() || monsterRolling) return
    
    if (socket) {
      // Show immediate local rolling animation
      setMonsterRolling(true)
      setCombatError(null)
      
      socket.emit('add_monster', {
        campaign_id: campaignId,
        name: monsterName.trim(),
        modifier: parseInt(monsterMod || 0),
        quantity: parseInt(monsterQty || 1)
      })
    }
    
    // Clear monster entry inputs
    setMonsterName('')
    setMonsterMod(0)
    setMonsterQty(1)
    setSelectedNpcId('')
  }

  // Pre-fill monster inputs when GM selects a campaign NPC
  const handleNpcSelect = (e) => {
    const npcId = e.target.value
    setSelectedNpcId(npcId)
    if (npcId === '') {
      setMonsterName('')
      setMonsterMod(0)
    } else {
      const npc = npcs.find(n => n.id === npcId)
      if (npc) {
        setMonsterName(npc.name)
        // Check if NPC has initiative modifier in stats
        const dex = npc.stats?.dexterity || 10
        const dexMod = Math.floor((dex - 10) / 2)
        setMonsterMod(dexMod)
      }
    }
  }

  // Helpers
  const formatModifier = (val) => {
    const num = parseInt(val)
    if (isNaN(num)) return '+0'
    return num >= 0 ? `+${num}` : `${num}`
  }

  // Active character turn status (for logged-in Player)
  const isMyTurn = () => {
    if (combatState.status !== 'active' || !character) return false
    const activeParticipant = combatState.turns[combatState.current_turn]
    return activeParticipant && activeParticipant.id === character.id
  }

  const getActiveParticipantName = () => {
    if (combatState.status !== 'active' || !combatState.turns?.length) return ''
    return combatState.turns[combatState.current_turn]?.name || ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm overflow-hidden animate-fade-in">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-2xl h-screen bg-[#0d0a08] border-l border-fantasy-gold/20 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] relative"
      >
        {/* Glowing visual effect in background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-fantasy-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-900/5 rounded-full blur-[100px] pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fantasy-gold/15 bg-black/40 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fantasy-accent/15 border border-fantasy-accent/30 flex items-center justify-center text-fantasy-accent shadow-[0_0_12px_rgba(217,83,30,0.2)]">
              <Swords size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-white tracking-wide">Iniciativa en Vivo</h2>
              <p className="text-xs text-fantasy-gold/60 uppercase tracking-widest">
                {combatState.status === 'rolling' && '⚔️ Fase de Tiradas'}
                {combatState.status === 'active' && '⚔️ Combate Activo'}
                {combatState.status === 'inactive' && '⚔️ Sala de Combate'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-fantasy-gold/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── MAIN SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6 z-10 relative">
          
          {/* GM Setup (Combat inactive) */}
          {combatState.status === 'inactive' && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-white/3 border border-white/10 flex items-center justify-center text-fantasy-gold/30">
                <Dices size={44} />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="font-serif text-2xl text-white font-semibold">El combate no ha comenzado</h3>
                <p className="text-sm text-fantasy-gold/60 leading-relaxed">
                  {isGM 
                    ? 'Como Dungeon Master, puedes iniciar el combate para que todos los jugadores conectados tiren iniciativa en tiempo real.' 
                    : 'Esperando a que el Dungeon Master inicie el combate. ¡Prepara tus dados y tu modificador de iniciativa!'}
                </p>
              </div>

              {isGM && (
                <button 
                  onClick={handleStartCombat}
                  className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:brightness-110 border border-amber-500/40 text-white font-display font-bold tracking-widest rounded-xl transition duration-200 shadow-[0_0_20px_rgba(180,83,9,0.3)] active:scale-95 flex items-center gap-2"
                >
                  <Play size={18} />
                  <span>INICIAR COMBATE</span>
                </button>
              )}
            </div>
          )}

          {/* ── PLAYER ACTIVE TURN BANNER ── */}
          {combatState.status === 'active' && isMyTurn() && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-gradient-to-br from-fantasy-accent/25 via-amber-950/20 to-transparent border-2 border-fantasy-accent/60 rounded-2xl flex flex-col items-center text-center space-y-2 shadow-[0_0_30px_rgba(217,83,30,0.3)] relative overflow-hidden"
            >
              {/* Flame overlay animation */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,83,30,0.15),transparent_70%)] animate-pulse pointer-events-none" />
              
              <span className="relative z-10 text-[10px] uppercase font-bold tracking-widest text-fantasy-accent flex items-center gap-1">
                <Sparkles size={12} className="animate-spin-slow" />
                ¡Tu Turno!
                <Sparkles size={12} className="animate-spin-slow" />
              </span>
              <h3 className="relative z-10 font-serif text-2xl font-bold text-white tracking-wide">
                ¡Es tu turno de actuar, {character?.name}!
              </h3>
              <p className="relative z-10 text-xs text-fantasy-gold/80 max-w-sm leading-relaxed">
                Describe tus acciones al DM, lanza tus dados de ataque o conjuros, y asiste a tus aliados.
              </p>
            </motion.div>
          )}

          {/* ── PLAYER ROLLING SECTION ── */}
          {combatState.status === 'rolling' && !isGM && (
            <div className="p-5 bg-white/3 border border-white/5 rounded-2xl space-y-5 relative">
              <h3 className="font-serif text-lg text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-3">
                <Dices size={18} className="text-fantasy-accent" />
                Tu Tirada de Iniciativa
              </h3>

              {loadingChar ? (
                <div className="py-8 text-center text-fantasy-gold/50 text-sm animate-pulse">Cargando personaje...</div>
              ) : !character ? (
                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-center space-y-3">
                  <AlertTriangle size={32} className="text-red-400 mx-auto" />
                  <p className="text-xs text-red-300">
                    No tienes ningún personaje asignado a esta campaña. Para participar en la iniciativa, debes crear o unirte con un personaje.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
                  <div className="space-y-1.5 text-center md:text-left">
                    <div className="text-xs uppercase tracking-widest text-fantasy-gold/50">Personaje Activo</div>
                    <div className="text-base font-bold text-white">{character.name}</div>
                    <div className="text-xs text-fantasy-accent font-semibold bg-fantasy-accent/15 border border-fantasy-accent/30 px-2.5 py-0.5 rounded-full inline-block">
                      Iniciativa: {formatModifier(character.initiative)}
                    </div>
                  </div>

                  {/* Dice Rolled result / Animation */}
                  <div className="flex flex-col items-center space-y-3">
                    {/* Visual 3D-like D20 container */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className={`absolute inset-0 rounded-full bg-fantasy-gold/5 filter blur-lg transition-opacity duration-300 ${isRolling ? 'opacity-100' : 'opacity-40'}`} />
                      
                      <motion.div 
                        animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
                        transition={isRolling ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0.2 }}
                        className="text-fantasy-accent drop-shadow-[0_0_20px_rgba(217,83,30,0.4)]"
                      >
                        <svg width="90" height="90" viewBox="0 0 100 100" fill="currentColor">
                          <polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="#130e0b" stroke="currentColor" strokeWidth="2.5" />
                          <polygon points="50,5 50,38 95,30" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <polygon points="50,5 50,38 5,30" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <polygon points="5,30 50,38 50,75" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <polygon points="95,30 50,38 50,75" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <polygon points="5,70 50,75 50,95" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <polygon points="95,70 50,75 50,95" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </motion.div>

                      {/* Number inside the D20 */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        {isRolling ? (
                          <span className="font-display font-black text-2xl animate-pulse">{rollingNumber}</span>
                        ) : rollValue !== null ? (
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                          >
                            <span className="font-display font-black text-3xl text-fantasy-gold">{rollValue}</span>
                          </motion.div>
                        ) : (
                          <Dices size={24} className="text-fantasy-gold/30" />
                        )}
                      </div>
                    </div>

                    {/* Math breakdown formula */}
                    {hasRolled && !isRolling && (
                      <div className="text-center">
                        <div className="text-2xl font-black text-white">{tempTotal}</div>
                        <div className="text-[10px] text-fantasy-gold/60">
                          Total dado: {tempTotal} ({rollValue} + {formatModifier(character.initiative)} Mod)
                        </div>
                      </div>
                    )}

                    {/* Actions: Roll / Confirm */}
                    <div className="flex gap-2">
                      {!hasRolled && (
                        <button
                          onClick={startRollAnimation}
                          disabled={isRolling}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:brightness-110 border border-amber-500/40 text-white font-display font-bold text-xs tracking-wider rounded-xl transition shadow-[0_0_12px_rgba(180,83,9,0.25)] active:scale-95 disabled:opacity-50"
                        >
                          LANZAR DADO
                        </button>
                      )}

                      {hasRolled && !confirmedRoll && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={startRollAnimation}
                            disabled={isRolling}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-fantasy-gold active:scale-95 transition"
                            title="Volver a lanzar"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={handleConfirm}
                            className="px-4 py-2.5 bg-green-700 hover:bg-green-600 border border-green-500/40 text-white font-display font-bold text-xs tracking-wider rounded-xl transition shadow-[0_0_12px_rgba(34,197,94,0.25)] active:scale-95 flex items-center gap-1.5"
                          >
                            <Check size={14} />
                            CONFIRMAR
                          </button>
                        </div>
                      )}

                      {confirmedRoll && (
                        <div className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/25 px-4 py-2 rounded-xl flex items-center gap-1.5">
                          <Lock size={12} />
                          TIRADA BLOQUEADA
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GM COMBAT DASHBOARD PANEL ── */}
          {isGM && (
            <div className="p-5 bg-white/3 border border-white/5 rounded-2xl space-y-4">
              <h3 className="font-serif text-lg text-white font-semibold flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-amber-500" />
                  Panel del Dungeon Master
                </div>
                {combatState.status !== 'inactive' && (
                  <button
                    onClick={handleEndCombat}
                    className="px-3 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 font-display font-bold text-[10px] tracking-wider rounded-lg transition active:scale-95"
                  >
                    FINALIZAR COMBATE
                  </button>
                )}
              </h3>

              {combatState.status === 'rolling' && (
                <div className="space-y-4">
                  {/* Quick roll / Add custom monster */}
                  <div className="p-3.5 bg-black/45 border border-white/5 rounded-xl space-y-3">
                    <div className="text-xs uppercase font-bold tracking-widest text-fantasy-gold/60 flex items-center gap-1">
                      <UserPlus size={12} />
                      Agregar Monstruo o Enemigo
                    </div>
                    
                    {/* Error message from backend */}
                    {combatError && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300">
                        <AlertTriangle size={12} />
                        {combatError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Select NPC from campaign dropdown */}
                      <div className="space-y-1 col-span-2 md:col-span-1">
                        <label className="text-[10px] text-fantasy-gold/50">Cargar desde NPCs:</label>
                        <select 
                          value={selectedNpcId}
                          onChange={handleNpcSelect}
                          className="w-full bg-[#140f0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-fantasy-gold/45 h-[34px]"
                        >
                          <option value="">-- Manual --</option>
                          {npcs.map(n => (
                            <option key={n.id} value={n.id}>{n.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Monster Name */}
                      <div className="space-y-1 col-span-2 md:col-span-2">
                        <label className="text-[10px] text-fantasy-gold/50">Nombre en Combate:</label>
                        <input
                          type="text"
                          placeholder="Nombre (ej: Orco Boss)"
                          value={monsterName}
                          onChange={e => setMonsterName(e.target.value)}
                          className="w-full bg-[#140f0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-fantasy-gold/45 h-[34px]"
                        />
                      </div>

                      {/* Modifier */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-fantasy-gold/50">Bono Iniciativa:</label>
                        <input
                          type="number"
                          value={monsterMod}
                          onChange={e => setMonsterMod(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#140f0c] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-fantasy-gold/45 h-[34px]"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-fantasy-gold/50">Cantidad:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={monsterQty}
                          onChange={e => setMonsterQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#140f0c] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-fantasy-gold/45 h-[34px]"
                        />
                      </div>

                      {/* Submit */}
                      <div className="flex items-end col-span-2 md:col-span-1">
                        <button
                          onClick={handleAddMonster}
                          disabled={!monsterName.trim() || monsterRolling}
                          className={`w-full py-1.5 border text-fantasy-gold font-display font-semibold text-xs tracking-wider rounded-lg transition active:scale-95 disabled:opacity-40 h-[34px] flex items-center justify-center gap-1.5
                            ${monsterRolling 
                              ? 'bg-amber-700/60 border-amber-500/50 cursor-not-allowed' 
                              : 'bg-amber-800/40 hover:bg-amber-800/60 border-amber-600/30'
                            }
                          `}
                        >
                          <Dices size={14} className={monsterRolling ? 'animate-spin' : 'animate-pulse'} />
                          <span>{monsterRolling ? 'RODANDO...' : 'RODAR Y AGREGAR'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions for rolling phase */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="text-xs text-fantasy-gold/50">
                      Tiradas confirmadas: {combatState.turns?.filter(t => t.confirmed).length || 0} / {combatState.turns?.length || 0}
                    </div>
                    
                    <button
                      onClick={handleFinishRolling}
                      disabled={!combatState.turns || combatState.turns.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:brightness-110 border border-amber-500/40 text-white font-display font-bold text-xs tracking-wider rounded-xl transition shadow-[0_0_12px_rgba(180,83,9,0.25)] active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      title={!combatState.turns?.length ? 'Agrega al menos un participante para comenzar' : ''}
                    >
                      <Play size={14} />
                      COMENZAR COMBATE
                    </button>
                  </div>
                </div>
              )}

              {combatState.status === 'active' && (
                <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
                  <button
                    onClick={handlePrevTurn}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-fantasy-gold font-display font-bold text-xs tracking-wider rounded-xl transition active:scale-95"
                  >
                    ← TURNO ANTERIOR
                  </button>

                  <button
                    onClick={handleNextTurn}
                    className="px-5 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:brightness-110 border border-amber-500/40 text-white font-display font-bold text-xs tracking-wider rounded-xl transition shadow-[0_0_12px_rgba(180,83,9,0.25)] active:scale-95 flex items-center gap-1.5"
                  >
                    <span>SIGUIENTE TURNO</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── COMBATANTS INITIATIVE QUEUE ── */}
          {combatState.status !== 'inactive' && (
            <div className="space-y-3.5">
              <h3 className="font-serif text-lg text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Shield size={18} className="text-fantasy-gold" />
                Participantes
                <span className="text-xs font-semibold px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-fantasy-gold/60">
                  {combatState.turns?.length || 0}
                </span>
              </h3>

              {(!combatState.turns || combatState.turns.length === 0) ? (
                <div className="py-6 text-center text-fantasy-gold/30 text-sm italic">
                  No hay participantes aún.
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {combatState.turns.map((p, index) => {
                      const isActive = combatState.status === 'active' && combatState.current_turn === index
                      const isMonster = p.is_monster
                      const isCurrentUser = !isGM && character && p.id === character.id
                      
                      return (
                        <motion.div
                          key={p.id}
                          layoutId={p.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`
                            p-3 rounded-xl flex items-center justify-between transition-all duration-300 relative overflow-hidden
                            ${isActive 
                              ? 'bg-gradient-to-r from-fantasy-accent/20 via-[#18120f] to-transparent border-2 border-fantasy-accent shadow-[0_0_20px_rgba(217,83,30,0.25)] scale-[1.01]' 
                              : 'bg-white/3 border border-white/5'
                            }
                            ${isCurrentUser && !isActive ? 'border-l-4 border-l-fantasy-gold pl-2.5' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            {/* Order indicator */}
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center font-display text-xs font-bold
                              ${isActive ? 'bg-fantasy-accent text-white' : 'bg-white/5 text-fantasy-gold/45'}
                            `}>
                              {index + 1}
                            </div>

                            {/* Participant details */}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-semibold text-sm ${isActive ? 'text-white font-bold' : 'text-fantasy-gold/90'}`}>
                                  {p.name}
                                </span>
                                {isMonster && (
                                  <span className="text-[9px] bg-red-500/10 border border-red-500/30 text-red-400 font-bold px-1.5 py-0.2 rounded">
                                    MONSTRUO
                                  </span>
                                )}
                                {isCurrentUser && (
                                  <span className="text-[9px] bg-fantasy-gold/10 border border-fantasy-gold/30 text-fantasy-gold font-bold px-1.5 py-0.2 rounded">
                                    TÚ
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-fantasy-gold/45">
                                {p.confirmed 
                                  ? `Confirmado: ${p.total} (${p.roll} + ${formatModifier(p.modifier)})`
                                  : 'Tirando dados...'
                                }
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 relative z-10">
                            {/* Roll Score Badge */}
                            {p.confirmed ? (
                              <div className={`
                                px-3 py-1 rounded-lg font-display font-black text-sm tracking-wide shadow-inner
                                ${isActive 
                                  ? 'bg-fantasy-accent/20 border border-fantasy-accent/50 text-white' 
                                  : 'bg-[#18120e] border border-white/10 text-fantasy-gold'
                                }
                              `}>
                                {p.total}
                              </div>
                            ) : p.is_rolling ? (
                              <RollingBadge modifier={p.modifier} />
                            ) : (
                              <div className="text-xs text-fantasy-gold/30 italic flex items-center gap-1 animate-pulse">
                                <RefreshCw size={10} className="animate-spin" />
                                Esperando...
                              </div>
                            )}

                            {/* Delete participant button (GM only) */}
                            {isGM && (
                              <button
                                onClick={() => handleDeleteParticipant(p.id, p.name)}
                                className="p-1.5 text-fantasy-gold/40 hover:text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 active:scale-95 transition"
                                title="Eliminar del combate"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* ── BATTLE LOG / HISTORIAL ── */}
          {combatState.status !== 'inactive' && (
            <div className="space-y-2.5">
              <h3 className="font-serif text-lg text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-2">
                <History size={16} className="text-fantasy-gold/50" />
                Historial de Batalla
              </h3>

              <div className="h-44 bg-[#080605] border border-white/5 rounded-2xl p-4 overflow-y-auto space-y-2 text-xs flex flex-col font-sans select-none no-scrollbar shadow-inner">
                {(!combatState.history || combatState.history.length === 0) ? (
                  <div className="text-fantasy-gold/25 italic text-center py-12">No hay registros de combate aún.</div>
                ) : (
                  combatState.history.map((h, i) => (
                    <div key={i} className="flex gap-2 text-fantasy-gold/75 items-start leading-relaxed border-b border-white/2 pb-1.5 last:border-0">
                      <span className="text-[10px] text-fantasy-gold/30 font-mono flex-shrink-0 pt-0.5">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span>{h.message}</span>
                    </div>
                  ))
                )}
                <div ref={historyEndRef} />
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  )
}

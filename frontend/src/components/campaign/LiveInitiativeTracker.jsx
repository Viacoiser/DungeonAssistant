import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Swords, Shield, Plus, Trash2, ChevronRight, 
  History, UserPlus, Check, Lock, RefreshCw, Dices, Play,
  AlertTriangle, User, Sparkles, Minimize2
} from 'lucide-react'
import { getSocket } from '../../services/socket'
import { characterAPI, npcAPI } from '../../services/api'
import monstersData from '../../data/encyclopedia/monsters.json'

// Rapid rolling dice animation for active rolls
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

export default function LiveInitiativeTracker({ campaignId, isGM, user, combatState, onClose, activeUsers = [] }) {
  const socket = getSocket()
  
  const [character, setCharacter] = useState(null)
  const [npcs, setNpcs] = useState([])
  const [loadingChar, setLoadingChar] = useState(false)
  
  const [isRolling, setIsRolling] = useState(false)
  const [rollValue, setRollValue] = useState(null)
  const [tempTotal, setTempTotal] = useState(null)
  const [hasRolled, setHasRolled] = useState(false)
  const [confirmedRoll, setConfirmedRoll] = useState(null)
  
  const [monsterRows, setMonsterRows] = useState([
    { id: 'row_' + Date.now(), selectedNpcId: '', name: '', modifier: 0, quantity: 1 }
  ])
  const [monsterRolling, setMonsterRolling] = useState(false) // local animation state for GM
  const [combatError, setCombatError] = useState(null)
  
  const [rollingNumber, setRollingNumber] = useState(20)
  const rollIntervalRef = useRef(null)

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

  useEffect(() => {
    if (monsterRolling) {
      setMonsterRolling(false)
    }
  }, [combatState.turns?.length])

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
  const handleAddMonsterRow = () => {
    setMonsterRows(prev => [
      ...prev,
      { id: 'row_' + Date.now() + Math.random().toString(36).substr(2, 5), selectedNpcId: '', name: '', modifier: 0, quantity: 1 }
    ])
  }

  const handleRemoveMonsterRow = (id) => {
    if (monsterRows.length === 1) {
      // If it's the last row, just clear it
      setMonsterRows([{ id: 'row_' + Date.now(), selectedNpcId: '', name: '', modifier: 0, quantity: 1 }])
    } else {
      setMonsterRows(prev => prev.filter(row => row.id !== id))
    }
  }

  const handleUpdateMonsterRow = (id, field, value) => {
    setMonsterRows(prev => prev.map(row => {
      if (row.id !== id) return row

      const updatedRow = { ...row, [field]: value }

      // If updating selectedNpcId, auto-fill name and modifier
      if (field === 'selectedNpcId') {
        if (value === '') {
          updatedRow.name = ''
          updatedRow.modifier = 0
        } else if (value.startsWith('npc_')) {
          const npcId = value.replace('npc_', '')
          const npc = npcs.find(n => n.id === npcId)
          if (npc) {
            updatedRow.name = npc.name
            const dex = npc.stats?.dexterity || 10
            updatedRow.modifier = Math.floor((dex - 10) / 2)
          }
        } else if (value.startsWith('encyclopedia_')) {
          const encId = value.replace('encyclopedia_', '')
          const monster = (monstersData || []).find(m => m.id === encId)
          if (monster) {
            updatedRow.name = monster.name.split('/')[0].trim()
            const dex = monster.dexterity || 10
            updatedRow.modifier = Math.floor((dex - 10) / 2)
          }
        }
      }

      return updatedRow
    }))
  }

  const handleAddMonster = () => {
    const validMonsters = monsterRows
      .map(row => ({
        name: row.name.trim(),
        modifier: parseInt(row.modifier || 0),
        quantity: parseInt(row.quantity || 1)
      }))
      .filter(row => row.name !== '')

    if (validMonsters.length === 0 || monsterRolling) return
    
    if (socket) {
      setMonsterRolling(true)
      setCombatError(null)
      
      socket.emit('add_monster', {
        campaign_id: campaignId,
        monsters: validMonsters
      })
    }
    
    setMonsterRows([
      { id: 'row_' + Date.now(), selectedNpcId: '', name: '', modifier: 0, quantity: 1 }
    ])
  }

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
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm overflow-hidden animate-fade-in"
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-2xl h-screen bg-[#0d0a08] border-l border-fantasy-gold/20 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] relative"
      >
        {/* Glowing visual effect in background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-fantasy-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-900/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-fantasy-gold/15 bg-black/40 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fantasy-accent/15 border border-fantasy-accent/30 flex items-center justify-center text-fantasy-accent shadow-[0_0_12px_rgba(217,83,30,0.2)]">
              <Swords size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-white tracking-wide">Iniciativa en Vivo</h2>
              <p className="text-xs text-fantasy-gold/60 uppercase tracking-widest">
                {combatState.status === 'rolling' && 'Fase de Tiradas'}
                {combatState.status === 'active' && 'Combate Activo'}
                {combatState.status === 'inactive' && 'Sala de Combate'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-fantasy-gold/50 hover:text-white hover:bg-white/5 rounded-lg transition z-20"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Banner de control rápido para minimizar (Combate en curso / Fase de Iniciativa) */}
        {(combatState.status === 'rolling' || combatState.status === 'active') && (
          <div className="px-6 py-2.5 bg-fantasy-accent/10 border-b border-fantasy-accent/20 flex items-center justify-between text-xs text-fantasy-gold shadow-sm z-10">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fantasy-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-fantasy-accent"></span>
              </span>
              {combatState.status === 'rolling' ? 'Fase de iniciativa en curso' : 'Combate en curso en segundo plano'}
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gradient-to-r from-fantasy-accent to-red-700 hover:brightness-110 text-white font-display font-semibold text-[10px] tracking-wider rounded-lg transition active:scale-95 flex items-center gap-1 shadow-md border border-fantasy-gold/30"
            >
              <Minimize2 size={11} />
              MINIMIZAR COMBATE
            </button>
          </div>
        )}

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

          {((combatState.status === 'rolling' || combatState.status === 'active') && !isGM && !confirmedRoll) && (
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
                    <div className="flex gap-2 items-center flex-wrap justify-center">
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
                        <>
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
                        </>
                      )}

                      {confirmedRoll && (
                        <div className="flex gap-2 items-center flex-wrap justify-center w-full">
                          <div className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/25 px-4 py-2 rounded-xl flex items-center gap-1.5">
                            <Lock size={12} />
                            TIRADA BLOQUEADA
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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

              {/* Indicador premium de Presencia en Línea */}
              <div className="bg-[#120d0a]/80 border border-emerald-500/20 rounded-xl p-3 shadow-inner flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-serif text-xs font-bold uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Jugadores Conectados ({activeUsers.length})
                  </div>
                  <span className="text-[10px] text-fantasy-gold/50">En tiempo real</span>
                </div>
                {activeUsers.length === 0 ? (
                  <div className="text-[10px] text-fantasy-gold/40 italic">Ningún jugador conectado actualmente.</div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {activeUsers.map((u) => (
                      <span 
                        key={u.user_id} 
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <User size={10} />
                        {u.username}
                      </span>
                    ))}
                  </div>
                )}
              </div>

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
                    
                    <div className="space-y-4">
                      {monsterRows.map((row, rIndex) => (
                        <div 
                          key={row.id} 
                          className="grid grid-cols-12 gap-2 pb-3 border-b border-white/5 last:border-0 last:pb-0 items-end animate-fade-in"
                        >
                          {/* Select NPC or Encyclopedia Monster dropdown */}
                          <div className="space-y-1 col-span-12 md:col-span-3">
                            <label className={`text-[10px] text-fantasy-gold/50 ${rIndex > 0 ? 'md:hidden' : 'block'}`}>Cargar Criatura:</label>
                            <select 
                              value={row.selectedNpcId}
                              onChange={e => handleUpdateMonsterRow(row.id, 'selectedNpcId', e.target.value)}
                              className="w-full bg-[#140f0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-fantasy-gold/45 h-[34px] transition-all duration-250"
                            >
                              <option value="">-- Manual --</option>
                              
                              {npcs && npcs.length > 0 && (
                                <optgroup label="NPCs de la Campaña">
                                  {npcs.map(n => (
                                    <option key={n.id} value={`npc_${n.id}`}>{n.name}</option>
                                  ))}
                                </optgroup>
                              )}
                              
                              {monstersData && monstersData.length > 0 && (
                                <optgroup label="Enciclopedia de Monstruos">
                                  {[...monstersData].sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                                    <option key={m.id} value={`encyclopedia_${m.id}`}>{m.name}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>

                          {/* Custom Monster Name */}
                          <div className="space-y-1 col-span-12 md:col-span-4">
                            <label className={`text-[10px] text-fantasy-gold/50 ${rIndex > 0 ? 'md:hidden' : 'block'}`}>Nombre en Combate:</label>
                            <input
                              type="text"
                              placeholder="Nombre (ej: Orco Boss)"
                              value={row.name}
                              onChange={e => handleUpdateMonsterRow(row.id, 'name', e.target.value)}
                              className="w-full bg-[#140f0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-fantasy-gold/45 h-[34px] transition-all duration-250"
                            />
                          </div>

                          {/* Modifier */}
                          <div className="space-y-1 col-span-4 md:col-span-2">
                            <label className={`text-[10px] text-fantasy-gold/50 ${rIndex > 0 ? 'md:hidden' : 'block'} text-center md:text-left`}>Bono:</label>
                            <input
                              type="number"
                              value={row.modifier}
                              onChange={e => handleUpdateMonsterRow(row.id, 'modifier', parseInt(e.target.value) || 0)}
                              className="w-full bg-[#140f0c] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-fantasy-gold/45 h-[34px] text-center transition-all duration-250"
                            />
                          </div>

                          {/* Quantity */}
                          <div className="space-y-1 col-span-4 md:col-span-2">
                            <label className={`text-[10px] text-fantasy-gold/50 ${rIndex > 0 ? 'md:hidden' : 'block'} text-center md:text-left`}>Cantidad:</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={row.quantity}
                              onChange={e => handleUpdateMonsterRow(row.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full bg-[#140f0c] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-fantasy-gold/45 h-[34px] text-center transition-all duration-250"
                            />
                          </div>

                          {/* Remove button */}
                          <div className="col-span-4 md:col-span-1 flex justify-end">
                            <button
                              onClick={() => handleRemoveMonsterRow(row.id)}
                              disabled={monsterRows.length === 1 && row.name === '' && row.selectedNpcId === ''}
                              className="p-2 text-fantasy-gold/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 active:scale-95 transition-all duration-250 h-[34px] w-full md:w-[34px] flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent"
                              title="Eliminar fila"
                            >
                              <Trash2 size={14} />
                              <span className="md:hidden ml-1.5 text-[10px] font-bold">Quitar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Controls line: Add new row & submit batch */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/5 items-center justify-between">
                      <button
                        onClick={handleAddMonsterRow}
                        className="w-full sm:w-auto px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-fantasy-gold/30 text-fantasy-gold font-display font-semibold text-xs tracking-wider rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 h-[34px]"
                      >
                        <Plus size={14} />
                        <span>AGREGAR OTRA CRIATURA</span>
                      </button>

                      <button
                        onClick={handleAddMonster}
                        disabled={monsterRows.filter(r => r.name.trim() !== '').length === 0 || monsterRolling}
                        className={`w-full sm:w-auto px-5 py-1.5 border text-fantasy-gold font-display font-semibold text-xs tracking-wider rounded-lg transition active:scale-95 disabled:opacity-40 h-[34px] flex items-center justify-center gap-1.5
                          ${monsterRolling 
                            ? 'bg-amber-700/60 border-amber-500/50 cursor-not-allowed' 
                            : 'bg-amber-800/40 hover:bg-amber-800/60 border-amber-600/30'
                          }
                        `}
                      >
                        <Dices size={14} className={monsterRolling ? 'animate-spin' : 'animate-pulse'} />
                        <span>{monsterRolling ? 'RODANDO...' : 'RODAR Y AGREGAR TODAS'}</span>
                      </button>
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

          {combatState.status !== 'inactive' && (
            <div className="space-y-3.5">
              <h3 className="font-serif text-lg text-white font-semibold flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Shield size={18} className="text-fantasy-gold" />
                Participantes
                <span className="text-xs font-semibold px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-fantasy-gold/60">
                  {isGM ? (combatState.turns?.length || 0) : (combatState.turns?.filter(t => !t.is_monster).length || 0)}
                </span>
              </h3>

              {(!combatState.turns || combatState.turns.length === 0 || (!isGM && combatState.turns.filter(t => !t.is_monster).length === 0)) ? (
                <div className="py-6 text-center text-fantasy-gold/30 text-sm italic">
                  No hay participantes aún.
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {combatState.turns
                      .map((p, originalIndex) => ({ ...p, originalIndex }))
                      .filter(p => isGM || !p.is_monster)
                      .map((p, index) => {
                         const isActive = combatState.status === 'active' && combatState.current_turn === p.originalIndex
                         const isMonster = p.is_monster
                         const isCurrentUser = !isGM && character && p.id === character.id
                         const isOnline = !isMonster && activeUsers.some(u => u.user_id === (p.user_id || p.player_id))
                      
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
                              <div className="flex items-center gap-1.5 flex-wrap">
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
                                {!isMonster && (
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1
                                    ${isOnline 
                                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 animate-pulse' 
                                      : 'bg-white/5 border border-white/10 text-fantasy-gold/40'
                                    }
                                  `}>
                                    <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-fantasy-gold/30'}`} />
                                    {isOnline ? 'En pantalla' : 'Ausente'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-fantasy-gold/45">
                                {p.confirmed 
                                  ? (isMonster && !isGM 
                                      ? 'Confirmado (Tirada Oculta)'
                                      : `Confirmado: ${p.total} (${p.roll} + ${formatModifier(p.modifier)})`
                                    )
                                  : 'Tirando dados...'
                                }
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 relative z-10">
                            {/* Roll Score Badge */}
                            {p.confirmed ? (
                              isMonster && !isGM ? (
                                <div className={`
                                  px-3 py-1 rounded-lg font-display font-bold text-xs tracking-wide shadow-inner
                                  ${isActive 
                                    ? 'bg-fantasy-accent/10 border border-fantasy-accent/30 text-white/60' 
                                    : 'bg-[#18120e] border border-white/5 text-fantasy-gold/40'
                                  }
                                `}>
                                  Oculto
                                </div>
                              ) : (
                                <div className={`
                                  px-3 py-1 rounded-lg font-display font-black text-sm tracking-wide shadow-inner
                                  ${isActive 
                                    ? 'bg-fantasy-accent/20 border border-fantasy-accent/50 text-white' 
                                    : 'bg-[#18120e] border border-white/10 text-fantasy-gold'
                                  }
                                `}>
                                  {p.total}
                                </div>
                              )
                            ) : p.is_rolling ? (
                              isMonster && !isGM ? (
                                <div className="px-3 py-1 bg-[#18120e] border border-white/5 rounded-lg font-display text-xs text-fantasy-gold/40 flex items-center gap-1.5 animate-pulse">
                                  <RefreshCw size={11} className="animate-spin text-fantasy-gold/40" />
                                  <span>Rodando...</span>
                                </div>
                              ) : (
                                <RollingBadge modifier={p.modifier} />
                              )
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
                  combatState.history.map((h, i) => {
                    if (h.is_private && !isGM && !h.public_message) return null;
                    const messageToDisplay = (h.is_private && !isGM) ? h.public_message : h.message;
                    return (
                      <div key={i} className="flex gap-2 text-fantasy-gold/75 items-start leading-relaxed border-b border-white/2 pb-1.5 last:border-0">
                        <span className="text-[10px] text-fantasy-gold/30 font-mono flex-shrink-0 pt-0.5">
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span>{messageToDisplay}</span>
                      </div>
                    )
                  })
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

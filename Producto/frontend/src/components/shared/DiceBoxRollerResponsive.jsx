import React, { useRef, useState, useEffect } from 'react'
import DiceBox from '@3d-dice/dice-box'

/**
 * ✅ DiceBoxRollerResponsive - Versión Tailwind, completamente responsiva
 * - Funciona en móvil, tablet y desktop
 * - Canvas adaptable a tamaño de pantalla
 * - Botones responsivos
 */
export default function DiceBoxRollerResponsive() {
  const containerRef = useRef(null)
  const diceBoxRef = useRef(null)
  const [result, setResult] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [history, setHistory] = useState([])
  const [isReady, setIsReady] = useState(false)

  const DICE_TYPES = [
    { sides: '1d4', label: 'D4', color: '#e74c3c' },
    { sides: '1d6', label: 'D6', color: '#e2a64a' },
    { sides: '1d8', label: 'D8', color: '#27ae60' },
    { sides: '1d10', label: 'D10', color: '#8e44ad' },
    { sides: '1d12', label: 'D12', color: '#2980b9' },
    { sides: '1d20', label: 'D20', color: '#d4a017' },
    { sides: '1d100', label: 'D%', color: '#c0392b' },
  ]

  useEffect(() => {
    let box = null
    let isMounted = true

    const initDiceBox = async () => {
      try {
        box = new DiceBox({
          container: '#dice-box-canvas',
          assetPath: '/assets/dice-box/',
          theme: 'default',
          themeColor: '#d4a017',
          scale: 20,
          throwForce: 4,
          spinForce: 4,
          startingHeight: 8,
        })

        await box.init()
        if (isMounted) {
          diceBoxRef.current = box
          setIsReady(true)
        }
      } catch (error) {
        console.error('Error initializing DiceBox:', error)
      }
    }

    initDiceBox()

    return () => {
      isMounted = false
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  // Auto-roll D20 upon initialization ONLY if requested
  const [hasAutoRolled, setHasAutoRolled] = useState(false)
  useEffect(() => {
    if (isReady && !hasAutoRolled) {
      if (sessionStorage.getItem('pending_d20_roll') === 'true') {
        const d20 = DICE_TYPES.find(d => d.sides === '1d20')
        if (d20) {
          handleRoll(d20)
        }
        sessionStorage.removeItem('pending_d20_roll')
      }
      setHasAutoRolled(true)
    }
  }, [isReady, hasAutoRolled])

  const handleRollRef = useRef()

  const handleRoll = async (dt) => {
    if (!diceBoxRef.current || rolling || !isReady) return

    setRolling(true)
    setResult(null)

    try {
      diceBoxRef.current.clear()
      const rollResults = await diceBoxRef.current.roll(dt.sides)
      const val = rollResults[0].value

      setResult({ value: val, label: dt.label, color: dt.color, type: dt })
      setHistory(prev => [
        { dice: dt.label, value: val, id: Date.now() },
        ...prev.slice(0, 9),
      ])
    } catch (e) {
      console.error('Error rolling dice:', e)
    } finally {
      setRolling(false)
    }
  }

  handleRollRef.current = handleRoll

  useEffect(() => {
    const handleRollD20Event = () => {
      const d20 = DICE_TYPES.find(d => d.sides === '1d20')
      if (d20 && handleRollRef.current) {
        handleRollRef.current(d20)
      }
    }
    window.addEventListener('roll-d20', handleRollD20Event)
    return () => window.removeEventListener('roll-d20', handleRollD20Event)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 py-4 md:py-8 px-3 md:px-6 min-h-screen w-full mx-auto relative">
      {/* Backdrop for focus effect while rolling */}
      <div 
        className={`fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] transition-opacity duration-500 pointer-events-none ${rolling ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Dice selector buttons - responsive grid */}
      <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
        {DICE_TYPES.map(d => (
          <button
            key={d.label}
            disabled={!isReady || rolling}
            onClick={() => handleRoll(d)}
            className="px-3 md:px-4 py-2 rounded-lg font-display font-bold text-sm md:text-base tracking-widest transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(255,255,255,0.1)',
              color: d.color,
              cursor: (!isReady || rolling) ? 'not-allowed' : 'pointer',
              opacity: (!isReady || rolling) ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              if (isReady && !rolling) {
                e.currentTarget.style.background = `${d.color}15`
                e.currentTarget.style.borderColor = `${d.color}80`
                e.currentTarget.style.boxShadow = `0 0 16px ${d.color}80`
              }
            }}
            onMouseLeave={e => {
              if (isReady && !rolling) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Canvas Container - responsive sizing */}
      <div className={`w-full max-w-sm md:max-w-md rounded-lg overflow-hidden border transition-all duration-400 ${rolling ? 'z-[110] relative scale-105' : 'z-10 relative border-white/8'}`}
        style={{
          boxShadow: rolling
            ? `0 0 60px rgba(212,160,23,0.4), 0 0 100px rgba(0,0,0,0.8)`
            : `0 0 20px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)`,
          background: 'radial-gradient(ellipse at center, rgba(30,25,20,0.95) 0%, rgba(10,5,5,0.98) 100%)',
          borderColor: rolling ? 'var(--fantasy-gold)' : 'rgba(255,255,255,0.08)',
        }}>
        
        {/* Dice canvas */}
        <div id="dice-box-canvas" ref={containerRef} className="w-full h-80 md:h-96" />

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <span className="text-fantasy-gold font-display animate-pulse">
              Cargando Motor 3D...
            </span>
          </div>
        )}
      </div>

      {/* Result display - responsive sizing */}
      <div className="min-h-32 md:min-h-40">
        {result !== null && !rolling && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <p className="text-fantasy-gold/45 text-xs md:text-sm uppercase tracking-widest mb-2">
              Resultado — {result.label}
            </p>
            <div className="font-display text-6xl md:text-8xl font-black leading-none" style={{
              color: result.color,
              textShadow: `0 0 30px ${result.color}80`,
            }}>
              {result.value}
            </div>
          </div>
        )}
      </div>

      {/* History - responsive layout */}
      {history.length > 0 && (
        <div className="w-full max-w-md md:max-w-lg bg-white/3 border border-white/6 rounded-2xl p-4 md:p-5 mt-auto">
          <h4 className="font-display text-fantasy-gold/40 text-xs uppercase tracking-widest mb-3 md:mb-4">
            Historial de Tiradas
          </h4>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => {
              const dt = DICE_TYPES.find(d => d.label === h.dice)
              return (
                <div
                  key={h.id}
                  className="rounded px-2 py-1 md:px-3 md:py-2 flex items-center gap-2 transition-opacity"
                  style={{
                    background: `${dt?.color || '#888'}15`,
                    border: `1px solid ${dt?.color || '#888'}40`,
                    opacity: Math.max(0.3, 1 - i * 0.1),
                  }}
                >
                  <span className="font-display font-bold text-xs md:text-sm" style={{ color: dt?.color || '#888' }}>
                    {h.dice}
                  </span>
                  <span className="font-display font-bold text-sm md:text-base text-white">
                    {h.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useRef, useState, useEffect } from 'react'
import DiceBox from '@3d-dice/dice-box'

export default function DiceBoxRoller() {
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
    { sides: '1d100', label: 'D%', color: '#c0392b' }, // d100 o d%
  ]

  useEffect(() => {
    let box = null;
    let isMounted = true;

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
      isMounted = false;
      // Intento de limpieza si es necesario, vacíamos el contenedor
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  const handleRoll = async (dt) => {
    if (!diceBoxRef.current || rolling || !isReady) return

    setRolling(true)
    setResult(null)

    try {
      diceBoxRef.current.clear()
      // Roll the dice, the library handles the 3D physics rendering
      const rollResults = await diceBoxRef.current.roll(dt.sides)

      // RollResults usually comes as an array of groups.
      // We take the total value of the first group.
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '2rem 0',
      minHeight: '80vh',
      width: '100%',
      maxWidth: 800,
      margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '1.8rem',
          color: '#fff',
          margin: '0 0 0.3rem',
          textShadow: '0 0 30px rgba(212,160,23,0.5)',
        }}>
          Dice Box
        </h2>
        <p style={{ color: 'rgba(226,209,166,0.45)', fontSize: '0.9rem', margin: 0 }}>
          ¡Lanza tus dados!
        </p>
      </div>

      {/* Dice selector buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        justifyContent: 'center',
      }}>
        {DICE_TYPES.map(d => {
          return (
            <button
              key={d.label}
              disabled={!isReady || rolling}
              onClick={() => handleRoll(d)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.1)',
                color: d.color,
                borderRadius: 10,
                padding: '0.5rem 1rem',
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: (!isReady || rolling) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.04em',
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
              Tirar {d.label}
            </button>
          )
        })}
      </div>

      {/* Container where the canvas will be injected */}
      <div style={{
        width: '100%',
        maxWidth: 300,
        height: 350,
        borderRadius: 10,
        overflow: 'hidden',
        border: `1.5px solid ${rolling ? 'var(--fantasy-gold)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: rolling
          ? `0 0 40px rgba(212,160,23,0.3)`
          : `0 0 20px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)`,
        background: 'radial-gradient(ellipse at center, rgba(30,25,20,0.95) 0%, rgba(10,5,5,0.98) 100%)',
        transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
        position: 'relative',
      }}>
        <div id="dice-box-canvas" ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Overlay loading/rolling state */}
        {!isReady && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', zIndex: 10,
          }}>
            <span style={{ color: 'var(--fantasy-gold)', fontFamily: 'Cinzel, serif', animation: 'pulse 1s infinite' }}>Cargando Motor 3D...</span>
          </div>
        )}

      </div>

      {/* Result display */}
      <div style={{ minHeight: 120 }}>
        {result !== null && !rolling && (
          <div style={{
            textAlign: 'center',
            animation: 'fadeInUp 0.35s ease forwards',
          }}>
            <p style={{
              color: 'rgba(226,209,166,0.45)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: '0.4rem',
            }}>
              Resultado — {result.label}
            </p>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '4.5rem',
              fontWeight: 900,
              color: result.color,
              textShadow: `0 0 30px ${result.color}80`,
              lineHeight: 1,
            }}>
              {result.value}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{
          marginTop: 'auto',
          width: '100%',
          maxWidth: 500,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: '1.25rem',
        }}>
          <h4 style={{
            fontFamily: 'Cinzel, serif',
            color: 'rgba(226,209,166,0.4)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            margin: '0 0 0.9rem',
          }}>
            Historial de Tiradas
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {history.map((h, i) => {
              const dt = DICE_TYPES.find(d => d.label === h.dice)
              return (
                <div
                  key={h.id}
                  style={{
                    background: `${dt?.color || '#888'}15`,
                    border: `1px solid ${dt?.color || '#888'}40`,
                    borderRadius: 8,
                    padding: '0.3rem 0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    opacity: Math.max(0.3, 1 - i * 0.1),
                  }}
                >
                  <span style={{ color: dt?.color || '#888', fontSize: '0.7rem', fontFamily: 'Cinzel, serif', fontWeight: 700 }}>
                    {h.dice}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Cinzel, serif' }}>
                    {h.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dice-box-canvas {
          outline: none;
        }
      `}</style>
    </div>
  )
}

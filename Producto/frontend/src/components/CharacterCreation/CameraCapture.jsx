import React, { useState, useRef, useEffect } from 'react'
import { Upload, Camera, X, AlertCircle, Loader, RefreshCw } from 'lucide-react'
import api from '../../services/api'

export default function CameraCapture({ onCharacterDataExtracted, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const inputRef = useRef(null)

  const [showVideo, setShowVideo] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'environment',
        },
        audio: false,
      })

      setShowVideo(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.error('Error al reproducir:', e))
        }
      }, 150)
    } catch (err) {
      console.error('Error de cámara:', err)
      let msg = 'Error al acceder a la cámara'
      if (err.name === 'NotAllowedError') msg = 'Permiso denegado. Permite el acceso a la cámara en tu navegador.'
      else if (err.name === 'NotFoundError') msg = 'No se encontró ninguna cámara disponible.'
      else if (err.name === 'NotReadableError') msg = 'La cámara está siendo usada por otra aplicación.'
      else msg = err.message
      setError(msg)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setShowVideo(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    let w = video.videoWidth
    let h = video.videoHeight
    const MAX = 1600
    if (w > MAX || h > MAX) {
      if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
      else { w = Math.round((w * MAX) / h); h = MAX }
    }

    canvas.width = w
    canvas.height = h
    ctx.drawImage(video, 0, 0, w, h)
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))
    stopCamera()
  }

  const processImage = async (imageData) => {
    setLoading(true)
    setError(null)
    try {
      const blob = await (await fetch(imageData)).blob()
      const form = new FormData()
      form.append('file', blob, 'character.jpg')

      const response = await api.post('/vision/digitize', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const result = response.data
      if (result.success && result.data) {
        onCharacterDataExtracted(result.data)
      } else {
        setError(result.message || 'No se pudieron extraer datos de la imagen.')
      }
    } catch (err) {
      setError(`Error al procesar: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Detener cámara al desmontar
  useEffect(() => () => stopCamera(), [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #1a1025 0%, #0f0c1a 100%)',
        border: '1px solid rgba(217,83,30,0.3)',
        borderRadius: 20, width: '100%', maxWidth: 580,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(217,83,30,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Camera size={20} color="#d9531e" />
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Escanear Hoja de Personaje
            </h2>
          </div>
          <button onClick={onCancel} style={{
            background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8,
            padding: '0.35rem 0.7rem', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem',
          }}>✕</button>
        </div>

        <div style={{ padding: '1.4rem' }}>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
            }}>
              <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: '#fca5a5', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Estado: procesando */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                border: '3px solid rgba(217,83,30,0.2)',
                borderTopColor: '#d9531e',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem',
              }} />
              <p style={{ color: 'rgba(226,209,166,0.8)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                Analizando imagen con IA...
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                Esto puede tardar unos segundos
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Estado: video en vivo */}
          {showVideo && !capturedImage && !loading && (
            <div>
              <div style={{
                position: 'relative', borderRadius: 12, overflow: 'hidden',
                border: '2px solid rgba(217,83,30,0.5)', marginBottom: '1rem',
                background: '#000',
              }}>
                <video
                  ref={videoRef}
                  autoPlay muted playsInline
                  style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(34,197,94,0.9)', borderRadius: 999,
                  padding: '0.25rem 0.7rem', fontSize: '0.72rem', fontWeight: 700, color: '#fff',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />
                  EN VIVO
                  <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
                </div>
              </div>
              <p style={{ textAlign: 'center', color: 'rgba(226,209,166,0.5)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Apunta a la hoja de personaje y asegúrate de que se vea completa
              </p>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button onClick={stopCamera} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.75rem', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ccc', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                }}>
                  <X size={16} /> Cancelar
                </button>
                <button onClick={capturePhoto} style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem', borderRadius: 10,
                  background: 'linear-gradient(135deg, #d9531e, #b84a18)',
                  border: '1px solid rgba(217,83,30,0.5)',
                  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                  boxShadow: '0 4px 15px rgba(217,83,30,0.3)',
                }}>
                  <Camera size={18} /> Capturar Foto
                </button>
              </div>
            </div>
          )}

          {/* Estado: imagen capturada, pendiente de procesar */}
          {capturedImage && !loading && (
            <div>
              <div style={{
                borderRadius: 12, overflow: 'hidden',
                border: '2px solid rgba(34,197,94,0.4)', marginBottom: '1rem',
              }}>
                <img src={capturedImage} alt="Captura" style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button onClick={() => { setCapturedImage(null); startCamera() }} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.75rem', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ccc', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                }}>
                  <RefreshCw size={16} /> Retomar
                </button>
                <button onClick={() => processImage(capturedImage)} style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem', borderRadius: 10,
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                  boxShadow: '0 4px 15px rgba(34,197,94,0.2)',
                }}>
                  ✨ Analizar con IA
                </button>
              </div>
            </div>
          )}

          {/* Estado inicial: elegir método */}
          {!showVideo && !capturedImage && !loading && (
            <div>
              {/* Tips */}
              <div style={{
                padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '1.25rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ color: 'rgba(226,209,166,0.7)', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
                  Para mejores resultados:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', lineHeight: 2 }}>
                  <li>Buena iluminación — sin sombras sobre el papel</li>
                  <li>Hoja completamente visible y sin dobleces</li>
                  <li>Imagen nítida, sin desenfoque de movimiento</li>
                </ul>
              </div>

              {/* Botón: abrir cámara */}
              <button onClick={startCamera} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                padding: '1rem', borderRadius: 12, marginBottom: '0.75rem',
                background: 'linear-gradient(135deg, #d9531e, #b84a18)',
                border: '1px solid rgba(217,83,30,0.5)',
                color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 4px 18px rgba(217,83,30,0.3)', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(217,83,30,0.45)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(217,83,30,0.3)'}
              >
                <Camera size={22} /> Abrir Cámara
              </button>

              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', margin: '0.75rem 0' }}>
                — o —
              </div>

              {/* Botón: subir archivo */}
              <button onClick={() => inputRef.current?.click()} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                padding: '0.85rem', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#ccc', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <Upload size={20} /> Subir Imagen desde Archivo
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => setCapturedImage(ev.target?.result)
                  reader.readAsDataURL(file)
                }}
              />
            </div>
          )}

        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}

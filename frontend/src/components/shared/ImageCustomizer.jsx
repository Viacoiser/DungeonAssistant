import React, { useState, useRef, useEffect } from 'react'
import { Upload, ZoomIn, ZoomOut, Move, RotateCcw, Trash2, Check } from 'lucide-react'

export default function ImageCustomizer({ currentImageUrl, onImageUpdate, onImageRemove, availableImages = [] }) {
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || null)
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ w: 240, h: 240 })
  const fileInputRef = useRef(null)

  // Sincronizar con la prop externa si cambia
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null)
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
  }, [currentImageUrl])

  // Calcular las dimensiones base para hacer un "cover" perfecto
  useEffect(() => {
    if (!previewUrl) return
    const img = new Image()
    img.onload = () => {
      const ratio = img.width / img.height
      if (ratio > 1) { // Más ancha que alta
        setImgSize({ w: 240 * ratio, h: 240 })
      } else { // Más alta que ancha o cuadrada
        setImgSize({ w: 240, h: 240 / ratio })
      }
    }
    img.src = previewUrl
  }, [previewUrl])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreviewUrl(event.target.result)
        setZoom(1)
        setOffsetX(0)
        setOffsetY(0)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    // Movemos la imagen, limitando para que no se pierda infinitamente (opcional)
    setOffsetX(prev => prev + deltaX)
    setOffsetY(prev => prev + deltaY)

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.1))
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.1))

  const handleReset = () => {
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
  }

  const handleSave = async () => {
    if (!previewUrl) return

    const OUTPUT_SIZE = 400 // Tamaño de la imagen final guardada (400x400)
    const CROP_SIZE = 240   // Tamaño del contenedor en pantalla

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.onload = () => {
      // Calcular escala base para "cover"
      const scaleToFit = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height)
      const baseW = img.width * scaleToFit
      const baseH = img.height * scaleToFit

      // Aplicar zoom del usuario
      const drawW = baseW * zoom
      const drawH = baseH * zoom

      // Escalar al tamaño de salida final
      const outScale = OUTPUT_SIZE / CROP_SIZE
      const finalDrawW = drawW * outScale
      const finalDrawH = drawH * outScale

      const finalOffsetX = offsetX * outScale
      const finalOffsetY = offsetY * outScale

      // Centrar y aplicar offsets
      const startX = (OUTPUT_SIZE / 2) - (finalDrawW / 2) + finalOffsetX
      const startY = (OUTPUT_SIZE / 2) - (finalDrawH / 2) + finalOffsetY

      // Fondo negro (por si hay huecos)
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      // Dibujar imagen recortada
      ctx.drawImage(img, startX, startY, finalDrawW, finalDrawH)

      const adjustedImageUrl = canvas.toDataURL('image/jpeg', 0.9)
      onImageUpdate(adjustedImageUrl)
    }

    img.src = previewUrl
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
    onImageRemove?.()
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      background: 'rgba(0,0,0,0.2)',
      padding: '1.5rem',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Encabezado */}
      <div>
        <h3 style={{
          color: 'rgba(226,209,166,0.9)',
          fontSize: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 0.5rem 0',
          fontWeight: 700,
          fontFamily: 'Almendra, serif',
        }}>
          Ajuste de imagen
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(226,209,166,0.6)' }}>
          Arrastra y usa el zoom para enfocar el rostro de tu personaje.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Área de Preview/Cropper */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            position: 'relative',
            width: 240,
            height: 240,
            background: 'rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(217,83,30,0.5)',
            borderRadius: '50%', // Circular mask for preview!
            boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : previewUrl ? 'grab' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: imgSize.w,
                  height: imgSize.h,
                  transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  userSelect: 'none',
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(226,209,166,0.5)' }}>
                <Upload size={32} style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Sube una imagen</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(226,209,166,0.3)' }}>o elige una de la galería</p>
              </div>
            )}

            {/* Overlay grid para ayudar a encuadrar */}
            {previewUrl && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '33.33% 33.33%',
                opacity: isDragging ? 1 : 0,
                transition: 'opacity 0.2s',
              }} />
            )}
          </div>

          {/* Zoom Control */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(255,255,255,0.03)',
            padding: '0.5rem 1rem',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.05)',
            opacity: previewUrl ? 1 : 0.5,
            pointerEvents: previewUrl ? 'auto' : 'none',
          }}>
            <button onClick={handleZoomOut} style={{ background: 'none', border: 'none', color: 'rgba(226,209,166,0.6)', cursor: 'pointer', padding: 4 }}>
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min="0.5" max="3" step="0.05"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{
                flex: 1, height: 4, borderRadius: 2, background: 'rgba(217,83,30,0.3)', outline: 'none', WebkitAppearance: 'none', cursor: 'pointer',
              }}
            />
            <button onClick={handleZoomIn} style={{ background: 'none', border: 'none', color: 'rgba(226,209,166,0.6)', cursor: 'pointer', padding: 4 }}>
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        {/* Controles de Acción */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 200 }}>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              color: 'var(--fantasy-gold)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', fontSize: '0.9rem',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
          >
            <Upload size={18} /> Subir de tu PC
          </button>

          {previewUrl && (
            <>
              <button
                onClick={handleReset}
                style={{
                  padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10,
                  color: 'rgba(226,209,166,0.6)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', fontSize: '0.9rem',
                }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(226,209,166,0.6)'}
              >
                <RotateCcw size={16} /> Centrar
              </button>

              <button
                onClick={handleSave}
                style={{
                  padding: '0.85rem', background: 'var(--fantasy-accent)', border: 'none', borderRadius: 10,
                  color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(217,83,30,0.3)',
                }}
                onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
              >
                <Check size={18} /> Aplicar y Guardar
              </button>

              <button
                onClick={handleRemove}
                style={{
                  padding: '0.85rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
                  color: '#fca5a5', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', fontSize: '0.9rem',
                  marginTop: 'auto',
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.2)'}
                onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.1)'}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Galería Integrada */}
      {availableImages && availableImages.length > 0 && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{
            color: 'rgba(226,209,166,0.6)',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: '0 0 1rem 0',
            fontWeight: 700,
          }}>
            O Elige de la Galería ({availableImages.length})
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '0.75rem',
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '0.5rem',
          }} className="custom-scrollbar">
            {availableImages.map((img) => (
              <button
                key={img.id}
                onClick={() => {
                  setPreviewUrl(img.path)
                  setZoom(1)
                  setOffsetX(0)
                  setOffsetY(0)
                }}
                style={{
                  position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 8,
                  border: previewUrl === img.path ? '2px solid var(--fantasy-accent)' : '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', padding: 0,
                }}
                onMouseEnter={e => {
                  if (previewUrl !== img.path) e.currentTarget.style.borderColor = 'rgba(217,83,30,0.5)'
                }}
                onMouseLeave={e => {
                  if (previewUrl !== img.path) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                <img src={img.path} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

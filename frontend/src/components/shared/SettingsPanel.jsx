import React, { useState, useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { characterAPI } from '../../services/api'
import ImageCustomizer from './ImageCustomizer'

// Lista de imágenes disponibles
const AVAILABLE_IMAGES = [
  // JPG images (100-138), excepto 107 y 108 que son PNG
  ...Array.from({ length: 39 }, (_, i) => {
    const num = i + 100
    const isPng = num === 107 || num === 108
    return {
      id: num,
      name: `image${num}`,
      path: `/images/image${num}.${isPng ? 'png' : 'jpg'}`
    }
  }),
  // PNG images (139-145)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: i + 139,
    name: `image${i + 139}`,
    path: `/images/image${i + 139}.png`
  }))
]

export default function SettingsPanel({ characters = [], onCharacterUpdated }) {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Auto-select first character if available
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characters[0])
    }
  }, [characters])

  const handleSelectImage = async (imagePath) => {
    if (!selectedCharacter) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Only send the fields that CharacterUpdate accepts
      const updateData = {
        image_url: imagePath,
      }

      await characterAPI.update(selectedCharacter.id, updateData)

      // Update local state
      setSelectedCharacter({ ...selectedCharacter, image_url: imagePath })
      setSuccess('Imagen actualizada correctamente ✨')

      // Reload characters from parent
      if (onCharacterUpdated) {
        onCharacterUpdated()
      }

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating character image:', err)
      setError(err.response?.data?.detail || 'Error al actualizar la imagen')
      setTimeout(() => setError(''), 4000)
    } finally {
      setLoading(false)
    }
  }

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-8">
        <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem', opacity: 0.8 }}>⚙️</div>
        <h2 style={{
          fontFamily: 'Almendra, serif',
          fontSize: 'clamp(2.5rem, 4vw, 2.5rem)', fontWeight: 700,
          color: 'var(--fantasy-gold)', margin: 0, marginBottom: '0.1rem',
          textShadow: '0 0 30px rgba(217,83,30,0.2)',
        }}>
          Ajustes
        </h2>
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mt-1 mb-4 opacity-80">
          <div className="h-[1px] w-12 md:w-16 bg-gradient-to-r from-transparent to-[var(--fantasy-gold)]"></div>
          <div className="text-[var(--fantasy-gold)] text-[10px]">✧</div>
          <div className="h-[1px] w-12 md:w-16 bg-gradient-to-l from-transparent to-[var(--fantasy-gold)]"></div>
        </div>
        <p style={{ color: 'rgba(226,209,166,0.45)', fontSize: '0.95rem', maxWidth: 360 }}>
          Crea un personaje primero para personalizar su imagen
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="flex flex-col items-center relative mt-8 md:mt-12 mb-2 w-full min-h-[40px]">
        <div style={{ animation: 'fadeInUp 0.4s ease forwards' }} className="flex flex-col items-center text-center">
          <h2 style={{
            fontFamily: 'Almendra, serif',
            fontStyle: 'normal',
            fontSize: 'clamp(3rem, 5vw, 2.5rem)', fontWeight: 700,
            color: 'var(--fantasy-gold)', margin: 0, marginBottom: '0.1rem',
            textShadow: '0 0 30px rgba(217,83,30,0.2)',
          }}>
            Ajustes
          </h2>
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mt-1 mb-2 opacity-80">
            <div className="h-[1px] w-16 md:w-24 bg-gradient-to-r from-transparent to-[var(--fantasy-gold)]"></div>
            <div className="text-[var(--fantasy-gold)] text-xs">✧</div>
            <div className="h-[1px] w-16 md:w-24 bg-gradient-to-l from-transparent to-[var(--fantasy-gold)]"></div>
          </div>
          <p style={{ color: 'rgba(226,209,166,0.55)', fontSize: '0.875rem', margin: 0 }} className="hidden sm:block mt-1">
            Personaliza la imagen de tu personaje
          </p>
        </div>
      </div>

      {/* Character Selector */}
      <div>
        <label style={{
          display: 'block',
          color: 'rgba(226,209,166,0.8)',
          fontWeight: 600,
          fontSize: '0.875rem',
          marginBottom: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Selecciona un Personaje
        </label>
        <select
          value={selectedCharacter?.id || ''}
          onChange={(e) => {
            const char = characters.find(c => c.id === e.target.value)
            setSelectedCharacter(char)
          }}
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#1a1612', // Color sólido para evitar problemas en el dropdown
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '0.7rem 1rem',
            color: '#fff',
            fontSize: '1rem',
            outline: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            appearance: 'none', // Quita el estilo nativo para mayor control
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            backgroundSize: '1em',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(217,83,30,0.6)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          {characters.map(char => (
            <option 
              key={char.id} 
              value={char.id}
              style={{ background: '#1a1612', color: '#fff' }}
            >
              {char.name} - Nivel {char.level} {char.class} ({char.race})
            </option>
          ))}
        </select>
      </div>

      {/* Current Selection Info */}
      {selectedCharacter && (
        <div style={{
          background: 'rgba(217,83,30,0.08)',
          border: '1px solid rgba(217,83,30,0.3)',
          borderRadius: 12,
          padding: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            background: 'rgba(217,83,30,0.15)',
            border: '1px solid rgba(217,83,30,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {selectedCharacter.image_url ? (
              <img
                src={selectedCharacter.image_url}
                alt={selectedCharacter.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span style={{
                fontFamily: 'Almendra, serif',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#fbbf24',
                textShadow: '0 0 10px rgba(217,83,30,0.5)',
              }}>
                {selectedCharacter.name[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 style={{
              fontFamily: 'Almendra, serif',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              marginBottom: '0.25rem',
            }}>
              {selectedCharacter.name}
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(226,209,166,0.6)',
              margin: 0,
            }}>
              Nivel {selectedCharacter.level} • {selectedCharacter.race} {selectedCharacter.class}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {success && (
        <div style={{
          background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.35)',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#86efac',
          fontSize: '0.875rem',
        }}>
          <Check size={16} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.12)',
          border: '1px solid rgba(220,38,38,0.35)',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#fca5a5',
          fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Image Customizer */}
      <div style={{ marginTop: '1rem' }}>
        <ImageCustomizer
          currentImageUrl={selectedCharacter?.image_url}
          onImageUpdate={(url) => handleSelectImage(url)}
          onImageRemove={() => handleSelectImage('')}
          availableImages={AVAILABLE_IMAGES}
        />
      </div>

      {/* Info */}
      <div style={{
        background: 'rgba(59,130,246,0.1)',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 12,
        padding: '1rem',
        fontSize: '0.875rem',
        color: '#93c5fd',
        marginTop: '1rem',
      }}>
        💡 Sube y ajusta una imagen para personalizar el avatar de tu personaje. Los cambios se guardan automáticamente.
      </div>
    </div>
  )
}

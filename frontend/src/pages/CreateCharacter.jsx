import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CharacterForm from '../components/CharacterForm'
import { characterAPI, campaignAPI } from '../services/api'

export default function CreateCharacter({ onClose }) {
  const navigate = useNavigate()
  const { campaignId } = useParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [characterId, setCharacterId] = useState(null)
  const [showCampaignSelect, setShowCampaignSelect] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [assigningCampaign, setAssigningCampaign] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joiningByCode, setJoiningByCode] = useState(false)

  const handleSubmit = async (formData) => {
    try {
      setLoading(true)
      setError('')

      const characterData = {
        ...formData,
        campaign_id: campaignId || null,  // Permitir crear sin campaña
      }

      const response = await characterAPI.create(characterData)
      setCharacterId(response.data.id)
      
      // Si se está creando desde una campaña específica, redirigir directo
      if (campaignId) {
        navigate(`/campaign/${campaignId}`, {
          state: { message: 'Personaje creado exitosamente' }
        })
      } else if (onClose) {
        // Si viene del modal (onClose prop), cerrar el modal
        onClose?.()
      } else {
        // Si no hay campaña ni onClose, mostrar opción de agregar a una
        try {
          const campaignsRes = await campaignAPI.list()
          setCampaigns(campaignsRes.data || [])
          setShowCampaignSelect(true)
        } catch (err) {
          // Si error al cargar campañas, simplemente redirigir
          navigate('/dashboard', {
            state: { message: 'Personaje creado. Puedes agregarlo a una campaña después.' }
          })
        }
      }
    } catch (err) {
      // Manejo de errores de validación
      if (err.response?.data?.detail) {
        const details = err.response.data.detail
        if (Array.isArray(details)) {
          setError(details.map(d => d.msg).join(', '))
        } else if (typeof details === 'string') {
          setError(details)
        } else {
          setError('Error al crear el personaje')
        }
      } else {
        setError(err.message || 'Error al crear el personaje')
      }
      console.error('Error creating character:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCampaign = async () => {
    if (!selectedCampaign) {
      setError('Por favor selecciona una campaña')
      return
    }

    try {
      setAssigningCampaign(true)
      setError('')

      await characterAPI.assignCampaign(characterId, selectedCampaign.id)
      
      navigate(`/campaign/${selectedCampaign.id}`, {
        state: { message: 'Personaje creado y agregado a la campaña' }
      })
    } catch (err) {
      console.error('Error assigning campaign:', err)
      let errorMsg = 'Error al asignar la campaña'
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail
        errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail)
      }
      setError(errorMsg)
    } finally {
      setAssigningCampaign(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard', {
      state: { message: 'Personaje creado. Puedes agregarlo a una campaña después.' }
    })
  }

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      setError('Por favor ingresa un código de invitación')
      return
    }

    try {
      setJoiningByCode(true)
      setError('')

      await characterAPI.joinCampaignByCode(characterId, inviteCode.trim().toUpperCase())
      
      navigate('/dashboard', {
        state: { message: 'Personaje creado y unido a la campaña' }
      })
    } catch (err) {
      console.error('Error joining campaign by code:', err)
      let errorMsg = 'Código de invitación inválido'
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail
        errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail)
      }
      setError(errorMsg)
    } finally {
      setJoiningByCode(false)
    }
  }

  // Modal: Seleccionar campaña
  if (showCampaignSelect) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}>
        <div style={{
          background: 'rgba(26,26,26,0.95)',
          border: '1px solid rgba(217,83,30,0.3)',
          borderRadius: 20,
          padding: '2rem',
          maxWidth: 600,
          backdropFilter: 'blur(16px)',
        }}>
          <h2 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '0.5rem',
          }}>
            Agregar a Campaña
          </h2>
          <p style={{
            color: 'rgba(226,209,166,0.6)',
            marginBottom: '1.5rem',
          }}>
            ¿Deseas agregar este personaje a una campaña ahora?
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '0.75rem',
              color: '#fca5a5',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'rgba(226,209,166,0.7)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Selecciona una campaña
            </label>
            <select
              value={selectedCampaign?.id || ''}
              onChange={(e) => {
                const campaign = campaigns.find(c => c.id === e.target.value)
                setSelectedCampaign(campaign)
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.875rem',
              }}
            >
              <option value="">-- Selecciona --</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.user_role === 'GM' ? '(GM)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            textAlign: 'center',
            color: 'rgba(226,209,166,0.5)',
            fontSize: '0.85rem',
            margin: '1rem 0',
          }}>
            o
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'rgba(226,209,166,0.7)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Ingresa un código de invitación
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength="6"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.875rem',
                textAlign: 'center',
                letterSpacing: '0.2em',
                fontWeight: '600',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSkip}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
              >
                Hacer Después
              </button>
              <button
                onClick={handleAssignCampaign}
                disabled={!selectedCampaign || assigningCampaign}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(217,83,30,0.8), var(--fantasy-accent))',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: selectedCampaign && !assigningCampaign ? 'pointer' : 'not-allowed',
                  opacity: selectedCampaign && !assigningCampaign ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}
              >
                {assigningCampaign ? 'Agregando...' : 'Agregar'}
              </button>
            </div>

            <button
              onClick={handleJoinByCode}
              disabled={!inviteCode.trim() || joiningByCode}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(37,99,235,0.8))',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontWeight: 600,
                cursor: inviteCode.trim() && !joiningByCode ? 'pointer' : 'not-allowed',
                opacity: inviteCode.trim() && !joiningByCode ? 1 : 0.5,
                transition: 'all 0.2s',
              }}
            >
              {joiningByCode ? 'Uniéndose...' : 'Unirse con Código'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-800/95 backdrop-blur border-b border-yellow-900/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(campaignId ? `/campaign/${campaignId}` : '/dashboard')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-yellow-600" />
          </button>
          <h1 className="text-3xl font-bold text-yellow-600 tracking-wider">
            Crear Personaje
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <CharacterForm
          campaignId={campaignId}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  )
}

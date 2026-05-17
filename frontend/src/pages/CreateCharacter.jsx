import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import CharacterForm from '../components/shared/CharacterForm'
import CameraCapture from '../components/CharacterCreation/CameraCapture'
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
  
  const [showCamera, setShowCamera] = useState(false)
  const [scannedData, setScannedData] = useState(null)

  const handleSubmit = async (formData) => {
    try {
      setLoading(true)
      setError('')

      const characterData = {
        ...formData,
        campaign_id: campaignId || null,
      }

      const response = await characterAPI.create(characterData)
      setCharacterId(response.data.id)
      
      if (campaignId) {
        navigate(`/campaign/${campaignId}`, {
          state: { message: 'Personaje creado' }
        })
      } else if (onClose) {
        onClose?.()
      } else {
        try {
          const campaignsRes = await campaignAPI.list()
          setCampaigns(campaignsRes.data || [])
          setShowCampaignSelect(true)
        } catch (err) {
          navigate('/dashboard', {
            state: { message: 'Personaje creado correctamente.' }
          })
        }
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        const details = err.response.data.detail
        if (Array.isArray(details)) {
          setError(details.map(d => d.msg).join(', '))
        } else {
          setError(typeof details === 'string' ? details : 'Error al crear el personaje')
        }
      } else {
        setError(err.message || 'Error al crear el personaje')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCampaign = async () => {
    if (!selectedCampaign) {
      setError('Selecciona una campaña')
      return
    }

    try {
      setAssigningCampaign(true)
      setError('')
      await characterAPI.assignCampaign(characterId, selectedCampaign.id)
      navigate(`/campaign/${selectedCampaign.id}`, {
        state: { message: 'Personaje asignado a la campaña' }
      })
    } catch (err) {
      setError('Error al asignar la campaña')
    } finally {
      setAssigningCampaign(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard', {
      state: { message: 'Personaje creado.' }
    })
  }

  const handleCharacterDataExtracted = (extractedData) => {
    setScannedData(extractedData)
    setShowCamera(false)
  }

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      setError('Ingresa un código de invitación')
      return
    }

    try {
      setJoiningByCode(true)
      setError('')
      await characterAPI.joinCampaignByCode(characterId, inviteCode.trim().toUpperCase())
      navigate('/dashboard', {
        state: { message: 'Personaje unido a la campaña' }
      })
    } catch (err) {
      setError('Código de invitación inválido')
    } finally {
      setJoiningByCode(false)
    }
  }

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
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            Agregar a Campaña
          </h2>
          <p style={{ color: 'rgba(226,209,166,0.6)', marginBottom: '1.5rem' }}>
            ¿Deseas agregar este personaje a una campaña ahora?
          </p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '0.75rem', color: '#fca5a5', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(226,209,166,0.7)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Selecciona una campaña
            </label>
            <select
              value={selectedCampaign?.id || ''}
              onChange={(e) => {
                const campaign = campaigns.find(c => c.id === e.target.value)
                setSelectedCampaign(campaign)
              }}
              style={{ width: '100%', padding: '0.75rem', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
            >
              <option value="">-- Selecciona --</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.user_role === 'GM' ? '(GM)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: 'center', color: 'rgba(226,209,166,0.5)', fontSize: '0.85rem', margin: '1rem 0' }}>o</div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(226,209,166,0.7)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Ingresa un código de invitación
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength="6"
              style={{ width: '100%', padding: '0.75rem', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', textAlign: 'center', letterSpacing: '0.2em', fontWeight: '600' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSkip}
                style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Hacer Después
              </button>
              <button
                onClick={handleAssignCampaign}
                disabled={!selectedCampaign || assigningCampaign}
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, rgba(217,83,30,0.8), var(--fantasy-accent))', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, opacity: selectedCampaign && !assigningCampaign ? 1 : 0.5 }}
              >
                {assigningCampaign ? 'Agregando...' : 'Agregar'}
              </button>
            </div>

            <button
              onClick={handleJoinByCode}
              disabled={!inviteCode.trim() || joiningByCode}
              style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(37,99,235,0.8))', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, opacity: inviteCode.trim() && !joiningByCode ? 1 : 0.5 }}
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={() => setShowCamera(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
          >
            <Camera size={20} /> Escanear Hoja de Personaje
          </button>
          
          {scannedData && (
            <div className="text-green-400 text-sm font-semibold">
              Datos escaneados listos para revisar
            </div>
          )}
        </div>

        {showCamera && (
          <CameraCapture
            onCharacterDataExtracted={handleCharacterDataExtracted}
            onCancel={() => setShowCamera(false)}
          />
        )}

        {scannedData && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-2">Datos Escaneados:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-green-300">
              {scannedData.character_name && <div><strong>Nombre:</strong> {scannedData.character_name}</div>}
              {scannedData.race && <div><strong>Raza:</strong> {scannedData.race}</div>}
              {scannedData.class && <div><strong>Clase:</strong> {scannedData.class}</div>}
              {scannedData.subclass && <div><strong>Subclase:</strong> {scannedData.subclass}</div>}
              {scannedData.level && <div><strong>Nivel:</strong> {scannedData.level}</div>}
              {scannedData.background && <div><strong>Trasfondo:</strong> {scannedData.background}</div>}
              {scannedData.alignment && <div><strong>Alineamiento:</strong> {scannedData.alignment}</div>}
              {scannedData.armor_class && <div><strong>CA:</strong> {scannedData.armor_class}</div>}
              {scannedData.hp_max && <div><strong>HP Máx:</strong> {scannedData.hp_max}</div>}
              {scannedData.speed && <div><strong>Velocidad:</strong> {scannedData.speed}</div>}
              {scannedData.hit_dice && <div><strong>Dado de Golpe:</strong> {scannedData.hit_dice}</div>}
            </div>
          </div>
        )}

        <CharacterForm
          campaignId={campaignId}
          onSubmit={handleSubmit}
          loading={loading}
          initialData={scannedData ? {
            name: scannedData.character_name || '',
            race: scannedData.race || '',
            class_: scannedData.class || '',
            subclass: scannedData.subclass || '',
            level: scannedData.level || 1,
            background: scannedData.background || '',
            alignment: scannedData.alignment || '',
            experience_points: scannedData.experience_points || 0,
            player_name: scannedData.player_name || '',
            stats: scannedData.stats || {},
            hp_max: scannedData.hp_max || 0,
            hp_current: scannedData.hp_current || scannedData.hp_max || 0,
            hp_temporary: scannedData.hp_temporary || 0,
            armor_class: scannedData.armor_class || 10,
            proficiency_bonus: scannedData.proficiency_bonus || 2,
            initiative: scannedData.initiative || 0,
            speed: scannedData.speed || 30,
            hit_dice: scannedData.hit_dice || '1d8',
            passive_perception: scannedData.passive_perception || 10,
            inspiration: scannedData.inspiration || false,
            saving_throws: scannedData.saving_throws || null,
            skills: scannedData.skills || null,
            attacks: scannedData.attacks || null,
            equipment: scannedData.equipment || '',
            currency: scannedData.currency || null,
            personality_traits: scannedData.personality_traits || '',
            ideals: scannedData.ideals || '',
            bonds: scannedData.bonds || '',
            flaws: scannedData.flaws || '',
            features_traits: scannedData.features_traits || '',
            other_proficiencies: scannedData.other_proficiencies || '',
            spellcasting: scannedData.spellcasting || null,
            age: scannedData.age || '',
            height: scannedData.height || '',
            weight: scannedData.weight || '',
            eyes: scannedData.eyes || '',
            skin: scannedData.skin || '',
            hair: scannedData.hair || '',
            backstory: scannedData.backstory || '',
          } : null}
        />
      </div>
    </div>
  )
}

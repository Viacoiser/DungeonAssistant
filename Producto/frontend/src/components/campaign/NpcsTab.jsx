import React, { useState, useEffect } from 'react'
import { npcAPI } from '../../services/api'
import NpcsSidebar from './npcs/NpcsSidebar'
import NpcDetail from './npcs/NpcDetail'
import DeleteNpcModal from './npcs/DeleteNpcModal'

// ============================================================================
// Tab: NPCs
// ============================================================================

export default function NpcsTab({ campaignId, isGM = false }) {
  const [npcs, setNpcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [selectedNpc, setSelectedNpc] = useState(null)
  const [editingNpc, setEditingNpc] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [savingNpc, setSavingNpc] = useState(false)

  const [npcDeleteModal, setNpcDeleteModal] = useState(null)
  const [npcDeleteConfirmText, setNpcDeleteConfirmText] = useState('')
  const [npcDeleting, setNpcDeleting] = useState(false)
  const [generatingTrait, setGeneratingTrait] = useState(false)

  const relationColors = {
    aliado: 'text-green-300 border-green-500/30 bg-green-500/10',
    enemigo: 'text-red-300 border-red-500/30 bg-red-500/10',
    neutral: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
    desconocido: 'text-gray-300 border-gray-500/30 bg-gray-500/10',
  }

  useEffect(() => {
    loadNpcs()
  }, [campaignId])

  const loadNpcs = async () => {
    try {
      const res = await npcAPI.list(campaignId)
      setNpcs(res.data || [])
    } catch {
      setNpcs([])
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await npcAPI.generate(campaignId, prompt)
      await loadNpcs()
      setSelectedNpc(res.data)
      setPrompt('')
    } catch (e) {
      console.error('Error generando NPC:', e)
      const msg = e?.response?.data?.detail || 'Error al generar el NPC. Revisá que el backend esté corriendo.'
      setGenerateError(msg)
    } finally {
      setGenerating(false)
    }
  }

  const startEditing = () => {
    setEditForm({ ...selectedNpc, stats: { ...selectedNpc.stats } })
    setEditingNpc(true)
  }

  const handleUpdateNpc = async () => {
    setSavingNpc(true)
    try {
      const res = await npcAPI.update(campaignId, selectedNpc.id, editForm)
      const updatedNpc = res.data
      setNpcs(prev => prev.map(n => n.id === updatedNpc.id ? updatedNpc : n))
      setSelectedNpc({ ...selectedNpc, ...editForm })
      setEditingNpc(false)
    } catch (e) {
      console.error('Error actualizando NPC:', e)
      alert(e?.response?.data?.detail || 'Error al guardar NPC.')
    } finally {
      setSavingNpc(false)
    }
  }

  const handleDeleteNpc = async () => {
    if (npcDeleteConfirmText !== selectedNpc.name) return
    setNpcDeleting(true)
    try {
      await npcAPI.delete(campaignId, selectedNpc.id)
      await loadNpcs()
      setSelectedNpc(null)
      setNpcDeleteModal(null)
      setEditingNpc(false)
    } catch (e) {
      console.error('Error eliminando NPC:', e)
      alert(e?.response?.data?.detail || 'Error al eliminar NPC.')
    } finally {
      setNpcDeleting(false)
    }
  }

  const handleGenerateTrait = async () => {
    setGeneratingTrait(true)
    try {
      const res = await npcAPI.generateTrait(campaignId, selectedNpc.id)
      setNpcs(prev => prev.map(n => n.id === res.data.npc.id ? res.data.npc : n))
      setSelectedNpc(res.data.npc)
      if (editingNpc) {
        setEditForm(prev => ({ ...prev, personality: res.data.npc.personality }))
      }
    } catch (e) {
      console.error('Error generando rasgo:', e)
      alert(e?.response?.data?.detail || 'Error al generar el rasgo.')
    } finally {
      setGeneratingTrait(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-4 h-full relative overflow-hidden">
      {!isGM && (
        <div className="absolute top-0 left-0 right-0 bg-amber-900/30 border border-amber-500/30 rounded-lg px-4 py-2 text-xs text-amber-300 mb-2 z-10" style={{ position: 'relative', marginBottom: '0.75rem' }}>
          ⚔️ Modo Jugador — Solo el GM puede generar o editar NPCs.
        </div>
      )}

      <NpcsSidebar 
        npcs={npcs}
        loading={loading}
        selectedNpc={selectedNpc}
        setSelectedNpc={setSelectedNpc}
        isGM={isGM}
        prompt={prompt}
        setPrompt={setPrompt}
        handleGenerate={handleGenerate}
        generating={generating}
        generateError={generateError}
      />

      <NpcDetail 
        selectedNpc={selectedNpc}
        setSelectedNpc={setSelectedNpc}
        isGM={isGM}
        editingNpc={editingNpc}
        setEditingNpc={setEditingNpc}
        editForm={editForm}
        setEditForm={setEditForm}
        handleUpdateNpc={handleUpdateNpc}
        savingNpc={savingNpc}
        setNpcDeleteModal={setNpcDeleteModal}
        handleGenerateTrait={handleGenerateTrait}
        generatingTrait={generatingTrait}
        startEditing={startEditing}
        relationColors={relationColors}
      />

      <DeleteNpcModal 
        npcDeleteModal={npcDeleteModal}
        npcDeleteConfirmText={npcDeleteConfirmText}
        setNpcDeleteConfirmText={setNpcDeleteConfirmText}
        handleDeleteNpc={handleDeleteNpc}
        setNpcDeleteModal={setNpcDeleteModal}
        npcDeleting={npcDeleting}
      />
    </div>
  )
}

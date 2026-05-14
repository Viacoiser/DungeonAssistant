import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Send, Trash2, Edit2, History, Users, Settings, MessageSquare, Theater, Camera, Mic, Upload, Image, StopCircle, Play, User } from 'lucide-react'
import { campaignAPI, sessionAPI, npcAPI, assistantAPI, characterAPI, dnd5eAPI } from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import LoadingSpinner from '../shared/LoadingSpinner'
import CharacterDetail from '../shared/CharacterDetail'
import CharacterCard from '../shared/CharacterCard'
import DiceBoxRollerResponsive from '../shared/DiceBoxRollerResponsive'
import VoiceRecorder from '../shared/VoiceRecorder'
import BottomNavResponsive from '../shared/BottomNavResponsive'
import { Icon } from '../shared/CampaignIcons'


// ============================================================================
// Tab: Notas de Sesión (con análisis IA)
// ============================================================================

// ============================================================================
// Tab: OCR — Leer Imagen (Frontend Only)
// ============================================================================
export default function OCRTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-8 overflow-y-auto h-full"
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="text-center">
          <h3 className="font-serif text-2xl font-bold text-white mb-2 underline decoration-purple-500/30">OCR — Leer Imagen</h3>
          <p className="text-sm text-gray-400">Sube una foto de tus notas, mapas o libros para extraer el texto automáticamente.</p>
        </div>

        {/* Drop Zone */}
        <label
          htmlFor="ocr-file-input"
          className="group flex flex-col items-center justify-center gap-6 border-2 border-dashed border-purple-500/40 hover:border-purple-500/80 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl p-12 cursor-pointer transition-all duration-300"
        >
          <div className="w-20 h-20 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 flex items-center justify-center transition-all duration-300">
            <Camera size={36} className="text-purple-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-200 text-lg mb-1">Arrastra una imagen aquí</p>
            <p className="text-sm text-gray-500">o haz clic para seleccionar un archivo</p>
            <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">PNG · JPG · WEBP · PDF</p>
          </div>
          <div className="flex items-center gap-3 px-6 py-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300 font-bold text-sm group-hover:bg-purple-500/30 transition-all">
            <Upload size={16} />
            Seleccionar Archivo
          </div>
          <input id="ocr-file-input" type="file" accept="image/*,.pdf" className="hidden" />
        </label>

        {/* Preview placeholder */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <Image size={18} className="text-gray-500" />
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Vista Previa / Resultado</span>
          </div>
          <div className="min-h-[120px] flex items-center justify-center">
            <p className="text-sm text-gray-600 italic">El texto extraído aparecerá aquí…</p>
          </div>
        </div>

        <button className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 uppercase tracking-widest text-xs">
          <Camera size={16} />
          Analizar Imagen
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Tab: Voice — Enviar Audio (Frontend Only)
// ============================================================================

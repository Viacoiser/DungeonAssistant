import React from 'react'
import { Send } from 'lucide-react'
import VoiceRecorder from '../../shared/VoiceRecorder'

export default function NotesInput({
  noteText,
  setNoteText,
  handleNoteTextChange,
  handleAddNote,
  sending,
  voiceError,
  setVoiceError,
  textareaRef,
  showAutocomplete,
  autocomplete,
  autocompletePosition,
  handleSelectSuggestion
}) {
  return (
    <div className="mt-auto space-y-2">
      <VoiceRecorder
        onTranscribed={(text) => {
          setNoteText(text)
          setVoiceError('')
        }}
        onError={(error) => {
          setVoiceError(error)
        }}
      />
      {voiceError && (
        <p className="text-xs text-red-400">{voiceError}</p>
      )}
      <div className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/5 focus-within:border-fantasy-accent/30 transition-colors relative">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={handleNoteTextChange}
            placeholder="Escribe la nota de sesión..."
            rows={2}
            className="w-full bg-transparent border-none rounded-xl px-4 py-2 text-[var(--fantasy-gold)] text-sm placeholder-[var(--fantasy-gold-muted)]/50 focus:outline-none resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) handleAddNote()
            }}
          />
          
          {/* Dropdown de autocompletado - Flexible position */}
          {showAutocomplete && autocomplete.length > 0 && (
            <div className={`absolute left-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto ${
              autocompletePosition === 'top' 
                ? 'bottom-full mb-1' 
                : 'top-full mt-1'
            }`}>
              {autocomplete.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-4 py-2 text-[var(--fantasy-gold)] text-sm hover:bg-fantasy-accent/20 hover:text-fantasy-accent transition flex items-center justify-between"
                >
                  <span>{suggestion.label}</span>
                  <span className="text-[10px] text-[var(--fantasy-gold-muted)]">{suggestion.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleAddNote}
          disabled={sending || !noteText.trim()}
          className="w-12 h-12 flex items-center justify-center bg-fantasy-accent text-white rounded-xl hover:bg-[#e86424] active:scale-95 disabled:opacity-40 transition-all fantasy-button-glow flex-shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      <p className="text-[10px] text-white/20 mt-2 text-center uppercase tracking-widest font-bold">Ctrl+Enter para enviar • 🔒 Privada por defecto • 🔓 Haz clic para compartir</p>
    </div>
  )
}

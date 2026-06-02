import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export default function VoiceRecorder({ onTranscribed, onError }) {
  const [showReview, setShowReview] = useState(false);

  const {
    recording,
    transcribedText,
    setTranscribedText,
    interimText,
    micStatus,
    startRecording,
    stopRecording,
    resetRecorder
  } = useSpeechRecognition({
    onTranscribed,
    onError
  });

  // Mostrar panel de revisión cuando grabación termina con texto
  useEffect(() => {
    if (!recording && transcribedText && !showReview) {
      setShowReview(true);
    }
  }, [recording, transcribedText, showReview]);

  const handleStartRecording = () => {
    setShowReview(false);
    startRecording();
  };

  const sendTranscription = () => {
    if (transcribedText && onTranscribed) {
      onTranscribed(transcribedText);
      resetRecorder();
      setShowReview(false);
    }
  };

  const cancelTranscription = () => {
    resetRecorder();
    setShowReview(false);
  };

  const handleRetry = () => {
    setShowReview(false);
    startRecording();
  };

  // Panel de grabación
  if (!showReview) {
    return (
      <div className="voice-recorder space-y-2">
        {/* Aviso si el micrófono no está disponible */}
        {micStatus === 'denied' && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg px-3 py-2 text-xs text-red-300">
            ❌ Permiso denegado: Permite el micrófono en la configuración del navegador
          </div>
        )}
        {micStatus === 'error' && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg px-3 py-2 text-xs text-red-300">
            ❌ Micrófono no detectado o no disponible
          </div>
        )}

        <div className="flex gap-2 items-center">
          {!recording ? (
            // Cuando NO está grabando - solo botón Grabar
            <button
              onClick={handleStartRecording}
              disabled={micStatus !== 'ok'}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all whitespace-nowrap ${
                micStatus === 'ok'
                  ? 'bg-[var(--fantasy-accent)] hover:bg-[#e86424] text-white cursor-pointer'
                  : 'bg-gray-600 text-white opacity-50 cursor-not-allowed'
              }`}
            >
              🎤 Grabar
            </button>
          ) : (
            // Cuando SÍ está grabando - botones Grabar (disabled) y Detener lado a lado
            <>
              <button
                disabled={true}
                className="px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all whitespace-nowrap bg-gray-600 text-white opacity-50 cursor-not-allowed"
              >
                🎤 Grabar
              </button>
              <button
                onClick={stopRecording}
                className="px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all whitespace-nowrap bg-red-600 hover:bg-red-700 text-white animate-pulse"
              >
                🔴 Detener
              </button>
            </>
          )}

          {recording && (
            <span className="text-sm text-[var(--fantasy-gold-muted)] flex items-center gap-1">
              🔴 Grabando...
            </span>
          )}
        </div>

        {/* Mostrar texto intermedio debajo cuando está grabando */}
        {recording && interimText && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--fantasy-gold)] italic">
            <p className="opacity-75 mb-1">💭 Escuchando:</p>
            <p className="text-base">"{interimText}"</p>
          </div>
        )}

        {/* Mostrar último texto confirmado */}
        {recording && transcribedText && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--fantasy-gold)]">
            <p className="opacity-75 mb-1">✓ Detectado:</p>
            <p className="text-base">{transcribedText}</p>
          </div>
        )}
      </div>
    );
  }

  // Panel de revisión (después de grabar)
  return (
    <div className="voice-recorder bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-xs text-[var(--fantasy-gold-muted)] mb-2">✅ Transcripción detectada:</p>
        <textarea
          value={transcribedText}
          onChange={(e) => setTranscribedText(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--fantasy-gold)] placeholder-white/30 focus:outline-none focus:border-[var(--fantasy-accent)]"
          rows="3"
          placeholder="Edita el texto si es necesario..."
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={sendTranscription}
          className="flex-1 min-w-fit px-3 py-2 bg-[var(--fantasy-accent)] hover:bg-[#e86424] text-white rounded-lg font-medium transition-all text-sm"
        >
          ✓ Enviar Nota
        </button>
        
        <button
          onClick={cancelTranscription}
          className="flex-1 min-w-fit px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all text-sm"
        >
          ✕ Descartar
        </button>

        <button
          onClick={handleRetry}
          className="flex-1 min-w-fit px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm whitespace-nowrap"
        >
          🔄 Reintentar
        </button>
      </div>
    </div>
  );
}

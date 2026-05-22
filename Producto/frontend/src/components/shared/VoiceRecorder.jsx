import React, { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ onTranscribed, onError }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [micStatus, setMicStatus] = useState('checking'); // 'checking', 'ok', 'denied', 'error'
  const recognitionRef = useRef(null);
  const onTranscribedRef = useRef(onTranscribed);
  const onErrorRef = useRef(onError);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onTranscribedRef.current = onTranscribed;
    onErrorRef.current = onError;
  }, [onTranscribed, onError]);

  // Verificar disponibilidad del micrófono
  useEffect(() => {
    const checkMicrophone = async () => {
      try {
        // Solicitar permiso de micrófono
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // Detener inmediatamente
        setMicStatus('ok');
        console.log('✅ Micrófono disponible y permitido');
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          setMicStatus('denied');
          console.error('❌ Permiso de micrófono DENEGADO');
          onErrorRef.current?.('❌ Permiso de micrófono denegado. Ve a Configuración del navegador para permitirlo.');
        } else {
          setMicStatus('error');
          console.error('❌ Micrófono no disponible:', error.name);
          onErrorRef.current?.('❌ No se encontró micrófono conectado.');
        }
      }
    };

    checkMicrophone();
  }, []);

  useEffect(() => {
    // Inicializar Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Web Speech API no soportada en este navegador');
      onErrorRef.current?.('Tu navegador no soporta grabación de voz');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Grabación continua hasta que llame a stop()
    recognition.interimResults = true; // Mostrar resultados intermedios
    recognition.lang = 'es-ES'; // Español
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setRecording(true);
      setTranscribedText('');
      setInterimText('');
      setShowReview(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscript = finalTranscript.trim();
      interimTranscript = interimTranscript.trim();

      // Mostrar texto intermedio mientras se está grabando
      if (interimTranscript) {
        setInterimText(interimTranscript);
      }

      // Cuando hay resultado final, guardarlo
      if (finalTranscript) {
        setTranscribedText((prev) => (prev + ' ' + finalTranscript).trim());
        setInterimText('');
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Error en reconocimiento de voz:', event.error);
      setRecording(false);

      const errorMessages = {
        'no-speech': 'No se detectó voz. Asegúrate que el micrófono esté activo.',
        'audio-capture': 'No se encontró micrófono o no tienes permisos.',
        'network': 'Error temporal de conexión. Intenta de nuevo en 10 segundos.',
        'denied': 'Permiso de micrófono denegado. Revisa la configuración del navegador.',
        'aborted': 'Grabación cancelada.',
        'service-not-allowed': 'Servicio de voz no disponible en tu región.'
      };

      const message = errorMessages[event.error] || `Error: ${event.error}`;
      console.log('📢 Mostrando error al usuario:', message);
      onErrorRef.current?.(message);
    };

    recognition.onend = () => {
      setRecording(false);
      setTranscribing(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore if already stopped
        }
      }
    };
  }, []); // Solo inicializar una vez

  // Mostrar panel de revisión cuando grabación termina con texto
  useEffect(() => {
    if (!recording && transcribedText && !showReview) {
      setShowReview(true);
    }
  }, [recording, transcribedText, showReview]);

  const startRecording = () => {
    if (micStatus !== 'ok') {
      onErrorRef.current?.('⚠️ El micrófono no está disponible. Revisa los permisos del navegador.');
      return;
    }

    if (recognitionRef.current) {
      setTranscribedText('');
      setInterimText('');
      setShowReview(false);
      setRecording(true);
      try {
        recognitionRef.current.start();
        console.log('🎤 Grabación iniciada');
      } catch (e) {
        console.error('Error iniciando grabación:', e);
        setRecording(false);
        onErrorRef.current?.('Error al iniciar la grabación. Intenta de nuevo.');
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('🛑 Grabación detenida manualmente');
      } catch (e) {
        console.error('Error al detener grabación:', e);
      }
    }
  };

  const sendTranscription = () => {
    if (transcribedText && onTranscribedRef.current) {
      onTranscribedRef.current(transcribedText);
      resetRecorder();
    }
  };

  const cancelTranscription = () => {
    resetRecorder();
  };

  const resetRecorder = () => {
    setTranscribedText('');
    setInterimText('');
    setShowReview(false);
    setRecording(false);
    setTranscribing(false);
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
              onClick={startRecording}
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
                onClick={startRecording}
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
          onClick={() => {
            setShowReview(false);
            startRecording();
          }}
          className="flex-1 min-w-fit px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm whitespace-nowrap"
        >
          🔄 Reintentar
        </button>
      </div>
    </div>
  );
}


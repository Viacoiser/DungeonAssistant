import { useState, useRef, useEffect } from 'react';

// Normaliza el texto eliminando puntuación, espacios extra y pasando a minúsculas
const normalizeText = (str) => {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // eliminar puntuación
    .replace(/\s+/g, " ")                       // colapsar espacios múltiples
    .trim();
};

// Determina si 'child' es un prefijo en límite de palabra de 'parent'
const isPrefixOf = (parent, child) => {
  const p = normalizeText(parent);
  const c = normalizeText(child);
  if (p.startsWith(c)) {
    const remainder = p.slice(c.length);
    return remainder === '' || remainder.startsWith(' ');
  }
  return false;
};

/**
 * useSpeechRecognition - Hook personalizado para manejar el reconocimiento de voz
 * nativo del navegador (Web Speech API) con deduplicación avanzada para móviles.
 */
export function useSpeechRecognition({ onTranscribed, onError } = {}) {
  const [recording, setRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [micStatus, setMicStatus] = useState('checking'); // 'checking', 'ok', 'denied', 'error'
  
  const recognitionRef = useRef(null);
  const onTranscribedRef = useRef(onTranscribed);
  const onErrorRef = useRef(onError);
  const latestFinalRef = useRef('');
  const latestInterimRef = useRef('');

  // Mantener los callbacks de referencia actualizados
  useEffect(() => {
    onTranscribedRef.current = onTranscribed;
    onErrorRef.current = onError;
  }, [onTranscribed, onError]);

  // Verificar la disponibilidad y permisos del micrófono
  useEffect(() => {
    const checkMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // Detener pista de inmediato
        setMicStatus('ok');
        console.log('✅ [useSpeechRecognition] Micrófono disponible');
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          setMicStatus('denied');
          console.error('❌ [useSpeechRecognition] Permiso de micrófono DENEGADO');
          onErrorRef.current?.('❌ Permiso de micrófono denegado. Ve a Configuración del navegador para permitirlo.');
        } else {
          setMicStatus('error');
          console.error('❌ [useSpeechRecognition] Micrófono no disponible:', error.name);
          onErrorRef.current?.('❌ No se encontró micrófono conectado.');
        }
      }
    };

    checkMicrophone();
  }, []);

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('❌ [useSpeechRecognition] Web Speech API no soportada');
      onErrorRef.current?.('Tu navegador no soporta grabación de voz');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setRecording(true);
      setTranscribedText('');
      setInterimText('');
      latestFinalRef.current = '';
      latestInterimRef.current = '';
    };

    recognition.onresult = (event) => {
      const finalSegments = [];
      let activeInterim = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;

        if (isFinal) {
          if (finalSegments.length > 0) {
            const lastIndex = finalSegments.length - 1;
            const last = finalSegments[lastIndex];

            if (isPrefixOf(transcript, last)) {
              // El nuevo fragmento finalizado incluye/extiende el anterior (Chrome Mobile)
              finalSegments[lastIndex] = transcript;
            } else if (isPrefixOf(last, transcript)) {
              // Ya cubierto por un fragmento anterior, ignorar
            } else {
              // Fragmento final independiente
              finalSegments.push(transcript);
            }
          } else {
            finalSegments.push(transcript);
          }
        } else {
          // Fragmento intermedio
          const lastFinal = finalSegments.length > 0 ? finalSegments[finalSegments.length - 1] : '';

          if (lastFinal && isPrefixOf(transcript, lastFinal)) {
            const remainder = transcript.slice(lastFinal.length).trim();
            if (remainder) {
              activeInterim = remainder;
            }
          } else if (lastFinal && isPrefixOf(lastFinal, transcript)) {
            activeInterim = '';
          } else {
            activeInterim = transcript;
          }
        }
      }

      const finalTranscript = finalSegments.join(' ').trim();
      const interimTranscript = activeInterim.trim();

      latestFinalRef.current = finalTranscript;
      latestInterimRef.current = interimTranscript;

      if (interimTranscript) {
        setInterimText(interimTranscript);
      } else {
        setInterimText('');
      }

      if (finalTranscript) {
        setTranscribedText(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ [useSpeechRecognition] Error:', event.error);
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
      onErrorRef.current?.(message);
    };

    recognition.onend = () => {
      setRecording(false);
      
      const combined = [latestFinalRef.current, latestInterimRef.current].filter(Boolean).join(' ');
      if (combined) {
        setTranscribedText(combined);
      }
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
          // ignorar si ya está detenido
        }
      }
    };
  }, []);

  const startRecording = () => {
    if (micStatus !== 'ok') {
      onErrorRef.current?.('⚠️ El micrófono no está disponible. Revisa los permisos del navegador.');
      return;
    }

    if (recognitionRef.current) {
      setTranscribedText('');
      setInterimText('');
      latestFinalRef.current = '';
      latestInterimRef.current = '';
      setRecording(true);
      try {
        recognitionRef.current.start();
        console.log('🎤 [useSpeechRecognition] Grabación iniciada');
      } catch (e) {
        console.error('❌ [useSpeechRecognition] Error al iniciar:', e);
        setRecording(false);
        onErrorRef.current?.('Error al iniciar la grabación. Intenta de nuevo.');
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('🛑 [useSpeechRecognition] Grabación detenida');
      } catch (e) {
        console.error('❌ [useSpeechRecognition] Error al detener:', e);
      }
    }
  };

  const resetRecorder = () => {
    setTranscribedText('');
    setInterimText('');
    latestFinalRef.current = '';
    latestInterimRef.current = '';
    setRecording(false);
  };

  return {
    recording,
    transcribedText,
    setTranscribedText,
    interimText,
    micStatus,
    startRecording,
    stopRecording,
    resetRecorder
  };
}

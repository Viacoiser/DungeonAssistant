import React, { useState, useRef, useEffect } from 'react';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onTranscribed, onError, onSpeakResponse }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const error = '❌ Web Speech API no disponible en este navegador';
      console.error(error);
      if (onError) onError(error);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'es-ES'; // Español

    // Eventos de reconocimiento
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        if (onTranscribed) onTranscribed(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      const errorMsg = `Error en reconocimiento: ${event.error}`;
      console.error('❌', errorMsg);
      if (onError) onError(errorMsg);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscribed, onError]);

  // Inicializar Web Speech Synthesis (TTS)
  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakResponse = (text) => {
    if (!synthesisRef.current) return;

    // Detener síntesis anterior si hay
    if (synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('❌ Error en TTS:', event.error);
      setIsSpeaking(false);
    };

    synthesisRef.current.speak(utterance);
  };

  return (
    <div className="voice-recorder">
      <div className="voice-controls">
        {!isListening ? (
          <button 
            className="btn-voice-start" 
            onClick={startListening}
            title="Presionar para grabar"
          >
            🎤 Grabar
          </button>
        ) : (
          <button 
            className="btn-voice-stop recording" 
            onClick={stopListening}
            title="Presionar para detener"
          >
            ⏹️ Deteniendo...
          </button>
        )}
      </div>

      {transcript && (
        <div className="voice-transcript">
          <p className="transcript-label">Lo que dijiste:</p>
          <p className="transcript-text">{transcript}</p>
        </div>
      )}

      {isSpeaking && (
        <div className="voice-speaking">
          🔊 Reproduciendo respuesta...
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;

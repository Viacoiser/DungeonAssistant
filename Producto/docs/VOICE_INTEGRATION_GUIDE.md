# 🎤 Voice Integration Guide - Audio Input to Chat

**Objetivo:** Permitir que usuarios hablen para agregar notas y hacer preguntas al chat (Audio → Texto → Chat).

**Tecnología:** Google Cloud Speech-to-Text API + Web Audio API  
**Tiempo estimado:** 2-3 días (incluye testing)

---

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Setup Google Speech-to-Text](#setup-google-speech-to-text)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Components](#frontend-components)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Usuario presiona botón 🎤 "Grabar"                     │
│  (Web Audio API comienza a grabar)                      │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Usuario termina de hablar                              │
│  Audio WAV/MP3 enviado a backend                        │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  POST /voice/transcribe - Backend                       │
│  1. Recibe audio en bytes                               │
│  2. Envía a Google Cloud Speech-to-Text                │
│  3. Retorna texto transcrito                            │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Frontend: Texto → POST /chat (como si fuera tipeado)  │
│  Gemini responde como de costumbre                      │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  (Opcional) Text-to-Speech: Reproducir respuesta       │
│  Google Cloud Text-to-Speech API                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Setup Google Speech-to-Text

### 1. Enable Speech-to-Text API

```bash
# En Google Cloud Console (console.cloud.google.com)
1. Menu → APIs & Services
2. Enable APIs → Buscar "Cloud Speech-to-Text API"
3. Click "Enable"
```

### 2. Add Permissions to Service Account

```bash
# Google Cloud Console
1. IAM & Admin → Roles
2. Buscar "Speech-to-Text Client"
3. Grant role a tu service account:
   - "roles/speech.recognitionAdmin"
4. Guardar cambios
```

### 3. Verificar Credenciales

```bash
# backend/.env
GOOGLE_SPEECH_CREDENTIALS_PATH=.secrets/google-speech-key.json
# (Puedes usar el mismo JSON de OCR si tiene permisos)
```

---

## 🐍 Backend Implementation

### Step 1: Install Dependencies

```bash
cd backend
pip install google-cloud-speech pydub librosa
```

### Step 2: Create Voice Service

Crea: `backend/services/voice.py`

```python
import logging
from typing import Optional, Dict
from google.cloud import speech_v1
import io
from pydub import AudioSegment

logger = logging.getLogger("services.voice")

class VoiceService:
    """
    Service para transcribir audio a texto usando Google Cloud Speech-to-Text
    """
    
    def __init__(self):
        """Inicializar Google Speech client"""
        try:
            self.speech_client = speech_v1.SpeechClient()
            logger.info("✓ Google Cloud Speech-to-Text initialized")
        except Exception as e:
            logger.warn(f"⚠ Speech-to-Text API not available: {e}")
            self.speech_client = None
    
    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        language_code: str = "es-ES",
        audio_format: str = "audio/webm"
    ) -> Dict[str, any]:
        """
        Transcribir audio a texto
        
        Args:
            audio_bytes: Contenido de archivo de audio
            language_code: Código de idioma (es-ES, en-US, etc)
            audio_format: MIME type del audio
            
        Returns:
            {
                "success": bool,
                "text": str,
                "confidence": float,
                "alternatives": List[str]  # Alternativas si hay
            }
        """
        
        if not self.speech_client:
            raise RuntimeError("Speech-to-Text service not available")
        
        try:
            # 1. Convertir audio si es necesario
            audio_content = self._normalize_audio(
                audio_bytes,
                audio_format
            )
            
            # 2. Crear request
            audio = speech_v1.RecognitionAudio(content=audio_content)
            
            config = speech_v1.RecognitionConfig(
                encoding=speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
                language_code=language_code,
                sample_rate_hertz=16000,  # 16kHz es estándar
                enable_automatic_punctuation=True,
                model="default",
                do_not_perform_normalization=False,
                # Detectar múltiples idiomas si es necesario
                alternative_language_codes=["en-US", "fr-FR"]
            )
            
            # 3. Transcribir
            logger.info(f"Transcribing {len(audio_bytes)} bytes of audio...")
            response = self.speech_client.recognize(config=config, audio=audio)
            
            # 4. Procesar resultados
            if response.results:
                # Mejor resultado
                best_result = response.results[-1]
                
                if best_result.alternatives:
                    best_alternative = best_result.alternatives[0]
                    text = best_alternative.transcript
                    confidence = best_alternative.confidence
                    
                    # Alternativas adicionales
                    alternatives = [
                        alt.transcript
                        for alt in best_result.alternatives[1:]
                    ]
                    
                    logger.info(f"✓ Transcribed: {text[:100]} (confidence: {confidence:.2%})")
                    
                    return {
                        "success": True,
                        "text": text,
                        "confidence": confidence,
                        "alternatives": alternatives,
                        "is_final": best_result.is_final
                    }
            
            logger.warn("No transcription results")
            return {
                "success": False,
                "text": "",
                "confidence": 0.0,
                "alternatives": [],
                "error": "No speech detected"
            }
        
        except Exception as e:
            logger.error(f"❌ Transcription error: {e}", exc_info=True)
            raise
    
    def _normalize_audio(
        self,
        audio_bytes: bytes,
        audio_format: str
    ) -> bytes:
        """
        Convertir audio a formato estándar (LINEAR16, 16kHz)
        
        Soporta: WebM, MP3, OGG, WAV, FLAC
        """
        
        try:
            # Detectar formato automáticamente
            if audio_format == "audio/webm":
                # WebM → WAV
                audio = AudioSegment.from_file(
                    io.BytesIO(audio_bytes),
                    format="webm"
                )
            elif audio_format == "audio/mpeg":
                audio = AudioSegment.from_file(
                    io.BytesIO(audio_bytes),
                    format="mp3"
                )
            elif audio_format == "audio/ogg":
                audio = AudioSegment.from_file(
                    io.BytesIO(audio_bytes),
                    format="ogg"
                )
            elif audio_format == "audio/wav":
                audio = AudioSegment.from_file(
                    io.BytesIO(audio_bytes),
                    format="wav"
                )
            else:
                # Default fallback
                audio = AudioSegment.from_file(
                    io.BytesIO(audio_bytes)
                )
            
            # Convertir a 16000 Hz, mono, 16-bit
            audio = audio.set_frame_rate(16000)
            audio = audio.set_channels(1)
            audio = audio.set_sample_width(2)
            
            # Exportar a WAV
            output = io.BytesIO()
            audio.export(
                output,
                format="wav",
                codec="pcm_s16le"
            )
            
            logger.debug(f"✓ Normalized audio: {audio.duration_seconds}s")
            return output.getvalue()
        
        except Exception as e:
            logger.warn(f"Audio normalization error: {e}, using raw")
            return audio_bytes
    
    async def synthesize_speech(
        self,
        text: str,
        language_code: str = "es-ES",
    ) -> Optional[bytes]:
        """
        Convertir texto a audio (Text-to-Speech)
        
        Returns:
            Audio bytes (MP3) o None si error
        """
        
        try:
            from google.cloud import texttospeech_v1
            
            tts_client = texttospeech_v1.TextToSpeechClient()
            
            synthesis_input = texttospeech_v1.SynthesisInput(text=text)
            
            voice = texttospeech_v1.VoiceSelectionParams(
                language_code=language_code,
                # Usar voz natural
                name=f"{language_code}-Neural2-A"  # Neural voice
            )
            
            audio_config = texttospeech_v1.AudioConfig(
                audio_encoding=texttospeech_v1.AudioEncoding.MP3
            )
            
            response = tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            logger.info(f"✓ Synthesized {len(text)} characters to speech")
            return response.audio_content
        
        except Exception as e:
            logger.warn(f"Text-to-Speech error: {e}")
            return None

# Instancia global
voice_service = VoiceService()
```

### Step 3: Create API Endpoint

Crea: `backend/routers/voice.py`

```python
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import logging
from services.voice import voice_service
from middleware.auth import get_current_user

logger = logging.getLogger("routers.voice")
router = APIRouter(prefix="/voice", tags=["voice"])

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "es-ES",
    current_user: dict = Depends(get_current_user)
):
    """
    Transcribir audio a texto
    
    Args:
        file: Archivo de audio (webm, mp3, wav, ogg, flac)
        language: ISO 639-1 language code (es, en, fr, etc)
        
    Returns:
        {
            "success": bool,
            "text": str,
            "confidence": float,
            "alternatives": List[str]
        }
    """
    
    try:
        # 1. Validar archivo
        audio_mimes = [
            "audio/webm",
            "audio/mpeg",
            "audio/wav",
            "audio/ogg",
            "audio/flac"
        ]
        
        if file.content_type not in audio_mimes:
            raise HTTPException(
                status_code=400,
                detail=f"Audio format not supported. Use: {', '.join(audio_mimes)}"
            )
        
        if file.size > 524288000:  # 500MB max
            raise HTTPException(
                status_code=413,
                detail="Audio file too large (max 500MB)"
            )
        
        # 2. Leer contenido
        content = await file.read()
        logger.info(f"Processing audio: {file.filename} ({len(content)} bytes)")
        
        # 3. Transcribir
        result = await voice_service.transcribe_audio(
            audio_bytes=content,
            language_code=language,
            audio_format=file.content_type
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Transcription error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)[:100])


@router.post("/synthesize")
async def synthesize_speech(
    text_data: dict,
    language: str = "es-ES",
    current_user: dict = Depends(get_current_user)
):
    """
    Convertir texto a audio (TTS)
    
    Request body:
    {
        "text": "Respuesta del asistente..."
    }
    
    Returns:
        Audio MP3 bytes
    """
    
    try:
        text = text_data.get("text", "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        if len(text) > 5000:
            raise HTTPException(
                status_code=413,
                detail="Text too long (max 5000 chars)"
            )
        
        # Sintetizar
        audio_bytes = await voice_service.synthesize_speech(
            text=text,
            language_code=language
        )
        
        if not audio_bytes:
            raise HTTPException(
                status_code=500,
                detail="Failed to synthesize speech"
            )
        
        # Retornar MP3
        from fastapi.responses import StreamingResponse
        import io
        
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=response.mp3"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Synthesis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)[:100])


@router.get("/status")
async def voice_status(current_user: dict = Depends(get_current_user)):
    """Verificar si Voice service está disponible"""
    return {
        "voice_available": voice_service.speech_client is not None,
        "status": "ready" if voice_service.speech_client else "offline"
    }
```

### Step 4: Add to Main Router

En `backend/main.py`:

```python
from routers.voice import router as voice_router

app.include_router(voice_router)
```

---

## ⚛️ Frontend Components

### VoiceRecorder Component

Crea: `frontend/components/VoiceRecorder.jsx`

```jsx
import React, { useState, useRef } from 'react';
import api from '@/services/api';

export default function VoiceRecorder({ onTranscribed, onError }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [text, setText] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;
      
      // Crear MediaRecorder con mejor codec
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await handleStopRecording();
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Micrófono error:', err);
      onError?.('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const handleStopRecording = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await api.post('/voice/transcribe?language=es-ES', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setText(response.data.text);
        
        // Callback con texto transcrito
        if (onTranscribed) {
          onTranscribed(response.data.text);
        }
      } else {
        onError?.(`Error: ${response.data.error}`);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      onError?.('Error al transcribir audio');
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="voice-recorder flex gap-2 items-center">
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={transcribing}
        className={`px-4 py-2 rounded flex items-center gap-2 ${
          recording
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${transcribing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {recording ? (
          <>
            🔴 Grabando...
          </>
        ) : (
          <>
            🎤 Grabar
          </>
        )}
      </button>

      {transcribing && (
        <span className="text-sm text-gray-600">Transcribiendo...</span>
      )}

      {text && (
        <div className="flex-1 bg-gray-100 rounded px-3 py-2 text-sm">
          "{text}"
        </div>
      )}
    </div>
  );
}
```

### Integrar en Chat

En `frontend/pages/CampaignView.jsx`, en el chat input:

```jsx
import VoiceRecorder from '@/components/VoiceRecorder';

// En el JSX:
<div className="chat-input space-y-2">
  <VoiceRecorder
    onTranscribed={(text) => {
      setQuestion(text);
      // Auto-submit si lo deseas:
      // handleAsk(text);
    }}
    onError={(error) => {
      setError(error);
    }}
  />
  
  <textarea
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    placeholder="Pregunta o dicta aquí..."
    className="w-full p-3 border rounded"
  />
  
  <button onClick={() => handleAsk(question)}>
    Enviar 📤
  </button>
</div>
```

---

## 🧪 Testing

### Backend Tests

Crea: `tests/test_voice_integration.py`

```python
import pytest
from backend.services.voice import voice_service
from pathlib import Path

def test_voice_service_initialization():
    """Verificar que Voice service inicia"""
    assert voice_service is not None

@pytest.mark.asyncio
async def test_transcribe_audio():
    """Test transcribir audio real"""
    audio_path = Path("tests/fixtures/test_audio.webm")
    if audio_path.exists():
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
        
        result = await voice_service.transcribe_audio(
            audio_bytes=audio_bytes,
            language_code="es-ES",
            audio_format="audio/webm"
        )
        
        assert result["success"] == True
        assert len(result["text"]) > 0
        assert 0 <= result["confidence"] <= 1
    else:
        pytest.skip("Test audio file not found")

@pytest.mark.asyncio
async def test_api_endpoint_transcribe(client, auth_headers):
    """Test endpoint POST /voice/transcribe"""
    with open("tests/fixtures/test_audio.webm", "rb") as f:
        response = client.post(
            "/voice/transcribe?language=es-ES",
            files={"file": f},
            headers=auth_headers
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "text" in data
```

---

## 🐛 Troubleshooting

### "Google Cloud Speech-to-Text API not available"
- [ ] Activar API en Google Cloud
- [ ] Verificar credenciales JSON
- [ ] Ejecutar: `export GOOGLE_APPLICATION_CREDENTIALS=.secrets/google-speech-key.json`

### "No audio captured from microphone"
- [ ] En Firefox: Ir a about:permissions → Micrófono → Permitir
- [ ] En Chrome: Verificar permisos del sitio
- [ ] HTTPS requerido (localhost ok para desarrollo)

### "Transcription returns empty text"
- [ ] Audio muy silencioso - acercar micrófono
- [ ] Audio no es lo suficientemente claro
- [ ] Verificar idioma correcto (es-ES, en-US, etc)

### "Audio synthesis not working"
- [ ] Habilitar Text-to-Speech API
- [ ] Verificar permisos de service account

---

## 📚 Recursos

- [Google Cloud Speech-to-Text Docs](https://cloud.google.com/speech-to-text/docs)
- [Google Cloud Text-to-Speech Docs](https://cloud.google.com/text-to-speech/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

**Estado:** ⏳ LISTO PARA IMPLEMENTAR  
**Contacto:** [Tu nombre]  
**Última actualización:** 2026-04-17

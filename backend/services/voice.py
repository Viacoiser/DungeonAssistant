import logging
from typing import Optional, Dict
import os
import io
from pydub import AudioSegment

logger = logging.getLogger("services.voice")

# Detectar modo de prueba
MOCK_MODE = os.getenv("VOICE_MOCK_MODE", "false").lower() == "true"

# Intentar importar Google Cloud, pero no fallar si no está disponible
try:
    from google.cloud import speech_v1
    GOOGLE_AVAILABLE = True
except:
    GOOGLE_AVAILABLE = False

class VoiceService:
    """
    Service para transcribir audio a texto usando Google Cloud Speech-to-Text
    Con modo mock para pruebas sin credenciales
    """

    def __init__(self):
        """Inicializar Google Speech client"""
        if MOCK_MODE:
            logger.info("✓ Voice Service en MODO MOCK (prueba)")
            self.speech_client = None
            self.mock_mode = True
        else:
            try:
                self.speech_client = speech_v1.SpeechClient()
                logger.info("✓ Google Cloud Speech-to-Text initialized")
                self.mock_mode = False
            except Exception as e:
                logger.warn(f"⚠ Speech-to-Text API not available: {e}")
                logger.info("💡 Activando MODO MOCK para pruebas")
                self.speech_client = None
                self.mock_mode = True

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
                "alternatives": List[str]
            }
        """

        try:
            # Modo mock para pruebas
            if self.mock_mode:
                return await self._mock_transcribe(audio_bytes, language_code)

            # Modo real con Google Cloud
            if not self.speech_client:
                raise RuntimeError("Speech-to-Text service not available")

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
                sample_rate_hertz=16000,
                enable_automatic_punctuation=True,
                model="default",
                do_not_perform_normalization=False,
                alternative_language_codes=["en-US", "fr-FR"]
            )

            # 3. Transcribir
            logger.info(f"Transcribing {len(audio_bytes)} bytes of audio...")
            response = self.speech_client.recognize(config=config, audio=audio)

            # 4. Procesar resultados
            if response.results:
                best_result = response.results[-1]

                if best_result.alternatives:
                    best_alternative = best_result.alternatives[0]
                    text = best_alternative.transcript
                    confidence = best_alternative.confidence

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

    async def _mock_transcribe(
        self,
        audio_bytes: bytes,
        language_code: str
    ) -> Dict[str, any]:
        """Simulación de transcripción para pruebas"""
        # Respuestas simuladas según el idioma
        mock_responses = {
            "es-ES": [
                "¿Quién es el villano principal?",
                "Cuéntame sobre los personajes de la campaña",
                "¿Qué pasó en la última sesión?",
                "Dame más detalles sobre el mapa",
                "¿Cuáles son los objetivos del grupo?"
            ],
            "en-US": [
                "Who is the main villain?",
                "Tell me about the campaign characters",
                "What happened in the last session?",
                "Give me more details about the map",
                "What are the party's goals?"
            ]
        }

        # Obtener respuesta según idioma
        responses = mock_responses.get(language_code, mock_responses["es-ES"])

        # Usar el tamaño del audio para seleccionar una respuesta pseudo-aleatoria
        idx = len(audio_bytes) % len(responses)
        mock_text = responses[idx]

        logger.info(f"🎭 MOCK MODE: Transcribed: {mock_text}")

        return {
            "success": True,
            "text": mock_text,
            "confidence": 0.95,
            "alternatives": [],
            "is_final": True
        }

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
                name=f"{language_code}-Neural2-A"
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


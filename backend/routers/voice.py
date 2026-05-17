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
    is_mock = voice_service.mock_mode if hasattr(voice_service, 'mock_mode') else False
    return {
        "voice_available": True,
        "status": "mock" if is_mock else "ready",
        "mode": "MOCK (Prueba)" if is_mock else "Google Cloud"
    }

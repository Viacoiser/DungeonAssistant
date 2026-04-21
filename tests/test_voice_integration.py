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

@pytest.mark.asyncio
async def test_voice_status_endpoint(client, auth_headers):
    """Test endpoint GET /voice/status"""
    response = client.get(
        "/voice/status",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert "voice_available" in data
    assert "status" in data

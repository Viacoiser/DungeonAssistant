"""
Router para visión y OCR
"""

from fastapi import APIRouter

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("/digitize")
async def digitize_character_sheet(campaign_id: str, image_url: str):
    """OCR de hoja de personaje física con Gemini Vision"""
    # TODO: Implementar con Gemini Vision
    return {
        "message": "OCR procesado",
        "data": {
            "character_name": None,
            "race": None,
            "class": None,
            "level": None,
            "low_confidence_fields": [],
            "unreadable_fields": []
        }
    }

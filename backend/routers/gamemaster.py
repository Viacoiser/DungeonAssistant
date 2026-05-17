"""
Router para Game Master
"""

from fastapi import APIRouter

router = APIRouter(prefix="/gm", tags=["gamemaster"])


@router.get("/dashboard/{campaign_id}")
async def gm_dashboard(campaign_id: str):
    """Panel de control del GM"""
    # TODO: Implementar
    return {"message": "Dashboard del GM"}


@router.post("/{campaign_id}/npcs/generate")
async def generate_npc_advanced(campaign_id: str, prompt: str):
    """Generar NPC con contexto RAG"""
    # TODO: Implementar
    return {"message": "NPC generado con RAG"}


@router.get("/{campaign_id}/campaign-state")
async def get_campaign_state(campaign_id: str):
    """Obtener estado actual de la campaña"""
    # TODO: Implementar
    return {"campaign_state": {}}

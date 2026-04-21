"""
Router para asistente conversacional RAG
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from middleware.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["assistant"])


def get_supabase():
    from services.supabase import SupabaseClient
    return SupabaseClient()


def get_gemini():
    from services.gemini import GeminiService
    return GeminiService()


class ChatRequest(BaseModel):
    campaign_id: str
    question: str


@router.post("/chat")
async def chat(
    data: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Asistente conversacional RAG con contexto limitado (ahorro de tokens):
    - lore_summary de la campaña
    - notas de las últimas 3 sesiones
    - lista de NPCs conocidos
    """
    try:
        supabase = get_supabase()
        gemini = get_gemini()

        # 1. Datos de la campaña (incluye lore_summary)
        campaign_result = supabase.client.table("campaigns") \
            .select("name, lore_summary") \
            .eq("id", data.campaign_id) \
            .single() \
            .execute()
        campaign = campaign_result.data or {}

        # 2. Últimas sesiones de la campaña
        sessions_result = supabase.client.table("sessions") \
            .select("id") \
            .eq("campaign_id", data.campaign_id) \
            .order("session_number", desc=True) \
            .limit(3) \
            .execute()

        session_ids = [s["id"] for s in (sessions_result.data or [])]

        # 3. Notas de esas últimas sesiones (contexto limitado)
        recent_notes = []
        if session_ids:
            notes_result = supabase.client.table("session_notes") \
                .select("content, created_at") \
                .in_("session_id", session_ids) \
                .order("created_at", desc=True) \
                .limit(6) \
                .execute()
            recent_notes = notes_result.data or []

        # 4. NPCs conocidos
        npcs_result = supabase.client.table("npcs") \
            .select("name, relationship_to_party") \
            .eq("campaign_id", data.campaign_id) \
            .limit(10) \
            .execute()
        npcs = npcs_result.data or []

        # 5. Personajes jugadores (characters) de la campaña
        characters_result = supabase.client.table("characters") \
            .select("name, class, race, level, personality_traits, ideals, bonds, flaws, other_proficiencies, features_traits, backstory") \
            .eq("campaign_id", data.campaign_id) \
            .limit(10) \
            .execute()
        characters = characters_result.data or []

        # 6. Llamar a Gemini con contexto acotado
        context = {
            "campaign_name": campaign.get("name", "la campaña"),
            "campaign_id": data.campaign_id,
            "user_id": current_user["id"],
            "lore_summary": campaign.get("lore_summary", ""),
            "recent_notes": recent_notes,
            "npcs": npcs,
            "characters": characters  # Agregar personajes al contexto
        }

        response = await gemini.chat_assistant(context, data.question)
        
        # response es un dict con: answer, response_time_ms, rag_entities_total
        answer = response.get("answer", "") if isinstance(response, dict) else str(response)
        rag_entities = response.get("rag_entities_total", 0) if isinstance(response, dict) else 0

        return {
            "answer": answer,
            "context_used": {
                "has_lore": bool(campaign.get("lore_summary")),
                "notes_used": len(recent_notes),
                "npcs_known": len(npcs),
                "rag_entities_used": rag_entities
            }
        }

    except Exception as e:
        logger.error(f"❌ Error en asistente: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_campaign_history(
    campaign_id: str,
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """Búsqueda en historial de campaña"""
    return {"results": []}

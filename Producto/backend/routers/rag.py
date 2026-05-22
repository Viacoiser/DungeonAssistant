"""
Phase 3: RAG Endpoints
Exponer funcionalidades RAG mediante API
"""

from fastapi import APIRouter, HTTPException, Depends
from middleware.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/campaigns/{campaign_id}/rag", tags=["RAG"])


def get_supabase():
    from services.supabase import SupabaseClient
    return SupabaseClient()


# ============================================================================
# GET: Obtener contexto de campaña
# ============================================================================

@router.get("/context")
async def get_campaign_context(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener contexto RAG de campaña"""
    
    try:
        from services.rag_manager import RAGManager
        
        supabase = get_supabase()
        
        # Verificar que user es parte de campaña
        member = supabase.client.table("campaign_members") \
            .select("id") \
            .match({"campaign_id": campaign_id, "user_id": current_user["id"]}) \
            .single() \
            .execute()
        
        if not member.data:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta campaña")
        
        # Obtener contexto RAG
        rag = RAGManager(supabase.client)
        rag_data = rag.get_campaign_context(campaign_id)
        
        return {
            "campaign_id": campaign_id,
            "context": rag_data,
            "total_entities": rag_data.get("total_entities", 0)
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error obteniendo contexto RAG: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GET: Listar entidades de tipo específico
# ============================================================================

@router.get("/entities")
async def list_entities(
    campaign_id: str,
    entity_type: str = None,  # NPC, LOCATION, QUEST, ITEM, FACTION, EVENT
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Listar entidades de campaña, opcionalmente filtrado por tipo"""
    
    try:
        supabase = get_supabase()
        
        # Verificar acceso
        member = supabase.client.table("campaign_members") \
            .select("id") \
            .match({"campaign_id": campaign_id, "user_id": current_user["id"]}) \
            .single() \
            .execute()
        
        if not member.data:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta campaña")
        
        # Obtener entidades
        q = supabase.client.table("rag_entities").select("*") \
            .eq("campaign_id", campaign_id) \
            .order("mention_count", desc=True) \
            .limit(limit)
        
        if entity_type:
            q = q.eq("entity_type", entity_type)
        
        result = q.execute()
        
        return {
            "entities": result.data,
            "count": len(result.data),
            "filters": {"campaign_id": campaign_id, "entity_type": entity_type}
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error listando entidades: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GET: Buscar entidades por nombre
# ============================================================================

@router.get("/entities/search/{query}")
async def search_entities(
    campaign_id: str,
    query: str,
    entity_type: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Buscar entidades por nombre (full-text search)"""
    
    try:
        from services.rag_manager import RAGManager
        
        supabase = get_supabase()
        
        # Verificar acceso
        member = supabase.client.table("campaign_members") \
            .select("id") \
            .match({"campaign_id": campaign_id, "user_id": current_user["id"]}) \
            .single() \
            .execute()
        
        if not member.data:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta campaña")
        
        # Buscar
        rag = RAGManager(supabase.client)
        results = rag.search_entities(
            campaign_id=campaign_id,
            query=query,
            entity_type=entity_type
        )
        
        return {"results": results, "query": query}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error buscando entidades: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GET: Obtener evento por sesión
# ============================================================================

@router.get("/events/session/{session_number}")
async def get_event_by_session(
    campaign_id: str,
    session_number: int,
    current_user: dict = Depends(get_current_user)
):
    """Obtener resumen de sesión"""
    
    try:
        supabase = get_supabase()
        
        # Verificar acceso
        member = supabase.client.table("campaign_members") \
            .select("id") \
            .match({"campaign_id": campaign_id, "user_id": current_user["id"]}) \
            .single() \
            .execute()
        
        if not member.data:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta campaña")
        
        # Obtener evento
        result = supabase.client.table("rag_events").select("*") \
            .match({"campaign_id": campaign_id, "session_number": session_number}) \
            .single() \
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Sesión {session_number} no encontrada")
        
        return result.data
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error obteniendo evento: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GET: Token usage analytics - DISABLED
# (Token tracking removed - table token_usage_daily no longer exists)
# ============================================================================

# @router.get("/analytics/tokens")
# async def get_token_analytics(
#     campaign_id: str,
#     days: int = 7,
#     current_user: dict = Depends(get_current_user)
# ):
#     """Obtener analytics de consumo de tokens (últimos N días)"""
#     
#     try:
#         supabase = get_supabase()
#         
#         # Verificar acceso + que sea GM
#         member = supabase.client.table("campaign_members") \
#             .select("role") \
#             .match({"campaign_id": campaign_id, "user_id": current_user["id"]}) \
#             .single() \
#             .execute()
#         
#         if not member.data or member.data.get("role") != "GM":
#             raise HTTPException(status_code=403, detail="Solo GMs pueden ver analytics")
#         
#         # Obtener stats
#         result = supabase.client.table("token_usage_daily").select("*") \
#             .eq("campaign_id", campaign_id) \
#             .limit(days) \
#             .execute()
#         
#         # Calcular totales
#         total_questions = sum(row.get("questions_asked", 0) for row in result.data)
#         total_tokens = sum(row.get("total_tokens", 0) for row in result.data)
#         avg_tokens = total_tokens / total_questions if total_questions > 0 else 0
#         
#         return {
#             "campaign_id": campaign_id,
#             "period_days": days,
#             "daily_stats": result.data,
#             "totals": {
#                 "questions_asked": total_questions,
#                 "total_tokens": total_tokens,
#                 "avg_tokens_per_question": round(avg_tokens, 2),
#                 "estimated_cost_usd": round(total_tokens * 0.00006, 2)
#             }
#         }

# ============================================================================
# POST: Chat assistant con RAG simple
# ============================================================================

@router.post("/chat")
async def chat_with_rag(
    campaign_id: str,
    question: str,
    current_user: dict = Depends(get_current_user)
):
    """Chat con asistente usando contexto RAG"""
    
    try:
        from services.gemini import GeminiService
        
        supabase = get_supabase()
        
        # Verificar acceso
        member = supabase.client.table("campaign_members") \
            .select("id") \
            .match({"campaign_id": campaign_id, "user_id": current_user["id"]}) \
            .single() \
            .execute()
        
        if not member.data:
            raise HTTPException(status_code=403, detail="No tienes acceso a esta campaña")
        
        # Obtener info de campaña
        campaign = supabase.client.table("campaigns").select("name") \
            .eq("id", campaign_id) \
            .single() \
            .execute()
        
        if not campaign.data:
            raise HTTPException(status_code=404, detail="Campaña no encontrada")
        
        # Chat con Gemini usando RAG simple
        gemini = GeminiService()
        context = {
            "campaign_id": campaign_id,
            "campaign_name": campaign.data.get("name", "Mi Campaña"),
            "user_id": current_user["id"]
        }
        
        response = await gemini.chat_assistant(context, question)
        
        return response
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error en chat RAG: {e}")
        raise HTTPException(status_code=500, detail=str(e))

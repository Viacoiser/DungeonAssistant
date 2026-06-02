"""
Router para sesiones de juego
"""

from fastapi import APIRouter, HTTPException, Depends
from middleware.auth import get_current_user
import logging
from models.schemas import SessionCreate, NoteCreate, NoteVisibility

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions"])


def get_supabase():
    from services.supabase import SupabaseClient
    return SupabaseClient()


def get_gemini():
    from services.gemini import GeminiService
    return GeminiService()

# ============================================================================
# Crear sesión
# ============================================================================

@router.post("")
async def create_session(
    data: SessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Crear nueva sesión para una campaña"""
    try:
        supabase = get_supabase()

        # Verificar que el usuario sea GM de la campaña
        campaign_members = supabase.client.table("campaign_members").select(
            "role"
        ).eq(
            "campaign_id", data.campaign_id
        ).eq(
            "user_id", current_user["id"]
        ).execute()

        if not campaign_members.data or campaign_members.data[0]["role"] != "GM":
            raise HTTPException(
                status_code=403,
                detail="Solo el GM de la campaña puede crear sesiones"
            )

        result = supabase.admin_client.table("sessions").insert({
            "campaign_id": data.campaign_id,
            "session_number": data.session_number,
            "title": data.title,
            "is_active": True
        }).execute()

        session = result.data[0] if result.data else None
        if not session:
            raise HTTPException(status_code=500, detail="Error creando sesión")

        logger.info(f"✅ Sesión {data.session_number} creada para campaña {data.campaign_id}")
        return session

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creando sesión: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Listar sesiones de una campaña
# ============================================================================

@router.get("/campaign/{campaign_id}")
async def list_sessions(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Listar sesiones de una campaña"""
    try:
        supabase = get_supabase()
        result = supabase.client.table("sessions") \
            .select("*") \
            .eq("campaign_id", campaign_id) \
            .order("session_number", desc=False) \
            .execute()

        return result.data or []

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error listando sesiones: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Iniciar sesión
# ============================================================================

@router.post("/{session_id}/start")
async def start_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Iniciar sesión (marcarla como activa)"""
    try:
        supabase = get_supabase()
        from datetime import datetime, timezone

        supabase.admin_client.table("sessions").update({
            "is_active": True,
            "started_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", session_id).execute()

        logger.info(f"✅ Sesión {session_id} iniciada")
        return {"message": "Sesión iniciada", "session_id": session_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error iniciando sesión: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Terminar sesión + evaluar crónica por lotes
# ============================================================================

@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Terminar sesión. Si hay 3+ sesiones antiguas sin crónica, genera una crónica por lotes."""
    try:
        supabase = get_supabase()
        from datetime import datetime, timezone
        import json

        # 1. Obtener datos de la sesión actual
        session_result = supabase.admin_client.table("sessions") \
            .select("session_number, campaign_id, title") \
            .eq("id", session_id) \
            .single() \
            .execute()

        session_data = session_result.data
        if not session_data:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")

        session_number = session_data["session_number"]
        campaign_id = session_data["campaign_id"]

        # 2. Marcar sesión como inactiva (sin resumen individual)
        supabase.admin_client.table("sessions").update({
            "is_active": False,
            "ended_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", session_id).execute()

        logger.info(f"✅ Sesión {session_id} (#{session_number}) terminada")

        # 3. Evaluar si toca generar crónica por lotes
        chronicle_generated = None
        if session_number >= 4:
            try:
                chronicle_generated = await _maybe_generate_chronicle(
                    supabase, campaign_id, session_number
                )
            except Exception as e:
                logger.error(f"⚠️ Error evaluando crónica (no bloquea cierre): {e}")

        response = {"message": "Sesión terminada", "session_id": session_id}
        if chronicle_generated:
            response["chronicle"] = chronicle_generated

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error terminando sesión: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _maybe_generate_chronicle(supabase, campaign_id: str, current_session_number: int):
    """
    Evalúa si hay 3+ sesiones antiguas sin crónica y genera una si corresponde.
    
    Antiguas = session_number <= (current - 3)
    Sin crónica = no tienen rag_events que las cubra
    """
    import json

    threshold = current_session_number - 3  # Sesiones 1..threshold son "antiguas"

    # Obtener todas las sesiones antiguas de la campaña
    old_sessions_result = supabase.admin_client.table("sessions") \
        .select("id, session_number, title") \
        .eq("campaign_id", campaign_id) \
        .lte("session_number", threshold) \
        .order("session_number", desc=False) \
        .execute()

    old_sessions = old_sessions_result.data or []
    if not old_sessions:
        return None

    # Obtener session_numbers ya cubiertos por rag_events
    try:
        existing_chronicles = supabase.admin_client.table("rag_events") \
            .select("session_number") \
            .eq("campaign_id", campaign_id) \
            .execute()
        covered_numbers = set()
        for entry in (existing_chronicles.data or []):
            sn = entry.get("session_number", 0)
            # Cada crónica cubre 3 sesiones: sn, sn+1, sn+2
            covered_numbers.update([sn, sn + 1, sn + 2])
    except Exception:
        covered_numbers = set()

    # Filtrar sesiones no cubiertas
    uncovered = [s for s in old_sessions if s["session_number"] not in covered_numbers]

    if len(uncovered) < 3:
        logger.debug(f"Solo {len(uncovered)} sesiones sin crónica, necesitamos 3. Esperando.")
        return None

    # Tomar las 3 más antiguas sin cobertura
    batch = uncovered[:3]
    logger.info(f"📜 Generando crónica para sesiones {[s['session_number'] for s in batch]}")

    # Obtener notas de esas sesiones
    batch_ids = [s["id"] for s in batch]
    notes_result = supabase.admin_client.table("session_notes") \
        .select("content, session_id") \
        .in_("session_id", batch_ids) \
        .order("created_at", desc=False) \
        .execute()

    # Agrupar notas por session_id
    notes_by_session = {}
    for note in (notes_result.data or []):
        sid = note["session_id"]
        if sid not in notes_by_session:
            notes_by_session[sid] = []
        notes_by_session[sid].append(note)

    # Construir sessions_data para Gemini
    sessions_data = []
    for s in batch:
        sessions_data.append({
            "session_number": s["session_number"],
            "title": s.get("title", f"Sesión {s['session_number']}"),
            "notes": notes_by_session.get(s["id"], [])
        })

    # Obtener nombre de la campaña
    campaign_result = supabase.admin_client.table("campaigns") \
        .select("name") \
        .eq("id", campaign_id) \
        .single() \
        .execute()
    campaign_name = campaign_result.data.get("name", "la campaña") if campaign_result.data else "la campaña"

    # Generar crónica con Gemini
    gemini = get_gemini()
    chronicle = await gemini.generate_batch_chronicle(campaign_name, sessions_data)

    # Preparar datos para rag_events
    first_session_number = batch[0]["session_number"]
    chronicle_title = chronicle.get("chronicle_title", f"Sesiones {first_session_number}-{batch[-1]['session_number']}")

    # Extraer entidades involucradas
    involved = (
        chronicle.get("npcs_encountered", []) +
        chronicle.get("items_obtained", []) +
        chronicle.get("locations_visited", [])
    )

    # Upsert en rag_events (conflict en campaign_id + session_number)
    supabase.admin_client.table("rag_events").upsert({
        "campaign_id": campaign_id,
        "session_number": first_session_number,
        "event_title": chronicle_title,
        "event_summary": json.dumps(chronicle, ensure_ascii=False),
        "involved_entities": involved
    }, on_conflict="campaign_id,session_number").execute()

    logger.info(f"✅ Crónica guardada en rag_events: {chronicle_title}")
    return chronicle


# ============================================================================
# Obtener crónicas de una campaña (solo lectura)
# ============================================================================

@router.get("/chronicles/{campaign_id}")
async def get_chronicles(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener todas las crónicas generadas para una campaña. Solo lectura."""
    try:
        supabase = get_supabase()
        import json

        result = supabase.admin_client.table("rag_events") \
            .select("id, session_number, event_title, event_summary, involved_entities, created_at") \
            .eq("campaign_id", campaign_id) \
            .order("session_number", desc=False) \
            .execute()

        chronicles = []
        for entry in (result.data or []):
            # Parsear event_summary de JSON string a dict
            summary_raw = entry.get("event_summary", "{}")
            try:
                summary = json.loads(summary_raw) if isinstance(summary_raw, str) else summary_raw
            except (json.JSONDecodeError, TypeError):
                summary = {"narrative_summary": summary_raw}

            chronicles.append({
                "id": entry["id"],
                "session_number": entry["session_number"],
                "event_title": entry.get("event_title", ""),
                "chronicle": summary,
                "involved_entities": entry.get("involved_entities", []),
                "created_at": entry.get("created_at", "")
            })

        return chronicles

    except Exception as e:
        logger.error(f"❌ Error obteniendo crónicas: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============================================================================
# Agregar nota con análisis de IA (Background Task)
# ============================================================================

async def _analyze_and_update_note_task(
    note_id: str,
    session_id: str,
    content: str,
    user_id: str,
    username: str
):
    """Tarea de background para análisis híbrido y población de RAG"""

    try:
        supabase = get_supabase()
        gemini = get_gemini()
        from services.dnd5e_search import get_dnd5e_searcher
        searcher = get_dnd5e_searcher()
        
        # 1. Obtener contexto (Necesitamos campaign_id)
        session_res = supabase.admin_client.table("sessions") \
            .select("campaign_id") \
            .eq("id", session_id) \
            .single() \
            .execute()
        
        if not session_res.data:
            return
            
        campaign_id = session_res.data["campaign_id"]
        
        # 2. Ejecutar tareas de contexto en paralelo
        async def _get_campaign():
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                lambda: supabase.admin_client.table("campaigns")
                    .select("name, lore_summary")
                    .eq("id", campaign_id)
                    .single()
                    .execute()
            )
        
        async def _get_user_char():
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                lambda: supabase.admin_client.table("characters")
                    .select("id, name, race, class, level, background")
                    .eq("campaign_id", campaign_id)
                    .eq("player_id", user_id)
                    .execute()
            )
        
        async def _get_party():
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                lambda: supabase.admin_client.table("characters")
                    .select("name, race, class")
                    .eq("campaign_id", campaign_id)
                    .neq("player_id", user_id)
                    .execute()
            )
            
        campaign, user_char, party = await asyncio.gather(
            _get_campaign(),
            _get_user_char(),
            _get_party()
        )
        
        # 3. Preparar contexto
        user_character_data = user_char.data[0] if user_char.data else None
        context = {
            "campaign_id": campaign_id,
            "campaign_name": campaign.data.get("name", "") if campaign.data else "",
            "player_name": username,
            "character_name": user_character_data.get("name", "") if user_character_data else "",
            "character_race": user_character_data.get("race", "") if user_character_data else "",
            "character_class": user_character_data.get("class", "") if user_character_data else "",
            "party_members": party.data or []
        }
        
        # 4. Análisis local y Gemini en paralelo
        async def _local_analysis():
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, searcher.analyze_note, content)
            
        local_analysis, gemini_analysis = await asyncio.gather(
            _local_analysis(),
            gemini.analyze_session_note(content, context)
        )
        
        # 5. Combinar resultados
        local_items = local_analysis.get("detected_items", [])
        local_npcs = local_analysis.get("detected_npcs", [])
        gemini_items = gemini_analysis.get("detected_items", [])
        gemini_npcs = gemini_analysis.get("detected_npcs", [])
        
        final_items = local_items if local_items else gemini_items
        final_npcs = gemini_npcs if gemini_npcs else local_npcs
        
        # 6. Actualizar nota en Supabase
        supabase.admin_client.table("session_notes").update({
            "detected_items": final_items,
            "detected_npcs": final_npcs
        }).eq("id", note_id).execute()
        
        # 7. RAG Auto-populate
        _populate_rag_logic(campaign_id, final_items, final_npcs)
        
        logger.info(f"✅ Background analysis complete for note {note_id}")
        
    except Exception as e:
        logger.error(f"❌ Error in background analysis task: {e}")

def _populate_rag_logic(campaign_id, final_items, final_npcs):
    """Lógica interna para poblar RAG (usada en background)"""

    try:
        supabase = get_supabase()
        # Items
        for item in final_items:
            try:
                item_name = item.get("name") or item.get("item_name", "Unknown Item") if isinstance(item, dict) else str(item)
                result = supabase.admin_client.table("rag_entities").select("id, mention_count").match({
                    "campaign_id": campaign_id,
                    "entity_type": "ITEM",
                    "entity_name": item_name
                }).execute()
                
                if result.data:
                    entity_id = result.data[0]["id"]
                    current_count = result.data[0]["mention_count"]
                    supabase.admin_client.table("rag_entities").update({
                        "mention_count": current_count + 1
                    }).eq("id", entity_id).execute()
                else:
                    supabase.admin_client.table("rag_entities").insert({
                        "campaign_id": campaign_id,
                        "entity_type": "ITEM",
                        "entity_name": item_name,
                        "mention_count": 1
                    }).execute()
            except Exception as e:
                logger.error(f"❌ Error inserting/updating RAG item entity {item}: {e}")
            
        # NPCs
        for npc in final_npcs:
            try:
                npc_name = npc.get("name", "Unknown NPC") if isinstance(npc, dict) else str(npc)
                result = supabase.admin_client.table("rag_entities").select("id, mention_count, attributes").match({
                    "campaign_id": campaign_id,
                    "entity_type": "NPC",
                    "entity_name": npc_name
                }).execute()
                
                if result.data:
                    entity_id = result.data[0]["id"]
                    current_count = result.data[0]["mention_count"]
                    current_attrs = result.data[0].get("attributes", {}) or {}
                    updated_attrs = current_attrs.copy()
                    if isinstance(npc, dict):
                        if npc.get("description"): updated_attrs["description"] = npc["description"]
                        if npc.get("relationship"): updated_attrs["relationship"] = npc["relationship"]
                    
                    supabase.admin_client.table("rag_entities").update({
                        "mention_count": current_count + 1,
                        "attributes": updated_attrs
                    }).eq("id", entity_id).execute()
                else:
                    attrs = {}
                    if isinstance(npc, dict):
                        if npc.get("description"): attrs["description"] = npc["description"]
                        if npc.get("relationship"): attrs["relationship"] = npc["relationship"]
                    supabase.admin_client.table("rag_entities").insert({
                        "campaign_id": campaign_id,
                        "entity_type": "NPC",
                        "entity_name": npc_name,
                        "description": attrs.get("description"),
                        "attributes": attrs,
                        "mention_count": 1
                    }).execute()
            except Exception as e:
                logger.error(f"❌ Error inserting/updating RAG NPC entity {npc}: {e}")
    except Exception as e:
        logger.error(f"❌ Error in RAG logic: {e}")

@router.post("/{session_id}/notes")
async def add_session_note(
    session_id: str,
    data: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Agregar nota a sesión (Guardado instantáneo + Análisis asincrónico)"""
    try:
        supabase = get_supabase()
        
        # Verificar que la sesión existe y obtener campaña
        session = supabase.client.table("sessions").select("campaign_id").eq("id", session_id).execute()
        if not session.data:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        campaign_id = session.data[0]["campaign_id"]
        
        # Verificar que el usuario sea miembro de la campaña
        campaign_members = supabase.client.table("campaign_members").select(
            "id"
        ).eq(
            "campaign_id", campaign_id
        ).eq(
            "user_id", current_user["id"]
        ).execute()

        if not campaign_members.data:
            raise HTTPException(status_code=403, detail="No eres miembro de esta campaña")

        # 1. Guardar la nota inmediatamente (usando admin_client)
        note_result = supabase.admin_client.table("session_notes").insert({
            "session_id": session_id,
            "author_id": current_user["id"],
            "content": data.content,
            "detected_items": [],
            "detected_npcs": []
        }).execute()

        if not note_result.data:
            raise HTTPException(status_code=500, detail="Error al guardar la nota")
            
        note = note_result.data[0]
        
        # 2. Lanzar análisis en segundo plano (No bloquea la respuesta)
        asyncio.create_task(
            _analyze_and_update_note_task(
                note["id"], 
                session_id, 
                data.content, 
                current_user["id"],
                current_user.get("username", "Jugador")
            )
        )

        return {
            "note": note,
            "status": "pending_analysis",
            "message": "Nota guardada instantáneamente. El análisis se completará en segundo plano."
        }


    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error guardando nota: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Listar notas de una sesión
# ============================================================================

@router.get("/{session_id}/notes")
async def get_session_notes(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Listar notas de sesión"""
    try:
        supabase = get_supabase()
        result = supabase.admin_client.table("session_notes") \
            .select("*") \
            .eq("session_id", session_id) \
            .eq("author_id", current_user["id"]) \
            .order("created_at", desc=False) \
            .execute()

        return {"notes": result.data or []}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error obteniendo notas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Editar nota
# ============================================================================

@router.patch("/notes/{note_id}")
async def update_session_note(
    note_id: str,
    data: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Editar el contenido de una nota y re-analizarla con Gemini"""
    try:
        supabase = get_supabase()
        gemini = get_gemini()

        # 1. Obtener la nota actual para saber a qué sesión pertenece
        note = supabase.admin_client.table("session_notes") \
            .select("session_id, author_id") \
            .eq("id", note_id) \
            .single() \
            .execute()
        
        if not note.data:
            raise HTTPException(status_code=404, detail="Nota no encontrada")
            
        if note.data["author_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="No tienes permisos para editar esta nota")
        
        session_id = note.data["session_id"]
        
        # 2. Obtener sesión y campaña
        session = supabase.admin_client.table("sessions") \
            .select("campaign_id") \
            .eq("id", session_id) \
            .single() \
            .execute()
        
        if not session.data:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
        campaign_id = session.data["campaign_id"]
        
        # 3. Obtener información de campaña
        campaign = supabase.client.table("campaigns") \
            .select("name, lore_summary") \
            .eq("id", campaign_id) \
            .single() \
            .execute()
        
        campaign_name = campaign.data.get("name", "") if campaign.data else ""
        
        # 4. Obtener personaje del usuario en esta campaña
        user_character_response = supabase.client.table("characters") \
            .select("id, name, race, class, level, background") \
            .eq("campaign_id", campaign_id) \
            .eq("player_id", current_user["id"]) \
            .execute()
        
        user_character_data = user_character_response.data[0] if user_character_response.data else None
        
        character_name = ""
        character_race = ""
        character_class = ""
        
        if user_character_data:
            character_name = user_character_data.get("name", "")
            character_race = user_character_data.get("race", "")
            character_class = user_character_data.get("class", "")
        
        # 5. Obtener otros personajes de la campaña (party)
        party_characters = supabase.client.table("characters") \
            .select("name, race, class") \
            .eq("campaign_id", campaign_id) \
            .neq("player_id", current_user["id"]) \
            .execute()
        
        party_members = party_characters.data or []
        
        # 6. Construir contexto para Gemini
        context = {
            "campaign_name": campaign_name,
            "player_name": current_user.get("username", "Jugador"),
            "character_name": character_name,
            "character_race": character_race,
            "character_class": character_class,
            "party_members": party_members
        }

        # Analizar nota con Gemini (ahora con contexto)
        analysis = await gemini.analyze_session_note(data.content, context)
        detected_items = analysis.get("detected_items", [])
        detected_npcs = analysis.get("detected_npcs", [])

        result = supabase.admin_client.table("session_notes").update({
            "content": data.content,
            "detected_items": detected_items,
            "detected_npcs": detected_npcs
        }).eq("id", note_id).execute()

        return {
            "note": result.data[0] if result.data else {},
            "analysis": {
                "detected_items": detected_items,
                "detected_npcs": detected_npcs,
                "items_count": len(detected_items),
                "npcs_count": len(detected_npcs)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error editando nota: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Cambiar privacidad de nota
# ============================================================================

@router.patch("/notes/{note_id}/visibility")
async def toggle_note_visibility(
    note_id: str,
    data: NoteVisibility,
    current_user: dict = Depends(get_current_user)
):
    """Cambiar privacidad de una nota (solo el autor puede hacerlo)"""
    try:
        supabase = get_supabase()
        
        # Verificar que sea el autor de la nota
        note = supabase.admin_client.table("session_notes") \
            .select("author_id, is_public") \
            .eq("id", note_id) \
            .single() \
            .execute()
        
        if not note.data or note.data["author_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Solo el autor puede cambiar la privacidad")
        
        # Actualizar privacidad
        result = supabase.admin_client.table("session_notes").update({
            "is_public": data.is_public
        }).eq("id", note_id).execute()
        
        updated_note = result.data[0] if result.data else {}
        status_text = "pública" if data.is_public else "privada"
        
        logger.info(f"✅ Nota {note_id} ahora es {status_text}")
        return {
            "message": f"Nota ahora es {status_text}",
            "note": updated_note
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error cambiando privacidad: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Eliminar nota
# ============================================================================

@router.delete("/notes/{note_id}")
async def delete_session_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Eliminar una nota individual"""
    try:
        supabase = get_supabase()
        
        # Obtener nota
        note = supabase.admin_client.table("session_notes").select("author_id, session_id").eq("id", note_id).execute()
        if not note.data:
            raise HTTPException(status_code=404, detail="Nota no encontrada")
            
        note_data = note.data[0]
        
        # Verificar permisos (es el autor estricto, ni siquiera el GM puede)
        is_allowed = note_data["author_id"] == current_user["id"]
                    
        if not is_allowed:
            raise HTTPException(status_code=403, detail="No tienes permisos para eliminar esta nota")
            
        supabase.admin_client.table("session_notes").delete().eq("id", note_id).execute()
        return {"message": "Nota eliminada"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error eliminando nota: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Eliminar sesión
# ============================================================================

@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Eliminar sesión y todas sus notas"""
    try:
        supabase = get_supabase()

        # Eliminar notas primero (FK constraint)
        supabase.admin_client.table("session_notes") \
            .delete() \
            .eq("session_id", session_id) \
            .execute()

        # Eliminar la sesión
        supabase.admin_client.table("sessions") \
            .delete() \
            .eq("id", session_id) \
            .execute()

        logger.info(f"✅ Sesión {session_id} eliminada")
        return {"message": "Sesión eliminada correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error eliminando sesión: {e}")
        raise HTTPException(status_code=500, detail=str(e))

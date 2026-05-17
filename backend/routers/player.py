"""
Router para gestión de personajes y jugadores
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends, Body
from datetime import datetime
import uuid

from models.schemas import CharacterCreate, CharacterResponse, CharacterStatusUpdate, CharacterUpdate
from middleware.auth import get_current_user
from services.supabase import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/characters", tags=["characters"])


@router.post("", response_model=dict)
async def create_character(
    data: CharacterCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear nuevo personaje (independiente o en una campaña específica)
    
    Args:
        data: Datos del personaje (CharacterCreate)
        current_user: Usuario autenticado
        
    Returns:
        Datos del personaje creado
    """
    try:
        supabase = get_supabase()
        
        # Si se proporciona campaign_id, verificar que el usuario sea miembro
        if data.campaign_id:
            campaign_members = supabase.client.table("campaign_members").select(
                "*"
            ).eq(
                "campaign_id", data.campaign_id
            ).eq(
                "user_id", current_user["id"]
            ).execute()
            
            if not campaign_members.data:
                logger.warning(f"User {current_user['id']} not in campaign {data.campaign_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para crear personajes en esta campaña"
                )
        
        # Generar ID del personaje
        character_id = str(uuid.uuid4())
        
        # Preparar datos para Supabase
        character_data = {
            "id": character_id,
            "campaign_id": data.campaign_id,
            "player_id": current_user["id"],

            # ── Identificación ───────────────────────────────────────────────────
            "name": data.name,
            "race": data.race,
            "class": data.class_,
            "level": data.level,
            "background": data.background or "",
            "alignment": data.alignment or "",
            "experience_points": data.experience_points,
            "player_name": data.player_name or "",

            # ── Stats base ───────────────────────────────────────────────────────
            "stats": data.stats.dict() if hasattr(data.stats, "dict") else data.stats,

            # ── Combate ──────────────────────────────────────────────────────────
            "hp_max": data.hp_max,
            "hp_current": data.hp_current,
            "hp_temporary": data.hp_temporary,
            "armor_class": data.armor_class,
            "initiative": data.initiative,
            "speed": data.speed,
            "proficiency_bonus": data.proficiency_bonus,
            "hit_dice": data.hit_dice,
            "hit_dice_used": data.hit_dice_used,
            "passive_perception": data.passive_perception,
            "inspiration": data.inspiration,

            # ── Tiradas de salvación y habilidades ───────────────────────────────
            "saving_throws": data.saving_throws,
            "skills": data.skills,

            # ── Death saves ──────────────────────────────────────────────────────
            "death_saves": data.death_saves,

            # ── Ataques ──────────────────────────────────────────────────────────
            "attacks": data.attacks,

            # ── Equipo e inventario ──────────────────────────────────────────────
            "equipment": data.equipment,
            "currency": data.currency,
            "treasure": data.treasure or "",

            # ── Spellcasting ─────────────────────────────────────────────────────
            "spellcasting": data.spellcasting,

            # ── Personalidad ─────────────────────────────────────────────────────
            "personality_traits": data.personality_traits,
            "ideals": data.ideals,
            "bonds": data.bonds,
            "flaws": data.flaws,

            # ── Rasgos ───────────────────────────────────────────────────────────
            "features_traits": data.features_traits,
            "other_proficiencies": data.other_proficiencies,
            "additional_features": data.additional_features,

            # ── Trasfondo ────────────────────────────────────────────────────────
            "backstory": data.backstory,
            "allies_organizations": data.allies_organizations,

            # ── Apariencia ───────────────────────────────────────────────────────
            "age": data.age or "",
            "height": data.height or "",
            "weight": data.weight or "",
            "eyes": data.eyes or "",
            "skin": data.skin or "",
            "hair": data.hair or "",
            "appearance": data.appearance or "",

            # ── Imagen / estado ──────────────────────────────────────────────────
            "image_url": data.image_url,
            "is_alive": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        
        # Insertar en Supabase
        try:
            result = supabase.client.table("characters").insert(
                character_data
            ).execute()
            
            if not result.data:
                logger.error(f"Supabase response error: {result}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al crear el personaje en la base de datos"
                )
        except Exception as db_error:
            logger.error(f"❌ Database error inserting character: {str(db_error)}")
            logger.error(f"Character data attempted: {character_data}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error de base de datos: {str(db_error)}"
            )
        
        logger.info(f"✅ Character created: {character_id} for user {current_user['id']}")
        
        return {
            "id": character_id,
            "name": data.name,
            "race": data.race,
            "class": data.class_,
            "level": data.level,
            "hp_max": data.hp_max,
            "hp_current": data.hp_current,
            "message": "Personaje creado exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating character: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el personaje"
        )


@router.get("", response_model=dict)
async def list_characters(
    campaign_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Listar personajes (de una campaña o todos los del usuario)
    
    Args:
        campaign_id: ID de la campaña (opcional)
        current_user: Usuario autenticado
        
    Returns:
        Lista de personajes
    """
    try:
        supabase = get_supabase()
        
        query = supabase.client.table("characters").select("*")
        
        if campaign_id and campaign_id.strip():
            # Verificar que el usuario sea miembro de la campaña
            campaign_members = supabase.client.table("campaign_members").select(
                "*"
            ).eq(
                "campaign_id", campaign_id
            ).eq(
                "user_id", current_user["id"]
            ).execute()
            
            if not campaign_members.data:
                logger.warning(f"User {current_user['id']} not in campaign {campaign_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para ver esta campaña"
                )
            query = query.eq("campaign_id", campaign_id)
        else:
            # Si no hay campaign_id, mostrar todos los personajes del usuario
            query = query.eq("player_id", current_user["id"])
            
        # Obtener personajes
        characters = query.execute()
        
        logger.info(f"✅ Retrieved {len(characters.data)} characters")
        
        return {
            "characters": characters.data or [],
            "count": len(characters.data) if characters.data else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error listing characters: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener personajes"
        )


@router.get("/{character_id}")
async def get_character(
    character_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener detalle de personaje"""
    try:
        supabase = get_supabase()
        
        # Obtener personaje
        character = supabase.client.table("characters").select(
            "*"
        ).eq(
            "id", character_id
        ).single().execute()
        
        if not character.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Personaje no encontrado"
            )
        
        # Verificar que el usuario sea miembro de la campaña del personaje
        campaign_members = supabase.client.table("campaign_members").select(
            "*"
        ).eq(
            "campaign_id", character.data["campaign_id"]
        ).eq(
            "user_id", current_user["id"]
        ).execute()
        
        if not campaign_members.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este personaje"
            )
        
        return character.data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting character: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener personaje"
        )


@router.put("/{character_id}")
async def update_character(
    character_id: str,
    data: CharacterUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Actualizar personaje"""
    try:
        supabase = get_supabase()
        
        # 1. Obtener personaje existente
        char_res = supabase.client.table("characters").select("*").eq("id", character_id).single().execute()
        
        if not char_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Personaje no encontrado"
            )
        
        character = char_res.data
        
        # 2. Verificar permisos (propietario o GM de la campaña)
        is_owner = character["player_id"] == current_user["id"]
        is_gm = False
        
        if character.get("campaign_id"):
            member_res = supabase.client.table("campaign_members").select("role").eq("campaign_id", character["campaign_id"]).eq("user_id", current_user["id"]).execute()
            if member_res.data and member_res.data[0]["role"] == "GM":
                is_gm = True
        
        if not (is_owner or is_gm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para actualizar este personaje"
            )
        
        # 3. Preparar datos para actualización
        update_data = data.dict(exclude_unset=True)
        
        # Log incoming keys for debugging
        logger.info(f"Incoming update keys for {character_id}: {list(update_data.keys())}")
        
        # Manejar el alias de "class" -> "class" en la BD
        if "class_" in update_data:
            update_data["class"] = update_data.pop("class_")
            
        # Asegurarse de que no estamos intentando actualizar campos protegidos
        for field in ["id", "player_id", "campaign_id", "created_at"]:
            if field in update_data:
                logger.warning(f"Removing protected field '{field}' from update payload for {character_id}")
                update_data.pop(field, None)
            
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # 4. Ejecutar actualización
        try:
            result = supabase.client.table("characters").update(
                update_data
            ).eq(
                "id", character_id
            ).execute()
        except Exception as db_err:
            logger.error(f"❌ Database error updating character {character_id}: {str(db_err)}")
            # Log full data to see what might be wrong (be careful with sensitive data in production, but this is dev)
            logger.debug(f"Payload attempted: {update_data}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error de base de datos al actualizar: {str(db_err)}"
            )
        
        if not result.data:
            logger.error(f"❌ Supabase returned no data after update for {character_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar personaje: no se recibieron datos de vuelta"
            )
        
        logger.info(f"✅ Character updated: {character_id} by {current_user['id']}")
        return {"message": "Personaje actualizado exitosamente", "data": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unhandled error updating character: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al actualizar personaje: {str(e)}"
        )


@router.put("/{character_id}/status")
async def update_character_status(
    character_id: str,
    data: CharacterStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualizar status del personaje (vivo/muerto) y crear registro en histórico
    Solo GM puede hacer esto
    """
    try:
        supabase = get_supabase()
        
        # Obtener personaje
        character = supabase.client.table("characters").select(
            "*"
        ).eq(
            "id", character_id
        ).single().execute()
        
        if not character.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Personaje no encontrado"
            )
        
        # Verificar que el usuario es GM de la campaña
        campaign_members = supabase.client.table("campaign_members").select(
            "*"
        ).eq(
            "campaign_id", character.data["campaign_id"]
        ).eq(
            "user_id", current_user["id"]
        ).eq(
            "role", "GM"
        ).execute()
        
        if not campaign_members.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el GM puede cambiar el estado del personaje"
            )
        
        # Determinar el tipo de cambio
        old_status = character.data.get("is_alive", True)
        new_status = data.is_alive
        change_type = "DIED" if not new_status and old_status else "REVIVED" if new_status and not old_status else "STATUS_CHANGE"
        
        # Actualizar personaje
        update_data = {
            "is_alive": new_status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.client.table("characters").update(
            update_data
        ).eq(
            "id", character_id
        ).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar personaje"
            )
        
        # Crear registro en histórico
        history_entry = {
            "character_id": character_id,
            "changed_by": current_user["id"],
            "change_type": change_type,
            "old_value": str(old_status),
            "new_value": str(new_status),
            "description": f"Personaje {'muerto' if not new_status else 'revivido'}"
        }
        
        supabase.client.table("character_history").insert(
            history_entry
        ).execute()
        
        logger.info(f"✅ Character status updated: {character_id} - {change_type}")
        
        return {
            "message": f"Personaje {'marcado como muerto' if not new_status else 'revivido'}",
            "is_alive": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating character status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar estado del personaje"
        )


@router.get("/{character_id}/history")
async def get_character_history(
    character_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener histórico de cambios del personaje"""
    try:
        supabase = get_supabase()
        
        # Obtener personaje
        character = supabase.client.table("characters").select(
            "*"
        ).eq(
            "id", character_id
        ).single().execute()
        
        if not character.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Personaje no encontrado"
            )
        
        # Verificar permisos
        campaign_members = supabase.client.table("campaign_members").select(
            "*"
        ).eq(
            "campaign_id", character.data["campaign_id"]
        ).eq(
            "user_id", current_user["id"]
        ).execute()
        
        if not campaign_members.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este personaje"
            )
        
        # Obtener histórico
        history = supabase.client.table("character_history").select(
            "*"
        ).eq(
            "character_id", character_id
        ).order(
            "created_at", desc=True
        ).execute()
        
        return {
            "character_id": character_id,
            "history": history.data or []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting character history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener histórico"
        )


@router.post("/{character_id}/assign-campaign")
async def assign_character_to_campaign(
    character_id: str,
    campaign_id: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """
    Asignar un personaje existente a una campaña
    (El usuario debe ser miembro de la campaña)
    """
    try:
        supabase = get_supabase()
        
        # Obtener personaje
        character = supabase.client.table("characters").select(
            "*"
        ).eq(
            "id", character_id
        ).single().execute()
        
        if not character.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Personaje no encontrado"
            )
        
        # Verificar que el usuario es el propietario del personaje
        if character.data["player_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes asignar tus propios personajes"
            )
        
        # Verificar que el usuario sea miembro de la campaña
        campaign_members = supabase.client.table("campaign_members").select(
            "*"
        ).eq(
            "campaign_id", campaign_id
        ).eq(
            "user_id", current_user["id"]
        ).execute()
        
        if not campaign_members.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No eres miembro de esta campaña"
            )
        
        # Verificar que el personaje no esté ya en una campaña
        if character.data["campaign_id"] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este personaje ya pertenece a una campaña"
            )
        
        # Asignar personaje a campaña
        result = supabase.client.table("characters").update({
            "campaign_id": campaign_id,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", character_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al asignar el personaje a la campaña"
            )
        
        logger.info(f"✅ Character {character_id} assigned to campaign {campaign_id}")
        
        return {
            "message": "Personaje asignado a la campaña exitosamente",
            "character_id": character_id,
            "campaign_id": campaign_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error assigning character to campaign: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al asignar personaje a campaña"
        )


@router.post("/{character_id}/join-campaign-by-code")
async def join_campaign_by_code(
    character_id: str,
    invite_code: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """
    Unir un personaje a una campaña usando código de invitación
    
    Args:
        character_id: ID del personaje
        invite_code: Código de invitación de la campaña
        current_user: Usuario autenticado
    """
    try:
        supabase = get_supabase()
        
        if not invite_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código de invitación requerido"
            )
        
        # Obtener personaje
        character = supabase.client.table("characters").select(
            "*"
        ).eq(
            "id", character_id
        ).single().execute()
        
        if not character.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Personaje no encontrado"
            )
        
        # Verificar que el usuario es propietario del personaje
        if character.data["player_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes unir tus propios personajes"
            )
        
        # Buscar campaña por código de invitación
        campaign_result = supabase.client.table("campaigns").select(
            "*"
        ).eq(
            "invitation_code", invite_code.upper()
        ).execute()
        
        if not campaign_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Código de invitación inválido"
            )
        
        campaign = campaign_result.data[0]
        campaign_id = campaign["id"]
        
        # Verificar que el personaje no esté ya en una campaña
        if character.data["campaign_id"] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este personaje ya pertenece a una campaña"
            )
        
        # Asignar personaje a campaña
        result = supabase.client.table("characters").update({
            "campaign_id": campaign_id,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", character_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al unir personaje a la campaña"
            )
        
        # Agregar usuario como PLAYER a la campaña si no es miembro
        existing_member = supabase.client.table("campaign_members").select(
            "*"
        ).eq(
            "campaign_id", campaign_id
        ).eq(
            "user_id", current_user["id"]
        ).execute()
        
        if not existing_member.data:
            member_data = {
                "campaign_id": campaign_id,
                "user_id": current_user["id"],
                "role": "PLAYER",
                "status": "ACTIVE"
            }
            supabase.client.table("campaign_members").insert(member_data).execute()
        
        logger.info(f"✅ Character {character_id} joined campaign {campaign_id} via code {invite_code}")
        
        return {
            "message": "¡Personaje unido a la campaña exitosamente!",
            "character_id": character_id,
            "campaign_id": campaign_id,
            "campaign_name": campaign.get("name")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error joining campaign by code: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.post("/{character_id}/inventory")
async def add_item_to_inventory(
    character_id: str,
    item_name: str,
    quantity: int = 1,
    current_user: dict = Depends(get_current_user)
):
    """Agregar ítem al inventario"""
    # TODO: Implementar
    return {"message": "Ítem agregado al inventario"}


@router.get("/{character_id}/inventory")
async def get_inventory(character_id: str):
    """Obtener inventario del personaje"""
    # TODO: Implementar
    return {"inventory": []}

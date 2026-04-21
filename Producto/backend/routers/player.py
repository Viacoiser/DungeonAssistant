"""
Router para gestión de personajes y jugadores
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends, Body
from datetime import datetime
import uuid

from models.schemas import CharacterCreate, CharacterResponse, CharacterStatusUpdate
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
            "campaign_id": data.campaign_id,  # Puede ser None (personaje independiente)
            "player_id": current_user["id"],
            "name": data.name,
            "race": data.race,
            "class": data.class_,  # Mapear class_ a class para la BD
            "level": data.level,
            "background": data.background or "",
            "alignment": data.alignment or "",
            "stats": data.stats.dict() if hasattr(data.stats, 'dict') else data.stats,
            "hp_max": data.hp_max,
            "hp_current": data.hp_current,
            "armor_class": data.armor_class or 10,
            "initiative": data.initiative or 0,
            "speed": data.speed or 30,
            "proficiency_bonus": data.proficiency_bonus or 2,
            "hit_dice": data.hit_dice or "1d8",
            "passive_perception": data.passive_perception or 10,
            "personality_traits": data.personality_traits or "",
            "ideals": data.ideals or "",
            "bonds": data.bonds or "",
            "flaws": data.flaws or "",
            "other_proficiencies": data.other_proficiencies or "",
            "equipment": data.equipment or "",
            "features_traits": data.features_traits or "",
            "backstory": data.backstory or "",
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
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Actualizar personaje"""
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
        
        # Verificar permisos (solo el propietario o GM)
        if character.data["player_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para actualizar este personaje"
            )
        
        # Actualizar
        data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.client.table("characters").update(
            data
        ).eq(
            "id", character_id
        ).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar personaje"
            )
        
        logger.info(f"✅ Character updated: {character_id}")
        return {"message": "Personaje actualizado"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating character: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar personaje"
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

"""
Router para gestión de campañas
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from pydantic import BaseModel, Field
from middleware.auth import get_current_user
import logging
import secrets
import string

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/campaigns", tags=["campaigns"])

class CampaignCreate(BaseModel):
    name: str
    description: str = None

class CampaignUpdate(BaseModel):
    name: str = None
    description: str = None
    lore_summary: str = None

class JoinCampaignRequest(BaseModel):
    invite_code: str = Field(..., min_length=6, max_length=6)

class CampaignResponse(BaseModel):
    id: str
    name: str
    description: str = None
    is_active: bool
    invitation_code: str = None

def get_supabase():
    from services.supabase import SupabaseClient
    return SupabaseClient()

@router.post("")
async def create_campaign(data: CampaignCreate, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase()
        user_id = current_user["id"]
        
        invitation_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        
        campaign_data = {
            "name": data.name,
            "description": data.description,
            "is_active": True,
            "invitation_code": invitation_code
        }
        
        response = supabase.client.table("campaigns").insert(campaign_data).execute()
        campaign = response.data[0] if response.data else None
        
        if not campaign:
            raise HTTPException(status_code=500, detail="Error creando campaña")
        
        member_data = {
            "campaign_id": campaign["id"],
            "user_id": user_id,
            "role": "GM",
            "status": "ACTIVE"
        }
        
        supabase.client.table("campaign_members").insert(member_data).execute()
        logger.info(f"Campaña creada: {campaign['id']} por {user_id}")
        
        return {
            **campaign,
            "invite_code": invitation_code
        }
    except Exception as e:
        logger.error(f"Error creando campaña: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def list_campaigns(current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase()
        user_id = current_user["id"]

        response = supabase.client.table("campaign_members") \
            .select("role, campaigns(id, name, description, is_active, created_at, invitation_code)") \
            .eq("user_id", user_id) \
            .eq("status", "ACTIVE") \
            .execute()

        campaigns = []
        for item in (response.data or []):
            campaign_data = item.get("campaigns")
            if campaign_data:
                campaigns.append({
                    **campaign_data,
                    "user_role": item.get("role", "PLAYER"),
                    "invite_code": campaign_data.get("invitation_code")
                })

        return campaigns
    except Exception as e:
        logger.error(f"Error listando campañas: {e}")
        return []

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase()
        result = supabase.client.table("campaigns") \
            .select("*") \
            .eq("id", campaign_id) \
            .single() \
            .execute()
        return result.data
    except Exception as e:
        logger.error(f"Error obteniendo campaña: {e}")
        raise HTTPException(status_code=404, detail="Campaña no encontrada")

@router.patch("/{campaign_id}")
async def update_campaign(campaign_id: str, data: CampaignUpdate):
    try:
        supabase = get_supabase()
        update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
            
        if not update_data:
            return {"message": "Sin cambios"}

        result = supabase.client.table("campaigns").update(update_data).eq("id", campaign_id).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        logger.error(f"Error actualizando campaña: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase()
        
        member_check = supabase.client.table("campaign_members").select("role") \
            .eq("campaign_id", campaign_id).eq("user_id", current_user["id"]).execute()
        
        if not member_check.data or member_check.data[0]["role"] != "GM":
            raise HTTPException(status_code=403, detail="Solo el GM puede eliminar la campaña")
        
        supabase.client.table("campaigns").delete().eq("id", campaign_id).execute()
        logger.info(f"Campaña eliminada: {campaign_id} por {current_user['id']}")
        
        return {"message": "Campaña eliminada correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando campaña: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/join")
async def join_campaign_by_code(request: JoinCampaignRequest, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase()
        user_id = current_user["id"]
        code = request.invite_code.upper()
        
        campaign_result = supabase.client.table("campaigns").select("*").eq("invitation_code", code).execute()
        
        if not campaign_result.data:
            raise HTTPException(status_code=404, detail="Código inválido")
        
        campaign = campaign_result.data[0]
        
        existing_member = supabase.client.table("campaign_members") \
            .select("*").eq("campaign_id", campaign["id"]).eq("user_id", user_id).execute()
        
        if existing_member.data:
            raise HTTPException(status_code=400, detail="Ya eres miembro")
        
        member_data = {
            "campaign_id": campaign["id"],
            "user_id": user_id,
            "role": "PLAYER",
            "status": "ACTIVE"
        }
        
        supabase.client.table("campaign_members").insert(member_data).execute()
        logger.info(f"Usuario {user_id} se unió a campaña {campaign['id']}")
        
        return {"message": "¡Te uniste!", "campaign_id": campaign["id"], "success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uniéndose a campaña: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{campaign_id}/regenerate-code")
async def regenerate_invitation_code(campaign_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase()
        user_id = current_user["id"]
        
        member = supabase.client.table("campaign_members") \
            .select("*").eq("campaign_id", campaign_id).eq("user_id", user_id).eq("role", "GM").execute()
        
        if not member.data:
            raise HTTPException(status_code=403, detail="Solo GMs")
        
        new_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        supabase.client.table("campaigns").update({"invitation_code": new_code}).eq("id", campaign_id).execute()
        
        return {"new_code": new_code, "invite_code": new_code}
    except Exception as e:
        logger.error(f"Error regenerando código: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{campaign_id}/members")
async def get_campaign_members(campaign_id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase()
        user_id = current_user["id"]
        
        response = supabase.client.table("campaign_members") \
            .select("user_id, role, joined_at, users(username, email)") \
            .eq("campaign_id", campaign_id).execute()
        
        members = []
        user_role = "PLAYER"
        
        for item in response.data or []:
            user_data = item.get("users")
            if user_data:
                members.append({
                    "user_id": item.get("user_id"),
                    "username": user_data.get("username", "Sin nombre"),
                    "email": user_data.get("email"),
                    "role": item.get("role"),
                    "joined_at": item.get("joined_at")
                })
                if item.get("user_id") == user_id:
                    user_role = item.get("role", "PLAYER")
        
        return {"members": members, "user_role": user_role}
    except Exception as e:
        logger.error(f"Error obteniendo miembros: {e}")
        return {"members": [], "user_role": "PLAYER"}

@router.post("/{campaign_id}/npcs")
async def generate_npc(campaign_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    try:
        supabase = get_supabase()
        from services.gemini import GeminiService
        gemini = GeminiService()

        campaign_res = supabase.client.table("campaigns").select("name, lore_summary") \
            .eq("id", campaign_id).single().execute()
        campaign = campaign_res.data or {}

        npcs_res = supabase.client.table("npcs").select("name").eq("campaign_id", campaign_id).execute()

        context = {
            "campaign_name": campaign.get("name", ""),
            "lore_summary": campaign.get("lore_summary", ""),
            "npcs": npcs_res.data or []
        }

        npc_data = await gemini.generate_npc(context, data.get("prompt", ""))
        stats = npc_data.get("stats") or {}
        
        insert_res = supabase.client.table("npcs").insert({
            "campaign_id": campaign_id,
            "name": npc_data.get("name", "NPC"),
            "race": npc_data.get("race", ""),
            "personality": npc_data.get("personality", ""),
            "stats": stats,
            "is_alive": True,
            "generated_by_ai": True
        }).execute()

        return insert_res.data[0] if insert_res.data else npc_data
    except Exception as e:
        logger.error(f"Error generando NPC: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{campaign_id}/npcs")
async def list_npcs(campaign_id: str):
    try:
        supabase = get_supabase()
        result = supabase.client.table("npcs").select("*") \
            .eq("campaign_id", campaign_id).order("created_at").execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error listando NPCs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{campaign_id}/npcs/{npc_id}")
async def update_npc(npc_id: str, data: dict):
    try:
        supabase = get_supabase()
        update_data = {k: v for k, v in data.items() if v is not None}
        result = supabase.client.table("npcs").update(update_data).eq("id", npc_id).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        logger.error(f"Error actualizando NPC: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{campaign_id}/npcs/{npc_id}")
async def delete_npc(npc_id: str):
    try:
        supabase = get_supabase()
        supabase.client.table("npcs").delete().eq("id", npc_id).execute()
        return {"message": "NPC eliminado"}
    except Exception as e:
        logger.error(f"Error eliminando NPC: {e}")
        raise HTTPException(status_code=500, detail=str(e))

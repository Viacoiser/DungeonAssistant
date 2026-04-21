"""
Pydantic schemas para validación de datos
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum


# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class UserRegister(BaseModel):
    """Modelo para registro de usuario"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    username: str = Field(..., min_length=3, max_length=50)


class UserLogin(BaseModel):
    """Modelo para login de usuario"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Respuesta de usuario"""
    id: str
    email: str
    username: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# CAMPAIGN SCHEMAS
# ============================================================================

class RoleEnum(str, Enum):
    GM = "GM"
    PLAYER = "PLAYER"


class CampaignCreate(BaseModel):
    """Crear nueva campaña"""
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None


class CampaignResponse(BaseModel):
    """Respuesta de campaña"""
    id: str
    name: str
    description: Optional[str] = None
    lore_summary: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class JoinCampaignRequest(BaseModel):
    """Solicitud para unirse a campaña"""
    campaign_id: str
    role: RoleEnum = Field(...)


class JoinCampaignByCodeRequest(BaseModel):
    """Solicitud para unirse a campaña con código de invitación"""
    invite_code: str = Field(..., min_length=6, max_length=6)


class CampaignMemberResponse(BaseModel):
    """Miembro de campaña"""
    id: str
    campaign_id: str
    user_id: str
    username: str
    role: RoleEnum
    status: str
    joined_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# CHARACTER SCHEMAS
# ============================================================================

class StatsModel(BaseModel):
    """Estadísticas de D&D 5e"""
    strength: int = Field(..., ge=3, le=20)
    dexterity: int = Field(..., ge=3, le=20)
    constitution: int = Field(..., ge=3, le=20)
    intelligence: int = Field(..., ge=3, le=20)
    wisdom: int = Field(..., ge=3, le=20)
    charisma: int = Field(..., ge=3, le=20)


class SavingThrowsModel(BaseModel):
    """Tiros de salvación"""
    strength: Optional[Dict[str, Any]] = None
    dexterity: Optional[Dict[str, Any]] = None
    constitution: Optional[Dict[str, Any]] = None
    intelligence: Optional[Dict[str, Any]] = None
    wisdom: Optional[Dict[str, Any]] = None
    charisma: Optional[Dict[str, Any]] = None


class SkillsModel(BaseModel):
    """Habilidades"""
    acrobatics: Optional[Dict[str, Any]] = None
    animal_handling: Optional[Dict[str, Any]] = None
    arcana: Optional[Dict[str, Any]] = None
    athletics: Optional[Dict[str, Any]] = None
    deception: Optional[Dict[str, Any]] = None
    history: Optional[Dict[str, Any]] = None
    insight: Optional[Dict[str, Any]] = None
    intimidation: Optional[Dict[str, Any]] = None
    investigation: Optional[Dict[str, Any]] = None
    medicine: Optional[Dict[str, Any]] = None
    nature: Optional[Dict[str, Any]] = None
    perception: Optional[Dict[str, Any]] = None
    performance: Optional[Dict[str, Any]] = None
    persuasion: Optional[Dict[str, Any]] = None
    religion: Optional[Dict[str, Any]] = None
    sleight_of_hand: Optional[Dict[str, Any]] = None
    stealth: Optional[Dict[str, Any]] = None
    survival: Optional[Dict[str, Any]] = None


class CharacterCreate(BaseModel):
    """Crear personaje"""
    campaign_id: Optional[str] = None  # Opcional - se puede agregar después
    name: str = Field(..., min_length=1, max_length=100)
    race: str = Field(..., min_length=1)
    class_: str = Field(..., alias="class", min_length=1)
    level: int = Field(default=1, ge=1, le=20)
    background: Optional[str] = None
    alignment: Optional[str] = None
    stats: StatsModel
    hp_max: int = Field(..., ge=1)
    hp_current: int = Field(..., ge=0)
    armor_class: Optional[int] = None
    initiative: Optional[int] = None
    speed: int = Field(default=30)
    proficiency_bonus: Optional[int] = None
    hit_dice: Optional[str] = None
    passive_perception: Optional[int] = None
    personality_traits: Optional[str] = None
    ideals: Optional[str] = None
    bonds: Optional[str] = None
    flaws: Optional[str] = None
    other_proficiencies: Optional[str] = None
    equipment: Optional[str] = None
    features_traits: Optional[str] = None
    backstory: Optional[str] = None

    class Config:
        populate_by_name = True


class CharacterResponse(BaseModel):
    """Respuesta de personaje"""
    id: str
    campaign_id: str
    player_id: str
    name: str
    race: str
    class_: str = Field(..., alias="class")
    level: int
    stats: Dict[str, int]
    hp_max: int
    hp_current: int
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True


class CharacterStatusUpdate(BaseModel):
    """Actualizar status de personaje (vivo/muerto)"""
    is_alive: bool


class CharacterUpdate(BaseModel):
    """Actualizar datos del personaje"""
    level: Optional[int] = None
    hp_max: Optional[int] = None
    hp_current: Optional[int] = None
    armor_class: Optional[int] = None
    proficiency_bonus: Optional[int] = None
    stats: Optional[StatsModel] = None
    is_alive: Optional[bool] = None

    class Config:
        populate_by_name = True


# ============================================================================
# NPC SCHEMAS
# ============================================================================

class NPCCreate(BaseModel):
    """Crear NPC"""
    campaign_id: str
    name: str
    race: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class")
    personality: Optional[str] = None
    secrets: Optional[str] = None
    relationship_to_party: Optional[str] = None
    faction_id: Optional[str] = None

    class Config:
        populate_by_name = True


class NPCResponse(BaseModel):
    """Respuesta de NPC"""
    id: str
    campaign_id: str
    name: str
    race: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class")
    personality: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True


# ============================================================================
# SESSION SCHEMAS
# ============================================================================

class SessionCreate(BaseModel):
    """Crear sesión"""
    campaign_id: str
    session_number: int = Field(..., ge=1)
    title: Optional[str] = None
    date: Optional[str] = None


class SessionResponse(BaseModel):
    """Respuesta de sesión"""
    id: str
    campaign_id: str
    session_number: int
    title: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SessionNoteCreate(BaseModel):
    """Crear nota de sesión"""
    session_id: str
    content: str = Field(..., min_length=1)


class SessionNoteResponse(BaseModel):
    """Respuesta de nota de sesión"""
    id: str
    session_id: str
    author_id: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# ROLE CHANGE SCHEMAS
# ============================================================================

class RoleChangeRequest(BaseModel):
    """Solicitud de cambio de rol"""
    campaign_id: str
    requested_role: RoleEnum


class ApproveRoleChange(BaseModel):
    """Aprobar cambio de rol"""
    approved: bool = Field(...)


# ============================================================================
# GEMINI SCHEMAS
# ============================================================================

class NPCGenerateRequest(BaseModel):
    """Solicitud para generar NPC con IA"""
    campaign_id: str
    prompt: str = Field(..., min_length=10, max_length=500)


class NPCGenerateResponse(BaseModel):
    """Respuesta de generación de NPC"""
    name: str
    race: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class")
    personality: str
    secrets: Optional[str] = None
    relationship_to_party: Optional[str] = None

    class Config:
        populate_by_name = True


class AssistantQuestion(BaseModel):
    """Pregunta para asistente conversacional"""
    campaign_id: str
    question: str = Field(..., min_length=1, max_length=1000)


class AssistantResponse(BaseModel):
    """Respuesta del asistente"""
    answer: str
    sources: Optional[List[str]] = None


# ============================================================================
# OCR SCHEMAS
# ============================================================================

class OCRUploadRequest(BaseModel):
    """Solicitud de OCR de hoja"""
    campaign_id: str
    image_url: str


class OCRResult(BaseModel):
    """Resultado de OCR"""
    character_name: Optional[str] = None
    race: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class")
    level: Optional[int] = None
    stats: Optional[StatsModel] = None
    confidence: Optional[float] = None
    low_confidence_fields: List[str] = []
    unreadable_fields: List[str] = []

    class Config:
        populate_by_name = True


# ============================================================================
# PHASE 2: SESSION NPC SCHEMAS
# ============================================================================

class SessionNPCCreate(BaseModel):
    """Crear NPC encontrado en sesión"""
    session_id: str
    campaign_id: str
    name: str
    role: Optional[str] = "unknown"
    confidence: Optional[int] = Field(70, ge=0, le=100)
    mention_count: Optional[int] = 1
    details: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "uuid-123",
                "campaign_id": "uuid-456",
                "name": "Gandalf",
                "role": "quest-giver",
                "confidence": 85,
                "details": {"description": "The Wizard from the tower"}
            }
        }


class SessionNPCResponse(BaseModel):
    """Respuesta de NPC encontrado"""
    id: str
    session_id: str
    campaign_id: str
    name: str
    role: str
    confidence: int
    first_mentioned: datetime
    last_mentioned: datetime
    mention_count: int
    details: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# PHASE 2: SESSION QUEST SCHEMAS
# ============================================================================

class SessionQuestCreate(BaseModel):
    """Crear misión detectada en sesión"""
    session_id: str
    campaign_id: str
    title: str
    description: Optional[str] = None
    status: Optional[str] = "active"
    reward: Optional[str] = None
    giver_npc: Optional[str] = None
    detected_in_note_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "uuid-123",
                "campaign_id": "uuid-456",
                "title": "Rescue the stolen artifact",
                "description": "Find the magical amulet taken by the bandits",
                "status": "active",
                "reward": "1000 gold",
                "giver_npc": "The Mayor"
            }
        }


class SessionQuestResponse(BaseModel):
    """Respuesta de misión"""
    id: str
    session_id: str
    campaign_id: str
    title: str
    description: Optional[str] = None
    status: str
    reward: Optional[str] = None
    giver_npc: Optional[str] = None
    detected_in_note_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# PHASE 2: ANALYSIS UPDATE SCHEMAS
# ============================================================================

class NoteCreateWithAnalysis(BaseModel):
    """Crear nota con análisis automático"""
    content: str
    session_id: str


class AnalysisResponse(BaseModel):
    """Respuesta de análisis"""
    detected_items: List[Dict[str, Any]] = []
    detected_npcs: List[Dict[str, Any]] = []
    detected_spells: List[Dict[str, Any]] = []
    items_count: int = 0
    npcs_count: int = 0
    spells_count: int = 0
    source: str = "hybrid_parallel"
    performance: Dict[str, Any] = {}

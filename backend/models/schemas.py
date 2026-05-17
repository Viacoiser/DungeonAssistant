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
    """Estadísticas base D&D 5e"""
    strength: int = Field(default=10, ge=1, le=30)
    dexterity: int = Field(default=10, ge=1, le=30)
    constitution: int = Field(default=10, ge=1, le=30)
    intelligence: int = Field(default=10, ge=1, le=30)
    wisdom: int = Field(default=10, ge=1, le=30)
    charisma: int = Field(default=10, ge=1, le=30)


# ── Defaults JSONB ─────────────────────────────────────────────────────────────

def default_saving_throws() -> Dict[str, Any]:
    """Estructura canónica de saving throws D&D 5e"""
    return {
        stat: {"proficient": False}
        for stat in ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    }


def default_skills() -> Dict[str, Any]:
    """Estructura canónica de las 18 habilidades D&D 5e"""
    return {
        skill: {"proficient": False, "expertise": False}
        for skill in [
            "acrobatics", "animal_handling", "arcana", "athletics",
            "deception", "history", "insight", "intimidation",
            "investigation", "medicine", "nature", "perception",
            "performance", "persuasion", "religion", "sleight_of_hand",
            "stealth", "survival",
        ]
    }


def default_attacks() -> List[Dict[str, Any]]:
    """3 filas vacías de ataques (hoja oficial D&D 5e)"""
    return [
        {"name": "", "attack_bonus": "+0", "damage": "", "damage_type": ""}
        for _ in range(3)
    ]


def default_death_saves() -> Dict[str, Any]:
    return {"successes": 0, "failures": 0}


def default_spellcasting() -> Dict[str, Any]:
    """Estructura completa de spellcasting D&D 5e"""
    return {
        "class": "",
        "ability": "",
        "save_dc": 0,
        "attack_bonus": 0,
        "slots": {
            str(lvl): {"total": 0, "used": 0} for lvl in range(1, 10)
        },
        "cantrips": [],
        "spells": [],
    }


def default_currency() -> Dict[str, int]:
    """Monedas D&D 5e: CP / SP / EP / GP / PP"""
    return {"cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0}


def default_allies_organizations() -> Dict[str, Any]:
    return {"text": "", "symbol": ""}


class CharacterCreate(BaseModel):
    """Crear personaje — cubre todos los campos de la hoja oficial D&D 5e"""

    # ── Identificación ──────────────────────────────────────────────────────────
    campaign_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    race: str = Field(..., min_length=1)
    class_: str = Field(..., alias="class", min_length=1)
    subclass: Optional[str] = None
    level: int = Field(default=1, ge=1, le=20)
    background: Optional[str] = None
    alignment: Optional[str] = None
    experience_points: int = Field(default=0, ge=0)
    player_name: Optional[str] = None          # Nombre del jugador (no el personaje)

    # ── Estadísticas base ───────────────────────────────────────────────────────
    stats: StatsModel = Field(default_factory=StatsModel)

    # ── Combate ─────────────────────────────────────────────────────────────────
    hp_max: int = Field(..., ge=1)
    hp_current: int = Field(..., ge=0)
    hp_temporary: int = Field(default=0, ge=0)           # Temp HP
    armor_class: int = Field(default=10)
    initiative: int = Field(default=0)
    speed: int = Field(default=30)
    proficiency_bonus: int = Field(default=2)
    hit_dice: str = Field(default="1d8")                  # ej: "d8" o "1d8"
    hit_dice_used: int = Field(default=0, ge=0)           # Dados usados
    passive_perception: int = Field(default=10)
    inspiration: bool = Field(default=False)

    # ── Tiradas de salvación y habilidades (JSONB estructurado) ─────────────────
    saving_throws: Dict[str, Any] = Field(default_factory=default_saving_throws)
    skills: Dict[str, Any] = Field(default_factory=default_skills)

    # ── Death Saves ─────────────────────────────────────────────────────────────
    death_saves: Dict[str, Any] = Field(default_factory=default_death_saves)

    # ── Ataques ─────────────────────────────────────────────────────────────────
    attacks: List[Dict[str, Any]] = Field(default_factory=default_attacks)

    # ── Equipo e inventario ──────────────────────────────────────────────────────
    equipment: str = Field(default="")
    currency: Dict[str, Any] = Field(default_factory=default_currency)
    treasure: Optional[str] = None

    # ── Spellcasting ─────────────────────────────────────────────────────────────
    spellcasting: Dict[str, Any] = Field(default_factory=default_spellcasting)

    # ── Personalidad ─────────────────────────────────────────────────────────────
    personality_traits: str = Field(default="")
    ideals: str = Field(default="")
    bonds: str = Field(default="")
    flaws: str = Field(default="")

    # ── Rasgos y características ──────────────────────────────────────────────────
    features_traits: str = Field(default="")
    other_proficiencies: str = Field(default="")   # Idiomas, herramientas, etc.
    additional_features: str = Field(default="")   # Rasgos adicionales (pág 2)

    # ── Trasfondo ────────────────────────────────────────────────────────────────
    backstory: str = Field(default="")
    allies_organizations: Dict[str, Any] = Field(default_factory=default_allies_organizations)

    # ── Apariencia física ────────────────────────────────────────────────────────
    age: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eyes: Optional[str] = None
    skin: Optional[str] = None
    hair: Optional[str] = None
    appearance: Optional[str] = None              # Descripción libre de apariencia

    # ── Imagen ───────────────────────────────────────────────────────────────────
    image_url: Optional[str] = None

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
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        from_attributes = True


class CharacterStatusUpdate(BaseModel):
    """Actualizar status de personaje (vivo/muerto)"""
    is_alive: bool


class CharacterUpdate(BaseModel):
    """Actualizar datos del personaje — cubre todos los campos editables"""

    # ── Identificación ──────────────────────────────────────────────────────────
    name: Optional[str] = None
    race: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class")
    subclass: Optional[str] = None
    level: Optional[int] = Field(None, ge=1, le=20)
    background: Optional[str] = None
    alignment: Optional[str] = None
    experience_points: Optional[int] = Field(None, ge=0)
    player_name: Optional[str] = None

    # ── Stats base ───────────────────────────────────────────────────────────────
    stats: Optional[StatsModel] = None

    # ── Combate ──────────────────────────────────────────────────────────────────
    hp_max: Optional[int] = Field(None, ge=1)
    hp_current: Optional[int] = Field(None, ge=0)
    hp_temporary: Optional[int] = Field(None, ge=0)
    armor_class: Optional[int] = None
    initiative: Optional[int] = None
    speed: Optional[int] = None
    proficiency_bonus: Optional[int] = None
    hit_dice: Optional[str] = None
    hit_dice_used: Optional[int] = Field(None, ge=0)
    passive_perception: Optional[int] = None
    inspiration: Optional[bool] = None

    # ── Tiradas de salvación y habilidades ────────────────────────────────────────
    saving_throws: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, Any]] = None

    # ── Death Saves ───────────────────────────────────────────────────────────────
    death_saves: Optional[Dict[str, Any]] = None

    # ── Ataques ───────────────────────────────────────────────────────────────────
    attacks: Optional[List[Dict[str, Any]]] = None

    # ── Equipo e inventario ───────────────────────────────────────────────────────
    equipment: Optional[str] = None
    currency: Optional[Dict[str, Any]] = None
    treasure: Optional[str] = None

    # ── Spellcasting ──────────────────────────────────────────────────────────────
    spellcasting: Optional[Dict[str, Any]] = None

    # ── Personalidad ──────────────────────────────────────────────────────────────
    personality_traits: Optional[str] = None
    ideals: Optional[str] = None
    bonds: Optional[str] = None
    flaws: Optional[str] = None

    # ── Rasgos ────────────────────────────────────────────────────────────────────
    features_traits: Optional[str] = None
    other_proficiencies: Optional[str] = None
    additional_features: Optional[str] = None

    # ── Trasfondo ─────────────────────────────────────────────────────────────────
    backstory: Optional[str] = None
    allies_organizations: Optional[Dict[str, Any]] = None

    # ── Apariencia física ─────────────────────────────────────────────────────────
    age: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eyes: Optional[str] = None
    skin: Optional[str] = None
    hair: Optional[str] = None
    appearance: Optional[str] = None

    # ── Estado / imagen ───────────────────────────────────────────────────────────
    is_alive: Optional[bool] = None
    image_url: Optional[str] = None

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

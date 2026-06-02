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

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    lore_summary: Optional[str] = None


class JoinCampaignRequest(BaseModel):
    invite_code: str = Field(..., min_length=6, max_length=6)


class CampaignResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool
    invitation_code: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# SESSION SCHEMAS
# ============================================================================

class SessionCreate(BaseModel):
    campaign_id: str
    session_number: int
    title: Optional[str] = None


class NoteCreate(BaseModel):
    content: str


class NoteVisibility(BaseModel):
    is_public: bool


# ============================================================================
# ASSISTANT SCHEMAS
# ============================================================================

class ChatRequest(BaseModel):
    campaign_id: str
    question: str


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


def default_saving_throws() -> Dict[str, Any]:
    return {
        stat: {"proficient": False}
        for stat in ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    }


def default_skills() -> Dict[str, Any]:
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
    return [
        {"name": "", "attack_bonus": "+0", "damage": "", "damage_type": ""}
        for _ in range(3)
    ]


def default_death_saves() -> Dict[str, Any]:
    return {"successes": 0, "failures": 0}


def default_spellcasting() -> Dict[str, Any]:
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
    return {"cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0}


def default_allies_organizations() -> Dict[str, Any]:
    return {"text": "", "symbol": ""}


class CharacterCreate(BaseModel):
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

    stats: StatsModel = Field(default_factory=StatsModel)

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

    saving_throws: Dict[str, Any] = Field(default_factory=default_saving_throws)
    skills: Dict[str, Any] = Field(default_factory=default_skills)

    death_saves: Dict[str, Any] = Field(default_factory=default_death_saves)

    attacks: List[Dict[str, Any]] = Field(default_factory=default_attacks)

    equipment: str = Field(default="")
    currency: Dict[str, Any] = Field(default_factory=default_currency)
    treasure: Optional[str] = None

    spellcasting: Dict[str, Any] = Field(default_factory=default_spellcasting)

    personality_traits: str = Field(default="")
    ideals: str = Field(default="")
    bonds: str = Field(default="")
    flaws: str = Field(default="")

    features_traits: str = Field(default="")
    other_proficiencies: str = Field(default="")   # Idiomas, herramientas, etc.
    additional_features: str = Field(default="")   # Rasgos adicionales (pág 2)

    backstory: str = Field(default="")
    allies_organizations: Dict[str, Any] = Field(default_factory=default_allies_organizations)

    age: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eyes: Optional[str] = None
    skin: Optional[str] = None
    hair: Optional[str] = None
    appearance: Optional[str] = None              # Descripción libre de apariencia

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
    name: Optional[str] = None
    race: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class")
    subclass: Optional[str] = None
    level: Optional[int] = Field(None, ge=1, le=20)
    background: Optional[str] = None
    alignment: Optional[str] = None
    experience_points: Optional[int] = Field(None, ge=0)
    player_name: Optional[str] = None
    campaign_id: Optional[str] = None

    stats: Optional[StatsModel] = None

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

    saving_throws: Optional[Dict[str, Any]] = None
    skills: Optional[Dict[str, Any]] = None

    death_saves: Optional[Dict[str, Any]] = None

    attacks: Optional[List[Dict[str, Any]]] = None

    equipment: Optional[str] = None
    currency: Optional[Dict[str, Any]] = None
    treasure: Optional[str] = None

    spellcasting: Optional[Dict[str, Any]] = None

    personality_traits: Optional[str] = None
    ideals: Optional[str] = None
    bonds: Optional[str] = None
    flaws: Optional[str] = None

    features_traits: Optional[str] = None
    other_proficiencies: Optional[str] = None
    additional_features: Optional[str] = None

    backstory: Optional[str] = None
    allies_organizations: Optional[Dict[str, Any]] = None

    age: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eyes: Optional[str] = None
    skin: Optional[str] = None
    hair: Optional[str] = None
    appearance: Optional[str] = None

    is_alive: Optional[bool] = None
    image_url: Optional[str] = None

    class Config:
        populate_by_name = True




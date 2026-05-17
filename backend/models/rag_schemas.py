"""
Phase 3: Pydantic Schemas para RAG
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============================================================================
# RAG ENTITY SCHEMAS
# ============================================================================

class RAGEntityBase(BaseModel):
    entity_type: str = Field(..., pattern="^(NPC|LOCATION|QUEST|ITEM|FACTION|EVENT)$")
    entity_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = {}


class RAGEntityCreate(RAGEntityBase):
    pass


class RAGEntityResponse(RAGEntityBase):
    id: str
    campaign_id: str
    first_seen: datetime
    last_updated: datetime
    mention_count: int
    
    class Config:
        from_attributes = True


# ============================================================================
# RAG RELATIONSHIP SCHEMAS
# ============================================================================

class RAGRelationshipBase(BaseModel):
    relationship_type: str = Field(..., min_length=1, max_length=100)
    strength: int = Field(default=50, ge=0, le=100)


class RAGRelationshipCreate(RAGRelationshipBase):
    source_entity_id: str
    target_entity_id: str


class RAGRelationshipResponse(RAGRelationshipBase):
    id: str
    campaign_id: str
    source_entity_id: str
    target_entity_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# RAG EVENT SCHEMAS
# ============================================================================

class RAGEventBase(BaseModel):
    session_number: int = Field(..., ge=1)
    event_title: str = Field(..., min_length=1, max_length=255)
    event_summary: str = Field(..., min_length=1, max_length=500)
    involved_entities: Optional[List[str]] = []


class RAGEventCreate(RAGEventBase):
    session_id: Optional[str] = None


class RAGEventResponse(RAGEventBase):
    id: str
    campaign_id: str
    session_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# CONTEXT SCHEMAS (RAG Simple)
# ============================================================================

class RAGContextResponse(BaseModel):
    """Contexto RAG estructurado"""
    npcs: List[RAGEntityResponse] = []
    locations: List[RAGEntityResponse] = []
    quests: List[RAGEntityResponse] = []
    items: List[RAGEntityResponse] = []
    factions: List[RAGEntityResponse] = []
    relationships: List[RAGRelationshipResponse] = []
    events: List[RAGEventResponse] = []
    total_entities: int


# ============================================================================
# CHAT ASSISTANT SCHEMAS (Phase 3 - RAG Simple)
# ============================================================================

class ChatAssistantRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)


class ChatAssistantResponse(BaseModel):
    """Respuesta del asistente con metadata RAG"""
    answer: str
    tokens_estimated: int
    response_time_ms: int
    rag_entities_total: int


# ============================================================================
# TOKEN USAGE SCHEMAS
# ============================================================================

class TokenUsageCreate(BaseModel):
    question: str = Field(..., max_length=255)
    answer_length: int
    tokens_estimated: int
    compression_level: str = "rag_simple"  # Always RAG simple
    response_time_ms: int


class TokenUsageResponse(TokenUsageCreate):
    id: str
    campaign_id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenUsageStats(BaseModel):
    """Estadísticas diarias de consumo"""
    date: str
    questions_asked: int
    unique_users: int
    avg_tokens: float
    total_tokens: int
    avg_response_ms: float
    max_response_ms: int


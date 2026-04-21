"""
Phase 3: RAG Manager Service
Gestiona entidades inmutables para Retrieval-Augmented Generation
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
import json


class RAGManager:
    """Gestionar entidades inmutables de campaña para RAG"""
    
    def __init__(self, db):
        """db: cliente de Supabase (Any type, no type-hint para evitar imports)"""
        self.db = db
    
    def register_entity(
        self,
        campaign_id: str,
        entity_type: str,  # NPC, LOCATION, QUEST, ITEM, FACTION, EVENT
        entity_name: str,
        description: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Registrar nueva entidad o incrementar mention_count si existe
        
        Returns: Entity dict con id, mention_count, etc.
        """
        
        try:
            # Buscar si entidad ya existe
            existing = self.db.table("rag_entities").select("*").match({
                "campaign_id": campaign_id,
                "entity_type": entity_type,
                "entity_name": entity_name
            }).execute()
            
            if existing.data and len(existing.data) > 0:
                # Actualizar mention_count
                entity = existing.data[0]
                entity_id = entity["id"]
                
                result = self.db.table("rag_entities").update({
                    "mention_count": entity["mention_count"] + 1,
                    "last_updated": datetime.utcnow().isoformat()
                }).eq("id", entity_id).execute()
                
                return result.data[0]
            else:
                # Crear nueva entidad
                result = self.db.table("rag_entities").insert({
                    "campaign_id": campaign_id,
                    "entity_type": entity_type,
                    "entity_name": entity_name,
                    "description": description or "",
                    "attributes": attributes or {},
                    "mention_count": 1
                }).execute()
                
                return result.data[0]
        
        except Exception as e:
            print(f"Error registering entity: {e}")
            raise
    
    def register_relationship(
        self,
        campaign_id: str,
        source_entity_id: str,
        target_entity_id: str,
        relationship_type: str,
        strength: int = 50
    ) -> Dict[str, Any]:
        """
        Registrar relación entre dos entidades
        
        Ej: Gandalf (source) -> works_for -> Elrond (target)
        Strength: 0-100 (confianza)
        """
        
        try:
            result = self.db.table("rag_relationships").upsert({
                "campaign_id": campaign_id,
                "source_entity_id": source_entity_id,
                "target_entity_id": target_entity_id,
                "relationship_type": relationship_type,
                "strength": strength
            }).execute()
            
            return result.data[0] if result.data else {}
        
        except Exception as e:
            print(f"Error registering relationship: {e}")
            raise
    
    def create_event_summary(
        self,
        campaign_id: str,
        session_id: str,
        session_number: int,
        event_title: str,
        event_summary: str,  # Max 50 words
        involved_entities: List[str] = None
    ) -> Dict[str, Any]:
        """
        Crear resumen de sesión ultra-comprimido
        
        event_summary debe ser CORTO: "Party defeated goblin tribe, found map."
        involved_entities: lista de entity_ids relacionadas
        """
        
        try:
            result = self.db.table("rag_events").upsert({
                "campaign_id": campaign_id,
                "session_id": session_id,
                "session_number": session_number,
                "event_title": event_title,
                "event_summary": event_summary,
                "involved_entities": involved_entities or []
            }).execute()
            
            return result.data[0] if result.data else {}
        
        except Exception as e:
            print(f"Error creating event summary: {e}")
            raise
    
    def get_campaign_context(
        self,
        campaign_id: str,
        limit_per_type: int = 10
    ) -> Dict[str, Any]:
        """
        Obtener todas las entidades de campaña, sorteadas por mention_count
        
        Returns:
        {
            "npcs": [...],
            "locations": [...],
            "quests": [...],
            "items": [...],
            "relationships": [...],
            "events": [...]
        }
        """
        
        try:
            # Obtener entidades sortedas por mention_count
            entities_result = self.db.table("rag_entities").select("*").match({
                "campaign_id": campaign_id
            }).order("mention_count", desc=True).execute()
            
            # Agrupar por tipo
            entities_by_type = {}
            for entity in entities_result.data:
                entity_type = entity["entity_type"]
                if entity_type not in entities_by_type:
                    entities_by_type[entity_type] = []
                if len(entities_by_type[entity_type]) < limit_per_type:
                    entities_by_type[entity_type].append(entity)
            
            # Obtener relaciones (top connections)
            relationships_result = self.db.table("rag_relationships").select("*").match({
                "campaign_id": campaign_id
            }).order("strength", desc=True).limit(20).execute()
            
            # Obtener eventos (últimas sesiones)
            events_result = self.db.table("rag_events").select("*").match({
                "campaign_id": campaign_id
            }).order("session_number", desc=True).limit(10).execute()
            
            return {
                "npcs": entities_by_type.get("NPC", []),
                "locations": entities_by_type.get("LOCATION", []),
                "quests": entities_by_type.get("QUEST", []),
                "items": entities_by_type.get("ITEM", []),
                "factions": entities_by_type.get("FACTION", []),
                "relationships": relationships_result.data,
                "events": events_result.data,
                "total_entities": len(entities_result.data)
            }
        
        except Exception as e:
            print(f"Error getting campaign context: {e}")
            raise
    
    def search_entities(
        self,
        campaign_id: str,
        query: str,
        entity_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Buscar entidades por nombre (full-text search)
        
        Args:
            query: término de búsqueda
            entity_type: opcional, filtrar por tipo
        """
        
        try:
            # Búsqueda por nombre (LIKE) o full-text si existe
            q = self.db.table("rag_entities").select("*").match({
                "campaign_id": campaign_id
            })
            
            if entity_type:
                q = q.eq("entity_type", entity_type)
            
            # Usar LIKE para búsqueda simple
            result = q.ilike("entity_name", f"%{query}%").execute()
            
            return result.data
        
        except Exception as e:
            print(f"Error searching entities: {e}")
            raise
    
    def get_related_entities(
        self,
        campaign_id: str,
        entity_id: str,
        max_depth: int = 2
    ) -> Dict[str, Any]:
        """
        Obtener todas las entidades relacionadas a una entidad
        (follow relationships recursively)
        
        Útil para: "Tell me about Gandalf" → muestra Gandalf + sus relaciones
        """
        
        try:
            # Get direct relationships
            relationships = self.db.table("rag_relationships").select("*").match({
                "campaign_id": campaign_id
            }).or_(f"source_entity_id.eq.{entity_id},target_entity_id.eq.{entity_id}").execute()
            
            related_ids = set()
            for rel in relationships.data:
                if rel["source_entity_id"] != entity_id:
                    related_ids.add(rel["source_entity_id"])
                if rel["target_entity_id"] != entity_id:
                    related_ids.add(rel["target_entity_id"])
            
            # Get entities
            if related_ids:
                related_entities = self.db.table("rag_entities").select("*").in_("id", list(related_ids)).execute()
            else:
                related_entities = {"data": []}
            
            return {
                "entity_id": entity_id,
                "relationships": relationships.data,
                "related_entities": related_entities.data
            }
        
        except Exception as e:
            print(f"Error getting related entities: {e}")
            raise
    
    def update_entity_description(
        self,
        entity_id: str,
        new_description: str
    ) -> Dict[str, Any]:
        """Actualizar descripción de entidad (one-time, para ediciones manual)"""
        
        try:
            result = self.db.table("rag_entities").update({
                "description": new_description,
                "last_updated": datetime.utcnow().isoformat()
            }).eq("id", entity_id).execute()
            
            return result.data[0] if result.data else {}
        
        except Exception as e:
            print(f"Error updating entity: {e}")
            raise

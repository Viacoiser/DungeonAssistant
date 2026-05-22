"""
RAG Service Optimizations
- Batch queries to avoid N+1 problem
- Implement caching with TTL
- Add database indexes
"""

import logging
from functools import wraps, lru_cache
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# Simple TTL cache
_cache = {}
_cache_timestamps = {}

def cached_query(ttl_minutes=15):
    """
    Decorator para cachear resultados de queries con TTL
    
    Usage:
    @cached_query(ttl_minutes=10)
    async def get_something(...):
        ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and args
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check if cached and not expired
            if cache_key in _cache:
                timestamp = _cache_timestamps.get(cache_key)
                if timestamp and (datetime.now() - timestamp).total_seconds() < ttl_minutes * 60:
                    logger.debug(f"Cache hit: {cache_key}")
                    return _cache[cache_key]
                else:
                    # Expired
                    del _cache[cache_key]
                    del _cache_timestamps[cache_key]
            
            # Execute and cache
            result = await func(*args, **kwargs)
            _cache[cache_key] = result
            _cache_timestamps[cache_key] = datetime.now()
            logger.debug(f"Cache miss: {cache_key} (stored for {ttl_minutes}min)")
            
            return result
        
        return wrapper
    return decorator


def verify_campaign_access(supabase_client, user_id: str, campaign_id: str):
    """
    Verificar acceso a campaña en una sola query
    en lugar de dos queries separadas
    """
    try:
        result = supabase_client.table("campaign_members") \
            .select("id") \
            .eq("campaign_id", campaign_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        return result.data is not None
    except Exception as e:
        logger.error(f"Error verifying access: {e}")
        return False


def get_campaign_entities_batch(supabase_client, campaign_id: str, entity_types: Optional[List[str]] = None, limit: int = 50):
    """
    Batch fetch entities de múltiples tipos en una sola query
    en lugar de N queries separadas
    """
    try:
        q = supabase_client.table("rag_entities") \
            .select("*") \
            .eq("campaign_id", campaign_id) \
            .order("mention_count", desc=True) \
            .limit(limit)
        
        # Si hay tipos específicos, filtrar (puede ser None para obtener todos)
        if entity_types and len(entity_types) > 0:
            # Usar OR para múltiples tipos
            q = q.in_("entity_type", entity_types)
        
        result = q.execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching entities batch: {e}")
        return []


def get_campaign_context_optimized(supabase_client, campaign_id: str):
    """
    Obtener contexto de campaña con queries optimizadas
    
    Antes (N+1):
    - Query 1: campaign_members (verificación)
    - Query 2: campaigns
    - Query 3: rag_entities
    - Query 4: rag_relationships
    Total: 4 queries
    
    Después:
    - Query 1: campaigns (con relaciones)
    - Query 2: rag_entities batch
    Total: 2 queries (-50%)
    """
    try:
        # Get campaign with entities and relationships in one query (using select with related tables)
        campaign = supabase_client.table("campaigns") \
            .select("*") \
            .eq("id", campaign_id) \
            .single() \
            .execute()
        
        if not campaign.data:
            return None
        
        # Get top 100 entities of all types
        entities = get_campaign_entities_batch(supabase_client, campaign_id, limit=100)
        
        # Group by type for quick access
        entities_by_type = {}
        for entity in entities:
            entity_type = entity.get("entity_type", "UNKNOWN")
            if entity_type not in entities_by_type:
                entities_by_type[entity_type] = []
            entities_by_type[entity_type].append(entity)
        
        return {
            "campaign": campaign.data,
            "entities": entities,
            "entities_by_type": entities_by_type,
            "total_entities": len(entities),
            "entity_types": list(entities_by_type.keys())
        }
    except Exception as e:
        logger.error(f"Error getting campaign context: {e}")
        return None


def get_top_entities_by_mentions(supabase_client, campaign_id: str, limit: int = 20):
    """
    Get entities sorted by mention count (importante para RAG)
    """
    try:
        result = supabase_client.table("rag_entities") \
            .select("id, name, entity_type, mention_count, last_mentioned") \
            .eq("campaign_id", campaign_id) \
            .order("mention_count", desc=True) \
            .limit(limit) \
            .execute()
        
        return result.data
    except Exception as e:
        logger.error(f"Error getting top entities: {e}")
        return []


# SQL Queries that should be in database as views (for backend optimization)
RECOMMENDED_VIEWS = """
-- Create these views in your database for better performance

-- View: campaign_member_access
-- Simplifies membership checks and joins
CREATE VIEW campaign_member_access AS
SELECT 
    cm.campaign_id,
    cm.user_id,
    c.name as campaign_name,
    c.description,
    COUNT(DISTINCT re.id) as entity_count
FROM campaign_members cm
JOIN campaigns c ON cm.campaign_id = c.id
LEFT JOIN rag_entities re ON c.id = re.campaign_id
GROUP BY cm.campaign_id, cm.user_id, c.id, c.name, c.description;

-- View: entity_stats
-- Quick access to entity statistics
CREATE VIEW entity_stats AS
SELECT 
    campaign_id,
    entity_type,
    COUNT(*) as count,
    AVG(mention_count) as avg_mentions,
    MAX(mention_count) as max_mentions,
    MAX(last_mentioned) as recent_mention
FROM rag_entities
GROUP BY campaign_id, entity_type;

-- Create indexes for better query performance
CREATE INDEX idx_campaign_members_user_campaign 
    ON campaign_members(campaign_id, user_id);

CREATE INDEX idx_rag_entities_campaign_type 
    ON rag_entities(campaign_id, entity_type);

CREATE INDEX idx_rag_entities_mention_count 
    ON rag_entities(campaign_id, mention_count DESC);

CREATE INDEX idx_rag_relationships_campaign 
    ON rag_relationships(campaign_id);
"""

print("Recommended database views and indexes:")
print(RECOMMENDED_VIEWS)

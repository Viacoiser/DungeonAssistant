"""
Router para búsqueda D&D5e
Endpoints para autocompletado y búsqueda de items/hechizos
"""

import logging
from fastapi import APIRouter, Query
from services.dnd5e_search import get_dnd5e_searcher

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dnd5e", tags=["D&D5e"])

# Instancia compartida del buscador
_searcher = None


def get_searcher():
    """Lazy initialization del buscador"""
    global _searcher
    if _searcher is None:
        _searcher = get_dnd5e_searcher()
    return _searcher


@router.get("/search")
async def search_dnd5e(
    q: str = Query(..., min_length=2, max_length=100, description="Término de búsqueda"),
    categories: str = Query(None, description="Categorías separadas por coma: items,spells,races,classes..."),
    limit: int = Query(10, ge=1, le=50, description="Límite de resultados")
):
    """
    Búsqueda fuzzy en datos D&D5e.
    
    Ejemplo: GET /api/dnd5e/search?q=sword&categories=items&limit=5
    """
    try:
        searcher = get_searcher()
        
        # Parsear categorías si existen
        category_list = None
        if categories:
            category_list = [cat.strip() for cat in categories.split(",")]
        
        results = searcher.search(q, categories=category_list, limit=limit)
        
        logger.info(f"Search results for '{q}': {len(results)} items found")
        return {
            "query": q,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Error en búsqueda: {e}")
        return {
            "query": q,
            "results": [],
            "count": 0,
            "error": str(e)
        }


@router.get("/autocomplete")
async def autocomplete_dnd5e(
    q: str = Query(..., min_length=1, max_length=100, description="Prefijo para autocompletado"),
    categories: str = Query(None, description="Categorías separadas por coma"),
    limit: int = Query(5, ge=1, le=20, description="Límite de sugerencias")
):
    """
    Autocompletado para formularios.
    Retorna solo nombres para dropdown
    
    Ejemplo: GET /api/dnd5e/autocomplete?q=fir&categories=spells&limit=5
    """
    try:
        searcher = get_searcher()
        
        category_list = None
        if categories:
            category_list = [cat.strip() for cat in categories.split(",")]
        
        results = searcher.search(q, categories=category_list, limit=limit)
        
        # Retornar solo nombres y categoría para autocompletado
        suggestions = [
            {
                "label": r["name"],
                "value": r["name"],
                "category": r["category"]
            }
            for r in results
        ]
        
        logger.info(f"Autocomplete for '{q}': {len(suggestions)} suggestions")
        return {
            "suggestions": suggestions,
            "count": len(suggestions)
        }
    except Exception as e:
        logger.error(f"Error en autocompletado: {e}")
        return {
            "suggestions": [],
            "count": 0,
            "error": str(e)
        }


@router.post("/analyze-note")
async def analyze_note_dnd5e(note: dict):
    """
    Analizar nota para detectar items y hechizos.
    Sin usar Gemini, solo fuzzy matching local.
    
    Body: { "content": "Los aventureros encontraron una espada y aprendieron fireball..." }
    """
    try:
        content = note.get("content", "")
        if not content:
            return {
                "detected_items": [],
                "detected_spells": [],
                "error": "Content vacío"
            }
        
        searcher = get_searcher()
        results = searcher.analyze_note(content)
        
        logger.info(f"Note analysis: {len(results['detected_items'])} items, {len(results['detected_spells'])} spells")
        return results
    except Exception as e:
        logger.error(f"Error analizando nota: {e}")
        return {
            "detected_items": [],
            "detected_spells": [],
            "error": str(e)
        }

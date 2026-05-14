"""
Servicio de búsqueda D&D5e con Fuzzy Matching
Busca items, hechizos, clases, razas, etc. localmente sin usar Gemini
"""

import json
import os
import logging
from pathlib import Path
from fuzzywuzzy import fuzz
from fuzzywuzzy import process

from services.supabase import get_supabase

logger = logging.getLogger(__name__)


class DND5ESearcher:
    """Búsqueda de datos D&D5e usando la base de datos local (Supabase)"""

    def __init__(self):
        self.supabase = get_supabase()
        logger.info("DND5ESearcher initialized using Supabase Encyclopedia")

    def _ensure_loaded(self):
        """No longer needed for DB-backed search, but kept for compatibility"""
        pass

    def search(self, query: str = None, categories: list = None, level: str = None, limit: int = 5) -> list:
        """
        Búsqueda fuzzy en la tabla encyclopedia.
        """
        try:
            # Seleccionamos solo los campos necesarios del JSON para evitar payloads masivos
            db_query = self.supabase.client.table("encyclopedia").select(
                "name, category, index, level:data->level, equipment_category:data->equipment_category, challenge_rating:data->challenge_rating, type:data->type"
            )
            
            if categories:
                # Normalizar categorías (ej: equipment-categories/weapon -> equipment)
                normalized_cats = []
                for cat in categories:
                    if "equipment-categories" in cat:
                        if "equipment" not in normalized_cats:
                            normalized_cats.append("equipment")
                    else:
                        normalized_cats.append(cat)
                
                db_query = db_query.in_("category", normalized_cats)
            
            if level is not None and level != 'all':
                if level == "cantrip":
                    db_query = db_query.eq("data->>level", "0")
                else:
                    db_query = db_query.eq("data->>level", str(level))

            # Búsqueda por nombre solo si hay query
            if query and len(query.strip()) > 0:
                db_query = db_query.ilike("name", f"%{query}%")
            
            response = db_query.limit(limit).execute()
            results = response.data or []
            
            formatted_results = []
            for item in results:
                # Reconstruir un "data" ligero
                light_data = {}
                if "level" in item and item["level"] is not None:
                    light_data["level"] = item["level"]
                if "equipment_category" in item and item["equipment_category"] is not None:
                    light_data["equipment_category"] = item["equipment_category"]
                if "challenge_rating" in item and item["challenge_rating"] is not None:
                    light_data["challenge_rating"] = item["challenge_rating"]
                if "type" in item and item["type"] is not None:
                    light_data["type"] = item["type"]

                formatted_results.append({
                    "name": item["name"],
                    "category": item["category"],
                    "index": item["index"],
                    "score": 100,  # ILIKE matches get 100 for now
                    "data": light_data
                })
            
            return formatted_results[:limit]
        except Exception as e:
            logger.error(f"Error searching encyclopedia: {e}")
            return []

    async def get_detail(self, category: str, index: str) -> dict:
        """Obtener datos completos de un item específico"""
        try:
            # 1. Intentar búsqueda exacta con categoría
            response = self.supabase.client.table("encyclopedia") \
                .select("data") \
                .eq("category", category) \
                .eq("index", index) \
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0].get("data")
            
            # 2. Si no se encuentra, buscar por index en CUALQUIER categoría (Failsafe)
            logger.warning(f"Detail not found for {category}/{index}. Trying global search...")
            global_response = self.supabase.client.table("encyclopedia") \
                .select("data") \
                .eq("index", index) \
                .limit(1) \
                .execute()
            
            if global_response.data and len(global_response.data) > 0:
                return global_response.data[0].get("data")
                
            # 3. Fallback a la API oficial (Sincronización On-demand)
            import httpx
            logger.info(f"Item {index} not found in DB. Fetching from official API...")
            
            # Intentar con la categoría proporcionada o mapeos comunes
            api_categories = [category]
            if category == 'equipment':
                api_categories = ['equipment', 'magic-items']
            
            async with httpx.AsyncClient() as client:
                for api_cat in api_categories:
                    try:
                        api_url = f"https://www.dnd5eapi.co/api/2014/{api_cat}/{index}"
                        api_res = await client.get(api_url)
                        if api_res.status_code == 200:
                            data = api_res.json()
                            # Guardar en DB para futuras consultas
                            self.supabase.client.table("encyclopedia").upsert({
                                "index": index,
                                "name": data.get("name", index),
                                "category": category, # Guardar con la categoría que pidió el usuario
                                "data": data
                            }).execute()
                            return data
                    except Exception as api_err:
                        logger.error(f"Error fetching from official API for {api_cat}/{index}: {api_err}")
            
            return {}
        except Exception as e:
            logger.error(f"Error getting detail for {category}/{index}: {e}")
            return {}

    def _get_full_data(self, category: str, name: str) -> dict:
        """Compatibilidad con código anterior: busca por nombre"""
        try:
            response = self.supabase.client.table("encyclopedia") \
                .select("data") \
                .eq("category", category) \
                .ilike("name", name) \
                .limit(1) \
                .execute()
            
            return response.data[0].get("data") if response.data else {}
        except Exception as e:
            logger.error(f"Error getting full data for {name}: {e}")
            return {}

    def analyze_note(self, note_content: str) -> dict:
        """
        Analizar nota buscando items, hechizos, etc.
        Retorna items y hechizos detectados sin usar Gemini.
        
        Phase 1 Optimized: Búsqueda rápida con:
        - Caché de búsquedas (no repetir mismo término)
        - Solo palabras grandes (>4 caracteres) para accuracy
        - Threshold alto (75%+ para items, 80%+ para spells)
        - Búsqueda prioritaria de frases sobre palabras individuales
        """
        self._ensure_loaded()
        logger.info("Analyzing note for D&D5e entities (optimized)...")

        note_lower = note_content.lower()
        words = note_lower.split()
        detected_items = []
        detected_spells = []
        
        # Cache de términos ya buscados para no repetir
        searched_terms = set()
        
        # Strategy 1: Buscar frases de 2-3 palabras PRIMERO (mejor precisión)
        phrases = []
        for i in range(len(words) - 1):
            phrase2 = f"{words[i]} {words[i+1]}".strip('.,!?;:\'"')
            if len(phrase2) >= 8 and phrase2 not in searched_terms:  # Min 8 chars para frase
                phrases.append(phrase2)
                searched_terms.add(phrase2)
            
            if i < len(words) - 2:
                phrase3 = f"{words[i]} {words[i+1]} {words[i+2]}".strip('.,!?;:\'"')
                if len(phrase3) >= 12 and phrase3 not in searched_terms:  # Min 12 chars
                    phrases.append(phrase3)
                    searched_terms.add(phrase3)
        
        # Buscar frases en items (más específicas)
        for phrase in phrases[:5]:  # Limitar a 5 frases para no ser muy lento
            item_results = self.search(phrase, categories=["items"], limit=1)
            if item_results and item_results[0]["score"] >= 75:  # Alto threshold
                detected_items.append({
                    "name": item_results[0]["name"],
                    "confidence": item_results[0]["score"],
                    "quantity": 1
                })

        # Strategy 2: Buscar palabras individuales (solo palabras largas)
        for word in set(words):
            if len(word) < 5:  # Solo palabras >= 5 caracteres (antes era 3)
                continue
            
            clean_word = word.strip('.,!?;:\'"')
            if len(clean_word) < 5 or clean_word in searched_terms:
                continue
            
            searched_terms.add(clean_word)

            # Buscar en items
            item_results = self.search(clean_word, categories=["items"], limit=1)
            if item_results and item_results[0]["score"] >= 78:  # Threshold más alto
                detected_items.append({
                    "name": item_results[0]["name"],
                    "confidence": item_results[0]["score"],
                    "quantity": 1
                })

            # Buscar en spells (threshold aún más alto)
            spell_results = self.search(clean_word, categories=["spells"], limit=1)
            if spell_results and spell_results[0]["score"] >= 80:
                detected_spells.append({
                    "name": spell_results[0]["name"],
                    "confidence": spell_results[0]["score"]
                })

        # Remover duplicados manteniendo el de mayor score
        detected_items = self._deduplicate(detected_items)
        detected_spells = self._deduplicate(detected_spells)
        detected_npcs = self._detect_npcs(note_content)

        logger.info(
            f"Detected {len(detected_items)} items, {len(detected_spells)} spells, "
            f"{len(detected_npcs)} NPCs (Phase 1 optimized)"
        )
        return {
            "detected_items": detected_items,
            "detected_spells": detected_spells,
            "detected_npcs": detected_npcs
        }

    def _detect_npcs(self, note_content: str) -> list:
        """
        Detectar NPCs con patrones regex mejorados.
        Phase 2 Enhancement: Múltiples strategies para aumentar accuracy.
        
        Strategies:
        1. Acción + nombre: "met X", "found X", "talked to X"
        2. Presentación: "X the [role]", "X the [class]"
        3. Attributión: "named X", "called X"
        4. Capitalización: Palabras capitalizadas (fallback)
        """
        import re
        
        npcs = {}  # name -> {confidence, sources}
        
        # ====================================================================
        # Strategy 1: Acción verbal + nombrero
        # Patterns: met X, found X, encountered X, talked to X, spoke with X
        # ====================================================================
        action_patterns = [
            r"(?:met|found|encountered|met with|talked to|spoke with|met up with)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)",
            r"(?:met|found|encountered|greeted|confronted|visited)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)",
        ]
        
        for pattern in action_patterns:
            for match in re.finditer(pattern, note_content, re.IGNORECASE):
                name = match.group(1).strip()
                if self._is_valid_npc_name(name):
                    if name not in npcs:
                        npcs[name] = {"confidence": 0, "sources": []}
                    npcs[name]["confidence"] = max(npcs[name]["confidence"], 85)  # Alta confianza
                    npcs[name]["sources"].append("action_verb")
        
        # ====================================================================
        # Strategy 2: Presentación "X the [role/class/descriptor]"
        # Patterns: "Gandalf the wizard", "Aragorn the ranger", "Grímnir the dwarf"
        # ====================================================================
        role_pattern = r"([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+the\s+([a-z]+(?:\s[a-z]+)?)"
        for match in re.finditer(role_pattern, note_content):
            name = match.group(1).strip()
            role = match.group(2).strip()
            # Validar que es probablemente un rol/clase/descriptor
            common_roles = ['wizard', 'warrior', 'ranger', 'rogue', 'cleric', 'paladin', 
                           'sorcerer', 'barbarian', 'bard', 'druid', 'monk', 'fighter',
                           'dwarf', 'elf', 'human', 'halfling', 'orc', 'tiefling',
                           'king', 'queen', 'lord', 'lady', 'priest', 'guard', 'knight',
                           'innkeeper', 'merchant', 'blacksmith', 'baker', 'guard captain']
            if role.lower() in common_roles and self._is_valid_npc_name(name):
                if name not in npcs:
                    npcs[name] = {"confidence": 0, "sources": []}
                npcs[name]["confidence"] = max(npcs[name]["confidence"], 90)  # Muy alta confianza
                npcs[name]["sources"].append("role_presentation")
        
        # ====================================================================
        # Strategy 3: Attributión "named X", "called X"
        # ====================================================================
        attribution_patterns = [
            r"(?:named|called|known as)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)",
        ]
        
        for pattern in attribution_patterns:
            for match in re.finditer(pattern, note_content, re.IGNORECASE):
                name = match.group(1).strip()
                if self._is_valid_npc_name(name):
                    if name not in npcs:
                        npcs[name] = {"confidence": 0, "sources": []}
                    npcs[name]["confidence"] = max(npcs[name]["confidence"], 80)
                    npcs[name]["sources"].append("attribution")
        
        # ====================================================================
        # Strategy 4: Capitalización simple (fallback)
        # Solo si tiene 3+ palabras capitalizadas o aparece múltiples veces
        # ====================================================================
        capitalized = re.findall(r'\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b', note_content)
        capitalized_counts = {}
        for name in capitalized:
            capitalized_counts[name] = capitalized_counts.get(name, 0) + 1
        
        for name, count in capitalized_counts.items():
            if self._is_valid_npc_name(name):
                if name not in npcs:
                    # Solo agregar si aparece 2+ veces O tiene 2+ palabras capitalizadas
                    if count >= 2 or len(name.split()) >= 2:
                        confidence = 60 + min(count * 10, 20)  # Máx 80
                        npcs[name] = {"confidence": confidence, "sources": ["capitalization"]}
        
        # ====================================================================
        # Convertir a lista y ordenar por confianza
        # ====================================================================
        result = [
            {
                "name": name,
                "confidence": info["confidence"],
                "sources": info["sources"]
            }
            for name, info in npcs.items()
        ]
        
        # Ordenar por confianza descendente
        result.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Máximo 10 NPCs, filtrar confianza < 50
        result = [npc for npc in result if npc["confidence"] >= 50][:10]
        
        logger.info(f"NPC Detection: Found {len(result)} NPCs using advanced patterns")
        return result
    
    def _is_valid_npc_name(self, name: str) -> bool:
        """Validar que un nombre es probablemente un NPC (no stop-words comunes)"""
        stop_words = {
            'The', 'And', 'Or', 'In', 'To', 'At', 'For', 'Of', 'From', 'By', 'As',
            'Is', 'Are', 'Was', 'Were', 'Be', 'Been', 'Have', 'Has', 'Do', 'Does',
            'Did', 'Will', 'Would', 'Should', 'Could', 'Can', 'May', 'Might',
            'Encontramos', 'Conocimos', 'Hablamos', 'Vimos'  # Spanish common words
        }
        
        if name in stop_words or len(name) < 2:
            return False
        
        # No es un nombre si es un número o tiene demasiados espacios
        if name.isdigit() or len(name.split()) > 4:
            return False
        
        return True

    def _deduplicate(self, items: list) -> list:
        """Remover duplicados por nombre, manteniendo el de mayor score"""
        seen = {}
        for item in items:
            name = item["name"].lower()
            if name not in seen or item["confidence"] > seen[name]["confidence"]:
                seen[name] = item
        return list(seen.values())


def get_dnd5e_searcher() -> DND5ESearcher:
    """Factory para obtener instancia del buscador"""
    return DND5ESearcher()

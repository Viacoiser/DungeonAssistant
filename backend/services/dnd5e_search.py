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

logger = logging.getLogger(__name__)


class DND5ESearcher:
    """Búsqueda fuzzy local para datos D&D5e"""

    def __init__(self):
        """Inicializar pero NO cargar datos hasta la primera búsqueda (lazy loading)"""
        # Ruta: backend/services/dnd5e_search.py -> parent.parent.parent = raiz -> frontend/src/data
        self.data_path = Path(__file__).parent.parent.parent / "frontend" / "src" / "data"
        self.cache = {}
        self._loaded = False
        logger.info(f"DND5ESearcher initialized (lazy loading from {self.data_path})")

    def _ensure_loaded(self):
        """Lazy load: cargar datos solo si no están cargados"""
        if self._loaded:
            return
        logger.info(f"Loading D&D5e data on first use...")
        self._load_all_data()
        self._loaded = True

    def _load_all_data(self):
        """Cargar todos los JSONs disponibles"""
        json_files = {
            "items": "items.json",
            "classes": "classes.json",
            "races": "races.json",
            "feats": "dnd-feats.json",
            "spells": "dnd-classes.json",  # TODO: cambiar a archivo de spells cuando disponible
            "backgrounds": "backgrounds.json",
            "subclasses": "dnd-subclasses.json",
            "traits": "dnd-traits.json",
        }

        for key, filename in json_files.items():
            filepath = self.data_path / filename
            if filepath.exists():
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Handle nested structure
                    if isinstance(data, dict):
                        if key in data:
                            self.cache[key] = data[key]
                        elif "results" in data:
                            # API response format
                            self.cache[key] = data["results"]
                        else:
                            self.cache[key] = data
                    else:
                        self.cache[key] = data
                    
                    entry_count = len(self.cache[key]) if isinstance(self.cache[key], list) else len(self.cache[key])
                    logger.info(f"Loaded {key}: {filename} ({entry_count} entries)")
                except Exception as e:
                    logger.error(f"Error loading {filename}: {e}")
            else:
                logger.warning(f"File not found: {filepath}")

    def search(self, query: str, categories: list = None, limit: int = 5) -> list:
        """
        Búsqueda fuzzy en categorías específicas o todas.
        
        Args:
            query: Término de búsqueda (ej: "sword", "fireball")
            categories: Lista de categorías (ej: ["items", "spells"]) o None para todas
            limit: Cantidad de resultados
        
        Returns:
            Lista de resultados con score de similitud
        """
        self._ensure_loaded()
        
        if not categories:
            categories = list(self.cache.keys())

        query_lower = query.lower()
        results = []

        for category in categories:
            if category not in self.cache:
                logger.warning(f"Category {category} not found")
                continue

            data = self.cache[category]
            candidates = self._extract_names(data, category)

            if not candidates:
                continue

            # Fuzzy matching con fuzzywuzzy
            matches = process.extract(
                query_lower,
                candidates,
                scorer=fuzz.token_set_ratio,
                limit=limit
            )

            for match_name, score in matches:
                if score >= 60:  # Solo resultados con 60% similitud o más
                    results.append({
                        "name": match_name,
                        "category": category,
                        "score": score,
                        "data": self._get_full_data(category, match_name)
                    })

        # Ordenar por score descendente
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]

    def _extract_names(self, data: list, category: str) -> list:
        """Extraer nombres de items/spells/etc según categoría"""
        names = []

        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    # Intentar varios campos comunes de nombre
                    name = (
                        item.get("name") or
                        item.get("title") or
                        item.get("index") or
                        ""
                    )
                    if name:
                        names.append(name.lower())
        elif isinstance(data, dict):
            # Si es diccionario, obtener las llaves como nombres
            for key in data.keys():
                names.append(key.lower())

        return names

    def _get_full_data(self, category: str, name: str) -> dict:
        """Obtener datos completos de un item/spell/etc"""
        data = self.cache.get(category, [])

        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    item_name = (
                        item.get("name") or
                        item.get("title") or
                        item.get("index") or
                        ""
                    ).lower()
                    if item_name == name.lower():
                        return item
        elif isinstance(data, dict):
            if name.lower() in data or name in data:
                return data.get(name, {})

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

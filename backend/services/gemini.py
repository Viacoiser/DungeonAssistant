"""
Servicio de Gemini para IA - Function Calling + RAG
"""

import logging
import os
import json
import asyncio
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()


logger = logging.getLogger(__name__)

# ============================================================================
# FUNCTION DECLARATIONS para Function Calling
# ============================================================================

add_item_fn = FunctionDeclaration(
    name="add_item_to_inventory",
    description="Agrega un item al inventario cuando se detecta en una nota de sesion",
    parameters={
        "type": "object",
        "properties": {
            "item_name": {
                "type": "string",
                "description": "Nombre del item encontrado"
            },
            "quantity": {
                "type": "integer",
                "description": "Cantidad del item (por defecto 1)"
            },
            "is_magical": {
                "type": "boolean",
                "description": "Si el item es magico o encantado"
            },
            "description": {
                "type": "string",
                "description": "Descripcion breve del item"
            }
        },
        "required": ["item_name", "quantity", "is_magical"]
    }
)

register_npc_fn = FunctionDeclaration(
    name="register_npc",
    description="Registra un NPC cuando aparece por primera vez en una nota de sesion",
    parameters={
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Nombre del NPC"
            },
            "description": {
                "type": "string",
                "description": "Descripcion breve del NPC"
            },
            "relationship": {
                "type": "string",
                "description": "Relacion con el grupo: aliado, enemigo, neutral, desconocido"
            }
        },
        "required": ["name", "description", "relationship"]
    }
)

session_tools = Tool(function_declarations=[add_item_fn, register_npc_fn])


class GeminiService:
    """Servicio centralizado de Gemini"""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY debe estar en .env")

        genai.configure(api_key=api_key)

        # Modelos a intentar en orden de preferencia
        self.available_models = [
            "gemini-3.1-flash-lite",  # Preferido
            "gemini-3-flash",         # Alternativa
            "gemini-2.5-flash",       # Alternativa
            "gemini-2.5-flash-lite",  # Fallback
            "gemini-2.0-flash-exp",   # Fallback
            "gemini-1.5-pro",         # Último recurso
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-pro-vision"
        ]
        
        # Track exhausted models en esta sesión
        self.exhausted_models = set()
        
        self.model = None
        self.vision_model = None
        self.model_name = None
        
        # Intentar inicializar con cada modelo disponible
        for model_name in self.available_models:
            try:
                test_model = genai.GenerativeModel(model_name)
                # Hacer una llamada de prueba para verificar que realmente funciona
                test_response = test_model.generate_content("test")
                # Si llegamos aquí sin error, el modelo está disponible
                self.model = test_model
                self.vision_model = test_model
                self.model_name = model_name
                logger.info(f"✓ Gemini Service initialized with {model_name}")
                break
            except Exception as e:
                logger.debug(f"  Model {model_name} not available: {str(e)[:80]}")
                continue
        
        if not self.model:
            logger.error("❌ No Gemini models available! Check your API key.")
            logger.error(f"   Available models tried: {', '.join(self.available_models)}")
            logger.error(f"   Verify your API key works at: https://aistudio.google.com")
            # Usar un dummy model para que no falle el servidor
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
            self.vision_model = self.model
            self.model_name = "UNAVAILABLE"

    def _rotate_model_on_exhaustion(self):
        """
        Cuando un modelo se agota (429 quota exceeded), cambiar al siguiente disponible.
        Intenta los modelos no marcados como agotados.
        """
        logger.warning(f"⚠️ Model {self.model_name} exhausted! Rotating to next available...")
        
        # Marcar el modelo actual como agotado
        self.exhausted_models.add(self.model_name)
        
        # Intentar modelos no agotados
        for model_name in self.available_models:
            if model_name in self.exhausted_models:
                logger.debug(f"  Skipping {model_name} (already exhausted)")
                continue
            
            try:
                logger.info(f"  Trying model: {model_name}")
                test_model = genai.GenerativeModel(model_name)
                test_response = test_model.generate_content("test")
                
                # Éxito! Usar este modelo
                self.model = test_model
                self.vision_model = test_model
                self.model_name = model_name
                logger.info(f"✓ Rotated to {model_name} successfully")
                return True
            except Exception as e:
                error_msg = str(e)[:100]
                if "429" in error_msg or "ResourceExhausted" in error_msg or "quota" in error_msg.lower():
                    logger.warning(f"  Model {model_name} also exhausted")
                    self.exhausted_models.add(model_name)
                else:
                    logger.debug(f"  Model {model_name} not available: {error_msg}")
                continue
        
        # Si llegamos aquí, todos los modelos están agotados o no disponibles
        logger.error("❌ All models exhausted or unavailable!")
        self.model_name = "UNAVAILABLE"
        return False

    def _handle_quota_error(self, error: Exception, operation: str = "operation") -> bool:
        """
        Detectar y manejar errores de cuota automáticamente.
        Retorna True si se rotó el modelo exitosamente.
        """
        error_str = str(error)
        error_type = str(type(error).__name__)
        
        # Detectar error de cuota agotada
        is_quota_error = (
            "429" in error_str or 
            "ResourceExhausted" in error_type or 
            "quota" in error_str.lower() or
            "exceeded" in error_str.lower()
        )
        
        if is_quota_error:
            logger.warning(f"⚠️ Quota exceeded on {operation}: {error_str[:100]}")
            return self._rotate_model_on_exhaustion()
        
        return False

    # ========================================================================
    # FUNCTION CALLING: Analizar nota de sesion
    # ========================================================================

    async def analyze_session_note(self, note_content: str, context: dict = None) -> dict:
        """
        Detectar items y NPCs en una nota de sesion usando JSON estructurado.
        Es más confiable que Function Calling para este caso de uso.
        """
        logger.info("Analizando nota de sesion...")

        truncated_note = note_content[:2000] if len(note_content) > 2000 else note_content
        
        # Construir contexto si existe
        context_text = ""
        if context:
            campaign_name = context.get("campaign_name", "")
            player_name = context.get("player_name", "")
            character_name = context.get("character_name", "")
            character_class = context.get("character_class", "")
            character_race = context.get("character_race", "")
            party_members = context.get("party_members", [])
            
            if campaign_name or character_name:
                context_text = (
                    "=== CONTEXTO DE LA CAMPAÑA Y PERSONAJES ===\n"
                    f"Campaña: {campaign_name}\n"
                    f"Jugador: {player_name}\n"
                    f"Personaje Activo: {character_name} ({character_race} {character_class})\n"
                )
                if party_members:
                    context_text += "Otros personajes del grupo:\n"
                    for member in party_members[:5]:
                        context_text += f"  - {member.get('name', '?')} ({member.get('race', '?')} {member.get('class', '?')})\n"
                context_text += "\n"

        prompt = (
            "Eres un analizador de notas de D&D. Extrae TODOS los items y NPCs mencionados.\n\n"
            "INSTRUCCIONES:\n"
            "1. Busca TODOS los items (armas, armaduras, pociones, objetos, etc) - SER EXHAUSTIVO\n"
            "2. Busca TODOS los NPCs mencionados por nombre\n"
            "3. Devuelve SOLO JSON válido, nada más\n\n"
            f"{context_text}"
            "NOTA DE SESIÓN:\n"
            f"\"\"\"{truncated_note}\"\"\"\n\n"
            "Devuelve JSON exactamente con este formato (solo JSON, nada de texto antes ni después):\n"
            "{\n"
            '  "detected_items": [\n'
            '    {"name": "longsword", "quantity": 1, "is_magical": false, "description": "arma común"}\n'
            "  ],\n"
            '  "detected_npcs": [\n'
            '    {"name": "Muradin", "description": "compañero de aventuras", "relationship": "aliado"}\n'
            "  ]\n"
            "}\n"
        )

        def _call():
            if self.model_name == "UNAVAILABLE":
                logger.debug("Model unavailable, returning empty")
                return type('obj', (object,), {
                    'text': '{"detected_items": [], "detected_npcs": []}'
                })()
            return self.model.generate_content(prompt)

        try:
            response = await asyncio.to_thread(_call)

            detected_items = []
            detected_npcs = []
            
            logger.debug(f"Response type: {type(response)}")
            
            # Intentar extraer JSON de la respuesta
            response_text = ""
            if hasattr(response, 'text'):
                response_text = response.text
                logger.debug(f"Response text: {response_text[:200]}")
            
            # Parsear JSON
            try:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    logger.debug(f"Extracted JSON: {json_str}")
                    data = json.loads(json_str)
                    detected_items = data.get("detected_items", [])
                    detected_npcs = data.get("detected_npcs", [])
                    
                    logger.info(f"✓ Parsed JSON: {len(detected_items)} items, {len(detected_npcs)} NPCs")
                else:
                    logger.warning("❌ No JSON found in response")
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON parse error: {e}")
                logger.debug(f"Full response text: {response_text}")

            if detected_items:
                for item in detected_items:
                    logger.info(f"  ✓ Item detected: {item.get('name', '?')} (qty: {item.get('quantity', 1)})")
            
            if detected_npcs:
                for npc in detected_npcs:
                    logger.info(f"  ✓ NPC detected: {npc.get('name', '?')}")

            logger.info(f"✓ Analysis complete: {len(detected_items)} items, {len(detected_npcs)} NPCs")
            return {
                "detected_items": detected_items,
                "detected_npcs": detected_npcs
            }

        except Exception as e:
            error_str = str(e)
            
            # Detectar error de cuota agotada
            if "429" in error_str or "ResourceExhausted" in str(type(e)) or "quota" in error_str.lower():
                logger.warning(f"⚠️ Quota exceeded on analyze_session_note: {error_str[:100]}")
                
                # Intentar rotar a otro modelo
                if self._rotate_model_on_exhaustion():
                    logger.info("🔄 Retrying analyze_session_note with new model...")
                    # Recursively retry con el nuevo modelo
                    return await self.analyze_session_note(note_content, context)
                else:
                    logger.error("❌ All models exhausted, cannot retry")
                    return {"detected_items": [], "detected_npcs": []}
            
            logger.error(f"❌ Error en analyze_session_note: {e}", exc_info=True)
            return {"detected_items": [], "detected_npcs": []}

    # ========================================================================
    # RAG: Asistente conversacional con contexto limitado
    # ========================================================================

    def _get_rag_context(self, db_client, campaign_id: str) -> dict:
        """
        Obtener contexto RAG de forma sincrónica
        (El cliente de Supabase es sincrónico, no asincrónico)
        """
        try:
            # Obtener entidades
            try:
                entities_result = db_client.table("rag_entities").select("*").match({
                    "campaign_id": campaign_id
                }).order("mention_count", desc=True).limit(10).execute()
            except Exception as e:
                logger.debug(f"RAG entities table not available: {str(e)[:30]}")
                entities_result = type('obj', (object,), {'data': []})()
            
            # Agrupar por tipo
            entities_by_type = {}
            for entity in entities_result.data or []:
                entity_type = entity.get("entity_type", "OTHER")
                if entity_type not in entities_by_type:
                    entities_by_type[entity_type] = []
                entities_by_type[entity_type].append(entity)
            
            # Obtener eventos (últimas sesiones)
            try:
                events_result = db_client.table("rag_events").select("*").match({
                    "campaign_id": campaign_id
                }).order("session_number", desc=True).limit(5).execute()
            except Exception as e:
                logger.debug(f"RAG events table not available: {str(e)[:30]}")
                events_result = type('obj', (object,), {'data': []})()
            
            return {
                "npcs": entities_by_type.get("NPC", []),
                "locations": entities_by_type.get("LOCATION", []),
                "quests": entities_by_type.get("QUEST", []),
                "items": entities_by_type.get("ITEM", []),
                "events": events_result.data or [],
                "total_entities": len(entities_result.data or [])
            }
        except Exception as e:
            logger.warn(f"RAG context fallback: {e}")
            return {
                "npcs": [],
                "locations": [],
                "quests": [],
                "items": [],
                "events": [],
                "total_entities": 0
            }

    async def chat_assistant(self, context: dict, question: str) -> dict:
        """
        Asistente RAG simple (Phase 3).
        
        Flow:
        1. Obtener contexto de RAG desde BD (si existe)
        2. Combinar con contexto tradicional (lore, NPCs, notas recientes)
        3. Generar respuesta con contexto estructurado
        4. Rastrear token usage
        
        Returns:
        {
            "answer": str,
            "tokens_estimated": int,
            "response_time_ms": int,
            "rag_entities_total": int
        }
        """
        import time
        start_time = time.time()
        
        try:
            from services.supabase import SupabaseClient
            
            logger.info(f"Respondiendo pregunta con RAG: {question[:60]}...")
            
            campaign_id = context.get("campaign_id")
            campaign_name = context.get("campaign_name", "la campaña")
            lore_summary = context.get("lore_summary", "")
            recent_notes = context.get("recent_notes", [])
            npcs_context = context.get("npcs", [])
            characters_context = context.get("characters", [])
            
            # ================================================================
            # CONSTRUIR CONTEXTO COMPLETO
            # ================================================================
            
            context_text = f"Eres el Asistente del Dungeon Master para la campaña de D&D \"{campaign_name}\".\n\n"
            
            # Lore de la campaña
            if lore_summary:
                context_text += f"=== LORE DE LA CAMPAÑA ===\n{lore_summary}\n\n"
            
            # Personajes jugadores (characters)
            if characters_context:
                context_text += "=== PERSONAJES JUGADORES ===\n"
                for char in characters_context[:10]:
                    char_name = char.get("name", "Unknown")
                    char_class = char.get("class", "?")
                    char_race = char.get("race", "?")
                    char_level = char.get("level", 1)
                    char_backstory = char.get("backstory", "")
                    char_personality = char.get("personality_traits", "")
                    char_ideals = char.get("ideals", "")
                    char_bonds = char.get("bonds", "")
                    char_flaws = char.get("flaws", "")
                    
                    context_text += f"\n{char_name} ({char_race} {char_class}, Nivel {char_level})\n"
                    
                    if char_backstory:
                        context_text += f"  📖 Trasfondo: {char_backstory[:150]}\n"
                    if char_personality:
                        context_text += f"  💭 Personalidad: {char_personality[:100]}\n"
                    if char_ideals:
                        context_text += f"  ⚖️ Ideales: {char_ideals[:100]}\n"
                    if char_bonds:
                        context_text += f"  🤝 Vínculos: {char_bonds[:100]}\n"
                    if char_flaws:
                        context_text += f"  ⚠️ Defectos: {char_flaws[:100]}\n"
                
                context_text += "\n"
            
            # NPCs conocidos (del contexto tradicional)
            if npcs_context:
                context_text += "=== NPCs CONOCIDOS ===\n"
                for npc in npcs_context[:10]:
                    npc_name = npc.get("name", "Unknown")
                    relationship = npc.get("relationship_to_party", "neutral")
                    context_text += f"- {npc_name} ({relationship})\n"
                context_text += "\n"
            
            # Notas recientes
            if recent_notes:
                context_text += "=== NOTAS DE SESIONES RECIENTES ===\n"
                for note in recent_notes[:6]:
                    content = note.get("content", "")[:100]
                    created = note.get("created_at", "")
                    context_text += f"- {content}... ({created})\n"
                context_text += "\n"
            
            # ================================================================
            # OBTENER CONTEXTO DE RAG (si tabla existe)
            # ================================================================
            
            rag_entities_total = 0
            rag_npcs_count = 0
            rag_items_count = 0
            
            if campaign_id:
                try:
                    supabase_client = SupabaseClient()
                    
                    # Obtener contexto RAG usando executor (cliente es sync)
                    loop = asyncio.get_event_loop()
                    rag_data = await loop.run_in_executor(
                        None,
                        lambda: self._get_rag_context(supabase_client.client, campaign_id)
                    )
                    rag_entities_total = rag_data.get("total_entities", 0) if rag_data else 0
                    
                    # Formatear contexto RAG (si hay datos)
                    npcs_rag = rag_data.get("npcs", [])
                    items_rag = rag_data.get("items", [])
                    rag_npcs_count = len(npcs_rag)
                    rag_items_count = len(items_rag)
                    
                    if npcs_rag or items_rag:
                        context_text += "=== ENTIDADES DEL RAG (más mencionadas) ===\n"
                        for npc in npcs_rag[:5]:
                            npc_name = npc.get('entity_name', '?')
                            mention_count = npc.get('mention_count', 0)
                            description = npc.get('description', "")
                            attributes = npc.get('attributes', {}) or {}
                            attr_desc = attributes.get('description', "")
                            attr_rel = attributes.get('relationship', "")
                            
                            # Construir línea con información disponible
                            info = f"- {npc_name} ({mention_count} menciones)"
                            if attr_desc:
                                info += f" - {attr_desc}"
                            elif description:
                                info += f" - {description}"
                            if attr_rel:
                                info += f" [{attr_rel}]"
                            
                            context_text += info + "\n"
                        for item in items_rag[:5]:
                            context_text += f"- {item.get('entity_name')} (item)\n"
                        context_text += "\n"
                    
                    logger.info(f"✓ RAG context: {rag_entities_total} total ({rag_npcs_count} NPCs, {rag_items_count} items)")
                
                except Exception as e:
                    logger.debug(f"⚠ RAG no disponible (usando contexto tradicional): {str(e)[:50]}")
            
            # Registrar qué contexto se usó
            logger.info(f"  Context used: Characters={len(characters_context)}, NPCs={len(npcs_context)}, Notes={len(recent_notes)}, Lore={'yes' if lore_summary else 'no'}, RAG={rag_entities_total}")
            
            # ================================================================
            # GENERAR PROMPT CON CONTEXTO COMPLETO
            # ================================================================
            
            prompt = f"""{context_text}
Responde de forma concisa y útil basándote en el contexto disponible.
Si la información específica no está en el contexto, dilo claramente.

=== PREGUNTA DEL JUGADOR ===
{question}

Responde en español, de forma concisa (máximo 3 párrafos):"""
            
            # ================================================================
            # GENERAR RESPUESTA CON GEMINI
            # ================================================================
            
            def _call():
                if self.model_name == "UNAVAILABLE":
                    raise ValueError(
                        "❌ No hay modelos de Gemini disponibles.\n"
                        "Verifica tu API key en Google AI Studio."
                    )
                return self.model.generate_content(prompt)
            
            response = await asyncio.to_thread(_call)
            answer = response.text.strip()
            
            response_time = time.time() - start_time
            
            logger.info(f"✓ Chat response generated ({response_time:.2f}s)")
            
            # ================================================================
            # RESPONDER CON METADATA
            # ================================================================
            
            return {
                "answer": answer,
                "response_time_ms": int(response_time * 1000),
                "rag_entities_total": rag_entities_total
            }
        
        except Exception as e:
            error_str = str(e)
            
            # Detectar error de cuota agotada
            if "429" in error_str or "ResourceExhausted" in str(type(e)) or "quota" in error_str.lower():
                logger.warning(f"⚠️ Quota exceeded on chat_assistant: {error_str[:100]}")
                
                # Intentar rotar a otro modelo
                if self._rotate_model_on_exhaustion():
                    logger.info("🔄 Retrying chat_assistant with new model...")
                    # Recursively retry con el nuevo modelo
                    return await self.chat_assistant(context, question)
                else:
                    logger.error("❌ All models exhausted, cannot retry")
                    return {
                        "answer": "Lo siento, los servicios de IA están sobrecargados. Por favor intenta en unos minutos.",
                        "response_time_ms": int((time.time() - start_time) * 1000),
                        "rag_entities_total": 0
                    }
            
            logger.error(f"Error en chat_assistant: {e}", exc_info=True)
            # Retornar error en lugar de hacer raise para no romper el endpoint
            return {
                "answer": f"Error generando respuesta: {str(e)[:100]}",
                "response_time_ms": int((time.time() - start_time) * 1000),
                "rag_entities_total": 0
            }

    # ========================================================================
    # Generar NPC con contexto de campana
    # ========================================================================

    async def generate_npc(self, context: dict, prompt: str) -> dict:
        """Generar NPC coherente con el mundo de la campana"""
        logger.info(f"Generando NPC con prompt: {prompt[:50]}...")

        campaign_name = context.get("campaign_name") or "la campana"
        lore_summary = (context.get("lore_summary") or "")[:500]
        existing_npcs = context.get("npcs") or []
        existing_names = [n.get("name", "") for n in existing_npcs[:5]]

        full_prompt = (
            f"Eres un generador de NPCs para D&D 5e en la campana \"{campaign_name}\".\n\n"
            f"Trasfondo de la campana: {lore_summary if lore_summary else 'Mundo de fantasia generico'}\n"
            f"NPCs existentes: {', '.join(existing_names) if existing_names else 'ninguno'}\n\n"
            f"Genera un NPC para: {prompt}\n\n"
            "Responde UNICAMENTE con un JSON valido con esta estructura exacta:\n"
            "{\n"
            "  \"name\": \"Nombre del NPC\",\n"
            "  \"race\": \"Raza (elf, human, dwarf, etc.)\",\n"
            "  \"personality\": \"Descripcion de personalidad breve, pero asegurate que encaje con la persona.\",\n"
            "  \"secrets\": \"Un secreto interesante que tiene\",\n"
            "  \"relationship_to_party\": \"aliado | enemigo | neutral\",\n"
            "  \"skills\": \"Percepcion +2, Persuasion +4 (o vacio)\",\n"
            "  \"stats\": {\n"
            "    \"STR\": \"+1\",\n"
            "    \"DEX\": \"0\",\n"
            "    \"CON\": \"+2\",\n"
            "    \"INT\": \"-1\",\n"
            "    \"WIS\": \"0\",\n"
            "    \"CHA\": \"+1\",\n"
            "    \"HP\": 30,\n"
            "    \"AC\": 12,\n"
            "    \"CR\": 1\n"
            "  }\n"
            "}"
        )

        def _call():
            if self.model_name == "UNAVAILABLE":
                raise ValueError(
                    "❌ No hay modelos de Gemini disponibles.\n"
                    "Verifica tu API key en Google AI Studio.\n"
                    "Modelos disponibles: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash, gemini-pro"
                )
            return self.model.generate_content(full_prompt)

        try:
            response = await asyncio.to_thread(_call)
            text = response.text.strip()

            # Limpiar markdown si Gemini lo envuelve en ```json
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1])

            npc_data = json.loads(text)
            logger.info(f"NPC generado: {npc_data.get('name', 'desconocido')}")
            return npc_data

        except json.JSONDecodeError as e:
            logger.error(f"Error parseando JSON del NPC: {e}")
            return {
                "name": "NPC Generado",
                "race": "human",
                "personality": prompt,
                "secrets": "Desconocido",
                "relationship_to_party": "neutral",
                "stats": {"CR": 1, "HP": 20, "AC": 10}
            }
        except ValueError as e:
            # Error de API no disponible
            logger.error(f"Error en generate_npc: {e}")
            # Generar NPC básico desde el prompt
            import random
            races = ["human", "elf", "dwarf", "halfling", "dragonborn", "gnome", "tiefling"]
            personalities = [
                "Aventurero y audaz",
                "Cauteloso y reflexivo",
                "Misterioso y enigmático",
                "Amable y compasivo",
                "Astuto y calculador",
                "Leal y honorable"
            ]
            relationships = ["aliado", "enemigo", "neutral"]
            
            # Extraer nombre del prompt si es posible
            name_hint = prompt[:50] if prompt else "NPC"
            
            return {
                "name": f"NPC #{random.randint(100, 999)}",
                "race": random.choice(races),
                "personality": f"{name_hint} - {random.choice(personalities)}",
                "secrets": "Guarda un secreto importante para la campaña",
                "relationship_to_party": random.choice(relationships),
                "skills": "Varia según la clase",
                "stats": {
                    "STR": str(random.randint(-2, 3)),
                    "DEX": str(random.randint(-2, 3)),
                    "CON": str(random.randint(-2, 3)),
                    "INT": str(random.randint(-2, 3)),
                    "WIS": str(random.randint(-2, 3)),
                    "CHA": str(random.randint(-2, 3)),
                    "HP": random.randint(15, 50),
                    "AC": random.randint(10, 16),
                    "CR": round(random.uniform(0.5, 3), 1)
                },
                "warning": "⚠️ API de Gemini no disponible. NPC generado con valores aleatorios. Edita manualmente para personalizarlo."
            }
        except Exception as e:
            error_str = str(e)
            
            # Detectar error de cuota agotada
            if self._handle_quota_error(e, "generate_npc"):
                logger.info("🔄 Retrying generate_npc with new model...")
                # Recursively retry con el nuevo modelo
                return await self.generate_npc(context, prompt)
            
            logger.error(f"Error en generate_npc: {e}", exc_info=True)
            # Retornar NPC fallback en lugar de fallar completamente
            return {
                "name": "NPC Generado",
                "race": "human",
                "personality": prompt,
                "secrets": "Desconocido",
                "relationship_to_party": "neutral",
                "stats": {"CR": 1, "HP": 20, "AC": 10},
                "error": str(e)[:100]
            }

    # ========================================================================
    # Generar resumen de sesion
    # ========================================================================

    async def generate_session_summary(self, notes: list) -> str:
        """Generar resumen de sesion a partir de las notas"""
        logger.info("Generando resumen de sesion...")

        if not notes:
            return "Sesion sin notas registradas."

        notes_text = "\n\n".join([
            f"Nota de {n.get('author', 'jugador')}: {n.get('content', '')[:500]}"
            for n in notes[:10]
        ])

        prompt = (
            "Resume esta sesion de D&D en 3-5 oraciones concisas.\n"
            "Incluye los eventos principales, decisiones importantes y cualquier item o NPC relevante.\n\n"
            f"Notas de la sesion:\n{notes_text}\n\nResumen:"
        )

        def _call():
            if self.model_name == "UNAVAILABLE":
                return type('obj', (object,), {
                    'text': "Resumen no disponible - API de Gemini no configurada."
                })()
            return self.model.generate_content(prompt)

        try:
            response = await asyncio.to_thread(_call)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error en generate_session_summary: {e}")
            return "No se pudo generar el resumen automaticamente."

    # ========================================================================
    # OCR: Hoja de personaje
    # ========================================================================

    async def generate_npc_trait(self, context_str: str) -> str:
        """Genera un rasgo de personalidad distintivo y aleatorio para un NPC."""
        prompt = (
            f"Basado en este NPC:\n{context_str}\n\n"
            "Genera UN ÚNICO rasgo distintivo, manía, hábito o característica física muy breve para rolearlo de inmediato. "
            "Ejemplos: Habla muy rápido, Huele fuertemente a lavanda, Tiene un tic en el ojo izquierdo. "
            "No uses comillas. Solo la frase."
        )
        def _call():
            if self.model_name == "UNAVAILABLE":
                return type('obj', (object,), {
                    'text': "Rasgo no disponible"
                })()
            return self.model.generate_content(prompt)
        try:
            response = await asyncio.to_thread(_call)
            return response.text.strip().replace('\"', '')
        except Exception as e:
            logger.error(f"Error generando rasgo: {e}")
            return "Tiene un tic nervioso"

    async def ocr_character_sheet(self, image_url: str) -> dict:
        """OCR de hoja de personaje D&D 5e con Gemini Vision"""
        logger.info("Procesando OCR de imagen...")
        return {
            "character_name": None,
            "race": None,
            "class": None,
            "stats": None,
            "low_confidence_fields": [],
            "unreadable_fields": [],
        }


def get_gemini_service() -> GeminiService:
    """Obtener instancia del servicio Gemini"""
    return GeminiService()


if __name__ == "__main__":
    """Script para listar todos los modelos disponibles en Gemini"""
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY no está configurada en .env")
        sys.exit(1)
    
    genai.configure(api_key=api_key)
    
    print("=" * 80)
    print("MODELOS DE GEMINI DISPONIBLES")
    print("=" * 80)
    
    try:
        for i, model in enumerate(genai.list_models(), 1):
            print(f"\n{i}. {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Version: {model.version if hasattr(model, 'version') else 'N/A'}")
            print(f"   Supported Methods: {', '.join(model.supported_generation_methods) if hasattr(model, 'supported_generation_methods') else 'N/A'}")
            print(f"   Input Token Limit: {model.input_token_limit if hasattr(model, 'input_token_limit') else 'N/A'}")
            print(f"   Output Token Limit: {model.output_token_limit if hasattr(model, 'output_token_limit') else 'N/A'}")
    except Exception as e:
        print(f"Error listando modelos: {e}")
        sys.exit(1)
    
    print("\n" + "=" * 80)

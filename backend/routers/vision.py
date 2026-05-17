import os
import re
import json
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from PIL import Image, ImageEnhance, ImageFilter
import io

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vision", tags=["vision"])

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    import google.generativeai as genai
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
        logger.info("Gemini API configurada")
    else:
        logger.warning("GEMINI_API_KEY no encontrada")
except Exception as e:
    logger.error(f"Error al configurar Gemini: {e}")

class StatBlock(BaseModel):
    strength: Optional[int] = None
    dexterity: Optional[int] = None
    constitution: Optional[int] = None
    intelligence: Optional[int] = None
    wisdom: Optional[int] = None
    charisma: Optional[int] = None

class ProficientExpert(BaseModel):
    proficient: bool = False
    expertise: bool = False

class SavingThrows(BaseModel):
    strength: ProficientExpert = Field(default_factory=ProficientExpert)
    dexterity: ProficientExpert = Field(default_factory=ProficientExpert)
    constitution: ProficientExpert = Field(default_factory=ProficientExpert)
    intelligence: ProficientExpert = Field(default_factory=ProficientExpert)
    wisdom: ProficientExpert = Field(default_factory=ProficientExpert)
    charisma: ProficientExpert = Field(default_factory=ProficientExpert)

class Attack(BaseModel):
    name: Optional[str] = ""
    attack_bonus: Optional[str] = "+0"
    damage: Optional[str] = ""
    damage_type: Optional[str] = ""

class Currency(BaseModel):
    cp: Optional[int] = 0
    sp: Optional[int] = 0
    ep: Optional[int] = 0
    gp: Optional[int] = 0
    pp: Optional[int] = 0

class DigitizedCharacter(BaseModel):
    name: Optional[str] = None
    race: Optional[str] = None
    class_name: Optional[str] = None
    subclass: Optional[str] = None
    level: Optional[int] = None
    background: Optional[str] = None
    alignment: Optional[str] = None
    experience_points: Optional[int] = None
    player_name: Optional[str] = None
    stats: StatBlock = Field(default_factory=StatBlock)
    saving_throws: Optional[Dict[str, Any]] = Field(default_factory=dict)
    skills: Optional[Dict[str, ProficientExpert]] = Field(default_factory=dict)
    ac: Optional[int] = None
    hp_max: Optional[int] = None
    hp_current: Optional[int] = None
    hp_temporary: Optional[int] = None
    proficiency_bonus: Optional[int] = None
    initiative: Optional[int] = None
    speed: Optional[int] = None
    hit_dice: Optional[str] = None
    passive_perception: Optional[int] = None
    inspiration: Optional[bool] = False
    attacks: Optional[List[Attack]] = Field(default_factory=list)
    equipment: Optional[str] = None
    currency: Optional[Currency] = Field(default_factory=Currency)
    personality_traits: Optional[str] = None
    ideals: Optional[str] = None
    bonds: Optional[str] = None
    flaws: Optional[str] = None
    features_traits: Optional[str] = None
    other_proficiencies: Optional[str] = None
    spellcasting_class: Optional[str] = None
    spellcasting_ability: Optional[str] = None
    spell_save_dc: Optional[int] = None
    spell_attack_bonus: Optional[int] = None
    cantrips: Optional[List[str]] = Field(default_factory=list)
    spells: Optional[List[str]] = Field(default_factory=list)
    confidence: Optional[float] = 0.0

DIGITIZE_SYSTEM_INSTRUCTION = """
Eres un experto en hojas de personaje de D&D 5e. Tu tarea es analizar una imagen de una hoja de personaje y extraer TODOS los datos de forma estructurada.

REGLAS:
1. Extrae los Ability Scores (números grandes 8-20), NO los modificadores.
2. Identifica Proficiencies (●) en Saving Throws y Skills.
3. Sé exhaustivo con ataques, equipo y rasgos.
4. Si un campo está vacío o es ilegible, usa null.
5. Los números deben ser enteros.

FORMATO JSON:
{
  "name": string, "race": string, "class_name": string, "subclass": string, "level": int,
  "background": string, "alignment": string, "experience_points": int, "player_name": string,
  "stats": {"strength": int, "dexterity": int, "constitution": int, "intelligence": int, "wisdom": int, "charisma": int},
  "saving_throws": {"strength": bool, "dexterity": bool, "constitution": bool, "intelligence": bool, "wisdom": bool, "charisma": bool},
  "skills": {"acrobatics": {"proficient": bool, "expertise": bool}, ... todas las 18 habilidades ...},
  "ac": int, "hp_max": int, "hp_current": int, "hp_temporary": int,
  "proficiency_bonus": int, "initiative": int, "speed": int, "hit_dice": string,
  "passive_perception": int, "inspiration": bool,
  "attacks": [{"name": string, "attack_bonus": string, "damage": string, "damage_type": string}],
  "equipment": string, "currency": {"cp": int, "sp": int, "ep": int, "gp": int, "pp": int},
  "personality_traits": string, "ideals": string, "bonds": string, "flaws": string,
  "features_traits": string, "other_proficiencies": string,
  "spellcasting_class": string, "spellcasting_ability": string, "spell_save_dc": int, "spell_attack_bonus": int,
  "cantrips": [string], "spells": [string],
  "confidence": float (0-1)
}
"""

class VisionService:
    def __init__(self):
        # Modelos confirmados y fallbacks
        self.vision_models = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest",
            "gemini-1.5-flash",
            "gemini-pro-latest",
        ]
        self.exhausted_models = set()
        self.current_model_name = None
        self._initialize_model()
    
    def _initialize_model(self):
        for model_name in self.vision_models:
            if model_name in self.exhausted_models:
                continue
            try:
                # Usar el modelo con instrucción de sistema
                self.model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=DIGITIZE_SYSTEM_INSTRUCTION
                )
                self.current_model_name = model_name
                logger.info(f"Modelo de visión inicializado: {model_name}")
                return True
            except Exception as e:
                logger.debug(f"Modelo {model_name} no disponible en init: {e}")
                continue
        return False

    def _rotate_model(self):
        self.exhausted_models.add(self.current_model_name)
        logger.info(f"Rotando modelo desde {self.current_model_name}...")
        return self._initialize_model()

    async def digitize_image(self, image: Image.Image) -> Dict[str, Any]:
        if not self.current_model_name:
            if not self._initialize_model():
                raise ValueError("No hay modelos de visión disponibles")
        
        max_retries = len(self.vision_models)
        for attempt in range(max_retries):
            try:
                logger.info(f"Digitalizando con {self.current_model_name} (intento {attempt + 1})")
                
                response = self.model.generate_content(
                    [image, "Extrae los datos de esta hoja de personaje en formato JSON."],
                    generation_config={"response_mime_type": "application/json"}
                )
                
                if response.text:
                    try:
                        return json.loads(response.text)
                    except json.JSONDecodeError:
                        text = response.text
                        if "```json" in text:
                            text = text.split("```json")[1].split("```")[0].strip()
                        elif "```" in text:
                            text = text.split("```")[1].split("```")[0].strip()
                        return json.loads(text)
                
                raise ValueError("Respuesta vacía del modelo")
                    
            except Exception as e:
                error_str = str(e).lower()
                # Rotar si es error de cuota (429) o si el modelo no se encuentra (404)
                is_quota = "429" in error_str or "resourceexhausted" in error_str or "quota" in error_str
                is_not_found = "404" in error_str or "not found" in error_str or "not_found" in error_str
                
                if (is_quota or is_not_found) and attempt < max_retries - 1:
                    logger.warning(f"Error {error_str[:50]} para {self.current_model_name}, rotando...")
                    if self._rotate_model():
                        continue
                
                logger.error(f"Error final de digitalización: {error_str}")
                raise

vision_service = None

def get_vision_service():
    global vision_service
    if vision_service is None:
        vision_service = VisionService()
    return vision_service

def enhance_image_for_ocr(image: Image.Image) -> Image.Image:
    try:
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.4)
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.5)
        
        return image
    except Exception as e:
        logger.warning(f"Error al mejorar imagen: {e}")
        return image

@router.post("/digitize")
async def digitize_character_sheet(
    file: UploadFile = File(...),
    campaign_id: Optional[str] = None
):
    if not GOOGLE_API_KEY:
        return {"success": False, "message": "API Key no configurada", "data": None}
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image = enhance_image_for_ocr(image)
        
        svc = get_vision_service()
        raw_data = await svc.digitize_image(image)
        
        char = DigitizedCharacter(**raw_data)
        result_data = char.model_dump()
        
        # Mapeo para el frontend
        result_data["character_name"] = result_data.pop("name")
        result_data["class"] = result_data.pop("class_name")
        result_data["armor_class"] = result_data.pop("ac")
        
        # Estructura de saving_throws
        raw_st = raw_data.get("saving_throws", {})
        saving_throws = {}
        for stat in ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]:
            val = raw_st.get(stat, False)
            saving_throws[stat] = {"proficient": val if isinstance(val, bool) else False}
        result_data["saving_throws"] = saving_throws
        
        # Asegurar ataques mínimos
        while len(result_data["attacks"]) < 3:
            result_data["attacks"].append({"name": "", "attack_bonus": "+0", "damage": "", "damage_type": ""})
            
        return {
            "success": True,
            "message": "Digitalización completada",
            "data": result_data,
            "model": svc.current_model_name
        }
        
    except Exception as e:
        logger.error(f"Error en digitize: {e}", exc_info=True)
        return {
            "success": False,
            "message": f"Error al procesar: {str(e)}",
            "data": None
        }

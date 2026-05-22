# 🎯 OCR Integration Guide - Escanear Hojas de Personaje

**Objetivo:** Permitir que usuarios suban un PDF de hoja de personaje D&D5e y la aplicación auto-cree un personaje con todos los datos.

**Tecnología:** Google Cloud Vision API + Pytesseract fallback  
**Tiempo estimado:** 3-5 días (incluye testing)

---

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Setup Google Vision](#setup-google-vision)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Components](#frontend-components)
5. [Base de Datos](#base-de-datos)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Usuario sube PDF de hoja de personaje                  │
│  (Archivo guardado en Supabase Storage)                 │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  POST /ocr/character - Backend recibe PDF               │
│  1. Valida archivo (size, format)                       │
│  2. Extrae texto con Google Vision API                  │
│  3. Parsea campos (nombre, race, class, etc)            │
│  4. Mapea a tablas D&D5e                                │
│  5. Crea personaje en DB                                │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Response JSON con personaje creado                     │
│  {                                                       │
│    "success": true,                                      │
│    "character": {                                        │
│      "id": "uuid",                                       │
│      "name": "Arthas",                                   │
│      "race": "Human",                                    │
│      "class": "Paladin",                                │
│      ...                                                 │
│    }                                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Setup Google Vision API

### 1. Enable Vision API en Google Cloud

```bash
# En Google Cloud Console (console.cloud.google.com)
1. Menu → APIs & Services
2. Enable APIs → Buscar "Cloud Vision API"
3. Click "Enable"
```

### 2. Create Service Account

```bash
# Google Cloud Console
1. APIs & Services → Credentials
2. Create Credentials → Service Account
3. Name: "dungeonassistant-ocr"
4. Download JSON key file
5. Guarda el JSON en: backend/.secrets/google-vision-key.json
```

### 3. Add Key a .env

```bash
# backend/.env
GOOGLE_VISION_CREDENTIALS_PATH=.secrets/google-vision-key.json
GOOGLE_VISION_PROJECT_ID=xxx-xxx-xxx  (desde JSON)

# frontend/.env
VITE_MAX_PDF_SIZE=52428800  # 50MB
```

---

## 🐍 Backend Implementation

### Step 1: Install Dependencies

```bash
cd backend
pip install google-cloud-vision pdf2image PIL pytesseract
```

### Step 2: Create OCR Service

Crea archivo: `backend/services/ocr.py`

```python
import json
import logging
from typing import Dict, List, Optional
from google.cloud import vision
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import io

logger = logging.getLogger("services.ocr")

class OCRService:
    """
    Service para escanear hojas de personaje PDF
    y extraer datos de D&D5e
    """
    
    def __init__(self):
        """Inicializar Google Vision client"""
        try:
            self.vision_client = vision.ImageAnnotatorClient()
            logger.info("✓ Google Vision API initialized")
        except Exception as e:
            logger.warn(f"⚠ Vision API not available: {e}")
            self.vision_client = None
    
    async def extract_text_from_pdf(
        self,
        pdf_path: str
    ) -> str:
        """
        Convertir PDF a imágenes y extraer texto
        
        Args:
            pdf_path: Ruta local del PDF
            
        Returns:
            Texto extraído del PDF
        """
        try:
            # Convertir PDF a imágenes
            images = convert_from_path(pdf_path)
            all_text = ""
            
            for idx, image in enumerate(images):
                logger.info(f"Processing page {idx + 1}/{len(images)}")
                
                # Opción 1: Google Vision (más preciso)
                if self.vision_client:
                    text = await self._extract_with_vision(image)
                else:
                    # Fallback: Pytesseract
                    text = pytesseract.image_to_string(image)
                
                all_text += f"\n--- PAGE {idx + 1} ---\n{text}"
            
            logger.info(f"✓ Extracted {len(all_text)} characters from PDF")
            return all_text
            
        except Exception as e:
            logger.error(f"❌ PDF extraction error: {e}")
            raise
    
    async def _extract_with_vision(self, image: Image) -> str:
        """
        Usar Google Vision API para extraer texto
        (OCR más preciso que Pytesseract)
        """
        import asyncio
        
        # Convertir PIL Image a bytes
        byte_arr = io.BytesIO()
        image.save(byte_arr, format='PNG')
        byte_arr.seek(0)
        image_bytes = byte_arr.read()
        
        # Crear Vision Image object
        vision_image = vision.Image(content=image_bytes)
        
        # Llamar OCR en thread (no blocking)
        def _ocr():
            response = self.vision_client.document_text_detection(
                image=vision_image,
                image_context={"language_hints": ["es", "en"]}
            )
            return response.full_text_annotation.text
        
        loop = asyncio.get_event_loop()
        text = await loop.run_in_executor(None, _ocr)
        
        return text or ""
    
    def parse_character_data(
        self,
        text: str
    ) -> Dict[str, any]:
        """
        Parsear texto para extraer datos de personaje
        
        Fields a buscar:
        - Name, Race, Class, Level
        - Atributos (STR, DEX, CON, INT, WIS, CHA)
        - Skills, Feats, Equipment
        """
        
        data = {
            "name": self._extract_name(text),
            "race": self._extract_race(text),
            "class": self._extract_class(text),
            "level": self._extract_level(text),
            "background": self._extract_background(text),
            "alignment": self._extract_alignment(text),
            "attributes": self._extract_attributes(text),
            "hp": self._extract_hp(text),
            "armor_class": self._extract_ac(text),
            "skills": self._extract_skills(text),
            "feats": self._extract_feats(text),
            "equipment": self._extract_equipment(text),
        }
        
        logger.info(f"✓ Parsed character: {data.get('name', 'Unknown')}")
        return data
    
    # --- Private helper methods ---
    
    def _extract_name(self, text: str) -> Optional[str]:
        """Buscar "CHARACTER NAME:" or "Name:"»"""
        import re
        match = re.search(r"(?:Name|CHARACTER NAME)?[:\s]+([A-Za-z\s]+)", text, re.IGNORECASE)
        return match.group(1).strip() if match else "Unnamed"
    
    def _extract_race(self, text: str) -> Optional[str]:
        """Buscar race en lista conocida"""
        races = ["Human", "Dwarf", "Elf", "Halfling", "Dragonborn", 
                 "Gnome", "Half-Orc", "Half-Elf", "Tiefling"]
        for race in races:
            if race.lower() in text.lower():
                return race
        return "Human"  # Default
    
    def _extract_class(self, text: str) -> Optional[str]:
        """Buscar class en lista conocida"""
        classes = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk",
                   "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"]
        for cls in classes:
            if cls.lower() in text.lower():
                return cls
        return "Fighter"  # Default
    
    def _extract_level(self, text: str) -> int:
        """Parsear nivel (1-20)"""
        import re
        match = re.search(r"(?:Level|LVL)[:\s]+(\d+)", text, re.IGNORECASE)
        level = int(match.group(1)) if match else 1
        return max(1, min(20, level))  # Clamp 1-20
    
    def _extract_background(self, text: str) -> Optional[str]:
        """Buscar background"""
        backgrounds = ["Acolyte", "Charlatan", "Criminal", "Folk Hero",
                       "Guild Artisan", "Hermit", "Mercenary", "Noble",
                       "Outlander", "Sage", "Sailor", "Soldier", "Urchin"]
        for bg in backgrounds:
            if bg.lower() in text.lower():
                return bg
        return "Folk Hero"  # Default
    
    def _extract_alignment(self, text: str) -> Optional[str]:
        """Buscar alignment"""
        alignments = ["Lawful Good", "Neutral Good", "Chaotic Good",
                      "Lawful Neutral", "True Neutral", "Chaotic Neutral",
                      "Lawful Evil", "Neutral Evil", "Chaotic Evil"]
        for alignment in alignments:
            if alignment.lower() in text.lower():
                return alignment
        return "Neutral Good"  # Default
    
    def _extract_attributes(self, text: str) -> Dict[str, int]:
        """Extraer STR, DEX, CON, INT, WIS, CHA"""
        import re
        attributes = {}
        
        for attr in ["STR", "DEX", "CON", "INT", "WIS", "CHA"]:
            pattern = rf"{attr}[:\s]+(\d+)"
            match = re.search(pattern, text, re.IGNORECASE)
            attributes[attr] = int(match.group(1)) if match else 10
        
        return attributes
    
    def _extract_hp(self, text: str) -> int:
        """Extraer HP"""
        import re
        match = re.search(r"(?:HP|Hit Points)[:\s]+(\d+)", text, re.IGNORECASE)
        return int(match.group(1)) if match else 30
    
    def _extract_ac(self, text: str) -> int:
        """Extraer AC"""
        import re
        match = re.search(r"(?:AC|Armor Class)[:\s]+(\d+)", text, re.IGNORECASE)
        return int(match.group(1)) if match else 10
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extraer skills mencionados"""
        skills = ["Acrobatics", "Animal Handling", "Arcana", "Athletics",
                  "Deception", "History", "Insight", "Intimidation",
                  "Investigation", "Medicine", "Nature", "Perception",
                  "Performance", "Persuasion", "Religion", "Sleight of Hand",
                  "Stealth", "Survival"]
        
        found_skills = []
        for skill in skills:
            if skill.lower() in text.lower():
                found_skills.append(skill)
        
        return found_skills
    
    def _extract_feats(self, text: str) -> List[str]:
        """Extraer feats mencionados"""
        # Esta es una lista simplificada; en producción validar contra DB
        return []  # Implementar según necesidad
    
    def _extract_equipment(self, text: str) -> List[Dict]:
        """Extraer items del personaje"""
        # Similiar a feats, retornar lista de items
        return []  # Implementar según necesidad


# Instancia global
ocr_service = OCRService()
```

### Step 3: Create API Endpoint

Crea archivo: `backend/routers/ocr.py`

```python
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
import logging
from pathlib import Path
import tempfile
from services.ocr import ocr_service
from middleware.auth import get_current_user
from services.supabase import SupabaseClient

logger = logging.getLogger("routers.ocr")
router = APIRouter(prefix="/ocr", tags=["ocr"])

@router.post("/character")
async def create_character_from_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload PDF de hoja de personaje y crear personaje automáticamente
    
    Args:
        file: PDF file (multipart/form-data)
        
    Returns:
        {
            "success": bool,
            "character_id": str,
            "character": {...},
            "confidence": float  (0-1, calidad de extracción)
        }
    """
    
    try:
        # 1. Validar archivo
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Solo archivos PDF")
        
        if file.size > 52428800:  # 50MB
            raise HTTPException(status_code=413, detail="PDF muy grande (max 50MB)")
        
        # 2. Guardar temporalmente
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        logger.info(f"Processing PDF: {file.filename} ({len(content)} bytes)")
        
        # 3. Extraer texto
        text = await ocr_service.extract_text_from_pdf(tmp_path)
        
        # 4. Parsear datos
        char_data = ocr_service.parse_character_data(text)
        
        # 5. Crear personaje en BD
        supabase = SupabaseClient()
        result = supabase.client.table("characters").insert({
            "user_id": current_user["id"],
            "name": char_data.get("name"),
            "race": char_data.get("race"),
            "class": char_data.get("class"),
            "level": char_data.get("level"),
            "background": char_data.get("background"),
            "alignment": char_data.get("alignment"),
            "attributes": char_data.get("attributes"),
            "hp": char_data.get("hp"),
            "armor_class": char_data.get("ac"),
            "skills": char_data.get("skills"),
            "equipment": char_data.get("equipment"),
            "source": "ocr_pdf"  # Marcar que vino de OCR
        }).execute()
        
        # 6. Limpiar temp file
        Path(tmp_path).unlink()
        
        logger.info(f"✓ Character created: {char_data.get('name')} (ID: {result.data[0]['id']})")
        
        return {
            "success": True,
            "character_id": result.data[0]["id"],
            "character": result.data[0],
            "extracted_text_preview": text[:500]  # Para debugging
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ OCR error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OCR error: {str(e)[:100]}")


@router.get("/status")
async def ocr_status(current_user: dict = Depends(get_current_user)):
    """Verificar si OCR está disponible"""
    return {
        "ocr_available": ocr_service.vision_client is not None,
        "status": "ready" if ocr_service.vision_client else "offline"
    }
```

### Step 4: Add to Main Router

En `backend/main.py`:

```python
from routers.ocr import router as ocr_router

app.include_router(ocr_router)
```

---

## ⚛️ Frontend Components

### CharacterOCR Component

Crea: `frontend/components/CharacterOCR.jsx`

```jsx
import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';

export default function CharacterOCR({ onCharacterCreated }) {
  const { user } = useAuthStore();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Solo archivos PDF son permitidos');
        return;
      }
      if (selectedFile.size > 52428800) {
        setError('PDF muy grande (máximo 50MB)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona un archivo PDF');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/ocr/character', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        setSuccess(true);
        setFile(null);
        setProgress(0);
        
        // Callback para parent
        if (onCharacterCreated) {
          onCharacterCreated(response.data.character);
        }

        // Auto-redirect a campaign view (opcional)
        setTimeout(() => {
          window.location.href = `/campaign/${response.data.character.campaign_id}`;
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al escanear PDF');
      console.error('OCR error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocr-container p-6 border-2 border-dashed border-purple-400 rounded-lg">
      <h3 className="text-xl font-bold mb-4">📄 Escanear Hoja de Personaje</h3>
      
      {success && (
        <div className="bg-green-500 text-white p-4 rounded mb-4">
          ✓ Personaje creado exitosamente
        </div>
      )}

      {error && (
        <div className="bg-red-500 text-white p-4 rounded mb-4">
          ❌ {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Selecciona PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={loading}
            className="w-full border rounded px-3 py-2"
          />
          {file && <p className="text-sm text-gray-600 mt-2">Archivo: {file.name}</p>}
        </div>

        {loading && (
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-purple-500 h-full rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className={`w-full py-2 px-4 rounded font-bold ${
            loading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {loading ? `Escaneando... ${progress}%` : 'Escanear PDF'}
        </button>
      </div>
    </div>
  );
}
```

### Integrar en CreateCharacter

En `frontend/pages/CreateCharacter.jsx`, agregar tab/toggle:

```jsx
const [useOCR, setUseOCR] = useState(false);

return (
  <div>
    {/* Toggle OCR vs Manual */}
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => setUseOCR(false)}
        className={useOCR ? 'text-gray-500' : 'font-bold text-purple-600'}
      >
        Crear Manual
      </button>
      <button
        onClick={() => setUseOCR(true)}
        className={!useOCR ? 'text-gray-500' : 'font-bold text-purple-600'}
      >
        Escanear PDF
      </button>
    </div>

    {useOCR ? (
      <CharacterOCR onCharacterCreated={handleCharacterCreated} />
    ) : (
      <CharacterForm onSubmit={handleSubmit} />
    )}
  </div>
);
```

---

## 🗄️ Base de Datos

### Ya existe? Verificar

```sql
-- En Supabase SQL Editor
SELECT * FROM characters LIMIT 1;

-- Si existe "source" column, OK. Si no:
ALTER TABLE characters ADD COLUMN source TEXT DEFAULT 'manual';
```

---

## 🧪 Testing

### Backend Tests

Crea: `tests/test_ocr_integration.py`

```python
import pytest
from backend.services.ocr import ocr_service
from pathlib import Path

def test_ocr_service_initialization():
    """Verificar que OCR service inicia"""
    assert ocr_service is not None
    # Vision client podría ser None si no hay credenciales

def test_extract_name():
    """Parsear nombre"""
    text = "CHARACTER NAME: Arthas\nClass: Paladin"
    name = ocr_service._extract_name(text)
    assert name == "Arthas"

def test_extract_attributes():
    """Parsear atributos"""
    text = "STR: 18\nDEX: 14\nCON: 16\nINT: 12\nWIS: 13\nCHA: 15"
    attrs = ocr_service._extract_attributes(text)
    assert attrs["STR"] == 18
    assert attrs["DEX"] == 14

@pytest.mark.asyncio
async def test_pdf_extraction():
    """Test con PDF real (si está disponible)"""
    pdf_path = Path("tests/fixtures/character_sheet.pdf")
    if pdf_path.exists():
        text = await ocr_service.extract_text_from_pdf(str(pdf_path))
        assert len(text) > 0
        assert "name" in text.lower()  # Asumir que tiene "name"
    else:
        pytest.skip("Test PDF not found")

@pytest.mark.asyncio
async def test_api_endpoint(client, auth_headers):
    """Test endpoint POST /ocr/character"""
    # Usar fixture con PDF
    with open("tests/fixtures/character_sheet.pdf", "rb") as f:
        response = client.post(
            "/ocr/character",
            files={"file": f},
            headers=auth_headers
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "character_id" in data
```

---

## 🐛 Troubleshooting

### "Google Vision API not available"
- [ ] Verificar que credentials JSON está en `backend/.secrets/`
- [ ] Verificar `GOOGLE_VISION_CREDENTIALS_PATH` en `.env`
- [ ] Ejecutar: `gcloud auth activate-service-account --key-file=.secrets/google-vision-key.json`

### "No text extracted from PDF"
- [ ] Verificar que PDF no está escaneado como imagen (no tiene OCR)
- [ ] Usar fallback con Pytesseract: `pip install pytesseract`
- [ ] Instalar Tesseract: `brew install tesseract` (macOS) o `apt install tesseract-ocr` (Linux)

### "Memory error on large PDF"
- [ ] Limitar a 50MB en frontend
- [ ] En backend, procesar página por página
- [ ] Usar `pdf2image` con `dpi=100` para reducir resolución

### "Character data not mapping correctly"
- [ ] Revisar logs: `tail -f backend/logs/debug.log`
- [ ] Extraer texto manualmente: `await ocr_service.extract_text_from_pdf("path")`
- [ ] Mejorar parsing regex en `parse_character_data()`

---

## 📚 Recursos

- [Google Cloud Vision API Docs](https://cloud.google.com/vision/docs)
- [pdf2image Docs](https://github.com/Belval/pdf2image)
- [Pytesseract Docs](https://github.com/madmaze/pytesseract)

---

**Estado:** ⏳ LISTO PARA IMPLEMENTAR  
**Contacto:** [Tu nombre]  
**Última actualización:** 2026-04-17

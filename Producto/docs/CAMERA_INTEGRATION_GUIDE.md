# 📸 INTEGRACIÓN DE CÁMARA EN CREACIÓN DE PERSONAJES

## 🎯 Flujo Completo

```
1. Usuario accede a "Crear Personaje"
   ↓
2. Modal/Pantalla de CAPTURA CON CÁMARA aparece
   ↓
3. Usuario captura foto de hoja de D&D
   ↓
4. Enviar a Backend: /vision/digitize
   ↓
5. Backend procesa con Google Vision + Gemini
   ↓
6. Retorna datos extraídos (nombre, race, class, level, etc)
   ↓
7. Frontend PRELLENEA el formulario con datos detectados
   ↓
8. Usuario verifica/edita y confirma
```

---

## 🔧 BACKEND - backend/routers/vision.py

### Implementación de OCR con Gemini

```python
"""
Router para visión y OCR
Procesa imágenes de hojas de personaje con Google Vision + Gemini
"""

import os
import json
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from google.cloud import vision
import google.generativeai as genai
from typing import Optional
import base64

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vision", tags=["vision"])

# Inicializar clientes
vision_client = vision.ImageAnnotatorClient()

# Configurar Gemini
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)


@router.post("/digitize")
async def digitize_character_sheet(
    file: UploadFile = File(...),
    campaign_id: Optional[str] = None
):
    """
    OCR de hoja de personaje física con Google Vision + Gemini
    
    Recibe: Foto de hoja de D&D
    Retorna: Datos estructurados (nombre, race, class, level, stats, etc)
    """
    try:
        # Leer imagen
        contents = await file.read()
        image = vision.Image(content=contents)
        
        # Paso 1: Extraer texto con Vision API
        response = vision_client.document_text_detection(image=image)
        raw_text = response.full_text_annotation.text if response.full_text_annotation else ""
        
        if not raw_text:
            logger.warning("No text detected in image")
            return {
                "success": False,
                "message": "No se pudo detectar texto en la imagen",
                "data": None
            }
        
        # Paso 2: Procesar con Gemini para extraer datos estructurados
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"""
        Analiza esta hoja de personaje de D&D 5e y extrae los siguientes datos:
        
        TEXTO DETECTADO:
        {raw_text}
        
        Extrae EXACTAMENTE estos campos (si no aparecen, usa null):
        - name (string): Nombre del personaje
        - race (string): Raza (ej: Half-Elf, Dragonborn, etc)
        - class_name (string): Clase (ej: Barbarian, Wizard, etc)
        - level (number): Nivel (1-20)
        - background (string): Trasfondo
        - alignment (string): Alineamiento
        
        STATS (abilidades):
        - strength, dexterity, constitution, intelligence, wisdom, charisma (números 3-20)
        
        COMBATE:
        - hp_max (número): Puntos de vida máximos
        - ac (número): Clase de armadura
        - proficiency_bonus (número)
        - initiative (número)
        
        Retorna SOLO JSON válido, sin comentarios:
        {{
            "name": "...",
            "race": "...",
            "class_name": "...",
            "level": ...,
            "background": "...",
            "alignment": "...",
            "stats": {{
                "strength": ...,
                "dexterity": ...,
                "constitution": ...,
                "intelligence": ...,
                "wisdom": ...,
                "charisma": ...
            }},
            "hp_max": ...,
            "ac": ...,
            "proficiency_bonus": ...,
            "initiative": ...,
            "confidence": 0.95,
            "warnings": ["campo1 no legible", ...]
        }}
        """
        
        gemini_response = model.generate_content(prompt)
        response_text = gemini_response.text
        
        # Limpiar respuesta (puede tener ```json ... ```)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        extracted_data = json.loads(response_text)
        
        return {
            "success": True,
            "message": "Datos extraídos correctamente",
            "data": {
                "character_name": extracted_data.get("name"),
                "race": extracted_data.get("race"),
                "class": extracted_data.get("class_name"),
                "level": extracted_data.get("level"),
                "background": extracted_data.get("background"),
                "alignment": extracted_data.get("alignment"),
                "stats": extracted_data.get("stats", {}),
                "hp_max": extracted_data.get("hp_max"),
                "armor_class": extracted_data.get("ac"),
                "proficiency_bonus": extracted_data.get("proficiency_bonus"),
                "initiative": extracted_data.get("initiative"),
                "confidence": extracted_data.get("confidence", 0),
                "low_confidence_fields": extracted_data.get("warnings", []),
                "unreadable_fields": []
            }
        }
        
    except json.JSONDecodeError:
        logger.error(f"Error parsing Gemini response: {response_text}")
        return {
            "success": False,
            "message": "Error al procesar respuesta de IA",
            "data": None
        }
    except Exception as e:
        logger.error(f"Error en digitize_character_sheet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📱 FRONTEND - Componente de Captura

### Ubicación: `frontend/src/components/CharacterCreation/CameraCapture.jsx`

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, AlertCircle } from 'lucide-react';

export default function CameraCapture({ onCharacterDataExtracted, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);

  // Inicializar cámara
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // Cámara trasera
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
          setCameraActive(true);
        }
      } catch (err) {
        setError('No se puede acceder a la cámara');
        setHasCamera(false);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capturar foto
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      const imageData = canvasRef.current.toDataURL('image/png');
      
      setCapturedImage(imageData);
      setCameraActive(false);
    }
  };

  // Enviar al backend para OCR
  const processImage = async (imageFile) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('/api/vision/digitize', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Pasar datos extraídos al componente padre
        onCharacterDataExtracted(result.data);
      } else {
        setError(result.message || 'Error al procesar la imagen');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar carga de archivo
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  // Confirmar captura
  const handleConfirmCapture = async () => {
    if (capturedImage) {
      // Convertir base64 a File
      const blob = await (await fetch(capturedImage)).blob();
      const file = new File([blob], 'character-sheet.png', { type: 'image/png' });
      await processImage(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📸 Escanear Hoja</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded flex gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Procesando imagen...</p>
          </div>
        )}

        {/* Camera View */}
        {!capturedImage && cameraActive && !loading && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg mb-4 bg-black aspect-video object-cover"
            />
            <p className="text-sm text-gray-600 text-center mb-4">
              Apunta a la hoja de personaje completa
            </p>
            <button
              onClick={capturePhoto}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <Camera size={20} /> Capturar Foto
            </button>
          </>
        )}

        {/* Preview */}
        {capturedImage && !loading && (
          <>
            <img
              src={capturedImage}
              alt="Captura"
              className="w-full rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCapturedImage(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold"
              >
                Retomar
              </button>
              <button
                onClick={handleConfirmCapture}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
              >
                Procesar
              </button>
            </div>
          </>
        )}

        {/* Upload Alternative */}
        {!cameraActive && !loading && !capturedImage && (
          <>
            <p className="text-center text-gray-600 mb-4">
              Si no puedes usar cámara, sube una imagen
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <Upload size={20} /> Subir Imagen
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
```

---

## 🔗 INTEGRACIÓN EN FLUJO DE CREACIÓN

### Archivo: `frontend/src/pages/CharacterCreation.jsx`

```jsx
import { useState } from 'react';
import CameraCapture from '@/components/CharacterCreation/CameraCapture';
import CharacterForm from '@/components/CharacterCreation/CharacterForm';

export default function CharacterCreation() {
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    race: '',
    class_: '',
    level: 1,
    stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    hp_max: 0,
    armor_class: 10,
    // ... más campos
  });

  // Callback cuando se extraen datos de la imagen
  const handleCharacterDataExtracted = (extractedData) => {
    // PRELLENAR formulario con datos detectados
    setFormData(prev => ({
      ...prev,
      name: extractedData.character_name || prev.name,
      race: extractedData.race || prev.race,
      class_: extractedData.class || prev.class_,
      level: extractedData.level || prev.level,
      stats: extractedData.stats || prev.stats,
      hp_max: extractedData.hp_max || prev.hp_max,
      armor_class: extractedData.armor_class || prev.armor_class,
      proficiency_bonus: extractedData.proficiency_bonus || 2,
    }));

    // Mostrar advertencias si hay campos no legibles
    if (extractedData.low_confidence_fields?.length > 0) {
      alert(`⚠️ Campos poco claros: ${extractedData.low_confidence_fields.join(', ')}`);
    }

    setShowCamera(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Crear Personaje</h1>

      {/* Botón para activar cámara */}
      <div className="mb-6">
        <button
          onClick={() => setShowCamera(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          📸 Escanear Hoja de Personaje
        </button>
      </div>

      {/* Modal de Cámara */}
      {showCamera && (
        <CameraCapture
          onCharacterDataExtracted={handleCharacterDataExtracted}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {/* Formulario con datos prellenados */}
      <CharacterForm 
        initialData={formData}
        onChange={setFormData}
      />
    </div>
  );
}
```

---

## 📋 CHECKLIST DE INSTALACIÓN

- [ ] Crear archivo `backend/.env` con datos de Google Cloud
- [ ] Descargar JSON de credenciales de Google Cloud
- [ ] Colocar en `backend/secrets/google-vision-key.json`
- [ ] Instalar dependencias: `pip install google-cloud-vision google-generativeai`
- [ ] Crear componente `CameraCapture.jsx`
- [ ] Integrar en página de creación de personajes
- [ ] Probar captura con imagen de prueba
- [ ] Verificar datos prellenados en formulario

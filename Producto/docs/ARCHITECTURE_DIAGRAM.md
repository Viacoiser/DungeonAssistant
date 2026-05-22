# 🏗️ ARQUITECTURA DE LA INTEGRACIÓN

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DISPOSITIVO DEL USUARIO                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND (React/Vite)                      │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────┐     │  │
│  │  │  Página: CharacterCreation.jsx                      │     │  │
│  │  │  ┌─────────────────────────────────────────────┐   │     │  │
│  │  │  │ Botón: "📸 Escanear Hoja de Personaje"     │   │     │  │
│  │  │  └────────────┬────────────────────────────────┘   │     │  │
│  │  │               │                                     │     │  │
│  │  │  ┌────────────▼─────────────────────────────────┐  │     │  │
│  │  │  │ Componente: CameraCapture.jsx               │  │     │  │
│  │  │  │  • Accede a cámara del dispositivo         │  │     │  │
│  │  │  │  • Muestra preview en vivo                 │  │     │  │
│  │  │  │  • Captura foto al hacer click             │  │     │  │
│  │  │  │  • Envía imagen a backend                  │  │     │  │
│  │  │  └────────────┬─────────────────────────────────┘  │     │  │
│  │  │               │                                     │     │  │
│  │  │  ┌────────────▼─────────────────────────────────┐  │     │  │
│  │  │  │ POST /api/vision/digitize                   │  │     │  │
│  │  │  │ (Envía FormData con imagen)                 │  │     │  │
│  │  │  └────────────┬─────────────────────────────────┘  │     │  │
│  │  │               │                                     │     │  │
│  │  └───────────────┼─────────────────────────────────────┘     │  │
│  └──────────────────┼────────────────────────────────────────────┘  │
└─────────────────────┼─────────────────────────────────────────────────┘
                      │
                      │ HTTP POST
                      │
┌─────────────────────▼─────────────────────────────────────────────────┐
│                      SERVIDOR (Backend Python)                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │        backend/routers/vision.py                             │     │
│  │        @router.post("/digitize")                             │     │
│  │                                                               │     │
│  │  ┌──────────────────────────────────────────────────────┐   │     │
│  │  │ 1️⃣ Google Cloud Vision API                          │   │     │
│  │  │    • Lee la imagen                                  │   │     │
│  │  │    • Extrae TEXTO OCR                               │   │     │
│  │  │    • Credenciales desde:                            │   │     │
│  │  │      backend/secrets/google-vision-key.json         │   │     │
│  │  └──────────────────┬───────────────────────────────────┘   │     │
│  │                    │                                          │     │
│  │  ┌─────────────────▼───────────────────────────────────┐    │     │
│  │  │ 2️⃣ Google Gemini API (LLM)                         │    │     │
│  │  │    • Recibe texto extraído                         │    │     │
│  │  │    • Estructura datos D&D                          │    │     │
│  │  │    • Extrae:                                        │    │     │
│  │  │      - nombre, race, class, level                  │    │     │
│  │  │      - stats (STR, DEX, CON, INT, WIS, CHA)       │    │     │
│  │  │      - hp_max, ac, proficiency_bonus               │    │     │
│  │  │    • API Key desde: GEMINI_API_KEY (.env)          │    │     │
│  │  └──────────────────┬───────────────────────────────────┘    │     │
│  │                    │                                          │     │
│  │  ┌─────────────────▼───────────────────────────────────┐    │     │
│  │  │ 3️⃣ Retornar JSON estructurado                      │    │     │
│  │  │    {                                                │    │     │
│  │  │      "success": true,                              │    │     │
│  │  │      "data": {                                      │    │     │
│  │  │        "character_name": "Legolas",                │    │     │
│  │  │        "race": "Half-Elf",                          │    │     │
│  │  │        "class": "Ranger",                           │    │     │
│  │  │        "level": 5,                                  │    │     │
│  │  │        "stats": { STR: 14, DEX: 16, ... },        │    │     │
│  │  │        "hp_max": 35,                                │    │     │
│  │  │        "ac": 15,                                    │    │     │
│  │  │        "confidence": 0.94,                          │    │     │
│  │  │        "warnings": []                               │    │     │
│  │  │      }                                              │    │     │
│  │  │    }                                                │    │     │
│  │  └──────────────────┬───────────────────────────────────┘    │     │
│  │                    │                                          │     │
│  └────────────────────┼──────────────────────────────────────────┘     │
└─────────────────────┬┘                                                 │
                      │ HTTP Response (JSON)
                      │
┌─────────────────────▼─────────────────────────────────────────────────┐
│                      FRONTEND (React/Vite)                             │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  CameraCapture.jsx - handleConfirmCapture()                  │     │
│  │                                                               │     │
│  │  • Recibe JSON con datos extraídos                           │     │
│  │  • Llama: onCharacterDataExtracted(extractedData)            │     │
│  │  • Parent component (CharacterCreation.jsx):                │     │
│  │                                                               │     │
│  │  ┌─────────────────────────────────────────────────────┐    │     │
│  │  │ PRELLENAR FORMULARIO                                │    │     │
│  │  │                                                     │    │     │
│  │  │ setFormData(prev => ({                              │    │     │
│  │  │   ...prev,                                          │    │     │
│  │  │   name: extractedData.character_name,               │    │     │
│  │  │   race: extractedData.race,                         │    │     │
│  │  │   class_: extractedData.class,                      │    │     │
│  │  │   level: extractedData.level,                       │    │     │
│  │  │   stats: extractedData.stats,                       │    │     │
│  │  │   hp_max: extractedData.hp_max,                     │    │     │
│  │  │   armor_class: extractedData.armor_class,           │    │     │
│  │  │ }))                                                 │    │     │
│  │  │                                                     │    │     │
│  │  │ ✅ MOSTRAR ADVERTENCIAS si hay campos poco legibles│    │     │
│  │  └─────────────────────────────────────────────────────┘    │     │
│  │                      │                                       │     │
│  │  ┌───────────────────▼──────────────────────────────────┐   │     │
│  │  │ CharacterForm.jsx - MODO EDICIÓN                     │   │     │
│  │  │                                                      │   │     │
│  │  │ Todos los campos listos para que el usuario:        │   │     │
│  │  │ • VERIFIQUE los datos extraídos ✓                   │   │     │
│  │  │ • EDITE lo que sea necesario                        │   │     │
│  │  │ • AGREGUE información que faltó                     │   │     │
│  │  │ • CONFIRME creación del personaje                   │   │     │
│  │  │                                                      │   │     │
│  │  │ POST /api/characters (crear personaje final)        │   │     │
│  │  └──────────────────────────────────────────────────────┘   │     │
│  │                                                               │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ✅ PERSONAJE CREADO                                                  │
└─────────────────────────────────────────────────────────────────────────┘


```

---

## 📁 Estructura de Archivos

```
backend/
├── .env                          ← ✏️ CREAR: Credenciales
├── .gitignore                    ← ✏️ ACTUALIZAR: Ignorar secrets/ y .env
├── requirements.txt              ← ✏️ ACTUALIZAR: Agregar google-cloud-vision, google-generativeai
│
├── secrets/                      ← ✏️ CREAR CARPETA
│   └── google-vision-key.json    ← 📥 DESCARGAR: Desde Google Cloud Console
│
├── routers/
│   └── vision.py                 ← ✏️ ACTUALIZAR: Código de OCR (línea ~10)
│
└── ... (otros archivos)


frontend/
├── src/
│   ├── components/
│   │   └── CharacterCreation/
│   │       ├── CameraCapture.jsx      ← ✏️ CREAR: Componente de cámara
│   │       └── CharacterForm.jsx      ← (ya existe)
│   │
│   └── pages/
│       └── CharacterCreation.jsx      ← ✏️ ACTUALIZAR: Integrar CameraCapture
│
└── ... (otros archivos)
```

---

## 🔑 Flujo de Credenciales

```
┌─────────────────────────────────────────────┐
│     Google Cloud Console                     │
│     https://console.cloud.google.com/        │
│                                              │
│  1. Crear Proyecto                           │
│  2. Habilitar APIs:                          │
│     - Cloud Vision API                       │
│     - Generative AI                          │
│  3. Crear Service Account                    │
│  4. Descargar JSON                           │
│     └─> proyecto-123-abcdef.json             │
└────────────────────┬──────────────────────────┘
                     │
                     │ Copiar archivo
                     │
                     ▼
        ┌────────────────────────────┐
        │ backend/secrets/           │
        │ google-vision-key.json     │
        │                            │
        │ ⚠️ NO SUBIR A GIT          │
        └────────────┬───────────────┘
                     │
                     │ Leer desde
                     │
                     ▼
        ┌────────────────────────────────┐
        │ backend/.env                   │
        │                                │
        │ GOOGLE_APPLICATION_CREDENTIALS │
        │ ="./secrets/...key.json"       │
        │                                │
        │ GEMINI_API_KEY="sk-..."        │
        └────────────┬───────────────────┘
                     │
                     │ Usar en
                     │
                     ▼
        ┌────────────────────────────────┐
        │ backend/routers/vision.py      │
        │                                │
        │ vision_client = ...            │
        │ genai.configure(api_key=...)   │
        └────────────────────────────────┘
```

---

## 🔄 Secuencia Temporal

```
T0: Usuario abre "Crear Personaje"
    └─ Botón "📸 Escanear" disponible

T1: Usuario hace click en "📸 Escanear"
    └─ CameraCapture.jsx se abre

T2: Cámara pide permisos
    └─ Usuario permite acceso

T3: Preview en vivo de cámara
    └─ Usuario espera a buena posición

T4: Usuario hace click "Capturar Foto"
    └─ Canvas captura frame actual

T5: Usuario hace click "Procesar"
    └─ FormData se envía a backend

T6: Backend recibe POST /vision/digitize
    └─ Vision API extrae texto

T7: Gemini procesa texto
    └─ Retorna JSON con datos

T8: Frontend recibe respuesta
    └─ PRELLENEA formulario

T9: Usuario VE datos en formulario
    └─ Puede editar/verificar

T10: Usuario confirma creación
     └─ Personaje guardado ✅
```

---

## ⚙️ Configuraciones Necesarias

| Componente | Configuración | Dónde |
|---|---|---|
| **Google Vision** | `GOOGLE_APPLICATION_CREDENTIALS` | `backend/.env` |
| **Gemini** | `GEMINI_API_KEY` | `backend/.env` |
| **Archivos** | `./secrets/google-vision-key.json` | Descargar JSON |
| **Python deps** | `google-cloud-vision`, `google-generativeai` | `backend/requirements.txt` |
| **Frontend** | Componente `CameraCapture.jsx` | `frontend/src/components/CharacterCreation/` |
| **Integración** | Import en `CharacterCreation.jsx` | `frontend/src/pages/` |

---

## 🚀 Validación Final

✅ Todos los servicios funcionando:
- Vision API puede leer imágenes
- Gemini puede procesar texto
- Frontend recibe datos
- Formulario se prellenea
- Usuario puede editar

🎉 **¡Listo para escanear hojas de D&D!**

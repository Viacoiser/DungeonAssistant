# 🔐 CÓMO CONFIGURAR GOOGLE CLOUD PARA GEMINI + VISION

## 📍 Localización de Configuración

En el proyecto:
```
backend/
├── .env              ← AQUÍ VAN LAS CREDENCIALES
├── secrets/
│   └── google-vision-key.json  ← ARCHIVO DE CREDENCIALES
└── routers/
    └── vision.py     ← USA ESTAS CREDENCIALES
```

---

## ✅ PASO 1: Crear Proyecto en Google Cloud

1. **Ir a Google Cloud Console**
   - URL: https://console.cloud.google.com/

2. **Crear proyecto nuevo**
   - Click en selector de proyecto (arriba a la izquierda)
   - Click en "NEW PROJECT"
   - Nombre: `DungeonAssistant-Vision`
   - Click "CREATE"

3. **Esperar a que se cree** (puede tomar 30 segundos)

---

## ✅ PASO 2: Habilitar APIs Necesarias

1. **Ir a API & Services → Library**
   - Buscar: "Cloud Vision AI"
   - Click y "ENABLE"

2. **Habilitar Generative AI**
   - Buscar: "Generative AI"
   - Click y "ENABLE"

3. **Esperar confirmación** en ambos casos

---

## ✅ PASO 3: Crear Cuenta de Servicio

1. **Ir a API & Services → Credentials**

2. **Click "Create Credentials" → Service Account**

3. **Llenar datos:**
   - Service account name: `vision-processor`
   - Description: "OCR para hojas de D&D"
   - Click "CREATE AND CONTINUE"

4. **Conceder permisos:**
   - Role: Editor (o mínimo "Cloud Vision AI User" + "Generative AI User")
   - Click "CONTINUE"

5. **Crear clave:**
   - Click "CREATE KEY"
   - Seleccionar "JSON"
   - Click "CREATE"
   - **Se descarga automáticamente** un archivo `*.json`

---

## ✅ PASO 4: Configurar en el Proyecto

1. **Copiar archivo JSON**
   ```
   Descargas/
   └── proyecto-12345-abcdef.json  
                              ↓
   Copiar a:
   backend/
   └── secrets/
       └── google-vision-key.json
   ```

2. **Crear carpeta `secrets`** (si no existe):
   ```bash
   mkdir backend/secrets
   ```

3. **Crear archivo `.env` en backend:**
   ```bash
   cd backend
   touch .env
   ```

4. **Editar `backend/.env`:**
   ```env
   # Google Cloud Vision
   GOOGLE_APPLICATION_CREDENTIALS="./secrets/google-vision-key.json"
   GOOGLE_PROJECT_ID="tu-proyecto-id-123456"
   GEMINI_API_KEY="tu-gemini-api-key-aqui"
   
   # Resto de config...
   SUPABASE_URL="..."
   SUPABASE_KEY="..."
   ```

---

## ✅ PASO 5: Instalar Dependencias Python

```bash
cd backend

# Instalar google cloud vision
pip install google-cloud-vision

# Instalar google generativeai (para Gemini)
pip install google-generativeai

# Instalar python-dotenv (para leer .env)
pip install python-dotenv
```

---

## ✅ PASO 6: Probar Configuración

### Script de prueba: `backend/test_vision.py`

```python
import os
from dotenv import load_dotenv
from google.cloud import vision
import google.generativeai as genai

# Cargar variables de entorno
load_dotenv()

print("🔍 Probando configuración de Google Cloud...")

# Test 1: Vision API
try:
    client = vision.ImageAnnotatorClient()
    print("✅ Vision API: Conectado")
except Exception as e:
    print(f"❌ Vision API Error: {e}")

# Test 2: Gemini
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        print("✅ Gemini API: Conectado")
    else:
        print("⚠️ GEMINI_API_KEY no configurada en .env")
except Exception as e:
    print(f"❌ Gemini Error: {e}")

# Test 3: Archivo de credenciales
creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if os.path.exists(creds_path):
    print(f"✅ Credenciales encontradas: {creds_path}")
else:
    print(f"❌ Archivo no encontrado: {creds_path}")

print("\n✨ Todos los servicios listos!")
```

**Ejecutar:**
```bash
python test_vision.py
```

**Resultado esperado:**
```
✅ Vision API: Conectado
✅ Gemini API: Conectado
✅ Credenciales encontradas: ./secrets/google-vision-key.json
✨ Todos los servicios listos!
```

---

## 📋 ESTRUCTURA FINAL

```
backend/
├── .env
├── .env.example
├── test_vision.py
├── secrets/
│   └── google-vision-key.json     ← ⚠️ CONFIDENCIAL - NO SUBIR A GIT
├── requirements.txt
└── routers/
    └── vision.py                  ← CÓDIGO QUE USA LAS CREDENCIALES
```

**IMPORTANTE:** Agregar a `.gitignore`:
```
secrets/
.env
.env.local
```

---

## 🚨 TROUBLESHOOTING

### Error: "File not found: ./secrets/google-vision-key.json"
- Verificar que el archivo existe en la ruta correcta
- Verificar permisos de lectura
- Usar ruta absoluta si es necesario

### Error: "The default service account is not in any role"
- Volver a Google Cloud Console
- Ir a IAM & Admin
- Asignar rol "Editor" a la cuenta de servicio

### Error: "401 Unauthorized" en Gemini
- Verificar que GEMINI_API_KEY está en .env
- Regenerar API key si es necesario
- Verificar que la API esté habilitada

### Error: "Vision API not enabled"
- Ir a API & Services → Library
- Buscar "Cloud Vision API"
- Click "ENABLE"

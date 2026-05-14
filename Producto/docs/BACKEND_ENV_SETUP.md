# ═══════════════════════════════════════════════════════════════════════════════
# 📋 CONFIGURACIÓN DE BACKEND - DungeonAssistant
# ═══════════════════════════════════════════════════════════════════════════════

# ✅ Paso 1: Google Cloud Vision / Gemini
# ────────────────────────────────────────────────────────────────────────────────
# Ruta al archivo JSON de credenciales de Google Cloud
# 📌 IMPORTANTE: Descargar desde Google Cloud Console
#    1. Ir a: https://console.cloud.google.com/
#    2. Crear proyecto nuevo (o usar existente)
#    3. Habilitar APIs:
#       - Vision AI
#       - Generative AI
#    4. Crear una cuenta de servicio (Service Account)
#    5. Descargar archivo JSON
#    6. Copiar a: backend/secrets/google-vision-key.json
#    7. Actualizar esta ruta
GOOGLE_APPLICATION_CREDENTIALS="./secrets/google-vision-key.json"

# ✅ Paso 2: ID del Proyecto (opcional, si Gemini no lee del archivo)
GOOGLE_PROJECT_ID="tu-proyecto-id-aqui"

# ✅ Paso 3: Gemini API Key (si usas endpoint REST)
GEMINI_API_KEY="tu-gemini-api-key-aqui"

# ═══════════════════════════════════════════════════════════════════════════════
# Database / Supabase (si lo usas)
# ═══════════════════════════════════════════════════════════════════════════════
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_KEY="tu-supabase-key-aqui"

# ═══════════════════════════════════════════════════════════════════════════════
# JWT / Authentication
# ═══════════════════════════════════════════════════════════════════════════════
SECRET_KEY="your-secret-key-change-this-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ═══════════════════════════════════════════════════════════════════════════════
# API Config
# ═══════════════════════════════════════════════════════════════════════════════
DEBUG=True
PORT=8000

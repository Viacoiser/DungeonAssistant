# 🔐 Guía de Configuración - Variables de Entorno

## Backend Setup (`backend/.env`)

### 1️⃣ Supabase Configuration
**Dónde obtener:**
- Ve a: https://app.supabase.com/
- Selecciona tu proyecto
- Settings → API

**Variables:**
```
SUPABASE_URL=https://your-project.supabase.co
```
- Encontrada en **Project URL** → Copia la URL completa

```
SUPABASE_SERVICE_KEY=eyJhbGci...
```
- Encontrada en **Service role secret** → La key bajo "service_role" (⚠️ SUPER SECRET)

```
SUPABASE_ANON_KEY=eyJhbGci...
```
- Encontrada en **Anon public** → La key bajo "anon"


### 2️⃣ Gemini API Key
**Dónde obtener:**
- Ve a: https://makersuite.google.com/app/apikey
- Click en "Create API Key"
- Copia el key generado

```
GEMINI_API_KEY=AIzaSyD...
```


### 3️⃣ JWT Secret
**Generar nuevo:**

**Windows PowerShell:**
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**Resultado esperado:** 64 caracteres hexadecimales
```
SECRET_KEY=a1b2c3d4e5f6...
```


### 4️⃣ URLs (Desarrollo Local)
```
BACKEND_URL=http://localhost:8000
SOCKET_URL=http://localhost:8000
```

Para producción, cambiar `localhost:8000` por tu dominio.


### 5️⃣ D&D 5e API
```
DND5E_API_BASE=https://www.dnd5eapi.co/api
```
(Sin cambios usualmente)


### 6️⃣ Environment
```
ENVIRONMENT=development
```
- `development` → Modo desarrollo  
- `production` → Modo producción

---

## Frontend Setup (`frontend/.env` si está configurado)

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## ⚠️ Checklist de Seguridad

- ✅ `.env` está en `.gitignore` → NO se sube a GitHub
- ✅ Keys en `.env.example` son placeholders
- ✅ Jamás compartir `.env` con credenciales reales
- ✅ Cambiar keys si accidentalmente se exponen
- ✅ En GitHub secretos: Settings → Secrets and Variables

---

## 🚀 Después de Configurar

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend
cd frontend
npm install
npm run dev
```

URLs:
- Frontend: http://localhost:5177
- Backend: http://localhost:8000

---

**Última actualización:** Abril 2026  
**¿Preguntas?** Referirse a `.env.example` para estructura

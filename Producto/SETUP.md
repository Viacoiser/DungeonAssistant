# Setup Rápido

## Windows

```bash
# Clonar/Descargar proyecto
cd DungeonAssistant

# Ejecutar instalador
install.bat
```

## macOS / Linux

```bash
# Clonar/Descargar proyecto
cd DungeonAssistant

# Ejecutar instalador
chmod +x install.sh
./install.sh
```

## Manual Setup

### Backend

```bash
cd backend

# Crear venv
python -m venv venv

# Activar (Windows)
venv\Scripts\activate
# Activar (macOS/Linux)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
# Editar .env con tus credenciales de Supabase, Gemini, etc.

# Iniciar servidor
python -m uvicorn main:socket_app --reload
# La API estará en http://localhost:8000
# Docs en http://localhost:8000/docs
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
# Editar .env con tus URLs

# Iniciar dev server
npm run dev
# La app estará en http://localhost:5173
```

## Credenciales Necesarias

### Supabase
1. Ve a https://supabase.com
2. Crea un proyecto nuevo
3. Copia:
   - `SUPABASE_URL` → variable de entorno
   - `SUPABASE_SERVICE_KEY` → backend `.env`
   - `SUPABASE_ANON_KEY` → frontend `.env`

### Google Gemini
1. Ve a https://ai.google.dev
2. Crea API key
3. Copia `GEMINI_API_KEY` → backend `.env`

## Verificar Setup

```bash
# Backend
curl http://localhost:8000/health
# Respuesta: {"status":"ok","service":"DungeonAssistant API","version":"0.1.0"}

# Frontend
# Abre http://localhost:5173 en navegador
```

## Estructura de Carpetas

```
backend/
├── routers/         # Endpoints REST
├── services/        # Lógica de negocio (IA, BD, etc.)
├── models/          # Pydantic schemas
├── main.py          # App FastAPI + Socket.io
└── requirements.txt

frontend/
├── src/
│   ├── pages/       # Componentes de página
│   ├── components/  # Componentes reutilizables
│   ├── store/       # Zustand stores
│   ├── services/    # API, Socket.io, Speech
│   ├── App.jsx
│   └── main.jsx
├── public/          # Assets estáticos
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Próximos Pasos

1. ✅ Setup completado
2. → [Fase 2: Autenticación](./IMPLEMENTATION_PLAN.md#-fase-2-supabase--autenticación)
3. → [Ver plan completo](./IMPLEMENTATION_PLAN.md)

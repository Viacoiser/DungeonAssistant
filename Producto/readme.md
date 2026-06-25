# DungeonAssistant

**DungeonAssistant** es un ecosistema inteligente de gestión de juegos de rol (RPG), diseñado como una Progressive Web App (PWA) mobile-first para campañas de D&D 5e potenciada por Inteligencia Artificial. Facilita la experiencia de juego tanto para Dungeon Masters (DMs) como para jugadores mediante herramientas avanzadas de automatización, sincronización en tiempo real y generación de contenido interactivo.

## Descripción del Proyecto

El proyecto tiene como objetivo revolucionar la forma en que se gestionan y juegan las campañas de Dungeons & Dragons 5a Edición. Mediante una interfaz responsiva y moderna optimizada para dispositivos móviles, DungeonAssistant ofrece:
- **Gestión de Personajes:** Creación y control interactivo de hojas de personaje con validación de reglas oficiales de D&D 5e.
- **Generación de NPCs con IA:** Creación dinámica de personajes no jugables con trasfondos y rasgos integrados mediante la API de Google Gemini (RAG).
- **Digitalización por OCR:** Escaneo y digitalización instantánea de hojas de personaje físicas utilizando Gemini Vision.
- **Sincronización en Tiempo Real:** Comunicación fluida y actualizaciones instantáneas durante las sesiones de juego mediante Socket.io.
- **Entrada por Voz:** Interacción manos libres con el asistente utilizando Web Speech API.

---

## Estructura del Equipo

El desarrollo y gestión de **DungeonAssistant** está liderado por un equipo multidisciplinario:

| Nombre | Rol |
| :--- | :--- |
| **Cristóbal Mira** | Product Owner |
| **Maverick Valdes** | Arquitecto Backend |
| **Francisco Toloza** | Fullstack Developer |

---

## Estructura

```
DungeonAssistant/
├── backend/              # Python FastAPI
│   ├── routers/         # Endpoints
│   ├── services/        # Logica de negocio
│   ├── models/          # Pydantic schemas
│   ├── main.py          # App principal
│   └── requirements.txt
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── assets/      # Imagenes y media optimizados
│   │   ├── pages/       # Componentes de pagina
│   │   ├── components/  # Componentes reutilizables
│   │   ├── store/       # Zustand stores
│   │   ├── services/    # API, Socket.io, Speech
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Editar .env con tus credenciales

python -m uvicorn main:socket_app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Editar .env con tus URLs

npm run dev
```

## Stack Tecnologico

### Frontend
- React 18 + Vite
- Tailwind CSS (mobile-first)
- Zustand (estado global)
- Socket.io (tiempo real)
- Web Speech API
- PWA (vite-plugin-pwa)

### Backend
- Python 3.11+
- FastAPI
- Pydantic v2
- Socket.io (WebSockets)

### Datos & IA
- PostgreSQL via Supabase
- Google Gemini API
- Gemini Vision (OCR)
- dnd5eapi.co

## Features

- Autenticacion sin roles globales (roles por campana)
- Gestion de personajes con validacion D&D 5e
- OCR de hojas fisicas con Gemini Vision
- Generador de NPCs con RAG
- Asistente conversacional
- Entrada de voz (Web Speech API)
- Sincronizacion en tiempo real (Socket.io)
- PWA con offline support

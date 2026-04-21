# DungeonAssistant

Ecosistema Inteligente de Gestion RPG - PWA mobile-first para campanas D&D 5e con IA

## Proyecto

[Ver especificacion completa](./DungeonAssistant_BuildPrompt_v2.md)

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

##  Estado del Proyecto (Kanban & Roadmap)

###  Fase 2: Autenticación, Campañas y Roles - [PROGRESO: 85%]
- [x] **T-04**: Welcome Page interactiva (Login/Registro).
- [x] **T-05**: Creación de Campañas (Nombre y Lore).
- [x] **T-06**: Listado de campañas del usuario.
- [x] **T-10**: Vista detalle de campaña con gestión GM.
- [ ] ~~**T-08/09**: Cambio y transferencia de rol (GM/Player via Socket.io)~~ -> **[PENDIENTE: Requiere implementación de WebSockets]**

###  Fase 3: Hoja de Personaje & Sesiones en Tiempo Real - [PROGRESO: 40%]
*Enfoque: Gestión de NPCs terminada (Módulo complementario).*

- [x] **T-12 (NPCs)**: Visualización de hoja con stats en grid y secciones colapsables (Secreto colapsable).
- [x] **T-13/14 (NPCs)**: Edición de personaje e inventario dinámico.
- [x] **Generador IA (Extras)**: Tirada de rasgos aleatorios integrada con Gemini.
- [x] **Resumen automático**: Gemini genera un resumen tras cerrar sesión que actualiza el `lore_summary` de la campaña.
- [ ] **Hoja oficial D&D 5e**: Formulario con validación total contra *dnd5eapi.co* -> **[PENDIENTE: Fase 3 Base]**
- [ ] **Sincronización en tiempo real**: Notificación de inicio de sesión y notas compartidas -> **[PENDIENTE: Requiere Socket.io]**

###  Notas y Análisis de IA
- [x] **T-15**: Registro de notas personales por sesión.
- [x] **T-16**: Análisis automático vía Gemini (Detección de NPCs e ítems mágicos).

---

> [!NOTE]
> **Nota de Desarrollo:** Las funcionalidades marcadas con ~~tachado~~ o como pendientes estructurales de la Fase 2 y 3 requieren la integración de una capa de mensajería en tiempo real (**Socket.io**). Actualmente, el sistema opera bajo un modelo de consulta directa a Base de Datos (Supabase).

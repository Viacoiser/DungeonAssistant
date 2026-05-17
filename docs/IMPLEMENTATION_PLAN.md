# 📑 Plan de Implementación - DungeonAssistant

## 📌 Resumen Ejecutivo

Este documento define el plan detallado para implementar DungeonAssistant en 5 fases progresivas. Cada fase agrega funcionalidades incrementales, permitiendo testing temprano y iteración continua.

**Timeline Total:** ~10-15 sesiones de desarrollo  
**Inicio:** Fase 1  
**Progreso Actual:** Fase 2 ✅ COMPLETADA

---

## 🏗️ Fase 1: Setup & Estructura (COMPLETADA ✅)

### Objetivos
Establecer la base del proyecto con estructura de carpetas, dependencias y configuración inicial.

### Tareas Completadas
- [x] Estructura de carpetas backend (routers, services, models)
- [x] Estructura de carpetas frontend (pages, components, services, store)
- [x] FastAPI + Uvicorn configurado
- [x] React + Vite + Tailwind CSS configurado
- [x] PWA setup (vite-plugin-pwa)
- [x] Zustand store structure (4 stores base)
- [x] 35+ Pydantic models definidos
- [x] requirements.txt y package.json con versiones locked
- [x] Documentación (README, SETUP, ARCHITECTURE, etc.)
- [x] Scripts de instalación (Windows/Unix)

### Entregables
```
50+ archivos creados
~1,500 líneas backend Python
~2,000 líneas frontend JavaScript/JSX
~2,000 líneas documentación
```

### Validación
- [x] Backend inicia sin errores: `python -m uvicorn main:app --reload`
- [x] Frontend inicia sin errores: `npm run dev`
- [x] CORS configurado correctamente
- [x] Socket.io conecta sin fallos

---

## 🔐 Fase 2: Autenticación (COMPLETADA ✅)

### Objetivos
Implementar sistema seguro de autenticación con Supabase y JWT tokens.

### Tareas Completadas

#### Backend
- [x] SQL Schema completo con 10 tablas
  - users, campaigns, campaign_members, characters, inventories
  - sessions, session_notes, npcs, factions, role_change_requests
- [x] RLS policies para cada tabla
- [x] Índices para performance
- [x] Triggers para updated_at automático
- [x] Supabase client service (200+ líneas)
  - register_user, login_user, get_user_by_token
  - create_campaign, get_user_campaigns, join_campaign
- [x] Auth middleware con JWT validation
- [x] 4 auth endpoints (register, login, logout, me)
- [x] Error handling completo (400, 401, 500)

#### Frontend
- [x] ProtectedRoute wrapper component
- [x] App.jsx auto-login con validación
- [x] Routes configuradas (public + protected)
- [x] Login page (validación, API, state)
- [x] Register page (validación completa, API, state)
- [x] Dashboard mejorado (logout, lista de campañas)
- [x] API client actualizado (auth_token consistency)

#### Security
- [x] JWT tokens con Bearer scheme
- [x] CORS restringido a localhost
- [x] Supabase RLS policies
- [x] Password hashing (Supabase)
- [x] Token interceptor automático

#### Testing & Docs
- [x] PHASE2_AUTHENTICATION.md (arquitectura detallada)
- [x] TESTING_GUIDE.md (6 test cases completos)
- [x] .env.example (variables de entorno)

### Diagrama de Flujo
```
Register → Supabase Auth + users table → Login → JWT Token → ProtectedRoute → Dashboard
                                                      ↑
                                          Auto-login on refresh
```

### Validación (Post-Fase 2)
- [x] Registro exitoso con validación
- [x] Login con credenciales correctas
- [x] Login falla con credenciales incorrectas
- [x] Auto-login en page refresh
- [x] Logout limpia sesión completamente
- [x] Routes protegidas redirigen a login
- [x] Token en Authorization header en todas las requests

---

## 🎯 Fase 3: CRUD de Campañas

### Objetivos
Permitir a usuarios crear, listar, actualizar y eliminar campañas con roles (GM vs Player).

### Tareas Pendientes

#### Backend - Endpoints Campañas
- [ ] `POST /campaigns` (200 líneas)
  - Input: name, description
  - Creator automáticamente GM
  - Respuesta: 201 + campaign data
  
- [ ] `GET /campaigns` (100 líneas)
  - Retorna campañas del usuario autenticado
  - Incluye rol del usuario en cada campaña
  - Respuesta: 200 + list de campañas
  
- [ ] `GET /campaigns/{id}` (80 líneas)
  - Detalles de una campaña específica
  - Solo visible para miembros (RLS)
  - Respuesta: 200 + campaign detail
  
- [ ] `PUT /campaigns/{id}` (100 líneas)
  - Update de nombre/descripción
  - Solo por GM (validar en backend)
  - Respuesta: 200 + updated campaign
  
- [ ] `DELETE /campaigns/{id}` (60 líneas)
  - Solo por GM
  - Borrar campañas y datos relacionados
  - Respuesta: 204 No Content
  
- [ ] `POST /campaigns/{id}/join` (150 líneas)
  - Unirse a campaña con código de acceso
  - Validar que no sea GM
  - Agregar a campaign_members con rol Player
  - Respuesta: 201 + membership data
  
- [ ] `GET /campaigns/{id}/members` (80 líneas)
  - Listar todos los miembros de campaña
  - Incluir rol y usuario data
  - Respuesta: 200 + members list

#### Backend - Servicios
- [ ] Mejorar supabase.py con métodos de campaign
- [ ] Validaciones de negocio (GM-only, access control)
- [ ] Error handling mejorado

#### Frontend - Componentes
- [ ] Modal/página de crear campaña
- [ ] Form con name + description
- [ ] Integración con POST /campaigns
- [ ] Refrescar lista después de crear
- [ ] Loading states y error handling

#### Frontend - Dashboard
- [ ] Cargar campañas reales del servidor (GET /campaigns)
- [ ] Botón "Nueva Campaña" → abrir modal
- [ ] Clic en campaña → navegar a /campaigns/{id}
- [ ] Mostrar rol en cada tarjeta (👑 GM vs ⚔️ Player)
- [ ] Mostrar contador de miembros

#### Frontend - Nueva Página
- [ ] `/campaigns/{id}` detail page
  - Nombre, descripción, GM, miembros
  - Tabs: Sesiones, Personajes, NPCs
  - Botones de acción según rol

#### Base de Datos
- [x] `campaigns` table (ya en schema)
- [x] `campaign_members` table (ya en schema)
- [x] RLS policies (ya en schema)

### Diagrama
```
Dashboard
  ├── GET /campaigns (listar)
  └── POST /campaigns (crear)
      └── Dashboard actualiza
          └── Mostrar nuevas campañas
              └── Clic → /campaigns/{id}
                  ├── GET /campaigns/{id}
                  ├── GET /campaigns/{id}/members
                  └── Tabs (sesiones, personajes, NPCs)
```

### Estimado
- Backend: 2 horas (700 líneas)
- Frontend: 2 horas (400 líneas)
- Testing: 1 hora
- **Total: 3-4 sesiones**

### Validación
- [ ] Crear campaña exitosamente
- [ ] Listar campañas en Dashboard
- [ ] Navegar a detalle de campaña
- [ ] Update de campaña (solo GM)
- [ ] Delete de campaña (solo GM)
- [ ] Unirse a campaña con código
- [ ] Ver lista de miembros
- [ ] RLS policies funcionan (no ver campañas ajenas)

---

## 📅 Fase 4: Gestión de Sesiones

### Objetivos
Permitir crear sesiones, tomar notas, ver historial y generar resúmenes.

### Tareas Pendientes

#### Backend - Endpoints Sesiones
- [ ] `POST /campaigns/{id}/sessions` (150 líneas)
  - Crear nueva sesión
  - Campos: number, title, description
  
- [ ] `GET /campaigns/{id}/sessions` (100 líneas)
  - Listar sesiones de campaña
  - Ordenadas por sesión number (DESC)
  
- [ ] `POST /sessions/{id}/start` (80 líneas)
  - Marcar sesión como activa
  - Timestamp de inicio
  
- [ ] `POST /sessions/{id}/end` (80 líneas)
  - Marcar sesión como finalizada
  - Timestamp de fin
  
- [ ] `POST /sessions/{id}/notes` (100 líneas)
  - Agregar nota a sesión
  - Author (usuario que escribe)
  - Timestamp automático
  
- [ ] `GET /sessions/{id}/notes` (80 líneas)
  - Listar notas de sesión
  - Ordenadas por timestamp (DESC)

#### Frontend - Componentes
- [ ] Session timeline component
- [ ] Session note card component
- [ ] Note creation form
- [ ] Session detail view

#### Frontend - Páginas
- [ ] `/campaigns/{id}/sessions` list page
  - Timeline de sesiones
  - Botón para crear sesión
  - Clic en sesión → detail
  
- [ ] `/campaigns/{id}/sessions/{id}` detail page
  - Información de sesión
  - Timeline de notas
  - Formulario para agregar nota
  - Botones start/end (solo GM)

#### Base de Datos
- [x] `sessions` table (ya en schema)
- [x] `session_notes` table (ya en schema)

### Estimado
- Horas: 3-4 sesiones
- Líneas: ~800 backend + 500 frontend

---

## 🤖 Fase 5: AI & Features Avanzadas

### Objetivos
Integrar IA de Google para NPC generation, OCR de character sheets, y chat assistant.

### Tareas Pendientes

#### Google Gemini - NPC Generation
- [ ] Integrar Google Gemini 1.5 Flash API
- [ ] Implementar prompt engineering para NPCs D&D 5e
- [ ] Endpoint: `POST /campaigns/{id}/npcs/generate`
  - Input: prompt del GM
  - Output: NPC generado con traits, background, personality
- [ ] Cache de NPCs generados
- [ ] UI para generar + editar NPCs

#### Google Gemini Vision - OCR
- [ ] Integrar Google Gemini Vision API
- [ ] OCR de character sheets D&D 5e
- [ ] Endpoint: `POST /vision/digitize`
  - Input: image URL
  - Output: character data estructurado
- [ ] UI para upload de imágenes
- [ ] Auto-llenar formulario de personaje

#### Assistant - Chat
- [ ] Chat endpoint: `POST /assistant/chat`
  - Context: campaña + reglas D&D
  - RAG con dnd5eapi.co
- [ ] Respuestas context-aware
- [ ] Sugerencias de reglas
- [ ] Historial de chat

#### Features Avanzadas
- [ ] Real-time sync con Socket.io
  - Campaign updates (miembros actualizan en vivo)
  - Session notes sync
  - Character updates
  
- [ ] Notificaciones push
  - Nuevo miembro en campaña
  - Nueva sesión iniciada
  - Notas agregadas
  
- [ ] Sharing & Invitations
  - Generar invite links
  - Código de acceso a campaña
  
- [ ] Export a PDF
  - Character sheet exportable
  - Resumen de sesión
  - Campaign stats
  
- [ ] Maps integrados
  - Foundry VTT integration (optional)
  - Local map editor
  
- [ ] Character portraits DB
  - Galería de portraits
  - Upload custom
  - Attribution

### Estimado
- Horas: 5-7 sesiones
- Líneas: ~2000+ backend + 1500+ frontend

---

## 📊 Resumen por Fase

| Fase | Nombre | Estado | Backend | Frontend | Docs | Horas | Files |
|------|--------|--------|---------|----------|------|-------|-------|
| 1 | Setup | ✅ | 1500 | 2000 | 2000 | 6-8 | 50+ |
| 2 | Auth | ✅ | 350 | 700 | 1000 | 4-5 | 12 |
| 3 | Campaigns | ⏳ | 700 | 400 | 500 | 3-4 | 10 |
| 4 | Sessions | ⏳ | 600 | 400 | 300 | 3-4 | 8 |
| 5 | AI/Features | ⏳ | 2000 | 1500 | 800 | 5-7 | 20 |
| | **TOTAL** | **40%** | **~5,150** | **~5,000** | **~4,600** | **~20-28** | **~100** |

---

## 🔄 Ciclo de Desarrollo

Para cada fase se sigue este ciclo:

```
1. PLAN
   └─ Definir tasks, endpoints, components

2. IMPLEMENT
   ├─ Backend: modelos, servicios, rutas
   ├─ Frontend: componentes, páginas, servicios
   └─ Documentación: changelog, arquitectura

3. TEST
   ├─ Endpoints: Postman/curl
   ├─ UI: Manual testing
   └─ Integración: E2E flow

4. DOCUMENT
   ├─ Testing guide
   ├─ Known issues
   └─ Lessons learned

5. REVIEW & ITERATE
   └─ Bugfixes, perf optimizations
```

---

## 🎯 Criterios de Aceptación (por Fase)

### Fase 1 ✅
- [x] Backend inicia sin errores
- [x] Frontend inicia sin errores
- [x] Models definidos
- [x] Store structure list a

### Fase 2 ✅
- [x] Registro funcional
- [x] Login funcional
- [x] Auto-login funcional
- [x] Rutas protegidas funcionales
- [x] Logout limpia estado
- [x] Dashboard muestra usuario

### Fase 3 ⏳
- [ ] CRUD campañas funcional
- [ ] Dashboard actualiza dinámicamente
- [ ] Navegación a campaña detail
- [ ] RLS protege datos

### Fase 4 ⏳
- [ ] Create sesión funcional
- [ ] Notas syncronizadas
- [ ] Timeline visual
- [ ] Timestamps correctos

### Fase 5 ⏳
- [ ] NPC generation funcional
- [ ] OCR character sheet funcional
- [ ] Chat assistant funcional
- [ ] Real-time sync funcional

---

## 🚀 Quick Links

- [Testing Guide Phase 2](TESTING_GUIDE.md)
- [Phase 2 Details](PHASE2_AUTHENTICATION.md)
- [API Reference](API_REFERENCE.md)
- [Architecture](ARCHITECTURE.md)

---

**Última actualización:** Diciembre 2024  
**Próximo milestone:** Fase 3 - CRUD Campañas  
**Mantenedor:** GitHub Copilot + Usuario


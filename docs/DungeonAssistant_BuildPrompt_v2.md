# DungeonAssistant — Build Prompt Completo v2

Eres un desarrollador fullstack experto. Vas a construir DungeonAssistant,
una PWA mobile-first para gestión de campañas de Dungeons & Dragons 5e
con inteligencia artificial. A continuación tienes toda la especificación.

---

## STACK TECNOLÓGICO

### Frontend
- React + Vite
- Tailwind CSS (mobile-first, breakpoint md: para desktop)
- Zustand (estado global)
- vite-plugin-pwa (manifest.json + Service Worker automático)
- React Router DOM (navegación)
- Socket.io-client (tiempo real)
- Web Speech API (voz nativa del navegador)

### Backend
- Python 3.11+
- FastAPI (API REST asíncrona)
- Pydantic v2 (validación de datos)
- python-socketio (WebSockets)
- httpx (llamadas externas)

### Base de datos
- PostgreSQL vía Supabase
- Supabase Auth (autenticación)
- Supabase Realtime (sincronización en tiempo real)
- Supabase Storage (almacenamiento de imágenes de hojas físicas)

### IA y servicios externos
- Google Gemini API (gemini-1.5-flash): generación de PNJs, asistente
  conversacional RAG, análisis de bitácora
- Gemini Vision API: OCR de hojas físicas de D&D 5e
- dnd5eapi.co (API pública, sin clave): validación de clases, razas,
  hechizos y estadísticas oficiales de D&D 5e

---

## AUTENTICACIÓN Y ROLES

### Cuenta de usuario (sin rol global)
Todos los usuarios tienen una cuenta general. El rol NO es un atributo
del usuario, sino de su membresía en cada campaña. Una misma persona
puede ser GM en una campaña y Player en otra simultáneamente.

### Roles por campaña
- Al CREAR una campaña: el creador es automáticamente GM de esa campaña.
- Al UNIRSE a una campaña: el usuario elige si quiere ser GM o Player.
- Solo puede haber UN GM activo por campaña (restricción en BD).

### Cambio de rol
Un miembro puede solicitar cambiar su rol dentro de una campaña.
El GM activo recibe la solicitud y debe aprobarla o rechazarla.
Si el GM quiere ceder su rol, él elige a quién transferirlo
y esa persona debe aceptar. Al confirmar la transferencia,
el GM anterior queda automáticamente como Player.

---

## MODELO DE BASE DE DATOS (PostgreSQL / Supabase)

### Tabla: users
```sql
id          uuid PRIMARY KEY  -- gestionado por Supabase Auth
email       text UNIQUE NOT NULL
username    text NOT NULL
created_at  timestamptz DEFAULT now()
```

### Tabla: campaigns
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
description   text
lore_summary  text       -- resumen acumulativo del lore, actualizado por IA
is_active     boolean DEFAULT true
created_at    timestamptz DEFAULT now()
```

### Tabla: campaign_members
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id     uuid REFERENCES campaigns(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id)
role            text CHECK (role IN ('GM', 'PLAYER')) NOT NULL
status          text CHECK (status IN ('ACTIVE', 'PENDING_ROLE_CHANGE')) DEFAULT 'ACTIVE'
requested_role  text CHECK (requested_role IN ('GM', 'PLAYER'))  -- cuando pide cambio
joined_at       timestamptz DEFAULT now()

-- Restricción: solo un GM activo por campaña
CREATE UNIQUE INDEX one_gm_per_campaign
ON campaign_members(campaign_id)
WHERE role = 'GM' AND status = 'ACTIVE';
```

### Tabla: characters
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id   uuid REFERENCES campaigns(id) ON DELETE CASCADE
player_id     uuid REFERENCES users(id)
name          text NOT NULL
race          text NOT NULL   -- validado contra dnd5eapi.co
class         text NOT NULL   -- validado contra dnd5eapi.co
level         integer DEFAULT 1 CHECK (level >= 1 AND level <= 20)
background    text
alignment     text
stats         jsonb NOT NULL
  -- { strength, dexterity, constitution, intelligence, wisdom, charisma }
hp_max        integer NOT NULL
hp_current    integer NOT NULL
armor_class   integer
initiative    integer
speed         integer DEFAULT 30
proficiency_bonus integer
hit_dice      text
death_saves   jsonb DEFAULT '{"successes": 0, "failures": 0}'
saving_throws jsonb DEFAULT '{}'
  -- { strength: {proficient, value}, dexterity: {proficient, value}, ... }
skills        jsonb DEFAULT '{}'
  -- { acrobatics: {proficient, value}, ... }
passive_perception integer
attacks       jsonb DEFAULT '[]'
  -- [{ name, atk_bonus, damage_type }]
personality_traits  text
ideals              text
bonds               text
flaws               text
other_proficiencies text
equipment           text
features_traits     text
age           text
height        text
weight        text
eyes          text
skin          text
hair          text
appearance    text
backstory     text
allies_organizations jsonb DEFAULT '{}'
  -- { name, description }
additional_features text
treasure      text
spellcasting  jsonb DEFAULT '{}'
  -- { class, ability, spell_save_dc, spell_attack_bonus,
  --   cantrips: [], slots: { level_1: {total, expended, spells[]}, ... } }
image_url     text   -- Supabase Storage
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### Tabla: inventories
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
character_id  uuid REFERENCES characters(id) ON DELETE CASCADE
item_name     text NOT NULL
quantity      integer DEFAULT 1
description   text
is_magical    boolean DEFAULT false
added_at      timestamptz DEFAULT now()
```

### Tabla: sessions
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id     uuid REFERENCES campaigns(id) ON DELETE CASCADE
session_number  integer NOT NULL
title           text
date            date DEFAULT CURRENT_DATE
summary         text   -- generado por IA al finalizar
is_active       boolean DEFAULT false
started_at      timestamptz
ended_at        timestamptz
```

### Tabla: session_notes
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id      uuid REFERENCES sessions(id) ON DELETE CASCADE
author_id       uuid REFERENCES users(id)
content         text NOT NULL
detected_items  jsonb DEFAULT '[]'   -- [{ name, quantity }]
detected_npcs   jsonb DEFAULT '[]'   -- [{ name, description }]
created_at      timestamptz DEFAULT now()
```

### Tabla: npcs
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id           uuid REFERENCES campaigns(id) ON DELETE CASCADE
name                  text NOT NULL
race                  text
class                 text
personality           text
secrets               text
stats                 jsonb
relationship_to_party text
faction_id            uuid REFERENCES factions(id)
is_alive              boolean DEFAULT true
generated_by_ai       boolean DEFAULT false
created_at            timestamptz DEFAULT now()
```

### Tabla: factions
```sql
-- Las facciones son organizaciones o grupos de poder dentro del
-- mundo de la campaña (ej: Los Harpers, el Zhentarim).
-- La IA las usa como contexto para generar NPCs coherentes con el lore.
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id  uuid REFERENCES campaigns(id) ON DELETE CASCADE
name         text NOT NULL
description  text
alignment    text
goals        text
symbol       text   -- descripción del símbolo de la facción
created_at   timestamptz DEFAULT now()
```

### Tabla: role_change_requests
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
campaign_id   uuid REFERENCES campaigns(id) ON DELETE CASCADE
requester_id  uuid REFERENCES users(id)
requested_role text CHECK (requested_role IN ('GM', 'PLAYER')) NOT NULL
status        text CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING'
resolved_by   uuid REFERENCES users(id)
created_at    timestamptz DEFAULT now()
resolved_at   timestamptz
```

### Row Level Security (RLS) en Supabase
- campaigns: solo miembros de la campaña pueden leer
- campaign_members: cualquier miembro puede leer, solo el sistema escribe
- characters: solo el dueño y el GM de la campaña pueden escribir
- session_notes: cualquier miembro de la campaña puede escribir
- npcs: solo el GM puede crear/editar
- factions: solo el GM puede crear/editar
- role_change_requests: solo el GM puede aprobar/rechazar

---

## ARQUITECTURA BACKEND (FastAPI)

### Estructura de carpetas
```
/backend
  /routers
    auth.py           # register, login, logout
    campaigns.py      # CRUD campañas, membresía, cambio de rol
    gamemaster.py     # PNJs, facciones, gestor de campaña
    player.py         # personajes, inventario, bitácora
    vision.py         # OCR de hojas físicas
    sessions.py       # sesiones, notas, resúmenes
    realtime.py       # eventos Socket.io
  /services
    gemini.py         # PNJs RAG, asistente, análisis bitácora, resumen sesión
    vision.py         # Gemini Vision OCR con prompt de hoja oficial D&D 5e
    dnd5e.py          # wrapper de dnd5eapi.co
    supabase.py       # cliente Supabase
  /models
    schemas.py        # Pydantic models
  main.py             # app FastAPI + socket.io mount
```

### Endpoints principales
```
POST /auth/register                          → crear cuenta (sin rol)
POST /auth/login                             → login con Supabase Auth
POST /auth/logout                            → cerrar sesión

POST /campaigns                              → crear campaña (creador = GM automático)
GET  /campaigns                              → listar campañas del usuario
GET  /campaigns/{id}                         → detalle campaña
POST /campaigns/{id}/join                    → unirse eligiendo rol (GM o PLAYER)
GET  /campaigns/{id}/members                 → listar miembros y roles

POST /campaigns/{id}/role-requests          → solicitar cambio de rol
GET  /campaigns/{id}/role-requests          → listar solicitudes (solo GM)
PATCH /campaigns/{id}/role-requests/{req_id} → aprobar o rechazar (solo GM)
POST /campaigns/{id}/transfer-gm            → GM transfiere su rol a otro miembro

POST /campaigns/{id}/npcs                   → generar NPC con IA (RAG)
GET  /campaigns/{id}/npcs                   → listar NPCs
POST /campaigns/{id}/factions               → crear facción
GET  /campaigns/{id}/factions               → listar facciones
POST /campaigns/{id}/search                 → buscar en historial (lenguaje natural)

POST /characters                            → crear personaje (valida con dnd5eapi.co)
GET  /characters/{id}                       → detalle personaje
PUT  /characters/{id}                       → actualizar personaje

POST /sessions                              → crear sesión
POST /sessions/{id}/start                   → iniciar sesión (Socket.io broadcast)
POST /sessions/{id}/end                     → terminar sesión + resumen IA
POST /sessions/{id}/notes                   → guardar nota (detecta ítems/NPCs con IA)
GET  /sessions/{id}/notes                   → listar notas

POST /vision/digitize                       → OCR de hoja física con Gemini Vision
POST /assistant/chat                        → asistente conversacional RAG
```

### Socket.io eventos
```
join_campaign(campaign_id)       → usuario se une a la sala
session_started(session_id)      → GM inicia sesión, notifica a todos
session_ended(session_id)        → GM termina sesión
character_updated(character)     → sincroniza cambios de personaje
note_added(note)                 → nueva nota visible para todos
inventory_updated(inventory)     → actualización de inventario
role_request_received(request)   → GM recibe solicitud de cambio de rol
role_request_resolved(result)    → solicitante recibe respuesta del GM
gm_transfer_requested(request)   → miembro recibe solicitud de aceptar rol GM
```

---

## LÓGICA DE IA (Gemini)

### 1. Generador de PNJs (RAG)
Antes de llamar a Gemini, recupera de la BD:
- Los últimos 5 resúmenes de sesiones de la campaña
- Lista de NPCs existentes (nombres, personalidades, facciones)
- Facciones activas con sus objetivos

Prompt a Gemini:
```
Eres el narrador de una campaña de D&D. Basándote en este lore:
[lore_summary] y estos NPCs existentes: [npcs_list],
y estas facciones activas: [factions_list],
genera un NPC con las siguientes características: [user_input].
El NPC debe ser coherente con el universo establecido.
Devuelve JSON con: name, race, class, personality, secrets,
stats (objeto con str/dex/con/int/wis/cha), relationship_to_party,
faction_id (si aplica).
```

### 2. Detección en notas de bitácora
```
Analiza esta nota de sesión de D&D: [note_content]
Extrae en JSON:
- detected_items: [{ name, quantity }]
- detected_npcs: [{ name, description }]
Solo incluye ítems y NPCs explícitamente mencionados.
```

### 3. Asistente conversacional (RAG)
Recupera antes de llamar: todas las notas de sesiones, lista de NPCs,
inventarios de personajes, facciones.
```
Eres el asistente de una campaña de D&D. Tienes acceso al historial
completo: [context]. Responde esta pregunta: [user_question].
Basa tu respuesta ÚNICAMENTE en el historial proporcionado.
Si no tienes la información, dilo claramente.
```

### 4. Resumen de sesión
```
Resume en 3-5 párrafos esta sesión de D&D basándote en estas notas:
[notes]. Incluye: eventos principales, NPCs relevantes,
decisiones importantes y giros narrativos.
```

### 5. OCR con Gemini Vision — Hoja oficial D&D 5e
El prompt al enviar la imagen es el siguiente:

```
Eres un experto en hojas de personaje de D&D 5e.
La imagen que recibes es una fotografía de la hoja oficial de D&D 5e
de Wizards of the Coast, que puede estar manuscrita.

La hoja tiene esta estructura exacta que debes buscar:

PÁGINA 1:
- Cabecera: CHARACTER NAME, CLASS & LEVEL, BACKGROUND,
  PLAYER NAME, RACE, ALIGNMENT, EXPERIENCE POINTS
- Columna izquierda: 6 stats (STRENGTH, DEXTERITY, CONSTITUTION,
  INTELLIGENCE, WISDOM, CHARISMA) con score y modificador
- Centro superior: INSPIRATION, PROFICIENCY BONUS,
  ARMOR CLASS, INITIATIVE, SPEED
- HP: HIT POINT MAXIMUM, CURRENT HIT POINTS, TEMPORARY HIT POINTS
- HIT DICE, DEATH SAVES (successes/failures)
- Saving Throws: 6 valores con checkbox de proficiencia
- Skills: 18 habilidades con checkbox y valor
  (Acrobatics, Animal Handling, Arcana, Athletics, Deception,
   History, Insight, Intimidation, Investigation, Medicine,
   Nature, Perception, Performance, Persuasion, Religion,
   Sleight of Hand, Stealth, Survival)
- PASSIVE WISDOM (PERCEPTION)
- Tabla ATTACKS & SPELLCASTING: NAME / ATK BONUS / DAMAGE/TYPE
- Textos: PERSONALITY TRAITS, IDEALS, BONDS, FLAWS
- Textos: OTHER PROFICIENCIES & LANGUAGES, EQUIPMENT, FEATURES & TRAITS

PÁGINA 2 (si está presente):
- AGE, HEIGHT, WEIGHT, EYES, SKIN, HAIR
- CHARACTER APPEARANCE, CHARACTER BACKSTORY
- ALLIES & ORGANIZATIONS (nombre y símbolo)
- ADDITIONAL FEATURES & TRAITS, TREASURE

PÁGINA 3 (si está presente):
- SPELLCASTING CLASS, SPELLCASTING ABILITY,
  SPELL SAVE DC, SPELL ATTACK BONUS
- CANTRIPS (nivel 0)
- Niveles 1-9 con SLOTS TOTAL, SLOTS EXPENDED,
  lista de hechizos con checkbox de preparado (P)

Extrae TODO el texto manuscrito o impreso que puedas leer.
Si la letra es ilegible o ambigua, incluye el campo en
"low_confidence_fields" con tu mejor intento de lectura.
Si un campo está vacío o completamente ilegible, usa null.

Devuelve ÚNICAMENTE este JSON, sin texto adicional:
{
  "page1": {
    "character_name": "",
    "class_and_level": "",
    "background": "",
    "player_name": "",
    "race": "",
    "alignment": "",
    "experience_points": null,
    "stats": {
      "strength": { "score": null, "modifier": null },
      "dexterity": { "score": null, "modifier": null },
      "constitution": { "score": null, "modifier": null },
      "intelligence": { "score": null, "modifier": null },
      "wisdom": { "score": null, "modifier": null },
      "charisma": { "score": null, "modifier": null }
    },
    "inspiration": null,
    "proficiency_bonus": null,
    "armor_class": null,
    "initiative": null,
    "speed": null,
    "hp_maximum": null,
    "hp_current": null,
    "hp_temporary": null,
    "hit_dice": "",
    "death_saves": { "successes": null, "failures": null },
    "saving_throws": {
      "strength": { "proficient": false, "value": null },
      "dexterity": { "proficient": false, "value": null },
      "constitution": { "proficient": false, "value": null },
      "intelligence": { "proficient": false, "value": null },
      "wisdom": { "proficient": false, "value": null },
      "charisma": { "proficient": false, "value": null }
    },
    "skills": {
      "acrobatics": { "proficient": false, "value": null },
      "animal_handling": { "proficient": false, "value": null },
      "arcana": { "proficient": false, "value": null },
      "athletics": { "proficient": false, "value": null },
      "deception": { "proficient": false, "value": null },
      "history": { "proficient": false, "value": null },
      "insight": { "proficient": false, "value": null },
      "intimidation": { "proficient": false, "value": null },
      "investigation": { "proficient": false, "value": null },
      "medicine": { "proficient": false, "value": null },
      "nature": { "proficient": false, "value": null },
      "perception": { "proficient": false, "value": null },
      "performance": { "proficient": false, "value": null },
      "persuasion": { "proficient": false, "value": null },
      "religion": { "proficient": false, "value": null },
      "sleight_of_hand": { "proficient": false, "value": null },
      "stealth": { "proficient": false, "value": null },
      "survival": { "proficient": false, "value": null }
    },
    "passive_perception": null,
    "attacks": [
      { "name": "", "atk_bonus": "", "damage_type": "" }
    ],
    "personality_traits": "",
    "ideals": "",
    "bonds": "",
    "flaws": "",
    "other_proficiencies_languages": "",
    "equipment": "",
    "features_traits": ""
  },
  "page2": {
    "age": "",
    "height": "",
    "weight": "",
    "eyes": "",
    "skin": "",
    "hair": "",
    "character_appearance": "",
    "character_backstory": "",
    "allies_organizations": { "name": "", "description": "" },
    "additional_features_traits": "",
    "treasure": ""
  },
  "page3": {
    "spellcasting_class": "",
    "spellcasting_ability": "",
    "spell_save_dc": null,
    "spell_attack_bonus": null,
    "cantrips": [],
    "spell_slots": {
      "level_1": { "total": null, "expended": null, "spells": [] },
      "level_2": { "total": null, "expended": null, "spells": [] },
      "level_3": { "total": null, "expended": null, "spells": [] },
      "level_4": { "total": null, "expended": null, "spells": [] },
      "level_5": { "total": null, "expended": null, "spells": [] },
      "level_6": { "total": null, "expended": null, "spells": [] },
      "level_7": { "total": null, "expended": null, "spells": [] },
      "level_8": { "total": null, "expended": null, "spells": [] },
      "level_9": { "total": null, "expended": null, "spells": [] }
    }
  },
  "ocr_confidence": {
    "low_confidence_fields": [],
    "unreadable_fields": []
  }
}
```

### Flujo de revisión post-OCR en el frontend (OCRUploader.jsx)
1. El usuario sube foto desde cámara (mobile) o archivo (desktop)
2. Preview de la imagen escaneada visible mientras se procesa
3. Loading skeleton mientras Gemini Vision analiza
4. Al recibir el JSON, se muestra formulario con todos los campos:
   - Campos con valor → pre-rellenados y editables
   - Campos null → borde rojo, placeholder "No detectado — completa aquí"
   - Campos en low_confidence_fields → borde amarillo, ícono ⚠️ "Verifica este campo"
   - Campos en unreadable_fields → borde rojo, placeholder "Ilegible — escribe aquí"
5. Botón "Confirmar y crear personaje" habilitado solo cuando
   los campos obligatorios estén completos: name, race, class, stats
6. Botón "Escanear de nuevo" siempre visible
7. Al confirmar, se valida race y class contra dnd5eapi.co antes de guardar

---

## FRONTEND — ESTRUCTURA Y DISEÑO

### Estructura de carpetas
```
/frontend/src
  /pages
    Login.jsx
    Register.jsx
    Dashboard.jsx           -- lista de campañas del usuario
    CampaignDetail.jsx      -- vista de campaña con miembros y sesiones
    JoinCampaign.jsx        -- elegir rol al unirse
    RoleRequests.jsx        -- GM ve y gestiona solicitudes de cambio de rol
    CharacterSheet.jsx
    GameMasterView.jsx
    NPCGenerator.jsx
    SessionView.jsx
  /components
    /mobile
      BottomNav.jsx          -- navegación inferior (solo mobile)
      FloatingActionBtn.jsx
    /desktop
      Sidebar.jsx            -- barra lateral (solo desktop)
    CharacterCard.jsx
    NPCCard.jsx
    FactionCard.jsx
    VoiceInput.jsx           -- Web Speech API
    ChatAssistant.jsx
    InventoryList.jsx
    OCRUploader.jsx          -- upload + preview + formulario de revisión
    RoleRequestBadge.jsx     -- notificación de solicitudes pendientes
  /store
    useAuthStore.js          -- Zustand: usuario
    useCampaignStore.js      -- Zustand: campaña activa y rol del usuario en ella
    useCharacterStore.js     -- Zustand: personaje activo
    useSocketStore.js        -- Zustand: conexión Socket.io
  /services
    api.js                   -- fetch hacia FastAPI
    socket.js                -- configuración Socket.io
    speech.js                -- Web Speech API wrapper
```

### Layout diferenciado mobile/desktop con Tailwind
```jsx
<div className="flex">
  {/* Sidebar solo desktop */}
  <aside className="hidden md:flex w-60 flex-col bg-[#1A3A5C] min-h-screen">
    <Sidebar />
  </aside>

  {/* Contenido principal */}
  <main className="flex-1 pb-20 md:pb-0 bg-[#F5F0E8]">
    <Outlet />
  </main>

  {/* Nav inferior solo mobile */}
  <nav className="fixed bottom-0 md:hidden w-full bg-[#1A3A5C] border-t border-[#C8A84B]">
    <BottomNav />
  </nav>
</div>
```

Mobile (< md):
- Bottom navigation fija con 4 íconos: Inicio | Personaje | Sesión | Asistente
- Floating Action Button (+) para acciones rápidas
- Cards apiladas verticalmente, texto grande, botones con py-4

Desktop (>= md):
- Sidebar fija izquierda (240px) con navegación completa
- Grid de 2-3 columnas en vistas principales
- Panel de asistente siempre visible a la derecha (vista GM)

### Paleta de colores
```
Primary:     #1A3A5C   (azul oscuro medieval)
Secondary:   #C8A84B   (dorado / pergamino)
Accent:      #8B1A1A   (rojo oscuro / peligro)
Background:  #F5F0E8   (pergamino claro)
Dark bg:     #0F1E2E   (noche / mazmorra)
Text:        #1A1A1A
Muted:       #6B7280
Success:     #2D6A4F
Surface:     #FFFFFF
```

### Tipografía
- Títulos: font-serif (Cinzel o Georgia como fallback)
- Cuerpo: font-sans (Inter o system-ui)
- Stats/números: font-mono

### Componentes clave

**CharacterSheet.jsx:**
- Stats en grid 3x2 con círculos
- Modificadores calculados: Math.floor((stat - 10) / 2)
- Barra HP con color dinámico: verde > 60%, amarillo 30-60%, rojo < 30%
- Secciones colapsables: hechizos, inventario, trasfondo
- Edición inline por campo
- Sincronización en tiempo real vía Socket.io

**VoiceInput.jsx:**
- Usa window.SpeechRecognition || window.webkitSpeechRecognition
- Idioma: es-CL por defecto, configurable
- Botón con animación pulsante al grabar
- Transcripción visible en tiempo real
- Al terminar, envía nota a la API automáticamente

**OCRUploader.jsx:**
- Input de cámara en mobile: accept="image/*" capture="environment"
- Preview de imagen antes de enviar
- Skeleton loading mientras Gemini procesa
- Formulario de revisión con campos pre-rellenados y sistema de semáforo:
  - Verde: campo detectado con alta confianza
  - Amarillo ⚠️: campo en low_confidence_fields
  - Rojo: campo null o en unreadable_fields
- Botón confirmar habilitado solo con campos obligatorios completos
- Validación de race/class contra dnd5eapi.co antes de guardar

**RoleRequestBadge.jsx:**
- Notificación visible en el sidebar/navbar del GM
- Badge con número de solicitudes pendientes
- Al hacer click abre modal con lista de solicitudes:
  nombre del solicitante, rol actual, rol solicitado
- Botones Aprobar / Rechazar por solicitud
- Al aprobar, actualiza en tiempo real vía Socket.io

---

## PWA CONFIG (vite-plugin-pwa)

```javascript
// vite.config.js
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'DungeonAssistant',
    short_name: 'DungeonAI',
    description: 'Gestión inteligente de campañas D&D',
    theme_color: '#1A3A5C',
    background_color: '#F5F0E8',
    display: 'standalone',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  }
})
```

---

## VARIABLES DE ENTORNO

**Backend (.env):**
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
DND5E_API_BASE=https://www.dnd5eapi.co/api
```

**Frontend (.env):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

---

## FLUJO DE AUTENTICACIÓN

1. Usuario se registra con email, contraseña y username (sin rol global)
2. Supabase Auth emite JWT
3. JWT se guarda en Zustand
4. Al crear campaña → usuario queda como GM automáticamente
5. Al unirse a campaña → elige rol en el momento (GM o Player)
6. Para cambiar rol → envía solicitud → GM aprueba/rechaza vía Socket.io
7. Cada request al backend lleva header: Authorization: Bearer {token}
8. FastAPI valida el JWT con Supabase y determina el rol según campaign_members

---

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. Setup Supabase: tablas, RLS, Auth
2. Backend: FastAPI base + autenticación sin rol global
3. Frontend: Login/Register + Zustand auth
4. CRUD de campañas + flujo de membresía y roles por campaña
5. Solicitud y aprobación de cambio de rol (Socket.io)
6. CRUD de personajes con validación dnd5eapi.co
7. Socket.io: sesiones en tiempo real
8. Gemini: generador de PNJs con RAG + facciones como contexto
9. Gemini: asistente conversacional
10. Gemini Vision: OCR de hoja oficial D&D 5e + flujo de revisión
11. Web Speech API: bitácora por voz
12. PWA: manifest + Service Worker
13. Pulir UI mobile/desktop

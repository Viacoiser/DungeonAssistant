# Architecture

## Overall Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (PWA - React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Pages      │  │ Components   │  │   Stores (Zustand)     │ │
│  │ - Login      │  │ - CharSheet  │  │ - useAuthStore         │ │
│  │ - Dashboard  │  │ - NPCCard    │  │ - useCampaignStore     │ │
│  │ - Character  │  │ - OCRUpload  │  │ - useCharacterStore    │ │
│  │ - Session    │  │ - VoiceInput │  │ - useSocketStore       │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                   │
│  Services:                                                        │
│  - api.js (axios) → REST calls                                   │
│  - socket.js (socket.io-client) → WebSocket                      │
│  - speech.js (Web Speech API) → Voice input                      │
│  - PWA (vite-plugin-pwa) → Offline support                       │
└──────────────────────────────────────────────────────────────────┘
                              ↕ HTTP / WebSocket
┌──────────────────────────────────────────────────────────────────┐
│              SERVER (FastAPI + Socket.io)                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Routers    │  │  Services    │  │   Models (Pydantic)      │ │
│  │ - auth     │  │ - supabase   │  │ - UserRegister           │ │
│  │ - campaigns│  │ - gemini     │  │ - CampaignCreate         │ │
│  │ - player   │  │ - dnd5e      │  │ - CharacterCreate        │ │
│  │ - sessions │  │ - vision     │  │ - SessionNoteCreate      │ │
│  │ - vision   │  │              │  │ - RoleChangeRequest      │ │
│  │ - gm       │  │              │  │ - NPCResponse            │ │
│  └────────────┘  └──────────────┘  └──────────────────────────┘ │
│                                                                   │
│  Socket.io Events:                                               │
│  - join_campaign → enter room                                    │
│  - session_started → broadcast                                   │
│  - note_added → sync all                                         │
│  - character_updated → broadcast                                 │
│  - role_request_resolved → notify                                │
└──────────────────────────────────────────────────────────────────┘
                              ↕ SQL
┌──────────────────────────────────────────────────────────────────┐
│            DATABASE (PostgreSQL via Supabase)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Tables     │  │ Services     │  │   External APIs        │ │
│  │ - users      │  │ - Auth       │  │ - Gemini API           │ │
│  │ - campaigns  │  │ - Realtime   │  │ - Gemini Vision        │ │
│  │ - members    │  │ - Storage    │  │ - dnd5eapi.co          │ │
│  │ - characters │  │ - Vectors*   │  │                        │ │
│  │ - sessions   │  │              │  │ *Para RAG futuro       │ │
│  │ - npcs       │  │              │  │                        │ │
│  │ - factions   │  │              │  │                        │ │
│  │ - role_reqs  │  │              │  │                        │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
1. User → Register/Login
2. Supabase Auth → JWT token
3. Token → localStorage
4. All requests → Authorization: Bearer {token}
5. Backend → Validate JWT
6. JWT decoded → user_id + determine campaign_id role
```

## Campaign Workflow

```
1. Admin creates campaign → becomes GM automatically
2. Player joins campaign → chooses role (GM/PLAYER)
3. Player requests role change → GM receives notification
4. GM approves/rejects via Socket.io → instant sync
5. New role → RLS enforced on all queries
```

## Session Workflow

```
1. GM creates session
2. GM starts session → Socket.io broadcast
3. Players see session active
4. Any member adds note (voice/text)
5. IA detects items/NPCs automatically
6. GM ends session → IA generates summary
7. Summary stored in campaign lore
```

## IA/RAG Workflow

```
NPC Generation:
- Retrieve: last 5 session summaries + existing NPCs + active factions
- Send to Gemini with prompt
- Return structured JSON
- Store in DB

Session Notes Analysis:
- Receive note content
- Send to Gemini: "extract items and NPCs"
- Store detected items/NPCs in DB

Session Summary:
- On session end: collect all notes
- Send to Gemini: "summarize these notes"
- Update campaign lore_summary
```

## OCR Workflow

```
1. User uploads image (camera/file)
2. Show preview + loading
3. Send to Gemini Vision
4. Receive JSON with confidence levels
5. Show form with color-coded fields:
   - Green: high confidence
   - Yellow: medium confidence (needs review)
   - Red: low confidence (needs fill)
6. User edits if needed
7. Validate race/class against dnd5eapi.co
8. Save character to DB
```

## Real-time Sync

```
Socket.io Implementation:
- Room per campaign: "campaign_{id}"
- Events:
  - "join_campaign" → sio.enter_room()
  - "session_started" → broadcast to room
  - "note_added" → broadcast to room
  - "character_updated" → broadcast to room
  - "inventory_updated" → broadcast to room
  - "role_request_resolved" → direct to user

All subscribers in room get instant updates
```

## Mobile vs Desktop UX

```
MOBILE (<md):
- Bottom navigation (fixed)
- Floating Action Button (+)
- Full-width cards stacked
- Large touch targets (py-4)
- Single column layout

DESKTOP (>=md):
- Left sidebar (fixed 240px)
- Main content area flexible
- Right panel (assistant)
- Multi-column grids
- Keyboard shortcuts

Shared:
- Tailwind mobile-first classes
- Responsive typography
- Color scheme (medieval D&D theme)
```

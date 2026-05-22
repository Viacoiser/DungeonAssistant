"""
DungeonAssistant - API Endpoints Reference
Documentación de todos los endpoints disponibles
"""

ENDPOINTS = {
    "SYSTEM": {
        "GET /": {
            "description": "Root endpoint",
            "returns": "API info y links",
            "auth": False,
        },
        "GET /health": {
            "description": "Health check",
            "returns": "Status ok",
            "auth": False,
        },
    },
    "AUTHENTICATION": {
        "POST /auth/register": {
            "description": "Registrar nuevo usuario",
            "body": {"email": "str", "password": "str", "username": "str"},
            "returns": "User info + token",
            "auth": False,
        },
        "POST /auth/login": {
            "description": "Login de usuario",
            "body": {"email": "str", "password": "str"},
            "returns": "Access token",
            "auth": False,
        },
        "POST /auth/logout": {
            "description": "Cerrar sesión",
            "returns": "Success message",
            "auth": True,
        },
    },
    "CAMPAIGNS": {
        "POST /campaigns": {
            "description": "Crear nueva campaña (creador = GM)",
            "body": {"name": "str", "description": "str?"},
            "returns": "Campaign object",
            "auth": True,
        },
        "GET /campaigns": {
            "description": "Listar campañas del usuario",
            "returns": "List[Campaign]",
            "auth": True,
        },
        "GET /campaigns/{id}": {
            "description": "Obtener detalle de campaña",
            "returns": "Campaign object",
            "auth": True,
        },
        "POST /campaigns/{id}/join": {
            "description": "Unirse a campaña eligiendo rol",
            "body": {"role": "GM | PLAYER"},
            "returns": "Membership object",
            "auth": True,
        },
        "GET /campaigns/{id}/members": {
            "description": "Listar miembros de campaña",
            "returns": "List[CampaignMember]",
            "auth": True,
        },
    },
    "CAMPAIGNS - ROLE MANAGEMENT": {
        "POST /campaigns/{id}/role-requests": {
            "description": "Solicitar cambio de rol",
            "body": {"requested_role": "GM | PLAYER"},
            "returns": "RoleChangeRequest",
            "auth": True,
            "notes": "Player solicita, GM debe aprobar",
        },
        "GET /campaigns/{id}/role-requests": {
            "description": "Listar solicitudes de cambio de rol (solo GM)",
            "returns": "List[RoleChangeRequest]",
            "auth": True,
            "role": "GM",
        },
        "PATCH /campaigns/{id}/role-requests/{req_id}": {
            "description": "Aprobar/rechazar solicitud de role change",
            "body": {"approved": "bool"},
            "returns": "RoleChangeRequest (updated)",
            "auth": True,
            "role": "GM",
        },
        "POST /campaigns/{id}/transfer-gm": {
            "description": "Transferir rol GM a otro miembro",
            "body": {"target_user_id": "str"},
            "returns": "Success message",
            "auth": True,
            "role": "GM",
            "notes": "Target must accept transfer",
        },
    },
    "CHARACTERS": {
        "POST /characters": {
            "description": "Crear nuevo personaje",
            "body": "CharacterCreate (validado contra dnd5eapi.co)",
            "returns": "Character object",
            "auth": True,
        },
        "GET /characters/{id}": {
            "description": "Obtener detalle de personaje",
            "returns": "Character object",
            "auth": True,
        },
        "PUT /characters/{id}": {
            "description": "Actualizar personaje",
            "body": "Partial CharacterCreate",
            "returns": "Character object",
            "auth": True,
            "notes": "Solo owner o GM pueden editar",
        },
        "GET /characters?campaign_id={id}": {
            "description": "Listar personajes de campaña",
            "returns": "List[Character]",
            "auth": True,
        },
    },
    "SESSIONS": {
        "POST /sessions": {
            "description": "Crear nueva sesión",
            "body": {"campaign_id": "str", "session_number": "int", "title": "str?"},
            "returns": "Session object",
            "auth": True,
            "role": "GM",
        },
        "POST /sessions/{id}/start": {
            "description": "Iniciar sesión (Socket.io broadcast)",
            "returns": "Session (started at updated)",
            "auth": True,
            "role": "GM",
        },
        "POST /sessions/{id}/end": {
            "description": "Terminar sesión (Gemini genera resumen)",
            "returns": "Session (ended at + summary)",
            "auth": True,
            "role": "GM",
        },
        "POST /sessions/{id}/notes": {
            "description": "Agregar nota a sesión (Gemini detecta items/NPCs)",
            "body": {"content": "str"},
            "returns": "SessionNote object",
            "auth": True,
        },
        "GET /sessions/{id}/notes": {
            "description": "Listar notas de sesión",
            "returns": "List[SessionNote]",
            "auth": True,
        },
    },
    "NPCS & FACTIONS": {
        "POST /campaigns/{id}/npcs": {
            "description": "Generar NPC con IA (RAG)",
            "body": {"prompt": "str (descripción del NPC)"},
            "returns": "NPC object (generated)",
            "auth": True,
            "role": "GM",
            "ai": "Gemini (gemini-1.5-flash)",
        },
        "GET /campaigns/{id}/npcs": {
            "description": "Listar NPCs de campaña",
            "returns": "List[NPC]",
            "auth": True,
        },
        "POST /campaigns/{id}/factions": {
            "description": "Crear facción",
            "body": {"name": "str", "description": "str?"},
            "returns": "Faction object",
            "auth": True,
            "role": "GM",
        },
        "GET /campaigns/{id}/factions": {
            "description": "Listar facciones de campaña",
            "returns": "List[Faction]",
            "auth": True,
        },
    },
    "VISION / OCR": {
        "POST /vision/digitize": {
            "description": "OCR de hoja de personaje D&D 5e (Gemini Vision)",
            "body": {"campaign_id": "str", "image_url": "str"},
            "returns": "OCRResult (con confidence levels)",
            "auth": True,
            "ai": "Gemini Vision (gemini-1.5-flash)",
        },
    },
    "ASSISTANT": {
        "POST /assistant/chat": {
            "description": "Asistente conversacional (RAG)",
            "body": {"campaign_id": "str", "question": "str"},
            "returns": "AssistantResponse (answer + sources)",
            "auth": True,
            "ai": "Gemini (gemini-1.5-flash)",
        },
        "POST /campaigns/{id}/search": {
            "description": "Búsqueda en historial (lenguaje natural)",
            "body": {"query": "str"},
            "returns": "List[SearchResult]",
            "auth": True,
        },
    },
}

# SOCKET.IO EVENTS
SOCKET_EVENTS = {
    "CLIENT → SERVER": [
        "join_campaign",  # { campaign_id: str }
        "leave_campaign",  # { campaign_id: str }
        "session_started",  # { session_id: str }
        "session_ended",  # { session_id: str, summary: str }
        "note_added",  # { session_id: str, content: str }
        "character_updated",  # { character_id: str, updates: dict }
        "inventory_updated",  # { character_id: str, items: list }
        "role_request_received",  # { campaign_id: str, request: dict }
        "role_request_resolved",  # { campaign_id: str, result: dict }
    ],
    "SERVER → CLIENT (broadcast in room)": [
        "user_joined",  # { user_id: str, campaign_id: str }
        "session_started",  # { session_id: str, gm_id: str }
        "session_ended",  # { session_id: str, summary: str }
        "note_added",  # { session_id: str, author: str, content: str }
        "character_updated",  # { character: dict }
        "inventory_updated",  # { character_id: str, items: list }
        "role_request_resolved",  # { requester_id: str, status: bool }
    ],
}

if __name__ == "__main__":
    print("🐉 DungeonAssistant - API Endpoints")
    print()
    for category, endpoints in ENDPOINTS.items():
        print(f"\n{category}:")
        for endpoint, details in endpoints.items():
            auth = "🔒" if details.get("auth") else "🔓"
            print(f"  {auth} {endpoint}")
    print("\n\nSocket.io Events:")
    for direction, events in SOCKET_EVENTS.items():
        print(f"\n{direction}:")
        for event in events:
            print(f"  - {event}")

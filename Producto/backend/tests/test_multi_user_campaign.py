"""
Script de prueba para validar sincronización multi-usuario en campaña
Simula dos usuarios (GM y Player) conectándose a una campaña
"""

import asyncio
import json
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Simular Supabase Client para pruebas
# ============================================================================

class MockSupabaseClient:
    """Cliente mock de Supabase para pruebas sin BD real"""
    
    def __init__(self):
        # Simulación de BD en memoria
        self.campaigns = [
            {
                "id": "camp-001",
                "name": "Dragon's Lair",
                "description": "An epic campaign",
                "invitation_code": "ABCD12",
                "is_active": True,
                "lore_summary": None
            }
        ]
        
        self.campaign_members = [
            {
                "campaign_id": "camp-001",
                "user_id": "user-gm-001",
                "username": "GameMaster",
                "role": "GM",
                "status": "ACTIVE"
            }
        ]
        
        self.users = [
            {
                "id": "user-gm-001",
                "email": "gm@dungeons.local",
                "username": "GameMaster"
            },
            {
                "id": "user-player-001",
                "email": "player@dungeons.local",
                "username": "BraveAdventurer"
            }
        ]
    
    def get_campaign_by_code(self, code):
        """Buscar campaña por código"""
        for c in self.campaigns:
            if c["invitation_code"] == code.upper():
                return c
        return None
    
    def is_campaign_member(self, campaign_id, user_id):
        """Verificar si usuario es miembro de campaña"""
        for member in self.campaign_members:
            if member["campaign_id"] == campaign_id and member["user_id"] == user_id:
                return True
        return False
    
    def add_campaign_member(self, campaign_id, user_id, username, role="PLAYER"):
        """Agregar miembro a campaña"""
        self.campaign_members.append({
            "campaign_id": campaign_id,
            "user_id": user_id,
            "username": username,
            "role": role,
            "status": "ACTIVE"
        })
    
    def get_campaign_members(self, campaign_id):
        """Obtener miembros de una campaña"""
        return [m for m in self.campaign_members if m["campaign_id"] == campaign_id]


# ============================================================================
# Simulación de Socket.io Server
# ============================================================================

class MockSocketServer:
    """Servidor mock de Socket.io para pruebas"""
    
    def __init__(self):
        self.connected_users = {}
        self.campaign_rooms = {}
        self.message_queue = []
    
    async def simulate_user_connect(self, user_id, username, email):
        """Simular conexión de usuario"""
        sid = f"sid-{user_id}"
        self.connected_users[sid] = {
            "user_id": user_id,
            "username": username,
            "email": email,
            "campaign_id": None
        }
        logger.info(f"✅ Usuario conectado: {username} ({sid})")
        return sid
    
    async def simulate_join_campaign(self, sid, campaign_id, user_id, username):
        """Simular que usuario se une a campaña"""
        if sid not in self.connected_users:
            raise ValueError(f"Usuario {sid} no conectado")
        
        # Actualizar estado
        self.connected_users[sid]["campaign_id"] = campaign_id
        
        # Agregar a sala
        if campaign_id not in self.campaign_rooms:
            self.campaign_rooms[campaign_id] = []
        self.campaign_rooms[campaign_id].append(sid)
        
        # Simular evento broadcast
        active_users = []
        for user_sid in self.campaign_rooms.get(campaign_id, []):
            if user_sid in self.connected_users:
                user_data = self.connected_users[user_sid]
                active_users.append({
                    "user_id": user_data["user_id"],
                    "username": user_data["username"],
                    "email": user_data["email"]
                })
        
        event_data = {
            "event": "user_joined",
            "user_id": user_id,
            "username": username,
            "campaign_id": campaign_id,
            "active_users": active_users,
            "active_count": len(active_users)
        }
        
        self.message_queue.append(event_data)
        logger.info(f"👤 {username} se unió a campaña {campaign_id}")
        logger.info(f"   📊 Usuarios activos: {len(active_users)} - {[u['username'] for u in active_users]}")
        
        return active_users
    
    async def simulate_user_disconnect(self, sid):
        """Simular desconexión de usuario"""
        if sid not in self.connected_users:
            return
        
        user_info = self.connected_users.pop(sid)
        campaign_id = user_info.get("campaign_id")
        
        if campaign_id and campaign_id in self.campaign_rooms:
            self.campaign_rooms[campaign_id].remove(sid)
            if not self.campaign_rooms[campaign_id]:
                del self.campaign_rooms[campaign_id]
        
        logger.info(f"❌ Usuario desconectado: {user_info['username']} ({sid})")
    
    def get_active_users_in_campaign(self, campaign_id):
        """Obtener usuarios activos en campaña"""
        active_users = []
        for sid in self.campaign_rooms.get(campaign_id, []):
            if sid in self.connected_users:
                user_data = self.connected_users[sid]
                active_users.append({
                    "user_id": user_data["user_id"],
                    "username": user_data["username"],
                    "email": user_data["email"]
                })
        return active_users


# ============================================================================
# Prueba: Conectar dos usuarios a una campaña
# ============================================================================

async def test_multi_user_campaign():
    """Prueba principal: dos usuarios en una campaña"""
    
    logger.info("=" * 70)
    logger.info("🎮 PRUEBA: Sincronización Multi-Usuario en Campaña")
    logger.info("=" * 70)
    
    # Inicializar mocks
    db = MockSupabaseClient()
    socket_server = MockSocketServer()
    
    logger.info("\n📋 SETUP: Preparando ambiente...")
    
    # ========================================================================
    # ESCENARIO 1: GM crea campaña
    # ========================================================================
    logger.info("\n🎯 ESCENARIO 1: GM crea campaña")
    gm_user = db.users[0]
    player_user = db.users[1]
    campaign = db.campaigns[0]
    
    logger.info(f"  • GM: {gm_user['username']} ({gm_user['id']})")
    logger.info(f"  • Campaña: {campaign['name']}")
    logger.info(f"  • Código: {campaign['invitation_code']}")
    
    # ========================================================================
    # ESCENARIO 2: GM se conecta a Socket.io y se une a campaña
    # ========================================================================
    logger.info("\n🎯 ESCENARIO 2: GM se conecta")
    gm_sid = await socket_server.simulate_user_connect(
        gm_user["id"], 
        gm_user["username"], 
        gm_user["email"]
    )
    
    gm_active_users = await socket_server.simulate_join_campaign(
        gm_sid, 
        campaign["id"],
        gm_user["id"],
        gm_user["username"]
    )
    
    # ========================================================================
    # ESCENARIO 3: Player intenta unirse usando código
    # ========================================================================
    logger.info("\n🎯 ESCENARIO 3: Player intenta unirse con código")
    logger.info(f"  • Player: {player_user['username']}")
    logger.info(f"  • Usando código: {campaign['invitation_code']}")
    
    # Validar código
    found_campaign = db.get_campaign_by_code(campaign["invitation_code"])
    if found_campaign:
        logger.info(f"  ✅ Código válido: {found_campaign['name']}")
    else:
        logger.error(f"  ❌ Código inválido")
        return False
    
    # Verificar si ya es miembro
    if db.is_campaign_member(campaign["id"], player_user["id"]):
        logger.error(f"  ❌ Player ya es miembro")
        return False
    
    # Agregar como miembro
    db.add_campaign_member(
        campaign["id"],
        player_user["id"],
        player_user["username"],
        "PLAYER"
    )
    logger.info(f"  ✅ Player agregado como miembro")
    
    # ========================================================================
    # ESCENARIO 4: Player se conecta a Socket.io
    # ========================================================================
    logger.info("\n🎯 ESCENARIO 4: Player se conecta a Socket.io")
    player_sid = await socket_server.simulate_user_connect(
        player_user["id"],
        player_user["username"],
        player_user["email"]
    )
    
    # ========================================================================
    # ESCENARIO 5: Player se une a campaña (sincronización)
    # ========================================================================
    logger.info("\n🎯 ESCENARIO 5: Player se une a campaña")
    player_active_users = await socket_server.simulate_join_campaign(
        player_sid,
        campaign["id"],
        player_user["id"],
        player_user["username"]
    )
    
    # ========================================================================
    # VERIFICACIONES
    # ========================================================================
    logger.info("\n" + "=" * 70)
    logger.info("✅ VERIFICACIONES")
    logger.info("=" * 70)
    
    # Verificar que ambos usuarios ven la misma lista
    all_active = socket_server.get_active_users_in_campaign(campaign["id"])
    
    # Obtener lista actualizada para ambos usuarios
    gm_sees = socket_server.get_active_users_in_campaign(campaign["id"])
    player_sees = socket_server.get_active_users_in_campaign(campaign["id"])
    
    logger.info(f"\n📊 Usuarios activos en campaña '{campaign['name']}':")
    for user in all_active:
        role = "GM" if user["user_id"] == gm_user["id"] else "PLAYER"
        logger.info(f"  • {user['username']} ({role}) - {user['email']}")
    
    # Verificaciones de éxito
    checks = [
        ("Ambos usuarios conectados a Socket.io", len(socket_server.connected_users) == 2),
        ("Campaña tiene 2 usuarios activos", len(all_active) == 2),
        ("GM está en la campaña", any(u["user_id"] == gm_user["id"] for u in all_active)),
        ("Player está en la campaña", any(u["user_id"] == player_user["id"] for u in all_active)),
        ("GM y Player ven la misma lista", len(gm_sees) == len(player_sees) == 2),
    ]
    
    logger.info("\n" + "-" * 70)
    logger.info("📋 RESULTADOS:")
    all_passed = True
    for check_name, result in checks:
        status = "✅" if result else "❌"
        logger.info(f"  {status} {check_name}")
        if not result:
            all_passed = False
    
    # ========================================================================
    # ESCENARIO 6: Player se desconecta
    # ========================================================================
    logger.info("\n🎯 ESCENARIO 6: Player se desconecta")
    await socket_server.simulate_user_disconnect(player_sid)
    
    remaining_users = socket_server.get_active_users_in_campaign(campaign["id"])
    logger.info(f"  Usuarios restantes: {len(remaining_users)}")
    logger.info(f"  {[u['username'] for u in remaining_users]}")
    
    disconnect_check = len(remaining_users) == 1
    logger.info(f"  {'✅' if disconnect_check else '❌'} Solo GM permanece conectado")
    
    # ========================================================================
    # RESUMEN FINAL
    # ========================================================================
    logger.info("\n" + "=" * 70)
    if all_passed and disconnect_check:
        logger.info("✅ TODAS LAS PRUEBAS PASARON")
        logger.info("=" * 70)
        return True
    else:
        logger.error("❌ ALGUNAS PRUEBAS FALLARON")
        logger.info("=" * 70)
        return False


# ============================================================================
# Ejecutar pruebas
# ============================================================================

if __name__ == "__main__":
    success = asyncio.run(test_multi_user_campaign())
    exit(0 if success else 1)

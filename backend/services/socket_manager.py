import logging
import socketio
from typing import Dict, Any, Optional
from services.supabase import get_supabase

logger = logging.getLogger(__name__)

def extract_token_safely(environ: dict) -> Optional[str]:
    """
    Extraer token JWT con múltiples estrategias
    
    Estrategias en orden:
    1. Desde auth objeto (socket.io estándar)
    2. Desde headers HTTP Authorization
    3. Desde query string (último recurso, menos seguro)
    """
    
    # Estrategia 1: Desde auth (socket.io client)
    auth = environ.get('aio.http_auth', {})
    if auth and isinstance(auth, dict):
        token = auth.get('token')
        if token:
            logger.debug("✓ Token extraído desde 'auth'")
            return token
    
    # Estrategia 2: Desde headers HTTP
    asgi_scope = environ.get('asgi.scope', {})
    headers = asgi_scope.get('headers', [])
    
    for name, value in headers:
        try:
            if name.lower() == b'authorization':
                auth_value = value.decode()
                if auth_value.startswith('Bearer '):
                    token = auth_value[7:]
                    logger.debug("✓ Token extraído desde header Authorization")
                    return token
        except Exception as e:
            logger.warning(f"Error procesando header: {e}")
            continue
    
    # Estrategia 3: Desde query string
    try:
        query_string = asgi_scope.get('query_string', b'').decode()
        if 'token=' in query_string:
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param[6:]
                    logger.warning("⚠️ Token extraído desde query string (menos seguro)")
                    return token
    except Exception as e:
        logger.warning(f"Error procesando query string: {e}")
    
    logger.warning("✗ No se encontró token en ninguna ubicación")
    return None

class SocketManager:
    """
    Manager centralizado para la lógica de Socket.io
    """
    def __init__(self):
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            # CORS será manejado por FastAPI's CORSMiddleware
            logger=False,
            engineio_logger=False
        )
        
        # Estado en memoria (En producción usar Redis)
        self.connected_users = {} # { sid: { user_id, username, email, campaign_id } }
        self.campaign_rooms = {}  # { campaign_id: [sid1, sid2, ...] }
        
        # Registrar eventos
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('join_campaign', self.on_join_campaign)
        self.sio.on('leave_campaign', self.on_leave_campaign)
        self.sio.on('broadcast_message', self.on_broadcast_message)
        self.sio.on('get_active_users', self.on_get_active_users)

    async def on_connect(self, sid: str, environ: dict):
        """
        Manejar conexión y validar JWT
        Permite múltiples conexiones simultáneas de usuarios diferentes
        """
        try:
            # Extraer token con múltiples estrategias
            token = extract_token_safely(environ)
            
            if not token:
                logger.warning(f"❌ Conexión rechazada (sin token): {sid}")
                return False

            # Validar token con Supabase
            supabase = get_supabase()
            user = supabase.get_user_by_token(token)
            
            if not user:
                logger.warning(f"❌ Conexión rechazada (token inválido): {sid}")
                return False

            # Guardar info del usuario - permitir múltiples sockets por usuario
            user_data = user.get("user", user) if isinstance(user, dict) else user
            user_id = user_data.get("id")
            username = user_data.get("user_metadata", {}).get("username") or user_data.get("email")
            
            self.connected_users[sid] = {
                "user_id": user_id,
                "username": username,
                "email": user_data.get("email"),
                "campaign_id": None,
                "session_id": sid  # Identificar esta sesión específica
            }
            
            # Log con más detalle
            active_connections = sum(1 for u in self.connected_users.values() if u.get("user_id") == user_id)
            logger.info(f"✅ Socket conectado: {username} ({sid}) - Conexiones activas: {active_connections}")
            
            await self.sio.emit("authenticated", {"status": "ok"}, to=sid)
            
        except Exception as e:
            logger.error(f"❌ Error en on_connect: {e}")
            return False

    async def on_disconnect(self, sid: str):
        """
        Limpiar estado al desconectar
        """
        if sid in self.connected_users:
            user_info = self.connected_users.pop(sid)
            campaign_id = user_info.get("campaign_id")
            
            if campaign_id:
                await self.on_leave_campaign(sid, {"campaign_id": campaign_id})
                
            logger.info(f"Socket desconectado: {user_info.get('username')} ({sid})")

    async def on_join_campaign(self, sid: str, data: dict):
        """
        Unir usuario a una sala de campaña
        """
        try:
            campaign_id = data.get("campaign_id")
            if not campaign_id:
                return

            if sid not in self.connected_users:
                return

            user_info = self.connected_users[sid]
            user_info["campaign_id"] = campaign_id
            
            # Entrar en la sala de Socket.io
            self.sio.enter_room(sid, f"campaign_{campaign_id}")
            
            # Registrar en nuestro estado local
            if campaign_id not in self.campaign_rooms:
                self.campaign_rooms[campaign_id] = []
            if sid not in self.campaign_rooms[campaign_id]:
                self.campaign_rooms[campaign_id].append(sid)
            
            active_users = self._get_active_users_list(campaign_id)
            
            # Notificar a la sala
            await self.sio.emit(
                "user_joined",
                {
                    "user_id": user_info["user_id"],
                    "username": user_info["username"],
                    "active_users": active_users
                },
                to=f"campaign_{campaign_id}"
            )
            
            # Confirmar al usuario
            await self.sio.emit("joined_campaign", {"status": "ok", "active_users": active_users}, to=sid)
            logger.info(f"Usuario {user_info['username']} se unió a sala campaign_{campaign_id}")
            
        except Exception as e:
            logger.error(f"Error en on_join_campaign: {e}")

    async def on_leave_campaign(self, sid: str, data: dict):
        """
        Abandonar sala de campaña
        """
        try:
            campaign_id = data.get("campaign_id")
            if not campaign_id:
                return

            if sid in self.connected_users:
                user_info = self.connected_users[sid]
                user_info["campaign_id"] = None
                
                # Salir de la sala
                self.sio.leave_room(sid, f"campaign_{campaign_id}")
                
                # Limpiar estado local
                if campaign_id in self.campaign_rooms and sid in self.campaign_rooms[campaign_id]:
                    self.campaign_rooms[campaign_id].remove(sid)
                    if not self.campaign_rooms[campaign_id]:
                        del self.campaign_rooms[campaign_id]
                
                # Notificar a los demás
                await self.sio.emit(
                    "user_left",
                    {"user_id": user_info["user_id"], "username": user_info["username"]},
                    to=f"campaign_{campaign_id}"
                )
                logger.info(f"Usuario {user_info['username']} salió de sala campaign_{campaign_id}")

        except Exception as e:
            logger.error(f"Error en on_leave_campaign: {e}")

    async def on_broadcast_message(self, sid: str, data: dict):
        """
        Enviar un mensaje a todos en la campaña
        """
        try:
            campaign_id = data.get("campaign_id")
            message = data.get("message")
            msg_type = data.get("type", "chat")
            
            if sid not in self.connected_users or not campaign_id:
                return
            
            user_info = self.connected_users[sid]
            
            await self.sio.emit(
                "message",
                {
                    "user_id": user_info["user_id"],
                    "username": user_info["username"],
                    "message": message,
                    "type": msg_type,
                    "timestamp": __import__("datetime").datetime.utcnow().isoformat()
                },
                to=f"campaign_{campaign_id}"
            )
        except Exception as e:
            logger.error(f"Error en on_broadcast_message: {e}")

    async def on_get_active_users(self, sid: str, data: dict):
        """
        Retornar lista de usuarios activos en una campaña
        """
        campaign_id = data.get("campaign_id")
        if campaign_id:
            users = self._get_active_users_list(campaign_id)
            await self.sio.emit("active_users", {"users": users}, to=sid)

    def _get_active_users_list(self, campaign_id: str):
        """Helper para obtener lista serializable de usuarios"""
        active_users = []
        for user_sid in self.campaign_rooms.get(campaign_id, []):
            if user_sid in self.connected_users:
                u = self.connected_users[user_sid]
                active_users.append({
                    "user_id": u["user_id"],
                    "username": u["username"],
                    "email": u["email"]
                })
        return active_users

# Instancia única
socket_manager = SocketManager()

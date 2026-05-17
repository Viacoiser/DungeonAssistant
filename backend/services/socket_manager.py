import logging
import socketio
from typing import Dict, Any, Optional
from services.supabase import get_supabase

logger = logging.getLogger(__name__)

class SocketManager:
    """
    Manager centralizado para la lógica de Socket.io
    """
    def __init__(self):
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins='*',
            logger=False, # Reducir ruido de logs
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
        """
        try:
            # Extraer token de headers o auth
            # Socket.io client puede enviar token en la propiedad 'auth'
            auth = environ.get('aio.http_auth', {})
            token = auth.get('token')
            
            # Fallback a headers si no está en auth
            if not token:
                headers = environ.get('asgi.scope', {}).get('headers', [])
                for name, value in headers:
                    if name.decode().lower() == 'authorization':
                        auth_val = value.decode()
                        if auth_val.startswith('Bearer '):
                            token = auth_val[7:]
                        break
            
            if not token:
                logger.warning(f"Conexión rechazada (sin token): {sid}")
                # En Socket.io rechazar conexión es retornando False o levantando excepción
                return False

            # Validar token con Supabase
            supabase = get_supabase()
            user = supabase.get_user_by_token(token)
            
            if not user:
                logger.warning(f"Conexión rechazada (token inválido): {sid}")
                return False

            # Guardar info del usuario
            user_data = user.get("user", user) if isinstance(user, dict) else user
            self.connected_users[sid] = {
                "user_id": user_data.get("id"),
                "username": user_data.get("user_metadata", {}).get("username") or user_data.get("email"),
                "email": user_data.get("email"),
                "campaign_id": None
            }
            
            logger.info(f"✓ Socket conectado y autenticado: {self.connected_users[sid]['username']} ({sid})")
            await self.sio.emit("authenticated", {"status": "ok"}, to=sid)
            
        except Exception as e:
            logger.error(f"Error en on_connect: {e}")
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

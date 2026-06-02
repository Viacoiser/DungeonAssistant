import logging
import os
import socketio
from typing import Dict, Any, Optional
from services.supabase import get_supabase

logger = logging.getLogger(__name__)

def extract_token_safely(environ: dict) -> Optional[str]:
    logger.debug(f"Extractando token. environ keys: {list(environ.keys())}")
    
    # Estrategia 1: Desde auth (ASGI socket.io client)
    auth = environ.get('auth', {}) or environ.get('aio.http_auth', {})
    if auth and isinstance(auth, dict):
        token = auth.get('token')
        if token:
            logger.info("Token desde 'auth'")
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
                    logger.info("Token desde header Authorization")
                    return token
        except Exception as e:
            logger.warning(f"Error procesando header: {e}")
            continue
    
    # Estrategia 3: Desde query string
    try:
        query_string = asgi_scope.get('query_string', b'').decode()
        logger.debug(f"Query string: {query_string}")
        
        if 'token=' in query_string:
            import urllib.parse
            params = urllib.parse.parse_qs(query_string)
            if 'token' in params:
                token = params['token'][0]
                logger.info(f"Token desde query string: {token[:20]}...")
                return token
    except Exception as e:
        logger.warning(f"Error procesando query string: {e}")
    
    logger.warning("No se encontró token")
    return None

class SocketManager:
    def __init__(self):
        # Leer orígenes permitidos desde variable de entorno
        env_origins = os.getenv('ALLOWED_ORIGINS', '')
        allowed = [
            'https://dungeon-assistant-test.vercel.app',
            'https://dungeonassistanttest-production.up.railway.app',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173'
        ]
        if env_origins:
            allowed.extend([o.strip() for o in env_origins.split(',') if o.strip()])
        
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins='*',
            logger=False,
            engineio_logger=False
        )
        
        # Estado en memoria (En producción usar Redis)
        self.connected_users = {} # { sid: { user_id, username, email, campaign_id } }
        self.campaign_rooms = {}  # { campaign_id: [sid1, sid2, ...] }
        self.active_combats = {}  # { campaign_id: { status, turns, history, current_turn } }
        
        # Registrar eventos
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('join_campaign', self.on_join_campaign)
        self.sio.on('leave_campaign', self.on_leave_campaign)
        self.sio.on('broadcast_message', self.on_broadcast_message)
        self.sio.on('get_active_users', self.on_get_active_users)
        
        # Eventos de Iniciativa en Vivo (Combate)
        self.sio.on('start_combat', self.on_start_combat)
        self.sio.on('submit_initiative', self.on_submit_initiative)
        self.sio.on('confirm_initiative', self.on_confirm_initiative)
        self.sio.on('add_monster', self.on_add_monster)
        self.sio.on('delete_participant', self.on_delete_participant)
        self.sio.on('finish_rolling_phase', self.on_finish_rolling_phase)
        self.sio.on('next_turn', self.on_next_turn)
        self.sio.on('prev_turn', self.on_prev_turn)
        self.sio.on('end_combat', self.on_end_combat)

    async def on_connect(self, sid: str, environ: dict, auth: Optional[dict] = None):
        try:
            # Extraer token con múltiples estrategias
            token = extract_token_safely(environ)
            if not token and auth:
                token = auth.get('token')
            
            if not token:
                logger.warning(f"Conexión rechazada (sin token): {sid}")
                return False

            # Validar token con Supabase
            supabase = get_supabase()
            user = supabase.get_user_by_token(token)
            
            if not user:
                logger.warning(f"Conexión rechazada (token inválido): {sid}")
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
            logger.info(f"Socket conectado: {username} ({sid}) - Conexiones activas: {active_connections}")
            
            await self.sio.emit("authenticated", {"status": "ok"}, to=sid)
            
        except Exception as e:
            logger.error(f"Error en on_connect: {e}")
            return False

    async def on_disconnect(self, sid: str):
        if sid in self.connected_users:
            user_info = self.connected_users.pop(sid)
            campaign_id = user_info.get("campaign_id")
            
            if campaign_id:
                await self.on_leave_campaign(sid, {"campaign_id": campaign_id})
                
            logger.info(f"Socket desconectado: {user_info.get('username')} ({sid})")

    async def on_join_campaign(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            if not campaign_id:
                return

            if sid not in self.connected_users:
                return

            user_info = self.connected_users[sid]
            user_info["campaign_id"] = campaign_id
            # Marcar como "pendiente" mientras se carga el rol
            user_info["campaign_role"] = None
            user_info["campaign_role_loading"] = True
            
            # Entrar en la sala de Socket.io INMEDIATAMENTE (sin esperar DB)
            await self.sio.enter_room(sid, f"campaign_{campaign_id}")
            
            # Registrar en nuestro estado local
            if campaign_id not in self.campaign_rooms:
                self.campaign_rooms[campaign_id] = []
            if sid not in self.campaign_rooms[campaign_id]:
                self.campaign_rooms[campaign_id].append(sid)

            active_users = self._get_active_users_list(campaign_id)
            
            # Confirmar al usuario INMEDIATAMENTE (sin esperar DB)
            await self.sio.emit("joined_campaign", {"status": "ok", "active_users": active_users}, to=sid)
            
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
            
            # Si hay un combate activo, enviarle el estado actual al usuario que se une
            if campaign_id in self.active_combats:
                await self.sio.emit("combat_state_update", self.active_combats[campaign_id], to=sid)
                
            logger.info(f"Usuario {user_info['username']} se unió a sala campaign_{campaign_id}")
            
            # ------------------------------------------------------------------
            # Cachear el rol en BACKGROUND (no bloquea el event loop)
            # ------------------------------------------------------------------
            asyncio.create_task(self._cache_user_role(sid, campaign_id, user_info))
            
        except Exception as e:
            logger.error(f"Error en on_join_campaign: {e}")

    async def _cache_user_role(self, sid: str, campaign_id: str, user_info: dict):
        import asyncio
        try:
            supabase = get_supabase()
            try:
                db = supabase.admin_client
            except Exception:
                db = supabase.client

            loop = asyncio.get_event_loop()
            # Ejecutar la llamada síncrona en un thread para no bloquear asyncio
            def fetch_role():
                return db.table("campaign_members") \
                    .select("role") \
                    .eq("campaign_id", campaign_id) \
                    .eq("user_id", user_info["user_id"]) \
                    .execute()

            role_res = await loop.run_in_executor(None, fetch_role)

            if role_res.data:
                user_info["campaign_role"] = role_res.data[0].get("role", "PLAYER")
                logger.info(f"Rol cacheado para {user_info['username']} en {campaign_id}: {user_info['campaign_role']}")
            else:
                user_info["campaign_role"] = "PLAYER"
                logger.warning(f"No se encontró rol para {user_info['username']} en {campaign_id}")
        except Exception as role_err:
            user_info["campaign_role"] = "PLAYER"
            logger.error(f"Error cacheando rol: {role_err}")
        finally:
            user_info["campaign_role_loading"] = False



    async def on_leave_campaign(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            if not campaign_id:
                return

            if sid in self.connected_users:
                user_info = self.connected_users[sid]
                user_info["campaign_id"] = None
                
                # Salir de la sala
                await self.sio.leave_room(sid, f"campaign_{campaign_id}")
                
                # Limpiar estado local
                if campaign_id in self.campaign_rooms and sid in self.campaign_rooms[campaign_id]:
                    self.campaign_rooms[campaign_id].remove(sid)
                    if not self.campaign_rooms[campaign_id]:
                        del self.campaign_rooms[campaign_id]
                
                # Notificar a los demás
                active_users = self._get_active_users_list(campaign_id)
                await self.sio.emit(
                    "user_left",
                    {
                        "user_id": user_info["user_id"],
                        "username": user_info["username"],
                        "active_users": active_users
                    },
                    to=f"campaign_{campaign_id}"
                )
                logger.info(f"Usuario {user_info['username']} salió de sala campaign_{campaign_id}")

        except Exception as e:
            logger.error(f"Error en on_leave_campaign: {e}")

    async def on_broadcast_message(self, sid: str, data: dict):
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
        campaign_id = data.get("campaign_id")
        if campaign_id:
            users = self._get_active_users_list(campaign_id)
            await self.sio.emit("active_users", {"users": users}, to=sid)

    def _get_active_users_list(self, campaign_id: str):
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

    async def is_user_gm(self, campaign_id: str, user_id: str, sid: str = None) -> bool:
        import asyncio
        
        # 1. Verificar caché en memoria (solo si coincide con la campaña consultada)
        if sid and sid in self.connected_users:
            cached_campaign = self.connected_users[sid].get("campaign_id")
            if cached_campaign == campaign_id:
                cached_role = self.connected_users[sid].get("campaign_role")
                if cached_role is not None:
                    is_gm = cached_role == "GM"
                    logger.debug(f"[GM CHECK] {self.connected_users[sid].get('username')} → caché={cached_role} → isGM={is_gm}")
                    return is_gm
        
        # 2. Fallback: consultar DB en un thread para no bloquear el event loop
        try:
            supabase = get_supabase()
            # Intentar admin_client primero, luego client
            try:
                db = supabase.admin_client
            except Exception:
                db = supabase.client
                logger.warning("[GM CHECK] admin_client no disponible, usando client (puede fallar con RLS)")
            
            loop = asyncio.get_event_loop()
            def fetch_role():
                return db.table("campaign_members") \
                    .select("role") \
                    .eq("campaign_id", campaign_id) \
                    .eq("user_id", user_id) \
                    .execute()

            res = await loop.run_in_executor(None, fetch_role)
                
            if res.data:
                role = res.data[0].get("role", "")
                is_gm = role == "GM"
                logger.info(f"[GM CHECK] DB lookup → user_id={user_id} role={role} isGM={is_gm}")
                # Cache the result for future calls
                if sid and sid in self.connected_users:
                    self.connected_users[sid]["campaign_id"] = campaign_id
                    self.connected_users[sid]["campaign_role"] = role
                return is_gm
            else:
                logger.warning(f"[GM CHECK] No se encontró miembro: user_id={user_id} campaign_id={campaign_id}")
        except Exception as e:
            logger.error(f"[GM CHECK] Error en DB lookup: {e}")
        return False

    async def on_start_combat(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            if not campaign_id or sid not in self.connected_users:
                return
            
            user_info = self.connected_users[sid]
            user_id = user_info["user_id"]
            
            logger.info(f"[START_COMBAT] Intento de {user_info['username']} en campaign {campaign_id}")
            
            # Verificar si el usuario es GM (pasar sid para usar caché)
            if not await self.is_user_gm(campaign_id, user_id, sid=sid):
                logger.warning(f"Intento no autorizado de start_combat por {user_info['username']} (rol: {user_info.get('campaign_role', 'desconocido')})")
                await self.sio.emit("combat_error", {"message": "No tienes permiso para iniciar el combate"}, to=sid)
                return

            # Inicializar combate
            self.active_combats[campaign_id] = {
                "status": "rolling",
                "turns": [],
                "history": [{
                    "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                    "message": "El GM inició la fase de iniciativa."
                }],
                "current_turn": 0
            }

            # Broadcast
            await self.sio.emit("combat_state_update", self.active_combats[campaign_id], to=f"campaign_{campaign_id}")
            logger.info(f"Combate iniciado en campaign_{campaign_id} por GM {user_info['username']}")
            
        except Exception as e:
            logger.error(f"Error en on_start_combat: {e}")

    async def on_submit_initiative(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            participant_id = data.get("participant_id")  # character_id o monster_uuid
            name = data.get("name")
            roll = int(data.get("roll", 0))
            modifier = int(data.get("modifier", 0))
            total = int(data.get("total", roll + modifier))
            is_monster = bool(data.get("is_monster", False))
            
            if not campaign_id or not participant_id or sid not in self.connected_users:
                return
            
            if campaign_id not in self.active_combats:
                return
            
            combat = self.active_combats[campaign_id]
            if combat["status"] not in ["rolling", "active"]:
                return
            
            # Buscar si ya existe
            existing = None
            for p in combat["turns"]:
                if p["id"] == participant_id:
                    existing = p
                    break
            
            # Si ya existe y está confirmado, ignorar
            if existing and existing.get("confirmed"):
                return
            
            user_info = self.connected_users[sid]
            
            participant_data = {
                "id": participant_id,
                "name": name,
                "roll": roll,
                "modifier": modifier,
                "total": total,
                "is_monster": is_monster,
                "confirmed": False,
                "user_id": user_info["user_id"]
            }
            
            if existing:
                existing.update(participant_data)
            else:
                combat["turns"].append(participant_data)
                
            # Broadcast
            await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
            
        except Exception as e:
            logger.error(f"Error en on_submit_initiative: {e}")

    async def on_confirm_initiative(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            participant_id = data.get("participant_id")
            
            if not campaign_id or not participant_id or sid not in self.connected_users:
                return
            
            if campaign_id not in self.active_combats:
                return
            
            combat = self.active_combats[campaign_id]
            if combat["status"] not in ["rolling", "active"]:
                return
            
            # Buscar participante
            participant = None
            for p in combat["turns"]:
                if p["id"] == participant_id:
                    participant = p
                    break
            
            if not participant:
                return
            
            # Confirmar y bloquear
            participant["confirmed"] = True
            
            # Agregar al historial
            if combat["status"] == "active":
                msg = f"{participant['name']} se unió al combate en curso con iniciativa: {participant['total']} ({participant['roll']} + {participant['modifier']} Mod)"
            else:
                msg = f"{participant['name']} confirmó su tirada: {participant['total']} ({participant['roll']} + {participant['modifier']} Iniciativa)"
                
            combat["history"].append({
                "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                "message": msg
            })
            
            # Si el combate ya está activo, ordenar e insertar de forma segura sin perturbar el turno actual
            if combat["status"] == "active":
                active_id = None
                if len(combat["turns"]) > 0 and combat["current_turn"] < len(combat["turns"]):
                    active_id = combat["turns"][combat["current_turn"]]["id"]
                
                # Ordenar turnos descendente por total e iniciativa modificadora
                combat["turns"].sort(key=lambda x: (x.get("total", 0), x.get("modifier", 0)), reverse=True)
                
                # Re-mapear el índice del participante activo
                if active_id:
                    for idx, p in enumerate(combat["turns"]):
                        if p["id"] == active_id:
                            combat["current_turn"] = idx
                            break
            
            # Broadcast
            await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
            logger.info(f"Iniciativa confirmada por {participant['name']} en campaign_{campaign_id}: {participant['total']} (Estado: {combat['status']})")
            
        except Exception as e:
            logger.error(f"Error en on_confirm_initiative: {e}")

    async def on_add_monster(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            monsters = data.get("monsters") # list of dicts: [{"name": ..., "modifier": ..., "quantity": ...}]
            
            if not monsters:
                name = data.get("name")
                modifier = int(data.get("modifier", 0))
                quantity = int(data.get("quantity", 1))
                if name:
                    monsters = [{"name": name, "modifier": modifier, "quantity": quantity}]
                else:
                    monsters = []
            
            if not campaign_id or not monsters or sid not in self.connected_users:
                return
            
            user_info = self.connected_users[sid]
            user_id = user_info["user_id"]
            
            # Verificar si el usuario es GM (pasar sid para usar caché)
            logger.info(f"[ADD_MONSTER] {user_info['username']} quiere agregar {len(monsters)} tipo(s) de criatura(s) en {campaign_id}")
            if not await self.is_user_gm(campaign_id, user_id, sid=sid):
                logger.warning(f"add_monster denegado para {user_info['username']} (rol: {user_info.get('campaign_role', 'desconocido')})")
                await self.sio.emit("combat_error", {"message": "Solo el GM puede agregar monstruos"}, to=sid)
                return
                
            if campaign_id not in self.active_combats:
                return
            
            combat = self.active_combats[campaign_id]
            
            # Generar monstruos
            import uuid
            import random
            import asyncio
            
            new_monsters = []
            for item in monsters:
                m_name = item.get("name")
                if not m_name or not m_name.strip():
                    continue
                m_name = m_name.strip()
                m_modifier = int(item.get("modifier", 0))
                m_quantity = int(item.get("quantity", 1))
                
                for i in range(m_quantity):
                    monster_id = f"monster_{uuid.uuid4().hex[:8]}"
                    m_formatted_name = f"{m_name} #{i+1}" if m_quantity > 1 else m_name
                    
                    # Lanzar iniciativa d20 para cada monstruo
                    roll = random.randint(1, 20)
                    total = roll + m_modifier
                    
                    monster_data = {
                        "id": monster_id,
                        "name": m_formatted_name,
                        "roll": roll,
                        "modifier": m_modifier,
                        "total": total,
                        "is_monster": True,
                        "confirmed": False,  # Empiezan en false para mostrar la animación
                        "is_rolling": True,   # Bandera para animación en el cliente
                        "user_id": user_id
                    }
                    combat["turns"].append(monster_data)
                    new_monsters.append(monster_data)
            
            if not new_monsters:
                return
                
            # Broadcast inicial para que todos vean a los monstruos rodar sus dados simultáneamente
            await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
            logger.info(f"Lanzando iniciativa para {len(new_monsters)} monstruo(s) en campaign_{campaign_id}")
            
            # Simular 1.2 segundos de animación
            await asyncio.sleep(1.2)
            
            # Revelar los resultados y confirmar la iniciativa
            for m in new_monsters:
                m["confirmed"] = True
                m["is_rolling"] = False
                
                mod_sign = "+" if m['modifier'] >= 0 else ""
                # Agregar al historial
                combat["history"].append({
                    "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                    "message": f"{m['name']} (Monstruo) obtuvo iniciativa: {m['total']} ({m['roll']} {mod_sign}{m['modifier']} Mod)",
                    "is_private": True
                })
                
            # Broadcast final con los dados ya quietos y confirmados
            await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
            logger.info(f"{len(new_monsters)} monstruo(s) confirmados en campaign_{campaign_id}")
            
        except Exception as e:
            logger.error(f"Error en on_add_monster: {e}")

    async def on_delete_participant(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            participant_id = data.get("participant_id")
            
            if not campaign_id or not participant_id or sid not in self.connected_users:
                return
            
            user_info = self.connected_users[sid]
            user_id = user_info["user_id"]
            
            # Verificar si el usuario es GM
            if not await self.is_user_gm(campaign_id, user_id, sid=sid):
                return
                
            if campaign_id not in self.active_combats:
                return
            
            combat = self.active_combats[campaign_id]
            
            # Buscar y eliminar
            original_len = len(combat["turns"])
            p_name = "Desconocido"
            is_monster = False
            for p in combat["turns"]:
                if p["id"] == participant_id:
                    p_name = p["name"]
                    is_monster = p.get("is_monster", False)
                    break
            
            combat["turns"] = [p for p in combat["turns"] if p["id"] != participant_id]
            
            if len(combat["turns"]) < original_len:
                # Agregar al historial
                history_entry = {
                    "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                    "message": f"{p_name} fue eliminado del combate por el GM."
                }
                if is_monster:
                    history_entry["is_private"] = True
                combat["history"].append(history_entry)
                
                # Ajustar current_turn si es necesario para evitar desbordamiento
                if combat["current_turn"] >= len(combat["turns"]) and len(combat["turns"]) > 0:
                    combat["current_turn"] = 0
                
                # Broadcast
                await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
                logger.info(f"Participante {p_name} eliminado de combate en campaign_{campaign_id}")
                
        except Exception as e:
            logger.error(f"Error en on_delete_participant: {e}")

    async def on_finish_rolling_phase(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            
            if not campaign_id or sid not in self.connected_users:
                return
            
            user_info = self.connected_users[sid]
            user_id = user_info["user_id"]
            
            logger.info(f"[FINISH_ROLLING] {user_info['username']} quiere comenzar combate en {campaign_id}")
            
            # Verificar si el usuario es GM
            if not await self.is_user_gm(campaign_id, user_id, sid=sid):
                logger.warning(f"finish_rolling denegado para {user_info['username']}")
                await self.sio.emit("combat_error", {"message": "Solo el GM puede comenzar el combate"}, to=sid)
                return
                
            if campaign_id not in self.active_combats:
                logger.warning(f"No hay combate activo en {campaign_id}")
                return
            
            combat = self.active_combats[campaign_id]
            if combat["status"] != "rolling":
                logger.warning(f"Combate no está en fase rolling: {combat['status']}")
                return
            
            # Validar que haya al menos un participante
            if not combat["turns"]:
                # Agregar una alerta en el historial si intentan empezar vacío
                combat["history"].append({
                    "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                    "message": "No se puede comenzar el combate sin participantes."
                })
                await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
                return

            # Cambiar estado
            combat["status"] = "active"
            
            # Ordenar participantes:
            # 1. Por total descendente
            # 2. En caso de empate, por el modificador de iniciativa más alto descendente
            combat["turns"].sort(key=lambda x: (x.get("total", 0), x.get("modifier", 0)), reverse=True)
            
            # Comenzar en el turno 0
            combat["current_turn"] = 0
            
            # Agregar al historial
            combat["history"].append({
                "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                "message": "El combate ha comenzado. Orden de iniciativa establecido."
            })
            
            # Broadcast
            await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
            logger.info(f"Fase de tiradas finalizada en campaign_{campaign_id}. Combate activo.")
            
        except Exception as e:
            logger.error(f"Error en on_finish_rolling_phase: {e}")

    async def on_next_turn(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            
            if not campaign_id or sid not in self.connected_users:
                return
            
            user_info = self.connected_users[sid]
            user_id = user_info["user_id"]
            
            # Verificar si el usuario es GM
            if not await self.is_user_gm(campaign_id, user_id, sid=sid):
                return
                
            if campaign_id not in self.active_combats:
                return
            
            combat = self.active_combats[campaign_id]
            if combat["status"] != "active" or not combat["turns"]:
                return
            
            # Avanzar turno circularmente
            prev_turn = combat["current_turn"]
            combat["current_turn"] = (combat["current_turn"] + 1) % len(combat["turns"])
            
            active_p = combat["turns"][combat["current_turn"]]
            
            # Agregar al historial
            history_entry = {
                "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                "message": f"Turno de {active_p['name']}."
            }
            if active_p.get("is_monster"):
                history_entry["is_private"] = True
            combat["history"].append(history_entry)
            
            # Broadcast
            await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
            logger.info(f"Turno avanzado de {prev_turn} a {combat['current_turn']} en campaign_{campaign_id}")
            
        except Exception as e:
            logger.error(f"Error en on_next_turn: {e}")

    async def on_prev_turn(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            
            if not campaign_id or sid not in self.connected_users:
                return
            
            user_info = self.connected_users[sid]
            user_id = user_info["user_id"]
            
            # Verificar si el usuario es GM
            if not await self.is_user_gm(campaign_id, user_id, sid=sid):
                return
                
            if campaign_id not in self.active_combats:
                return
            
            combat = self.active_combats[campaign_id]
            if combat["status"] != "active" or not combat["turns"]:
                return
            
            # Retroceder turno circularmente
            prev_turn = combat["current_turn"]
            combat["current_turn"] = (combat["current_turn"] - 1 + len(combat["turns"])) % len(combat["turns"])
            
            active_p = combat["turns"][combat["current_turn"]]
            
            # Agregar al historial
            history_entry = {
                "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                "message": f"Turno retrocedido a {active_p['name']}."
            }
            if active_p.get("is_monster"):
                history_entry["is_private"] = True
            combat["history"].append(history_entry)
            
            # Broadcast
            await self.sio.emit("combat_state_update", combat, to=f"campaign_{campaign_id}")
            logger.info(f"Turno retrocedido de {prev_turn} a {combat['current_turn']} en campaign_{campaign_id}")
            
        except Exception as e:
            logger.error(f"Error en on_prev_turn: {e}")

    async def on_end_combat(self, sid: str, data: dict):
        try:
            campaign_id = data.get("campaign_id")
            
            if not campaign_id or sid not in self.connected_users:
                return
            
            user_info = self.connected_users[sid]
            user_id = user_info["user_id"]
            
            # Verificar si el usuario es GM
            if not await self.is_user_gm(campaign_id, user_id, sid=sid):
                return
                
            if campaign_id not in self.active_combats:
                return
            
            # Eliminar combate del estado en memoria
            self.active_combats.pop(campaign_id)
            
            # Emitir estado inactivo
            await self.sio.emit(
                "combat_state_update",
                {"status": "inactive", "turns": [], "history": [], "current_turn": 0},
                to=f"campaign_{campaign_id}"
            )
            logger.info(f"Combate finalizado y limpiado por GM en campaign_{campaign_id}")
            
        except Exception as e:
            logger.error(f"Error en on_end_combat: {e}")

# Instancia única
socket_manager = SocketManager()

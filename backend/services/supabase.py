"""
Cliente Supabase para interacción con BD y Auth
"""

import os
import logging
from typing import Optional, Dict, Any
from supabase import create_client, Client
from postgrest.exceptions import APIError

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Cliente singleton para Supabase"""

    _instance: "SupabaseClient" = None
    _client: Client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._init_client()

    def _init_client(self):
        """Inicializar cliente Supabase"""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")

        if not url or not key:
            raise ValueError(
                "SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar en .env"
            )

        self._client = create_client(url, key)
        logger.info("✅ Supabase client initialized")

    @property
    def client(self) -> Client:
        """Obtener cliente Supabase"""
        return self._client

    # ========================================================================
    # AUTHENTICATION
    # ========================================================================

    def register_user(
        self, email: str, password: str, username: str
    ) -> Dict[str, Any]:
        """
        Registrar nuevo usuario
        
        Args:
            email: Email del usuario
            password: Contraseña
            username: Nombre de usuario
            
        Returns:
            Dict con datos del usuario creado
        """
        try:
            # Crear usuario en Supabase Auth
            response = self._client.auth.sign_up(
                {"email": email, "password": password}
            )

            if not response.user:
                raise ValueError("No user returned from signup")

            user_id = response.user.id

            # Crear perfil en tabla users
            self._client.table("users").insert(
                {
                    "id": user_id,
                    "email": email,
                    "username": username,
                }
            ).execute()

            logger.info(f"✅ User registered: {email}")
            return {
                "id": user_id,
                "email": email,
                "username": username,
                "created_at": response.user.created_at,
            }

        except APIError as e:
            if "already exists" in str(e):
                logger.error(f"❌ Email already exists: {email}")
                raise ValueError("Email already registered")
            raise

    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Login de usuario
        
        Args:
            email: Email del usuario
            password: Contraseña
            
        Returns:
            Dict con token y datos del usuario
        """
        try:
            response = self._client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )

            if not response.session:
                raise ValueError("No session returned from login")

            # Obtener datos del usuario
            user_data = (
                self._client.table("users")
                .select("*")
                .eq("id", response.user.id)
                .single()
                .execute()
            )

            logger.info(f"✅ User logged in: {email}")
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "username": user_data.data.get("username", ""),
                },
            }

        except Exception as e:
            logger.error(f"❌ Login failed: {e}")
            raise ValueError("Invalid email or password")

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Obtener usuario por token JWT
        
        Args:
            token: JWT token
            
        Returns:
            Datos del usuario o None
        """
        try:
            # Verificar token contra Supabase
            response = self._client.auth.get_user(token)
            
            # La respuesta tiene la estructura: response.user
            if not response or not response.user:
                return None
            
            user = response.user
            user_id = user.id

            # Obtener datos del perfil
            user_data = (
                self._client.table("users")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )

            return {
                "id": user_id,
                "email": user.email,
                "username": user_data.data.get("username", ""),
                "created_at": user_data.data.get("created_at"),
            }

        except Exception as e:
            logger.error(f"❌ Token verification failed: {e}")
            return None

    # ========================================================================
    # DATABASE OPERATIONS
    # ========================================================================

    async def create_campaign(
        self, user_id: str, name: str, description: str = None
    ) -> Dict[str, Any]:
        """
        Crear nueva campaña (creator es GM automático)
        
        Returns:
            Datos de la campaña y membresía creada
        """
        try:
            # Crear campaña
            campaign = (
                self._client.table("campaigns")
                .insert({"name": name, "description": description})
                .execute()
            )

            campaign_id = campaign.data[0]["id"]

            # Agregar creator como GM
            self._client.table("campaign_members").insert(
                {
                    "campaign_id": campaign_id,
                    "user_id": user_id,
                    "role": "GM",
                    "status": "ACTIVE",
                }
            ).execute()

            logger.info(f"✅ Campaign created: {name} ({campaign_id})")
            return {
                **campaign.data[0],
                "user_role": "GM",
            }

        except Exception as e:
            logger.error(f"❌ Campaign creation failed: {e}")
            raise

    async def get_user_campaigns(self, user_id: str) -> list:
        """
        Obtener campañas del usuario
        
        Returns:
            Lista de campañas con rol del usuario
        """
        try:
            result = (
                self._client.table("campaign_members")
                .select(
                    """
                    campaign_id, role,
                    campaigns:campaign_id(id, name, description, is_active, created_at)
                    """
                )
                .eq("user_id", user_id)
                .eq("status", "ACTIVE")
                .execute()
            )

            return [
                {
                    **item["campaigns"],
                    "user_role": item["role"],
                }
                for item in result.data
            ]

        except Exception as e:
            logger.error(f"❌ Failed to fetch campaigns: {e}")
            raise

    async def get_campaign_members(self, campaign_id: str) -> list:
        """Obtener miembros de una campaña"""
        try:
            result = (
                self._client.table("campaign_members")
                .select(
                    """
                    id, user_id, role, status, joined_at,
                    users:user_id(username, email)
                    """
                )
                .eq("campaign_id", campaign_id)
                .execute()
            )

            return result.data

        except Exception as e:
            logger.error(f"❌ Failed to fetch campaign members: {e}")
            raise

    async def join_campaign(self, campaign_id: str, user_id: str, role: str) -> Dict[str, Any]:
        """Unirse a una campaña con rol especificado"""
        try:
            result = (
                self._client.table("campaign_members")
                .insert(
                    {
                        "campaign_id": campaign_id,
                        "user_id": user_id,
                        "role": role,
                        "status": "ACTIVE",
                    }
                )
                .execute()
            )

            logger.info(f"✅ User {user_id} joined campaign {campaign_id} as {role}")
            return result.data[0]

        except Exception as e:
            logger.error(f"❌ Failed to join campaign: {e}")
            raise

    # ========================================================================
    # HEALTH CHECK
    # ========================================================================

    async def health_check(self) -> bool:
        """Verificar conexión a Supabase"""
        try:
            result = self._client.table("users").select("id").limit(1).execute()
            logger.info("✅ Supabase connection verified")
            return True
        except Exception as e:
            logger.error(f"❌ Supabase connection failed: {e}")
            return False


def get_supabase() -> SupabaseClient:
    """Obtener instancia de Supabase"""
    return SupabaseClient()

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
    _client: Client = None  # Cliente con ANON_KEY (para auth de usuarios)
    _admin_client: Client = None  # Cliente con SERVICE_KEY (para operaciones admin)
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        # Don't initialize on creation, wait for first use
        pass

    def _init_client(self):
        """Inicializar clientes de Supabase"""
        if self._initialized:
            return
            
        url = os.getenv("SUPABASE_URL")
        # Cliente con ANON_KEY para operaciones de cliente (auth, etc)
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        # Cliente con SERVICE_KEY para operaciones administrativas
        service_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not url or not anon_key:
            raise ValueError(
                "SUPABASE_URL y SUPABASE_ANON_KEY deben estar en .env"
            )

        self._client = create_client(url, anon_key)
        
        # Crear cliente admin si tenemos SERVICE_KEY
        if service_key:
            self._admin_client = create_client(url, service_key)
            logger.info("✅ Supabase clients initialized (ANON + ADMIN)")
        else:
            logger.info("✅ Supabase client initialized (ANON only)")
        
        self._initialized = True

    @property
    def client(self) -> Client:
        """Obtener cliente Supabase (ANON)"""
        if not self._initialized:
            self._init_client()
        return self._client

    @property
    def admin_client(self) -> Client:
        """Obtener cliente admin (SERVICE_KEY) para operaciones que requieren evitar RLS"""
        if not self._initialized:
            self._init_client()
        if not self._admin_client:
            raise ValueError("ADMIN client not available - SERVICE_KEY not configured")
        return self._admin_client

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
            response = self.client.auth.sign_up(
                {"email": email, "password": password}
            )

            if not response.user:
                raise ValueError("No user returned from signup")

            user_id = response.user.id

            # Crear perfil en tabla users
            self.client.table("users").insert(
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
                "created_at": getattr(response.user, "created_at", None),
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
            # Usar la propiedad 'client' para asegurar que está inicializado
            response = self.client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )

            if not response.session:
                raise ValueError("No session returned from login")

            # Intentar obtener datos del usuario de la tabla users
            try:
                user_data = (
                    self.client.table("users")
                    .select("*")
                    .eq("id", response.user.id)
                    .single()
                    .execute()
                )
                username = user_data.data.get("username", email.split("@")[0])
            except Exception as profile_error:
                # Si no existe perfil, usar datos básicos
                logger.warning(f"⚠️  No profile found for user {email}, using basic info")
                username = email.split("@")[0]

            logger.info(f"✅ User logged in: {email}")
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "username": username,
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
            response = self.client.auth.get_user(token)
            
            # La respuesta tiene la estructura: response.user
            if not response or not response.user:
                return None
            
            user = response.user
            user_id = user.id

            # Intentar obtener datos del perfil (puede no existir)
            try:
                user_data = (
                    self.client.table("users")
                    .select("*")
                    .eq("id", user_id)
                    .single()
                    .execute()
                )
                username = user_data.data.get("username", user.email.split("@")[0] if user.email else "user")
                created_at = user_data.data.get("created_at")
            except Exception:
                logger.warning(f"⚠️ No profile found for user {user.email}, using basic info")
                username = user.email.split("@")[0] if user.email else "user"
                created_at = None

            return {
                "id": user_id,
                "email": user.email,
                "username": username,
                "created_at": created_at,
            }

        except Exception as e:
            logger.error(f"❌ Token verification failed: {e}")
            return None


def get_supabase() -> SupabaseClient:
    """Obtener instancia de Supabase"""
    return SupabaseClient()

"""
Middleware de autenticación con JWT
"""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from functools import lru_cache

from services.supabase import get_supabase

logger = logging.getLogger(__name__)


async def get_current_user(request: Request):
    """
    Extraer y validar JWT del header Authorization
    
    Raises:
        HTTPException: Si no hay token o es inválido
    """
    auth_header = request.headers.get("authorization")

    if not auth_header:
        logger.warning("No authorization header provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extraer token del header "Bearer {token}"
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid authorization scheme")
    except ValueError:
        logger.error("Invalid authorization header format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )

    # Verificar token contra Supabase
    supabase = get_supabase()
    user = supabase.get_user_by_token(token)

    if not user:
        logger.warning(f"Invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return user


class AuthRequired:
    """Dependency para requerir autenticación"""

    def __init__(self, required: bool = True):
        self.required = required

    async def __call__(self, request: Request) -> Optional[dict]:
        if not self.required:
            # Intentar obtener usuario pero no fallar si no existe
            try:
                return await get_current_user(request)
            except HTTPException:
                return None

        # Requerir autenticación
        return await get_current_user(request)

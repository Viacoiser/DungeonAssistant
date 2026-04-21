"""
Router para autenticación
"""

import logging
from fastapi import APIRouter, HTTPException, status, Request, Depends

from models.schemas import UserRegister, UserLogin, UserResponse
from services.supabase import get_supabase
from middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    """
    Registrar nuevo usuario
    
    - **email**: Email válido único
    - **password**: Mínimo 8 caracteres
    - **username**: Nombre de usuario único
    """
    try:
        supabase = get_supabase()
        user = supabase.register_user(
            email=data.email,
            password=data.password,
            username=data.username,
        )

        return {
            "message": "Usuario registrado exitosamente",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
            },
        }

    except ValueError as e:
        logger.error(f"Registration error: {e}")
        error_msg = str(e)
        # Check if email already exists
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    except Exception as e:
        logger.error(f"Unexpected registration error: {e}")
        error_msg = str(e)
        # Check if email already exists
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower() or "user already registered" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during registration",
        )


@router.post("/login", response_model=dict)
async def login(data: UserLogin):
    """
    Login de usuario
    
    Retorna:
    - **access_token**: JWT para autorización
    - **refresh_token**: Token para renovar acceso
    - **user**: Datos del usuario
    """
    try:
        supabase = get_supabase()
        result = supabase.login_user(
            email=data.email,
            password=data.password,
        )

        return {
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer",
            "user": result["user"],
        }

    except ValueError as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during login",
        )


@router.post("/logout")
async def logout(current_user: dict = None):
    """
    Logout de usuario
    
    Nota: El frontend debe eliminar el token de localStorage
    """
    # En Supabase, el logout es simplemente eliminar el token en el cliente
    return {"message": "Sesión cerrada exitosamente"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Obtener perfil del usuario autenticado
    
    Requiere autenticación (Bearer token en header)
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        username=current_user["username"],
        created_at=current_user["created_at"],
    )

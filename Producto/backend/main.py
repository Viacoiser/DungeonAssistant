"""
DungeonAssistant Backend - FastAPI + Socket.io
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio

# Cargar entorno
env_file = Path(__file__).parent / '.env'
load_dotenv(env_file, override=True)

from routers import auth, campaigns, player, sessions, vision, gamemaster, realtime, assistant, dnd5e_search, rag, voice
from services.socket_manager import socket_manager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# El servidor de sockets ya está configurado en socket_manager.py
sio = socket_manager.sio

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("DungeonAssistant Backend starting...")
    yield
    logger.info("DungeonAssistant Backend shutting down...")

fastapi_app = FastAPI(
    title="DungeonAssistant API",
    description="Gestión de campañas D&D 5e",
    version="0.1.0",
    lifespan=lifespan
)

# Configuración de CORS
env_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]

default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]

final_origins = list(set(allowed_origins + default_origins))

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=final_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@fastapi_app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "service": "DungeonAssistant API",
        "version": "0.1.0"
    }

@fastapi_app.get("/", tags=["System"])
async def root():
    return {
        "message": "DungeonAssistant API",
        "docs": "/docs"
    }

fastapi_app.include_router(auth.router)
fastapi_app.include_router(campaigns.router)
fastapi_app.include_router(player.router)
fastapi_app.include_router(sessions.router)
fastapi_app.include_router(vision.router)
fastapi_app.include_router(gamemaster.router)
fastapi_app.include_router(realtime.router)
fastapi_app.include_router(assistant.router)
fastapi_app.include_router(dnd5e_search.router)
fastapi_app.include_router(rag.router)
fastapi_app.include_router(voice.router)

app = socketio.ASGIApp(sio, fastapi_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")

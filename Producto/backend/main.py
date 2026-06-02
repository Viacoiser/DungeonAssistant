"""
DungeonAssistant Backend - FastAPI + Socket.io
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio


# Cargar entorno
env_file = Path(__file__).parent / '.env'
load_dotenv(env_file, override=True)

from routers import auth, campaigns, player, sessions, vision, assistant, dnd5e_search
from services.socket_manager import socket_manager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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

fastapi_app.include_router(auth.router, prefix="/api")
fastapi_app.include_router(campaigns.router, prefix="/api")
fastapi_app.include_router(player.router, prefix="/api")
fastapi_app.include_router(sessions.router, prefix="/api")
fastapi_app.include_router(vision.router, prefix="/api")
fastapi_app.include_router(assistant.router, prefix="/api")
fastapi_app.include_router(dnd5e_search.router, prefix="/api")

# Envolver FastAPI con socket.io ASGIApp
app = socketio.ASGIApp(sio, fastapi_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")

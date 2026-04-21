"""
DungeonAssistant Backend - FastAPI + Socket.io
Gestión inteligente de campañas D&D 5e
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

# Load environment FIRST
load_dotenv(Path(__file__).parent / '.env')

# Import routers AFTER loading environment
from routers import auth, campaigns, player, sessions, vision, gamemaster, realtime, assistant, dnd5e_search, rag, voice

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Socket.io
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['*'],
    logger=logger,
    engineio_logger=logger
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejo del ciclo de vida de la aplicación"""
    logger.info("🚀 DungeonAssistant Backend starting...")
    yield
    logger.info("🛑 DungeonAssistant Backend shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="DungeonAssistant API",
    description="PWA inteligente para gestión de campañas D&D 5e",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health", tags=["System"])
async def health_check():
    """Verificar estado del backend"""
    return {
        "status": "ok",
        "service": "DungeonAssistant API",
        "version": "0.1.0"
    }

# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """Root endpoint"""
    return {
        "message": "DungeonAssistant API",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

# Include routers
app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(player.router)
app.include_router(sessions.router)
app.include_router(vision.router)
app.include_router(gamemaster.router)
app.include_router(realtime.router)
app.include_router(assistant.router)
app.include_router(dnd5e_search.router)
app.include_router(rag.router)
app.include_router(voice.router)

# Socket.io events (básico por ahora)
@sio.event
async def connect(sid: str, environ: dict):
    """Usuario se conecta al socket"""
    logger.info(f"✅ Cliente conectado: {sid}")

@sio.event
async def disconnect(sid: str):
    """Usuario se desconecta del socket"""
    logger.info(f"❌ Cliente desconectado: {sid}")

@sio.event
async def join_campaign(sid: str, data: dict):
    """Usuario se une a una sala de campaña"""
    campaign_id = data.get("campaign_id")
    sio.enter_room(sid, f"campaign_{campaign_id}")
    logger.info(f"Usuario {sid} se unió a campaña {campaign_id}")
    await sio.emit(
        "user_joined",
        {"user_id": sid, "campaign_id": campaign_id},
        to=f"campaign_{campaign_id}"
    )

# Mount Socket.io app
socket_app = socketio.ASGIApp(sio, app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

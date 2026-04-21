"""
Router para Socket.io y eventos en tiempo real
"""

from fastapi import APIRouter

router = APIRouter(prefix="/realtime", tags=["realtime"])


# Los eventos Socket.io se definen en main.py
# Este archivo es para futuros endpoints REST relacionados con realtime

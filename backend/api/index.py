"""
Entry point para Vercel Serverless Functions
"""
import sys
import os

# Agregar directorio backend al path
sys.path.insert(0, os.path.dirname(__file__))

from main import app

# Vercel espera un ASGI app exportado como 'app'
handler = app

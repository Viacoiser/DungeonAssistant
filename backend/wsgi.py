"""
WSGI wrapper para Vercel - Alternativa a Serverless Functions
"""
import sys
import os

# Agregar directorio backend al path
sys.path.insert(0, os.path.dirname(__file__))

from main import app

# Vercel puede usar directamente el app de FastAPI
application = app

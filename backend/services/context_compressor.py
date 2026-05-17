"""
Utilities para contexto RAG
"""

from typing import Dict


class ContextUtils:
    """Utilidades para manejo de contexto RAG"""
    
    @staticmethod
    def estimate_tokens(text: str) -> int:
        """
        Estimación rápida de tokens en texto
        (Rough: ~4 caracteres = 1 token en promedio)
        """
        return len(text) // 4


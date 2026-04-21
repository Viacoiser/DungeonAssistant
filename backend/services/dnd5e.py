"""
Servicio de dnd5eapi.co para validación de D&D
"""

import httpx
import logging

logger = logging.getLogger(__name__)

DND5E_API = "https://www.dnd5eapi.co/api"


class DnD5eService:
    """Servicio para validación contra d&d5eapi.co"""

    def __init__(self):
        self.base_url = DND5E_API
        logger.info("✅ DnD5e Service initialized")

    async def get_classes(self) -> list:
        """Obtener lista de clases válidas"""
        # TODO: Implementar
        return []

    async def get_races(self) -> list:
        """Obtener lista de razas válidas"""
        # TODO: Implementar
        return []

    async def validate_class(self, class_name: str) -> bool:
        """Validar si una clase es válida en D&D 5e"""
        # TODO: Implementar
        return True

    async def validate_race(self, race_name: str) -> bool:
        """Validar si una raza es válida en D&D 5e"""
        # TODO: Implementar
        return True

    async def validate_spell(self, spell_name: str) -> bool:
        """Validar si un hechizo es válido"""
        # TODO: Implementar
        return True

    async def validate_feat(self, feat_name: str) -> bool:
        """Validar si un talento es válido"""
        # TODO: Implementar
        return True


def get_dnd5e_service() -> DnD5eService:
    """Obtener instancia del servicio DnD5e"""
    return DnD5eService()

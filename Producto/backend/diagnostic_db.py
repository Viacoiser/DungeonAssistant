import sys
import os
from pathlib import Path

# Añadir el path del backend para poder importar servicios
sys.path.append(str(Path(__file__).parent))

from services.supabase import get_supabase

def check_categories():
    supabase = get_supabase()
    try:
        # Obtener categorías únicas
        response = supabase.client.table("encyclopedia").select("category").execute()
        categories = set(r['category'] for r in response.data)
        print(f"Categorías encontradas en DB: {categories}")
        
        # Verificar dragonborn específicamente
        db_check = supabase.client.table("encyclopedia") \
            .select("category, index") \
            .ilike("index", "dragonborn") \
            .execute()
        print(f"Búsqueda de 'dragonborn': {db_check.data}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_categories()

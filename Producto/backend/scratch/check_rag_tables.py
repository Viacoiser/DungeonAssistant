import os
import sys
from dotenv import load_dotenv

# Añadir el backend al path para que las importaciones funcionen
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

from services.supabase import SupabaseClient

def check_tables():
    try:
        supabase = SupabaseClient()
        client = supabase.client
        
        tables_to_check = ["rag_entities", "rag_events", "rag_relationships"]
        
        for table in tables_to_check:
            try:
                res = client.table(table).select("count", count="exact").limit(1).execute()
                print(f"Table '{table}' exists. Rows: {res.count}")
            except Exception as e:
                print(f"Table '{table}' does NOT exist or has error: {str(e)[:100]}")
                
    except Exception as e:
        print(f"Initialization error: {e}")

if __name__ == "__main__":
    check_tables()

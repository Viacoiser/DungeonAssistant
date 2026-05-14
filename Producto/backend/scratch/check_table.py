import os
from dotenv import load_dotenv
from supabase import create_client

def check_table():
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = create_client(url, key)
    
    try:
        # Intentar una consulta simple a la tabla encyclopedia
        supabase.table("encyclopedia").select("count").limit(1).execute()
        print("TABLE_EXISTS")
    except Exception as e:
        if "PGRST205" in str(e) or "Could not find the table" in str(e):
            print("TABLE_MISSING")
        else:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    check_table()

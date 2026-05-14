"""
Script para registrar usuario correctamente en Supabase
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar .env
env_file = Path(__file__).parent / '.env'
load_dotenv(env_file, override=True)

from supabase import create_client

url = os.getenv("SUPABASE_URL")
anon_key = os.getenv("SUPABASE_ANON_KEY")

client = create_client(url, anon_key)

# Credenciales de usuario demo
TEST_EMAIL = "demo@example.com"
TEST_PASSWORD = "DemoPassword123!"
TEST_USERNAME = "DemoUser"

print(f"🔄 Registering user: {TEST_EMAIL}")
print(f"   Password: {TEST_PASSWORD}")

try:
    # 1. Registrar en Supabase Auth
    auth_response = client.auth.sign_up({
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    user_id = auth_response.user.id
    print(f"✅ User registered in Auth: {user_id}")
    
    # 2. Crear el perfil en la tabla users
    # (Esto se debe hacer con service key o como un trigger)
    print(f"✅ User created successfully!")
    print(f"\n📝 Test credentials:")
    print(f"   Email: {TEST_EMAIL}")
    print(f"   Password: {TEST_PASSWORD}")
    print(f"   Username: {TEST_USERNAME}")
    
except Exception as e:
    error_str = str(e)
    if "already registered" in error_str.lower() or "already exists" in error_str.lower():
        print(f"⚠️  User already exists: {TEST_EMAIL}")
        print(f"   Trying to login to verify...")
        try:
            login_response = client.auth.sign_in_with_password({
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            print(f"✅ Login successful!")
            print(f"   Token: {login_response.session.access_token[:50]}...")
        except Exception as login_error:
            print(f"❌ Login failed: {login_error}")
    else:
        print(f"❌ Error: {error_str}")

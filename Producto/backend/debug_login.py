"""
Script para verificar problemas de login
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
service_key = os.getenv("SUPABASE_SERVICE_KEY")

print(f"✅ Loaded credentials")
print(f"   SUPABASE_URL: {url[:40]}...")
print(f"   Using ANON_KEY: {anon_key[:40]}...")

client = create_client(url, anon_key)

print("\n📋 Users in database:")
try:
    result = client.table("users").select("id,email,username").execute()
    for user in result.data:
        print(f"   - {user['email']} (username: {user['username']})")
except Exception as e:
    print(f"   Error: {e}")

# Test login con un usuario existente
test_email = "asd22@gmail.com"
test_password = "asd22@gmail.com"  # Asumimos que es la misma

print(f"\n🔐 Testing login with {test_email}...")
try:
    response = client.auth.sign_in_with_password({
        "email": test_email,
        "password": test_password
    })
    print(f"✅ Login successful!")
    print(f"   Access token: {response.session.access_token[:50]}...")
except Exception as e:
    print(f"❌ Login failed: {e}")

# Intentar con otro usuario
print(f"\n🔐 Trying alternative password...")
try:
    response = client.auth.sign_in_with_password({
        "email": test_email,
        "password": "password123"
    })
    print(f"✅ Login successful with 'password123'!")
except Exception as e:
    print(f"❌ Also failed: {e}")

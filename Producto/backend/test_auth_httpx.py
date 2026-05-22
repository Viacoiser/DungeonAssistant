"""
Script para probar registro con httpx (que está en requirements.txt)
"""
import asyncio
import httpx

async def test_auth():
    async with httpx.AsyncClient() as client:
        print("\n=== VERIFICANDO API ===\n")
        
        # 1. Health check
        try:
            resp = await client.get("http://localhost:8000/health")
            print(f"✅ Backend: {resp.status_code}")
        except Exception as e:
            print(f"❌ Backend: {e}")
            return
        
        # 2. Register
        print("\n--- REGISTRO ---")
        try:
            resp = await client.post(
                "http://localhost:8000/auth/register",
                json={
                    "email": "demo@example.com",
                    "password": "DemoPassword123!",
                    "username": "DemoUser"
                },
                timeout=10
            )
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.json()}")
        except Exception as e:
            print(f"Error: {e}")
        
        # 3. Login
        print("\n--- LOGIN ---")
        try:
            resp = await client.post(
                "http://localhost:8000/auth/login",
                json={
                    "email": "demo@example.com",
                    "password": "DemoPassword123!"
                },
                timeout=10
            )
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.json()}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_auth())

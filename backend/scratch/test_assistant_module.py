import asyncio
import httpx
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

async def create_test_user(client, prefix):
    email = f"test_assist_{prefix}_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    username = f"user_{prefix}_{uuid.uuid4().hex[:8]}"
    
    await client.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "username": username})
    resp = await client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    
    token = resp.json().get("access_token")
    user_id = resp.json().get("user").get("id")
    
    return {"token": token, "id": user_id, "email": email}

async def test_assistant_module():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("\n=============================================")
        print(" EJECUTANDO PRUEBAS: ASISTENTE IA (Bug Ciego)")
        print("=============================================\n")

        # PREPARACIÓN
        print("PREPARANDO ENTORNOS...")
        gm_user = await create_test_user(client, "gm")
        player_user = await create_test_user(client, "player")

        gm_headers = {"Authorization": f"Bearer {gm_user['token']}"}
        player_headers = {"Authorization": f"Bearer {player_user['token']}"}

        # Crear campaña
        resp = await client.post(
            f"{BASE_URL}/campaigns",
            json={"name": "Campaña IA Test", "description": "Prueba de RAG"},
            headers=gm_headers
        )
        campaign_id = resp.json().get("id")
        invite_code = resp.json().get("invite_code")

        # Jugador se une a la campaña
        await client.post(f"{BASE_URL}/campaigns/join", json={"invite_code": invite_code}, headers=player_headers)

        # Para probar que el asistente lee el RAG, inyectamos una entidad falsa en la base de datos
        print("Inyectando entidad RAG directamente a la DB para pruebas...")
        import os
        from dotenv import load_dotenv
        
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sys.path.append(backend_dir)
        load_dotenv(os.path.join(backend_dir, ".env"))
        from services.supabase import SupabaseClient
        
        db_client = SupabaseClient().admin_client
        db_client.table("rag_entities").insert({
            "campaign_id": campaign_id,
            "entity_type": "NPC",
            "entity_name": "Gorgodoro el Magnifico",
            "description": "Un dragón dorado que vende helados de vainilla.",
            "mention_count": 5
        }).execute()

        # -------------------------------------------------------------
        # TC-AST-01: Asistente usa RAG exitosamente
        # -------------------------------------------------------------
        print("\nTC-AST-01: Asistente usa RAG exitosamente... (Llamando a Gemini)")
        try:
            resp = await client.post(
                f"{BASE_URL}/assistant/chat",
                json={"campaign_id": campaign_id, "question": "Quien es Gorgodoro el Magnifico?"},
                headers=player_headers
            )
            
            if resp.status_code == 200:
                data = resp.json()
                context_used = data.get("context_used", {})
                rag_entities_used = context_used.get("rag_entities_used", 0)
                answer = data.get("answer", "")
                
                print(f"  -> Gemini respondió: {answer[:60]}...")
                
                if rag_entities_used > 0:
                    print(f"  [OK] PASSED (200 OK, Asistente ya no está ciego, RAG_entities_used: {rag_entities_used})")
                else:
                    print(f"  [FAIL] FAILED (El asistente sigue ciego, RAG_entities_used = 0)")
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_assistant_module())

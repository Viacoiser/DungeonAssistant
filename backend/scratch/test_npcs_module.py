import asyncio
import httpx
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

async def create_test_user(client, prefix):
    email = f"test_npc_{prefix}_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    username = f"user_{prefix}_{uuid.uuid4().hex[:8]}"
    
    await client.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "username": username})
    resp = await client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    
    token = resp.json().get("access_token")
    user_id = resp.json().get("user").get("id")
    
    return {"token": token, "id": user_id, "email": email}

async def test_npcs_module():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("\n=============================================")
        print(" EJECUTANDO PLAN DE PRUEBAS: MODULO DE NPCs")
        print("=============================================\n")

        results = {}

        # PREPARACIÓN
        print("PREPARANDO ENTORNOS...")
        gm_user = await create_test_user(client, "gm")
        player_user = await create_test_user(client, "player")
        other_user = await create_test_user(client, "other")

        gm_headers = {"Authorization": f"Bearer {gm_user['token']}"}
        player_headers = {"Authorization": f"Bearer {player_user['token']}"}
        other_headers = {"Authorization": f"Bearer {other_user['token']}"}

        # Crear campaña
        resp = await client.post(
            f"{BASE_URL}/campaigns",
            json={"name": "Campaña para NPCs", "description": "Testing NPCs"},
            headers=gm_headers
        )
        campaign_id = resp.json().get("id")
        invite_code = resp.json().get("invite_code")

        # Jugador se une a la campaña
        await client.post(f"{BASE_URL}/campaigns/join", json={"invite_code": invite_code}, headers=player_headers)

        npc_id = None

        # -------------------------------------------------------------
        # TC-NPC-02: Generar NPC sin permisos
        # -------------------------------------------------------------
        print("TC-NPC-02: Generar NPC sin permisos...")
        try:
            resp = await client.post(
                f"{BASE_URL}/campaigns/{campaign_id}/npcs",
                json={"prompt": "Un mercader de pociones goblin amigable."},
                headers=player_headers
            )
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-NPC-02"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-NPC-02"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-NPC-02"] = "FAILED"

        # -------------------------------------------------------------
        # TC-NPC-01: Generar NPC con IA (GM)
        # -------------------------------------------------------------
        print("\nTC-NPC-01: Generar NPC con IA (GM)... (Esto puede demorar por Gemini)")
        try:
            resp = await client.post(
                f"{BASE_URL}/campaigns/{campaign_id}/npcs",
                json={"prompt": "Un mercader de pociones goblin amigable llamado Gik."},
                headers=gm_headers
            )
            if resp.status_code == 200:
                npc_id = resp.json().get("id")
                print(f"  [OK] PASSED (200 OK, NPC ID: {npc_id})")
                results["TC-NPC-01"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-NPC-01"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-NPC-01"] = "FAILED"

        # -------------------------------------------------------------
        # TC-NPC-03: Listar NPCs de campana
        # -------------------------------------------------------------
        print("\nTC-NPC-03: Listar NPCs de campana (Jugador)...")
        try:
            resp = await client.get(f"{BASE_URL}/campaigns/{campaign_id}/npcs", headers=player_headers)
            if resp.status_code == 200 and len(resp.json()) >= 1:
                print("  [OK] PASSED (200 OK, NPCs listados)")
                results["TC-NPC-03"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-NPC-03"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-NPC-03"] = "FAILED"
            
        # -------------------------------------------------------------
        # TC-NPC-03-B: Listar NPCs de campana sin ser miembro
        # -------------------------------------------------------------
        print("\nTC-NPC-03-B: Listar NPCs de campana sin ser miembro...")
        try:
            resp = await client.get(f"{BASE_URL}/campaigns/{campaign_id}/npcs", headers=other_headers)
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-NPC-03-B"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-NPC-03-B"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-NPC-03-B"] = "FAILED"

        # -------------------------------------------------------------
        # TC-NPC-04: Actualizar NPC (GM)
        # -------------------------------------------------------------
        print("\nTC-NPC-04: Actualizar NPC (GM)...")
        try:
            resp = await client.patch(
                f"{BASE_URL}/campaigns/{campaign_id}/npcs/{npc_id}",
                json={"personality": "Muy avaro, siempre cobra de mas."},
                headers=gm_headers
            )
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, NPC actualizado)")
                results["TC-NPC-04"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-NPC-04"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-NPC-04"] = "FAILED"
            
        # -------------------------------------------------------------
        # TC-NPC-04-B: Actualizar NPC sin ser GM
        # -------------------------------------------------------------
        print("\nTC-NPC-04-B: Actualizar NPC sin ser GM...")
        try:
            resp = await client.patch(
                f"{BASE_URL}/campaigns/{campaign_id}/npcs/{npc_id}",
                json={"personality": "Regala pociones."},
                headers=player_headers
            )
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-NPC-04-B"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-NPC-04-B"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-NPC-04-B"] = "FAILED"

        # -------------------------------------------------------------
        # TC-NPC-05: Eliminar NPC (GM)
        # -------------------------------------------------------------
        print("\nTC-NPC-05: Eliminar NPC (GM)...")
        try:
            resp = await client.delete(f"{BASE_URL}/campaigns/{campaign_id}/npcs/{npc_id}", headers=gm_headers)
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, NPC eliminado)")
                results["TC-NPC-05"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-NPC-05"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-NPC-05"] = "FAILED"

        # -------------------------------------------------------------
        # RESUMEN
        # -------------------------------------------------------------
        print("\n=============================================")
        print(" RESUMEN DE RESULTADOS: MODULO DE NPCs")
        print("=============================================")
        all_passed = True
        for tc, res in results.items():
            print(f"{tc}: {res}")
            if res != "PASSED":
                all_passed = False
        print("=============================================\n")
        
        if all_passed:
            sys.exit(0)
        else:
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_npcs_module())

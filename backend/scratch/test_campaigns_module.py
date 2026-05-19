import asyncio
import httpx
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

async def create_test_user(client, prefix):
    email = f"test_camp_{prefix}_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    username = f"user_{prefix}_{uuid.uuid4().hex[:8]}"
    
    # Register
    await client.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "username": username})
    
    # Login
    resp = await client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    token = resp.json().get("access_token")
    user_id = resp.json().get("user").get("id")
    
    return {"token": token, "id": user_id, "email": email}

async def test_campaigns_module():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("\n=============================================")
        print(" EJECUTANDO PLAN DE PRUEBAS: MODULO DE CAMPAÑAS")
        print("=============================================\n")

        results = {}

        # PREPARACIÓN
        print("PREPARANDO ENTORNOS (Usuarios)...")
        gm_user = await create_test_user(client, "gm")
        player_user = await create_test_user(client, "player")

        gm_headers = {"Authorization": f"Bearer {gm_user['token']}"}
        player_headers = {"Authorization": f"Bearer {player_user['token']}"}

        campaign_id = None
        invite_code = None

        # -------------------------------------------------------------
        # TC-CAMP-01: Crear campana
        # -------------------------------------------------------------
        print("TC-CAMP-01: Crear campana...")
        try:
            resp = await client.post(
                f"{BASE_URL}/campaigns",
                json={"name": "La Mina Perdida", "description": "Aventura inicial"},
                headers=gm_headers
            )
            if resp.status_code == 200:
                data = resp.json()
                campaign_id = data.get("id")
                invite_code = data.get("invitation_code")
                print(f"  [OK] PASSED (200 OK, ID: {campaign_id}, Code: {invite_code})")
                results["TC-CAMP-01"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-01"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-01"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-02: Listar campanas del usuario
        # -------------------------------------------------------------
        print("\nTC-CAMP-02: Listar campanas del usuario...")
        try:
            resp = await client.get(f"{BASE_URL}/campaigns", headers=gm_headers)
            if resp.status_code == 200 and isinstance(resp.json(), list) and len(resp.json()) >= 1:
                print("  [OK] PASSED (200 OK, campanas listadas)")
                results["TC-CAMP-02"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-02"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-02"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-03: Obtener detalle de campana
        # -------------------------------------------------------------
        print("\nTC-CAMP-03: Obtener detalle de campana...")
        try:
            resp = await client.get(f"{BASE_URL}/campaigns/{campaign_id}", headers=gm_headers)
            if resp.status_code == 200 and resp.json().get("name") == "La Mina Perdida":
                print("  [OK] PASSED (200 OK, detalle obtenido)")
                results["TC-CAMP-03"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-03"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-03"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-04: Actualizar campana (GM)
        # -------------------------------------------------------------
        print("\nTC-CAMP-04: Actualizar campana (GM)...")
        try:
            resp = await client.patch(
                f"{BASE_URL}/campaigns/{campaign_id}",
                json={"name": "La Mina Perdida de Phandelver", "lore_summary": "Goblins en todas partes"},
                headers=gm_headers
            )
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, campana actualizada)")
                results["TC-CAMP-04"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-04"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-04"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-07: Unirse a campana por codigo
        # -------------------------------------------------------------
        print("\nTC-CAMP-07: Unirse a campana por codigo...")
        try:
            resp = await client.post(
                f"{BASE_URL}/campaigns/join",
                json={"invite_code": invite_code},
                headers=player_headers
            )
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, usuario unido)")
                results["TC-CAMP-07"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-07"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-07"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-08: Codigo de campana invalido
        # -------------------------------------------------------------
        print("\nTC-CAMP-08: Codigo de campana invalido...")
        try:
            resp = await client.post(
                f"{BASE_URL}/campaigns/join",
                json={"invite_code": "INVALID"},
                headers=player_headers
            )
            if resp.status_code == 404 or resp.status_code == 422: # 422 si falla la validación Pydantic del min_length=6
                print(f"  [OK] PASSED (Status: {resp.status_code} as expected)")
                results["TC-CAMP-08"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-08"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-08"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-09: Unirse a campana ya siendo miembro
        # -------------------------------------------------------------
        print("\nTC-CAMP-09: Unirse a campana ya siendo miembro...")
        try:
            resp = await client.post(
                f"{BASE_URL}/campaigns/join",
                json={"invite_code": invite_code},
                headers=player_headers
            )
            if resp.status_code == 200 or resp.status_code == 400: # 400 si ya existe
                print(f"  [OK] PASSED (Status: {resp.status_code} as expected)")
                results["TC-CAMP-09"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-09"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-09"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-10: Regenerar codigo de invitacion (GM)
        # -------------------------------------------------------------
        print("\nTC-CAMP-10: Regenerar codigo de invitacion (GM)...")
        try:
            resp = await client.post(f"{BASE_URL}/campaigns/{campaign_id}/regenerate-code", headers=gm_headers)
            if resp.status_code == 200:
                new_code = resp.json().get("new_code")
                print(f"  [OK] PASSED (200 OK, nuevo codigo: {new_code})")
                results["TC-CAMP-10"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-10"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-10"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-11: Listar miembros de campana
        # -------------------------------------------------------------
        print("\nTC-CAMP-11: Listar miembros de campana...")
        try:
            resp = await client.get(f"{BASE_URL}/campaigns/{campaign_id}/members", headers=gm_headers)
            data = resp.json()
            if resp.status_code == 200 and isinstance(data.get("members"), list) and len(data.get("members")) >= 1:
                print(f"  [OK] PASSED (200 OK, {len(data.get('members'))} miembros listados)")
                results["TC-CAMP-11"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-11"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-11"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-06: Eliminar campana sin ser GM
        # -------------------------------------------------------------
        print("\nTC-CAMP-06: Eliminar campana sin ser GM...")
        try:
            resp = await client.delete(f"{BASE_URL}/campaigns/{campaign_id}", headers=player_headers)
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-CAMP-06"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-06"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-06"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CAMP-05: Eliminar campana (GM)
        # -------------------------------------------------------------
        print("\nTC-CAMP-05: Eliminar campana (GM)...")
        try:
            resp = await client.delete(f"{BASE_URL}/campaigns/{campaign_id}", headers=gm_headers)
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, campana eliminada)")
                results["TC-CAMP-05"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CAMP-05"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CAMP-05"] = "FAILED"


        # -------------------------------------------------------------
        # RESUMEN
        # -------------------------------------------------------------
        print("\n=============================================")
        print(" RESUMEN DE RESULTADOS: MODULO DE CAMPAÑAS")
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
    asyncio.run(test_campaigns_module())

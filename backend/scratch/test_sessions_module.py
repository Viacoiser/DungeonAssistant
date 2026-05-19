import asyncio
import httpx
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

async def create_test_user(client, prefix):
    email = f"test_sess_{prefix}_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    username = f"user_{prefix}_{uuid.uuid4().hex[:8]}"
    
    await client.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "username": username})
    resp = await client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    
    token = resp.json().get("access_token")
    user_id = resp.json().get("user").get("id")
    
    return {"token": token, "id": user_id, "email": email}

async def test_sessions_module():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("\n=============================================")
        print(" EJECUTANDO PLAN DE PRUEBAS: MODULO DE SESIONES")
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

        # Crear campaña para la prueba
        resp = await client.post(
            f"{BASE_URL}/campaigns",
            json={"name": "Campaña para Sesiones", "description": "Testing sessions"},
            headers=gm_headers
        )
        campaign_id = resp.json().get("id")
        invite_code = resp.json().get("invite_code")

        # Jugador se une a la campaña
        await client.post(f"{BASE_URL}/campaigns/join", json={"invite_code": invite_code}, headers=player_headers)

        session_id = None
        note_id = None

        # -------------------------------------------------------------
        # TC-SESS-02: Crear sesion sin permisos
        # -------------------------------------------------------------
        print("TC-SESS-02: Crear sesion sin permisos...")
        try:
            resp = await client.post(
                f"{BASE_URL}/sessions",
                json={"campaign_id": campaign_id, "session_number": 1, "title": "Sesion Ilegal"},
                headers=player_headers
            )
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-SESS-02"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-02"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-02"] = "FAILED"

        # -------------------------------------------------------------
        # TC-SESS-01: Crear sesion (GM)
        # -------------------------------------------------------------
        print("\nTC-SESS-01: Crear sesion (GM)...")
        try:
            resp = await client.post(
                f"{BASE_URL}/sessions",
                json={"campaign_id": campaign_id, "session_number": 1, "title": "El Comienzo"},
                headers=gm_headers
            )
            if resp.status_code == 200:
                session_id = resp.json().get("id")
                print(f"  [OK] PASSED (200 OK, Session ID: {session_id})")
                results["TC-SESS-01"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-01"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-01"] = "FAILED"

        # -------------------------------------------------------------
        # TC-SESS-03: Listar sesiones de campana
        # -------------------------------------------------------------
        print("\nTC-SESS-03: Listar sesiones de campana...")
        try:
            resp = await client.get(f"{BASE_URL}/sessions/campaign/{campaign_id}", headers=player_headers)
            if resp.status_code == 200 and len(resp.json()) >= 1:
                print("  [OK] PASSED (200 OK, sesiones listadas)")
                results["TC-SESS-03"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-03"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-03"] = "FAILED"

        # -------------------------------------------------------------
        # Iniciar Sesión (helper)
        # -------------------------------------------------------------
        if session_id:
            await client.post(f"{BASE_URL}/sessions/{session_id}/start", headers=gm_headers)

        # -------------------------------------------------------------
        # TC-SESS-05: Crear nota en sesion
        # -------------------------------------------------------------
        print("\nTC-SESS-05: Crear nota en sesion...")
        try:
            resp = await client.post(
                f"{BASE_URL}/sessions/{session_id}/notes",
                json={"content": "Encontramos un cofre con 500 monedas de oro."},
                headers=player_headers
            )
            if resp.status_code == 200:
                note_id = resp.json().get("note", {}).get("id")
                print(f"  [OK] PASSED (200 OK, Note ID: {note_id})")
                results["TC-SESS-05"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-05"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-05"] = "FAILED"

        # -------------------------------------------------------------
        # TC-SESS-06: Obtener notas de sesion (Propia)
        # -------------------------------------------------------------
        print("\nTC-SESS-06: Obtener notas de sesion (Propia)...")
        try:
            resp = await client.get(f"{BASE_URL}/sessions/{session_id}/notes", headers=player_headers)
            if resp.status_code == 200 and len(resp.json().get("notes", [])) >= 1:
                print("  [OK] PASSED (200 OK, notas obtenidas)")
                results["TC-SESS-06"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-06"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-06"] = "FAILED"

        # -------------------------------------------------------------
        # TC-SESS-06-B: Obtener notas de sesion ajena (GM no debe verlas)
        # -------------------------------------------------------------
        print("\nTC-SESS-06-B: Obtener notas de sesion ajena (GM no debe verlas)...")
        try:
            resp = await client.get(f"{BASE_URL}/sessions/{session_id}/notes", headers=gm_headers)
            if resp.status_code == 200 and len(resp.json().get("notes", [])) == 0:
                print("  [OK] PASSED (200 OK, GM no ve la nota del jugador)")
                results["TC-SESS-06-B"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-06-B"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-06-B"] = "FAILED"

        # -------------------------------------------------------------
        # TC-SESS-08: Eliminar nota de otro jugador
        # -------------------------------------------------------------
        print("\nTC-SESS-08: Eliminar nota de otro jugador...")
        try:
            resp = await client.delete(f"{BASE_URL}/sessions/notes/{note_id}", headers=other_headers)
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-SESS-08"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-08"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-08"] = "FAILED"

        # -------------------------------------------------------------
        # TC-SESS-09: Eliminar nota de otro jugador siendo GM (Debe fallar)
        # -------------------------------------------------------------
        print("\nTC-SESS-09: Eliminar nota de otro jugador siendo GM...")
        try:
            resp = await client.delete(f"{BASE_URL}/sessions/notes/{note_id}", headers=gm_headers)
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-SESS-09"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-09"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-09"] = "FAILED"

        # -------------------------------------------------------------
        # TC-SESS-07: Eliminar nota propia
        # -------------------------------------------------------------
        print("\nTC-SESS-07: Eliminar nota propia...")
        try:
            resp = await client.delete(f"{BASE_URL}/sessions/notes/{note_id}", headers=player_headers)
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, nota eliminada)")
                results["TC-SESS-07"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-07"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-07"] = "FAILED"

        # -------------------------------------------------------------
        # TC-SESS-04: Actualizar sesion (cerrar sesion / Terminar)
        # -------------------------------------------------------------
        # Para evitar usar cuota de Gemini en tests iterativos, tal vez falle si no hay API key o no devuelve 200.
        print("\nTC-SESS-04: Actualizar sesion (cerrar sesion)...")
        try:
            resp = await client.post(f"{BASE_URL}/sessions/{session_id}/end", headers=gm_headers)
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, sesion cerrada)")
                results["TC-SESS-04"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-SESS-04"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-SESS-04"] = "FAILED"

        # -------------------------------------------------------------
        # RESUMEN
        # -------------------------------------------------------------
        print("\n=============================================")
        print(" RESUMEN DE RESULTADOS: MODULO DE SESIONES")
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
    asyncio.run(test_sessions_module())

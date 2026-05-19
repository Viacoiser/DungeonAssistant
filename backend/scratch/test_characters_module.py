import asyncio
import httpx
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

async def create_test_user(client, role_name):
    email = f"test_{role_name}_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecurePassword123!"
    username = f"user_{role_name}_{uuid.uuid4().hex[:8]}"
    
    # Register
    await client.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "username": username})
    
    # Login
    resp = await client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    token = resp.json().get("access_token")
    user_id = resp.json().get("user").get("id")
    
    return {"token": token, "id": user_id, "email": email}

async def test_characters_module():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("\n=============================================")
        print(" EJECUTANDO PLAN DE PRUEBAS: MODULO DE PERSONAJES")
        print("=============================================\n")

        results = {}

        # PREPARACION: Crear usuarios y campaña
        print("PREPARANDO ENTORNOS (Usuarios y Campaña)...")
        gm_user = await create_test_user(client, "gm")
        player_user = await create_test_user(client, "player")
        other_user = await create_test_user(client, "other")

        gm_headers = {"Authorization": f"Bearer {gm_user['token']}"}
        player_headers = {"Authorization": f"Bearer {player_user['token']}"}
        other_headers = {"Authorization": f"Bearer {other_user['token']}"}

        # Crear campaña con GM
        resp = await client.post(
            f"{BASE_URL}/campaigns",
            json={"name": "Test Campaign", "description": "For character tests"},
            headers=gm_headers
        )
        campaign_data = resp.json()
        campaign_id = campaign_data.get("id")
        invite_code = campaign_data.get("invite_code")
        
        # -------------------------------------------------------------
        # TC-CHAR-01: Crear personaje básico
        # -------------------------------------------------------------
        print("TC-CHAR-01: Crear personaje basico...")
        try:
            basic_char_data = {
                "name": "Thorin",
                "race": "Dwarf",
                "class_": "Fighter",
                "level": 1,
                "hp_max": 12,
                "hp_current": 12,
                "stats": {"strength": 16, "dexterity": 10, "constitution": 14, "intelligence": 8, "wisdom": 12, "charisma": 10}
            }
            resp = await client.post(f"{BASE_URL}/characters", json=basic_char_data, headers=player_headers)
            if resp.status_code == 200:
                char1_id = resp.json().get("id")
                print(f"  [OK] PASSED (200 OK, ID: {char1_id})")
                results["TC-CHAR-01"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-01"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-01"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-02: Crear personaje con todos los campos
        # -------------------------------------------------------------
        print("\nTC-CHAR-02: Crear personaje con todos los campos...")
        try:
            full_char_data = {
                "name": "Gandalf",
                "race": "Maia",
                "class_": "Wizard",
                "level": 20,
                "hp_max": 120,
                "hp_current": 120,
                "stats": {"strength": 10, "dexterity": 14, "constitution": 14, "intelligence": 20, "wisdom": 18, "charisma": 16},
                "background": "Sage",
                "alignment": "Neutral Good",
                "equipment": "Staff, Robes",
                "attacks": [{"name": "Staff", "attack_bonus": "+8", "damage": "1d6+4", "damage_type": "bludgeoning"}],
                "currency": {"gp": 100, "sp": 50, "cp": 0, "ep": 0, "pp": 0},
                "personality_traits": "Wise and mysterious",
                "ideals": "Protect the innocent",
                "bonds": "Fellowship",
                "flaws": "Smokes too much pipeweed",
                "backstory": "Came from Valinor"
            }
            resp = await client.post(f"{BASE_URL}/characters", json=full_char_data, headers=player_headers)
            if resp.status_code == 200:
                char2_id = resp.json().get("id")
                print(f"  [OK] PASSED (200 OK, ID: {char2_id})")
                results["TC-CHAR-02"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-02"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-02"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-03: Listar todos los personajes del usuario
        # -------------------------------------------------------------
        print("\nTC-CHAR-03: Listar todos los personajes del usuario...")
        try:
            resp = await client.get(f"{BASE_URL}/characters", headers=player_headers)
            if resp.status_code == 200 and resp.json().get("count", 0) >= 2:
                print(f"  [OK] PASSED (200 OK, Encontrados {resp.json().get('count')} personajes)")
                results["TC-CHAR-03"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-03"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-03"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-12: Unir personaje a campaña por codigo
        # -------------------------------------------------------------
        print("\nTC-CHAR-12: Unir personaje a campana por codigo...")
        try:
            resp = await client.post(
                f"{BASE_URL}/characters/{char1_id}/join-campaign-by-code",
                json={"invite_code": invite_code},
                headers=player_headers
            )
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, Personaje unido a campaña)")
                results["TC-CHAR-12"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-12"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-12"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-04: Listar personajes de una campaña
        # -------------------------------------------------------------
        print("\nTC-CHAR-04: Listar personajes de una campana...")
        try:
            resp = await client.get(f"{BASE_URL}/characters?campaign_id={campaign_id}", headers=player_headers)
            if resp.status_code == 200 and resp.json().get("count", 0) >= 1:
                print("  [OK] PASSED (200 OK, Personaje de campaña listado)")
                results["TC-CHAR-04"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-04"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-04"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-05: Obtener detalle de personaje
        # -------------------------------------------------------------
        print("\nTC-CHAR-05: Obtener detalle de personaje...")
        try:
            resp = await client.get(f"{BASE_URL}/characters/{char1_id}", headers=player_headers)
            if resp.status_code == 200 and resp.json().get("name") == "Thorin":
                print("  [OK] PASSED (200 OK, Detalle correcto)")
                results["TC-CHAR-05"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-05"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-05"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-06: Actualizar personaje (propietario)
        # -------------------------------------------------------------
        print("\nTC-CHAR-06: Actualizar personaje (propietario)...")
        try:
            resp = await client.put(
                f"{BASE_URL}/characters/{char1_id}",
                json={"level": 2, "hp_max": 20},
                headers=player_headers
            )
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, Actualizado correctamente)")
                results["TC-CHAR-06"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-06"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-06"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-07: Actualizar personaje (GM de campaña)
        # -------------------------------------------------------------
        print("\nTC-CHAR-07: Actualizar personaje (GM de campana)...")
        try:
            resp = await client.put(
                f"{BASE_URL}/characters/{char1_id}",
                json={"hp_current": 15},
                headers=gm_headers
            )
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, Actualizado por GM)")
                results["TC-CHAR-07"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-07"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-07"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-08: Actualizar personaje sin permisos
        # -------------------------------------------------------------
        print("\nTC-CHAR-08: Actualizar personaje sin permisos...")
        try:
            resp = await client.put(
                f"{BASE_URL}/characters/{char1_id}",
                json={"hp_current": 10},
                headers=other_headers
            )
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-CHAR-08"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-08"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-08"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-09: Actualizar estado (vivo/muerto) — solo GM
        # -------------------------------------------------------------
        print("\nTC-CHAR-09: Actualizar estado (vivo/muerto) - solo GM...")
        try:
            resp = await client.put(
                f"{BASE_URL}/characters/{char1_id}/status",
                json={"is_alive": False},
                headers=gm_headers
            )
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK, Estado actualizado por GM)")
                results["TC-CHAR-09"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-09"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-09"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-10: Cambiar estado sin ser GM
        # -------------------------------------------------------------
        print("\nTC-CHAR-10: Cambiar estado sin ser GM...")
        try:
            resp = await client.put(
                f"{BASE_URL}/characters/{char1_id}/status",
                json={"is_alive": True},
                headers=player_headers
            )
            if resp.status_code == 403:
                print("  [OK] PASSED (403 Forbidden as expected)")
                results["TC-CHAR-10"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-10"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-10"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-11: Historial de cambios del personaje
        # -------------------------------------------------------------
        print("\nTC-CHAR-11: Historial de cambios del personaje...")
        try:
            resp = await client.get(f"{BASE_URL}/characters/{char1_id}/history", headers=player_headers)
            if resp.status_code == 200 and isinstance(resp.json().get("history"), list):
                print(f"  [OK] PASSED (200 OK, Historial obtenido: {len(resp.json().get('history'))} eventos)")
                results["TC-CHAR-11"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-11"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-11"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-13: Codigo de invitacion invalido
        # -------------------------------------------------------------
        print("\nTC-CHAR-13: Codigo de invitacion invalido...")
        try:
            resp = await client.post(
                f"{BASE_URL}/characters/{char2_id}/join-campaign-by-code",
                json={"invite_code": "INVALID_CODE"},
                headers=player_headers
            )
            if resp.status_code == 404:
                print("  [OK] PASSED (404 Not Found as expected)")
                results["TC-CHAR-13"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-13"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-13"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-14: Personaje ya asignado a campana
        # -------------------------------------------------------------
        print("\nTC-CHAR-14: Personaje ya asignado a campana...")
        try:
            resp = await client.post(
                f"{BASE_URL}/characters/{char1_id}/join-campaign-by-code",
                json={"invite_code": invite_code},
                headers=player_headers
            )
            if resp.status_code == 400:
                print("  [OK] PASSED (400 Bad Request as expected)")
                results["TC-CHAR-14"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-14"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-14"] = "FAILED"

        # -------------------------------------------------------------
        # TC-CHAR-15: Personaje no encontrado
        # -------------------------------------------------------------
        print("\nTC-CHAR-15: Personaje no encontrado...")
        try:
            fake_id = str(uuid.uuid4())
            resp = await client.get(f"{BASE_URL}/characters/{fake_id}", headers=player_headers)
            if resp.status_code == 404:
                print("  [OK] PASSED (404 Not Found as expected)")
                results["TC-CHAR-15"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-CHAR-15"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-CHAR-15"] = "FAILED"

        # -------------------------------------------------------------
        # RESUMEN
        # -------------------------------------------------------------
        print("\n=============================================")
        print(" RESUMEN DE RESULTADOS: MODULO DE PERSONAJES")
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
    asyncio.run(test_characters_module())

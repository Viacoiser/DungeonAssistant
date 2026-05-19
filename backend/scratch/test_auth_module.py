import asyncio
import httpx
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

async def test_auth_module():
    async with httpx.AsyncClient() as client:
        print("\n=============================================")
        print(" EJECUTANDO PLAN DE PRUEBAS: MODULO DE AUTH")
        print("=============================================\n")

        # Generar credenciales dinamicas para evitar conflictos de ejecuciones previas
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "SecurePassword123!"
        test_username = f"user_{uuid.uuid4().hex[:8]}"

        results = {}

        # -------------------------------------------------------------
        # TC-AUTH-01: Registro de usuario nuevo
        # -------------------------------------------------------------
        print("TC-AUTH-01: Registro de usuario nuevo...")
        try:
            resp = await client.post(
                f"{BASE_URL}/auth/register",
                json={
                    "email": test_email,
                    "password": test_password,
                    "username": test_username
                },
                timeout=10
            )
            if resp.status_code == 201:
                print("  [OK] PASSED (201 Created)")
                results["TC-AUTH-01"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-AUTH-01"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-AUTH-01"] = "FAILED"

        # -------------------------------------------------------------
        # TC-AUTH-02: Registro con email duplicado
        # -------------------------------------------------------------
        print("\nTC-AUTH-02: Registro con email duplicado...")
        try:
            resp = await client.post(
                f"{BASE_URL}/auth/register",
                json={
                    "email": test_email,
                    "password": test_password,
                    "username": f"{test_username}_dup"
                },
                timeout=10
            )
            # Debe retornar 409 Conflict o 400 Bad Request
            if resp.status_code == 409 or resp.status_code == 400:
                print(f"  [OK] PASSED (Status: {resp.status_code} - Conflict/Bad Request as expected)")
                results["TC-AUTH-02"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-AUTH-02"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-AUTH-02"] = "FAILED"

        # -------------------------------------------------------------
        # TC-AUTH-03: Registro con datos invalidos
        # -------------------------------------------------------------
        print("\nTC-AUTH-03: Registro con datos invalidos...")
        try:
            resp = await client.post(
                f"{BASE_URL}/auth/register",
                json={
                    "email": "invalid-email",
                    "password": "",
                    "username": ""
                },
                timeout=10
            )
            if resp.status_code in [400, 422]:
                print(f"  [OK] PASSED (Status: {resp.status_code} as expected)")
                results["TC-AUTH-03"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-AUTH-03"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-AUTH-03"] = "FAILED"

        # -------------------------------------------------------------
        # TC-AUTH-04: Login correcto
        # -------------------------------------------------------------
        print("\nTC-AUTH-04: Login correcto...")
        token = None
        try:
            resp = await client.post(
                f"{BASE_URL}/auth/login",
                json={
                    "email": test_email,
                    "password": test_password
                },
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                token = data.get("access_token")
                if token:
                    print("  [OK] PASSED (200 OK, token recibido)")
                    results["TC-AUTH-04"] = "PASSED"
                else:
                    print("  [FAIL] FAILED (200 OK but no token found in response)")
                    results["TC-AUTH-04"] = "FAILED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-AUTH-04"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-AUTH-04"] = "FAILED"

        # -------------------------------------------------------------
        # TC-AUTH-05: Login con credenciales incorrectas
        # -------------------------------------------------------------
        print("\nTC-AUTH-05: Login con credenciales incorrectas...")
        try:
            resp = await client.post(
                f"{BASE_URL}/auth/login",
                json={
                    "email": test_email,
                    "password": "WrongPassword!"
                },
                timeout=10
            )
            if resp.status_code == 401:
                print("  [OK] PASSED (401 Unauthorized as expected)")
                results["TC-AUTH-05"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-AUTH-05"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-AUTH-05"] = "FAILED"

        # -------------------------------------------------------------
        # TC-AUTH-06: Obtener perfil autenticado (con token valido)
        # -------------------------------------------------------------
        print("\nTC-AUTH-06: Obtener perfil autenticado...")
        if not token:
            print("  [SKIP] Skipped: No token from TC-AUTH-04")
            results["TC-AUTH-06"] = "SKIPPED"
        else:
            try:
                resp = await client.get(
                    f"{BASE_URL}/auth/me",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("email") == test_email:
                        print("  [OK] PASSED (200 OK, datos correctos)")
                        results["TC-AUTH-06"] = "PASSED"
                    else:
                        print(f"  [FAIL] FAILED (Data mismatch: {data})")
                        results["TC-AUTH-06"] = "FAILED"
                else:
                    print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                    results["TC-AUTH-06"] = "FAILED"
            except Exception as e:
                print(f"  [FAIL] FAILED with exception: {e}")
                results["TC-AUTH-06"] = "FAILED"

        # -------------------------------------------------------------
        # TC-AUTH-07: Acceder a ruta protegida sin token
        # -------------------------------------------------------------
        print("\nTC-AUTH-07: Acceder a ruta protegida sin token...")
        try:
            resp = await client.get(
                f"{BASE_URL}/auth/me",
                timeout=10
            )
            if resp.status_code == 401:
                print("  [OK] PASSED (401 Unauthorized as expected)")
                results["TC-AUTH-07"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-AUTH-07"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-AUTH-07"] = "FAILED"

        # -------------------------------------------------------------
        # TC-AUTH-08: Acceder con token invalido/expirado
        # -------------------------------------------------------------
        print("\nTC-AUTH-08: Acceder con token invalido...")
        try:
            resp = await client.get(
                f"{BASE_URL}/auth/me",
                headers={"Authorization": "Bearer invalid_token_123"},
                timeout=10
            )
            if resp.status_code == 401:
                print("  [OK] PASSED (401 Unauthorized as expected)")
                results["TC-AUTH-08"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-AUTH-08"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-AUTH-08"] = "FAILED"

        # -------------------------------------------------------------
        # TC-AUTH-09: Logout
        # -------------------------------------------------------------
        print("\nTC-AUTH-09: Logout...")
        try:
            resp = await client.post(
                f"{BASE_URL}/auth/logout",
                headers={"Authorization": f"Bearer {token}"} if token else None,
                timeout=10
            )
            if resp.status_code == 200:
                print("  [OK] PASSED (200 OK)")
                results["TC-AUTH-09"] = "PASSED"
            else:
                print(f"  [FAIL] FAILED (Status: {resp.status_code}, Resp: {resp.text})")
                results["TC-AUTH-09"] = "FAILED"
        except Exception as e:
            print(f"  [FAIL] FAILED with exception: {e}")
            results["TC-AUTH-09"] = "FAILED"

        # -------------------------------------------------------------
        # RESUMEN
        # -------------------------------------------------------------
        print("\n=============================================")
        print(" RESUMEN DE RESULTADOS: MODULO DE AUTH")
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
    asyncio.run(test_auth_module())

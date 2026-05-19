import subprocess
import sys
import time

tests = [
    ("Módulo de Autenticación", "test_auth_module.py"),
    ("Módulo de Personajes", "test_characters_module.py"),
    ("Módulo de Campañas", "test_campaigns_module.py"),
    ("Módulo de Sesiones y Notas", "test_sessions_module.py"),
    ("Módulo de NPCs", "test_npcs_module.py"),
    ("Módulo de Asistente IA (Bug Fix)", "test_assistant_module.py"),
]

def run_tests():
    print("=" * 60)
    print(" EJECUCIÓN MAESTRA DEL PLAN DE PRUEBAS - DUNGEON ASSISTANT")
    print("=" * 60)
    
    total_passed = 0
    total_failed = 0
    failed_suites = []

    for name, script in tests:
        print(f"\n[Ejecutando] {name} ({script})...")
        start_time = time.time()
        
        result = subprocess.run(
            [sys.executable, f"scratch/{script}"], 
            capture_output=True, 
            text=True
        )
        
        elapsed = time.time() - start_time
        
        if result.returncode == 0:
            print(f"[OK] {name} PASSED en {elapsed:.1f}s")
            total_passed += 1
        else:
            print(f"[FAIL] {name} FAILED en {elapsed:.1f}s")
            print("--- Output de Error ---")
            print(result.stdout)
            print(result.stderr)
            print("-----------------------")
            total_failed += 1
            failed_suites.append(name)
            
    print("\n" + "=" * 60)
    print(" RESUMEN FINAL DEL SISTEMA")
    print("=" * 60)
    print(f"Módulos Exitosos: {total_passed}/{len(tests)}")
    print(f"Módulos Fallidos: {total_failed}/{len(tests)}")
    
    if total_failed == 0:
        print("\n[SUCCESS] ¡TODO EL BACKEND HA SIDO VALIDADO EXITOSAMENTE PARA PRODUCCIÓN!")
        sys.exit(0)
    else:
        print("\n[WARNING] ALGUNOS MÓDULOS FALLARON. Revisa los logs de error.")
        for failed in failed_suites:
            print(f" - {failed}")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()

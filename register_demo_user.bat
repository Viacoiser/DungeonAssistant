@echo off
echo.
echo ========================================
echo REGISTRANDO USUARIO DEMO
echo ========================================
echo.

echo 1. Registrando usuario demo@example.com...
curl -s -X POST http://localhost:8000/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@example.com\",\"password\":\"DemoPassword123!\",\"username\":\"DemoUser\"}"

echo.
echo.
echo 2. Intentando login con credenciales de prueba...
curl -s -X POST http://localhost:8000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@example.com\",\"password\":\"DemoPassword123!\"}"

echo.
echo ========================================

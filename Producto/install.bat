# Script de instalación para Windows

@echo off
echo 🐉 Instalando DungeonAssistant...
echo.

echo 📦 Configurando Backend...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env

echo.
echo ⚠️  Por favor, edita backend\.env con tus credenciales de Supabase y Gemini
echo.

echo 📦 Configurando Frontend...
cd ..\frontend
call npm install
copy .env.example .env

echo.
echo ⚠️  Por favor, edita frontend\.env con tus URLs
echo.

echo ✅ Instalación completada
echo.
echo 🚀 Para iniciar:
echo    Backend:  cd backend && venv\Scripts\activate && python -m uvicorn main:socket_app --reload
echo    Frontend: cd frontend && npm run dev
pause

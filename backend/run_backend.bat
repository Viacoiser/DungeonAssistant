@echo off
REM Script para iniciar Backend - DungeonAssistant
REM Windows PowerShell / CMD

echo.
echo ========================================
echo  DungeonAssistant - Backend Setup
echo ========================================
echo.

REM Cambiar a directorio backend
cd /d "%~dp0"
if not exist "requirements.txt" (
    echo Error: Este script debe ejecutarse desde la carpeta backend
    pause
    exit /b 1
)

REM Usar Python directamente sin venv (deps ya instaladas globalmente)
REM Iniciar FastAPI con Uvicorn
echo.
echo ========================================
echo Starting FastAPI server...
echo ========================================
echo.
echo Server will be available at: http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
py.exe -m uvicorn main:app --reload --port 8000

pause

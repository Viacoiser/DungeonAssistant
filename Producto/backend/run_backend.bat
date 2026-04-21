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

REM Crear venv si no existe
if not exist "venv" (
    echo Creating virtual environment...
    py -3 -m venv venv
)

REM Activar venv
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist "venv\bin\activate" (
    echo Warning: POSIX venv detected. You should delete 'venv' and run this again for native Windows support.
)

REM Instalar dependencias
echo.
echo Installing dependencies...
pip install -r requirements.txt

REM Iniciar FastAPI con Uvicorn
echo.
echo ========================================
echo Starting FastAPI server...
echo ========================================
echo.
echo Server will be available at: http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
python -m uvicorn main:app --reload --port 8000

pause

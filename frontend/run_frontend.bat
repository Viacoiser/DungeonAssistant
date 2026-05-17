@echo off
REM Script para iniciar Frontend - DungeonAssistant
REM Windows PowerShell / CMD

echo.
echo ========================================
echo  DungeonAssistant - Frontend Setup
echo ========================================
echo.

REM Cambiar a directorio frontend
cd /d "%~dp0"
if not exist "package.json" (
    echo Error: Este script debe ejecutarse desde la carpeta frontend
    pause
    exit /b 1
)

REM Instalar dependencias si no existen node_modules
if not exist "node_modules" (
    echo.
    echo Installing npm dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
)

REM Iniciar dev server
echo.
echo ========================================
echo Starting Vite dev server...
echo ========================================
echo.
echo Frontend will be available at: http://localhost:5173
echo.
call npm run dev

pause

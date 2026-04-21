#!/bin/bash

# Script para instalar y configurar DungeonAssistant

echo "🐉 Instalando DungeonAssistant..."

# Backend
echo "📦 Configurando Backend..."
cd backend
python -m venv venv

# Activar venv según SO
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

pip install -r requirements.txt
cp .env.example .env

echo "⚠️  Por favor, edita backend/.env con tus credenciales de Supabase y Gemini"

# Frontend
echo "📦 Configurando Frontend..."
cd ../frontend
npm install
cp .env.example .env

echo "⚠️  Por favor, edita frontend/.env con tus URLs"

echo ""
echo "✅ Instalación completada"
echo ""
echo "🚀 Para iniciar:  "
echo "   Backend:  cd backend && source venv/bin/activate && python -m uvicorn main:socket_app --reload"
echo "   Frontend: cd frontend && npm run dev"

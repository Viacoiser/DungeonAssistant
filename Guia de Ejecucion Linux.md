# Guía de Ejecución - Dungeon Assistant

Para poner en marcha el proyecto, sigue estos pasos en terminales separadas.

## 1. Backend (FastAPI)

Navega a la carpeta `backend` e inicia el servidor:

```bash
cd backend
# Activar entorno virtual (Linux)
source venv/bin/activate
# Iniciar servidor
python3 -m uvicorn main:app --reload --port 8000
```

*Nota: Asegúrate de tener configurado tu archivo `.env` con la `GEMINI_API_KEY`.*

## 2. Frontend (React + Vite)

Navega a la carpeta `frontend` e inicia el servidor de desarrollo:

```bash
cd frontend
# Instalar dependencias (solo la primera vez)
npm install
# Iniciar servidor
npm run dev
```

---

## Resumen de URLs
*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend (API Docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)

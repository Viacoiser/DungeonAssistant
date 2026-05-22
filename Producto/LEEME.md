# Archivos Corregidos para Vercel

## Problema
El frontend en Vercel intentaba conectarse a `http://localhost:8000` (tu PC),
lo cual falla para cualquier usuario en internet.

## Solución aplicada: experimentalServices

Vercel levanta frontend y backend juntos en la misma URL.
El backend queda accesible en `/_/backend`.

## Archivos modificados

### 1. `vercel.json` (raíz del proyecto)
- Reemplazado por configuración con `experimentalServices`
- El frontend corre en `/`
- El backend corre en `/_/backend`

### 2. `frontend/src/services/api.js`
- En producción (Vercel) usa `/_/backend` como base URL
- En desarrollo local sigue usando `http://localhost:8000`
- También corregida la ruta de dnd5eAPI que tenía `/api/dnd5e/...` duplicado

### 3. `frontend/src/services/socket.js`
- En producción (Vercel) usa `/_/backend` para el socket
- En desarrollo local sigue usando `http://localhost:8000`

### 4. `backend/main.py`
- CORS ahora incluye automáticamente el dominio de Vercel
  usando la variable de entorno `VERCEL_URL` que Vercel inyecta

### 5. `frontend/.env.local`
- Solo afecta desarrollo local, no producción

## Pasos para desplegar

1. Copia estos archivos a tu repositorio (reemplaza los existentes)
2. Haz commit y push a GitHub
3. Vercel redesplegará automáticamente
4. En Vercel > Settings > Environment Variables agrega las variables
   del archivo `backend/.env` (DATABASE_URL, SECRET_KEY, etc.)

## Estructura esperada del repo
```
Producto/
├── vercel.json          ← NUEVO
├── frontend/            ← tu proyecto Vite
│   └── src/services/
│       ├── api.js       ← CORREGIDO
│       └── socket.js    ← CORREGIDO
└── backend/             ← tu FastAPI
    └── main.py          ← CORREGIDO
```

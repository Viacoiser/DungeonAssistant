# 🚀 Deployment en Vercel - Guía Rápida

## Estructura Monorepo

```
DungeonAssistant/
├── frontend/          (React + Vite)
├── backend/           (FastAPI + Socket.io)
├── vercel.json        (Config principal)
└── .vercelignore      (Files to ignore)
```

## Archivos de Configuración Creados

### 1. **vercel.json (raíz)**
```json
{
  "experimentalServices": {
    "frontend": { "entrypoint": "frontend", "routePrefix": "/" },
    "backend": { "entrypoint": "backend", "routePrefix": "/_/backend" }
  }
}
```

### 2. **backend/vercel.json**
- Define cómo construir y ejecutar el backend Python
- USA `@vercel/python` builder

### 3. **backend/api/index.py**
- Entry point para Vercel Serverless Functions
- Importa y expone el app de FastAPI

### 4. **backend/wsgi.py**
- Alternativa WSGI para Vercel
- Para si Serverless no funciona

### 5. **backend/build.sh**
- Script de build para instalar dependencias

### 6. **backend/Procfile**
- Configuración para Vercel (uvicorn startup)

## ⚙️ Configuración en Vercel Dashboard

1. **Conectar Git Repository**
2. **Project Settings → Root Directory**: Déjalo vacío (es monorepo)
3. **Environment Variables**:
   ```
   SUPABASE_URL=https://...
   SUPABASE_KEY=...
   GEMINI_API_KEY=...
   ALLOWED_ORIGINS=https://tu-frontend.vercel.app,https://dungeon-assistant.vercel.app
   ```

## 🔗 URLs en Producción

- **Frontend**: `https://tu-proyecto.vercel.app/`
- **Backend**: `https://tu-proyecto.vercel.app/_/backend/`
- **Socket.io**: `https://tu-proyecto.vercel.app/_/backend/socket.io`

## 📝 Frontend Actualizado

El frontend automáticamente detecta:
- 🔧 **Desarrollo**: `http://localhost:8000`
- 🚀 **Producción**: `/_/backend` (ruta relativa)
- 🔑 **Custom**: `VITE_API_BASE_URL` env var

## ✅ Checklist Pre-Deploy

- [ ] Git repository configurado
- [ ] `.gitignore` excluye `node_modules` y `__pycache__`
- [ ] `requirements.txt` está actualizado
- [ ] Variables de entorno en Vercel Dashboard
- [ ] CORS configurado correctamente en backend
- [ ] Socket.io CORS permite tu dominio

## 🐛 Troubleshooting

### Error: "Failed to load resource: net::ERR_CONNECTION_REFUSED"
→ Backend no está corriendo. Verifica Vercel Logs

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
→ Actualiza `ALLOWED_ORIGINS` en backend `.env`

### Socket.io no conecta
→ Verifica que `/_/backend` sea la ruta correcta en logs

## 📊 Monitoreo

1. Vercel Dashboard → Settings → Analytics
2. Ver logs en tiempo real
3. Configurar alertas

---

**¡Listo! El monorepo está configurado para Vercel.**

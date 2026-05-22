# 🚀 Deployment Guide - Railway

**Objetivo:** Desplegar DungeonAssistant en Railway (PWA + Backend + Database)

**Plataforma:** Railway.app  
**Tiempo estimado:** 1-2 horas (incluye config)

---

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Pre-requisitos](#pre-requisitos)
3. [Setup Railway](#setup-railway)
4. [Configurar Variables](#configurar-variables)
5. [Deploy Automático](#deploy-automático)
6. [Domain & SSL](#domain--ssl)
7. [Monitoreo](#monitoreo)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────┐
│         GitHub Repository                │
│  (Push a main branch trigger deploy)     │
└──────────────────────┬───────────────────┘
                       ↓
┌──────────────────────────────────────────┐
│      Railway Dashboard                   │
│  ├─ Project "DungeonAssistant"          │
│  ├─ Service "Backend" (Python FastAPI)  │
│  ├─ Service "Frontend" (React + Vite)   │
│  └─ Postgres (Supabase integrado)       │
└──────────────────────┬───────────────────┘
                       ↓
┌──────────────────────────────────────────┐
│      Deployment Output                   │
│  ├─ Backend: https://xxx.railway.app    │
│  ├─ Frontend: https://yyy.railway.app   │
│  └─ Custom Domain: dungeonassistant.app │
└──────────────────────────────────────────┘
```

---

## ✅ Pre-requisitos

- [ ] Cuenta en Railway.app (crear en railway.app)
- [ ] GitHub account con acceso al repo
- [ ] Variables de ambiente preparadas
- [ ] API keys validas (Google Cloud, Supabase)
- [ ] Dockerfile y package.json actualizados

---

## 🔧 Setup Railway

### Step 1: Crear Proyecto en Railway

```bash
# Opción A: Desde CLI (rápido)
npm install -g @railway/cli
railway login

# Te abre navegador. Haz login con GitHub


# Opción B: Desde Dashboard
# 1. Ir a railway.app
# 2. Click "+ New Project"
# 3. "Deploy from GitHub repo"
# 4. Conectar tu GitHub (autorizar)
# 5. Seleccionar "TestDungeonAssistant-Enci"
```

### Step 2: Crear Servicios

#### Backend Service (Python FastAPI)

```bash
railway service add
# O en dashboard:
# → New Service → Docker
```

**Railway.toml:**

Crea archivo: `railway.toml`

```toml
[service]
name = "backend"
startCommand = "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
healthCheckPath = "/health"  # Backend debe tener este endpoint
healthCheckDuration = 30s

# Environment variables
[service.variables]
ENV = "production"
LOG_LEVEL = "INFO"
CORS_ORIGINS = "https://frontend-xxx.railway.app,https://dungeonassistant.app"
```

**Dockerfile para Backend:**

Crea: `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Agregar health endpoint:**

En `backend/main.py`:

```python
@app.get("/health")
async def health_check():
    """Health check endpoint para Railway"""
    return {
        "status": "healthy",
        "service": "dungeonassistant-backend",
        "version": "3.0"
    }
```

#### Frontend Service (Node.js + Vite)

Crea: `frontend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY frontend/ .

# Build
RUN npm run build

# Serve with simple HTTP server
RUN npm install -g serve

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## 🔑 Configurar Variables de Ambiente

### Backend Variables

En Railway Dashboard → Backend Service → Variables:

```bash
# App config
NODE_ENV=production
LOG_LEVEL=INFO

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx-secret-key-xxx

# Google APIs
GOOGLE_API_KEY=xxx-gemini-key-xxx
GOOGLE_VISION_KEY=xxx-vision-key-xxx
GOOGLE_SPEECH_KEY=xxx-speech-key-xxx

# CORS
CORS_ORIGINS=https://frontend-xxx.railway.app,https://dungeonassistant.app

# Redis (si usas sessions)
REDIS_URL=redis://xxx:password@xxx.railway.app:6379
```

### Frontend Variables

En Railway Dashboard → Frontend Service → Variables:

```bash
# API endpoint
VITE_API_URL=https://backend-xxx.railway.app

# Supabase (public keys)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_KEY=xxx-public-key-xxx

# Google APIs (public)
VITE_GOOGLE_API_KEY=xxx-gemini-key-xxx

# App config
VITE_ENV=production
```

---

## 🚀 Deploy Automático

### Setup GitHub Actions (Opcional pero recomendado)

Crea: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest tests/ -v
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        run: |
          npx @railway/cli deploy -e main
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

#### Agregar Railway Token a GitHub Secrets

```bash
# En Railway dashboard:
1. Account → API Tokens
2. Create new token
3. Copy token completo

# En GitHub:
1. Settings → Secrets and variables → Actions
2. New repository secret: RAILWAY_TOKEN
3. Pegar token
```

### Deploy Manual desde CLI

```bash
railway link  # Conectar a proyecto Railway

railway up   # Deploy

railway logs # Ver logs en tiempo real
```

---

## 🌐 Domain & SSL

### Conectar Custom Domain

```bash
# En Railway Dashboard → Backend service → Settings → Domains

# Agregar custom domain:
1. Click "Add Custom Domain"
2. Ingresa: api.dungeonassistant.app
3. Se te da nombre DNS (CNAME)

# En tu DNS provider (GoDaddy, Namecheap, etc):
1. DNS Settings
2. Agregar CNAME:
   Name: api
   Value: xxx.railway.app
3. Esperar 5-10 min para propagación
```

#### SSL Automático

Railway incluye SSL automático (Let's Encrypt) ✅

```bash
# Verificar:
https://api.dungeonassistant.app
# Debería funcionar sin errores de certificado
```

---

## 📊 Monitoreo

### Logs en Tiempo Real

```bash
railway logs --tail

# O desde dashboard:
# Service → Logs tab
```

### Métricas

En Railway Dashboard → Deployments:
- CPU usage
- Memory usage
- Network I/O
- Response times

### Alertas (Opcional)

```bash
# Settings → Alerts
# Set up webhook cuando:
# - CPU > 80%
# - Memory > 90%
# - Service down
```

---

## 🔄 CI/CD Pipeline

### Estructura Recomendada

```
GitHub Push → Tests (GitHub Actions)
   ↓ (si pasan)
Deploy a Railway Dev
   ↓ (si funciona)
Notificación
   ↓ (aprobar)
Deploy a Railway Prod
```

### Railway.json (Alternativo a railway.toml)

```json
{
  "services": [
    {
      "name": "backend",
      "source": "backend",
      "runtime": "python:3.11",
      "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
      "enviromente": {
        "PYTHONUNBUFFERED": "1"
      }
    },
    {
      "name": "frontend",
      "source": "frontend",
      "runtime": "node:18",
      "buildCommand": "npm install && npm run build",
      "startCommand": "serve -s dist -l 3000"
    }
  ]
}
```

---

## 📦 PWA Configuration

### Asegurar PWA funciona en Prod

En `frontend/public/manifest.json`:

```json
{
  "name": "DungeonAssistant",
  "short_name": "DA",
  "description": "AI-powered D&D 5e Assistant",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/screenshot1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

En `frontend/index.html`:

```html
<head>
  <meta name="theme-color" content="#000000">
  <meta name="description" content="AI-powered D&D 5e Assistant">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
</head>
```

---

## 🐛 Troubleshooting

### Build Fails: "requirements.txt not found"

```bash
# Solución: Railway no encuentra backend/
# Editar railway.toml:

[service]
workingDirectory = "./backend"  # ← Agregar esto
```

### Frontend no carga en mobile

```bash
# Verificar CORS en backend .env:
CORS_ORIGINS=https://*.railway.app,https://dungeonassistant.app

# Reiniciar service
```

### Database connection timeout

```bash
# Verificar SUPABASE_URL en variables
# Debe tener formato: https://xxx.supabase.co

# Si sigue fallando, usar Railway Postgres:
railway service add  → Postgres
# Usa DATABASE_URL en lugar de SUPABASE_*
```

### Service keeps crashing

```bash
# Ver logs:
railway logs

# Verificar health check:
curl https://backend-xxx.railway.app/health

# Si es Python: pip install -r requirements.txt en prod?
# Verificar Dockerfile instala deps
```

---

## 📋 Checklist Final

- [ ] Railway account creado
- [ ] GitHub conectado a Railway
- [ ] Backend service creado con Dockerfile
- [ ] Frontend service creado con Dockerfile
- [ ] Variables de environment setadas
- [ ] First deploy exitoso
- [ ] Logs sin errores
- [ ] Frontend accesible desde mobile
- [ ] Chat/API funcionando
- [ ] Custom domain apuntando correctamente
- [ ] SSL certificate activo
- [ ] Tests en GitHub Actions pasando

---

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/guides/railway-cli)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PWA Manifest](https://web.dev/add-manifest/)

---

**Estado:** ✅ LISTO PARA DEPLOY  
**Contacto:** [Tu nombre]  
**Última actualización:** 2026-04-17

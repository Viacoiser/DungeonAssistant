# 📚 Quick Reference - DungeonAssistant

## 🗂️ Proyecto Creado

### Backend (`/backend`)
```
✅ main.py              - FastAPI app + Socket.io
✅ requirements.txt     - Dependencias Python
✅ .env.example         - Variables entorno
✅ pyproject.toml       - Linting config
✅ /routers
   ├── auth.py         - POST register, login, logout
   ├── campaigns.py    - Campañas CRUD + membresía
   ├── player.py       - Personajes + inventario
   ├── sessions.py     - Sesiones + notas
   ├── vision.py       - OCR de hojas
   ├── gamemaster.py   - Panel GM
   ├── realtime.py     - Socket.io events
   └── assistant.py    - Chat asistente
✅ /services
   ├── supabase.py     - Cliente Supabase
   ├── gemini.py       - Servicio IA (GeneraNPCs, OCR, Chat)
   └── dnd5e.py        - Validación D&D5e
✅ /models
   └── schemas.py      - 35+ Pydantic models
```

### Frontend (`/frontend`)
```
✅ package.json        - Dependencias Node
✅ vite.config.js      - Bundler + PWA plugin
✅ tailwind.config.js  - Estilos (mobile-first)
✅ postcss.config.js   - Processing CSS
✅ index.html          - Template HTML
✅ .env.example        - Variables entorno
✅ .eslintrc.json      - Reglas linting
✅ .prettierrc          - Formateador código
✅ /src
   ├── App.jsx         - Componente raíz
   ├── main.jsx        - Entry point + PWA
   ├── index.css       - Tailwind + custom
   ├── routes.jsx      - Router React
   ├── /pages
   │  ├── Login.jsx    - Página login
   │  ├── Register.jsx - Página registro
   │  └── Dashboard.jsx- Listado campañas
   ├── /components
   │  ├── /mobile
   │  │  └── BottomNav.jsx - Nav inferior (mobile)
   │  └── /desktop
   │     └── Sidebar.jsx   - Sidebar (desktop)
   ├── /store (Zustand)
   │  ├── useAuthStore.js       - Usuario + token
   │  ├── useCampaignStore.js   - Campaña activa
   │  ├── useCharacterStore.js  - Personaje activo
   │  └── useSocketStore.js     - Socket.io connection
   └── /services
      ├── api.js       - Axios con auth header
      ├── socket.js    - Socket.io client
      └── speech.js    - Web Speech API wrapper
✅ /public
   └── (assets - vacío, listo)
```

### Documentación
```
✅ README.md              - Overview proyecto
✅ SETUP.md               - Guía instalación rápida
✅ ARCHITECTURE.md        - Diagramas y flujos
✅ IMPLEMENTATION_PLAN.md - Roadmap completo (12 fases)
✅ API_REFERENCE.md       - Todos endpoints + Socket.io events
✅ PROJECT_STATUS.md      - Estado actual (este es el resumen)
✅ QUICK_REFERENCE.md     - Este archivo
```

### Configuración
```
✅ install.sh           - Script instalación Unix
✅ install.bat          - Script instalación Windows
✅ .gitignore           - Exclusiones git
✅ DungeonAssistant_BuildPrompt_v2.md - Spec original
```

---

## 🎯 Estados Actual

| Componente | Estado | Detalles |
|-----------|--------|---------|
| Backend Setup | ✅ 100% | FastAPI + Socket.io funcionando |
| Frontend Setup | ✅ 100% | React + Vite + Tailwind listo |
| Estructura BD | ✅ 100% | 10 tablas diseñadas (SQL pendiente) |
| Pydantic Schemas | ✅ 100% | 35+ modelos validación |
| Servicios | ✅ 50% | Stubs en lugar, lógica sin implementar |
| Páginas | ✅ 20% | Base + Login/Register/Dashboard vacíos |
| Componentes | ✅ 10% | Sidebar + BottomNav base |
| Autenticación | ⏸️ 0% | Pendiente Fase 2 |
| Campañas | ⏸️ 0% | Pendiente Fase 3 |

---

## 🔢 Métricas

| Métrica | Cantidad |
|---------|----------|
| Archivos Creados | 50+ |
| Routers Definidos | 8 |
| Pydantic Models | 35+ |
| Zustand Stores | 4 |
| Páginas Skeleton | 3 |
| Componentes Skeleton | 2 |
| Documentos | 7 |
| Dependencias Backend | 15+ |
| Dependencias Frontend | 18+ |

---

## 🚀 Comandos Útiles

### Backend
```bash
# Iniciar servidor con reloader
python -m uvicorn main:socket_app --reload

# Ver documentación interactiva
# Abre http://localhost:8000/docs

# Verificar health
curl http://localhost:8000/health
```

### Frontend
```bash
# Dev server con HMR
npm run dev

# Build para producción
npm run build

# Preview build local
npm run preview

# Lint código
npm run lint
```

### Setup
```bash
# Windows
install.bat

# macOS/Linux
chmod +x install.sh
./install.sh
```

---

## 📋 Checklist Pre-Implementación

- [ ] Supabase proyecto creado
- [ ] Supabase Auth habilitado
- [ ] Google Gemini API key generada
- [ ] `backend/.env` completado
- [ ] `frontend/.env` completado
- [ ] `backend/venv` activado
- [ ] Backend: `npm install` corrió
- [ ] Backend: `pip install -r requirements.txt` OK
- [ ] Backend levanta sin errores
- [ ] Frontend: `npm install` corrió
- [ ] Frontend levanta en http://localhost:5173
- [ ] Socket.io conecta sin errors

---

## 🔄 Flujo de Desarrollo Fase 2

### Backend
1. Conectar Supabase en `services/supabase.py`
2. Implementar `routers/auth.py` endpoints
3. Agregar middleware JWT en `main.py`
4. Crear tabla users en Supabase

### Frontend
1. Conectar formulario Login a API
2. Conectar formulario Register a API
3. Token storage en localStorage
4. Auth middleware en rutas
5. useEffect para recuperar usuario al recargar

### Testing
1. Registrar usuario en UI
2. Login con credenciales
3. Token guardado en localStorage
4. Página protegida requiere login
5. Logout limpia token

---

## 💡 Tips de Desarrollo

### Agregar nuevo endpoint
1. Crea función en `routers/{router}.py`
2. Agrega ruta con decorador `@router.post/get(...)`
3. Importar en `main.py` (ya está hecho)
4. Automáticamente aparece en `/docs`

### Agregar nuevo componente
1. Crea en `src/components/{componente}.jsx`
2. Importa en página que lo necesita
3. Si necesita estado, usa Zustand store
4. Si necesita datos, usa `api.js` service

### Agregar new store
1. Copia patrón de `useAuthStore.js`
2. Define state inicial
3. Crea funciones de actualización
4. Usa en componentes con `const store = useMyStore()`

### Sincronización Socket.io
1. Handler en `main.py`:
   ```python
   @sio.event
   async def my_event(sid, data):
       # Handle event
   ```
2. Emit desde frontend:
   ```javascript
   socket.emit('my_event', { data })
   ```
3. Escuchar respuesta:
   ```javascript
   socket.on('my_event_response', (data) => {...})
   ```

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|---------|
| `ModuleNotFoundError` en backend | Activar `venv` y `pip install -r requirements.txt` |
| `npm ERR!` en frontend | Eliminar `node_modules`, `npm cache clean --force`, reinstalar |
| CORS errors | Revisar `main.py` CORSMiddleware |
| Socket.io no conecta | Verificar URL en `frontend/.env` apunta a backend |
| Supabase connection fail | Revisar `.env` con credenciales correctas |
| Gemini errors | Verificar API key válida y quota disponible |

---

## 📞 Contacto / Soporte

**Spec Original**: [DungeonAssistant_BuildPrompt_v2.md](./DungeonAssistant_BuildPrompt_v2.md)  
**Documentación Completa**: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)  
**Referencia API**: [API_REFERENCE.md](./API_REFERENCE.md)  
**Arquitectura**: [ARCHITECTURE.md](./ARCHITECTURE.md)  

---

**Última Update**: 2026-03-19  
**Fase**: 1 - Setup Base ✅  
**Próxima Fase**: 2 - Autenticación (ETA: 3-5 días)  
**Estado**: Ready for Development 🚀

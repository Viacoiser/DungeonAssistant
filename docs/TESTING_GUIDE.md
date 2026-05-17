# 🧪 Guía de Testing - Fase 2 Autenticación

## 📋 Requisitos Previos

1. ✅ Proyecto DungeonAssistant creado (Fase 1 completada)
2. ✅ Node.js 18+ instalado
3. ✅ Python 3.11+ instalado
4. ✅ Cuenta en Supabase (https://supabase.com)
5. ✅ Git (opcional pero recomendado)

---

## 🔧 Configuración Inicial

### 1. Obtener Credenciales de Supabase

1. Vaya a https://app.supabase.com
2. Cree un nuevo proyecto o use uno existente
3. En la página del proyecto:
   - Copie el **Project URL** → `SUPABASE_URL`
   - Vaya a **Settings > API > Key** → copie **Service Role Key** → `SUPABASE_SERVICE_KEY`
   - Copie **Anon/Public Key** → `SUPABASE_ANON_KEY`

### 2. Configurar Variables de Entorno

#### Backend (`backend/.env`)
```bash
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Frontend (`frontend/.env.local`)
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

### 3. Ejecutar Schema SQL en Supabase

1. En el proyecto de Supabase, vaya a **SQL Editor**
2. Haga clic en **New Query**
3. Copie el contenido completo de `backend/schema.sql`
4. Pegue en el editor
5. Haga clic en **Run**
6. ✅ Debería ver "Success" - Se crearon las 10 tablas

**Lo que se creó:**
- Tablas: users, campaigns, campaign_members, characters, inventories, sessions, session_notes, npcs, factions, role_change_requests
- Índices para performance
- Row Level Security (RLS) policies
- Triggers automáticos para updated_at

---

## 🚀 Iniciar la Aplicación

### Terminal 1: Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Output esperado:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Terminal 2: Frontend
```bash
cd frontend
npm install  # Si no lo hizo en Fase 1
npm run dev
```

**Output esperado:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## 🧪 Test Cases - Flujo Completo

### Test 1: Registro de Usuario ✅

**Pasos:**
1. Navegue a http://localhost:5173
2. Será redirigido a http://localhost:5173/login
3. Haga clic en "Regístrate aquí"
4. Complete el formulario:
   - Usuario: `testuser123`
   - Email: `test@example.com`
   - Contraseña: `Password123!`
   - Confirmar: `Password123!`
5. Haga clic en "Crear Cuenta"

**Resultados esperados:**
- ✅ Mensaje verde: "¡Cuenta creada! Redirigiendo al login..."
- ✅ Redirige a /login después de 1.5 segundos
- ✅ No hay errores en la consola del navegador

**Verificación BD:**
En Supabase → Table Editor → `users`:
- Debería ver una fila nueva con el usuario

---

### Test 2: Login Correcto ✅

**Pasos:**
1. En la página /login, ingrese:
   - Email: `test@example.com`
   - Contraseña: `Password123!`
2. Haga clic en "Iniciar Sesión"

**Resultados esperados:**
- ✅ Spinner de carga durante ~2 segundos
- ✅ Redirige a /dashboard automáticamente
- ✅ Muestra nombre de usuario: "Bienvenido, testuser123"
- ✅ Muestra "No tienes campañas aún" (porque es primer login)

**Verificación Zustand (DevTools):**
- Token guardado: `localStorage.auth_token` es un JWT válido
- User guardado: `localStorage.auth_user` contiene objeto con id, email, username

---

### Test 3: Login Incorrecto ❌

**Pasos:**
1. En /login, ingrese credenciales incorrectas:
   - Email: `test@example.com`
   - Contraseña: `WrongPassword123!`
2. Haga clic en "Iniciar Sesión"

**Resultados esperados:**
- ✅ Spinner de carga
- ✅ Mensaje de error rojo: "Invalid credentials" o similar
- ✅ Permanece en /login
- ✅ localStorage NO se actualiza

---

### Test 4: Logout ✅

**Pasos:**
1. En el Dashboard, haga clic en el botón "Cerrar Sesión" (esquina superior derecha)

**Resultados esperados:**
- ✅ Redirige inmediatamente a /login
- ✅ localStorage vacío (auth_token y auth_user removidos)
- ✅ Zustand state limpio
- ✅ Si intenta volver a /dashboard manualmente, redirige a /login

---

### Test 5: Auto-Login (Page Refresh) ✅

**Pasos:**
1. Haga login exitosamente (Test 2)
2. Ahora está en /dashboard
3. Presione F5 (refresh de página)
4. Espere 2-3 segundos (pantalla de carga)

**Resultados esperados:**
- ✅ Pantalla de carga: "Cargando DungeonAssistant..."
- ✅ Dashboard carga sin pedir login nuevamente
- ✅ Usuario sigue siendo "testuser123"
- ✅ localStorage tiene el token anterior
- ✅ Backend valida token con GET /auth/me (mire console Network)

---

### Test 6: Protected Routes ✅

**Pasos:**
1. Haga logout para estar desautenticado
2. En la barra de direcciones, navegue a http://localhost:5173/dashboard
3. O use DevTools para eliminar localStorage.auth_token manualmente

**Resultados esperados:**
- ✅ Redirige automáticamente a /login
- ✅ NO puede acceder a /dashboard sin token
- ✅ ProtectedRoute component funciona correctamente

---

### Test 7: Token Expiry (Avanzado) ⚠️

**Nota:** Este test requiere modificar el backend temporalmente.

**Pasos:**
1. En `backend/services/supabase.py`, busque el método `login_user()`
2. Modifique el token para que expire en 1 segundo (solo para testing)
3. Haga login
4. Espere 2-3 segundos
5. Recargue la página

**Resultados esperados:**
- ⚠️ Token inválido → localStorage se limpia
- ⚠️ Se le redirige a /login
- ℹ️ **Esto demuestra por qué necesitamos refresh tokens en Fase 3**

---

## 🔍 Debugging

### Backend - Ver Requests/Responses

**Terminal del backend:**
```bash
# Los logs de Uvicorn mostrarán:
POST /auth/login HTTP/1.1
POST /auth/register HTTP/1.1
GET /auth/me HTTP/1.1
```

### Frontend - Inspeccionar API Calls

1. Abra DevTools (F12)
2. Vaya a **Network**
3. Haga login/register
4. Verá requests como:
   - `POST http://localhost:8000/auth/register` → 201
   - `POST http://localhost:8000/auth/login` → 200 + token
   - `GET http://localhost:8000/auth/me` → 200 + user data

### Frontend - Zustand State

1. DevTools (F12) → Console
2. Ejecute:
```javascript
// Ver token
localStorage.getItem('auth_token')

// Ver usuario
JSON.parse(localStorage.getItem('auth_user'))

// Ver estado Zustand (si tiene Redux DevTools instalado)
// O en código: use useAuthStore() → getState()
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `CORS error` | Backend no permite localhost:5173 | Verificar CORS en main.py |
| `401 Unauthorized` | Token inválido/expirado | Haga logout y login nuevamente |
| `Cannot GET /auth/me` | Endpoint no implementado | Verificar routers/auth.py |
| `No database schema` | Schema SQL no ejecutado | Ejecutar schema.sql en Supabase |
| `ERR_CONNECTION_REFUSED` | Backend no está corriendo | Iniciar backend en terminal |

---

## 📊 Monitoreo en Supabase

### Ver Requests de Auth
1. Supabase → Authentication → Users
2. Debería ver usuarios registrados con timestamp

### Ver Datos en Tablas
1. Supabase → Table Editor
2. Vea `users` table con usuarios creados
3. Después de Fase 3, verá `campaigns` con datos

### Logs de Errores
1. Supabase → Logs → API Logs
2. Verifique que los requests lleguen correctamente

---

## ✅ Checklist de Verificación Completa

- [ ] Schema SQL ejecutado en Supabase
- [ ] Variables de entorno configuradas (.env backend y .env.local frontend)
- [ ] Backend corriendo en http://localhost:8000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Registro de usuario exitoso
- [ ] Login con credenciales correctas
- [ ] Login falla con credenciales incorrectas
- [ ] Dashboard carga después de login
- [ ] Logout limpia sesión
- [ ] Page refresh mantiene sesión (auto-login)
- [ ] Rutas protegidas redirigen a login sin token
- [ ] DevTools: localStorage tiene auth_token y auth_user
- [ ] Network tab: Requests incluyen Authorization header
- [ ] Console: Sin errores JavaScript

---

## 🎯 Siguiente Paso: Fase 3

Una vez completados todos los tests anteriores, proceda a **Fase 3: CRUD de Campañas**

```bash
# En main.md, ejecutar:
# phase 3: campaigns
```

**Lo que se implementará:**
- Crear campañas (POST /campaigns)
- Listar campañas del usuario (GET /campaigns)
- Unirse a campaña (POST /campaigns/{id}/join)
- Botones funcionales en Dashboard
- Listado de miembros de campaña
- Roles (GM vs Player)

---

**Última actualización:** Fase 2 completada
**Tiempo estimado de testing:** 15-20 minutos
**Soporte:** Si hay errores, verifique los logs del terminal del backend

¡Éxito! 🚀🐉

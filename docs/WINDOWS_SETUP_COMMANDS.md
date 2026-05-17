# 🖥️ COMANDOS WINDOWS - CONFIGURAR Y EJECUTAR

## 📋 Paso 1: Verificar Instalación

```powershell
# Abre PowerShell en la carpeta raíz del proyecto

# Verificar que Python está instalado
python --version

# Verificar que npm está instalado
npm --version
```

---

## 📋 Paso 2: Verificar Configuración de OCR

```powershell
# En la carpeta raíz
python test_ocr_setup.py
```

**Resultado esperado:**
```
✅ Biblioteca google-cloud-vision importada correctamente
✅ Biblioteca google-generativeai importada correctamente
✨ ¡CONFIGURACIÓN COMPLETA!
```

---

## 📋 Paso 3: Obtener Credenciales (IMPORTANTE)

1. **Abrir Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Crear proyecto:**
   - Click en selector de proyecto (arriba a la izquierda)
   - "NEW PROJECT"
   - Nombre: `DungeonAssistant`
   - Esperar creación

3. **Habilitar APIs:**
   - IR a: APIs & Services → Library
   - Buscar y habilitar:
     - ✅ Cloud Vision API
     - ✅ Generative AI

4. **Crear Service Account:**
   - IR a: APIs & Services → Credentials
   - Click "Create Credentials" → "Service Account"
   - Name: `vision-processor`
   - Click "CREATE AND CONTINUE"
   - Role: Editor
   - Click "CONTINUE"
   - Click "CREATE KEY"
   - Seleccionar "JSON"
   - Click "CREATE"
   - **Se descarga automáticamente**

5. **Guardar archivo:**
   ```powershell
   # Copiar el archivo JSON descargado a:
   # backend\secrets\google-vision-key.json
   
   # O ejecutar:
   Copy-Item "C:\Users\TuUsuario\Downloads\*.json" "backend\secrets\google-vision-key.json"
   ```

---

## 📋 Paso 4: Configurar Variables de Entorno

1. **Abrir `backend\.env` en VS Code:**
   ```powershell
   code backend\.env
   ```

2. **Actualizar valores (reemplazar tu-xxx con valores reales):**
   ```env
   GOOGLE_APPLICATION_CREDENTIALS="./secrets/google-vision-key.json"
   GOOGLE_PROJECT_ID="tu-proyecto-id-aqui"      ← De Google Cloud Console
   GEMINI_API_KEY="tu-gemini-api-key-aqui"      ← De Google Cloud Console
   ```

3. **Guardar archivo (Ctrl+S)**

---

## 📋 Paso 5: Iniciar Backend

```powershell
# Terminal 1 - Backend

cd backend

# Activar virtual environment (si existe)
# .\venv\Scripts\Activate.ps1

# Instalar dependencias (si no lo hiciste)
pip install -r requirements.txt

# Ejecutar servidor
python -m uvicorn main:socket_app --reload
```

**Debe mostrar:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

---

## 📋 Paso 6: Iniciar Frontend

```powershell
# Terminal 2 - Frontend (nueva terminal PowerShell)

cd frontend

# Instalar dependencias (si no lo hiciste)
npm install

# Ejecutar servidor
npm run dev
```

**Debe mostrar:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## 📋 Paso 7: Acceder a la Aplicación

1. **Abrir navegador:** http://localhost:5173/
2. **Ir a:** Crear Personaje
3. **Click en:** 📸 Escanear Hoja
4. **Capturar/Subir** foto de hoja D&D
5. **Ver datos** prellenados en formulario

---

## 🔧 Comandos Útiles

### Actualizar dependencias
```powershell
# Backend
cd backend
pip install --upgrade -r requirements.txt

# Frontend
cd frontend
npm update
```

### Limpiar cache
```powershell
# Frontend
cd frontend
Remove-Item -Recurse node_modules
npm install

# Backend
cd backend
pip cache purge
pip install -r requirements.txt
```

### Ver logs
```powershell
# Backend (ya visible en terminal)

# Frontend
# Abrir DevTools del navegador (F12)
# Ir a Console
```

### Detener servidores
```powershell
# En la terminal, presionar: Ctrl+C
```

---

## 🚨 Troubleshooting Rápido

### Error: "python" no reconocido
```powershell
# Usar ruta completa
"C:\Users\TuUsuario\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn main:socket_app --reload
```

### Error: "npm" no reconocido
```powershell
# Reiniciar PowerShell
# O usar ruta completa
"C:\Program Files\nodejs\npm.cmd" install
```

### Error: "port 8000 already in use"
```powershell
# Usar puerto diferente
python -m uvicorn main:socket_app --reload --port 8001
```

### Error: "port 5173 already in use"
```powershell
# npm usa puerto siguiente automáticamente
# O especificar:
npm run dev -- --port 5174
```

### Error: "Archivo no encontrado: google-vision-key.json"
```powershell
# Verificar ruta
Test-Path "backend\secrets\google-vision-key.json"

# Si no existe, descargar desde Google Cloud Console
# y copiar a backend\secrets\
```

---

## 📱 Probar en Teléfono

```powershell
# Obtener IP local
ipconfig

# Usar en teléfono (en la misma red)
http://TU-IP:5173

# Ejemplo:
# http://192.168.1.100:5173
```

---

## 📝 Notas Importantes

1. **Credenciales:**
   - ⚠️ Nunca subir `.env` o `backend/secrets/` a Git
   - ✅ Ya está en `.gitignore`

2. **Puertos:**
   - Backend: `8000`
   - Frontend: `5173`
   - Si hay conflicto, cambiar puerto

3. **Navegador:**
   - Usar Chrome/Edge/Firefox moderno
   - Necesita soporte para acceso a cámara

4. **Permisos:**
   - Permitir acceso a cámara cuando se pida
   - En Chrome: Settings → Privacy → Camera

---

## ✅ Checklist Rápido

- [ ] Python instalado (`python --version`)
- [ ] npm instalado (`npm --version`)
- [ ] Credenciales de Google Cloud descargadas
- [ ] Archivo JSON en `backend/secrets/google-vision-key.json`
- [ ] Variables en `backend/.env` actualizadas
- [ ] `python test_ocr_setup.py` muestra ✅
- [ ] Backend ejecutándose en `8000`
- [ ] Frontend ejecutándose en `5173`
- [ ] Página carga en http://localhost:5173
- [ ] Botón "📸 Escanear" visible

---

**¡Listo! 🚀 Sistema completamente configurado**

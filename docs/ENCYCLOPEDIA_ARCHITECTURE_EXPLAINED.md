# 📚 ARQUITECTURA DE LA ENCICLOPEDIA - EXPLICACIÓN DETALLADA

## 🏗️ ESTRUCTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    DUNGEON ASSISTANT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │   FRONTEND (React)   │         │   BACKEND (FastAPI)  │      │
│  │                      │         │                      │      │
│  │  ┌────────────────┐  │         │  ┌────────────────┐  │      │
│  │  │   Componentes  │  │         │  │   Routers      │  │      │
│  │  │   Reference:   │  │         │  │                │  │      │
│  │  │ - Spells       │  │         │  │ - /dnd5e/      │  │      │
│  │  │ - Equipment    │  │         │  │   search       │  │      │
│  │  │ - Traits       │  │         │  │ - /dnd5e/      │  │      │
│  │  │ - Monsters     │  │         │  │   autocomplete │  │      │
│  │  └────────────────┘  │         │  └────────────────┘  │      │
│  │         ↓ lee        │         │         ↓ consulta   │      │
│  │  ┌────────────────┐  │         │  ┌────────────────┐  │      │
│  │  │ JSON LOCAL    │  │         │  │   Supabase     │  │      │
│  │  │ (Importado)   │  │         │  │   Database     │  │      │
│  │  │                │  │         │  │                │  │      │
│  │  │ - spells.json │  │         │  │ encyclopedia   │  │      │
│  │  │ - traits.json │  │         │  │ (tabla SQL)    │  │      │
│  │  │ - equipment.│ │  │         │  │                │  │      │
│  │  │   json       │  │         │  └────────────────┘  │      │
│  │  │ - monsters.│ │  │         │                      │      │
│  │  │   json       │  │         │  ┌────────────────┐  │      │
│  │  └────────────────┘  │         │  │ Seed Script    │  │      │
│  │                      │         │  │ (Manual)       │  │      │
│  └──────────────────────┘         │  │ seed_          │  │      │
│                                    │  │ encyclopedia   │  │      │
│                                    │  │ .py            │  │      │
│                                    │  └────────────────┘  │      │
│                                    │                      │      │
│                                    └──────────────────────┘      │
│                                              ↓                   │
│                                    ┌──────────────────┐          │
│                                    │ dnd5eapi.co      │          │
│                                    │ (Fuente de datos)│          │
│                                    └──────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 ¿QUÉ SON LOS ARCHIVOS `append_data*.py`?

### Localización
```
frontend/
├── append_data_3.py
├── append_data_4.py
├── append_data_10.py
├── append_data_10_2.py
├── append_data_10_3.py
└── append_more_data.py
```

### Propósito
Son **scripts de UTILIDAD** (herramientas de desarrollo) que:
- ✅ Agregan datos manuales a los JSONs locales
- ✅ Se usan para EXPANDIR la enciclopedia con datos adicionales
- ✅ NO se ejecutan automáticamente
- ❌ NO son parte del flujo principal de la aplicación

### Cómo Funcionan
```python
# Ejemplo: append_data_3.py

import json

# 1. Lee el archivo JSON existente
with open('src/data/encyclopedia/spells.json', 'r') as f:
    spells = json.load(f)

# 2. Define nuevos hechizos
new_spells = [
    {
        "id": "ray-of-frost",
        "name": "Rayo de escarcha",
        "level": 0,
        # ... más campos
    },
    # ... más hechizos
]

# 3. Los agrega a la lista
spells.extend(new_spells)

# 4. Guarda el archivo actualizado
with open('src/data/encyclopedia/spells.json', 'w') as f:
    json.dump(spells, f)
```

### ¿Cuándo se Ejecutan?
**SOLO MANUALMENTE**, cuando tú ejecutas:
```bash
python frontend/append_data_3.py
python frontend/append_data_10.py
# etc...
```

**NO se ejecutan:**
- ❌ Al iniciar el proyecto (`npm start`)
- ❌ Al ejecutar el backend
- ❌ De forma automática

---

## 🔄 FLUJO DE DATOS EN LA ENCICLOPEDIA

### 1️⃣ COMPONENTES DEL FRONTEND (Lo que VE el usuario)

```jsx
// TraitsReference.jsx, EquipmentReference.jsx, etc.

import traitsData from '../../data/encyclopedia/traits.json'
// ↑ IMPORTACIÓN DIRECTA DEL JSON

export default function TraitsReference() {
  const categories = ['races', 'classes', 'backgrounds', 'proficiencies', ...]
  
  const searchTraits = (query, category) => {
    // Los datos YA están en memory
    let results = traitsData
    
    // Filtrar por categoría
    if (category !== 'all') {
      results = results.filter(r => r.trait_type === category)
    }
    
    // Filtrar por búsqueda
    if (query) {
      results = results.filter(r => r.name.toLowerCase().includes(query))
    }
    
    return results  // Los datos se muestran al usuario
  }
}
```

**Ventajas:**
- ✅ Súper rápido (no hay latencia de red)
- ✅ Funciona sin internet
- ✅ Datos disponibles al instante

---

### 2️⃣ BÚSQUEDA DEL BACKEND (Para búsqueda avanzada)

Si el usuario hace una búsqueda más compleja, el backend tiene endpoints:

```javascript
// Frontend (opcional)
const response = await fetch('/api/dnd5e/search?q=fireball&categories=spells')
// ↓
// Backend busca en Supabase
// ↓
// Retorna resultados
```

**El backend:**
- Consulta la tabla `encyclopedia` en Supabase
- Usa búsqueda fuzzy (aproximada)
- Retorna resultados ordenados por relevancia

---

### 3️⃣ SEEDING (Proceso Manual)

Si necesitas actualizar la base de datos Supabase desde cero:

```bash
# En la carpeta backend/
python scripts/seed_encyclopedia.py

# O con opciones:
python scripts/seed_encyclopedia.py --categories spells,traits,equipment
```

**Qué hace:**
1. Descarga datos de `https://www.dnd5eapi.co/api/2014/`
2. Los guarda en la tabla `encyclopedia` de Supabase
3. Esto es para el backend, NO afecta el frontend

---

## 🎯 RESUMEN: ¿CUÁLES SON LAS 3 FORMAS DE CARGAR DATOS?

| Método | Ubicación | Cómo Funciona | Cuándo Usar |
|--------|-----------|---------------|-----------|
| **JSONs Locales** | `frontend/src/data/encyclopedia/*.json` | Importar directamente en los componentes | ✅ **SIEMPRE** (Principal) |
| **append_data.py** | `frontend/append_data*.py` | Agregar datos manualmente a los JSONs | 📌 Raramente (desarrollo) |
| **Backend + Supabase** | `backend/scripts/seed_encyclopedia.py` | Sincronizar datos en BD del servidor | 🔧 Setup inicial |

---

## 🚀 FLUJO COMPLETO: ¿QUÉ PASA AL INICIAR TU APP?

```
1. npm start (frontend)
   ↓
2. React carga los componentes
   ↓
3. TraitsReference.jsx importa spells.json
   ↓
4. Los datos se cargan en memory (instantáneo)
   ↓
5. Usuario ve 13 razas, 13 clases, etc.
   ↓
6. Usuario filtra/busca (operaciones en memory)
   ↓
7. ¡Listo! Sin delay de red
```

**En paralelo:**
```
1. python backend/main.py (backend)
   ↓
2. FastAPI carga los routers
   ↓
3. Router dnd5e_search.py se conecta a Supabase
   ↓
4. Backend está listo para búsquedas avanzadas
   ↓
5. Frontend puede llamar /api/dnd5e/search si necesita
```

---

## 📝 DATOS ACTUALES

### ¿De dónde vienen?
```
frontend/src/data/encyclopedia/
├── spells.json          ← Hechizos (51 items)
├── traits.json          ← Rasgos (51 items)
├── equipment.json       ← Equipamiento (51 items)
└── monsters.json        ← Monstruos (51 items)
```

### ¿Cómo se crearon?
1. **Originalmente**: Descargados de dnd5eapi.co (vía seed_encyclopedia.py)
2. **Luego**: Ajustados y redistribuidos (redistribute_encyclopedia.py)
3. **Finalmente**: Agregados nuevos campos (add_new_filter_types.py)

### ¿Se actualizan automáticamente?
❌ **NO** - Son estáticos. Si quieres cambios:
- Editar manualmente el JSON
- O ejecutar append_data.py
- O ejecutar seed_encyclopedia.py nuevamente

---

## 🔧 CICLO DE VIDA DE UN DATO

### Escenario: Agregar un nuevo hechizo

**Opción 1: Rápido (desarrollo local)**
```bash
# 1. Editar frontend/src/data/encyclopedia/spells.json
# 2. Agregar el nuevo hechizo manualmente
# 3. Guardar
# 4. El frontend automáticamente recarga (hot-reload)
```

**Opción 2: Script (batch)**
```bash
# 1. Crear o modificar append_data_X.py
# 2. Ejecutar: python frontend/append_data_X.py
# 3. El JSON se actualiza
# 4. Recargar el frontend
```

**Opción 3: Base de Datos (producción)**
```bash
# 1. Actualizar datos en dnd5eapi.co (si contribuyes)
# 2. Ejecutar: python backend/scripts/seed_encyclopedia.py
# 3. Se sincroniza Supabase
# 4. Backend ahora tiene datos nuevos
```

---

## ✅ CONCLUSIÓN

### Los JSONs locales del FRONTEND son la FUENTE PRINCIPAL
- ✅ Se cargan al iniciar la app
- ✅ Proporcionan los datos que ves en la UI
- ✅ No requieren internet ni backend

### Los scripts append_data*.py son HERRAMIENTAS DE DESARROLLO
- ❌ NO se ejecutan automáticamente
- ❌ NO son necesarios para el funcionamiento normal
- ✅ Se usan solo si quieres agregar datos masivamente

### El Backend + Supabase es COMPLEMENTARIO
- 📌 Para búsquedas avanzadas (fuzzy search)
- 📌 Para sincronización de datos
- 📌 Para futuras características que requieran base de datos

---

**En resumen: Tu app funciona con los JSONs locales. Los append_data.py y el backend son opcionales/complementarios.**


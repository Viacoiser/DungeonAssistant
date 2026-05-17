# Plan Maestro: Offline-First Encyclopedia + OCR + RAG Optimizado

## 1. Resumen Ejecutivo

Objetivo principal:
- Migrar de consultas directas a dnd5eapi.co hacia una arquitectura centralizada con Supabase + caché local en IndexedDB (Dexie).
- Habilitar experiencia offline-first para Reference Data y datos de personaje.
- Reducir latencia de consulta a milisegundos.
- Optimizar RAG para reducir tokens, costo y tiempo de respuesta.

Resultados esperados:
- Consultas interactivas en UI: <100ms (y <10ms para accesos en cache en memoria).
- Menos dependencia de API externa y menos riesgo por rate limits.
- OCR usable sin conexión (guardado local + sincronización posterior).
- RAG con menor volumen de contexto y menor costo operativo.

---

## 2. Diagnóstico del Proyecto Actual

Backend (FastAPI + Supabase):
- Existe integración con Supabase y tablas de dominio (users, campaigns, characters, sessions, etc.).
- Existe stack RAG con tablas rag_entities, rag_relationships, rag_events y token_usage.
- No existe aún una tabla central encyclopedia para Reference Data unificado.

Frontend (React + Vite + PWA):
- PWA está configurada para assets, no para estrategia offline de datos dinámicos.
- Hay consumo directo de dnd5eapi.co en componentes de referencia.
- No existe Dexie/IndexedDB para persistencia offline de contenido de referencia.

OCR y RAG:
- OCR está presente (router/flujo existente), pero requiere enriquecimiento local robusto.
- RAG actual puede mejorar si usa recuperación por entidades relevantes en lugar de inyectar texto amplio.

---

## 3. Decisiones de Arquitectura Aprobadas

1) Scope de datos
- Migración total de Reference Data core:
  spells, monsters, equipment, traits, feats, backgrounds, proficiencies, rules.
- Infraestructura para User Data offline-first con sincronización posterior.

2) Actualización de datos
- Seeding manual como mecanismo oficial.
- Verificación diaria automática de versión para aplicar deltas.

3) OCR
- Flujo local-first:
  OCR -> enriquecimiento en encyclopedia local -> guardar draft local -> sincronizar en segundo plano.

4) Resolución de conflictos
- Campos descriptivos: Last-Write-Wins (timestamp).
- Campos numéricos críticos (HP, slots, etc.): merge por deltas.

5) Homebrew no encontrado en biblioteca
- Se adopta Opción A:
  guardar como texto plano no interactivo, con marca Custom/Homebrew.

---

## 4. Modelo de Datos Supabase (Encyclopedia)

```sql
CREATE TABLE encyclopedia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,            -- spells, monsters, equipment, traits, etc.
  index TEXT NOT NULL,               -- fireball, dragon-red, longsword, etc.
  name TEXT NOT NULL,
  data JSONB NOT NULL,               -- payload completo del objeto
  language TEXT DEFAULT 'es',
  source_url TEXT,
  source_system TEXT DEFAULT 'dnd5e',
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_encyclopedia_category_index
  ON encyclopedia(category, index)
  WHERE is_active = true;

CREATE INDEX idx_encyclopedia_search
  ON encyclopedia USING GIN (to_tsvector('spanish', name || ' ' || COALESCE(data::text, '')));

CREATE INDEX idx_encyclopedia_category_active
  ON encyclopedia(category, updated_at DESC)
  WHERE is_active = true;
```

Notas:
- JSONB permite almacenar el objeto original sin perder estructura.
- Índices habilitan búsqueda ágil por categoría, index y full-text.

---

## 5. Estrategia de Sincronización

Primera carga:
1. Detectar DB local vacía.
2. Descargar dataset completo desde backend.
3. Persistir en IndexedDB (Dexie).
4. Guardar versión/timestamp local.

Uso diario:
1. Consultar versión remota.
2. Si cambió, descargar solo deltas.
3. Actualizar IndexedDB en background.

Offline:
- Toda consulta de Reference Data se resuelve localmente.
- Cambios de usuario y drafts OCR se almacenan en cola de sincronización.
- Al volver la conexión: flush de cola + resolución de conflictos.

---

## 6. FASES DE IMPLEMENTACIÓN

## FASE 1: Backend Infrastructure (2-3h)
- Agregar tabla encyclopedia en schema SQL.
- Crear script de seeding:
  backend/scripts/seed_encyclopedia.py
- Descargar categorías core desde API fuente y poblar Supabase.
- Incluir logging, reintentos y manejo de errores.

## FASE 2: Backend API (1-2h)
- Crear router:
  backend/routers/encyclopedia.py
- Endpoints propuestos:
  - GET /api/encyclopedia/version
  - GET /api/encyclopedia?sync=full
  - POST /api/encyclopedia/sync
  - GET /api/encyclopedia/{category}
  - GET /api/encyclopedia/{category}/{index}
  - GET /api/encyclopedia/search
- Endpoints para borradores OCR:
  - POST /api/characters/{id}/draft
  - GET /api/characters/{id}/drafts

## FASE 3: Frontend Dexie Setup (1-2h)
- Instalar Dexie.
- Crear servicio base:
  frontend/src/services/dexie.js
- Stores sugeridos:
  - encyclopedia
  - characters
  - sessions
  - drafts
  - syncQueue
  - syncState

## FASE 4: Frontend Services (2-3h) [Ajuste crítico]

Rol del servicio:
- encyclopediaService deja de ser solo de "Enciclopedia".
- Se convierte en proveedor central para modales y links interactivos de la hoja de personaje.

Archivo:
- frontend/src/services/encyclopediaService.js

Métodos clave:
- getByIndex(category, index) -> objetivo <10ms con memory cache + Dexie.
- batchGetByIndex([...]) -> para carga masiva inicial de hoja.
- searchLocal(query) -> búsqueda local rápida.
- listByCategory(category)
- initializeDB, fullSync, deltaSync, getStatus
- saveDraft, getPendingDrafts, syncDraft
- enrichOCRResult(text)

Optimización obligatoria:
- Implementar cache LRU en memoria para los objetos más usados.
- Caso de uso crítico: clic en ítems de inventario repetidamente.

Complemento:
- frontend/src/services/characterSyncService.js
  - detectChanges
  - calculateDeltas
  - resolveConflicts (LWW + delta merge)
  - queueChange
  - flushQueue

## FASE 5: PWA Runtime Caching (1h)
- Ajustar Workbox en vite.config.js para rutas de encyclopedia y datos relevantes.
- Estrategia recomendada:
  CacheFirst o Stale-While-Revalidate (SWR) para encyclopedia.
- Justificacion de estrategia:
  - Encyclopedia es practicamente inmutable.
  - Evita bloqueos por conectividad "fantasma" (senal sin trafico real).
  - Prioridad UX: mostrar al instante lo local; actualizar en segundo plano si hay red.
- Recomendacion operativa:
  - Encyclopedia: Stale-While-Revalidate (preferido) o CacheFirst con TTL largo.
  - Datos transaccionales (characters/sessions): NetworkFirst.

## FASE 6: Migración de Componentes (3-5h) [Cambio visible]

6.0 Ajustes de Sidebar y Biblioteca (nuevo requerimiento)
- Mantener pestaña Rasgos integrada con su submenú de categorías (ya implementado).
- Renombrar pestaña Equipment a "Equipamiento y Objetos" en sidebar y vistas.
- Agregar nuevo botón en sidebar: "Monsters" (debajo de Equipamiento y Objetos).
- Agregar nuevo botón en sidebar: "Spells".
- Para Monsters y Spells en esta etapa: contenido de descripción solamente (sin imágenes).

6.1 Nuevo ReferenceLink
- frontend/src/components/ReferenceLink.jsx
- Uso:
  <ReferenceLink name="Longsword" category="equipment" index="longsword" />
- Comportamiento:
  click -> encyclopediaService.getByIndex -> abrir Modal/Drawer.

6.2 Nuevo InteractiveCharacterSheet
- frontend/src/components/InteractiveCharacterSheet.jsx
- Reemplaza render plano de equipo/rasgos/hechizos por links interactivos.

6.3 Nuevo ReferenceModal
- frontend/src/components/ReferenceModal.jsx
- Renderiza la ficha de referencia consultada.
- Ajuste UX mobile-first:
  - En desktop: modal centrado.
  - En mobile: Bottom Sheet (panel inferior) por ergonomia de pulgar.
  - Debe incluir area tactil amplia para cerrar (handle + gesto swipe-down + boton claro).
  - Mantener transiciones ligeras para no degradar rendimiento en dispositivos modestos.

6.4 Migrar componentes existentes
- TraitsReference y EquipmentReference al nuevo servicio.
- Búsqueda unificada por endpoint encyclopedia/search.
- Integrar MonstersReference y SpellsReference a la navegación principal de sidebar.

6.5 OCR Integration
- Enriquecer detecciones con search local.
- Guardar drafts enriquecidos para sincronización posterior.

6.6 Manejo Homebrew (decisión tomada)
- Si OCR no encuentra match en encyclopedia:
  - render como texto plano (no interactivo)
  - flag is_homebrew = true
  - etiqueta visual Custom/Homebrew
  - persistir y sincronizar igual

6.7 RAG Optimization (crítico)
- Nuevo enfoque:
  - identificar entidades en la pregunta
  - consultar rag_entities por esos nombres
  - enviar al LLM solo esos fragmentos
- Beneficio esperado:
  menor latencia, menor consumo de tokens y menor factura API.

Implementación sugerida:
- backend/services/rag_optimizer.py
  - extract_entities_from_query(question)
  - fetch_entity_context(entities)

## FASE 7: Startup Sync + Operación Continua (1-2h)
- Crear hook:
  frontend/src/hooks/useSyncEncyclopedia.js
- En App startup:
  - primera carga: fullSync
  - diaria: check + deltaSync
  - flush de cola offline

---

## 7. Archivos a Crear/Modificar

Crear (Backend):
- backend/scripts/seed_encyclopedia.py
- backend/routers/encyclopedia.py
- backend/services/rag_optimizer.py

Crear (Frontend):
- frontend/src/services/dexie.js
- frontend/src/services/encyclopediaService.js
- frontend/src/services/characterSyncService.js
- frontend/src/hooks/useSyncEncyclopedia.js
- frontend/src/components/ReferenceLink.jsx
- frontend/src/components/InteractiveCharacterSheet.jsx
- frontend/src/components/ReferenceModal.jsx

Modificar (Backend):
- backend/schema.sql
- backend/main.py
- backend/services/rag_manager.py (integrar optimizer)
- router(s) de assistant/gamemaster según flujo

Modificar (Frontend):
- frontend/vite.config.js
- frontend/src/App.jsx
- frontend/src/components/TraitsReference.jsx
- frontend/src/components/EquipmentReference.jsx
- frontend/src/components/desktop/Sidebar.jsx
- frontend/src/pages/Dashboard.jsx
- frontend/src/components/CharacterDetail.jsx (o reemplazo por InteractiveCharacterSheet)
- componente OCR actual (integrar enrichment + homebrew policy)
- frontend/package.json

---

## 8. Criterios de Validación

Funcional:
- Primera sincronización completa correcta.
- UI de referencia interactiva funcional.
- OCR genera draft enriquecido cuando hay match.
- OCR homebrew se guarda como texto plano no interactivo.
- Sidebar muestra correctamente: Rasgos, Equipamiento y Objetos, Monsters y Spells.
- Monsters y Spells muestran información descriptiva sin usar imágenes.

Performance:
- getByIndex cache hit <10ms.
- búsqueda local <100ms.
- navegación de inventario/rasgos sin latencia perceptible.
- apertura/cierre de ReferenceModal/Bottom Sheet fluida en mobile (sin jank visible).

Offline:
- consultas de referencia operan sin internet.
- cola offline de cambios y borradores se sincroniza al reconectar.

RAG:
- el contexto enviado al LLM contiene solo entidades relevantes.
- reducción de tokens y tiempo respecto al baseline.

---

## 9. Riesgos y Mitigaciones

Riesgo: inconsistencias en merge offline/online.
- Mitigación: snapshots + auditoría de deltas + pruebas de conflicto.

Riesgo: tamaño de almacenamiento por OCR.
- Mitigación: cleanup automático de imágenes una vez procesadas/sincronizadas.

Riesgo: drift entre schema local y backend.
- Mitigación: versionado de syncState + migraciones de Dexie.

---

## 10. Estimación Refinada

- Total estimado: 12-19 horas.
- Distribución:
  - Fases backend base: 3-5h
  - Capa offline + servicios: 4-6h
  - UI interactiva + migración: 3-5h
  - RAG optimizer: 1-2h

---

## 11. Siguiente Paso Recomendado

Iniciar por FASE 1 + FASE 2 para habilitar el contrato de datos (tabla + endpoints), luego avanzar en paralelo con FASE 3 y FASE 4.
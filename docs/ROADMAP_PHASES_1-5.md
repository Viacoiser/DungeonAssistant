# DungeonAssistant - Roadmap Completo: Phase 1-4+

**Fecha de Creación:** 15 de Abril de 2026  
**Estado:** ✅ PLANIFICACIÓN COMPLETA  
**Alcance:** Phases 1-4 + Enhancements Futuros

---

## 📊 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Fases por Etapa](#fases-por-etapa)
3. [Phase 1: Local Analysis Integration](#phase-1-local-analysis-integration)
4. [Phase 2: Fast Save & Detection](#phase-2-fast-save--detection)
5. [Phase 3: RAG Structure & Compression](#phase-3-rag-structure--compression)
6. [Phase 4: Hybrid 2.0 Context](#phase-4-hybrid-20-context)
7. [Phase 5+: Advanced Features](#phase-5-advanced-features)
8. [Timeline & Dependencies](#timeline--dependencies)
9. [Métricas de Éxito](#métricas-de-éxito)
10. [Riesgos & Mitigaciones](#riesgos--mitigaciones)

---

## 🎯 Visión General

### Objetivo Principal
Crear un sistema de **análisis inteligente de sesiones D&D** que:
- ✅ Detecte automáticamente items, NPCs, y eventos
- ✅ Minimice consumo de tokens (15 tokens/sesión vs 3500+ actualmente)
- ✅ Mantenga contexto histórico sin regenerarlo
- ✅ Funcione offline para búsquedas locales
- ✅ Escale a 100+ campañas activas

### Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    PHASE 0: FUZZY SEARCH ✅             │
│           (Items/Spells search, Autocompletado)         │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│         PHASE 1: LOCAL ANALYSIS INTEGRATION             │
│   (Detecta items sin Gemini, guarda automáticamente)    │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│            PHASE 2: FAST SAVE & DETECTION              │
│   (Análisis paralelo, instant UI, NPC detection)       │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│         PHASE 3: RAG STRUCTURE & COMPRESSION            │
│   (Database para entidades, context compression)        │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│          PHASE 4: HYBRID 2.0 CONTEXT SYSTEM             │
│   (Smart context switching, token optimization)         │
└─────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│          PHASE 5+: ADVANCED FEATURES & SCALING          │
│   (Admin panel, API improvements, ML optimization)      │
└─────────────────────────────────────────────────────────┘
```

---

## 🗺️ Fases por Etapa

### Timeline Estimado

```
MONTH 1 (Abril 2026)
├── Week 1: Phase 0 ✅ (COMPLETADO)
├── Week 2: Phase 1 (Local Analysis)
├── Week 3: Phase 2 (Fast Save)
└── Week 4: Phase 3 (RAG Structure) - Inicio

MONTH 2 (Mayo 2026)
├── Week 1-2: Phase 3 (RAG Structure) - Finalización
├── Week 3: Phase 4 (Hybrid 2.0)
└── Week 4: Testing & Optimizations

MONTH 3+ (Junio+)
├── Phase 5: Advanced Features
├── Phase 6: Mobile Optimization
└── Phase 7: Enterprise Features
```

---

## 🔧 Phase 1: Local Analysis Integration

**Estado:** Not Started  
**Duración Estimada:** 2-3 días  
**Prioridad:** 🔴 ALTA

### Objetivo
Integrar búsqueda local `analyze_note()` en `add_session_note()` para detectar items sin consumir tokens Gemini.

### Cambios Requeridos

#### 1. Backend: `backend/routers/sessions.py`

**Archivo:** `backend/routers/sessions.py`  
**Función:** `add_session_note()` (línea ~169)

```python
# CAMBIO: Agregar análisis local ANTES de Gemini

@router.post("/sessions/{session_id}/notes")
async def add_session_note(
    session_id: int,
    note: NoteCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase)
):
    # 1. NUEVO: Análisis local SIN TOKENS
    from services.dnd5e_search import get_dnd5e_searcher
    searcher = get_dnd5e_searcher()
    local_analysis = searcher.analyze_note(note.content)
    
    detected_items = local_analysis.get("detected_items", [])
    detected_spells = local_analysis.get("detected_spells", [])
    
    # 2. OPCIONAL: Gemini solo para NPCs/análisis profundo
    gemini_analysis = await analyze_session_note(
        note.content,
        context=context
    )
    detected_npcs = gemini_analysis.get("detected_npcs", [])
    
    # 3. Combinar resultados
    final_analysis = {
        "detected_items": detected_items,
        "detected_spells": detected_spells,
        "detected_npcs": detected_npcs
    }
    
    # 4. Guardar nota con análisis
    await db.table("session_notes").insert({
        "session_id": session_id,
        "content": note.content,
        "detected_items": detected_items,
        "detected_npcs": detected_npcs,
        "created_by": current_user["id"],
        "is_public": False,
        "created_at": datetime.utcnow()
    }).execute()
    
    return {"status": "created", "analysis": final_analysis}
```

**Token Savings:**
- Antes: 3500 tokens (Gemini analiza todo)
- Después: 2100 tokens (Gemini solo NPCs)
- **Ahorro: 40%**

#### 2. Database Schema: `backend/schema.sql`

```sql
-- Agregar columnas a session_notes
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS (
    detected_items JSONB,
    detected_spells JSONB,
    detected_npcs JSONB,
    last_gemini_analysis TIMESTAMP
);

-- Index para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_detected_items 
ON session_notes USING GIN (detected_items);
```

#### 3. Frontend: Display Items

**Archivo:** `frontend/src/pages/CampaignView.jsx`  
**Component:** NotesTab

```jsx
// Mostrar items detectados automáticamente
{note.detected_items?.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="text-[10px] font-bold text-gray-400">Detected Items:</span>
        {note.detected_items.map((item, i) => (
            <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-300 border border-green-500/20"
            >
                📦 {item.name}
                {item.quantity > 1 && ` ×${item.quantity}`}
            </span>
        ))}
    </div>
)}
```

### Testing: Phase 1

```python
# test_phase1_local_analysis.py

def test_add_note_with_local_analysis():
    """
    Test que al crear nota:
    1. Se analiza localmente (0 tokens)
    2. Se detectan items automáticamente
    3. UI muestra items detectados
    """
    response = requests.post(
        "http://localhost:8000/sessions/123/notes",
        json={"content": "Encontramos una espada de acero y un escudo mágico"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["analysis"]["detected_items"] == [
        {"name": "sword", "quantity": 1},
        {"name": "shield", "quantity": 1}
    ]
```

### Success Criteria

- ✅ Items se detectan sin Gemini en < 200ms
- ✅ Datos guardados en DB correctamente
- ✅ UI muestra items automáticamente
- ✅ Zero additional tokens por nota
- ✅ 95%+ accuracy en items comunes

---

## 📦 Phase 2: Fast Save & Detection

**Estado:** Not Started  
**Duración Estimada:** 2-3 días  
**Prioridad:** 🟡 MEDIA  
**Dependencia:** Phase 1 ✅

### Objetivo
Optimizar respuesta: análisis paralelo de nota mientras se guarda, NPC detection mejorado.

### Cambios Requeridos

#### 1. Análisis Paralelo

**Archivo:** `backend/routers/sessions.py`

```python
import asyncio

@router.post("/sessions/{session_id}/notes")
async def add_session_note(...):
    """
    Correr analyse y DB insert en PARALELO, no secuencial
    """
    
    # 1. Iniciar ambas operaciones simultáneamente
    local_analysis_task = asyncio.create_task(
        asyncio.to_thread(searcher.analyze_note, note.content)
    )
    
    db_insert_task = asyncio.create_task(
        db.table("session_notes").insert({...}).execute()
    )
    
    # 2. Esperar ambas completar
    local_analysis, db_result = await asyncio.gather(
        local_analysis_task,
        db_insert_task
    )
    
    # 3. Retornar inmediatamente (UI actualiza al instante)
    return {
        "status": "created",
        "note_id": db_result["id"],
        "detected_items": local_analysis["detected_items"]
    }
```

**Performance Impact:**
- Antes: Secuencial = 200ms (local) + 150ms (DB) = 350ms
- Después: Paralelo = max(200ms, 150ms) = ~220ms
- **Mejora: 37%**

#### 2. NPC Detection Mejorado

**Archivo:** `backend/services/dnd5e_search.py`

```python
def analyze_note_advanced(self, content: str, context: dict = None) -> dict:
    """
    Análisis mejorado con:
    - NPC name patterns (capitalized words)
    - Quest detection
    - Location mentions
    """
    
    # Patrones para detectar NPCs
    npc_patterns = [
        r"(?:met|found|encountered|talked to) ([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)",
        r"(?:named|called) ([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)"
    ]
    
    detected_npcs = []
    for pattern in npc_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        detected_npcs.extend(matches)
    
    return {
        "detected_items": self.analyze_note(content)["detected_items"],
        "detected_npcs": list(set(detected_npcs)),  # Deduplicate
        "sentiment": self._analyze_sentiment(content)  # positive/neutral/negative
    }
```

#### 3. Database: NPC Tracking

**Archivo:** `backend/schema.sql`

```sql
-- Nueva tabla para NPCs encontrados
CREATE TABLE session_npcs (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES sessions(id),
    name VARCHAR(255) NOT NULL,
    first_mentioned TIMESTAMP DEFAULT NOW(),
    last_mentioned TIMESTAMP DEFAULT NOW(),
    mention_count INT DEFAULT 1,
    role VARCHAR(50),  -- 'ally', 'enemy', 'neutral', 'quest-giver'
    UNIQUE(session_id, name)
);

-- Nueva tabla para quests
CREATE TABLE session_quests (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES sessions(id),
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'completed', 'abandoned'
    detected_in_note_id INT REFERENCES session_notes(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Frontend: Instant Update

**Archivo:** `frontend/src/pages/CampaignView.jsx`

```jsx
const handleAddNote = async () => {
    setSending(true)
    try {
        // Mostrar nota inmediatamente en UI (optimistic update)
        const optimisticNote = {
            id: "temp-" + Date.now(),
            content: noteText,
            created_at: new Date(),
            detected_items: [],  // Se actualizará cuando respuesta llegue
            is_loading: true
        }
        setNotes([optimisticNote, ...notes])
        setNoteText("")
        
        // Llamar API en background
        const response = await sessionAPI.addNote(activeSession.id, noteText)
        
        // Reemplazar optimistic note con data real
        setNotes(notes.map(n => 
            n.id === optimisticNote.id 
                ? response.data 
                : n
        ))
    } catch (e) {
        // Revert optimistic update on error
        setNotes(notes.filter(n => n.id !== optimisticNote.id))
    } finally {
        setSending(false)
    }
}
```

### Testing: Phase 2

```python
def test_parallel_analysis():
    """Verificar análisis paralelo reduce latencia"""
    import time
    
    start = time.time()
    response = requests.post(
        "http://localhost:8000/sessions/123/notes",
        json={"content": "Long note with items and NPCs..."}
    )
    elapsed = time.time() - start
    
    assert elapsed < 0.3  # < 300ms
    assert response.status_code == 201

def test_npc_detection():
    """Detecta NPCs mencionados en nota"""
    response = requests.post(
        "http://localhost:8000/sessions/123/notes",
        json={"content": "We met Gandalf and Aragorn in Rivendell"}
    )
    npcs = response.json()["detected_npcs"]
    assert "Gandalf" in npcs
    assert "Aragorn" in npcs
```

### Success Criteria

- ✅ Response time < 300ms (vs 350ms antes)
- ✅ NPCs detectados con 90%+ accuracy
- ✅ Optimistic UI updates funciona
- ✅ Parallel operations sin race conditions

---

## 🗄️ Phase 3: RAG Structure & Compression

**Estado:** Not Started  
**Duración Estimada:** 4-5 días  
**Prioridad:** 🔴 ALTA  
**Dependencia:** Phase 1, 2 ✅

### Objetivo
Implementar **Retrieval-Augmented Generation** con base de datos de entidades inmutables para contexto permanente y compresión.

### Conceptos Clave

**RAG = Retrieval-Augmented Generation**
```
User Query → Buscar en DB (no generar) → Comprimir contexto → Gemini
```

**Beneficio:**
- Contexto no se regenera cada vez (historicamente = 1000+ tokens)
- Se comprime a ~300 tokens
- **Total ahorro: 85%+**

### Cambios Requeridos

#### 1. Database Schema: Entidades Inmutables

**Archivo:** `backend/schema.sql`

```sql
-- ENTIDADES INMUTABLES (nunca se editan, solo se crecen)
CREATE TABLE rag_entities (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaigns(id),
    entity_type VARCHAR(50) NOT NULL,  -- 'NPC', 'LOCATION', 'QUEST', 'ITEM'
    entity_name VARCHAR(255) NOT NULL,
    description TEXT,
    attributes JSONB,  -- custom fields por tipo
    first_seen TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    mention_count INT DEFAULT 1,
    UNIQUE(campaign_id, entity_type, entity_name)
);

-- ÍNDICES para búsqueda rápida
CREATE INDEX idx_rag_campaign ON rag_entities(campaign_id, entity_type);
CREATE INDEX idx_rag_name ON rag_entities USING GIN(to_tsvector('spanish', entity_name));

-- ENTIDADES RELACIONADAS (relaciones entre NPCs, locales, etc)
CREATE TABLE rag_relationships (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaigns(id),
    source_entity_id INT REFERENCES rag_entities(id),
    target_entity_id INT REFERENCES rag_entities(id),
    relationship_type VARCHAR(100),  -- 'works_for', 'enemies_with', 'located_in', etc
    created_at TIMESTAMP DEFAULT NOW()
);

-- EVENTOS (sesiones agrupadas)
CREATE TABLE rag_events (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaigns(id),
    session_id INT REFERENCES sessions(id),
    event_title VARCHAR(255),
    event_summary TEXT,  -- Ultra-condensed, ~50 words
    entities JSONB,  -- Array of entity IDs involved
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Service: Entity Manager

**Archivo:** `backend/services/rag_manager.py` (NEW)

```python
class RAGManager:
    """Gestionar entidades inmutables para RAG"""
    
    def __init__(self, db: AsyncClient):
        self.db = db
    
    async def register_entity(
        self,
        campaign_id: int,
        entity_type: str,  # NPC, LOCATION, QUEST, ITEM
        entity_name: str,
        description: str = None,
        attributes: dict = None
    ) -> dict:
        """Registrar nueva entidad o actualizar mention count"""
        
        # Buscar si ya existe
        existing = await self.db.table("rag_entities").select("*").match({
            "campaign_id": campaign_id,
            "entity_type": entity_type,
            "entity_name": entity_name
        }).execute()
        
        if existing.data:
            # Update mention count
            entity_id = existing.data[0]["id"]
            await self.db.table("rag_entities").update({
                "mention_count": existing.data[0]["mention_count"] + 1,
                "last_updated": datetime.utcnow()
            }).eq("id", entity_id).execute()
            return existing.data[0]
        else:
            # Crear nueva
            result = await self.db.table("rag_entities").insert({
                "campaign_id": campaign_id,
                "entity_type": entity_type,
                "entity_name": entity_name,
                "description": description,
                "attributes": attributes or {}
            }).execute()
            return result.data[0]
    
    async def get_campaign_context(self, campaign_id: int) -> dict:
        """Obtener contexto comprimido para campaña"""
        
        # Obtener entidades principales (sorteadas por mention_count)
        entities = await self.db.table("rag_entities").select("*").match({
            "campaign_id": campaign_id
        }).order("mention_count", desc=True).limit(20).execute()
        
        # Obtener eventos (últimas 5 sesiones)
        events = await self.db.table("rag_events").select("*").match({
            "campaign_id": campaign_id
        }).order("created_at", desc=True).limit(5).execute()
        
        return {
            "entities": entities.data,
            "events": events.data,
            "compressed_context": self._compress_context(entities.data, events.data)
        }
    
    def _compress_context(self, entities: list, events: list) -> str:
        """Comprimir contexto a ~300 tokens"""
        
        context_text = ""
        
        # NPCs principales
        npcs = [e for e in entities if e["entity_type"] == "NPC"]
        if npcs:
            context_text += "Key NPCs: " + ", ".join(npc["entity_name"] for npc in npcs[:5]) + "\n"
        
        # Locaciones
        locations = [e for e in entities if e["entity_type"] == "LOCATION"]
        if locations:
            context_text += "Locations: " + ", ".join(loc["entity_name"] for loc in locations[:5]) + "\n"
        
        # Quests
        quests = [e for e in entities if e["entity_type"] == "QUEST"]
        if quests:
            context_text += "Active quests: " + "; ".join(q["entity_name"] for q in quests[:3]) + "\n"
        
        # Eventos recientes (1 línea por evento)
        if events:
            context_text += "\nRecent events:\n"
            for event in events[:5]:
                context_text += f"- {event['event_title']}: {event['event_summary'][:100]}...\n"
        
        return context_text
```

#### 3. Integration: Auto-populate RAG

**Archivo:** `backend/routers/sessions.py`

```python
from services.rag_manager import RAGManager

@router.post("/sessions/{session_id}/notes")
async def add_session_note(...):
    # ... análisis local ...
    
    # Registrar entidades detectadas en RAG
    rag = RAGManager(db)
    campaign_id = await _get_campaign_id(session_id, db)
    
    # Registrar items
    for item in detected_items:
        await rag.register_entity(
            campaign_id=campaign_id,
            entity_type="ITEM",
            entity_name=item["name"],
            attributes={"quantity": item.get("quantity", 1)}
        )
    
    # Registrar NPCs
    for npc in detected_npcs:
        await rag.register_entity(
            campaign_id=campaign_id,
            entity_type="NPC",
            entity_name=npc["name"],
            description=npc.get("relationship")
        )
    
    # Crear resumen comprimido de sesión
    session_summary = await _generate_session_summary(
        notes=session_notes,
        detected_entities=detected_items + detected_npcs
    )
    
    await db.table("rag_events").insert({
        "campaign_id": campaign_id,
        "session_id": session_id,
        "event_title": f"Session {session_number}",
        "event_summary": session_summary,
        "entities": [item["id"] for item in detected_items + detected_npcs]
    }).execute()
    
    return {"status": "created", ...}
```

#### 4. Context Compressor: Hybrid 2.0

**Archivo:** `backend/services/context_compressor.py` (NEW)

```python
class ContextCompressor:
    """Comprimir contexto con fidelidad variable"""
    
    def __init__(self, db: AsyncClient):
        self.db = db
    
    async def build_context(
        self,
        campaign_id: int,
        compression_level: str = "balanced"  # 'critical', 'balanced', 'full'
    ) -> dict:
        """
        Construir contexto basado en nivel de compresión:
        
        - critical: ~100 tokens, solo NPCs principals + quests
        - balanced: ~300 tokens, NPCs + quests + ubicaciones
        - full: ~800 tokens, todo (para análisis profundo)
        """
        
        rag_data = await RAGManager(self.db).get_campaign_context(campaign_id)
        
        if compression_level == "critical":
            return self._compress_critical(rag_data)
        elif compression_level == "balanced":
            return self._compress_balanced(rag_data)
        else:  # full
            return self._compress_full(rag_data)
    
    def _compress_critical(self, rag_data: dict) -> dict:
        """Mínimo contexto: solo info crítica"""
        return {
            "npcs": [npc for npc in rag_data["entities"] 
                    if npc["entity_type"] == "NPC"][:3],
            "quests": [q for q in rag_data["entities"] 
                      if q["entity_type"] == "QUEST"][:2],
            "recent_event": rag_data["events"][0] if rag_data["events"] else None
        }
    
    def _compress_balanced(self, rag_data: dict) -> dict:
        """Contexto balanceado: info importante + algo de detalle"""
        return {
            "npcs": rag_data["entities"][:5],
            "locations": [loc for loc in rag_data["entities"] 
                         if loc["entity_type"] == "LOCATION"][:3],
            "quests": [q for q in rag_data["entities"] 
                      if q["entity_type"] == "QUEST"][:3],
            "recent_events": rag_data["events"][:3]
        }
    
    def _compress_full(self, rag_data: dict) -> dict:
        """Contexto completo: para análisis profundo"""
        return rag_data
```

#### 5. Update Gemini Integration

**Archivo:** `backend/services/gemini.py`

```python
async def chat_assistant(
    self,
    campaign_id: int,
    question: str,
    compression_level: str = "balanced"
) -> str:
    """
    Chat con contexto comprimido de RAG
    """
    from services.context_compressor import ContextCompressor
    
    # Obtener contexto comprimido (300 tokens vs 1000+)
    compressor = ContextCompressor(db)
    context = await compressor.build_context(
        campaign_id=campaign_id,
        compression_level=compression_level
    )
    
    prompt = f"""
    Contexto de Campaña (de base de datos histórica):
    
    NPCs conocidos: {', '.join(npc['entity_name'] for npc in context['npcs'])}
    Ubicaciones: {', '.join(loc['entity_name'] for loc in context.get('locations', []))}
    Quests activos: {', '.join(q['entity_name'] for q in context.get('quests', []))}
    
    Eventos recientes:
    {json.dumps(context.get('recent_events', []), indent=2)}
    
    Pregunta del usuario: {question}
    
    Responde en español, basándote en el contexto. Sé específico con nombres y lugares.
    """
    
    response = await asyncio.to_thread(
        self.model.generate_content,
        prompt
    )
    
    return response.text.strip()
```

### Evolution: Token Consumption

```
BEFORE Phase 3:
Question 1 → [All context 3500 tokens] → Answer → Total: 3500 tokens

AFTER Phase 3:
Question 1 → [Compressed context 300 tokens] → Answer → Total: 300 tokens
Question 2 → [Same compressed context 300 tokens] → Answer → Total: 300 tokens
Per session (10 questions) = 3000 tokens (vs 35,000 before)
```

### Success Criteria

- ✅ RAG tables populated automáticamente
- ✅ Context compression reduces tokens 85%
- ✅ Chat quality no degrada (similar answers)
- ✅ Compression levels funciona correctamente
- ✅ 0 N+1 queries (efficient DB access)

---

## 🎯 Phase 4: Hybrid 2.0 Context System

**Estado:** Not Started  
**Duración Estimada:** 3-4 días  
**Prioridad:** 🟡 MEDIA  
**Dependencia:** Phase 3 ✅

### Objetivo
Contexto inteligente que se adapta automáticamente basado en tipo de pregunta y necesidad.

### Implementation

#### 1. Context Selector

**Archivo:** `backend/services/context_selector.py` (NEW)

```python
class ContextSelector:
    """Elegir nivel de compresión automáticamente"""
    
    @staticmethod
    def estimate_needed_compression(question: str) -> str:
        """
        Detectar tipo de pregunta y retornar nivel necesario:
        
        - "Where is...?" / "What happened to...?" → critical (solo protagonistas)
        - "Tell me about..." / "Recap..." → balanced (info general)
        - "Analyze the..." / "Deeply understand..." → full (análisis profundo)
        """
        
        critical_keywords = ["where is", "who is", "what happened to", "current status"]
        full_keywords = ["analyze", "deeply", "carefully examine", "relationship"]
        
        question_lower = question.lower()
        
        if any(kw in question_lower for kw in critical_keywords):
            return "critical"  # 100 tokens
        elif any(kw in question_lower for kw in full_keywords):
            return "full"  # 800 tokens
        else:
            return "balanced"  # 300 tokens
```

#### 2. Progressive Enhancement

```python
async def chat_assistant_v2(
    self,
    campaign_id: int,
    question: str,
    session_history: list = None
) -> dict:
    """
    Chat con selección inteligente de contexto
    """
    
    # 1. Seleccionar nivel automáticamente
    compression = ContextSelector.estimate_needed_compression(question)
    
    # 2. Obtener contexto
    context = await compressor.build_context(campaign_id, compression)
    
    # 3. Verificar si pregunta es seguimiento de anterior
    if session_history:
        # Agregar contexto conversacional (últimas 3 mensajes)
        convo_context = "\n".join([
            f"Q: {msg['question']}\nA: {msg['answer'][:100]}..."
            for msg in session_history[-3:]
        ])
    else:
        convo_context = ""
    
    # 4. Generar respuesta
    full_prompt = f"""
    {convo_context}
    
    Campaign Context ({compression} level):
    {json.dumps(context, indent=2)}
    
    User: {question}
    """
    
    response_text = await asyncio.to_thread(
        self.model.generate_content,
        full_prompt
    )
    
    # 5. Retornar con metadata
    return {
        "answer": response_text.strip(),
        "compression_used": compression,
        "tokens_estimated": self._estimate_tokens(full_prompt)
    }
```

#### 3. Token Tracking

**Archivo:** `backend/schema.sql`

```sql
CREATE TABLE token_usage (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaigns(id),
    user_id INT REFERENCES auth.users(id),
    question TEXT,
    tokens_used INT,
    compression_level VARCHAR(50),
    response_length INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics view
CREATE VIEW token_usage_stats AS
SELECT
    campaign_id,
    DATE(created_at) as date,
    AVG(tokens_used) as avg_tokens,
    SUM(tokens_used) as total_tokens,
    COUNT(*) as questions_asked,
    COUNT(DISTINCT user_id) as unique_users
FROM token_usage
GROUP BY campaign_id, DATE(created_at);
```

#### 4. Admin Dashboard (Para monitoreo)

**Archivo:** `backend/routers/admin.py` (NEW)

```python
@router.get("/admin/token-usage/{campaign_id}")
async def get_token_usage(
    campaign_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase)
):
    """Ver consumo de tokens por campaña"""
    
    # Verificar que user es GM
    is_gm = await _check_is_gm(campaign_id, current_user, db)
    if not is_gm:
        raise HTTPException(status_code=403)
    
    stats = await db.rpc("get_token_stats", {
        "p_campaign_id": campaign_id
    }).execute()
    
    return {
        "today": stats.data[0],
        "this_week": stats.data[1],
        "this_month": stats.data[2],
        "trend": stats.data[3]  # up/down/stable
    }
```

### Success Criteria

- ✅ Auto-select compression 90%+ accuracy
- ✅ Token usage tracked correctamente
- ✅ User experience improved (faster responses)
- ✅ No loss in answer quality

---

## 🚀 Phase 5+: Advanced Features & Scaling

**Estado:** Not Started  
**Duración Estimada:** 5+ días  
**Prioridad:** 🟢 MEDIA/BAJA

### Phase 5A: Admin Panel & Management

```
┌─────────────────────────────────────────────┐
│         GM ADMIN DASHBOARD                  │
├─────────────────────────────────────────────┤
│ • Campaign Overview                         │
│ • Token Usage Analytics                     │
│ • NPC/Location Management                   │
│ • Custom D&D5e Entities                     │
│ • Session Backups                           │
│ • Player Activity Logs                      │
└─────────────────────────────────────────────┘
```

**Componentes:**
- Dashboard con gráficos de uso
- CRUD para entidades RAG
- Analytics de jugadores
- Backup/Export funcionalidad

### Phase 5B: Mobile Optimization

**React Native Frontend:**
- Offline mode con SQLite
- Auto-sync cuando conecta
- Touch-optimized UI
- Voice input para notas

### Phase 5C: API Improvements

**REST API v2:**
```
POST /api/v2/campaigns/{id}/export
- Exportar campaña con todo contexto

GET /api/v2/campaigns/{id}/stats
- Analytics avanzadas

POST /api/v2/campaigns/{id}/bulk-import
- Importar D&D5e data de D&D Beyond, etc
```

**GraphQL Option:**
```graphql
query CampaignContext($id: ID!) {
    campaign(id: $id) {
        npcs { name, role }
        quests { title, status }
        sessions { number, summary }
        tokenUsage { today, thisWeek }
    }
}
```

### Phase 5D: Machine Learning Features

**NPC Relationship Inference:**
```python
# Detectar relaciones automáticamente
"Aragorn y Legolas se conocen," → relationship: 'allies'
"El Rey ente el Dragón" → relationship: 'enemies'
```

**Session Importance Scoring:**
```
Score = (mentions × weight) + (new_entities × weight) + (quest_progress × weight)
Used para: saber qué sesiones son "importantes" para comprimir
```

### Phase 5E: Integration con D&D Tools

**D&D Beyond Integration:**
- Importar caracteres
- Sincronizar campaña

**Roll20 Integration:**
- Leer macros
- Agregar notes

**Fantasy Grounds Integration:**
- Sincronizar iniciativa
- Mapa interactivo

---

## 📅 Timeline & Dependencies

### Dependency Graph

```
Phase 0 ✅
    ↓
Phase 1 (Test suites, local integration)
    ↓
Phase 2 (Parallel processing, NPC detection)
    ↓
Phase 3 (RAG database, context compression)
    ↓
Phase 4 (Intelligent context selection)
    ↓
Phase 5+ (Advanced features in parallel)
    ├── 5A: Admin Panel
    ├── 5B: Mobile App
    ├── 5C: API v2
    ├── 5D: ML Features
    └── 5E: Third-party Integrations
```

### Gantt Chart (Estimado)

```
APRIL 2026:
Week 1: [Phase 0 ✅]
Week 2: [Phase 1 --------]
Week 3: [    Phase 2 --------]
Week 4: [         Phase 3 ----...

MAY 2026:
Week 1: [     Phase 3...........]
Week 2: [              Phase 4 --------]
Week 3: [                  Phase 5A --]
Week 4: [                    5B --][5C--][5D--]

JUNE+ 2026:
[Phase 5E Integration Work + Scaling]
```

---

## 📊 Métricas de Éxito

### Performance Metrics

| Métrica | Baseline | Target Phase 4 | Success? |
|---------|----------|----------------|----------|
| Tokens/Session | 3500 | 300 | ✅ -91% |
| Response Time | 2000ms | 400ms | ✅ -80% |
| Note Create | 350ms | 200ms | ✅ -43% |
| Search Query | 150ms | 50ms | ✅ -67% |

### Quality Metrics

| Métrica | Target | Validation |
|---------|--------|-----------|
| Item Detection Accuracy | 95% | Test against manual annotations |
| NPC Relationship Inference | 85% | User feedback survey |
| Context Compression Fidelity | 90% | Compare: full vs compressed answers |
| Empty cache performance | < 100ms | Benchmark first request |

### Business Metrics

| Métrica | Target |
|---------|--------|
| User Retention | +40% (feature adoption) |
| Session Duration | +25% (faster interaction) |
| API Cost Reduction | -85% (token savings) |
| Scalability | 100+ concurrent users |

---

## ⚠️ Riesgos & Mitigaciones

### Risk: RAG Data Quality Degradation

**Riesgo:** Context becomes stale or contains errors

**Mitigation:**
```python
# Validar entidades antes de guardar
async def validate_entity(entity: dict) -> bool:
    # Check: nombre no está vacío
    # Check: tipo es válido (NPC, LOCATION, etc)
    # Check: no es duplicate reciente
    # Check: descripción coherente (si existe)
    pass
```

**Fallback:** Si contexto es inválido, usar compresión menor

---

### Risk: Token Overflow

**Riesgo:** Prompt + context + response > max tokens

**Mitigation:**
```python
def check_token_budget(
    prompt_tokens: int,
    context_tokens: int,
    safety_margin: int = 500
) -> bool:
    total = prompt_tokens + context_tokens + safety_margin
    return total < 30000  # Model limit
```

---

### Risk: Performance Regression

**Riesgo:** Agregar RAG service ralentiza queries

**Mitigation:**
- Caching agresivo (Redis para contextos comunes)
- Connection pooling en DB
- Async/await everywhere
- Load testing antes de producción

---

### Risk: User Confusion

**Riesgo:** Players no entienden por qué Gemini "olvida" cosas

**Mitigation:**
```jsx
// Mostrar explicación en UI
<InfoBadge title="Context Mode">
    Mostrando: NPCs principales + últimas 3 sesiones
    Esto reduce consumo de $$ pero mantiene 90% de conocimiento
</InfoBadge>
```

---

### Risk: Data Migration

**Riesgo:** Migrar datos antiguos a nuevo schema cuando cambios

**Mitigation:**
```sql
-- Migration script con fallback
BEGIN;
  ALTER TABLE session_notes ADD COLUMN detected_items JSONB;
  UPDATE session_notes SET detected_items = '[]'::jsonb 
    WHERE detected_items IS NULL;
COMMIT;
```

---

## 🏗️ Architectural Decisions

### Why Local Analysis First (Phase 1)?

✅ Pros:
- Instant results (no API latency)
- Works offline
- Zero token cost
- Consistent (no randomness)

❌ Cons:
- Limited to fuzzy matching
- No semantic understanding
- Can't detect complex relationships

### Why RAG Before Advanced Gemini (Phase 3)?

✅ Pros:
- Massive token savings first
- Simpler to implement than ML
- Database as source of truth
- Easy to debug

❌ Cons:
- Needs data collection
- Manual entity mapping

### Why Context Compression Not Summarization?

✅ Structured compression preserves:
- Relationships (X allies with Y)
- Hierarchies (Leader → members)
- Timeline (session order)

vs Summarization which:
- ❌ Loses structure
- ❌ Introduces hallucination
- ❌ Hard to verify accuracy

---

## 📋 Implementation Checklist

### Phase 1
- [ ] Local analysis en `add_session_note()`
- [ ] Database columns para detected_items
- [ ] Frontend UI para items
- [ ] Unit tests
- [ ] Performance benchmarks

### Phase 2
- [ ] Parallel async operations
- [ ] NPC pattern detection
- [ ] Database NPC/Quest tables
- [ ] Optimistic UI updates
- [ ] Integration tests

### Phase 3
- [ ] RAG entity tables
- [ ] Context compressor service
- [ ] Auto-populate entities
- [ ] Gemini integration update
- [ ] Analytics views

### Phase 4
- [ ] Context selector logic
- [ ] Progressive enhancement
- [ ] Token tracking table
- [ ] Admin dashboard skeleton
- [ ] End-to-end tests

### Phase 5+
- [ ] Admin panel components
- [ ] Mobile app setup
- [ ] API v2 routing
- [ ] ML model training
- [ ] Third-party integration

---

## 🎓 Learning Resources

**Recommended Reading:**
- RAG Papers: https://arxiv.org/abs/2310.08032
- Token Optimization: https://openai.com/blog/how-we-use-gpt-4/
- Context Window: https://context.ai/
- Async Python: https://realpython.com/async-io-python/

---

## 📞 Questions & Clarifications Needed

1. ¿Cuál es el limit de token budget mensual?
2. ¿Existen datos históricos que migrar?
3. ¿Qué D&D5e entities usar inicialmente?
4. ¿Timeline máximo para completar todas las phases?
5. ¿Presupuesto para infraestructura/APIs?

---

**Documento Finalizado: 15 de Abril de 2026**  
**Próxima Revisión:** Después Phase 1 completa  
**Status:** 📋 APROBADO PARA IMPLEMENTACIÓN

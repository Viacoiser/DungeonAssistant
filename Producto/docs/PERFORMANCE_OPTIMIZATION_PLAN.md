# Performance Optimization Plan - DungeonAssistant

## Executive Summary
El proyecto tiene varios cuellos de botella de rendimiento que pueden optimizarse:
- **Frontend Bundle**: 1,059 KB minificado (sin comprimir)
- **Backend**: Queries N+1, sin caching, logging excesivo
- **Vite Config**: Sin code splitting estratégico

---

## 🔴 CRITICAL Issues

### 1. Frontend Bundle Size (1,059 KB)
**Problema**: El bundle es muy grande, especialmente con Three.js, Framer Motion, DiceBox
**Impacto**: Tiempo de carga lento en móvil (~3-5s), consumo de ancho de banda

**Soluciones**:
- [ ] Implementar code splitting dinámico en Vite
- [ ] Lazy load React Three Fiber components
- [ ] Lazy load DiceBox (solo en D&D scenes)
- [ ] Comprimir bundle con gzip/brotli
- [ ] Tree-shake unused Three.js features

**Expected Reduction**: -300-400 KB (30-40%)

---

### 2. Encyclopedia Data Loading
**Problema**: `CharacterSheet5e.jsx` importa todo el encyclopedia JSON de una vez
- `spells.json` (~500 KB)
- `equipment.json` (~200 KB)  
- `traits.json` (~150 KB)

**Impacto**: Memory leak, ralentiza renderizado inicial

**Soluciones**:
- [ ] Lazy load encyclopedia data on demand
- [ ] Implement encyclopedia store with size-limited cache
- [ ] Use IndexedDB for client-side persistence
- [ ] Paginate encyclopedia queries

**Expected Improvement**: -50% memory, +40% initial render speed

---

### 3. Backend N+1 Queries
**Problema**: `rag.py` hace múltiples queries secuenciales en lugar de batch queries
```python
# ❌ CURRENT (N+1)
member = supabase.client.table("campaign_members").select("id").match(...).single().execute()
# ... later
result = q.execute()  # Another query
```

**Impacto**: 2-3x más lento para listar entidades

**Soluciones**:
- [ ] Batch queries en endpoints RAG
- [ ] Use database views en lugar de múltiples queries
- [ ] Implement query caching

---

## 🟡 HIGH Priority Issues

### 4. Vite Build Configuration
**Problema**: Sin strategy de chunking, sin minify options, sin compression

**Soluciones**:
- [ ] Add rollupOptions.output.manualChunks
- [ ] Separate vendor chunks (Three, React, etc)
- [ ] Enable CSS minification
- [ ] Add Brotli compression plugin

---

### 5. Encyclopedia Store Without Size Limits
**Problema**: `useEncyclopediaStore.js` cache puede crecer indefinidamente

**Soluciones**:
- [ ] Implement LRU cache with max size (50 MB)
- [ ] Implement time-based expiration (1 hour)
- [ ] Use sessionStorage para datos temporales

---

### 6. Backend CORS Configuration
**Problema**: `allow_origins=["*"]` de facto, lista manual de 10 origins

**Soluciones**:
- [ ] Use environment variable para dynamic CORS
- [ ] Implement rate limiting
- [ ] Use middleware para sanitize headers

---

## 🟢 MEDIUM Priority Issues

### 7. Logging Overhead
**Problema**: `logger` en múltiples routers sin filtering

**Soluciones**:
- [ ] Implement log levels properly
- [ ] Disable verbose logging en production
- [ ] Use structured logging (JSON format)

---

### 8. Missing Database Indexes
**Problema**: No hay menciones de índices en schema.sql

**Soluciones**:
- [ ] Add index en `campaign_members(campaign_id, user_id)`
- [ ] Add index en `rag_entities(campaign_id, entity_type)`
- [ ] Add index en `sessions(campaign_id, created_at)`

---

## Implementation Priority

### Fase 1 (Critical - 1-2 hours)
1. ✅ Fix CharacterForm.jsx syntax error (DONE)
2. Lazy load encyclopedia data in CharacterSheet5e
3. Optimize Vite build with code splitting
4. Fix N+1 queries in rag.py

### Fase 2 (High - 2-3 hours)
5. Implement encyclopedia store size limits
6. Add database indexes
7. Fix CORS configuration
8. Add compression to Vite

### Fase 3 (Medium - 1-2 hours)
9. Optimize logging
10. Implement caching in RAG endpoints
11. Lazy load Three.js components
12. Profile and monitor performance

---

## Estimated Impact
- **Bundle size**: -35-40% (~1,059 KB → ~650 KB)
- **Initial load time**: -50% (3-5s → 1.5-2.5s on 3G)
- **Memory usage**: -30% (lazy loading)
- **API response time**: -40% (batch queries, caching)
- **SEO**: +20% (better Core Web Vitals)

---

## Monitoring Recommendations
1. Use Lighthouse CI for bundle tracking
2. Monitor Core Web Vitals (LCP, FID, CLS)
3. Add performance timings to API responses
4. Use backend APM (Application Performance Monitoring)

---

## Tools to Add
```json
{
  "devDependencies": {
    "compression": "^1.7.4",
    "vite-plugin-compression": "^0.5.1",
    "@vitejs/plugin-basic-ssl": "^1.1.0",
    "rollup-plugin-visualizer": "^5.12.0"
  }
}
```

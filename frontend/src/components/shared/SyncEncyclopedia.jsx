import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import useEncyclopediaStore from '../../store/useEncyclopediaStore';

const CATEGORIES = [
  'races', 'classes', 'traits', 'equipment', 'spells', 
  'monsters', 'features', 'feats', 'backgrounds', 'proficiencies'
];

const SyncEncyclopedia = ({ category, categories: categoriesProp, onComplete }) => {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, syncing, success, error
  const { clearCache } = useEncyclopediaStore();

  const handleSync = async () => {
    if (syncing) return;

    setSyncing(true);
    setStatus('syncing');
    
    // Prioridad: categoriesProp (array) > category (string) > CATEGORIES (all)
    let categoriesToSync = [];
    if (categoriesProp && Array.isArray(categoriesProp)) {
      categoriesToSync = categoriesProp;
    } else if (category) {
      categoriesToSync = [category];
    } else {
      categoriesToSync = CATEGORIES;
    }

    // 1. Limpiar cache de forma granular
    for (const cat of categoriesToSync) {
      // Mapeo especial para equipo: equipment-categories/weapon -> equipment:weapon
      if (cat.includes('equipment-categories/')) {
        const subCat = cat.split('/').pop();
        clearCache(`equipment:${subCat}`);
      } else {
        clearCache(`${cat}:`);
      }
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      for (const cat of categoriesToSync) {
        await fetch(`${apiUrl}/api/dnd5e/seed?category=${cat}`);
      }

      setStatus('success');
      
      // Ejecutar callback si existe
      if (onComplete) onComplete();

      setTimeout(() => {
        setStatus('idle');
        setSyncing(false);
      }, 1500);

    } catch (err) {
      console.error('Sync error:', err);
      setStatus('error');
      setSyncing(false);
    }
  };

  return (
    <div style={{ padding: category ? '0' : '1rem' }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        title={category ? `Sincronizar ${category}` : 'Sincronizar Todo'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: category ? '0.5rem' : '0.75rem',
          borderRadius: '10px',
          background: syncing ? 'rgba(255,255,255,0.05)' : 'rgba(217,83,30,0.1)',
          border: `1px solid ${syncing ? 'rgba(255,255,255,0.1)' : 'rgba(217,83,30,0.3)'}`,
          color: syncing ? '#aaa' : 'var(--fantasy-gold)',
          cursor: syncing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.8rem',
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}
      >
        {status === 'syncing' ? (
          <Loader2 className="animate-spin" size={14} />
        ) : status === 'success' ? (
          <CheckCircle size={14} color="#4ade80" />
        ) : (
          <RefreshCw size={14} />
        )}
        
        {status === 'syncing' ? 'Sincronizando...' : 
         categoriesProp ? `Sincronizar Sección` :
         category ? `Sincronizar ${category.split('/').pop()}` : 'Sincronizar Todo'}
      </button>
    </div>
  );
};

export default SyncEncyclopedia;

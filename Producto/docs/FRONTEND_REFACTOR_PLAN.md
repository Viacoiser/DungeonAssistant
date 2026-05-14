# Plan de Refactor Responsivo - GUÍA DE IMPLEMENTACIÓN

## 📋 ANTES DE EMPEZAR

### Verificar Estado Actual
```bash
# Estructura actual:
frontend/src/components/
  ├── desktop/          # ❌ ELIMINAR (después de migrar)
  │   ├── CampaignDetail.jsx
  │   ├── DiceBoxRoller.jsx
  │   └── Sidebar.jsx
  ├── mobile/           # ❌ ELIMINAR (después de migrar)
  │   └── BottomNav.jsx
  └── ...otros...
```

---

## 🔧 PASO 1: Crear SidebarResponsive.jsx

Reemplazar `desktop/Sidebar.jsx` con versión puramente Tailwind:

```jsx
// frontend/src/components/SidebarResponsive.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import {
  Castle, Users, BookOpen, Settings, LogOut, ChevronDown,
  SmilePlus, Sword, Skull, Sparkles, Dice6, Dices,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    items: [
      { icon: Castle, label: 'Campañas', id: 'campaigns' },
      { icon: Users, label: 'Personajes', id: 'characters' },
    ]
  },
  {
    title: 'Enciclopedia',
    icon: BookOpen,
    collapsible: true,
    items: [
      { icon: SmilePlus, label: 'Rasgos', id: 'traits' },
      { icon: Sword, label: 'Equipamiento', id: 'equipment' },
      { icon: Skull, label: 'Monstruos', id: 'monsters' },
      { icon: Sparkles, label: 'Hechizos', id: 'spells' },
      { icon: Dice6, label: 'Dados', id: 'dice' },
      { icon: Dices, label: 'Dice Box', id: 'dicebox' },
    ]
  },
  {
    items: [
      { icon: Settings, label: 'Ajustes', id: 'settings' },
    ]
  },
]

export default function SidebarResponsive({ activeTab, setActiveTab }) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [expandedSections, setExpandedSections] = useState({ 'Enciclopedia': true })

  const toggleSection = (title) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavClick = (id) => {
    setActiveTab(id)
  }

  return (
    // ✅ CAMBIO: Ahora es Tailwind puro, no inline styles
    // hidden md:flex → Oculto en móvil, visible en tablet+
    // md:w-64 → Ancho responsivo
    <aside className="hidden md:flex md:flex-col md:w-64 sticky top-0 h-screen bg-black/60 border-r border-white/10 z-40 flex-shrink-0">
      
      {/* Logo */}
      <div
        onClick={() => handleNavClick('campaigns')}
        className="p-6 mb-2 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex flex-col leading-tight">
          <span className="font-display text-2xl font-black text-fantasy-gold tracking-widest">
            DUNGEON
          </span>
          <span className="font-display italic text-lg font-semibold text-fantasy-accent ml-8 tracking-widest -mt-1">
            ASSISTANT
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto">
        {NAV_SECTIONS.map((section, secIdx) => (
          <div key={secIdx} className="flex flex-col gap-1">
            
            {/* Section Header (if collapsible) */}
            {section.title && (
              <button
                onClick={() => toggleSection(section.title)}
                className="font-display font-bold text-xs flex items-center gap-2 px-4 py-2 rounded-lg text-fantasy-gold/80 hover:text-fantasy-gold hover:bg-white/5 transition-colors"
              >
                {section.icon && <section.icon size={16} />}
                <span>{section.title}</span>
                <ChevronDown
                  size={14}
                  className={`ml-auto transition-transform ${
                    expandedSections[section.title] ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}

            {/* Section Items */}
            {(!section.title || expandedSections[section.title]) && (
              <div className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-fantasy-accent/20 text-fantasy-accent'
                        : 'text-fantasy-gold/70 hover:text-fantasy-gold hover:bg-white/5'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
```

---

## 📱 PASO 2: Mejorar BottomNav para Móvil

```jsx
// frontend/src/components/BottomNavResponsive.jsx
import React, { useState } from 'react'
import {
  Castle, Users, BookOpen, Settings, LogOut, ChevronUp,
  SmilePlus, Sword, Skull, Sparkles, Dice6, Dices,
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { icon: Castle, label: 'Campañas', id: 'campaigns' },
  { icon: Users, label: 'Personajes', id: 'characters' },
  { icon: BookOpen, label: 'Enciclopedia', id: 'encyclopedia', isMenu: true },
  { icon: Settings, label: 'Ajustes', id: 'settings' },
]

const ENCYCLOPEDIA_ITEMS = [
  { label: 'Rasgos', id: 'traits', icon: SmilePlus },
  { label: 'Equipamiento', id: 'equipment', icon: Sword },
  { label: 'Monstruos', id: 'monsters', icon: Skull },
  { label: 'Hechizos', id: 'spells', icon: Sparkles },
  { label: 'Dados', id: 'dice', icon: Dice6 },
  { label: 'Dice 3D', id: 'dicebox', icon: Dices },
]

export default function BottomNavResponsive({ activeTab, setActiveTab }) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [showEncyclopedia, setShowEncyclopedia] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavClick = (id) => {
    if (id === 'encyclopedia') {
      setShowEncyclopedia(!showEncyclopedia)
    } else {
      setActiveTab(id)
      setShowEncyclopedia(false)
    }
  }

  return (
    <>
      {/* ✅ MEJORADO: Más limpio, responsive utilities */}
      {/* md:hidden → Solo visible en móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/40 backdrop-blur-md border-t border-white/10 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 ${
                (activeTab === item.id || (item.isMenu && showEncyclopedia))
                  ? 'text-fantasy-accent scale-110'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-xs font-medium">Salir</span>
          </button>
        </div>
      </nav>

      {/* Encyclopedia Menu - Mobile Only */}
      {showEncyclopedia && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-md border-t border-white/10 z-40 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 p-3">
            {ENCYCLOPEDIA_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setShowEncyclopedia(false)
                }}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-fantasy-accent/20 text-fantasy-accent'
                    : 'bg-white/5 text-fantasy-gold/70 hover:bg-white/10'
                }`}
              >
                <item.icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer para móvil (evita que el contenido se oculte bajo BottomNav) */}
      <div className="md:hidden h-20" />
    </>
  )
}
```

---

## 📄 PASO 3: Actualizar Dashboard.jsx

```jsx
// ANTES (Problema: Mezcla desktop/mobile sin orden)
import Sidebar from '../components/desktop/Sidebar'
import BottomNav from '../components/mobile/BottomNav'

export default function Dashboard() {
  return (
    <div className="flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* ... resto del contenido */}
    </div>
  )
}

// DESPUÉS (✅ Correcto: Ambas coexisten con media queries)
import SidebarResponsive from '../components/SidebarResponsive'
import BottomNavResponsive from '../components/BottomNavResponsive'

export default function Dashboard() {
  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar: hidden en móvil, flex en desktop */}
      <SidebarResponsive activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Contenido principal */}
      <main className="flex-1 flex flex-col w-full overflow-y-auto pb-16 md:pb-0">
        {/* ... contenido aquí ... */}
      </main>
      
      {/* BottomNav: flex en móvil, hidden en desktop */}
      <BottomNavResponsive activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
```

---

## 🎨 PASO 4: Convertir Componentes Desktop

### Ejemplo: CampaignDetail Responsivo

```jsx
// ANTES (Desktop-only)
<div className="flex gap-6">
  <div style={{ width: '300px' }}>
    {/* Sidebar de campaña */}
  </div>
  <div style={{ flex: 1 }}>
    {/* Contenido */}
  </div>
</div>

// DESPUÉS (Responsive)
<div className="flex flex-col md:flex-row gap-4 md:gap-6">
  {/* md:w-80 = 320px en desktop, fullwidth en móvil */}
  <div className="w-full md:w-80 flex-shrink-0">
    {/* Sidebar */}
  </div>
  <div className="flex-1 min-w-0">
    {/* Contenido */}
  </div>
</div>
```

**Cambios clave:**
- `flex gap-6` → `flex flex-col md:flex-row gap-4 md:gap-6`
- `width: '300px'` → `md:w-80` (en Tailwind units)
- `flex: 1` → `flex-1`
- Agregar `md:` para breakpoint mediano

---

## ✅ PASO 5: Checklist de Conversión

### Componentes a Migrar
- [ ] `SidebarResponsive.jsx` (nuevo)
- [ ] `BottomNavResponsive.jsx` (mejorado)
- [ ] `Dashboard.jsx` (actualizar imports)
- [ ] `CampaignDetail.jsx` (responsivo)
- [ ] `DiceBoxRoller.jsx` (responsivo)
- [ ] Otros componentes desktop

### Limpiar Estilos
- [ ] Eliminar estilos inline (`style={{...}}`)
- [ ] Convertir a Tailwind classes
- [ ] Mantener variables CSS para colores

### Testing
- [ ] Móvil 320px (iPhone SE)
- [ ] Móvil 375px (iPhone 12)
- [ ] Móvil 414px (iPhone 12 Pro Max)
- [ ] Tablet 768px (iPad)
- [ ] Desktop 1024px+
- [ ] Test de scroll en móvil
- [ ] Test de BottomNav (no oculta contenido)

### Limpieza Final
- [ ] Eliminar `components/desktop/`
- [ ] Eliminar `components/mobile/`
- [ ] Verificar imports rotos
- [ ] Deploy a staging

---

## 🚀 Comandos Útiles

```bash
# Buscar todos los estilos inline (para conversion)
grep -r "style={{" frontend/src/components

# Buscar imports de desktop/mobile
grep -r "from.*desktop\|from.*mobile" frontend/src

# Test de responsividad
npm run dev
# Abrir DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
```

---

## 📊 Resultado Final

**Estructura después del refactor:**
```
frontend/src/components/
  ├── SidebarResponsive.jsx      ✅ Tailwind puro, responsive
  ├── BottomNavResponsive.jsx    ✅ Mejorado
  ├── CampaignDetail.jsx         ✅ Responsive
  ├── DiceBoxRoller.jsx          ✅ Responsive
  ├── CharacterCard.jsx
  ├── ...otros...
  └── desktop/                   ❌ ELIMINADO
  └── mobile/                    ❌ ELIMINADO
```

**Beneficios:**
- ✅ Una versión única de cada componente
- ✅ Responsive desde 320px
- ✅ Mejor rendimiento (menos re-renders)
- ✅ Código más fácil de mantener
- ✅ Mismo look & feel que en tu imagen


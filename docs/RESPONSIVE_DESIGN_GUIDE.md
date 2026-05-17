# 📱 Responsive Design Guide - Mobile/Tablet/Desktop

**Objetivo:** Adaptar DungeonAssistant a todos los tamaños de pantalla (PWA)

**Framework:** Tailwind CSS + useResponsive Hook  
**Breakpoints:** Mobile (< 768px), Tablet (768-1024px), Desktop (> 1024px)  
**Tiempo estimado:** 2-3 días

---

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Breakpoints](#breakpoints)
3. [Hook useResponsive](#hook-useresponsive)
4. [Componentes Responsivos](#componentes-responsivos)
5. [Mobile Optimizations](#mobile-optimizations)
6. [Testing](#testing)

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────┐
│     React Component                      │
│                                          │
│  const { isMobile, isTablet, isDesktop} │
│    = useResponsive()                     │
│                                          │
│  return (                                │
│    isMobile ? <MobileLayout />          │
│    isTablet ? <TabletLayout />          │
│    : <DesktopLayout />                  │
│  )                                       │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│     Tailwind Breakpoints                 │
│  sm: 640px   md: 768px   lg: 1024px     │
│  xl: 1280px  2xl: 1536px                │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│     Output                               │
│  📱 Mobile   - bottom nav, full-width   │
│  📱 Tablet   - 2-column layout          │
│  🖥️  Desktop - 3-column + sidebar       │
└──────────────────────────────────────────┘
```

---

## 📐 Breakpoints

### Tailwind CSS Standard

```
Mobile-first approach:
- No prefix: < 640px (default)
- sm: ≥ 640px
- md: ≥ 768px (tablet start)
- lg: ≥ 1024px (desktop start)
- xl: ≥ 1280px (large desktop)
- 2xl: ≥ 1536px (ultra-wide)


DungeonAssistant Custom:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
```

### Tailwind Config

En `frontend/tailwind.config.js`:

```javascript
export default {
  theme: {
    screens: {
      mobile: '320px',
      sm: '640px',
      tablet: '768px',
      md: '768px',
      lg: '1024px',
      desktop: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {},
  },
  plugins: [],
}
```

---

## 🪝 Hook useResponsive

Crea: `frontend/hooks/useResponsive.js`

```javascript
import { useState, useEffect } from 'react';

export function useResponsive() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width, height } = screenSize;

  return {
    // Raw dimensions
    width,
    height,
    isPortrait: height > width,
    isLandscape: width > height,

    // Breakpoints
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,

    // Specific sizes
    isSmallMobile: width < 400,
    isMediumMobile: width >= 400 && width < 600,
    isLargeMobile: width >= 600 && width < 768,
    isSmallTablet: width >= 768 && width < 900,
    isLargeTablet: width >= 900 && width < 1024,
    isSmallDesktop: width >= 1024 && width < 1440,
    isLargeDesktop: width >= 1440,

    // for detailed css
    device: 
      width < 768 ? 'mobile' : 
      width < 1024 ? 'tablet' : 
      'desktop',
  };
}
```

### Usage Example

```jsx
import { useResponsive } from '@/hooks/useResponsive';

export default function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

---

## ⚛️ Componentes Responsivos

### 1. Layout Principal

Crea: `frontend/components/mobile/MobileLayout.jsx`

```jsx
export default function MobileLayout() {
  return (
    <div className="mobile-layout flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-purple-600 p-3">
        <h1 className="text-xl font-bold text-white">DungeonAssistant</h1>
      </header>

      {/* Main Content - Full width */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Content goes here */}
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-purple-600 flex justify-around items-center h-16">
        <NavItem icon="🏠" label="Home" />
        <NavItem icon="📖" label="Books" />
        <NavItem icon="💬" label="Chat" />
        <NavItem icon="⚙️" label="Settings" />
      </nav>

      {/* Account for nav height */}
      <div className="h-16" />
    </div>
  );
}

function NavItem({ icon, label }) {
  return (
    <button className="flex flex-col items-center gap-1 p-2 text-white hover:text-purple-400">
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  );
}
```

Crea: `frontend/components/desktop/DesktopLayout.jsx`

```jsx
export default function DesktopLayout() {
  return (
    <div className="desktop-layout flex bg-gray-950 h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-purple-600 flex flex-col p-4">
        <h1 className="text-2xl font-bold text-white mb-4">DungeonAssistant</h1>
        
        <nav className="flex flex-col gap-2 flex-1">
          <NavLink icon="🏠" label="Dashboard" />
          <NavLink icon="📖" label="Campaigns" />
          <NavLink icon="👥" label="Characters" />
          <NavLink icon="💬" label="Chat" />
        </nav>

        <UserMenu />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav */}
        <header className="bg-gray-900 border-b border-purple-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Welcome</h2>
          <div className="flex gap-4">
            <button>🔔</button>
            <button>⚙️</button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

### 2. Navigation Responsiva

Crea: `frontend/components/ResponsiveNav.jsx`

```jsx
import { useResponsive } from '@/hooks/useResponsive';
import MobileNav from './mobile/MobileNav';
import DesktopNav from './desktop/DesktopNav';

export default function ResponsiveNav() {
  const { isMobile, isDesktop } = useResponsive();

  return (
    <>
      {isMobile && <MobileNav />}
      {isDesktop && <DesktopNav />}
    </>
  );
}
```

### 3. Chat Component Responsivo

```jsx
export default function ChatComponent() {
  const { isMobile, isDesktop } = useResponsive();

  return (
    <div className={`chat-container ${isMobile ? 'p-2' : 'p-6'}`}>
      {/* Messages */}
      <div className={`messages space-y-4 mb-4 ${
        isMobile ? 'max-h-96' : 'max-h-96 md:max-h-96'
      } overflow-y-auto`}>
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <div className={`input-group space-y-2 ${
        isMobile ? '' : 'flex gap-2'
      }`}>
        <textarea
          className={`w-full ${isMobile ? 'h-20' : 'h-12'} p-2 border rounded`}
          placeholder="Pregunta..."
        />
        <button className={`${isMobile ? 'w-full' : 'flex-shrink-0'} px-4 py-2 bg-purple-600 text-white rounded`}>
          Enviar
        </button>
      </div>

      {/* Voice Recorder (mobile) */}
      {isMobile && <VoiceRecorder />}
    </div>
  );
}
```

### 4. Tablas Responsivas

```jsx
export default function ResponsiveTable({ data, columns }) {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) {
    // Card view en mobile
    return (
      <div className="space-y-3">
        {data.map(row => (
          <div key={row.id} className="bg-gray-800 p-4 rounded border border-purple-600">
            {columns.map(col => (
              <div key={col.key} className="flex justify-between text-sm">
                <span className="font-bold text-gray-400">{col.label}:</span>
                <span className="text-white">{row[col.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Table view en tablet/desktop
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-900 border-b border-purple-600">
          {columns.map(col => (
            <th key={col.key} className="p-3 text-left text-purple-400">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id} className="border-b border-gray-700 hover:bg-gray-800">
            {columns.map(col => (
              <td key={col.key} className="p-3 text-white">
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 📱 Mobile Optimizations

### 1. Touch-Friendly Buttons

```jsx
export default function TouchButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="min-h-12 px-4 py-3 active:bg-purple-700 transition-colors"
      // Min 44x44 for touch targets (mobile accessibility)
    >
      {children}
    </button>
  );
}
```

### 2. Virtual Scrolling (para listas largas)

```jsx
import { FixedSizeList as List } from 'react-window';

export default function LargeItemList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style} className="p-2 border-b border-gray-700">
      {items[index].name}
    </div>
  );

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### 3. Safe Area Insets (notch support)

```jsx
// En index.html o global CSS
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

// En componentes
<header className="pt-safe">
  {/* Content */}
</header>

// Tailwind
<header className="pt-[max(1rem,env(safe-area-inset-top))]">
```

### 4. Tap Highlighting

```jsx
// Deshabilitar default tap color en iOS
HTML {
  -webkit-tap-highlight-color: transparent;
}
```

---

## 🧪 Testing

### Visual Regression Tests

```bash
npm install --save-dev playwright @playwright/test

# Crear tests/responsive.spec.js
```

```javascript
import { test, expect } from '@playwright/test';

const breakpoints = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

for (const [name, viewport] of Object.entries(breakpoints)) {
  test(`should render correctly on ${name}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    await page.goto('http://localhost:5173');
    
    // Esperar componente
    await page.waitForSelector('[data-testid="main-layout"]');
    
    // Screenshot
    await expect(page).toHaveScreenshot(`${name}.png`);
    
    await context.close();
  });
}
```

### Manual Testing Checklist

- [ ] **Mobile (iOS - iPhone 14)**
  - [ ] Safari - chat funciona
  - [ ] Micrófono accesible
  - [ ] Bottom nav accesible
  - [ ] Notch respetado
  - [ ] Orientación portrait/landscape

- [ ] **Mobile (Android - Pixel 7)**
  - [ ] Chrome - chat funciona
  - [ ] Micrófono accesible
  - [ ] Botones 44x44 mín
  - [ ] Scroll suave

- [ ] **Tablet (iPad Pro 11")**
  - [ ] Landscape: 2-column layout
  - [ ] Portrait: full-width layout
  - [ ] Touch targets funcionales

- [ ] **Desktop (1920x1080)**
  - [ ] Sidebar visible
  - [ ] 3-column layout
  - [ ] Responsive a resize

---

## 📐 Tailwind Utilities por Breakpoint

### Ejemplos Prácticos

```jsx
{/* Hidden on mobile, visible on tablet+ */}
<div className="hidden md:block">
  Sidebar content
</div>

{/* Full width on mobile, contained on desktop */}
<div className="w-full lg:w-3/4">
  Main content
</div>

{/* Grid: 1 column mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (...))}
</div>

{/* Flex: column on mobile, row on desktop */}
<div className="flex flex-col lg:flex-row gap-4">
  {/* Content */}
</div>

{/* Text size adjusts */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Title
</h1>

{/* Padding adjusts */}
<div className="p-2 md:p-4 lg:p-6">
  Responsive padding
</div>
```

---

## 📚 Recursos

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Mobile Web](https://developer.mozilla.org/en-US/docs/Web_Development/Mobile)
- [React Window (virtual scrolling)](https://github.com/bvaughn/react-window)
- [Playwright Testing](https://playwright.dev)

---

**Estado:** ✅ GUÍA COMPLETA  
**Contacto:** [Tu nombre]  
**Última actualización:** 2026-04-17

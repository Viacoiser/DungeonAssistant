# 📚 Guía de Uso - Razas y Clases en Biblioteca

## 🎯 Acceso

**Dashboard → Sidebar → Enciclopedia → Rasgos**

Una vez en la sección de Rasgos, verás **3 tabs**:
- 📜 **Rasgos** - Características y pasivas de D&D 5e
- 👑 **Razas** - Todas las razas jugables con sus bonificaciones
- ✨ **Clases** - Todas las clases de personaje con sus características

---

## 🏃 Primeros Pasos

### Primera vez que accedes
1. Los datos **se cargan automáticamente** desde el almacenamiento local
2. Si es la primera vez, se descargan de la API de D&D 5e
3. Se guardan localmente para futuras sesiones (sin necesidad de descargar nuevamente)
4. Verás un indicador de carga mientras se sincroniza

### Navegar entre tabs
```
Haz clic en cualquiera de los 3 tabs:
📜 Rasgos | 👑 Razas | ✨ Clases
```
El contenido y los filtros se actualizan automáticamente.

---

## 🔍 Buscar Razas y Clases

### En el tab de Razas o Clases

1. **Usa la barra de búsqueda** en la parte superior
2. Escribe parte del nombre de la raza/clase que buscas
3. Los resultados se filtran **en tiempo real**

**Ejemplos**:
- Buscar "half" → Muestra todas las razas que contienen "half"
- Buscar "rogue" → Muestra la clase de Rogue
- Buscar "dwarf" → Muestra todas las variantes de enano

### En el tab de Rasgos

Además de buscar, puedes **filtrar por categoría**:
- Todos, Races, Classes, Features, Traits, Feats, Backgrounds, Proficiencies

---

## 📖 Ver Detalles

### Seleccionar un item

**Haz clic en cualquier raza, clase o rasgo** de la lista de la izquierda.

El **panel derecho** mostrará toda la información:

#### Para Razas:
- 📝 Descripción completa
- ➕ Bonificaciones de Habilidades (+2 STR, +1 DEX, etc.)
- 🗣️ Lenguajes que hablan
- ⭐ Rasgos especiales de la raza

#### Para Clases:
- 📝 Descripción completa
- 🎲 Golpe de Golpe (cuántos dados de vida)
- 🛡️ Tiradas de Salvación disponibles

#### Para Rasgos:
- 📝 Descripción detallada
- 📊 Información adicional si existe

### Cerrar el panel
Haz clic en el **botón X** en la esquina superior derecha del panel de detalles.

---

## 🔄 Sincronizar con la API

### ¿Qué es sincronizar?

Descarga los datos más recientes de la API de D&D 5e y actualiza el almacenamiento local.

### Cómo sincronizar

**En los tabs de Razas o Clases**, verás un botón **"Refrescar"** en la esquina superior derecha.

```
Haz clic en el botón Refrescar 🔄
↓
Verás "Sincronizando..." mientras se descargan los datos
↓
Se actualizará automáticamente cuando termine
↓
El indicador de "Última sincronización" se actualizará
```

### ¿Cuándo sincronizar?

- **Primera sesión**: Se sincroniza automáticamente
- **Luego de 24 horas**: Los datos se consideran antiguos (puedes sincronizar manualmente)
- **Cuando quieras datos frescos**: Simplemente haz clic en "Refrescar"

### El indicador de sincronización

```
Última sincronización: Hace poco (recién sincronizado)
Última sincronización: Hace 2h (hace 2 horas)
Última sincronización: Hace 1 día (hace más de 24h)
```

---

## 💾 Almacenamiento Local

Los datos se guardan automáticamente en tu navegador:

- ✅ **No necesitas conexión para ver datos previos**
- ✅ **Se actualiza solo cuando sincronizas**
- ✅ **Persiste entre sesiones** (incluso si cierras y reabre)
- ⚠️ **Se limpia si limpias el cache del navegador**

---

## 🔧 Características Especiales

### Búsqueda Inteligente
- Busca por nombre
- Busca por índice (ID interno)
- No distingue mayúsculas/minúsculas

### Panel de Detalles Sticky
- El panel derecho **se queda visible** aunque hagas scroll en la lista

### Responsivo
- Se adapta a cualquier tamaño de pantalla
- En móvil, los tabs se ven debajo del título

### Manejo de Errores
- Si la API no está disponible, **usa datos en caché** automáticamente
- Muestra mensajes claros si algo sale mal

---

## 📱 En Móvil

- La lista ocupa la pantalla completa
- Los detalles se muestran debajo
- Puedes volver a la lista tocando el botón X

---

## ⚡ Consejos de Uso

### Para Crear Personajes
1. Abre el tab de **Razas** y selecciona tu raza favorita
2. Anota los bonificadores de habilidades
3. Abre el tab de **Clases** y selecciona tu clase
4. Anota el golpe de golpe y tiradas de salvación

### Para Investigar
1. Usa la búsqueda para encontrar términos específicos
2. Lee las descripciones detalladas
3. Compara diferentes opciones (puedes tener ambas abiertas en tabs del navegador)

### Para Mantener Actualizados los Datos
1. Sincroniza una vez por semana haciendo clic en "Refrescar"
2. O déjalo automático y sincroniza cuando recuerdes

---

## 🆘 Solución de Problemas

### No cargan los datos
- **Solución**: Intenta hacer clic en "Refrescar"
- Si sigue sin funcionar: Verifica tu conexión a internet

### El panel de detalles está vacío
- **Solución**: Hace clic en otro item y luego vuelve al original
- Si sigue así: La API podría estar teniendo problemas

### Los datos se ven antiguos
- **Solución**: Haz clic en "Refrescar" para actualizar
- Se descargará la información más reciente

### Se eliminaron mis datos
- Los datos se guardan en el cache del navegador
- Si limpias el cache, se perderán
- Volverán a descargar automáticamente la próxima vez

---

## 📊 Información Disponible

### Bonificadores de Razas
- Fuerza (STR)
- Destreza (DEX)
- Constitución (CON)
- Inteligencia (INT)
- Sabiduría (WIS)
- Carisma (CHA)

### Información de Clases
- Golpe de Golpe (d6, d8, d10, d12)
- Tiradas de Salvación disponibles

### Rasgos Adicionales
- Lenguajes
- Características especiales
- Habilidades raciales

---

## 🔗 Fuente de Datos

Todos los datos provienen de la API oficial de D&D 5e:
**https://www.dnd5eapi.co/**

Los datos están bajo licencia de D&D 5e.

---

## 💡 Más Información

- **Cache**: Se actualiza cada 24 horas automáticamente
- **Offline**: Los datos cacheados funcionan sin conexión
- **Sincronización**: Puedes sincronizar manualmente en cualquier momento
- **Búsqueda**: Es rápida y eficiente, sin esperas

---

¡A disfrutar explorando el mundo de D&D 5e! 🐉

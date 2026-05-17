# Registro de Cambios - Dungeon Assistant

### [v1.1.0] - Gestión de NPCs "Final" (2026-04-02)

Esta versión completa el core de interacción con NPCs en la mesa de juego, priorizando la inmersión y la privacidad del DM.

####  Funcionalidades Nuevas
- ** Generador Dinámico de Rasgos:** Botón en la ficha del NPC para añadir rasgos de personalidad aleatorios generados por IA (Gemini). Se acumulan para dar profundidad al rol.
- ** Secreto del DM Protegido:** Panel colapsable para los secretos de los NPCs. Se oculta por defecto para evitar "shoulder-surfing" de los jugadores.
- ** Edición Total:** Ahora todos los campos (Stats, Raza, Personalidad, Secreto) son editables y los Stats pueden ampliarse dinámicamente.

####  Mejoras y Ajustes
- **Capitalización de Relaciones:** Los estados (Aliado, Enemigo, etc.) ahora se muestran con mayúscula inicial para una mejor presentación.
- **Relación de Stats:** Diseño de stats en cuadrícula para mejor lectura en pantallas.
- **Limpieza de UI:** Se eliminó la etiqueta invisible de "IA" en los personajes generados para no romper la inmersión.

####  Corrección de Errores
- **Resurrección de NPCs:** Se corrigió el bug crítico donde un NPC eliminado volvía a aparecer al refrescar. El problema era la falta de sincronización del ID de base de datos post-generación.
- **Bug de Inserción Supabase:** Se eliminó la llamada `.select()` incorrecta que causaba errores en el backend al crear NPCs.

---
> **Nota para QA:** Revisar la persistencia de los rasgos generados aleatoriamente tras refrescar la página.

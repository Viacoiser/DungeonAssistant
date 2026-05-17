# Estimación de Consumo de Tokens (Gemini AI)

Este documento detalla el consumo aproximado de tokens para las diferentes funciones de inteligencia artificial dentro de **Dungeon Assistant**.

## 1. Digitalización de Hojas de Personaje (OCR)
Cada vez que se sube una foto o se captura desde la cámara, el sistema procesa la imagen para extraer datos estructurados.

| Concepto | Estimado (Tokens) | Notas |
| :--- | :--- | :--- |
| **Imagen (Input)** | ~258 | Gemini Flash tiene un costo fijo por imagen. |
| **Instrucciones de Sistema** | ~400 | El prompt que define cómo debe extraerse el JSON. |
| **Datos Extraídos (Output)** | 800 - 1,500 | Depende de la cantidad de equipo, hechizos y rasgos. |
| **TOTAL POR ESCANEO** | **1,500 - 2,200** | — |

---

## 2. Asistente de Chat y Consultas (RAG)
Cuando interactúas con el asistente para preguntar sobre la historia, NPCs o sesiones pasadas.

| Concepto | Estimado (Tokens) | Notas |
| :--- | :--- | :--- |
| **Contexto de Campaña** | 1,000 - 2,500 | Lore, personajes, notas de sesión y entidades RAG. |
| **Pregunta del Usuario** | 20 - 100 | Generalmente muy corta. |
| **Respuesta de la IA** | 150 - 300 | Respuestas limitadas a 3 párrafos para eficiencia. |
| **TOTAL POR CONSULTA** | **1,200 - 3,000** | — |

---

## 3. Generación de NPCs y Contenido
Creación de nuevos personajes no jugadores desde el panel de campaña.

| Concepto | Estimado (Tokens) | Notas |
| :--- | :--- | :--- |
| **Contexto de Mundo** | ~500 | Resumen breve de la campaña. |
| **Datos Generados** | ~600 | El JSON con stats, personalidad y secretos. |
| **TOTAL POR NPC** | **~1,100** | — |

---

## Límites y Costos (Tier Gratuito)
Si utilizas una API Key en el **Tier Gratuito** de Google AI Studio, estos son tus límites teóricos con este nivel de consumo:

*   **Capacidad de Respuesta**: Puedes realizar entre **150 y 300 consultas por minuto** sin agotar la cuota de tokens por minuto (1M TPM).
*   **Frecuencia**: El límite real que alcanzarás primero es el de **15 solicitudes por minuto (RPM)**.
*   **Costo**: $0.00 (Siempre que te mantengas en el nivel gratuito).

> [!NOTE]
> Estos valores son estimaciones. El consumo real puede variar según la complejidad de tus notas de sesión y la cantidad de información guardada en tu campaña.

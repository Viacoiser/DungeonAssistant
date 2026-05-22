# Registro de Definición e Identificación del Proyecto - DungeonAssistant

Este documento contiene la información esencial para la identificación y definición formal del proyecto DungeonAssistant, actuando como referencia para el desarrollo y gestión del ecosistema.

## 1. Identificación del Proyecto

* Nombre del Proyecto: DungeonAssistant
* Tipo de Aplicación: Aplicación Web Progresiva (PWA) enfocada en movilidad.
* Dominio del Proyecto: Herramientas digitales para juegos de mesa RPG (Dungeons & Dragons 5e).
* Versión Actual: 1.0.0 (Fase de construcción)

## 2. Definición del Problema y Justificación

La gestión de sesiones de D&D 5e suele implicar una gran cantidad de registros físicos (hojas de personaje manuscritas), seguimiento manual de eventos de campaña y la necesidad de consultar múltiples fuentes de reglas en tiempo real. Esto puede interrumpir el ritmo narrativo y dificultar el mantenimiento de la coherencia en campañas largas.

DungeonAssistant surge para solventar estos desafíos mediante la integración de inteligencia artificial que facilita la digitalización de herramientas físicas y proporciona un asistente inteligente capaz de comprender el contexto histórico de la campaña, permitiendo que tanto el Dungeon Master como los jugadores se enfoquen en la experiencia narrativa.

## 3. Objetivos del Proyecto

### Objetivo General
Desarrollar una plataforma digital inteligente e integrada para la gestión eficiente de campañas de Dungeons & Dragons 5e, optimizada para dispositivos móviles y accesible en entornos sin conexión constante.

### Objetivos Específicos
* Implementar un sistema de digitalización de fichas de personaje mediante visión artificial para eliminar la barrera entre lo físico y lo digital.
* Crear un motor de asistencia basado en modelos de lenguaje que actúe como memoria histórica y consultor de reglas de la campaña.
* Proveer herramientas de generación dinámica de contenido (NPCs, facciones) que mantengan la coherencia con el lore establecido.
* Facilitar el registro de sesiones mediante bitácoras por voz para simplificar el seguimiento de los eventos de la historia.

## 4. Descripción de la Solución

DungeonAssistant se compone de un ecosistema que integra un servidor de procesamiento asíncrono y una interfaz de usuario reactiva, comunicados en tiempo real. Las funcionalidades clave incluyen:

* Gestión Multi-Rol: Los usuarios pueden administrar sus personajes o dirigir campañas, con roles dinámicos por campaña.
* Digitalización OCR: Procesamiento de imágenes de hojas de personaje oficiales para su conversión en datos vivos.
* Asistente RAG: Sistema de generación aumentada por recuperación que utiliza las notas de la sesión para responder preguntas sobre la historia.
* Gestión de Sesión: Control de tiempos, notas compartidas y resúmenes automáticos de los hitos alcanzados por los jugadores.

## 5. Ámbito y Alcance

El proyecto abarca desde la infraestructura de autenticación y base de datos hasta la interfaz final del usuario, cubriendo el ciclo completo de una sesión de juego, desde la preparación inicial hasta el resumen final de los eventos ocurridos.

## 6. Estado y Progreso

Actualmente, el proyecto ha finalizado su fase de definición estructural y se encuentra en la etapa de implementación de módulos funcionales básicos, con la arquitectura asíncrona y los modelos de datos ya establecidos.

## STACK TECNOLÓGICO

### Frontend
- React + Vite
- Tailwind CSS (mobile-first, breakpoint md: para desktop)
- Zustand (estado global)
- vite-plugin-pwa (manifest.json + Service Worker automático)
- React Router DOM (navegación)
- Socket.io-client (tiempo real)
- Web Speech API (voz nativa del navegador)

### Backend
- Python 3.11+
- FastAPI (API REST asíncrona)
- Pydantic v2 (validación de datos)
- python-socketio (WebSockets)
- httpx (llamadas externas)

### Base de datos
- PostgreSQL vía Supabase
- Supabase Auth (autenticación)
- Supabase Realtime (sincronización en tiempo real)
- Supabase Storage (almacenamiento de imágenes de hojas físicas)

### IA y servicios externos
- Google Gemini API (gemini-2.5-flash): generación de PNJs, asistente
  conversacional RAG, análisis de bitácora
- Gemini Vision API: OCR de hojas físicas de D&D 5e
- dnd5eapi.co (API pública, sin clave): validación de clases, razas,
  hechizos y estadísticas oficiales de D&D 5e

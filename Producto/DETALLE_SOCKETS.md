# Detalle Técnico: Refactorización de Sockets en Tiempo Real

Este documento explica los cambios realizados en el sistema de comunicación bidireccional (Socket.io) y cómo interactúan el backend y el frontend tras la actualización.

## 1. Cambios en el Backend (Servidor)

### Nueva Arquitectura: `SocketManager`
Toda la lógica se ha extraído de `main.py` hacia `backend/services/socket_manager.py`. Esto mejora la mantenibilidad y desacopla la comunicación en tiempo real del resto de la API.

### Seguridad y Autenticación (Handshake)
Anteriormente, el socket permitía conexiones anónimas. Ahora se ha implementado un flujo de autenticación obligatorio:
*   **Validación de JWT**: Al momento de conectar, el servidor busca un token en los headers de autorización o en el objeto `auth`.
*   **Integración con Supabase**: El `SocketManager` valida este token con Supabase. Si el token es inválido o no existe, la conexión es **rechazada inmediatamente**.

### Gestión de Salas (Campaign Rooms)
*   Se ha optimizado el uso de `rooms`. Cuando un usuario se une a una campaña, entra en una sala específica (`campaign_{id}`).
*   Cualquier mensaje enviado a esa sala solo será recibido por los usuarios autenticados que estén dentro de ella.

## 2. Cambios en el Frontend (Cliente)

### Reactivación del Servicio
Se ha habilitado el archivo `frontend/src/services/socket.js`, el cual estaba desactivado. Ahora inicializa correctamente la conexión con `socket.io-client`.

### Envío de Credenciales
El cliente extrae el token del `useAuthStore` y lo envía en el objeto de configuración inicial:
```javascript
const socket = io(SOCKET_URL, {
  auth: { token }
});
```

### Ciclo de Vida
*   **Auto-login**: Si el usuario ya tiene una sesión guardada al abrir la página, el socket se conecta automáticamente.
*   **Login Manual**: Al iniciar sesión con éxito, se dispara la conexión al socket.
*   **Logout**: Al cerrar sesión, el socket se desconecta y se limpia del estado global.

## 3. Comportamiento Esperado

### Conexión Exitosa
1.  El usuario inicia sesión.
2.  En la consola del navegador verás: `✅ Socket conectado: [ID_SESION]`.
3.  Seguido de: `🔐 Socket autenticado correctamente`.

### Interacción en Campaña
*   Al entrar en una campaña, el servidor emite un evento `user_joined`.
*   Los demás jugadores verán en sus consolas (o en la UI si está implementado) que un nuevo usuario se ha unido.
*   Los mensajes enviados a través de `broadcast_message` llegarán instantáneamente a todos los miembros de la sala.

### Seguridad (Rechazo)
*   Si intentas conectar sin haber iniciado sesión, el servidor cerrará la conexión y verás un error de autenticación en los logs del backend.

---
*Este sistema garantiza que la experiencia multiusuario de Dungeon Assistant sea segura y fluida.*

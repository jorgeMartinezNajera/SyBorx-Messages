# Arquitectura de Base de Datos y Sistema SyBorx-Messenger

Este documento contiene la especificación técnica completa del diseño conceptual, lógico y físico de la base de datos relacional PostgreSQL para el sistema **SyBorx-Messenger**, así como la matriz de permisos RBAC y la integración para el equipo de frontend.

---

## 1. Diagrama Entidad-Relación (ERD Completo)

A continuación se presenta el diagrama interactivo en formato Mermaid que modela todas las entidades, relaciones, cardinalidades y tipos de datos del sistema:

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : "posee (1:N)"
    USERS ||--o{ COMMUNITY_MEMBERS : "pertenece a (1:N)"
    USERS ||--o{ DIRECT_CHAT_MEMBERS : "participa en (1:N)"
    USERS ||--o{ MESSAGES : "escribe (1:N)"
    USERS ||--o{ MESSAGE_REACTIONS : "reacciona (1:N)"
    USERS ||--o{ AUDIT_LOGS : "genera accion (1:N)"
    USERS ||--o{ COMMUNITIES : "es propietario de (1:N)"

    COMMUNITIES ||--o{ CHANNELS : "contiene (1:N)"
    COMMUNITIES ||--o{ COMMUNITY_MEMBERS : "tiene miembros (1:N)"
    
    CHANNELS ||--o{ MESSAGES : "aloja (1:N)"
    
    DIRECT_CHATS ||--o{ DIRECT_CHAT_MEMBERS : "conecta usuarios (1:N)"
    DIRECT_CHATS ||--o{ MESSAGES : "aloja (1:N)"
    
    MESSAGES ||--o{ ATTACHMENTS : "incluye adjuntos (1:N)"
    MESSAGES ||--o{ MESSAGE_REACTIONS : "recibe reacciones (1:N)"
    MESSAGES ||--o{ MESSAGES : "hilo de respuesta (1:N)"

    USERS {
        uuid id PK "Identificador único UUID v4"
        varchar email UK "Correo corporativo (@syborx.com) o Gmail"
        varchar username UK "Handle único de usuario"
        varchar password_hash "Hash Bcrypt (cost 10)"
        varchar display_name "Nombre legible para la interfaz"
        varchar avatar_url "URL pública de imagen de perfil"
        varchar bio "Descripción o biografía del empleado"
        enum global_role "SUPERADMIN | ADMIN | TECH_LEAD | DEVELOPER | GUEST"
        enum status "ONLINE | IDLE | DND | OFFLINE"
        varchar custom_status "Estado personalizado en texto"
        boolean is_active "Estado de habilitación de la cuenta"
        enum auth_provider "LOCAL | GOOGLE"
        timestamp created_at "Fecha de registro"
        timestamp updated_at "Última modificación"
    }

    REFRESH_TOKENS {
        uuid id PK "Identificador único de sesión"
        uuid user_id FK "Referencia a USERS (Cascade)"
        varchar token_hash "Hash del refresh token emitido"
        varchar ip_address "IP de la solicitud"
        varchar user_agent "Navegador/Cliente emisor"
        timestamp expires_at "Fecha de caducidad"
        timestamp created_at "Fecha de emisión"
    }

    COMMUNITIES {
        uuid id PK "Identificador único de la comunidad"
        varchar name "Nombre del servidor o comunidad"
        varchar description "Objetivo del espacio de trabajo"
        varchar icon_url "Icono identificador"
        varchar banner_url "Banner de cabecera"
        uuid owner_id FK "Usuario creador/propietario"
        boolean is_private "True = requiere invitación"
        timestamp created_at "Fecha de creación"
        timestamp updated_at "Última edición"
    }

    COMMUNITY_MEMBERS {
        uuid id PK "Identificador de membresía"
        uuid community_id FK "Referencia a COMMUNITIES (Cascade)"
        uuid user_id FK "Referencia a USERS (Cascade)"
        varchar nickname "Apodo interno en el servidor"
        enum role "COMMUNITY_OWNER | COMMUNITY_ADMIN | COMMUNITY_MODERATOR | COMMUNITY_MEMBER"
        timestamp joined_at "Fecha de ingreso"
    }

    CHANNELS {
        uuid id PK "Identificador del canal"
        uuid community_id FK "Referencia a COMMUNITIES (Cascade)"
        varchar name "Nombre slug del canal (ej: dev-backend)"
        varchar topic "Tema o descripción breve"
        enum type "TEXT | VOICE_PREP | ANNOUNCEMENT"
        int position "Orden de visualización en la barra lateral"
        boolean is_private "Restricción de visibilidad"
        timestamp created_at "Fecha de creación"
        timestamp updated_at "Última edición"
    }

    DIRECT_CHATS {
        uuid id PK "Identificador de la conversación 1 a 1"
        timestamp created_at "Fecha de inicio"
        timestamp updated_at "Fecha del último mensaje"
    }

    DIRECT_CHAT_MEMBERS {
        uuid id PK "Identificador de participante"
        uuid direct_chat_id FK "Referencia a DIRECT_CHATS (Cascade)"
        uuid user_id FK "Referencia a USERS (Cascade)"
        timestamp last_read_at "Timestamp de última lectura (check azul)"
        timestamp joined_at "Fecha de unión"
    }

    MESSAGES {
        uuid id PK "Identificador del mensaje"
        uuid sender_id FK "Referencia a USERS (Cascade)"
        uuid channel_id FK "Nullable: Si el mensaje pertenece a un canal"
        uuid direct_chat_id FK "Nullable: Si el mensaje pertenece a un DM"
        uuid parent_message_id FK "Nullable: Si es respuesta en hilo"
        text content "Cuerpo del mensaje en texto plano o markdown"
        enum message_type "TEXT | IMAGE | FILE | AUDIO | SYSTEM | AI_BOT"
        boolean is_edited "Indica si el mensaje fue modificado"
        boolean is_pinned "Mensaje fijado en el canal/chat"
        timestamp created_at "Fecha de envío"
        timestamp updated_at "Fecha de edición"
    }

    ATTACHMENTS {
        uuid id PK "Identificador de archivo adjunto"
        uuid message_id FK "Referencia a MESSAGES (Cascade)"
        varchar original_name "Nombre original del archivo"
        varchar stored_name "Nombre en disco/bucket"
        varchar mime_type "Tipo MIME (ej: image/png, application/pdf)"
        int file_size_bytes "Tamaño en bytes"
        varchar file_url "URL pública de acceso"
        timestamp created_at "Fecha de subida"
    }

    MESSAGE_REACTIONS {
        uuid id PK "Identificador de reacción"
        uuid message_id FK "Referencia a MESSAGES (Cascade)"
        uuid user_id FK "Referencia a USERS (Cascade)"
        varchar emoji "Carácter o código unicode del emoji"
        timestamp created_at "Fecha de reacción"
    }

    AUDIT_LOGS {
        uuid id PK "Identificador de registro"
        uuid user_id FK "Usuario que ejecutó la acción (SetNull)"
        varchar action "Nombre del evento (ej: USER_ROLE_UPDATED)"
        text details "Carga JSON con el contexto del cambio"
        varchar ip_address "IP de origen"
        timestamp created_at "Fecha y hora del evento"
    }
```

---

## 2. Diccionario de Datos y Reglas de Negocio

### 2.1 Matriz de Roles Globales (RBAC)

| Rol Global | Jerarquía | Puede Crear Comunidades | Puede Gestionar Usuarios | Acceso a Auditoría | Uso Común |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **SUPERADMIN** | 5 | ✅ Sí | ✅ Sí (Total) | ✅ Sí | CEO / Directores Generales |
| **ADMIN** | 4 | ✅ Sí | ✅ Sí (Roles < Admin) | ✅ Sí | Administradores de TI / SysAdmins |
| **TECH_LEAD** | 3 | ✅ Sí | ❌ No | ❌ No | Líderes Técnicos / Arquitectos |
| **DEVELOPER** | 2 | ✅ Sí | ❌ No | ❌ No | Desarrolladores Frontend / Backend |
| **GUEST** | 1 | ❌ No | ❌ No | ❌ No | Cuentas de prueba Gmail / QA externo |

---

## 3. Preparación para Funcionalidades Futuras

El esquema fue diseñado proactivamente para soportar las siguientes fases sin necesidad de migraciones destructivas:

1. **Llamadas y Videollamadas (WebRTC):**
   * El enum `ChannelType` incluye `VOICE_PREP` para canales de voz y salas WebRTC.
   * El WebSocket Gateway `/realtime` soporta señalización SDP Offer/Answer y candidatos ICE en salas dedicadas (`room:call_<id>`).
2. **Chatbots e IA Asistente:**
   * El enum `MessageType` incluye `AI_BOT` y los mensajes soportan relaciones recursivas en árbol (`parentMessageId`) para mantener hilos de contexto conversacional con modelos de lenguaje (LLMs).
3. **Almacenamiento en Cloud S3 / MinIO:**
   * La tabla `ATTACHMENTS` almacena metadatos desacoplados (`file_url`, `stored_name`, `mime_type`), permitiendo alternar entre almacenamiento local y AWS S3 / MinIO mediante variables de entorno.

---

## 4. Guía Rápida de Integración Frontend

### Autenticación:
1. `POST /api/auth/login` con `{ "identifier": "dev@syborx.com", "password": "Password123!" }`
2. Guardar `accessToken` en memoria o almacenamiento seguro del cliente.
3. Enviar cabecera `Authorization: Bearer <accessToken>` en cada petición HTTP.

### WebSockets en Tiempo Real:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  auth: { token: accessToken },
});

// Unirse a un canal
socket.emit('channel:join', { channelId: 'uuid-del-canal' });

// Escuchar nuevos mensajes en vivo
socket.on('message:new', (message) => {
  console.log('Nuevo mensaje recibido:', message);
});

// Indicador de "Escribiendo..."
socket.emit('typing:start', { channelId: 'uuid-del-canal' });
socket.on('user:typing', ({ user, isTyping }) => {
  console.log(`${user.displayName} está escribiendo...`);
});
```

### Documentación Interactiva Swagger:
Disponible en `http://localhost:3000/api/docs`.

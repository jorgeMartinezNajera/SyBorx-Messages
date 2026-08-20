# SyBorx-Messenger — Backend Enterprise (PostgreSQL + Docker + NestJS)

Backend de alto rendimiento para la plataforma de mensajería empresarial y espacios de trabajo tipo Discord/Slack **SyBorx-Messenger**, desarrollado con arquitectura modular en capas, PostgreSQL contenedorizado, control de acceso basado en roles (RBAC) y WebSockets en tiempo real.

---

##  Características Principales

* **PostgreSQL & Docker:** Base de datos relacional PostgreSQL 16 ejecutándose en contenedor Docker con migraciones deterministas gestionadas por Prisma ORM.
* **Mensajería 1 a 1 & Comunidades:** Soporte completo para chats directos privados y comunidades con canales temáticos (`#general`, `#dev-backend`, `#anuncios`).
* **Control de Acceso RBAC Jerárquico:**
  * `SUPERADMIN` (CEO/Directores): Control total, auditoría y asignación de roles.
  * `ADMIN`: Gestión de usuarios, activación/desactivación y moderación de servidores.
  * `TECH_LEAD` & `DEVELOPER`: Creación y administración de comunidades de desarrollo.
  * `GUEST` (QA / Gmail de pruebas): Acceso restringido sin capacidad de crear servidores.
* **Gestión de Archivos:** Endpoint multipart para subida y servicio de imágenes, audios y documentos adjuntos a los mensajes.
* **WebSockets en Tiempo Real:** Gateway con Socket.io en el namespace `/realtime` con autenticación JWT, presencia online/offline y tipado de eventos en vivo.
* **Documentación Técnica & ERD:** Diagramas Entidad-Relación interactivos en Mermaid y Swagger OpenAPI interactivo en `/api/docs`.

---

## 🚀 Inicio Rápido (Desarrollo)

### 1. Iniciar PostgreSQL con Docker
```bash
docker compose up -d postgres
```

### 2. Sincronizar Base de Datos y Cargar Datos de Prueba
```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run start:dev
```

* **Swagger API UI:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
* **Healthcheck:** [http://localhost:3001/api/health](http://localhost:3001/api/health)
* **pgAdmin:** [http://localhost:5050](http://localhost:5050)

---

## 👥 Cuentas de Prueba Pre-configuradas (Seed)

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **SUPERADMIN (CEO)** | `ceo@syborx.com` | `Password123!` |
| **ADMIN** | `admin@syborx.com` | `Password123!` |
| **TECH LEAD** | `techlead@syborx.com` | `Password123!` |
| **DEVELOPER** | `dev@syborx.com` | `Password123!` |
| **GUEST (QA Gmail)** | `tester.syborx@gmail.com` | `Password123!` |

---

## 📚 Documentación Técnica Detallada

* **Diagramas Entidad-Relación y Diccionario de Datos:** [`docs/DATABASE_ARCHITECTURE.md`](./docs/DATABASE_ARCHITECTURE.md)
* **Guía de Despliegue en Servidor de Producción:** [`docs/DEPLOYMENT_GUIDE.md`](./docs/DEPLOYMENT_GUIDE.md)

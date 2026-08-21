# 📘 SyBorx Messenger — Reporte Técnico Integral, Estimación de Costos e Integración Cloudflare

**Documento:** Reporte Técnico de Arquitectura, Presupuesto de Desarrollo y Estrategia Cloudflare  
**Versión:** 2.0 Enterprise  
**Fecha:** Agosto 2026  
**Elaborado por:** Equipo de Ingeniería y Arquitectura SyBorx  
**Estado:** Núcleo Funcional y Seguridad Avanzada Implementados y Verificados  

---

## 📑 Tabla de Contenidos
1. [Resumen Ejecutivo y Justificación de Negocio](#1-resumen-ejecutivo-y-justificación-de-negocio)
2. [Arquitectura del Sistema y Stack Tecnológico](#2-arquitectura-del-sistema-y-stack-tecnológico)
3. [Módulos Funcionales y Características Implementadas](#3-módulos-funcionales-y-características-implementadas)
4. [Seguridad y Gobernanza de Acceso Enterprise](#4-seguridad-y-gobernanza-de-acceso-enterprise)
5. [Estimación de Costos de Desarrollo de Software (CAPEX)](#5-estimación-de-costos-de-desarrollo-de-software-capex)
6. [Costos Operativos Mensuales y Anuales de Infraestructura (OPEX)](#6-costos-operativos-mensuales-y-anuales-de-infraestructura-opex)
7. [Análisis Comparativo y Retorno de Inversión (ROI vs SaaS)](#7-análisis-comparativo-y-retorno-de-inversión-roi-vs-saas)
8. [Reporte de Integración con Cloudflare (Seguridad, CDN y Tunnels)](#8-reporte-de-integración-con-cloudflare-seguridad-cdn-y-tunnels)
9. [Conclusiones y Recomendaciones de Despliegue](#9-conclusiones-y-recomendaciones-de-despliegue)

---

## 1. Resumen Ejecutivo y Justificación de Negocio

### 1.1 Visión del Proyecto
**SyBorx Messenger** es una plataforma corporativa de colaboración y mensajería en tiempo real diseñada para centralizar la comunicación operativa, técnica y directiva de la organización. Inspirada en la agilidad de Discord y la estructura empresarial de Slack, la solución combina comunidades segmentadas, canales temáticos (`#general`, `#dev-backend`, `#anuncios`), mensajería directa 1 a 1, presencia en vivo, compartición de archivos y un riguroso control de acceso basado en roles (RBAC).

### 1.2 Justificación de Negocio
* **Soberanía y Privacidad de Datos:** La información confidencial, código fuente, archivos adjuntos y chats residen en infraestructura propia y bases de datos controladas por la empresa, eliminando el riesgo de filtraciones o escaneo de datos por proveedores externos.
* **Ahorro Financiero Recurrente:** El licenciamiento de herramientas SaaS tradicionales (como Slack Business+ a $12.50 USD/mes por usuario o Microsoft Teams) genera costos operativos elevados conforme la plantilla crece. SyBorx Messenger ofrece costo marginal cero por usuario adicional.
* **Control Total de Seguridad y Auditoría:** Políticas de contraseñas adaptadas a los estándares de la empresa (expiración a 6 meses, claves temporales de 24h generadas por administradores y bitácora de auditoría inmutable `AuditLog`).

---

## 2. Arquitectura del Sistema y Stack Tecnológico

### 2.1 Diagrama de Arquitectura de Alto Nivel

```
[ Navegador Web / Cliente SPA (HTML5 + Vanilla CSS Liquid Glass + JS Nativo) ]
                                |
               +----------------+----------------+
               | (HTTPS / WSS)                   | (WebSockets / Socket.io)
               v                                 v
   [ Cloudflare Edge / WAF / Proxy ]    [ Cloudflare Tunnel (Zero Trust) ]
               |                                 |
               +----------------+----------------+
                                |
                                v
               [ Backend API: NestJS 10 Framework ]
                 ├── Módulos: Auth, Users, Admin, Communities, Channels, DirectChats, Messages, Files, Realtime
                 ├── Seguridad: JWT Dual (Access + Refresh hasheado) + RolesGuard (RBAC) + Bcrypt
                 └── Gateway: Socket.io Namespace /realtime (Salas por Canal y Chat)
                                |
                                v
               [ Prisma ORM 5.14 Client Tipado ]
                                |
                                v
               [ PostgreSQL 16 Enterprise Database (Docker) ]
                 └── 11 Tablas Relacionales + Índices + UUIDs + Borrado en Cascada
```

### 2.2 Stack Tecnológico Seleccionado

| Capa | Tecnología | Versión | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Backend Core** | **NestJS (Node.js + TypeScript)** | 10.3 / 5.4 | Arquitectura modular enterprise, inyección de dependencias, tipado estricto y alta concurrencia. |
| **Base de Datos** | **PostgreSQL** | 16.0 (Docker) | Motor relacional robusto con soporte ACID, alta integridad transaccional y bajo consumo en contenedores. |
| **ORM** | **Prisma** | 5.14 | Generación automática de migraciones, tipado de consultas y prevención de inyecciones SQL. |
| **Tiempo Real** | **Socket.io** | 4.7.5 | WebSockets bidireccionales con reconexión automática, gestión de salas y autenticación JWT en handshake. |
| **Frontend** | **Vanilla HTML5 / CSS3 / ES6+** | Nativo | Cero sobrecarga de frameworks pesados (React/Angular), carga ultrarrápida (<50ms), diseño *Liquid Glass* responsivo. |
| **Seguridad** | **Bcrypt & Passport JWT** | 5.1 / 4.0 | Cifrado unidireccional con coste computacional configurable y validación estricta de tokens. |
| **Documentación** | **Swagger / OpenAPI** | 7.3 | Generación automática de especificación interactiva en `/api/docs`. |

---

## 3. Módulos Funcionales y Características Implementadas

### 3.1 Gestión de Comunidades y Canales Grupales
* **Espacios de Trabajo (Comunidades):** Permite a los líderes e ingenieros crear comunidades privadas o públicas con canales organizados por temas.
* **Checklist de Miembros al Crear:** Al crear un grupo o comunidad, el usuario dispone de un selector múltiple interactivo con avatares para agregar a los compañeros deseados en un solo paso.
* **Eliminación Segura:** Opción en cabecera para que los administradores del servidor (`COMMUNITY_OWNER` / `COMMUNITY_ADMIN`) eliminen canales o servidores obsoletos previa confirmación.

### 3.2 Mensajería Directa (1 a 1) y Directorio de Contactos
* **Separación de Vistas:** Pestaña **Mensajes Recientes** (solo chats con actividad real) vs. Pestaña **Directorio Global** (todos los colaboradores de la empresa).
* **Buscador en Tiempo Real:** Barra de búsqueda que filtra instantáneamente por nombre, usuario, correo o rol laboral.

### 3.3 Compartición y Galería Multimedia
* **Carga de Adjuntos:** Subida de imágenes (`PNG`, `JPG`, `GIF`, `WebP`) y documentos (`PDF`, `DOCX`, `XLSX`, `ZIP`, `TXT`) con soporte para múltiples archivos a la vez.
* **Visor de Archivos Compartidos:** Botón en la cabecera del chat que despliega una galería interactiva con previsualización de imágenes, detalles de quién envió el archivo, fecha y descarga directa.

### 3.4 Experiencia en Tiempo Real
* **Presencia Dinámica:** Detección de estado (`ONLINE`, `IDLE`, `DND`, `OFFLINE`).
* **Indicador de Escritura:** Feedback visual dinámico (*"X está escribiendo..."*).
* **Notificación Sonora y Visual:** Animación de destello (*pulse-glow*) y sonido cristalino al recibir mensajes nuevos.

---

## 4. Seguridad y Gobernanza de Acceso Enterprise

### 4.1 Matriz de Control de Acceso Basado en Roles (RBAC)

| Rol Global | Nivel | Permisos Principales |
| :--- | :---: | :--- |
| **`SUPERADMIN` (CEO)** | 5 | Control total del sistema, gestión global de usuarios, auditoría completa y eliminación de servidores. |
| **`ADMIN`** | 4 | Generación de claves temporales, activación/desactivación de cuentas, cambio de roles y moderación. |
| **`TECH_LEAD`** | 3 | Creación de comunidades de ingeniería, gestión de canales técnicos y asignación de tareas. |
| **`DEVELOPER`** | 2 | Creación de canales en sus comunidades, envío de mensajes, archivos y colaboración en tiempo real. |
| **`GUEST`** | 1 | Acceso restringido de solo lectura/escritura en canales públicos designados. |

### 4.2 Políticas de Contraseñas y Recuperación Administrativa
1. **Validación de Fuerza en Tiempo Real:** Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo especial (`!@#$%^&*...`).
2. **Expiración Semestral Obligatoria:** Si la contraseña tiene más de 180 días de antigüedad, el sistema bloquea el acceso y obliga al usuario a actualizarla.
3. **Claves Temporales Administrativas de 24 Horas:**
   * Un administrador genera una clave criptográfica de 1 solo uso (ej. `SyB%dKekzc97!`).
   * Al iniciar sesión con esta clave, el sistema abre forzosamente el modal de cambio de contraseña impidiendo cualquier otra acción hasta que el usuario defina su nueva clave privada.
   * Todos los eventos quedan registrados en la tabla `AuditLog`.

---

## 5. Estimación de Costos de Desarrollo de Software (CAPEX)

A continuación se detalla la estimación económica basada en estándares de la industria del software para el diseño, desarrollo, pruebas y puesta en marcha de un producto con este nivel de madurez técnica y arquitectura empresarial:

### 5.1 Desglose de Horas Hombre por Especialidad

| Especialidad / Rol | Tareas Realizadas | Horas Estimadas | Tarifa Hora (USD) | Total (USD) |
| :--- | :--- | :---: | :---: | :---: |
| **Arquitecto de Software / Cloud** | Diseño de base de datos relacional, modelado Prisma, definición de protocolos WebSockets y seguridad JWT. | 40 hrs | $55 / hr | $2,200.00 |
| **Senior Backend Engineer** | Desarrollo de 10 módulos NestJS, controladores REST, servicios de negocio, DTOs, validaciones y gateway Socket.io. | 110 hrs | $45 / hr | $4,950.00 |
| **Senior Frontend / UI Engineer** | Diseño visual *Liquid Glass*, maquetación CSS3, lógica de estado SPA, integración de WebSockets y visor multimedia. | 90 hrs | $40 / hr | $3,600.00 |
| **Especialista en Seguridad & QA** | Pruebas de integración E2E, auditoría de endpoints, políticas de contraseñas, sanitización y prevención de inyecciones. | 35 hrs | $40 / hr | $1,400.00 |
| **DevOps & Infraestructura** | Dockerización, docker-compose multi-entorno, configuración PostgreSQL y scripts de despliegue. | 25 hrs | $45 / hr | $1,125.00 |
| **Documentación Técnica & PM** | Redacción de diagramas ERD, especificación Swagger, manual de despliegue y gestión del proyecto. | 20 hrs | $35 / hr | $700.00 |
| **TOTAL DESARROLLO (CAPEX)** | **Proyecto Llave en Mano Completo** | **320 hrs** | — | **$13,975.00 USD** |

*(Equivalente aproximado en Moneda Nacional: **~$251,550.00 MXN**)*

---

## 6. Costos Operativos Mensuales y Anuales de Infraestructura (OPEX)

El despliegue de SyBorx Messenger puede realizarse de forma sumamente eficiente en infraestructura propia (On-Premise) o en la nube (Cloud VPS):

### 6.1 Escenario 1: Nube Moderna (DigitalOcean / AWS / Hetzner)

| Componente | Especificaciones | Proveedor Recomendado | Costo Mensual (USD) | Costo Anual (USD) |
| :--- | :--- | :--- | :---: | :---: |
| **Servidor de Aplicación (Compute)** | 4 vCPU, 8 GB RAM, 160 GB NVMe SSD | Hetzner Cloud / DigitalOcean | $24.00 | $288.00 |
| **Base de Datos PostgreSQL** | PostgreSQL 16 contenedorizado con backups diarios | Incluido en servidor | $0.00 | $0.00 |
| **Almacenamiento de Adjuntos** | Cloudflare R2 (100 GB con Zero Egress Fees) | Cloudflare R2 | $1.50 | $18.00 |
| **Dominio y Seguridad WAF** | Dominio `.com` + Cloudflare DNS/Proxy | Cloudflare Registrar | $1.00 | $12.00 |
| **TOTAL INFRAESTRUCTURA CLOUD** | **Soporta de 100 a 500 usuarios concurrentes** | — | **$26.50 / mes** | **$318.00 / año** |

### 6.2 Escenario 2: Servidor Físico On-Premise (Oficina / Datacenter Local)
* **Costo de Servidor:** $0.00 adicional (utilizando servidor existente con Docker).
* **Costo de Conectividad con Cloudflare Tunnel:** **$0.00 / mes** (100% Gratuito sin IP pública estática).

---

## 7. Análisis Comparativo y Retorno de Inversión (ROI vs SaaS)

Comparativa económica para una organización con **50 usuarios activos** en un horizonte de 3 años:

| Concepto | Slack Business+ | Microsoft Teams Phone/Ent | SyBorx Messenger (Propio) |
| :--- | :---: | :---: | :---: |
| **Costo por usuario / mes** | $12.50 USD | $10.00 USD | **$0.00 USD** |
| **Costo Mensual (50 usuarios)** | $625.00 USD | $500.00 USD | **$26.50 USD** |
| **Costo Anual (Año 1)** | $7,500.00 USD | $6,000.00 USD | $318.00 USD *(+$13,975 desarrollo)* |
| **Costo Total a 3 Años** | **$22,500.00 USD** | **$18,000.00 USD** | **$14,929.00 USD** |
| **Ahorro Neto en 3 Años** | — | — | **+$7,571.00 USD (~$136,000 MXN)** |
| **Ahorro a partir del Año 4** | — | — | **>$7,000.00 USD / año en ahorro puro** |

> 💡 **Conclusión Financiera:** El proyecto alcanza su **punto de equilibrio (Break-even) en menos de 24 meses**, generando a partir de allí un ahorro recurrente del 95% en gastos de software de comunicación corporativa.

---

## 8. Reporte de Integración con Cloudflare (Seguridad, CDN y Tunnels)

La integración de **Cloudflare** como capa perimetral dota a SyBorx Messenger de seguridad de grado militar, alta disponibilidad y acceso remoto sin exponer la red local.

```
[ Usuario Remoto / Móvil ]
            |
            v  (HTTPS / TLS 1.3)
[ Cloudflare Global Edge Network (275+ Ciudades) ]
  ├── 1. Cloudflare DNS Anycast (Resolución en <5ms)
  ├── 2. Cloudflare DDoS Protection (Capacidad de mitigación >190 Tbps)
  ├── 3. Cloudflare WAF & Bot Management (Reglas de protección de API)
  └── 4. Cloudflare Zero Trust Network
            |
            v  (Túnel cifrado WireGuard / QUIC de salida únicamente)
[ cloudflared Daemon (En Servidor Local) ]
            |
            v  (localhost:3001)
[ NestJS SyBorx Messenger ]
```

### 8.1 Pilares de la Integración Cloudflare

#### 1. Cloudflare Tunnel (Zero Trust / `cloudflared`)
* **Acceso Seguro sin Abrir Puertos:** Tradicionalmente, publicar un servidor en internet requería abrir puertos en el módem/router (Port Forwarding al puerto 80/443) y contratar una IP pública estática. Con Cloudflare Tunnel, el agente `cloudflared` establece una conexión cifrada saliente hacia la red de Cloudflare.
* **Beneficio:** La IP de la oficina permanece 100% invisible para atacantes en internet. No hay superficie de ataque abierta en el firewall local.

#### 2. Protección Anti-DDoS y Web Application Firewall (WAF)
* Mitigación instantánea de ataques volumétricos de denegación de servicio (DDoS en Capas 3, 4 y 7).
* **Rate Limiting:** Regla automática para bloquear IPs que intenten más de 5 intentos fallidos por minuto en `/api/auth/login`, previniendo ataques de fuerza bruta.

#### 3. Soporte de WebSockets de Ultra Baja Latencia
* Cloudflare soporta nativamente el protocolo WebSockets (`wss://`), manteniendo conexiones persistentes optimizadas entre los clientes y el gateway `/realtime` de NestJS con compresión de cabeceras.

#### 4. Almacenamiento de Archivos con Cloudflare R2 (S3 Compatible)
* Almacenamiento de objetos idéntico a AWS S3 pero con **cero costo por ancho de banda de descarga (Zero Egress Fees)**.
* Los usuarios pueden descargar archivos adjuntos e imágenes de forma ilimitada sin cargos sorpresivos en la factura de la nube.

### 8.2 Matriz de Costos de la Suite Cloudflare

| Módulo Cloudflare | Plan | Costo Estimado | Beneficio Aportado |
| :--- | :--- | :---: | :--- |
| **Cloudflare DNS & Proxy** | Free Tier | **$0.00 / mes** | Anti-DDoS ilimitado, DNS Anycast y certificados SSL/TLS automáticos. |
| **Cloudflare Tunnel (Zero Trust)** | Free Tier (hasta 50 usuarios) | **$0.00 / mes** | Conexión segura a internet sin IP fija ni apertura de puertos en la red. |
| **Cloudflare WAF / Rate Limiting** | Free / Pro ($20/mes opcional) | **$0.00 - $20.00 / mes** | Reglas de firewall y límite de peticiones en autenticación. |
| **Cloudflare R2 Object Storage** | Pay-as-you-go | **$0.015 / GB-mes** (~$1.50/mes por 100 GB) | Cero costo por tráfico saliente en descargas de archivos. |
| **TOTAL CLOUDFLARE** | — | **~$1.50 a $21.50 / mes** | **Seguridad perimetral y conectividad de nivel mundial.** |

---

## 9. Conclusiones y Recomendaciones de Despliegue

1. **Madurez del Sistema:** SyBorx Messenger cuenta con su arquitectura base 100% operativa, habiendo sido validado el flujo de extremo a extremo (registro, login, RBAC, comunidades, canales, chats privados, subida de archivos, tiempo real, búsqueda y auditoría).
2. **Eficiencia en Costos:** El desarrollo a medida representa un ahorro significativo a mediano plazo frente a suscripciones SaaS comerciales, otorgando además control absoluto sobre la privacidad de las comunicaciones de la empresa.
3. **Despliegue Recomendado:**
   * En producción, utilizar **Docker Compose** con volúmenes persistentes para PostgreSQL y uploads.
   * Utilizar **Cloudflare Tunnel (`cloudflared`)** para conectar el servidor interno con el dominio corporativo seguro (`https://messenger.syborx.com`) con HTTPS automático.

---
*Reporte generado por SyBorx Team — Propiedad de Ingeniería SyBorx.*

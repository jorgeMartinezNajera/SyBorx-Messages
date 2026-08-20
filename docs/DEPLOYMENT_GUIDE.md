# Guía de Despliegue y Puesta en Producción: SyBorx-Messenger

Esta guía describe el procedimiento para levantar y desplegar el backend de **SyBorx-Messenger** tanto en un entorno local como en un servidor Linux de producción (VPS / Cloud / On-Premise).

---

## 1. Requisitos Previos

* **Docker Engine** (v24+ recomendado)
* **Docker Compose** (v2+ o plugin compose)
* **Node.js** (v20+ si se ejecuta fuera de contenedores)

---

## 2. Despliegue en Servidor con Docker Compose (Recomendado)

### Paso 1: Clonar y configurar variables de entorno
```bash
git clone <URL_DEL_REPOSITORIO>
cd SyBorx-Messenger

# Copiar plantilla de entorno
cp .env.example .env

# Editar secretos de producción en .env:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - DB_PASSWORD
```

### Paso 2: Levantar el stack completo de producción
El archivo `docker-compose.prod.yml` construye la imagen optimizada multi-stage, inicializa PostgreSQL con volúmenes persistentes y ejecuta automáticamente las migraciones pendientes de Prisma:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Paso 3: Ejecutar el Seed inicial de datos (Opcional para pruebas)
```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### Paso 4: Comprobación de estado
```bash
# Ver estado de los contenedores
docker compose -f docker-compose.prod.yml ps

# Ver logs en vivo
docker compose -f docker-compose.prod.yml logs -f app

# Probar Health Check
curl http://localhost:3000/api/health
```

---

## 3. Despliegue Local para Desarrollo

### Paso 1: Levantar solo PostgreSQL en Docker
```bash
docker compose up -d postgres
```

### Paso 2: Instalar dependencias y ejecutar migraciones
```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

### Paso 3: Iniciar servidor en modo desarrollo (Hot-Reload)
```bash
npm run start:dev
```

* Swagger API UI: `http://localhost:3000/api/docs`
* Health Check: `http://localhost:3000/api/health`
* pgAdmin (Gestor visual de BD): `http://localhost:5050` (Email: `admin@syborx.com`, Pass: `admin_password_123`)

---

## 4. Usuarios de Prueba Preconfigurados (Seed)

| Rol | Correo | Usuario | Contraseña |
| :--- | :--- | :--- | :--- |
| **SUPERADMIN (CEO)** | `ceo@syborx.com` | `ceo_syborx` | `Password123!` |
| **ADMIN (SysAdmin)** | `admin@syborx.com` | `admin_syborx` | `Password123!` |
| **TECH_LEAD** | `techlead@syborx.com` | `techlead_edgar` | `Password123!` |
| **DEVELOPER (Frontend)** | `dev@syborx.com` | `dev_alex` | `Password123!` |
| **GUEST (QA Gmail)** | `tester.syborx@gmail.com` | `tester_gmail` | `Password123!` |

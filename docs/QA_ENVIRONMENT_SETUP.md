# 🚀 Guía de Despliegue y Configuración del Ambiente QA (`zzaly`)

**Sprint:** 13/10 — Estabilización de QA y Corrección de Catálogo  
**Perfil:** DevOps & Backend QA  
**Fecha:** 13 de Octubre de 2026  
**Ambiente:** QA (Testing & Homologación)

---

## 📌 Resumen Ejecutivo
Esta guía detalla los pasos requeridos para inicializar la base de datos de PostgreSQL en Supabase QA, configurar el servicio web en Render apuntando a la rama `qa` y aprovisionar todas las variables de entorno de forma segura.

---

## 1. Configuración de Base de Datos en Supabase QA

### 1.1 Conectividad y Parámetros de Red
* **Host:** `aws-1-us-west-2.pooler.supabase.com`
* **Puerto:** `5432` (Session Pooler IPv4)
* **Base de Datos:** `postgres`
* **Usuario:** `postgres.emijvzumlwggpcpxhmug`
* **Contraseña:** `*17%K51OWk57` *(Codificada en URL como `*17%25K51OWk57` para evitar error `URI malformed`)*
* **SSL:** Requerido (`ssl: true` / `rejectUnauthorized: false`)

### 1.2 Ejecución del Script Integral de Base de Datos QA (`seed_qa.sql`)
El script [`server/db/seeds/seed_qa.sql`](file:///c:/Users/marro/Desktop/Ecommerce/server/db/seeds/seed_qa.sql) es **autocontenido y completo al 100%**. No requiere ejecutar `schema.sql` previamente, ya que incluye:
* **Extensiones:** `uuid-ossp`.
* **Tipos / ENUMs:** `order_status`, `payment_status`, `discount_type`.
* **10 Tablas de Producción + QA:** `zz_categories`, `zz_products`, `zz_product_variants`, `zz_product_images`, `zz_promo_codes`, `zz_orders`, `zz_order_items`, `zz_payments`, `zz_admins`, `zz_users`.
* **Triggers:** `update_modified_column()` activo en todas las tablas con `updated_at`.
* **Procedimiento Almacenado ACID:** `process_checkout` con bloqueo transaccional `SELECT ... FOR UPDATE`, descuento de inventario, snapshot de items y aplicación de cupones.
* **Índices de Alto Rendimiento:** 11 índices de búsqueda y llaves foráneas.
* **Semilla QA:** Datasets DS-01 y DS-02, color **Negro** explícito, usuarios QA y cupones QA.

#### Método A: Desde Supabase SQL Editor (Recomendado)
1. Inicia sesión en la consola de [Supabase](https://supabase.com/dashboard).
2. Selecciona el proyecto correspondiente al ambiente de QA (`emijvzumlwggpcpxhmug`).
3. En la barra de navegación lateral izquierda, haz clic en el ícono de **SQL Editor**.
4. Haz clic en el botón superior **+ New Query** (o presiona `Ctrl + N`).
5. Abre el archivo local [`server/db/seeds/seed_qa.sql`](file:///c:/Users/marro/Desktop/Ecommerce/server/db/seeds/seed_qa.sql), copia todo su contenido y pégalo en el editor de Supabase.
6. Presiona el botón verde **Run** (o presiona `Ctrl + Enter`).
7. **Verificación de Salida:** En la pestaña *Results*, verifica la tabla de resumen con las 10 tablas, triggers, procedure y registros creados.

#### Método B: Vía Script de Node.js (Terminal)
Una vez configuradas las credenciales de base de datos en `server/.env`, puedes ejecutar la provisión completa directamente desde la consola del backend:
```bash
npm run seed:qa
```

---

## 2. Configuración del Servicio Web en Render

### 2.1 Creación o Configuración del Servicio
1. Accede al [Dashboard de Render](https://dashboard.render.com).
2. Localiza o crea un nuevo **Web Service**:
   * **Repository:** `https://github.com/DanielMarroquin1/Ecommerce` (o conexión GitHub del proyecto)
   * **Branch:** `qa`
   * **Name:** `ecommerce-backend-qa`
   * **Region:** `Oregon (US West)` (misma región que el pooler de Supabase para baja latencia)
   * **Runtime:** `Node`
   * **Root Directory:** `server`
   * **Build Command:** `npm install`
   * **Start Command:** `node index.js`
   * **Plan Type:** `Free` (o el asignado para pruebas de equipo)

### 2.2 Tabla Completa de Variables de Entorno en Render
En la pestaña **Environment** de tu servicio web en Render, configura las siguientes variables clave-valor:

| Variable | Valor en Ambiente QA | Obligatoria | Justificación Técnica |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | `postgresql://postgres.emijvzumlwggpcpxhmug:*17%25K51OWk57@aws-1-us-west-2.pooler.supabase.com:5432/postgres` | **SÍ** | Conexión directa al Session Pooler IPv4 de Supabase QA. El `%` codificado como `%25` evita excepciones de parseo URI en Node.js. |
| `DB_SSL` | `true` | **SÍ** | Activa la capa TLS/SSL en el pool de PostgreSQL. |
| `NODE_ENV` | `qa` | **SÍ** | Define el perfil operativo como QA. Asegura que SSL no se desactive accidentalmente. |
| `PORT` | `5000` | **SÍ** | Puerto interno de escucha del servidor Express. |
| `JWT_SECRET` | `super_secret_jwt_qa_key_2026_zzaly` | **SÍ** | Firma criptográfica para tokens de autenticación. La API abortará si falta este valor. |
| `ADMIN_PASSWORD` | `AdminQA_SecurePass2026!` | **SÍ** | Requerido para la ejecución del script de semilla administrativa `node db/seed_admin.js`. |
| `FRONTEND_URL` | `https://ecommerce-frontend-qa.netlify.app` | No | Origen habilitado para políticas de CORS en navegadores. |

---

## 3. Matriz de Cuentas y Cupones QA para Pruebas

### 3.1 Cuentas de Acceso Preconfiguradas
| Correo | Rol | Contraseña en Texto Plano | Destino / Flujo de Prueba |
| :--- | :---: | :--- | :--- |
| `admin.qa@zzaly.com` | `admin` | `AdminQA_SecurePass2026!` | Redirección a `/admin/dashboard`, gestión de catálogo y reportes. |
| `cliente.qa@zzaly.com` | `customer` | `ClienteQA_SecurePass2026!` | Redirección a tienda, checkout y consulta de órdenes en `/api/customers/me/orders`. |

### 3.2 Cupones de Prueba en QA
| Código | Descuento | Estado | Vigencia | Comportamiento Esperado |
| :--- | :---: | :---: | :--- | :--- |
| `ZZALY10` | 10% | Activo | Vigente hoy | **Aceptado (200/201):** Aplica 10% sobre subtotal. |
| `VERANO25` | 25% | Activo | Vigente hoy | **Aceptado (200/201):** Aplica 25% sobre subtotal. |
| `FUTURO15` | 15% | Activo | Futuro (+30 días) | **Rechazado (400/422):** *"Cupón vencido o no válido"*. |
| `INACTIVO5` | 5% | Inactivo | Pasado (-30 días) | **Rechazado (400/422):** *"Cupón vencido o no válido"*. |
| `QA100` | 100% | Activo | Vigente hoy | **Aceptado (200/201):** Total = $0.00 para pruebas de checkout sin pasarela de cobro. |

---

## 4. Pruebas de Humo (Smoke Tests) Post-Despliegue

Una vez completado el despliegue en Render, valida el estado del backend ejecutando los siguientes comandos cURL:

### 4.1 Health Check
```bash
curl -i https://ecommerce-backend-qa.onrender.com/api/health
```
* **Esperado:** `HTTP 200 OK` con `{"status":"ok", "timestamp":"..."}`.

### 4.2 Verificación de Producto Inactivo (404)
```bash
curl -i https://ecommerce-backend-qa.onrender.com/api/products/vestido-descatalogado-qa
```
* **Esperado:** `HTTP 404 Not Found` con `{"error":"Producto no encontrado o inactivo"}`.

### 4.3 Verificación de Filtro Talla + Color + Stock
```bash
curl -i "https://ecommerce-backend-qa.onrender.com/api/products?size=XL&color=Negro"
```
* **Esperado:** `HTTP 200 OK` con un array vacío `[]` (ya que la combinación XL + Negro tiene stock 0).

### 4.4 Validación de Cupón con Espacios en Blanco (.trim())
```bash
curl -i -X POST https://ecommerce-backend-qa.onrender.com/api/promos/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "  zzaly10  ", "subtotal": 100}'
```
* **Esperado:** `HTTP 200 OK` con `code: "ZZALY10"` y `discount_value: 10`.

---

## 5. Contacto y Soporte de Sprint
* **DevOps / QA Lead:** Equipo de Infraestructura y Calidad
* **Líder Frontend:** Francisco Sánchez

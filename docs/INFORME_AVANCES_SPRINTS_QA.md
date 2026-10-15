# 📑 Informe de Avances de Sprints — Backend, Infraestructura QA y Calidad
## Proyecto: `zzaly` E-Commerce API
**Responsable (RACI A/R):** Daniel Marroquín (Senior Backend & DevOps Lead)  
**Destinatarios:** Equipo de Desarrollo, Líder Frontend (Francisco Sánchez), QA Lead (Diego) & Stakeholders  
**Periodo de Ejecución:** 13 de Octubre al 15 de Octubre de 2026 (Preparación para pase a pruebas el 16/10)  
**Versión de Entrega:** 1.2.0-qa  

---

## 🧭 Resumen Ejecutivo y Matriz RACI del Backend

En el marco del plan de estabilización del backend para el pase a pruebas de calidad (QA), se presenta el registro cronológico y técnico de los avances estructurados en tres jornadas de sprint diario (13/10, 14/10 y 15/10). Como responsable **Accountable/Responsible (A/R)** del ambiente QA, el aprovisionamiento de datos de prueba y la mitigación de defectos de backend, se garantizó la entrega de una API transaccional robusta, protegida contra fraude, idempotente y sanitizada contra fugas de información.

### Matriz de Responsabilidad Operativa (RACI)
| Función / Entregable | Daniel Marroquín (Backend) | Francisco Sánchez (Frontend) | Diego (QA Lead) |
| :--- | :---: | :---: | :---: |
| Aprovisionamiento de BD QA (Supabase) y Render Web Service | **A / R** | I | C |
| Definición de Datasets (DS-01, DS-02) y Cupones QA | **R** | I | **A / C** |
| Firma de Contrato de API (Checkout, Login, Clientes) | **A / R** | **C** | I |
| Motor Transaccional ACID e Idempotencia (CP-23) | **A / R** | I | C |
| Control de Acceso RBAC y Protección CP-36 | **A / R** | I | C |
| Validaciones de Negocio (400/409) y Máquina de Estados | **A / R** | I | C |
| Sanitización de Errores (NF-06) y Bypass de Rate Limit (NF-02) | **A / R** | I | I |

*Simbología: **A** = Accountable (Rinde cuentas), **R** = Responsible (Ejecuta), **C** = Consulted (Consultado), **I** = Informed (Informado).*

---

## 📅 SPRINT 13/10: Ambiente, Infraestructura QA y Catálogo Base
> **Objetivo:** Desbloquear al equipo completo mediante la provisión del ambiente QA en la nube, rotación de secretos, carga de semillas de datos DS-01/DS-02, alineación del contrato de API con Frontend y corrección de defectos de catálogo.

### 1.1 Infraestructura de Servidor y Base de Datos Separada
* **Base de Datos Dedicada:** Se provisionó un proyecto aislado en **Supabase** exclusivo para QA (`aws-1-us-west-2.pooler.supabase.com:5432/postgres`), desacoplado de los datos de desarrollo local.
* **Servicio Web en Render:** Se configuró el Web Service `ecommerce-backend-qa` conectado a la rama `qa` del repositorio Git.
* **SSL Configurable en `pool.js`:**
  - *Problema previo:* `pool.js` desactivaba SSL si `NODE_ENV === 'development'`, impidiendo que desarrolladores locales se conectaran a Supabase con SSL si no alteraban el código.
  - *Solución:* Se implementó precedencia estricta para la variable `DB_SSL`. Si `DB_SSL=true`, se activa SSL (`rejectUnauthorized: false`) sin importar el entorno; si `DB_SSL=false`, se desactiva permitiendo PostgreSQL local sin cifrado.

### 1.2 Seguridad, Rotación y Gestión de Secretos
* **Eliminación de Contraseña Hardcodeada:** Se eliminó la contraseña fija en `server/db/seed_admin.js` y ahora se exige obligatoriamente a través de la variable `ADMIN_PASSWORD`.
* **Protección de Firma Criptográfica (`JWT_SECRET`):** Se erradicó cualquier valor por defecto o fallback en texto plano. En `server/index.js`, el backend valida en el arranque la existencia de `JWT_SECRET`; si no existe, el proceso aborta inmediatamente con código de salida 1.

### 1.3 Semilla Integral de Datos QA (`seed_qa.sql`)
Se diseñó e implementó el script autocontenido `server/db/seeds/seed_qa.sql` siguiendo las especificaciones entregadas por Diego (QA Lead):
* **Dataset DS-01 (Catálogo Activo):** 6 productos principales y 6 categorías con stock positivo.
* **Dataset DS-02 (Producto Inactivo para Pruebas 404):** `Vestido Descatalogado QA` (`slug: vestido-descatalogado-qa`, `is_active: false`).
* **Variantes con Color Negro Explícito:** 16 variantes registradas en catálogo con `#111111` y combinaciones con stock agotado (ej. talla `XL` + color `Negro` con stock 0).
* **Cuentas de Acceso Preconfiguradas:**
  - `admin.qa@zzaly.com` / `AdminQA_SecurePass2026!` (Rol `admin`)
  - `cliente.qa@zzaly.com` / `ClienteQA_SecurePass2026!` (Rol `customer`)
* **Matriz de Cupones QA:**
  1. `ZZALY10`: 10% descuento, activo, vigente.
  2. `VERANO25`: 25% descuento, activo, vigente.
  3. `FUTURO15`: 15% descuento, inicio en +30 días (no vigente).
  4. `INACTIVO5`: 5% descuento, expirado hace 30 días y marcado inactivo.
  5. `QA100`: 100% descuento, activo (para pruebas de checkout $0.00).

### 1.4 Acuerdo de Contrato de API (Frontend / Backend)
En reunión técnica matutina con **Francisco Sánchez (Líder Frontend)**, se publicó y firmó el documento `docs/API_CONTRACT_QA.md`:
* Formato exacto de respuesta de autenticación (`POST /api/auth/login`) conteniendo `{ token, user: { id, email, name, role } }`.
* Especificación del payload del checkout requiriendo `items`, `customer`, `shippingAddress` y `couponCode`.
* Estandarización de códigos de estado HTTP esperados por la UI.

### 1.5 Correcciones en Catálogo y Lógica de Cupones
* **Filtro Estricto de Productos Activos (`GET /api/products`):** Cláusula `WHERE p.is_active = true`. Los productos descatalogados nunca son expuestos.
* **Detalle de Producto (`GET /api/products/:id`):** Si un producto tiene `is_active = false` o no existe, retorna inmediatamente `HTTP 404 Not Found` con `{ "error": "Producto no encontrado o inactivo" }`.
* **Filtro Combinado Talla + Color:** La consulta SQL exige `pv.stock > 0` cuando se combinan ambos parámetros (ej. `?size=XL&color=Negro` retorna un array vacío `[]`).
* **Lógica de Validación de Cupones (`POST /api/promos/validate`):**
  - Aplicación de `.trim()` y `.toUpperCase()`.
  - Validación de vigencia: `valid_from <= NOW()` y `valid_until >= NOW()`.
  - Mensaje unificado de rechazo: si no existe, está inactivo, aún no inicia o expiró, responde `HTTP 400 Bad Request` con el mensaje exacto: `"Cupón vencido o no válido"`.

---

## 📅 SPRINT 14/10: Motor de Checkout, Cuentas de Clientes y Autorización
> **Objetivo:** Garantizar la integridad transaccional de compras, impedir fraude de precios desde cliente, implementar idempotencia contra peticiones duplicadas y aislar el módulo de clientes con control RBAC.

### 2.1 Procesamiento de Checkout Transaccional (ACID)
* **Recálculo de Precios 100% Server-Side:**
  - El backend ignora precios, subtotales o totales enviados en el payload del frontend.
  - Para cada artículo en `items`, consulta la variante en la base de datos (`zz_product_variants` unida a `zz_products`), extrae el precio autoritativo, valida la existencia y verifica que `is_active = true`.
  - Recalcula el subtotal, evalúa las reglas del cupón aplicado (descuento porcentual o monto fijo) y calcula el total final matemáticamente.
* **Validación de Entradas:**
  - Middleware `validateCheckout` exige carrito con items válidos.
  - Valida formato de correo mediante expresión regular estricta.
  - Valida formato de teléfono de exactamente **8 dígitos numéricos** (`/^[0-9]{8}$/`). Retorna `400 Bad Request` ante inconsistencias.
* **Idempotencia de Órdenes (Caso de Prueba CP-23):**
  - Admite el header `Idempotency-Key` (o campo equivalente en body).
  - Al recibir una solicitud con clave existente, recupera la orden previamente creada y responde con `HTTP 200 OK` y el atributo `idempotent: true`, evitando la duplicación de pedidos por doble clic o reintentos de red.
  - Manejo de concurrencia: captura error PostgreSQL `23505` (violación de unicidad en índice `idx_orders_idempotency_key`) para retornar la orden original sin colapsar la conexión.
* **Identificador de Orden Legible:**
  - Generación automática de números amigables para el cliente con formato `ORD-YYYYMM-XXXX` (ej. `ORD-202610-7EH8`), almacenados en la columna `order_number`.

### 2.2 Módulo de Clientes (`zz_customers`)
* **Migración y Tabla Dedicada:** Creación de la tabla `zz_customers` con índices optimizados sobre `LOWER(email)`.
* **Registro Seguro (`POST /api/customers/register`):**
  - Hasheo criptográfico con `bcrypt` (12 salt rounds).
  - Política de contraseña: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número.
  - Retorna `HTTP 201 Created` con el token JWT de sesión.
* **Autenticación Unificada y Específica:**
  - `POST /api/customers/login` autentica clientes contra `zz_customers`.
  - `POST /api/auth/login` unifica la búsqueda en cascada (`zz_customers` $\rightarrow$ `zz_users` $\rightarrow$ `zz_admins`), inyectando en el token y payload el atributo `role: "customer"` o `role: "admin"`.
* **Historial de Órdenes (`GET /api/customers/me/orders`):**
  - Endpoint protegido que extrae la identidad del cliente mediante su token JWT y retorna la lista cronológica de sus pedidos con snapshot de artículos, direcciones y montos.

### 2.3 Control de Acceso Basado en Roles (RBAC — CP-36)
* **Middleware `isAdmin`:**
  - Se configuró la verificación estricta de `decoded.role === 'admin'`.
  - Si un usuario autenticado con rol `customer` intenta acceder a cualquier ruta administrativa (`/api/admin/*`), el middleware intercepta la petición y responde **`HTTP 403 Forbidden`** con el mensaje exacto:
    `"Acceso denegado: se requieren privilegios de administrador para realizar esta acción"`.

---

## 📅 SPRINT 15/10: Robustez, Validaciones de Negocio y Calidad
> **Objetivo:** Eliminar errores 500 no controlados, implementar la máquina de estados de órdenes con soporte de `paid`, sanitizar excepciones hacia clientes y blindar los límites de peticiones para pruebas de carga y QA.

### 3.1 Mitigación de Excepciones 500 (Validaciones 400 y 409)
* **Gestión de Catálogo Administrativo:**
  - `POST /api/admin/products` y `PUT /api/admin/products/:id`: validan `name` obligatorio, `price > 0` y `stock >= 0` en todas las variantes antes de iniciar la transacción SQL. Si la validación falla, retorna `400 Bad Request`.
  - Colisión de slugs únicos captura error de base de datos y responde `409 Conflict`.
* **Gestión de Promociones Administrativas:**
  - `POST /api/admin/promos`:
    * Valida código no vacío y tipo de descuento.
    * Valida que el descuento porcentual esté estrictamente entre `1` y `100`.
    * Valida coherencia temporal (`valid_from <= valid_until`), rechazando fechas invertidas con `400 Bad Request`.
    * Detección de código repetido: responde con **`HTTP 409 Conflict`** (`"Ya existe un código de promoción con este nombre"`).
* **Actualización de Stock Directo:**
  - `PUT /api/admin/variants/:id/stock`: valida `stock >= 0` entero (retorna 400 si es negativo).

### 3.2 Máquina de Estados de Órdenes y Soporte del Estado `paid`
* **Ampliación del ENUM en PostgreSQL:**
  - Se modificó el tipo `order_status` en `schema.sql`, `seed_qa.sql` y se generó la migración idempotente `02_order_status_paid.sql`:
    ```sql
    DO $$ BEGIN
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid' AFTER 'pending';
    EXCEPTION
        WHEN duplicate_object THEN null;
        WHEN OTHERS THEN null;
    END $$;
    ```
* **Lógica de Transiciones en `PUT /api/admin/orders/:id/status`:**
  - Se configuró la matriz de transiciones permitidas:
    * De `pending` solo se permite avanzar a `paid`, `processing` o `cancelled`.
    * De `paid` solo se permite avanzar a `processing`, `shipped` o `cancelled`.
    * De `processing` a `shipped` o `cancelled`.
    * De `shipped` a `delivered` o `cancelled`.
    * Los estados `delivered` y `cancelled` son terminales (no permiten transiciones).
  - Si se intenta una transición no autorizada (ej. `delivered` $\rightarrow$ `pending`), el servidor responde con **`HTTP 400 Bad Request`**:
    `"Transición de estado no permitida: no se puede cambiar de 'delivered' a 'pending'"`.

### 3.3 Sanitización de Errores (NF-06)
* **Middleware Global de Errores:**
  - Se instaló un manejador global de errores en `server/index.js`.
  - En ambientes `qa` y `production`, **nunca** se envían trazas del stack, queries SQL ni el contenido de `err.message` de errores 500 al cliente.
  - Ante excepciones imprevistas, el backend registra el log detallado internamente en servidor y devuelve al cliente un mensaje genérico controlado:
    `{ "error": "Error interno del servidor" }`.

### 3.4 Excepción de Rate Limiting para Automatización de QA (NF-02)
* **Configuración de Bypass por IP:**
  - Para evitar que la ejecución de suites de pruebas automatizadas o herramientas de QA desencadenen el bloqueo `HTTP 429 Too Many Requests`, se implementó la función `isWhitelistedQA` en `express-rate-limit`.
  - La variable de entorno `QA_WHITELIST_IP` contiene las IPs autorizadas (ej. `127.0.0.1,::1,::ffff:127.0.0.1`). Si la petición proviene de una de estas IPs, los limitadores de tráfico general y de autenticación son omitidos.

---

## 🧪 Resultados y Evidencia de Ejecución (Suite QA)

Para verificar y certificar todos los requerimientos de los tres sprints de forma integral, se programó y ejecutó la suite automatizada [`server/test_qa_suite.js`](file:///c:/Users/marro/Desktop/Ecommerce/server/test_qa_suite.js) contra el backend y la base de datos real en Supabase.

### Resumen de Aserciones de Prueba
```
==============================================
📊 RESUMEN: 27 Pasadas, 0 Fallidas (100% Éxito)
==============================================
```

| Módulo Evaluado | Prueba Ejecutada | Resultado |
| :--- | :--- | :---: |
| **Infraestructura** | Health Check (`GET /api/health`) retorna 200 OK | ✅ **PASS** |
| **Catálogo** | Detalle de producto inactivo retorna 404 Not Found | ✅ **PASS** |
| **Catálogo** | Listado de productos filtra estrictamente `is_active = true` | ✅ **PASS** |
| **Catálogo** | Filtro talla+color sin stock (`XL` + `Negro`) retorna array vacío `[]` | ✅ **PASS** |
| **Catálogo** | Filtro talla+color con stock (`M` + `Negro`) retorna productos disponibles | ✅ **PASS** |
| **Cupones** | Código con espacios en blanco aplica `.trim()` y responde 200 | ✅ **PASS** |
| **Cupones** | Cupón futuro (`FUTURO15`) responde 400 *"Cupón vencido o no válido"* | ✅ **PASS** |
| **Cupones** | Cupón expirado/inactivo (`INACTIVO5`) responde 400 *"Cupón vencido o no válido"* | ✅ **PASS** |
| **Autenticación** | Login cliente retorna token JWT y propiedad `role: "customer"` | ✅ **PASS** |
| **Autenticación** | Login admin retorna token JWT y propiedad `role: "admin"` | ✅ **PASS** |
| **RBAC (CP-36)** | Cliente autenticado en ruta administrativa responde 403 Forbidden | ✅ **PASS** |
| **RBAC (CP-36)** | Admin autenticado en ruta administrativa accede con 200 OK | ✅ **PASS** |
| **Clientes** | `GET /api/customers/me/orders` lista historial de pedidos del cliente | ✅ **PASS** |
| **Checkout** | Validación rechaza teléfono con longitud distinta a 8 dígitos (400) | ✅ **PASS** |
| **Checkout** | Procesamiento de checkout exitoso retorna 201 Created | ✅ **PASS** |
| **Checkout** | Retorna número de orden legible con formato `ORD-YYYYMM-XXXX` | ✅ **PASS** |
| **Checkout** | Servidor recalcula precio autoritativo en BD e ignora manipulación del cliente | ✅ **PASS** |
| **Idempotencia (CP-23)** | Reenvío de petición con misma `Idempotency-Key` responde 200 sin duplicar orden | ✅ **PASS** |
| **Validaciones** | Intento de crear producto sin nombre responde 400 Bad Request | ✅ **PASS** |
| **Validaciones** | Intento de crear producto con precio negativo responde 400 Bad Request | ✅ **PASS** |
| **Validaciones** | Intento de crear cupón con porcentaje > 100 responde 400 Bad Request | ✅ **PASS** |
| **Validaciones** | Intento de crear cupón con fechas invertidas responde 400 Bad Request | ✅ **PASS** |
| **Validaciones** | Intento de registrar cupón existente responde 409 Conflict | ✅ **PASS** |
| **Estados de Orden** | Máquina de estados admite transición a nuevo estado `paid` (200 OK) | ✅ **PASS** |
| **Estados de Orden** | Máquina de estados completa ciclo hasta estado final `delivered` | ✅ **PASS** |
| **Estados de Orden** | Intento de transición inválida (`delivered` $\rightarrow$ `pending`) responde 400 Bad Request | ✅ **PASS** |
| **Seguridad (NF-06)** | Rutas no mapeadas responden 404 JSON sin exponer trazas de servidor | ✅ **PASS** |

---

## 🚀 Conclusión y Estado de Entrega para el 16/10

El backend de `zzaly` se encuentra **100% estabilizado, probado y listo para el inicio formal de las pruebas de QA el 16 de Octubre**.
* La infraestructura de Supabase QA y Render Web Service se encuentra operativa y comunicada mediante SSL seguro.
* Los contratos acordados con Frontend están cumplidos a cabalidad en todas las rutas públicas, privadas y administrativas.
* Las defensas contra fraude de precios, sobreventa por concurrencia y duplicación de transacciones están blindadas tanto a nivel de código como en funciones transaccionales ACID en la base de datos.

# 📖 Documentación Técnica — Zzaly E-commerce

> **Versión:** 1.0.0  
> **Última actualización:** 27 de mayo de 2026  
> **Plataforma:** E-commerce de moda femenina — Mercado Guatemala (GTQ)

---

## 📑 Tabla de Contenidos

1. [Descripción General del Proyecto](#1--descripción-general-del-proyecto)
2. [Arquitectura del Sistema](#2--arquitectura-del-sistema)
3. [Estructura del Proyecto](#3--estructura-del-proyecto)
4. [Instalación y Configuración](#4--instalación-y-configuración)
5. [Variables de Entorno](#5--variables-de-entorno)
6. [Stack de Dependencias](#6--stack-de-dependencias)
7. [Backend — Servidor Express](#7--backend--servidor-express)
   - 7.1 [Punto de Entrada y Middleware](#71-punto-de-entrada-y-middleware)
   - 7.2 [Referencia Completa de la API (23 endpoints)](#72-referencia-completa-de-la-api-23-endpoints)
   - 7.3 [Autenticación y Autorización](#73-autenticación-y-autorización)
8. [Base de Datos — PostgreSQL](#8--base-de-datos--postgresql)
   - 8.1 [Diagrama Entidad-Relación](#81-diagrama-entidad-relación)
   - 8.2 [Tipos ENUM](#82-tipos-enum)
   - 8.3 [Esquema de Tablas](#83-esquema-de-tablas)
   - 8.4 [Procedimiento Almacenado: process_checkout()](#84-procedimiento-almacenado-process_checkout)
   - 8.5 [Triggers](#85-triggers)
   - 8.6 [Datos Semilla](#86-datos-semilla)
9. [Frontend — React SPA](#9--frontend--react-spa)
   - 9.1 [Enrutamiento](#91-enrutamiento)
   - 9.2 [Gestión de Estado](#92-gestión-de-estado)
   - 9.3 [Sistema de Diseño](#93-sistema-de-diseño)
   - 9.4 [Componentes Principales](#94-componentes-principales)
10. [Seguridad](#10--seguridad)
11. [Despliegue a Producción](#11--despliegue-a-producción)
12. [Guía de Contribución](#12--guía-de-contribución)
13. [Solución de Problemas](#13--solución-de-problemas)

---

## 1 · Descripción General del Proyecto

**Zzaly** es una plataforma de comercio electrónico especializada en **moda femenina**, diseñada específicamente para el mercado de **Guatemala**. Todas las transacciones se realizan en **Quetzales (GTQ)** y la interfaz de usuario está completamente en **español**.

| Característica | Detalle |
|:---|:---|
| **Nombre** | Zzaly |
| **Tipo** | E-commerce B2C |
| **Nicho** | Moda femenina |
| **Mercado** | Guatemala |
| **Moneda** | GTQ (Quetzales guatemaltecos) |
| **Idioma UI** | Español |
| **Arquitectura** | Cliente-Servidor (SPA + REST API) |

### Funcionalidades Principales

- 🛍️ Catálogo de productos con filtros avanzados (categoría, talla, color, precio)
- 🛒 Carrito de compras persistente en `localStorage`
- 🎟️ Sistema de códigos promocionales con validaciones
- 📦 Proceso de checkout con transacciones ACID
- 🔐 Panel de administración protegido con JWT
- 📊 Dashboard administrativo con métricas en tiempo real
- 📱 Diseño responsive con enfoque mobile-first

---

## 2 · Arquitectura del Sistema

### Diagrama de Arquitectura General

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVEJcbiAgICBzdWJncmFwaCBDbGllbnRlW1wi8J+Wpe+4jyBDbGllbnRlIOKAlCBSZWFjdCBTUEFcIl1cbiAgICAgICAgZGlyZWN0aW9uIFRCXG4gICAgICAgIEFbXCJSZWFjdCAxOSArIFZpdGUgN1wiXVxuICAgICAgICBCW1wiUmVhY3QgUm91dGVyIDdcIl1cbiAgICAgICAgQ1tcIkNhcnRDb250ZXh0XCJdXG4gICAgICAgIERbXCJDb21wb25lbnRlcyBVSVwiXVxuICAgICAgICBBIC0tPiBCXG4gICAgICAgIEEgLS0+IENcbiAgICAgICAgQSAtLT4gRFxuICAgIGVuZFxuXG4gICAgc3ViZ3JhcGggU2Vydmlkb3JbXCLimpnvuI8gU2Vydmlkb3Ig4oCUIEV4cHJlc3MuanNcIl1cbiAgICAgICAgZGlyZWN0aW9uIFRCXG4gICAgICAgIEVbXCJFeHByZXNzLmpzXCJdXG4gICAgICAgIEZbXCJNaWRkbGV3YXJlIFN0YWNrXCJdXG4gICAgICAgIEdbXCJSdXRhcyBBUElcIl1cbiAgICAgICAgSFtcIkpXVCBBdXRoXCJdXG4gICAgICAgIEUgLS0+IEZcbiAgICAgICAgRiAtLT4gR1xuICAgICAgICBHIC0tPiBIXG4gICAgZW5kXG5cbiAgICBzdWJncmFwaCBCYXNlRGF0b3NbXCLwn5eE77iPIEJhc2UgZGUgRGF0b3NcIl1cbiAgICAgICAgSVtcIlBvc3RncmVTUUwg4oCUIFN1cGFiYXNlXCJdXG4gICAgZW5kXG5cbiAgICBzdWJncmFwaCBEZXNwbGllZ3VlW1wi4piB77iPIEluZnJhZXN0cnVjdHVyYVwiXVxuICAgICAgICBKW1wiUmVuZGVyLmNvbSDigJQgQmFja2VuZFwiXVxuICAgICAgICBLW1wiSG9zdGluZyBlc3TDoXRpY28g4oCUIEZyb250ZW5kXCJdXG4gICAgICAgIExbXCJTdXBhYmFzZSDigJQgRGF0YWJhc2VcIl1cbiAgICBlbmRcblxuICAgIENsaWVudGUgLS0+fFwiSFRUUC9SRVNUIChKU09OKVwifCBTZXJ2aWRvclxuICAgIFNlcnZpZG9yIC0tPnxcIlNRTCAocGcgcG9vbClcInwgQmFzZURhdG9zXG4gICAgU2Vydmlkb3IgLS4tPnxcIkRlc3BsZWdhZG8gZW5cInwgSlxuICAgIENsaWVudGUgLS4tPnxcIkRlc3BsZWdhZG8gZW5cInwgS1xuICAgIEJhc2VEYXRvcyAtLi0+fFwiSG9zcGVkYWRvIGVuXCJ8IExcblxuICAgIHN0eWxlIENsaWVudGUgZmlsbDojZThmNGY4LHN0cm9rZTojMjE5NkYzLHN0cm9rZS13aWR0aDoycHhcbiAgICBzdHlsZSBTZXJ2aWRvciBmaWxsOiNmZmYzZTAsc3Ryb2tlOiNGRjk4MDAsc3Ryb2tlLXdpZHRoOjJweFxuICAgIHN0eWxlIEJhc2VEYXRvcyBmaWxsOiNlOGY1ZTksc3Ryb2tlOiM0Q0FGNTAsc3Ryb2tlLXdpZHRoOjJweFxuICAgIHN0eWxlIERlc3BsaWVndWUgZmlsbDojZjNlNWY1LHN0cm9rZTojOUMyN0IwLHN0cm9rZS13aWR0aDoycHgiLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ==)

### Flujo de Datos Principal

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgcGFydGljaXBhbnQgVSBhcyDwn5GkIFVzdWFyaW9cbiAgICBwYXJ0aWNpcGFudCBGIGFzIPCflqXvuI8gRnJvbnRlbmQgKFJlYWN0KVxuICAgIHBhcnRpY2lwYW50IE0gYXMg8J+UkiBNaWRkbGV3YXJlXG4gICAgcGFydGljaXBhbnQgUiBhcyDwn5OhIEFQSSBSb3V0ZXNcbiAgICBwYXJ0aWNpcGFudCBEQiBhcyDwn5eE77iPIFBvc3RncmVTUUxcblxuICAgIFUtPj5GOiBOYXZlZ2EgYWwgY2F0w6Fsb2dvXG4gICAgRi0+PlI6IEdFVCAvYXBpL3Byb2R1Y3RzP2NhdGVnb3J5PXZlc3RpZG9zXG4gICAgUi0+PkRCOiBTRUxFQ1QgY29uIGZpbHRyb3NcbiAgICBEQi0tPj5SOiBQcm9kdWN0b3NbXVxuICAgIFItLT4+RjogSlNPTiBSZXNwb25zZVxuICAgIEYtLT4+VTogUmVuZGVyaXphIHByb2R1Y3Rvc1xuXG4gICAgVS0+PkY6IEFncmVnYSBhbCBjYXJyaXRvXG4gICAgRi0+PkY6IENhcnRDb250ZXh0IOKGkiBsb2NhbFN0b3JhZ2VcblxuICAgIFUtPj5GOiBQcm9jZWRlIGFsIGNoZWNrb3V0XG4gICAgRi0+PlI6IFBPU1QgL2FwaS9jaGVja291dC9wcm9jZXNzXG4gICAgUi0+Pk06IFJhdGUgbGltaXQgY2hlY2tcbiAgICBNLT4+Ujog4pyFIFBlcm1pdGlkb1xuICAgIFItPj5EQjogQkVHSU4gVFJBTlNBQ1RJT05cbiAgICBEQi0+PkRCOiBwcm9jZXNzX2NoZWNrb3V0KCkg4oCUIEZPUiBVUERBVEUgbG9ja1xuICAgIERCLS0+PlI6IG9yZGVyX2lkXG4gICAgUi0tPj5GOiB7IHN1Y2Nlc3MsIG9yZGVySWQgfVxuICAgIEYtLT4+VTogQ29uZmlybWFjacOzbiBkZSBwZWRpZG8iLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ==)

---

## 3 · Estructura del Proyecto

```
Ecommerce/
│
├── 📁 client/                          # Frontend — React SPA
│   ├── 📁 public/                      # Recursos estáticos (imágenes)
│   ├── 📁 src/
│   │   ├── 📁 components/              # Componentes reutilizables
│   │   │   ├── CatalogFilters.jsx      # Filtros del catálogo
│   │   │   ├── Footer.jsx              # Pie de página
│   │   │   ├── HeroCarousel.jsx        # Carrusel principal (Swiper)
│   │   │   ├── Navbar.jsx              # Barra de navegación
│   │   │   ├── ProductCard.jsx         # Tarjeta de producto
│   │   │   └── ProductDetail.jsx       # Modal detalle de producto
│   │   │
│   │   ├── 📁 context/
│   │   │   └── CartContext.jsx         # Estado global del carrito
│   │   │
│   │   ├── 📁 hooks/
│   │   │   └── useScrollReveal.js      # Hook de animación scroll
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── 📁 Admin/               # Panel administrativo
│   │   │   │   ├── AdminDashboard.jsx  # Dashboard con métricas
│   │   │   │   ├── AdminLayout.jsx     # Layout del panel admin
│   │   │   │   ├── AdminLogin.jsx      # Inicio de sesión admin
│   │   │   │   ├── AdminOrders.jsx     # Gestión de pedidos
│   │   │   │   ├── AdminProducts.jsx   # CRUD de productos
│   │   │   │   └── AdminPromos.jsx     # Gestión de promos
│   │   │   │
│   │   │   ├── Cart.jsx               # Página del carrito
│   │   │   ├── Catalog.jsx            # Catálogo con filtros
│   │   │   ├── Home.jsx               # Página de inicio
│   │   │   └── Nosotros.jsx           # Sobre nosotros
│   │   │
│   │   ├── App.jsx                     # Componente raíz + rutas
│   │   ├── App.css                     # Estilos de la app
│   │   ├── index.css                   # Sistema de diseño (3000+ líneas)
│   │   └── main.jsx                    # Punto de entrada React
│   │
│   ├── .env                            # Variables de entorno del cliente
│   ├── index.html                      # HTML base (SPA)
│   ├── package.json                    # Dependencias del frontend
│   └── vite.config.js                  # Configuración de Vite
│
├── 📁 server/                          # Backend — Express.js
│   ├── 📁 db/
│   │   ├── pool.js                     # Conexión a PostgreSQL
│   │   ├── schema.sql                  # Esquema completo de la BD
│   │   ├── seed.js                     # Datos semilla (productos)
│   │   ├── seed_admin.js               # Datos semilla (admin)
│   │   └── migration_admins.sql        # Migración tabla admins
│   │
│   ├── 📁 routes/
│   │   ├── admin.js                    # CRUD admin (protegido)
│   │   ├── auth.js                     # Login/verificación JWT
│   │   ├── categories.js              # Categorías públicas
│   │   ├── checkout.js                # Procesamiento de pedidos
│   │   ├── products.js                # Productos públicos
│   │   └── promos.js                  # Validación de promos
│   │
│   ├── .env                            # Variables de entorno
│   ├── .env.example                    # Plantilla de variables
│   ├── index.js                        # Punto de entrada Express
│   └── package.json                    # Dependencias del backend
│
└── render.yaml                         # Configuración de despliegue Render
```

---

## 4 · Instalación y Configuración

### Requisitos Previos

| Herramienta | Versión Mínima | Propósito |
|:---|:---|:---|
| **Node.js** | 18.x o superior | Entorno de ejecución |
| **npm** | 9.x o superior | Gestor de paquetes |
| **PostgreSQL** | 14.x o superior | Base de datos (local o Supabase) |
| **Git** | 2.x | Control de versiones |

### Paso 1 — Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd Ecommerce
```

### Paso 2 — Configurar el Backend

```bash
# Instalar dependencias del servidor
cd server
npm install

# Crear archivo de variables de entorno
cp .env.example .env
```

> [!IMPORTANT]
> Edita el archivo `server/.env` con las credenciales de tu base de datos PostgreSQL antes de continuar. Consulta la sección [Variables de Entorno](#5--variables-de-entorno) para el detalle completo.

### Paso 3 — Configurar la Base de Datos

```bash
# Opción A: Si tienes PostgreSQL local
psql -U postgres -c "CREATE DATABASE zzaly;"
psql -U postgres -d zzaly -f db/schema.sql

# Ejecutar datos semilla
node db/seed.js
node db/seed_admin.js
```

```bash
# Opción B: Con DATABASE_URL (Supabase u otro servicio)
# Asegúrate de que DATABASE_URL esté configurado en .env
# Luego ejecuta el schema manualmente desde el cliente de Supabase
# o via psql:
psql "$DATABASE_URL" -f db/schema.sql
node db/seed.js
node db/seed_admin.js
```

### Paso 4 — Configurar el Frontend

```bash
# Desde la raíz del proyecto
cd client
npm install

# Crear archivo de variables de entorno
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### Paso 5 — Ejecutar en Desarrollo

```bash
# Terminal 1 — Servidor (desde /server)
cd server
npm start
# ✅ Servidor corriendo en http://localhost:5000

# Terminal 2 — Cliente (desde /client)
cd client
npm run dev
# ✅ Frontend corriendo en http://localhost:5173
```

> [!TIP]
> Para desarrollo, asegúrate de que `VITE_API_URL` apunte a `http://localhost:5000/api` en el archivo `client/.env`.

### Verificación Rápida

```bash
# Verificar que el backend responde
curl http://localhost:5000/api/health
# Respuesta esperada: { "status": "ok", "timestamp": "..." }

# Verificar que los productos se cargaron
curl http://localhost:5000/api/products
# Respuesta esperada: Array de productos
```

---

## 5 · Variables de Entorno

### Servidor (`server/.env`)

| Variable | Valor por Defecto | Requerida | Descripción |
|:---|:---|:---:|:---|
| `DATABASE_URL` | *(construida desde partes)* | Recomendada | Cadena de conexión completa a PostgreSQL. Si se proporciona, tiene prioridad sobre las variables `DB_*` individuales. |
| `DB_HOST` | `localhost` | Si no hay `DATABASE_URL` | Host del servidor de base de datos. |
| `DB_PORT` | `5432` | Si no hay `DATABASE_URL` | Puerto de PostgreSQL. |
| `DB_USER` | `postgres` | Si no hay `DATABASE_URL` | Usuario de la base de datos. |
| `DB_PASSWORD` | `""` | Si no hay `DATABASE_URL` | Contraseña del usuario de la BD. |
| `DB_NAME` | `zzaly` | Si no hay `DATABASE_URL` | Nombre de la base de datos. |
| `PORT` | `5000` | No | Puerto en el que escucha Express. |
| `JWT_SECRET` | `zzaly-super-secret-jwt-key-2026` | **Sí (producción)** | Clave secreta para firmar tokens JWT. **Cambiar obligatoriamente en producción.** |
| `FRONTEND_URL` | *(ninguno)* | No | Origen permitido para CORS. Útil para producción. |

> [!CAUTION]
> **Nunca** utilices el `JWT_SECRET` por defecto en producción. Genera una clave aleatoria segura de al menos 64 caracteres.

**Ejemplo de `server/.env` para desarrollo local:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=mi_password_seguro
DB_NAME=zzaly
PORT=5000
JWT_SECRET=clave-desarrollo-local-no-usar-en-prod
```

**Ejemplo de `server/.env` para producción (Supabase):**

```env
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
PORT=5000
JWT_SECRET=una-clave-muy-larga-y-aleatoria-generada-de-forma-segura-64chars
FRONTEND_URL=https://mi-tienda-zzaly.netlify.app
```

### Cliente (`client/.env`)

| Variable | Valor | Descripción |
|:---|:---|:---|
| `VITE_API_URL` | `https://ecommerce-backend-mi96.onrender.com/api` | URL base de la API del backend. Cambia a `http://localhost:5000/api` para desarrollo local. |

> [!NOTE]
> Las variables del cliente con prefijo `VITE_` son expuestas al navegador por Vite. **Nunca** coloques secretos o credenciales sensibles en el archivo `.env` del cliente.

---

## 6 · Stack de Dependencias

### Servidor (Backend)

| Paquete | Versión | Propósito |
|:---|:---:|:---|
| `express` | ^4.21.2 | Framework web principal para la API REST |
| `cors` | ^2.8.5 | Manejo de Cross-Origin Resource Sharing |
| `helmet` | ^8.1.0 | Cabeceras de seguridad HTTP |
| `express-rate-limit` | ^8.2.1 | Limitación de tasa de peticiones |
| `dotenv` | ^16.4.7 | Carga de variables de entorno desde `.env` |
| `pg` | ^8.13.1 | Cliente PostgreSQL para Node.js |
| `pg-connection-string` | ^2.11.0 | Parser de cadenas de conexión de PostgreSQL |
| `bcryptjs` | ^3.0.3 | Hash de contraseñas (bcrypt en JS puro) |
| `jsonwebtoken` | ^9.0.3 | Generación y verificación de tokens JWT |

### Cliente (Frontend)

| Paquete | Versión | Propósito |
|:---|:---:|:---|
| `react` | ^19.2.0 | Biblioteca de interfaz de usuario |
| `react-dom` | ^19.2.0 | Renderizador DOM de React |
| `react-router-dom` | ^7.13.1 | Enrutamiento del lado del cliente (SPA) |
| `swiper` | ^12.1.2 | Componente de carrusel/slider |
| `vite` | 7.3.1 | Herramienta de build y servidor de desarrollo |
| `@vitejs/plugin-react` | *(devDep)* | Plugin de Vite para soporte React |

---

## 7 · Backend — Servidor Express

### 7.1 Punto de Entrada y Middleware

El servidor se inicializa en `server/index.js` con la siguiente cadena de middleware aplicada en orden:

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggTFJcbiAgICBBW1wiUGV0aWNpw7NuIEhUVFBcIl0gLS0+IEJbXCIxLiBIZWxtZXRcIl1cbiAgICBCIC0tPiBDW1wiMi4gQ09SU1wiXVxuICAgIEMgLS0+IERbXCIzLiBKU09OIFBhcnNlclwiXVxuICAgIEQgLS0+IEVbXCI0LiBSYXRlIExpbWl0ZXJcIl1cbiAgICBFIC0tPiBGW1wiNS4gUm91dGVyXCJdXG4gICAgRiAtLT4gR1tcIlJlc3B1ZXN0YVwiXVxuXG4gICAgc3R5bGUgQSBmaWxsOiNmZmNkZDIsc3Ryb2tlOiNjNjI4MjhcbiAgICBzdHlsZSBHIGZpbGw6I2M4ZTZjOSxzdHJva2U6IzJlN2QzMiIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkZWZhdWx0XCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)

| # | Middleware | Configuración | Propósito |
|:---:|:---|:---|:---|
| 1 | **Helmet** | `crossOriginResourcePolicy: 'cross-origin'` | Establece cabeceras de seguridad HTTP estándar. Permite carga de recursos cross-origin para imágenes de productos. |
| 2 | **CORS** | Orígenes dinámicos | Permite peticiones desde `localhost:5173`, `localhost:3000`, `FRONTEND_URL`, y `*.netlify.app`. |
| 3 | **JSON Body Parser** | `express.json({ limit: '10mb' })` | Parsea cuerpos de petición JSON con un límite de 10 MB para soportar datos de productos con imágenes. |
| 4 | **Rate Limiter General** | `200 peticiones / 15 minutos` | Se aplica a todas las rutas bajo `/api/*`. Protege contra abuso de la API. |
| 5 | **Rate Limiter Login** | `10 peticiones / 15 minutos` | Específico para `/api/auth/login`. Previene ataques de fuerza bruta. |

**Orígenes CORS permitidos:**

```javascript
// Configuración dinámica de CORS
const allowedOrigins = [
  'http://localhost:5173',    // Vite dev server
  'http://localhost:3000',    // Alternativo
  process.env.FRONTEND_URL,  // Producción (configurable)
  /\.netlify\.app$/           // Cualquier subdominio de Netlify
];
```

---

### 7.2 Referencia Completa de la API (23 endpoints)

> [!NOTE]
> Todas las rutas devuelven respuestas en formato **JSON**. Los códigos de error siguen el estándar HTTP. Las rutas de administración requieren un token JWT válido en la cabecera `Authorization`.

#### Mapa de Rutas

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggTFJcbiAgICBzdWJncmFwaCBQw7pibGljYXNbXCLwn4yQIFJ1dGFzIFDDumJsaWNhc1wiXVxuICAgICAgICBSMVtcIkdFVCAvXCJdXG4gICAgICAgIFIyW1wiR0VUIC9hcGkvaGVhbHRoXCJdXG4gICAgICAgIFIzW1wiR0VUIC9hcGkvcHJvZHVjdHNcIl1cbiAgICAgICAgUjRbXCJHRVQgL2FwaS9wcm9kdWN0cy86aWRcIl1cbiAgICAgICAgUjVbXCJHRVQgL2FwaS9jYXRlZ29yaWVzXCJdXG4gICAgICAgIFI2W1wiUE9TVCAvYXBpL3Byb21vcy92YWxpZGF0ZVwiXVxuICAgICAgICBSN1tcIlBPU1QgL2FwaS9jaGVja291dC9wcm9jZXNzXCJdXG4gICAgICAgIFI4W1wiUE9TVCAvYXBpL2F1dGgvbG9naW5cIl1cbiAgICAgICAgUjlbXCJQT1NUIC9hcGkvYXV0aC92ZXJpZnlcIl1cbiAgICBlbmRcblxuICAgIHN1YmdyYXBoIEFkbWluW1wi8J+UkiBSdXRhcyBBZG1pbiAoSldUKVwiXVxuICAgICAgICBBMVtcIkdFVCAvYXBpL2FkbWluL2Rhc2hib2FyZFwiXVxuICAgICAgICBBMltcIkdFVHxQT1NUIC9hcGkvYWRtaW4vcHJvZHVjdHNcIl1cbiAgICAgICAgQTNbXCJHRVR8UFVUfERFTEVURSAvYXBpL2FkbWluL3Byb2R1Y3RzLzppZFwiXVxuICAgICAgICBBNFtcIkdFVCAvYXBpL2FkbWluL29yZGVyc1wiXVxuICAgICAgICBBNVtcIkdFVHxQVVQgL2FwaS9hZG1pbi9vcmRlcnMvOmlkXCJdXG4gICAgICAgIEE2W1wiR0VUfFBPU1QgL2FwaS9hZG1pbi9wcm9tb3NcIl1cbiAgICAgICAgQTdbXCJQVVR8REVMRVRFIC9hcGkvYWRtaW4vcHJvbW9zLzppZFwiXVxuICAgICAgICBBOFtcIlBVVCAvYXBpL2FkbWluL3ZhcmlhbnRzLzppZC9zdG9ja1wiXVxuICAgIGVuZFxuXG4gICAgc3R5bGUgUMO6YmxpY2FzIGZpbGw6I2UzZjJmZCxzdHJva2U6IzE1NjVjMFxuICAgIHN0eWxlIEFkbWluIGZpbGw6I2ZjZTRlYyxzdHJva2U6I2M2MjgyOCIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkZWZhdWx0XCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)

---

#### 📌 Raíz y Estado del Servidor

##### `GET /`

Mensaje de bienvenida y enlace a documentación.

```bash
curl http://localhost:5000/
```

```json
{
  "message": "Zzaly E-Commerce API",
  "docs": "/api/health"
}
```

---

##### `GET /api/health`

Verificación del estado del servidor.

```bash
curl http://localhost:5000/api/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-05-27T01:13:00.000Z"
}
```

---

#### 🛍️ Productos (Público)

##### `GET /api/products`

Lista productos con filtros opcionales. Retorna datos enriquecidos con imágenes, variantes, tallas y colores disponibles.

**Parámetros de Query:**

| Parámetro | Tipo | Descripción | Ejemplo |
|:---|:---|:---|:---|
| `category` | `string` | Slug de la categoría | `vestidos` |
| `size` | `string` | Talla del producto | `M` |
| `color` | `string` | Color del producto | `Negro` |
| `min_price` | `number` | Precio mínimo (GTQ) | `100` |
| `max_price` | `number` | Precio máximo (GTQ) | `500` |
| `featured` | `string` | Solo productos destacados | `true` |
| `search` | `string` | Búsqueda por nombre (ILIKE) | `vestido floral` |

**Ejemplo — Todos los productos:**

```bash
curl "http://localhost:5000/api/products"
```

**Ejemplo — Filtrado combinado:**

```bash
curl "http://localhost:5000/api/products?category=vestidos&size=M&min_price=100&max_price=500&featured=true"
```

**Respuesta:**

```json
[
  {
    "id": 1,
    "name": "Vestido Floral de Verano",
    "slug": "vestido-floral-de-verano",
    "description": "Un hermoso vestido con estampado floral...",
    "price": "249.99",
    "category_id": 1,
    "category_name": "Vestidos",
    "category_slug": "vestidos",
    "is_featured": true,
    "is_active": true,
    "images": [
      {
        "id": 1,
        "url": "https://ejemplo.com/imagen1.jpg",
        "alt_text": "Vestido floral vista frontal",
        "sort_order": 0
      }
    ],
    "variants": [
      {
        "id": 1,
        "size": "S",
        "color": "Rosa",
        "color_hex": "#FFB6C1",
        "stock": 10,
        "sku": "VFV-S-ROSA"
      }
    ],
    "sizes": ["XS", "S", "M", "L", "XL"],
    "colors": ["Rosa", "Blanco", "Negro"]
  }
]
```

---

##### `GET /api/products/:id`

Obtiene un producto individual con toda su información.

```bash
curl http://localhost:5000/api/products/1
```

**Respuesta exitosa:** Objeto de producto completo (mismo formato que el array anterior).

**Error 404:**

```json
{
  "error": "Producto no encontrado"
}
```

---

#### 📂 Categorías (Público)

##### `GET /api/categories`

Lista todas las categorías ordenadas alfabéticamente por nombre.

```bash
curl http://localhost:5000/api/categories
```

```json
[
  { "id": 1, "name": "Vestidos", "slug": "vestidos" },
  { "id": 2, "name": "Blusas", "slug": "blusas" },
  { "id": 3, "name": "Faldas", "slug": "faldas" },
  { "id": 4, "name": "Pantalones", "slug": "pantalones" },
  { "id": 5, "name": "Accesorios", "slug": "accesorios" },
  { "id": 6, "name": "Calzado", "slug": "calzado" }
]
```

---

#### 🎟️ Códigos Promocionales (Público)

##### `POST /api/promos/validate`

Valida un código promocional antes de aplicarlo al carrito.

```bash
curl -X POST http://localhost:5000/api/promos/validate \
  -H "Content-Type: application/json" \
  -d '{ "code": "WELCOME10", "subtotal": 300 }'
```

**Cuerpo de la petición:**

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `code` | `string` | ✅ | Código promocional a validar |
| `subtotal` | `number` | ✅ | Subtotal actual del carrito (GTQ) |

**Validaciones ejecutadas (en orden):**

1. ✅ El código existe y está activo (`is_active = true`)
2. ✅ No ha expirado (`valid_until` es nulo o futuro)
3. ✅ No ha alcanzado el límite de usos (`used_count < max_uses`)
4. ✅ El subtotal cumple el mínimo requerido (`subtotal >= min_order_value`)

**Respuesta exitosa:**

```json
{
  "id": 1,
  "code": "WELCOME10",
  "discount_type": "percentage",
  "discount_value": "10.00"
}
```

**Errores posibles:**

| Código | Mensaje | Causa |
|:---:|:---|:---|
| 400 | `"El código es requerido"` | No se envió `code` en el body |
| 404 | `"Código promocional no válido o expirado"` | No existe, inactivo o expirado |
| 400 | `"Este código ha alcanzado su límite de usos"` | `used_count >= max_uses` |
| 400 | `"El pedido mínimo para este código es Q{valor}"` | `subtotal < min_order_value` |

---

#### 🛒 Checkout (Público)

##### `POST /api/checkout/process`

Procesa un pedido completo utilizando una **transacción ACID** con bloqueo a nivel de fila.

```bash
curl -X POST http://localhost:5000/api/checkout/process \
  -H "Content-Type: application/json" \
  -d '{
    "userId": null,
    "subtotal": 499.98,
    "discountAmount": 49.99,
    "total": 449.99,
    "promoCodeId": 1,
    "shippingAddress": {
      "street": "6ta Avenida 12-34",
      "city": "Guatemala",
      "state": "Guatemala",
      "zip": "01001"
    },
    "contactEmail": "cliente@ejemplo.com",
    "contactPhone": "+502 5555-1234",
    "items": [
      {
        "variantId": 5,
        "productName": "Vestido Floral de Verano",
        "size": "M",
        "color": "Rosa",
        "quantity": 2,
        "unitPrice": 249.99,
        "subtotal": 499.98
      }
    ]
  }'
```

**Cuerpo de la petición:**

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `userId` | `UUID \| null` | No | ID del usuario (null para invitados) |
| `subtotal` | `number` | ✅ | Subtotal antes de descuentos |
| `discountAmount` | `number` | No | Monto del descuento aplicado |
| `total` | `number` | ✅ | Total final a cobrar |
| `promoCodeId` | `integer \| null` | No | ID del código promo utilizado |
| `shippingAddress` | `object (JSONB)` | ✅ | Dirección de envío |
| `contactEmail` | `string` | ✅ | Email de contacto del comprador |
| `contactPhone` | `string` | No | Teléfono de contacto |
| `items` | `array` | ✅ | Array de artículos del pedido |

**Estructura de cada `item`:**

| Campo | Tipo | Descripción |
|:---|:---|:---|
| `variantId` | `integer` | ID de la variante del producto |
| `productName` | `string` | Nombre del producto (snapshot) |
| `size` | `string` | Talla seleccionada |
| `color` | `string` | Color seleccionado |
| `quantity` | `integer` | Cantidad solicitada |
| `unitPrice` | `number` | Precio unitario |
| `subtotal` | `number` | Subtotal de la línea |

**Flujo interno del proceso:**

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBBW1wiUmVjaWJlIHBldGljacOzblwiXSAtLT4gQntcIsK/Q2Fycml0byB2YWPDrW8/XCJ9XG4gICAgQiAtLT58U8OtfCBDW1wi4p2MIDQwMCDigJQgQ2Fycml0byB2YWPDrW9cIl1cbiAgICBCIC0tPnxOb3wgRFtcIkJFR0lOIFRSQU5TQUNUSU9OXCJdXG4gICAgRCAtLT4gRVtcIkxsYW1hIGEgcHJvY2Vzc19jaGVja291dCgpXCJdXG4gICAgRSAtLT4gRltcIkZPUiBVUERBVEUgbG9jayBlbiB2YXJpYW50ZXNcIl1cbiAgICBGIC0tPiBHe1wiwr9TdG9jayBzdWZpY2llbnRlP1wifVxuICAgIEcgLS0+fE5vfCBIW1wi4p2MIEVYQ0VQVElPTiDigJQgUk9MTEJBQ0tcIl1cbiAgICBIIC0tPiBJW1wiNDA5IOKAlCBTdG9jayBpbnN1ZmljaWVudGVcIl1cbiAgICBHIC0tPnxTw618IEpbXCJEZXNjdWVudGEgc3RvY2tcIl1cbiAgICBKIC0tPiBLW1wiQ3JlYSBvcmRlbiArIGl0ZW1zXCJdXG4gICAgSyAtLT4gTHtcIsK/VGllbmUgcHJvbW8/XCJ9XG4gICAgTCAtLT58U8OtfCBNW1wiSW5jcmVtZW50YSB1c2VkX2NvdW50XCJdXG4gICAgTCAtLT58Tm98IE5bXCJDb250aW7DumFcIl1cbiAgICBNIC0tPiBOXG4gICAgTiAtLT4gT1tcIkNyZWEgcmVnaXN0cm8gZGUgcGFnb1wiXVxuICAgIE8gLS0+IFBbXCJDT01NSVRcIl1cbiAgICBQIC0tPiBRW1wi4pyFIDIwMSDigJQgUGVkaWRvIGNyZWFkb1wiXVxuXG4gICAgc3R5bGUgQyBmaWxsOiNmZmNkZDIsc3Ryb2tlOiNjNjI4MjhcbiAgICBzdHlsZSBJIGZpbGw6I2ZmY2RkMixzdHJva2U6I2M2MjgyOFxuICAgIHN0eWxlIFEgZmlsbDojYzhlNmM5LHN0cm9rZTojMmU3ZDMyIiwibWVybWFpZCI6IntcbiAgXCJ0aGVtZVwiOiBcImRlZmF1bHRcIlxufSIsInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0=)

**Respuesta exitosa (201):**

```json
{
  "success": true,
  "message": "Pedido procesado exitosamente",
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "paymentId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "totalToPay": 449.99
}
```

**Errores posibles:**

| Código | Situación |
|:---:|:---|
| 400 | Carrito vacío o datos obligatorios faltantes |
| 409 | Stock insuficiente para uno o más artículos |
| 500 | Error interno del servidor |

---

#### 🔑 Autenticación (Público)

##### `POST /api/auth/login`

Inicia sesión como administrador.

> [!WARNING]
> Este endpoint tiene un rate limit de **10 peticiones por 15 minutos** para prevenir ataques de fuerza bruta.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@zzaly.com", "password": "Zzaly2026!Secure" }'
```

**Cuerpo de la petición:**

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `email` | `string` | ✅ | Email del administrador |
| `password` | `string` | ✅ | Contraseña en texto plano |

**Respuesta exitosa:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "email": "admin@zzaly.com",
    "name": "Admin"
  }
}
```

**Errores:**

| Código | Mensaje |
|:---:|:---|
| 400 | Campos requeridos faltantes |
| 401 | Credenciales inválidas |
| 500 | Error interno |

---

##### `POST /api/auth/verify`

Verifica la validez de un token JWT existente.

```bash
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Respuesta exitosa:**

```json
{
  "valid": true,
  "admin": {
    "id": 1,
    "email": "admin@zzaly.com",
    "name": "Admin"
  }
}
```

**Error 401:**

```json
{
  "valid": false
}
```

---

#### 🔒 Administración (Requiere JWT)

> [!IMPORTANT]
> **Todas** las rutas bajo `/api/admin/*` requieren autenticación. Incluye la cabecera `Authorization: Bearer <token>` en cada petición.

**Middleware `isAdmin`:**

1. Extrae el token de la cabecera `Authorization: Bearer <token>`
2. Verifica la firma JWT con `JWT_SECRET`
3. Decodifica el payload y asigna `req.admin = { id, email, name }`
4. Si el token es inválido o ausente → `401 No autorizado`

---

##### `GET /api/admin/dashboard`

Retorna métricas generales para el panel de administración.

```bash
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

```json
{
  "totalProducts": 12,
  "totalOrders": 45,
  "totalRevenue": 15780.50,
  "lowStockAlerts": 3,
  "recentOrders": [
    {
      "id": "uuid-del-pedido",
      "status": "pending",
      "total": "449.99",
      "contact_email": "cliente@ejemplo.com",
      "created_at": "2026-05-27T01:00:00.000Z"
    }
  ]
}
```

---

##### Productos CRUD — Admin

| Método | Ruta | Descripción |
|:---|:---|:---|
| `GET` | `/api/admin/products` | Lista todos los productos con variantes, imágenes y categoría |
| `GET` | `/api/admin/products/:id` | Detalle de un producto |
| `POST` | `/api/admin/products` | Crear nuevo producto (transaccional: producto + variantes + imágenes) |
| `PUT` | `/api/admin/products/:id` | Actualizar producto (transaccional: reemplaza variantes e imágenes) |
| `DELETE` | `/api/admin/products/:id` | Eliminar producto (cascada) |

**Ejemplo — Crear producto:**

```bash
curl -X POST http://localhost:5000/api/admin/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blusa de Seda Premium",
    "slug": "blusa-de-seda-premium",
    "description": "Elegante blusa de seda natural con caída suave.",
    "price": 349.99,
    "category_id": 2,
    "is_featured": true,
    "is_active": true,
    "variants": [
      { "size": "S", "color": "Blanco", "color_hex": "#FFFFFF", "stock": 15, "sku": "BSP-S-BL" },
      { "size": "M", "color": "Blanco", "color_hex": "#FFFFFF", "stock": 20, "sku": "BSP-M-BL" },
      { "size": "L", "color": "Negro", "color_hex": "#000000", "stock": 10, "sku": "BSP-L-NG" }
    ],
    "images": [
      { "url": "https://ejemplo.com/blusa-1.jpg", "alt_text": "Blusa seda vista frontal", "sort_order": 0 },
      { "url": "https://ejemplo.com/blusa-2.jpg", "alt_text": "Blusa seda vista lateral", "sort_order": 1 }
    ]
  }'
```

**Ejemplo — Actualizar producto:**

```bash
curl -X PUT http://localhost:5000/api/admin/products/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vestido Floral de Verano — Edición Limitada",
    "price": 279.99,
    "variants": [ ... ],
    "images": [ ... ]
  }'
```

**Ejemplo — Eliminar producto:**

```bash
curl -X DELETE http://localhost:5000/api/admin/products/1 \
  -H "Authorization: Bearer <TOKEN>"
```

---

##### Pedidos — Admin

| Método | Ruta | Descripción |
|:---|:---|:---|
| `GET` | `/api/admin/orders` | Lista todos los pedidos con items agregados |
| `GET` | `/api/admin/orders/:id` | Detalle de un pedido con items |
| `PUT` | `/api/admin/orders/:id/status` | Actualizar estado del pedido |

**Estados válidos para pedidos:**

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoic3RhdGVEaWFncmFtLXYyXG4gICAgWypdIC0tPiBwZW5kaW5nIDogUGVkaWRvIGNyZWFkb1xuICAgIHBlbmRpbmcgLS0+IHByb2Nlc3NpbmcgOiBBZG1pbiBjb25maXJtYVxuICAgIHByb2Nlc3NpbmcgLS0+IHNoaXBwZWQgOiBFbnbDrW8gcmVhbGl6YWRvXG4gICAgc2hpcHBlZCAtLT4gZGVsaXZlcmVkIDogRW50cmVnYSBjb25maXJtYWRhXG4gICAgcGVuZGluZyAtLT4gY2FuY2VsbGVkIDogQ2FuY2VsYWNpw7NuXG4gICAgcHJvY2Vzc2luZyAtLT4gY2FuY2VsbGVkIDogQ2FuY2VsYWNpw7NuXG5cbiAgICBwZW5kaW5nIDog4o+zIFBlbmRpZW50ZVxuICAgIHByb2Nlc3NpbmcgOiDwn5SEIEVuIHByb2Nlc29cbiAgICBzaGlwcGVkIDog8J+amiBFbnZpYWRvXG4gICAgZGVsaXZlcmVkIDog4pyFIEVudHJlZ2Fkb1xuICAgIGNhbmNlbGxlZCA6IOKdjCBDYW5jZWxhZG8iLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ==)

**Ejemplo — Actualizar estado:**

```bash
curl -X PUT http://localhost:5000/api/admin/orders/uuid-del-pedido/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "shipped" }'
```

```json
{
  "id": "uuid-del-pedido",
  "status": "shipped",
  "updated_at": "2026-05-27T02:00:00.000Z"
}
```

---

##### Códigos Promocionales — Admin

| Método | Ruta | Descripción |
|:---|:---|:---|
| `GET` | `/api/admin/promos` | Lista todos los códigos promocionales |
| `POST` | `/api/admin/promos` | Crear nuevo código |
| `PUT` | `/api/admin/promos/:id` | Activar/desactivar código (toggle `is_active`) |
| `DELETE` | `/api/admin/promos/:id` | Eliminar código |

**Ejemplo — Crear código promocional:**

```bash
curl -X POST http://localhost:5000/api/admin/promos \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "VERANO2026",
    "discount_type": "percentage",
    "discount_value": 15,
    "min_order_value": 200,
    "max_uses": 100
  }'
```

---

##### Inventario — Admin

| Método | Ruta | Descripción |
|:---|:---|:---|
| `PUT` | `/api/admin/variants/:id/stock` | Actualizar stock de una variante |

**Ejemplo:**

```bash
curl -X PUT http://localhost:5000/api/admin/variants/5/stock \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "stock": 25 }'
```

---

#### Resumen de Todos los Endpoints

| # | Método | Ruta | Auth | Descripción |
|:---:|:---|:---|:---:|:---|
| 1 | `GET` | `/` | No | Mensaje de bienvenida |
| 2 | `GET` | `/api/health` | No | Estado del servidor |
| 3 | `GET` | `/api/products` | No | Listar productos (con filtros) |
| 4 | `GET` | `/api/products/:id` | No | Detalle de producto |
| 5 | `GET` | `/api/categories` | No | Listar categorías |
| 6 | `POST` | `/api/promos/validate` | No | Validar código promo |
| 7 | `POST` | `/api/checkout/process` | No | Procesar pedido |
| 8 | `POST` | `/api/auth/login` | No | Login admin |
| 9 | `POST` | `/api/auth/verify` | No | Verificar token |
| 10 | `GET` | `/api/admin/dashboard` | 🔒 | Dashboard métricas |
| 11 | `GET` | `/api/admin/products` | 🔒 | Listar productos (admin) |
| 12 | `GET` | `/api/admin/products/:id` | 🔒 | Detalle producto (admin) |
| 13 | `POST` | `/api/admin/products` | 🔒 | Crear producto |
| 14 | `PUT` | `/api/admin/products/:id` | 🔒 | Actualizar producto |
| 15 | `DELETE` | `/api/admin/products/:id` | 🔒 | Eliminar producto |
| 16 | `GET` | `/api/admin/orders` | 🔒 | Listar pedidos |
| 17 | `GET` | `/api/admin/orders/:id` | 🔒 | Detalle de pedido |
| 18 | `PUT` | `/api/admin/orders/:id/status` | 🔒 | Actualizar estado pedido |
| 19 | `GET` | `/api/admin/promos` | 🔒 | Listar promos |
| 20 | `POST` | `/api/admin/promos` | 🔒 | Crear promo |
| 21 | `PUT` | `/api/admin/promos/:id` | 🔒 | Toggle activo promo |
| 22 | `DELETE` | `/api/admin/promos/:id` | 🔒 | Eliminar promo |
| 23 | `PUT` | `/api/admin/variants/:id/stock` | 🔒 | Actualizar stock |

---

### 7.3 Autenticación y Autorización

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgcGFydGljaXBhbnQgQWRtaW4gYXMg8J+RpCBBZG1pbmlzdHJhZG9yXG4gICAgcGFydGljaXBhbnQgQ2xpZW50IGFzIPCflqXvuI8gRnJvbnRlbmRcbiAgICBwYXJ0aWNpcGFudCBBUEkgYXMg8J+ToSBBUElcbiAgICBwYXJ0aWNpcGFudCBEQiBhcyDwn5eE77iPIFBvc3RncmVTUUxcblxuICAgIEFkbWluLT4+Q2xpZW50OiBJbmdyZXNhIGVtYWlsICsgY29udHJhc2XDsWFcbiAgICBDbGllbnQtPj5BUEk6IFBPU1QgL2FwaS9hdXRoL2xvZ2luXG4gICAgQVBJLT4+REI6IFNFTEVDVCBhZG1pbiBwb3IgZW1haWxcbiAgICBEQi0tPj5BUEk6IHsgcGFzc3dvcmRfaGFzaCwgLi4uIH1cbiAgICBBUEktPj5BUEk6IGJjcnlwdC5jb21wYXJlKHBhc3N3b3JkLCBoYXNoKVxuICAgIFxuICAgIGFsdCBDcmVkZW5jaWFsZXMgdsOhbGlkYXNcbiAgICAgICAgQVBJLT4+QVBJOiBqd3Quc2lnbih7IGlkLCBlbWFpbCwgbmFtZSB9LCBTRUNSRVQsIHsgZXhwaXJlc0luOiAnMjRoJyB9KVxuICAgICAgICBBUEktLT4+Q2xpZW50OiB7IHRva2VuLCBhZG1pbiB9XG4gICAgICAgIENsaWVudC0+PkNsaWVudDogbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3p6YWx5X2FkbWluX3Rva2VuJywgdG9rZW4pXG4gICAgICAgIENsaWVudC0+PkNsaWVudDogbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3p6YWx5X2FkbWluX3VzZXInLCBKU09OLnN0cmluZ2lmeShhZG1pbikpXG4gICAgZWxzZSBDcmVkZW5jaWFsZXMgaW52w6FsaWRhc1xuICAgICAgICBBUEktLT4+Q2xpZW50OiA0MDEg4oCUIENyZWRlbmNpYWxlcyBpbnbDoWxpZGFzXG4gICAgZW5kXG5cbiAgICBOb3RlIG92ZXIgQ2xpZW50OiBOYXZlZ2FjacOzbiBhIHDDoWdpbmEgYWRtaW5cblxuICAgIENsaWVudC0+PkFQSTogR0VUIC9hcGkvYWRtaW4vZGFzaGJvYXJkXG4gICAgTm90ZSByaWdodCBvZiBDbGllbnQ6IEhlYWRlcjogQXV0aG9yaXphdGlvbjogQmVhcmVyIDx0b2tlbj5cbiAgICBBUEktPj5BUEk6IGlzQWRtaW4gbWlkZGxld2FyZVxuICAgIEFQSS0+PkFQSTogand0LnZlcmlmeSh0b2tlbiwgU0VDUkVUKVxuICAgIFxuICAgIGFsdCBUb2tlbiB2w6FsaWRvXG4gICAgICAgIEFQSS0+PkFQSTogcmVxLmFkbWluID0gZGVjb2RlZFxuICAgICAgICBBUEktPj5EQjogUXVlcnkgZGFzaGJvYXJkIGRhdGFcbiAgICAgICAgREItLT4+QVBJOiBEYXRvc1xuICAgICAgICBBUEktLT4+Q2xpZW50OiAyMDAg4oCUIERhc2hib2FyZCBkYXRhXG4gICAgZWxzZSBUb2tlbiBpbnbDoWxpZG8vZXhwaXJhZG9cbiAgICAgICAgQVBJLS0+PkNsaWVudDogNDAxIOKAlCBObyBhdXRvcml6YWRvXG4gICAgICAgIENsaWVudC0+PkNsaWVudDogUmVkaXJpZ2UgYSAvYWRtaW4vbG9naW5cbiAgICBlbmQiLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ==)

**Detalles de la implementación:**

| Aspecto | Detalle |
|:---|:---|
| **Algoritmo de hash** | bcrypt con 12 rondas de salting |
| **Token** | JWT (HS256) |
| **Expiración** | 24 horas |
| **Payload JWT** | `{ id, email, name }` |
| **Almacenamiento (cliente)** | `localStorage` → `zzaly_admin_token`, `zzaly_admin_user` |
| **Verificación** | Cada carga de página admin invoca `POST /api/auth/verify` |
| **Admin por defecto** | `admin@zzaly.com` / `Zzaly2026!Secure` |

> [!CAUTION]
> Las credenciales de administrador por defecto deben cambiarse **inmediatamente** en producción. Utiliza el script `seed_admin.js` con las nuevas credenciales o actualízalas directamente en la base de datos.

---

## 8 · Base de Datos — PostgreSQL

### 8.1 Diagrama Entidad-Relación

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZXJEaWFncmFtXG4gICAgenpfY2F0ZWdvcmllcyB8fC0tb3sgenpfcHJvZHVjdHMgOiBcInRpZW5lXCJcbiAgICB6el9wcm9kdWN0cyB8fC0tb3sgenpfcHJvZHVjdF92YXJpYW50cyA6IFwidGllbmVcIlxuICAgIHp6X3Byb2R1Y3RzIHx8LS1veyB6el9wcm9kdWN0X2ltYWdlcyA6IFwidGllbmVcIlxuICAgIHp6X29yZGVycyB8fC0tb3sgenpfb3JkZXJfaXRlbXMgOiBcImNvbnRpZW5lXCJcbiAgICB6el9vcmRlcnMgfHwtLW98IHp6X3BheW1lbnRzIDogXCJnZW5lcmFcIlxuICAgIHp6X29yZGVycyB9by0tb3wgenpfcHJvbW9fY29kZXMgOiBcInVzYVwiXG4gICAgenpfb3JkZXJfaXRlbXMgfW8tLW98IHp6X3Byb2R1Y3RfdmFyaWFudHMgOiBcInJlZmVyZW5jaWFcIlxuICAgIHp6X2FkbWlucyB9by0tb3sgenpfb3JkZXJzIDogXCJnZXN0aW9uYVwiXG5cbiAgICB6el9jYXRlZ29yaWVzIHtcbiAgICAgICAgU0VSSUFMIGlkIFBLXG4gICAgICAgIFZBUkNIQVJfMTAwIG5hbWUgVUtcbiAgICAgICAgVkFSQ0hBUl8xMDAgc2x1ZyBVS1xuICAgICAgICBUSU1FU1RBTVBUWiBjcmVhdGVkX2F0XG4gICAgICAgIFRJTUVTVEFNUFRaIHVwZGF0ZWRfYXRcbiAgICB9XG5cbiAgICB6el9wcm9kdWN0cyB7XG4gICAgICAgIFNFUklBTCBpZCBQS1xuICAgICAgICBWQVJDSEFSXzI1NSBuYW1lXG4gICAgICAgIFZBUkNIQVJfMjU1IHNsdWcgVUtcbiAgICAgICAgVEVYVCBkZXNjcmlwdGlvblxuICAgICAgICBERUNJTUFMXzEwXzIgcHJpY2VcbiAgICAgICAgSU5URUdFUiBjYXRlZ29yeV9pZCBGS1xuICAgICAgICBCT09MRUFOIGlzX2ZlYXR1cmVkXG4gICAgICAgIEJPT0xFQU4gaXNfYWN0aXZlXG4gICAgICAgIFRJTUVTVEFNUFRaIGNyZWF0ZWRfYXRcbiAgICAgICAgVElNRVNUQU1QVFogdXBkYXRlZF9hdFxuICAgIH1cblxuICAgIHp6X3Byb2R1Y3RfdmFyaWFudHMge1xuICAgICAgICBTRVJJQUwgaWQgUEtcbiAgICAgICAgSU5URUdFUiBwcm9kdWN0X2lkIEZLXG4gICAgICAgIFZBUkNIQVJfMTAgc2l6ZVxuICAgICAgICBWQVJDSEFSXzUwIGNvbG9yXG4gICAgICAgIFZBUkNIQVJfNyBjb2xvcl9oZXhcbiAgICAgICAgSU5URUdFUiBzdG9ja1xuICAgICAgICBWQVJDSEFSXzEwMCBza3UgVUtcbiAgICB9XG5cbiAgICB6el9wcm9kdWN0X2ltYWdlcyB7XG4gICAgICAgIFNFUklBTCBpZCBQS1xuICAgICAgICBJTlRFR0VSIHByb2R1Y3RfaWQgRktcbiAgICAgICAgVEVYVCB1cmxcbiAgICAgICAgVkFSQ0hBUl8yNTUgYWx0X3RleHRcbiAgICAgICAgSU5URUdFUiBzb3J0X29yZGVyXG4gICAgfVxuXG4gICAgenpfcHJvbW9fY29kZXMge1xuICAgICAgICBTRVJJQUwgaWQgUEtcbiAgICAgICAgVkFSQ0hBUl81MCBjb2RlIFVLXG4gICAgICAgIEVOVU0gZGlzY291bnRfdHlwZVxuICAgICAgICBERUNJTUFMXzEwXzIgZGlzY291bnRfdmFsdWVcbiAgICAgICAgREVDSU1BTF8xMF8yIG1pbl9vcmRlcl92YWx1ZVxuICAgICAgICBJTlRFR0VSIG1heF91c2VzXG4gICAgICAgIElOVEVHRVIgdXNlZF9jb3VudFxuICAgICAgICBUSU1FU1RBTVBUWiB2YWxpZF9mcm9tXG4gICAgICAgIFRJTUVTVEFNUFRaIHZhbGlkX3VudGlsXG4gICAgICAgIEJPT0xFQU4gaXNfYWN0aXZlXG4gICAgfVxuXG4gICAgenpfb3JkZXJzIHtcbiAgICAgICAgVVVJRCBpZCBQS1xuICAgICAgICBVVUlEIHVzZXJfaWRcbiAgICAgICAgRU5VTSBzdGF0dXNcbiAgICAgICAgREVDSU1BTF8xMF8yIHN1YnRvdGFsXG4gICAgICAgIERFQ0lNQUxfMTBfMiBkaXNjb3VudF9hbW91bnRcbiAgICAgICAgREVDSU1BTF8xMF8yIHRvdGFsXG4gICAgICAgIElOVEVHRVIgcHJvbW9fY29kZV9pZCBGS1xuICAgICAgICBKU09OQiBzaGlwcGluZ19hZGRyZXNzXG4gICAgICAgIFZBUkNIQVJfMjU1IGNvbnRhY3RfZW1haWxcbiAgICAgICAgVkFSQ0hBUl81MCBjb250YWN0X3Bob25lXG4gICAgICAgIFRFWFQgbm90ZXNcbiAgICAgICAgVElNRVNUQU1QVFogY3JlYXRlZF9hdFxuICAgICAgICBUSU1FU1RBTVBUWiB1cGRhdGVkX2F0XG4gICAgfVxuXG4gICAgenpfb3JkZXJfaXRlbXMge1xuICAgICAgICBTRVJJQUwgaWQgUEtcbiAgICAgICAgVVVJRCBvcmRlcl9pZCBGS1xuICAgICAgICBJTlRFR0VSIHZhcmlhbnRfaWQgRktcbiAgICAgICAgVkFSQ0hBUl8yNTUgcHJvZHVjdF9uYW1lXG4gICAgICAgIFZBUkNIQVJfMTAgc2l6ZVxuICAgICAgICBWQVJDSEFSXzUwIGNvbG9yXG4gICAgICAgIElOVEVHRVIgcXVhbnRpdHlcbiAgICAgICAgREVDSU1BTF8xMF8yIHVuaXRfcHJpY2VcbiAgICAgICAgREVDSU1BTF8xMF8yIHN1YnRvdGFsXG4gICAgfVxuXG4gICAgenpfcGF5bWVudHMge1xuICAgICAgICBVVUlEIGlkIFBLXG4gICAgICAgIFVVSUQgb3JkZXJfaWQgRktcbiAgICAgICAgVkFSQ0hBUl81MCBwcm92aWRlclxuICAgICAgICBWQVJDSEFSXzI1NSB0cmFuc2FjdGlvbl9pZCBVS1xuICAgICAgICBFTlVNIHN0YXR1c1xuICAgICAgICBERUNJTUFMXzEwXzIgYW1vdW50XG4gICAgICAgIFZBUkNIQVJfMyBjdXJyZW5jeVxuICAgICAgICBKU09OQiBnYXRld2F5X3Jlc3BvbnNlXG4gICAgICAgIFRJTUVTVEFNUFRaIGNyZWF0ZWRfYXRcbiAgICAgICAgVElNRVNUQU1QVFogdXBkYXRlZF9hdFxuICAgIH1cblxuICAgIHp6X2FkbWlucyB7XG4gICAgICAgIFNFUklBTCBpZCBQS1xuICAgICAgICBWQVJDSEFSXzI1NSBlbWFpbCBVS1xuICAgICAgICBWQVJDSEFSXzI1NSBwYXNzd29yZF9oYXNoXG4gICAgICAgIFZBUkNIQVJfMTAwIG5hbWVcbiAgICAgICAgVElNRVNUQU1QVFogY3JlYXRlZF9hdFxuICAgIH0iLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ==)

---

### 8.2 Tipos ENUM

La base de datos define los siguientes tipos enumerados personalizados:

```sql
-- Estado de los pedidos
CREATE TYPE order_status AS ENUM (
  'pending',      -- ⏳ Pendiente (recién creado)
  'processing',   -- 🔄 En proceso (confirmado por admin)
  'shipped',      -- 🚚 Enviado
  'delivered',    -- ✅ Entregado
  'cancelled'     -- ❌ Cancelado
);

-- Estado de los pagos
CREATE TYPE payment_status AS ENUM (
  'pending',      -- ⏳ Pendiente
  'success',      -- ✅ Exitoso
  'failed',       -- ❌ Fallido
  'refunded'      -- 🔄 Reembolsado
);

-- Tipo de descuento
CREATE TYPE discount_type AS ENUM (
  'percentage',   -- Porcentaje (ej: 10%)
  'fixed'         -- Monto fijo (ej: Q50)
);
```

---

### 8.3 Esquema de Tablas

#### `zz_categories`

Almacena las categorías de productos.

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `SERIAL` | `PRIMARY KEY` | Identificador auto-incremental |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Nombre de la categoría |
| `slug` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Slug URL-friendly |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()`, auto-trigger | Última actualización |

---

#### `zz_products`

Catálogo principal de productos.

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `SERIAL` | `PRIMARY KEY` | Identificador auto-incremental |
| `name` | `VARCHAR(255)` | `NOT NULL` | Nombre del producto |
| `slug` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Slug URL-friendly |
| `description` | `TEXT` | Nullable | Descripción detallada |
| `price` | `DECIMAL(10,2)` | `NOT NULL`, `CHECK >= 0` | Precio en GTQ |
| `category_id` | `INTEGER` | `FK → zz_categories(id)`, `ON DELETE SET NULL` | Categoría del producto |
| `is_featured` | `BOOLEAN` | `DEFAULT FALSE` | Producto destacado |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Producto visible en tienda |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()`, auto-trigger | Última actualización |

**Índices:**
- `idx_products_category` → `category_id`
- `idx_products_active` → `is_active`

---

#### `zz_product_variants`

Variantes de producto (combinaciones de talla y color).

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `SERIAL` | `PRIMARY KEY` | Identificador auto-incremental |
| `product_id` | `INTEGER` | `NOT NULL`, `FK → zz_products(id)`, `ON DELETE CASCADE` | Producto padre |
| `size` | `VARCHAR(10)` | `NOT NULL` | Talla (XS, S, M, L, XL) |
| `color` | `VARCHAR(50)` | `NOT NULL` | Nombre del color |
| `color_hex` | `VARCHAR(7)` | Nullable | Código hexadecimal del color |
| `stock` | `INTEGER` | `DEFAULT 0`, `CHECK >= 0` | Unidades disponibles |
| `sku` | `VARCHAR(100)` | `UNIQUE`, Nullable | Código SKU único |

**Restricción única compuesta:** `(product_id, size, color)` — No puede existir la misma combinación talla-color para un producto.

---

#### `zz_product_images`

Galería de imágenes de cada producto.

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `SERIAL` | `PRIMARY KEY` | Identificador auto-incremental |
| `product_id` | `INTEGER` | `NOT NULL`, `FK → zz_products(id)`, `ON DELETE CASCADE` | Producto padre |
| `url` | `TEXT` | `NOT NULL` | URL de la imagen |
| `alt_text` | `VARCHAR(255)` | Nullable | Texto alternativo (accesibilidad) |
| `sort_order` | `INTEGER` | `DEFAULT 0` | Orden de visualización |

---

#### `zz_promo_codes`

Códigos de descuento promocionales.

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `SERIAL` | `PRIMARY KEY` | Identificador auto-incremental |
| `code` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Código promocional (ej: WELCOME10) |
| `discount_type` | `ENUM discount_type` | `NOT NULL` | Tipo: `percentage` o `fixed` |
| `discount_value` | `DECIMAL(10,2)` | `NOT NULL`, `CHECK > 0` | Valor del descuento |
| `min_order_value` | `DECIMAL(10,2)` | `DEFAULT 0` | Pedido mínimo requerido (GTQ) |
| `max_uses` | `INTEGER` | Nullable (`null` = ilimitado) | Máximo de usos permitidos |
| `used_count` | `INTEGER` | `DEFAULT 0` | Veces que se ha utilizado |
| `valid_from` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Inicio de vigencia |
| `valid_until` | `TIMESTAMPTZ` | Nullable (`null` = sin expiración) | Fin de vigencia |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Código activo/desactivado |

---

#### `zz_orders`

Pedidos de los clientes.

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Identificador único universal |
| `user_id` | `UUID` | Nullable | ID del usuario (`null` para invitados) |
| `status` | `ENUM order_status` | `DEFAULT 'pending'` | Estado actual del pedido |
| `subtotal` | `DECIMAL(10,2)` | `NOT NULL` | Subtotal antes de descuentos |
| `discount_amount` | `DECIMAL(10,2)` | `DEFAULT 0` | Monto descontado |
| `total` | `DECIMAL(10,2)` | `NOT NULL` | Total final cobrado |
| `promo_code_id` | `INTEGER` | `FK → zz_promo_codes(id)` | Código promo aplicado |
| `shipping_address` | `JSONB` | `NOT NULL` | Dirección de envío (objeto JSON) |
| `contact_email` | `VARCHAR(255)` | `NOT NULL` | Email del comprador |
| `contact_phone` | `VARCHAR(50)` | Nullable | Teléfono de contacto |
| `notes` | `TEXT` | Nullable | Notas adicionales del pedido |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()`, auto-trigger | Última actualización |

---

#### `zz_order_items`

Artículos individuales dentro de cada pedido. Los datos del producto son **snapshots** (copias en el momento de la compra).

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `SERIAL` | `PRIMARY KEY` | Identificador auto-incremental |
| `order_id` | `UUID` | `NOT NULL`, `FK → zz_orders(id)`, `ON DELETE CASCADE` | Pedido padre |
| `variant_id` | `INTEGER` | `FK → zz_product_variants(id)`, `ON DELETE SET NULL` | Variante comprada |
| `product_name` | `VARCHAR(255)` | `NOT NULL` | Nombre del producto (snapshot) |
| `size` | `VARCHAR(10)` | Nullable | Talla comprada |
| `color` | `VARCHAR(50)` | Nullable | Color comprado |
| `quantity` | `INTEGER` | `NOT NULL`, `CHECK > 0` | Cantidad |
| `unit_price` | `DECIMAL(10,2)` | `NOT NULL` | Precio unitario al momento de compra |
| `subtotal` | `DECIMAL(10,2)` | `NOT NULL` | Subtotal de la línea (`quantity × unit_price`) |

> [!NOTE]
> Los campos `product_name`, `size`, `color` y `unit_price` son **copias inmutables** de los datos en el momento de la compra. Esto garantiza que los cambios futuros en el catálogo no alteren los registros históricos de pedidos.

---

#### `zz_payments`

Registros de pago asociados a pedidos.

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `UUID` | `PRIMARY KEY` | Identificador único |
| `order_id` | `UUID` | `NOT NULL`, `FK → zz_orders(id)`, `ON DELETE CASCADE` | Pedido asociado |
| `provider` | `VARCHAR(50)` | `DEFAULT 'banco_industrial'` | Proveedor de pago |
| `transaction_id` | `VARCHAR(255)` | `UNIQUE`, Nullable | ID de transacción externa |
| `status` | `ENUM payment_status` | `DEFAULT 'pending'` | Estado del pago |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | Monto cobrado |
| `currency` | `VARCHAR(3)` | `DEFAULT 'GTQ'` | Moneda (Quetzales) |
| `gateway_response` | `JSONB` | Nullable | Respuesta raw del gateway de pago |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()`, auto-trigger | Última actualización |

---

#### `zz_admins`

Usuarios administradores del sistema.

| Columna | Tipo | Restricciones | Descripción |
|:---|:---|:---|:---|
| `id` | `SERIAL` | `PRIMARY KEY` | Identificador auto-incremental |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Email del administrador |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Hash bcrypt de la contraseña |
| `name` | `VARCHAR(100)` | `NOT NULL`, `DEFAULT 'Admin'` | Nombre del administrador |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha de creación |

---

### 8.4 Procedimiento Almacenado: `process_checkout()`

Este procedimiento almacenado es el corazón del proceso de checkout. Garantiza **integridad transaccional completa** mediante una transacción ACID con bloqueo pesimista a nivel de fila.

**Flujo del procedimiento:**

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBBW1wi8J+UkiBCRUdJTiBUUkFOU0FDVElPTlwiXSAtLT4gQltcIkNyZWFyIHJlZ2lzdHJvIGVuIHp6X29yZGVyc1wiXVxuICAgIEIgLS0+IENbXCJJdGVyYXIgc29icmUgY2FkYSBpdGVtIGRlbCBjYXJyaXRvXCJdXG4gICAgQyAtLT4gRFtcIlNFTEVDVCAuLi4gRlJPTSB6el9wcm9kdWN0X3ZhcmlhbnRzIEZPUiBVUERBVEVcIl1cbiAgICBEIC0tPiBFe1wiwr9zdG9jayA+PSBxdWFudGl0eT9cIn1cbiAgICBFIC0tPnxOb3wgRltcIlJBSVNFIEVYQ0VQVElPTiAnU3RvY2sgaW5zdWZpY2llbnRlIHBhcmEge3Byb2R1Y3RvfSdcIl1cbiAgICBGIC0tPiBHW1wi8J+UhCBST0xMQkFDSyBhdXRvbcOhdGljb1wiXVxuICAgIEUgLS0+fFPDrXwgSFtcIlVQREFURSBzdG9jayA9IHN0b2NrIC0gcXVhbnRpdHlcIl1cbiAgICBIIC0tPiBJW1wiSU5TRVJUIElOVE8genpfb3JkZXJfaXRlbXNcIl1cbiAgICBJIC0tPiBKe1wiwr9Nw6FzIGl0ZW1zP1wifVxuICAgIEogLS0+fFPDrXwgQ1xuICAgIEogLS0+fE5vfCBLe1wiwr9UaWVuZSBwcm9tb19jb2RlX2lkP1wifVxuICAgIEsgLS0+fFPDrXwgTFtcIlVQREFURSB6el9wcm9tb19jb2RlcyBTRVQgdXNlZF9jb3VudCA9IHVzZWRfY291bnQgKyAxXCJdXG4gICAgSyAtLT58Tm98IE1bXCJDb250aW51YXJcIl1cbiAgICBMIC0tPiBNXG4gICAgTSAtLT4gTltcIlJFVFVSTiBvcmRlcl9pZDo6VVVJRFwiXVxuICAgIE4gLS0+IE9bXCLinIUgQ09NTUlUXCJdXG5cbiAgICBzdHlsZSBBIGZpbGw6I2UzZjJmZCxzdHJva2U6IzE1NjVjMFxuICAgIHN0eWxlIEcgZmlsbDojZmZjZGQyLHN0cm9rZTojYzYyODI4XG4gICAgc3R5bGUgTyBmaWxsOiNjOGU2Yzksc3Ryb2tlOiMyZTdkMzIiLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ==)

**Características clave:**

| Característica | Detalle |
|:---|:---|
| **Aislamiento** | `FOR UPDATE` lock — Bloquea las filas de variantes seleccionadas hasta que la transacción termine |
| **Atomicidad** | Si algún item no tiene stock suficiente, toda la transacción se revierte (ROLLBACK) |
| **Consistencia** | El stock nunca puede quedar negativo gracias al CHECK constraint + validación en el procedimiento |
| **Durabilidad** | Una vez que COMMIT se ejecuta, todos los cambios son permanentes |

---

### 8.5 Triggers

Todas las tablas que contienen la columna `updated_at` tienen asociado un trigger automático que actualiza la marca de tiempo en cada operación `UPDATE`:

```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Se aplica a: zz_categories, zz_products, zz_orders, zz_payments
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON nombre_tabla
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
```

**Tablas con trigger `update_modified_column()`:**

- `zz_categories`
- `zz_products`
- `zz_orders`
- `zz_payments`

---

### 8.6 Datos Semilla

Los scripts de datos semilla (`seed.js` y `seed_admin.js`) populan la base de datos con información de prueba:

#### Categorías (6)

| # | Nombre | Slug |
|:---:|:---|:---|
| 1 | Vestidos | `vestidos` |
| 2 | Blusas | `blusas` |
| 3 | Faldas | `faldas` |
| 4 | Pantalones | `pantalones` |
| 5 | Accesorios | `accesorios` |
| 6 | Calzado | `calzado` |

#### Productos (12)

Cada producto incluye **15 variantes** (5 tallas × 3 colores): XS, S, M, L, XL en tres combinaciones de colores.

#### Códigos Promocionales (2)

| Código | Tipo | Valor | Pedido Mínimo |
|:---|:---|:---|:---|
| `WELCOME10` | `percentage` | 10% | *(ninguno)* |
| `DESCUENTO50` | `fixed` | Q50.00 | *(depende de la configuración)* |

#### Administrador por Defecto

| Campo | Valor |
|:---|:---|
| Email | `admin@zzaly.com` |
| Contraseña | `Zzaly2026!Secure` |
| Nombre | `Admin` |

---

## 9 · Frontend — React SPA

### 9.1 Enrutamiento

La aplicación utiliza **React Router v7** para el enrutamiento del lado del cliente. Las rutas se dividen en dos grupos: públicas (tienda) y administrativas (panel).

| Ruta | Componente | Tipo | Descripción |
|:---|:---|:---:|:---|
| `/` | `Home` | 🌐 Pública | Página de inicio con carrusel y productos destacados |
| `/nosotros` | `Nosotros` | 🌐 Pública | Información sobre la marca |
| `/catalogo` | `Catalog` | 🌐 Pública | Catálogo con filtros avanzados |
| `/carrito` | `Cart` | 🌐 Pública | Carrito de compras y checkout |
| `/admin/login` | `AdminLogin` | 🔐 Admin | Formulario de inicio de sesión |
| `/admin` | `AdminLayout → AdminDashboard` | 🔐 Admin | Dashboard principal |
| `/admin/dashboard` | `AdminDashboard` | 🔐 Admin | Dashboard con métricas |
| `/admin/productos` | `AdminProducts` | 🔐 Admin | CRUD de productos |
| `/admin/pedidos` | `AdminOrders` | 🔐 Admin | Gestión de pedidos |
| `/admin/promos` | `AdminPromos` | 🔐 Admin | Gestión de códigos promo |

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBzdWJncmFwaCBQw7pibGljb1tcIvCfjJAgUnV0YXMgUMO6YmxpY2FzXCJdXG4gICAgICAgIEhbXCIvICDigJQgSG9tZVwiXVxuICAgICAgICBOW1wiL25vc290cm9zIOKAlCBOb3NvdHJvc1wiXVxuICAgICAgICBDQVtcIi9jYXRhbG9nbyDigJQgQ2F0YWxvZ1wiXVxuICAgICAgICBDUltcIi9jYXJyaXRvIOKAlCBDYXJ0XCJdXG4gICAgZW5kXG5cbiAgICBzdWJncmFwaCBBZG1pbltcIvCflJAgUnV0YXMgQWRtaW5cIl1cbiAgICAgICAgQUxbXCIvYWRtaW4vbG9naW4g4oCUIEFkbWluTG9naW5cIl1cbiAgICAgICAgQURbXCIvYWRtaW4g4oCUIEFkbWluRGFzaGJvYXJkXCJdXG4gICAgICAgIEFQW1wiL2FkbWluL3Byb2R1Y3RvcyDigJQgQWRtaW5Qcm9kdWN0c1wiXVxuICAgICAgICBBT1tcIi9hZG1pbi9wZWRpZG9zIOKAlCBBZG1pbk9yZGVyc1wiXVxuICAgICAgICBBUFJbXCIvYWRtaW4vcHJvbW9zIOKAlCBBZG1pblByb21vc1wiXVxuICAgIGVuZFxuXG4gICAgQXBwW1wiQXBwLmpzeFwiXSAtLT4gUMO6YmxpY29cbiAgICBBcHAgLS0+IEFkbWluXG4gICAgQWRtaW4gLS0+fFwiQWRtaW5MYXlvdXQgd3JhcHBlclwifCBBRFxuICAgIEFkbWluIC0tPnxcIkFkbWluTGF5b3V0IHdyYXBwZXJcInwgQVBcbiAgICBBZG1pbiAtLT58XCJBZG1pbkxheW91dCB3cmFwcGVyXCJ8IEFPXG4gICAgQWRtaW4gLS0+fFwiQWRtaW5MYXlvdXQgd3JhcHBlclwifCBBUFJcblxuICAgIHN0eWxlIFDDumJsaWNvIGZpbGw6I2U4ZjVlOSxzdHJva2U6IzJlN2QzMlxuICAgIHN0eWxlIEFkbWluIGZpbGw6I2ZjZTRlYyxzdHJva2U6I2M2MjgyOCIsIm1lcm1haWQiOiJ7XG4gIFwidGhlbWVcIjogXCJkZWZhdWx0XCJcbn0iLCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6ZmFsc2V9)

> [!NOTE]
> Todas las rutas admin (excepto login) están envueltas por `AdminLayout`, que verifica la autenticación JWT antes de renderizar el contenido. Si el token es inválido o no existe, redirige automáticamente a `/admin/login`.

---

### 9.2 Gestión de Estado

#### CartContext (Carrito de Compras)

El estado global del carrito se maneja mediante la **Context API de React**, implementada en `CartContext.jsx`.

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBzdWJncmFwaCBDYXJ0Q29udGV4dFtcIvCfm5IgQ2FydENvbnRleHQgUHJvdmlkZXJcIl1cbiAgICAgICAgU1tcIkVzdGFkbzogaXRlbXNbXVwiXVxuICAgICAgICBBMVtcImFkZEl0ZW0ocHJvZHVjdCwgdmFyaWFudCwgcXVhbnRpdHkpXCJdXG4gICAgICAgIEEyW1wicmVtb3ZlSXRlbSh2YXJpYW50SWQpXCJdXG4gICAgICAgIEEzW1widXBkYXRlUXVhbnRpdHkodmFyaWFudElkLCBxdWFudGl0eSlcIl1cbiAgICAgICAgQTRbXCJjbGVhckNhcnQoKVwiXVxuICAgICAgICBDMVtcInRvdGFsSXRlbXMgKGNvbXB1dGVkKVwiXVxuICAgICAgICBDMltcInRvdGFsUHJpY2UgKGNvbXB1dGVkKVwiXVxuICAgICAgICBUW1widG9hc3QgKG5vdGlmaWNhY2lvbmVzKVwiXVxuICAgIGVuZFxuXG4gICAgc3ViZ3JhcGggUGVyc2lzdGVuY2lhW1wi8J+SviBQZXJzaXN0ZW5jaWFcIl1cbiAgICAgICAgTFNbXCJsb2NhbFN0b3JhZ2U6ICd6emFseV9jYXJ0J1wiXVxuICAgIGVuZFxuXG4gICAgQ2FydENvbnRleHQgLS0+fFwiU2luY3Jvbml6YVwifCBQZXJzaXN0ZW5jaWFcblxuICAgIHN0eWxlIENhcnRDb250ZXh0IGZpbGw6I2UzZjJmZCxzdHJva2U6IzE1NjVjMFxuICAgIHN0eWxlIFBlcnNpc3RlbmNpYSBmaWxsOiNmZmYzZTAsc3Ryb2tlOiNGRjk4MDAiLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ==)

**Funcionalidades del CartContext:**

| Propiedad/Método | Tipo | Descripción |
|:---|:---|:---|
| `items` | `Array` | Lista de artículos en el carrito |
| `addItem(product, variant, qty)` | `Function` | Agrega un artículo o incrementa cantidad si ya existe |
| `removeItem(variantId)` | `Function` | Elimina un artículo del carrito |
| `updateQuantity(variantId, qty)` | `Function` | Actualiza la cantidad de un artículo |
| `clearCart()` | `Function` | Vacía el carrito completamente |
| `totalItems` | `Number` | Total de unidades en el carrito (computado) |
| `totalPrice` | `Number` | Precio total del carrito en GTQ (computado) |
| `toast` | `Object` | Sistema de notificaciones visuales |

**Persistencia:**
- **Clave:** `zzaly_cart` en `localStorage`
- **Formato:** JSON serializado del array `items`
- **Comportamiento:** Se sincroniza automáticamente en cada cambio de estado

#### Autenticación Admin

| Clave localStorage | Contenido | Propósito |
|:---|:---|:---|
| `zzaly_admin_token` | Token JWT (string) | Autenticación en peticiones API |
| `zzaly_admin_user` | Objeto JSON `{ id, email, name }` | Información del admin para la UI |

---

### 9.3 Sistema de Diseño

El sistema de diseño se encuentra definido en `index.css` con más de **3,000 líneas** de CSS personalizado.

#### Paleta de Colores

| Variable CSS | Color | Hex | Uso |
|:---|:---|:---:|:---|
| `--cream` | Crema | `#F6F2EF` | Fondo principal |
| `--sand` | Arena | `#EBDAC9` | Fondos secundarios, tarjetas |
| `--rose-tan` | Rosa tostado | `#BC967F` | Acentos, botones hover |
| `--espresso` | Espresso | `#5D4032` | Texto principal, bordes |

#### Tipografía

| Fuente | Tipo | Uso | Fuente |
|:---|:---|:---|:---|
| **Cormorant Garamond** | Serif (display) | Títulos, encabezados, logotipo | Google Fonts |
| **Outfit** | Sans-serif (body) | Texto de cuerpo, botones, UI general | Google Fonts |

#### Breakpoints Responsive

| Breakpoint | Ancho | Target |
|:---|:---:|:---|
| Desktop | > 1024px | Pantallas de escritorio |
| Tablet | ≤ 1024px | Tablets y pantallas medianas |
| Mobile | ≤ 768px | Teléfonos en modo landscape |
| Mobile Small | ≤ 480px | Teléfonos en modo portrait |

#### Efectos Visuales

| Efecto | Descripción | Ubicación |
|:---|:---|:---|
| **Glassmorphism** | Navbar con efecto de vidrio translúcido (`backdrop-filter: blur()`) | `Navbar.jsx` |
| **Parallax** | Fondos con efecto de desplazamiento diferencial | `Home.jsx` |
| **Scroll Reveal** | Animaciones de entrada al hacer scroll (hook personalizado) | `useScrollReveal.js` |
| **Loading Skeletons** | Placeholders animados durante la carga de datos | Varias páginas |

---

### 9.4 Componentes Principales

| Componente | Archivo | Descripción |
|:---|:---|:---|
| **Navbar** | `components/Navbar.jsx` | Barra de anuncios superior + navegación con efecto glassmorphism + mega menú desplegable para categorías + menú hamburguesa en móvil + icono de carrito con contador |
| **HeroCarousel** | `components/HeroCarousel.jsx` | Carrusel principal de la página de inicio usando Swiper.js. 3 slides con efecto fade y reproducción automática |
| **ProductCard** | `components/ProductCard.jsx` | Tarjeta de producto con carrusel de imágenes, badge de "Destacado", botón de vista rápida y puntos de color disponibles |
| **ProductDetail** | `components/ProductDetail.jsx` | Modal de detalle con galería de imágenes, selectores de talla/color, indicador de stock y botón de agregar al carrito |
| **CatalogFilters** | `components/CatalogFilters.jsx` | Panel de filtros del catálogo: categoría, talla, color y rango de precio. Comportamiento de toggle (seleccionar/deseleccionar) |
| **Footer** | `components/Footer.jsx` | Pie de página con layout de 4 columnas: navegación, categorías, contacto y redes sociales |

---

## 10 · Seguridad

La aplicación implementa múltiples capas de seguridad para proteger tanto la API como los datos de los usuarios:

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVEJcbiAgICBzdWJncmFwaCBDYXBhMVtcIkNhcGEgMSDigJQgVHJhbnNwb3J0ZVwiXVxuICAgICAgICBIVFRQU1tcIkhUVFBTL1RMU1wiXVxuICAgIGVuZFxuXG4gICAgc3ViZ3JhcGggQ2FwYTJbXCJDYXBhIDIg4oCUIENhYmVjZXJhc1wiXVxuICAgICAgICBIW1wiSGVsbWV0LmpzXCJdXG4gICAgICAgIENPUlBbXCJDcm9zcy1PcmlnaW4gUmVzb3VyY2UgUG9saWN5XCJdXG4gICAgZW5kXG5cbiAgICBzdWJncmFwaCBDYXBhM1tcIkNhcGEgMyDigJQgQWNjZXNvXCJdXG4gICAgICAgIENPUlNbXCJDT1JTIGNvbmZpZ3VyYWRvXCJdXG4gICAgICAgIFJMW1wiUmF0ZSBMaW1pdGluZ1wiXVxuICAgICAgICBCTFtcIkJvZHkgTGltaXQgMTBNQlwiXVxuICAgIGVuZFxuXG4gICAgc3ViZ3JhcGggQ2FwYTRbXCJDYXBhIDQg4oCUIEF1dGVudGljYWNpw7NuXCJdXG4gICAgICAgIEpXVFtcIkpXVCBIUzI1NiDigJQgMjRoXCJdXG4gICAgICAgIEJDW1wiYmNyeXB0IDEyIHJvbmRhc1wiXVxuICAgICAgICBNV1tcIk1pZGRsZXdhcmUgaXNBZG1pblwiXVxuICAgIGVuZFxuXG4gICAgc3ViZ3JhcGggQ2FwYTVbXCJDYXBhIDUg4oCUIEJhc2UgZGUgRGF0b3NcIl1cbiAgICAgICAgUFFbXCJRdWVyaWVzIHBhcmFtZXRyaXphZGFzXCJdXG4gICAgICAgIEZVW1wiRk9SIFVQREFURSByb3cgbG9ja3NcIl1cbiAgICAgICAgQ0tbXCJDSEVDSyBjb25zdHJhaW50c1wiXVxuICAgIGVuZFxuXG4gICAgQ2FwYTEgLS0+IENhcGEyXG4gICAgQ2FwYTIgLS0+IENhcGEzXG4gICAgQ2FwYTMgLS0+IENhcGE0XG4gICAgQ2FwYTQgLS0+IENhcGE1XG5cbiAgICBzdHlsZSBDYXBhMSBmaWxsOiNlM2YyZmQsc3Ryb2tlOiMxNTY1YzBcbiAgICBzdHlsZSBDYXBhMiBmaWxsOiNlOGY1ZTksc3Ryb2tlOiMyZTdkMzJcbiAgICBzdHlsZSBDYXBhMyBmaWxsOiNmZmYzZTAsc3Ryb2tlOiNGRjk4MDBcbiAgICBzdHlsZSBDYXBhNCBmaWxsOiNmY2U0ZWMsc3Ryb2tlOiNjNjI4MjhcbiAgICBzdHlsZSBDYXBhNSBmaWxsOiNmM2U1ZjUsc3Ryb2tlOiM3YjFmYTIiLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ==)

### Medidas de Seguridad Implementadas

| # | Medida | Implementación | Protege contra |
|:---:|:---|:---|:---|
| 1 | **Helmet** | Cabeceras HTTP de seguridad con `crossOriginResourcePolicy: 'cross-origin'` | XSS, clickjacking, MIME sniffing |
| 2 | **CORS** | Orígenes configurables (whitelist dinámica) | Solicitudes cross-origin no autorizadas |
| 3 | **Rate Limiting General** | 200 peticiones / 15 minutos para `/api/*` | DDoS, abuso de API |
| 4 | **Rate Limiting Login** | 10 peticiones / 15 minutos para `/api/auth/login` | Fuerza bruta en contraseñas |
| 5 | **JWT** | Tokens firmados con HS256, expiración 24h | Acceso no autorizado a rutas admin |
| 6 | **bcrypt** | Hash con 12 rondas de salting | Robo de contraseñas en texto plano |
| 7 | **Queries parametrizadas** | Todas las consultas SQL usan placeholders `$1, $2, ...` | Inyección SQL |
| 8 | **Row-level locking** | `SELECT ... FOR UPDATE` en checkout | Condiciones de carrera en el inventario |
| 9 | **Body size limit** | `express.json({ limit: '10mb' })` | Payloads excesivamente grandes |
| 10 | **CHECK constraints** | `price >= 0`, `stock >= 0`, `quantity > 0` | Datos inválidos en la BD |

> [!WARNING]
> **Recomendaciones adicionales para producción:**
> - Cambiar el `JWT_SECRET` por defecto por una clave de al menos 64 caracteres aleatorios
> - Cambiar las credenciales del administrador por defecto
> - Habilitar HTTPS en el backend (gestionado automáticamente por Render.com)
> - Configurar `FRONTEND_URL` para restringir CORS a un origen específico
> - Considerar implementar CSRF tokens para formularios críticos
> - Añadir logs de auditoría para acciones administrativas

---

## 11 · Despliegue a Producción

### Arquitectura de Despliegue

![Diagrama](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggTFJcbiAgICBzdWJncmFwaCBJbnRlcm5ldFtcIvCfjJAgSW50ZXJuZXRcIl1cbiAgICAgICAgVXNlcltcIvCfkaQgVXN1YXJpb1wiXVxuICAgIGVuZFxuXG4gICAgc3ViZ3JhcGggRnJvbnRlbmRbXCJGcm9udGVuZFwiXVxuICAgICAgICBGSFtcIkhvc3RpbmcgRXN0w6F0aWNvXCJdXG4gICAgICAgIEZCW1wiUmVhY3QgU1BBIChidWlsZClcIl1cbiAgICAgICAgRkggLS0tIEZCXG4gICAgZW5kXG5cbiAgICBzdWJncmFwaCBCYWNrZW5kW1wiQmFja2VuZCDigJQgUmVuZGVyLmNvbVwiXVxuICAgICAgICBSRVtcIlJlbmRlciBXZWIgU2VydmljZVwiXVxuICAgICAgICBFWFtcIkV4cHJlc3MuanMgQVBJXCJdXG4gICAgICAgIFJFIC0tLSBFWFxuICAgIGVuZFxuXG4gICAgc3ViZ3JhcGggRGF0YWJhc2VbXCJCYXNlIGRlIERhdG9zIOKAlCBTdXBhYmFzZVwiXVxuICAgICAgICBTQltcIlN1cGFiYXNlXCJdXG4gICAgICAgIFBHW1wiUG9zdGdyZVNRTCAoU1NMKVwiXVxuICAgICAgICBTQiAtLS0gUEdcbiAgICBlbmRcblxuICAgIFVzZXIgLS0+fFwiSFRUUFNcInwgRnJvbnRlbmRcbiAgICBVc2VyIC0tPnxcIkhUVFBTL0FQSVwifCBCYWNrZW5kXG4gICAgQmFja2VuZCAtLT58XCJTU0xcInwgRGF0YWJhc2VcblxuICAgIHN0eWxlIEludGVybmV0IGZpbGw6I2Y1ZjVmNSxzdHJva2U6IzllOWU5ZVxuICAgIHN0eWxlIEZyb250ZW5kIGZpbGw6I2UzZjJmZCxzdHJva2U6IzE1NjVjMFxuICAgIHN0eWxlIEJhY2tlbmQgZmlsbDojZmZmM2UwLHN0cm9rZTojRkY5ODAwXG4gICAgc3R5bGUgRGF0YWJhc2UgZmlsbDojZThmNWU5LHN0cm9rZTojMmU3ZDMyIiwibWVybWFpZCI6IntcbiAgXCJ0aGVtZVwiOiBcImRlZmF1bHRcIlxufSIsInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0=)

### Backend — Render.com

El backend se despliega en Render.com usando el archivo `render.yaml` de la raíz del proyecto:

```yaml
# render.yaml
services:
  - type: web
    name: ecommerce-backend
    env: node
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && node index.js
    envVars:
      - key: DATABASE_URL
        value: <tu-connection-string-de-supabase>
      - key: JWT_SECRET
        value: <tu-clave-secreta-segura>
      - key: FRONTEND_URL
        value: <url-de-tu-frontend>
```

**Características del despliegue en Render:**

| Aspecto | Detalle |
|:---|:---|
| **Plan** | Free tier |
| **Auto-deploy** | Sí (conectado a repositorio Git) |
| **HTTPS** | Automático (Let's Encrypt) |
| **Región** | Configurable |
| **Cold starts** | El free tier puede tener latencia inicial (~30s) |

> [!TIP]
> En el free tier de Render, el servidor se duerme después de 15 minutos de inactividad. La primera petición después de la inactividad puede tardar 30-50 segundos. Para producción real, considerar el plan pagado.

### Base de Datos — Supabase

| Aspecto | Detalle |
|:---|:---|
| **Servicio** | Supabase (PostgreSQL gestionado) |
| **Conexión** | SSL habilitado |
| **Formato** | `postgresql://user:pass@host:port/db` |
| **Pooling** | Conexión a través de Supabase Pooler (puerto 6543) |

### Frontend — Hosting Estático

El frontend puede desplegarse en cualquier servicio de hosting estático:

```bash
# Generar build de producción
cd client
npm run build
# Los archivos estáticos se generan en client/dist/
```

| Servicio | Comando de Deploy | Notas |
|:---|:---|:---|
| **Netlify** | Arrastrar carpeta `dist/` o CLI | Soportado en CORS por defecto |
| **Vercel** | `vercel --prod` | Framework preset: Vite |
| **GitHub Pages** | Configurar en repositorio | Requiere base path |

> [!IMPORTANT]
> Asegúrate de configurar `VITE_API_URL` con la URL del backend en Render **antes** de ejecutar `npm run build`. Esta variable se incorpora al build en tiempo de compilación y no puede cambiarse después.

---

## 12 · Guía de Contribución

### Convenciones de Código

| Aspecto | Convención |
|:---|:---|
| **Idioma del código** | Inglés para nombres de variables y funciones |
| **Idioma de la UI** | Español para todo texto visible al usuario |
| **Formato CSS** | Variables CSS globales en `:root`, clases BEM-inspired |
| **Componentes React** | Functional components con hooks |
| **Nombrado de archivos** | PascalCase para componentes, camelCase para hooks/utils |
| **Rutas API** | kebab-case, plurales para recursos |
| **Tablas BD** | Prefijo `zz_`, snake_case |

### Flujo de Trabajo

```bash
# 1. Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y probar localmente
npm start          # Backend
npm run dev        # Frontend

# 3. Commit con mensaje descriptivo
git add .
git commit -m "feat: agregar filtro de precio al catálogo"

# 4. Push y crear Pull Request
git push origin feature/nueva-funcionalidad
```

### Scripts Disponibles

#### Servidor

```bash
cd server
npm start          # Iniciar servidor (node index.js)
node db/seed.js    # Ejecutar datos semilla de productos
node db/seed_admin.js  # Crear admin por defecto
```

#### Cliente

```bash
cd client
npm run dev        # Servidor de desarrollo (Vite)
npm run build      # Build de producción
npm run preview    # Preview del build local
```

---

## 13 · Solución de Problemas

### Errores Comunes

| Problema | Causa Probable | Solución |
|:---|:---|:---|
| `ECONNREFUSED` al conectar a la BD | PostgreSQL no está corriendo o credenciales incorrectas | Verificar que PostgreSQL esté activo y revisar variables `DB_*` en `.env` |
| CORS error en el navegador | `FRONTEND_URL` no configurado | Agregar la URL del frontend a `FRONTEND_URL` en `server/.env` |
| 401 en rutas admin | Token expirado o inválido | Cerrar sesión y volver a iniciar sesión |
| Productos no cargan | `VITE_API_URL` incorrecto | Verificar que apunte al backend correcto en `client/.env` |
| `rate limit exceeded` | Demasiadas peticiones | Esperar 15 minutos o ajustar el límite en desarrollo |
| Checkout falla con 409 | Stock insuficiente | Verificar stock de las variantes desde el panel admin |
| `MODULE_NOT_FOUND` | Dependencias no instaladas | Ejecutar `npm install` en `/server` y `/client` |
| Build falla en Render | Variables de entorno no configuradas | Verificar todas las env vars en el dashboard de Render |

### Verificación del Sistema

```bash
# 1. Verificar que el backend responde
curl http://localhost:5000/api/health

# 2. Verificar conexión a la base de datos
curl http://localhost:5000/api/categories

# 3. Verificar autenticación
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zzaly.com","password":"Zzaly2026!Secure"}'

# 4. Verificar que el frontend se conecta al backend
# Abrir http://localhost:5173 y verificar que los productos cargan
```

---

<div align="center">

**Zzaly E-commerce** · Documentación Técnica v1.0.0

Desarrollado con ❤️ para el mercado guatemalteco

*© 2026 Zzaly — Todos los derechos reservados*

</div>

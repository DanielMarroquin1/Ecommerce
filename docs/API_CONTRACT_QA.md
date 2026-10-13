# 📋 Contrato de API — Ambiente QA (`zzaly` E-Commerce)

**Destinatario:** Francisco Sánchez (Líder Frontend)  
**Autor:** Especialista Backend & DevOps/QA  
**Fecha de Publicación:** 13 de Octubre de 2026  
**Versión de API:** 1.2.0-qa  
**Base URL QA:** `https://ecommerce-backend-qa.onrender.com/api` (o `http://localhost:5000/api` en desarrollo local)

---

## 📌 Tabla de Contenidos
1. [Autenticación Unificada (POST `/api/auth/login`)](#1-autenticación-unificada)
2. [Catálogo de Productos y Filtros (GET `/api/products` y GET `/api/products/:id`)](#2-catálogo-de-productos)
3. [Validación de Cupones (POST `/api/promos/validate`)](#3-validación-de-cupones)
4. [Procesamiento de Checkout (POST `/api/checkout`)](#4-procesamiento-de-checkout)
5. [Historial de Órdenes de Clientes (GET `/api/customers/me/orders`)](#5-historial-de-órdenes-de-clientes)
6. [Resumen de Códigos HTTP y Manejo de Errores](#6-resumen-de-códigos-http)

---

## 1. Autenticación Unificada

### `POST /api/auth/login`
Autentica tanto a clientes (`customer`) como a administradores (`admin`).

#### Request
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "email": "cliente.qa@zzaly.com",
  "password": "ClienteQA_SecurePass2026!"
}
```

#### Respuesta Exitosa (`HTTP 200 OK`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "cliente.qa@zzaly.com",
    "name": "Cliente QA",
    "role": "customer"
  }
}
```
> *(Nota: Si el usuario autenticado tiene rol `admin`, la respuesta incluye adicionalmente la propiedad `admin` con los mismos datos del usuario para garantizar retrocompatibilidad total con el panel administrativo actual).*

#### Respuestas de Error
* **`HTTP 400 Bad Request`**:
  ```json
  { "error": "Email y contraseña son requeridos" }
  ```
* **`HTTP 401 Unauthorized`**:
  ```json
  { "error": "Credenciales inválidas" }
  ```

#### 🧭 Guía de Redirección Condicional para Frontend
El frontend debe almacenar el token (`localStorage` o cookie `httpOnly`) y evaluar el atributo `user.role` para redirigir:
```javascript
const { token, user } = await res.json();
localStorage.setItem('zzaly_token', token);
localStorage.setItem('zzaly_user', JSON.stringify(user));

if (user.role === 'admin') {
    // Redirigir al panel de administración
    navigate('/admin/dashboard');
} else {
    // Redirigir a la tienda o al perfil de compras del cliente
    navigate('/account/orders'); // o '/'
}
```

---

## 2. Catálogo de Productos

### `GET /api/products`
Obtiene la lista de productos disponibles en el catálogo.

#### 🛡️ Reglas Críticas del Ambiente QA:
1. **Filtro Estricto de Actividad:** **Solo** se retornan productos con `is_active = true`. Los productos inactivos están estrictamente excluidos.
2. **Filtro Talla + Color:** Al filtrar por combinación de talla y color (e.g. `?size=M&color=Negro`), el backend exige que `stock > 0`. Las combinaciones agotadas no se listan.

#### Parámetros de Consulta (Query Params)
| Parámetro | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `category` | `string` | Slug de la categoría | `vestidos` |
| `size` | `string` | Talla deseada | `M`, `S`, `XL` |
| `color` | `string` | Nombre del color | `Negro`, `Beige` |
| `min_price`| `number` | Precio mínimo | `50` |
| `max_price`| `number` | Precio máximo | `150` |
| `featured` | `boolean`| Filtrar destacados | `true` |
| `search` | `string` | Búsqueda por texto en nombre o descripción | `seda` |

#### Respuesta Exitosa (`HTTP 200 OK`)
```json
[
  {
    "id": 1,
    "name": "Vestido Midi Elegante",
    "slug": "vestido-midi-elegante",
    "description": "Un elegante vestido midi con caída fluida...",
    "price": "89.99",
    "is_featured": true,
    "is_active": true,
    "category_name": "Vestidos",
    "category_slug": "vestidos",
    "images": [
      {
        "id": 1,
        "url": "/images/product_dress.png",
        "alt_text": "Vestido Midi Elegante - Vista 1",
        "sort_order": 1
      }
    ],
    "variants": [
      {
        "id": 1,
        "size": "M",
        "color": "Negro",
        "color_hex": "#111111",
        "stock": 15
      }
    ],
    "sizes": ["S", "M", "L"],
    "colors": [
      { "name": "Negro", "hex": "#111111" },
      { "name": "Beige", "hex": "#EBDAC9" }
    ]
  }
]
```

---

### `GET /api/products/:id`
Obtiene el detalle completo de un producto mediante su `id` numérico o `slug`.

#### Respuestas
* **`HTTP 200 OK`**: Retorna el objeto del producto con sus variantes e imágenes.
* **`HTTP 404 Not Found`**:
  Se retorna de inmediato si el producto no existe o si su campo `is_active` es `false`:
  ```json
  { "error": "Producto no encontrado o inactivo" }
  ```

---

## 3. Validación de Cupones

### `POST /api/promos/validate`
Valida si un cupón ingresado por el usuario en el carrito está vigente y listo para aplicarse.

#### Reglas de Validación QA:
* El backend aplica `.trim()` y `.toUpperCase()` al código.
* Verifica que `is_active = true`.
* Verifica que la fecha actual se encuentre estrictamente entre `valid_from` y `valid_until` (o `expiration_date`).
* Si el cupón no existe, está inactivo, aún no inicia vigencia (como `FUTURO15`) o ya expiró (como `INACTIVO5`), el backend retorna `HTTP 400`.

#### Request
```json
{
  "code": "  zzaly10  ",
  "subtotal": 120.00
}
```

#### Respuesta Exitosa (`HTTP 200 OK`)
```json
{
  "id": 1,
  "code": "ZZALY10",
  "discount_type": "percentage",
  "discount_value": 10.0
}
```

#### Respuesta de Error (`HTTP 400 Bad Request`)
```json
{
  "error": "Cupón vencido o no válido"
}
```

---

## 4. Procesamiento de Checkout

### `POST /api/checkout`
Endpoint principal para procesar una compra con validación transaccional ACID, reserva/descuento de stock y recálculo de descuentos.

#### Payload Requerido por el Cliente
```json
{
  "items": [
    { "variantId": 1, "quantity": 2 }
  ],
  "customer": {
    "name": "Cliente QA",
    "email": "cliente.qa@zzaly.com",
    "phone": "55512345"
  },
  "shippingAddress": "Diagonal 6 10-01 Zona 10, Ciudad de Guatemala",
  "couponCode": "ZZALY10"
}
```

#### Formato de Respuesta Exitosa (`HTTP 201 Created`)
```json
{
  "success": true,
  "orderNumber": "ORD-2026-A1B2",
  "orderId": "3f721516-79cf-4cb5-8857-e67d26431908",
  "status": "pending",
  "subtotal": 179.98,
  "discountAmount": 18.00,
  "total": 161.98,
  "couponApplied": "ZZALY10",
  "customer": {
    "name": "Cliente QA",
    "email": "cliente.qa@zzaly.com",
    "phone": "55512345"
  },
  "shippingAddress": "Diagonal 6 10-01 Zona 10, Ciudad de Guatemala",
  "items": [
    {
      "variantId": 1,
      "productName": "Vestido Midi Elegante",
      "size": "M",
      "color": "Negro",
      "quantity": 2,
      "unitPrice": 89.99,
      "subtotal": 179.98
    }
  ],
  "paymentId": "7b8e19c3-98fe-4e0a-a82f-d890cf2b6942",
  "createdAt": "2026-10-13T06:30:00.000Z"
}
```

#### Manejo de Errores Esperados en Checkout
| Código HTTP | Causa | Formato del Body | Acción recomendada en Frontend |
| :--- | :--- | :--- | :--- |
| **`400 Bad Request`** | Carrito vacío, falta de email o dirección de envío. | `{"error": "Faltan datos obligatorios..."}` | Marcar campos del formulario en rojo y pedir completarlos. |
| **`404 Not Found`** | Una variante no existe o el producto está inactivo. | `{"error": "La variante con ID 999 no existe..."}` | Avisar al usuario que remueva el artículo no disponible. |
| **`409 Conflict`** | Inventario insuficiente (concurrencia o sobreventa). | `{"error": "Inventario insuficiente para 'Vestido Midi Elegante'..."}` | Mostrar alerta de stock insuficiente y sugerir ajustar cantidad. |
| **`422 Unprocessable`** | Cupón vencido, inexistente o inactivo. | `{"error": "Cupón vencido o no válido"}` | Mostrar mensaje en el input del cupón y permitir continuar sin cupón. |

---

## 5. Historial de Órdenes de Clientes

### `GET /api/customers/me/orders`
Permite a un cliente autenticado consultar todas las órdenes de compra asociadas a su cuenta.

#### Headers Requeridos
* `Authorization: Bearer <token_jwt_obtenido_en_login>`
* `Content-Type: application/json`

#### Respuesta Exitosa (`HTTP 200 OK`)
```json
{
  "count": 1,
  "orders": [
    {
      "orderId": "3f721516-79cf-4cb5-8857-e67d26431908",
      "orderNumber": "ORD-2026-A1B2",
      "createdAt": "2026-10-13T06:30:00.000Z",
      "status": "pending",
      "subtotal": 179.98,
      "discountAmount": 18.00,
      "total": 161.98,
      "shippingAddress": {
        "address": "Diagonal 6 10-01 Zona 10, Ciudad de Guatemala",
        "customerName": "Cliente QA"
      },
      "items": [
        {
          "productName": "Vestido Midi Elegante",
          "size": "M",
          "color": "Negro",
          "quantity": 2,
          "unitPrice": 89.99,
          "subtotal": 179.98
        }
      ]
    }
  ]
}
```

#### Respuesta de Error (`HTTP 401 Unauthorized`)
```json
{
  "error": "Token de autorización requerido (Authorization: Bearer <token>)"
}
```

---

## 6. Resumen de Códigos HTTP
* **`200 OK`**: Solicitud exitosa (lectura o verificación).
* **`201 Created`**: Recurso creado exitosamente (Checkout).
* **`400 Bad Request`**: Parámetros de petición incompletos, inválidos o cupón rechazado en prevalidación.
* **`401 Unauthorized`**: Falta token o credenciales incorrectas.
* **`404 Not Found`**: Recurso inexistente o producto inactivo.
* **`409 Conflict`**: Conflicto de concurrencia o stock agotado.
* **`422 Unprocessable Entity`**: Error de regla de negocio en checkout (cupón inválido en transacción).
* **`500 Internal Server Error`**: Excepción no controlada en el backend.

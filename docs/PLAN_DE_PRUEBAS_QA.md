# 📋 Plan de Pruebas de Calidad (QA) y Certificación de Entorno
## Sistema de Comercio Electrónico `zzaly`
**Documento:** Plan de Pruebas & Protocolo de Aceptación Técnica  
**Responsable (RACI A/R):** Daniel Marroquín — Senior Backend & DevOps Lead  
**QA Lead Receptor:** Diego  
**Líder Frontend:** Francisco Sánchez  
**Fecha de Emisión:** 14 de Octubre de 2026  
**Fecha de Ejecución Formal:** 16 de Octubre de 2026  
**Versión de Entrega:** 1.2.0-qa  

---
<!-- PÁGINA 1 -->
# [ PÁGINA 1: ESTRATEGIA, ALCANCE Y CONFIGURACIÓN DEL ENTORNO ]

## 1. Alcance y Objetivos de la Certificación QA
El presente documento certifica la disponibilidad, robustez y estabilidad del ambiente de pruebas (QA) para la plataforma `zzaly`, habilitando formalmente al equipo de Quality Assurance (liderado por Diego) para la ejecución de pruebas funcionales, no funcionales y de regresión previstas para el 16/10/2026.

### 1.1 Entornos Aprovisionados y Conectividad
* **Base de Datos Dedicada:** Proyecto en Supabase (`aws-1-us-west-2.pooler.supabase.com:5432/postgres`) con Session Pooler IPv4 y SSL forzado (`ssl: { rejectUnauthorized: false }`).
* **Servicio Web en la Nube:** Instancia activa en Render (`https://ecommerce-na6d.onrender.com`) desplegada desde la rama `qa`.
* **Motor Transaccional:** Procedimiento almacenado `process_checkout` con bloqueo `SELECT ... FOR UPDATE` (ACID) y soporte de idempotencia.

---

## 2. Catálogo de Datos y Casos Concretos de Prueba

### 2.1 Casos Específicos Requeridos por QA
| Concepto / Prenda | Parámetros Específicos | Criterio de Aceptación QA |
| :--- | :--- | :--- |
| **Vestido Floral Lía** | Precio: **Q350.00** \| Talla: `L` \| Color: `Negro` \| Stock: **0** | Al filtrar por talla `L` y color `Negro`, el producto no debe listarse en el catálogo (`stock > 0` requerido). |
| **Blusa Seda Ana** | Precio: **Q175.00** \| Talla: `S` \| Color: `Negro` \| Stock: **5** | Debe permitir añadir hasta 5 unidades al carrito. Intentar comprar 6 unidades debe responder `409 Conflict`. |
| **Pantalón Casual Vera** | Precio: **Q150.00 exacto** \| Tallas: `M` (Stock 15), `L` (Stock 10) | Prenda para pruebas de validación de umbrales exactos y cálculo de cupones. |
| **Blusa Retirada QA** | Estado: **Inactivo** (`is_active = false`) \| Precio: Q99.99 | No aparece en `GET /api/products`. Su consulta directa en `GET /api/products/blusa-retirada-qa` retorna `404 Not Found`. |

### 2.2 Cupones de Descuento Configurados en QA
| Código | Descuento | Estado | Vigencia | Comportamiento Esperado |
| :--- | :---: | :---: | :--- | :--- |
| `ZZALY10` | 10% | Activo | Vigente hoy | **Aceptado (200):** Aplica 10% sobre el subtotal recalculado en servidor. |
| `VERANO25` | 25% | Activo | **Vencido** (expiró hace 5 días) | **Rechazado (400/422):** Responde *"Cupón vencido o no válido"*. |
| `FUTURO15` | 15% | Activo | Futuro (+30 días) | **Rechazado (400/422):** Responde *"Cupón vencido o no válido"*. |
| `INACTIVO5` | 5% | Inactivo | Expirado (-30 días) | **Rechazado (400/422):** Responde *"Cupón vencido o no válido"*. |
| `QA100` | 100% | Activo | Vigente hoy | **Aceptado (200):** Total Q0.00 para pruebas sin costo. |

### 2.3 Órdenes de Prueba Iniciales (Total Acumulado: Q1,015.00)
1. **Orden 1 (`ORD-QA-1001`):** Total = **Q350.00** \| Estado = **Entregada (`delivered`)** *(1x Vestido Floral Lía)*.
2. **Orden 2 (`ORD-QA-1002`):** Total = **Q515.00** \| Estado = **Pagada (`paid`)** *(2x Blusa Seda Ana + Prenda Especial)*.
3. **Orden 3 (`ORD-QA-1003`):** Total = **Q150.00** \| Estado = **Pendiente (`pending`)** *(1x Pantalón Casual Vera)*.
* **Monto Acumulado:** $\text{Q}350.00 + \text{Q}515.00 + \text{Q}150.00 = \mathbf{Q1,015.00}$ exactos.

---
<!-- PÁGINA 2 -->
# [ PÁGINA 2: ACEPTACIÓN TÉCNICA, CREDENCIALES Y FIRMA DE ENTREGA ]

## 3. Matriz de Verificación y Checklist de Entrega

| # | Ítem de Verificación | Estado | Evidencia / Observaciones |
| :---: | :--- | :---: | :--- |
| **01** | Ambiente QA funcionando en Render y Supabase | **CUMPLIDO** | `GET /api/health` retorna `200 OK`. Conexión TLS activa. |
| **02** | Vestido Floral Lía (Q350) con L/Negro stock 0 | **CUMPLIDO** | Registrado en catálogo y verificado en `zz_product_variants`. |
| **03** | Blusa Seda Ana (Q175) con S en stock 5 | **CUMPLIDO** | Registrado con stock = 5 verificado en BD. |
| **04** | Producto de Q150.00 exacto (`Pantalón Casual Vera`) | **CUMPLIDO** | Registrado con `price = 150.00` exacto. |
| **05** | Blusa Retirada QA (`is_active = false`) | **CUMPLIDO** | Detalle retorna `404 Not Found`. Excluido de `/products`. |
| **06** | 3 órdenes de prueba con total de Q1,015.00 | **CUMPLIDO** | Suma exacta Q1,015.00 (`ORD-QA-1001` a `1003`). |
| **07** | Al menos una orden en estado "Entregada" (`delivered`) | **CUMPLIDO** | `ORD-QA-1001` persistida con estado `delivered`. |
| **08** | Cupones ZZALY10, VERANO25 (vencido), FUTURO15, INACTIVO5, QA100 | **CUMPLIDO** | 5 cupones provistos en `zz_promo_codes` con reglas vigentes. |
| **09** | Cuenta cliente `qa.cliente01@zzaly.test` funcional | **CUMPLIDO** | Cuenta activa con hash bcrypt en `zz_customers` y `zz_users`. |
| **10** | Cuenta de administrador funcional (`admin.qa@zzaly.com`) | **CUMPLIDO** | Cuenta administrativa activa con privilegios de panel. |
| **11** | Respaldo de la base de datos tomado | **CUMPLIDO** | Backup generado en `server/db/backups/backup_qa_supabase.sql`. |
| **12** | Protección contra errores 429 para QA (NF-02) | **CUMPLIDO** | Bypass de Rate Limit habilitado en `QA_WHITELIST_IP`. |

---

## 4. Protocolo de Entrega de Credenciales a Diego (QA Lead en Privado)

Por estándares de seguridad y para cumplimiento del caso de prueba de autenticación, las contraseñas no se almacenan en texto plano en la base de datos (se aplica `bcrypt` con factor de coste 10 y 12). Se entregan formalmente en este protocolo confidencial para su uso por parte de QA:

* **Cuenta Administrador QA:**
  - **Usuario:** `admin.qa@zzaly.com`
  - **Contraseña:** `AdminQA_SecurePass2026!`
  - **Destino / Rol:** Panel administrativo (`/admin/dashboard`, gestión de catálogo, órdenes y stock).
* **Cuenta Cliente QA:**
  - **Usuario:** `qa.cliente01@zzaly.test` *(y cuenta alternativa `cliente.qa@zzaly.com`)*
  - **Contraseña:** `ClienteQA_SecurePass2026!`
  - **Destino / Rol:** Tienda pública, checkout e historial de órdenes (`/api/customers/me/orders`).

---

## 5. Declaración de Conformidad y Firma de Entrega

Por medio de la presente, el responsable técnico del Backend certifica que el ambiente de pruebas (QA), sus esquemas relacionales, procedimientos almacenados transaccionales, semillas de datos, mecanismos de seguridad RBAC e integraciones han sido desplegados, validados y respaldados satisfactoriamente, quedando formalmente transferidos al equipo de QA para el inicio de las pruebas el 16 de Octubre de 2026.

```
____________________________________________________
            DANIEL MARROQUÍN
      Senior Backend & DevOps Lead
    RACI: Accountable / Responsible (A/R)
    Firma Digital: DM-QA-CERT-2026-10-14
    Fecha de Validación: 14/10/2026 22:45 UTC-6
```

**Recepción y Aceptación de QA:**
```
____________________________________________________
                 DIEGO
          QA & Quality Lead
    Firma de Conformidad: [ RECIBIDO CONFORME ]
    Fecha de Pase a Pruebas: 16/10/2026
```

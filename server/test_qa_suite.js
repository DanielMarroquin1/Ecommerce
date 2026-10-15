const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');

async function runTests() {
    console.log('🧪 Iniciando Suite de Pruebas Automatizadas QA Backend (zzaly)...\n');

    // Levantamos un servidor de pruebas en puerto 5099 usando la configuración de index.js
    const PORT = 5099;
    process.env.PORT = PORT;
    
    // Importamos app (o iniciamos escuchando en 5099)
    // Para no interferir con la instancia default de index.js, requerimos los routers y armamos un test server o lanzamos un child_process
    const { spawn } = require('child_process');

    const serverProc = spawn('node', ['index.js'], {
        cwd: __dirname,
        env: { ...process.env, PORT: '5099' },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverReady = false;
    serverProc.stdout.on('data', (d) => {
        const str = d.toString();
        if (str.includes('running at')) {
            serverReady = true;
        }
    });

    // Esperar a que el servidor esté listo
    for (let i = 0; i < 30; i++) {
        if (serverReady) break;
        await new Promise(r => setTimeout(r, 200));
    }

    const BASE_URL = `http://127.0.0.1:${PORT}`;

    const request = async (endpoint, options = {}) => {
        const url = new URL(endpoint, BASE_URL);
        const res = await fetch(url.toString(), {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();
        return { status: res.status, data };
    };

    let passed = 0;
    let failed = 0;

    const assert = (condition, testName, extraInfo = '') => {
        if (condition) {
            console.log(`  ✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${testName} ${extraInfo ? '— ' + extraInfo : ''}`);
            failed++;
        }
    };

    try {
        // ==========================================
        // 1. Health check
        // ==========================================
        console.log('--- 1. Health Check & Configuración Base ---');
        const health = await request('/api/health');
        assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health retorna 200 OK');

        // ==========================================
        // 2. Catálogo & Filtros (Casos Concretos QA)
        // ==========================================
        console.log('\n--- 2. Catálogo de Productos y Filtros QA ---');
        // Blusa Retirada QA (Inactiva -> 404)
        const blusaRetirada = await request('/api/products/blusa-retirada-qa');
        assert(blusaRetirada.status === 404, '“Blusa Retirada QA” inactiva retorna 404 Not Found');

        const inactiveProd = await request('/api/products/vestido-descatalogado-qa');
        assert(inactiveProd.status === 404, 'GET /api/products/:slug inactivo retorna 404 Not Found');

        const catalog = await request('/api/products');
        const allActive = catalog.data.every(p => p.is_active === true);
        assert(catalog.status === 200 && allActive, 'GET /api/products lista estrictamente productos con is_active = true');

        // Vestido Floral Lía (Q350) con la talla L/Negro en stock 0
        const floralLia = catalog.data.find(p => p.slug === 'vestido-floral-lia');
        const floralLiaLNegro = floralLia?.variants.find(v => v.size === 'L' && v.color === 'Negro');
        assert(
            floralLia && Number(floralLia.price) === 350.00 && floralLiaLNegro?.stock === 0,
            'Vestido Floral Lía (Q350) con la talla L/Negro en stock 0 existe en catálogo'
        );

        // Blusa Seda Ana (Q175) con la talla S en stock 5
        const sedaAna = catalog.data.find(p => p.slug === 'blusa-seda-ana');
        const sedaAnaSNegro = sedaAna?.variants.find(v => v.size === 'S');
        assert(
            sedaAna && Number(sedaAna.price) === 175.00 && sedaAnaSNegro?.stock === 5,
            'Blusa Seda Ana (Q175) con la talla S en stock 5 existe en catálogo'
        );

        // Producto de Q150.00 exacto
        const prod150 = catalog.data.find(p => Number(p.price) === 150.00);
        assert(!!prod150, 'Existe al menos un producto con precio de Q150.00 exacto en el catálogo');

        // Filtro Talla + Color exigiendo stock > 0
        const outOfStockFilter = await request('/api/products?size=L&color=Negro');
        // Floral Lía tiene stock 0 en L/Negro, por lo que NO debe aparecer en este filtro
        const floralInFiltered = outOfStockFilter.data.some(p => p.slug === 'vestido-floral-lia');
        assert(!floralInFiltered, 'Filtro combinado Talla+Color (L + Negro) excluye a "Vestido Floral Lía" por tener stock 0');

        const inStockFilter = await request('/api/products?size=S&color=Negro');
        assert(inStockFilter.status === 200 && inStockFilter.data.length > 0, 'Filtro combinado Talla+Color con stock > 0 retorna productos');

        // ==========================================
        // 3. Validación de Cupones QA
        // ==========================================
        console.log('\n--- 3. Validación de Cupones QA ---');
        const promoTrim = await request('/api/promos/validate', {
            method: 'POST',
            body: { code: '  zzaly10  ', subtotal: 100 }
        });
        assert(promoTrim.status === 200 && promoTrim.data.code === 'ZZALY10' && promoTrim.data.discount_value === 10, 'Cupón ZZALY10 con espacios aplica .trim() y retorna 200');

        // VERANO25 (vencido)
        const promoVerano = await request('/api/promos/validate', {
            method: 'POST',
            body: { code: 'VERANO25', subtotal: 100 }
        });
        assert(promoVerano.status === 400 && promoVerano.data.error === 'Cupón vencido o no válido', 'Cupón VERANO25 (vencido) retorna 400 "Cupón vencido o no válido"');

        const promoFuturo = await request('/api/promos/validate', {
            method: 'POST',
            body: { code: 'FUTURO15', subtotal: 100 }
        });
        assert(promoFuturo.status === 400 && promoFuturo.data.error === 'Cupón vencido o no válido', 'Cupón FUTURO15 (no iniciado) retorna 400 "Cupón vencido o no válido"');

        const promoInactivo = await request('/api/promos/validate', {
            method: 'POST',
            body: { code: 'INACTIVO5', subtotal: 100 }
        });
        assert(promoInactivo.status === 400 && promoInactivo.data.error === 'Cupón vencido o no válido', 'Cupón INACTIVO5 (expirado/inactivo) retorna 400 "Cupón vencido o no válido"');

        // ==========================================
        // 4. Autenticación & RBAC (CP-36)
        // ==========================================
        console.log('\n--- 4. Autenticación Unificada y Control de Roles (CP-36) ---');
        // Login con cuenta requerida qa.cliente01@zzaly.test
        const qaClientLogin = await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'qa.cliente01@zzaly.test', password: 'ClienteQA_SecurePass2026!' }
        });
        assert(qaClientLogin.status === 200 && qaClientLogin.data.user.role === 'customer', 'Cuenta qa.cliente01@zzaly.test autentica exitosamente con role "customer"');
        const customerToken = qaClientLogin.data.token;

        const adminLogin = await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'admin.qa@zzaly.com', password: 'AdminQA_SecurePass2026!' }
        });
        assert(adminLogin.status === 200 && adminLogin.data.user.role === 'admin' && !!adminLogin.data.token, 'Login admin exitoso con token y role: "admin"');
        const adminToken = adminLogin.data.token;

        const customerInAdmin = await request('/api/admin/dashboard', {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        assert(customerInAdmin.status === 403, 'CP-36: Token de rol "customer" en ruta /api/admin/* retorna 403 Forbidden');

        const adminInAdmin = await request('/api/admin/dashboard', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(adminInAdmin.status === 200, 'Token de rol "admin" en ruta /api/admin/* permite acceso 200 OK');

        // Verificar 3 órdenes precreadas de prueba de QA
        const adminOrders = await request('/api/admin/orders', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const qaOrders = adminOrders.data.filter(o => ['ORD-QA-1001', 'ORD-QA-1002', 'ORD-QA-1003'].includes(o.order_number));
        const totalQAOrders = qaOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
        const hasDelivered = qaOrders.some(o => o.status === 'delivered');

        assert(
            qaOrders.length === 3 && totalQAOrders === 1015.00 && hasDelivered,
            '3 órdenes de prueba con total acumulado de Q1,015.00 y una en estado "Entregada" (delivered)'
        );

        const customerOrders = await request('/api/customers/me/orders', {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        assert(customerOrders.status === 200 && Array.isArray(customerOrders.data.orders), 'GET /api/customers/me/orders retorna historial del cliente');

        // ==========================================
        // 5. Checkout, Idempotencia & Recálculo
        // ==========================================
        console.log('\n--- 5. Checkout Seguro, Recálculo e Idempotencia (CP-23) ---');
        // Obtener ID de variante con stock
        const firstProduct = catalog.data[0];
        const validVariant = firstProduct.variants.find(v => v.stock > 0);

        // Validación de campos
        const badPhoneCheckout = await request('/api/checkout', {
            method: 'POST',
            body: {
                items: [{ variantId: validVariant.id, quantity: 1 }],
                customer: { name: 'Test', email: 'test@example.com', phone: '123' }, // teléfono inválido (menos de 8 dígitos)
                shippingAddress: 'Ciudad'
            }
        });
        assert(badPhoneCheckout.status === 400, 'Checkout rechaza teléfono con longitud distinta a 8 dígitos con 400 Bad Request');

        // Checkout válido e idempotencia
        const idempotencyKey = `QA-TEST-${Date.now()}-${Math.random()}`;
        const checkoutPayload = {
            items: [{ variantId: validVariant.id, quantity: 1, price: 0.01 }], // Precio manipulado por cliente
            customer: { name: 'Cliente QA', email: 'cliente.qa@zzaly.com', phone: '55512345' },
            shippingAddress: 'Zona 10, Guatemala',
            couponCode: 'ZZALY10'
        };

        const firstCheckout = await request('/api/checkout', {
            method: 'POST',
            headers: { 'Idempotency-Key': idempotencyKey },
            body: checkoutPayload
        });

        assert(firstCheckout.status === 201 && firstCheckout.data.success === true, 'Checkout exitoso retorna 201 Created');
        assert(firstCheckout.data.orderNumber && firstCheckout.data.orderNumber.startsWith('ORD-'), 'Checkout genera identificador de orden legible (ORD-XXXX)');
        assert(firstCheckout.data.subtotal > 1, 'Servidor recalcula el precio autoritativo desde BD (ignora precio manipulado 0.01)');

        // Repetición con misma Idempotency-Key
        const secondCheckout = await request('/api/checkout', {
            method: 'POST',
            headers: { 'Idempotency-Key': idempotencyKey },
            body: checkoutPayload
        });
        assert(secondCheckout.status === 200 && secondCheckout.data.idempotent === true && secondCheckout.data.orderId === firstCheckout.data.orderId, 'CP-23: Petición repetida con misma Idempotency-Key retorna 200 y misma orden sin duplicar');

        // ==========================================
        // 6. Validaciones de Negocio y Estados
        // ==========================================
        console.log('\n--- 6. Validaciones de Negocio, Estados y Control de Errores ---');
        // Validar producto sin nombre
        const noNameProd = await request('/api/admin/products', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { name: '', price: 50, slug: 'prod-invalido' }
        });
        assert(noNameProd.status === 400, 'Crear producto sin nombre retorna 400 Bad Request (no 500)');

        // Validar producto con precio <= 0
        const badPriceProd = await request('/api/admin/products', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { name: 'Producto Gratis', price: -10, slug: 'prod-gratis' }
        });
        assert(badPriceProd.status === 400, 'Crear producto con precio <= 0 retorna 400 Bad Request');

        // Validar cupón con porcentaje inválido (>100)
        const badPctPromo = await request('/api/admin/promos', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { code: 'SUPER200', discount_type: 'percentage', discount_value: 200 }
        });
        assert(badPctPromo.status === 400, 'Crear cupón con porcentaje > 100 retorna 400 Bad Request');

        // Validar cupón con fechas invertidas
        const badDatesPromo = await request('/api/admin/promos', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { 
                code: 'FECHAMAL', 
                discount_type: 'fixed', 
                discount_value: 10,
                valid_from: '2026-12-31',
                valid_until: '2026-01-01'
            }
        });
        assert(badDatesPromo.status === 400, 'Crear cupón con valid_from > valid_until retorna 400 Bad Request');

        // Validar cupón duplicado
        const dupPromo = await request('/api/admin/promos', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { code: 'ZZALY10', discount_type: 'percentage', discount_value: 10 }
        });
        assert(dupPromo.status === 409, 'Crear cupón con código ya existente retorna 409 Conflict');

        // Máquina de estados: orden recién creada firstCheckout.data.orderId
        const createdOrderId = firstCheckout.data.orderId;

        // Actualizar a paid (Soportar estado 'paid')
        const setPaid = await request(`/api/admin/orders/${createdOrderId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { status: 'paid' }
        });
        assert(setPaid.status === 200 && setPaid.data.status === 'paid', 'Máquina de estados: Soporta transición a "paid" (200 OK)');

        // Avanzar a delivered (paid -> processing -> shipped -> delivered)
        await request(`/api/admin/orders/${createdOrderId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { status: 'processing' }
        });
        await request(`/api/admin/orders/${createdOrderId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { status: 'shipped' }
        });
        const setDelivered = await request(`/api/admin/orders/${createdOrderId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { status: 'delivered' }
        });
        assert(setDelivered.status === 200 && setDelivered.data.status === 'delivered', 'Transición válida a "delivered" completada');

        // Intentar transición prohibida: delivered -> pending
        const invalidTransition = await request(`/api/admin/orders/${createdOrderId}/status`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { status: 'pending' }
        });
        assert(invalidTransition.status === 400, 'Máquina de estados: Rechaza transición inválida ("delivered" -> "pending") con 400 Bad Request');

        // ==========================================
        // 7. Sanitización de Errores (NF-06)
        // ==========================================
        console.log('\n--- 7. Sanitización de Errores y Seguridad (NF-06) ---');
        const unknownRoute = await request('/api/ruta-inexistente-para-prueba-404');
        assert(unknownRoute.status === 404 && unknownRoute.data.error === 'Ruta no encontrada', 'Rutas inexistentes retornan 404 controlado sin trazas');

    } catch (e) {
        console.error('Error fatal durante la ejecución de pruebas:', e);
        failed++;
    } finally {
        serverProc.kill();
    }

    console.log(`\n==============================================`);
    console.log(`📊 RESUMEN: ${passed} Pasadas, ${failed} Fallidas`);
    console.log(`==============================================`);

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests();

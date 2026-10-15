const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Error de seguridad crítico: La variable de entorno JWT_SECRET es obligatoria.');
}
const JWT_EXPIRY = '24h';

/**
 * Servicio de Gestión de Clientes (zz_customers)
 */
class CustomerService {
    /**
     * Registra un nuevo cliente con hash seguro bcrypt (salt rounds = 12)
     */
    async register({ name, email, password, phone }) {
        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = phone ? String(phone).trim() : null;

        // Verificar si el correo ya existe en zz_customers
        const existingCustomer = await pool.query(
            `SELECT id FROM zz_customers WHERE LOWER(email) = $1`,
            [cleanEmail]
        );

        if (existingCustomer.rows.length > 0) {
            const err = new Error('El correo electrónico ya se encuentra registrado');
            err.statusCode = 409;
            throw err;
        }

        // Hasheo seguro de contraseña con bcrypt (cost factor 12)
        const passwordHash = await bcrypt.hash(password, 12);

        // Inserción en zz_customers
        const result = await pool.query(
            `INSERT INTO zz_customers (name, email, password_hash, phone, role)
             VALUES ($1, $2, $3, $4, 'customer')
             RETURNING id, name, email, phone, role, created_at`,
            [cleanName, cleanEmail, passwordHash, cleanPhone]
        );

        const newCustomer = result.rows[0];

        // Sincronización en zz_users para compatibilidad global
        try {
            await pool.query(
                `INSERT INTO zz_users (name, email, password_hash, role)
                 VALUES ($1, $2, $3, 'customer')
                 ON CONFLICT (email) DO UPDATE SET password_hash = $3, name = $1`,
                [cleanName, cleanEmail, passwordHash]
            );
        } catch (e) {
            // Ignorar si zz_users no está disponible
        }

        // Generar token JWT inicial
        const tokenPayload = {
            id: newCustomer.id,
            email: newCustomer.email,
            name: newCustomer.name,
            role: newCustomer.role || 'customer'
        };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        return {
            token,
            customer: {
                id: newCustomer.id,
                name: newCustomer.name,
                email: newCustomer.email,
                phone: newCustomer.phone,
                role: newCustomer.role,
                createdAt: newCustomer.created_at
            }
        };
    }

    /**
     * Autenticación / Login exclusivo contra zz_customers
     * Retorna token JWT y objeto user con campo explícito role: 'customer'
     */
    async login({ email, password }) {
        const cleanEmail = String(email).trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, name, email, password_hash, phone, role 
             FROM zz_customers 
             WHERE LOWER(email) = $1`,
            [cleanEmail]
        );

        if (result.rows.length === 0) {
            const err = new Error('Credenciales inválidas');
            err.statusCode = 401;
            throw err;
        }

        const customer = result.rows[0];

        const validPassword = await bcrypt.compare(password, customer.password_hash);
        if (!validPassword) {
            const err = new Error('Credenciales inválidas');
            err.statusCode = 401;
            throw err;
        }

        const tokenPayload = {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            role: customer.role || 'customer'
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        return {
            token,
            user: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                role: customer.role || 'customer'
            }
        };
    }

    /**
     * Historial de órdenes asociadas al cliente autenticado
     */
    async getCustomerOrders({ id, email }) {
        const ordersResult = await pool.query(
            `SELECT o.id, o.order_number, o.status, o.subtotal, o.discount_amount, o.total,
                    o.shipping_address, o.contact_email, o.created_at
             FROM zz_orders o
             WHERE o.customer_id = $1 OR LOWER(o.contact_email) = LOWER($2)
             ORDER BY o.created_at DESC`,
            [id, email]
        );

        const orders = await Promise.all(
            ordersResult.rows.map(async (order) => {
                const itemsResult = await pool.query(
                    `SELECT id, product_name, size, color, quantity, unit_price, subtotal
                     FROM zz_order_items
                     WHERE order_id = $1
                     ORDER BY id ASC`,
                    [order.id]
                );

                const fallbackSuffix = String(order.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
                const orderNumber = order.order_number || `ORD-2026-${fallbackSuffix || '0000'}`;

                return {
                    orderId: order.id,
                    orderNumber,
                    createdAt: order.created_at,
                    status: order.status,
                    subtotal: parseFloat(order.subtotal),
                    discountAmount: parseFloat(order.discount_amount || 0),
                    total: parseFloat(order.total),
                    shippingAddress: order.shipping_address,
                    items: itemsResult.rows.map(item => ({
                        productName: item.product_name,
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity,
                        unitPrice: parseFloat(item.unit_price),
                        subtotal: parseFloat(item.subtotal)
                    }))
                };
            })
        );

        return {
            count: orders.length,
            orders
        };
    }
}

module.exports = new CustomerService();

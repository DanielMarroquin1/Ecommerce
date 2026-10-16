/**
 * Middlewares de Validación para Checkout y Clientes
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[0-9]{8}$/;

/**
 * Middleware para validar el payload de Checkout
 */
const validateCheckout = (req, res, next) => {
    const body = req.body || {};

    const items = body.items;
    const rawCustomer = (body.customer && typeof body.customer === 'object') ? body.customer : {};
    const customer = {
        name: rawCustomer.name || body.customerName || body.contactName || body.name,
        email: rawCustomer.email || body.customerEmail || body.contactEmail || body.email,
        phone: rawCustomer.phone || body.customerPhone || body.contactPhone || body.phone
    };
    const shippingAddress = body.shippingAddress || body.address || (typeof rawCustomer.address === 'string' ? rawCustomer.address : null);

    // 1. Validar carrito e items
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío o no contiene artículos' });
    }

    for (const item of items) {
        const variantId = item.variantId || item.variant_id;
        const quantity = parseInt(item.quantity || item.qty, 10);

        if (!variantId || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ 
                error: 'Cada artículo debe tener un variantId válido y una cantidad mayor a cero' 
            });
        }
    }

    // 2. Validar presencia de campos de cliente y entrega
    if (!customer.name || !String(customer.name).trim()) {
        return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
    }

    if (!customer.email || !String(customer.email).trim()) {
        return res.status(400).json({ error: 'El correo electrónico del cliente es obligatorio' });
    }

    if (!shippingAddress || (typeof shippingAddress === 'string' && !shippingAddress.trim())) {
        return res.status(400).json({ error: 'La dirección de envío es obligatoria' });
    }

    // 3. Validar formato estándar de correo electrónico
    const normalizedEmail = String(customer.email).trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'El formato del correo electrónico es inválido' });
    }

    // 4. Validar formato de teléfono (exactamente 8 dígitos numéricos)
    if (!customer.phone || !String(customer.phone).trim()) {
        return res.status(400).json({ error: 'El número de teléfono es obligatorio' });
    }

    const cleanPhone = String(customer.phone).trim().replace(/\D/g, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({ 
            error: 'El número de teléfono debe contener exactamente 8 dígitos numéricos' 
        });
    }

    // Normalizar objeto en request para el servicio
    req.normalizedCheckout = {
        items: items.map(i => ({
            variantId: parseInt(i.variantId || i.variant_id, 10),
            quantity: parseInt(i.quantity || i.qty, 10)
        })),
        customer: {
            name: String(customer.name).trim(),
            email: normalizedEmail.toLowerCase(),
            phone: cleanPhone
        },
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress.trim() : shippingAddress,
        couponCode: body.couponCode || body.coupon_code || body.promoCode || null,
        userId: body.userId || null,
        idempotencyKey: req.headers['idempotency-key'] || body.idempotencyKey || body.idempotency_key || null
    };

    next();
};

/**
 * Middleware para validar registro de cliente
 */
const validateCustomerRegister = (req, res, next) => {
    const { name, email, password, phone } = req.body || {};

    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!email || !String(email).trim()) {
        return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({ error: 'El formato del correo electrónico es inválido' });
    }

    // Validación de teléfono si se proporciona
    if (phone) {
        const cleanPhone = String(phone).trim();
        if (!PHONE_REGEX.test(cleanPhone)) {
            return res.status(400).json({ 
                error: 'El número de teléfono debe contener exactamente 8 dígitos numéricos' 
            });
        }
    }

    // Política de contraseñas: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'La contraseña es obligatoria' });
    }

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
        return res.status(400).json({ 
            error: 'La contraseña debe tener al menos 8 caracteres y contener al menos una mayúscula, una minúscula y un número' 
        });
    }

    next();
};

/**
 * Middleware para validar login de cliente
 */
const validateCustomerLogin = (req, res, next) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    next();
};

module.exports = {
    validateCheckout,
    validateCustomerRegister,
    validateCustomerLogin
};

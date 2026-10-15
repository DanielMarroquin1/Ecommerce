const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validación estricta de arranque: JWT_SECRET obligatorio sin fallback
if (!process.env.JWT_SECRET) {
    console.error('❌ Error de seguridad crítico: La variable de entorno JWT_SECRET es obligatoria.');
    process.exit(1);
}

const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const promosRouter = require('./routes/promos');
const checkoutRouter = require('./routes/checkout');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const customersRouter = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de trust proxy para resolución correcta de IPs tras proxies (Render, Cloudflare)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — Restrict to known origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin.includes('netlify.app'))) {
            return callback(null, true);
        }
        callback(null, true); // Allow all for now, can restrict later
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiting con Excepción para IP de QA (NF-02)
const isWhitelistedQA = (req) => {
    const whitelist = process.env.QA_WHITELIST_IP;
    if (!whitelist) return false;

    const clientIps = [
        req.ip,
        req.connection?.remoteAddress,
        req.socket?.remoteAddress,
        req.headers['x-forwarded-for']
    ].filter(Boolean).map(ip => String(ip).trim().toLowerCase());

    const allowedIps = whitelist.split(',').map(ip => ip.trim().toLowerCase());
    return allowedIps.some(allowed => clientIps.some(ip => ip.includes(allowed)));
};

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isWhitelistedQA,
    message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isWhitelistedQA,
    message: { error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);

// Routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/promos', promosRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);

// Root & Health check
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to zzaly Ecommerce API', docs: '/api/health' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware para rutas no encontradas (404)
app.use((req, res, next) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware Global de Errores con Sanitización (NF-06)
// Nunca expone err.message de excepciones internas o SQL en QA o Producción
app.use((err, req, res, next) => {
    console.error('Unhandled internal error:', err);

    const statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : 500);
    const isCloudEnv = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'qa';

    if (statusCode >= 400 && statusCode < 500 && err.message) {
        return res.status(statusCode).json({ error: err.message });
    }

    if (isCloudEnv) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }

    return res.status(statusCode).json({
        error: err.message || 'Error interno del servidor',
        stack: err.stack
    });
});

app.listen(PORT, () => {
    console.log(`🚀 zzaly server running at http://localhost:${PORT}`);
});

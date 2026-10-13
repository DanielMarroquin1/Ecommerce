const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const promosRouter = require('./routes/promos');
const checkoutRouter = require('./routes/checkout');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const customersRouter = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
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

app.listen(PORT, () => {
    console.log(`🚀 zzaly server running at http://localhost:${PORT}`);
});

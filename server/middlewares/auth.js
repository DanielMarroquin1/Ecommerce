const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Error de seguridad crítico: La variable de entorno JWT_SECRET es obligatoria.');
}

/**
 * Middleware para requerir autenticación JWT válida (Cliente o Admin)
 * Si no hay token o es inválido: HTTP 401 Unauthorized
 */
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticación requerido (Authorization: Bearer <token>)' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

/**
 * Middleware de Autorización RBAC: Exige rol 'admin' (Cumple Caso de Prueba CP-36)
 * - Si no hay token o es inválido/expirado: HTTP 401 Unauthorized
 * - Si el usuario está autenticado pero su rol NO es 'admin' (ej. 'customer'): HTTP 403 Forbidden
 */
const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // CP-36: Verificar rol de administrador estricto
        if (!decoded || decoded.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Acceso denegado: se requieren privilegios de administrador para realizar esta acción' 
            });
        }

        req.user = decoded;
        req.admin = decoded; // Compatibilidad hacia atrás con rutas administrativas
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = {
    requireAuth,
    isAdmin
};

/**
 * Configuración autoritativa de API para el Frontend (Netlify / Producción / QA / Dev)
 * Previene desincronizaciones de entorno (BUG-003) asegurando una URL canónica.
 */
export const API_URL = (
    import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api'
).replace(/\/+$/, '');

export default API_URL;

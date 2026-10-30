import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('zzaly_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('zzaly_token') || null;
    });

    const [loading, setLoading] = useState(false);

    // Guardar o limpiar sesión en localStorage
    useEffect(() => {
        if (token && user) {
            localStorage.setItem('zzaly_token', token);
            localStorage.setItem('zzaly_user', JSON.stringify(user));
            // Si es admin, sincronizar tokens legados del panel admin
            if (user.role === 'admin') {
                localStorage.setItem('zzaly_admin_token', token);
                localStorage.setItem('zzaly_admin_user', JSON.stringify(user));
            }
        } else {
            localStorage.removeItem('zzaly_token');
            localStorage.removeItem('zzaly_user');
        }
    }, [token, user]);

    // Función de Login unificada (clientes y administradores)
    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Credenciales inválidas' };
            }

            const loggedUser = data.user || data.admin || { email, role: 'customer' };
            setToken(data.token);
            setUser(loggedUser);

            return { success: true, user: loggedUser, token: data.token };
        } catch (err) {
            return { success: false, error: 'No se pudo conectar con el servidor de autenticación' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Función de Registro de Clientes
    const register = useCallback(async ({ name, email, password, phone }) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/customers/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, phone })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Error al registrar cliente' };
            }

            const newUser = data.user || { name, email, role: 'customer' };
            setToken(data.token);
            setUser(newUser);

            return { success: true, user: newUser, token: data.token };
        } catch (err) {
            return { success: false, error: 'Error de red al intentar registrarse' };
        } finally {
            setLoading(false);
        }
    }, []);

    // Función de Logout
    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('zzaly_token');
        localStorage.removeItem('zzaly_user');
        localStorage.removeItem('zzaly_admin_token');
        localStorage.removeItem('zzaly_admin_user');
    }, []);

    const isAuthenticated = Boolean(token && user);
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAuthenticated,
            isAdmin,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
    }
    return context;
}

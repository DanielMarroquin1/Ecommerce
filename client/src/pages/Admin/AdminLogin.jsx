import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error de autenticación');
                setLoading(false);
                return;
            }

            localStorage.setItem('zzaly_admin_token', data.token);
            localStorage.setItem('zzaly_admin_user', JSON.stringify(data.admin));
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Error de conexión con el servidor');
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <h1 className="admin-login-logo">zz<span>a</span>ly</h1>
                    <p>Panel de Administración</p>
                </div>

                {error && <div className="admin-login-error">{error}</div>}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="admin-form-group">
                        <label>Correo electrónico</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@zzaly.com"
                            autoComplete="email"
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••••"
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="admin-login-btn" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    Conexión segura
                </div>
            </div>
        </div>
    );
}

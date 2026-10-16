import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';
    const navigate = useNavigate();
    const { login, register, loading } = useAuth();

    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Login Form State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register Form State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regPassword, setRegPassword] = useState('');

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!loginEmail || !loginPassword) {
            setError('Por favor ingresa tu correo y contraseña');
            return;
        }

        const res = await login(loginEmail, loginPassword);
        if (res.success) {
            if (res.user?.role === 'admin' && redirect === '/') {
                navigate('/admin/dashboard');
            } else {
                navigate(redirect);
            }
        } else {
            setError(res.error || 'Credenciales inválidas');
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!regName.trim()) {
            setError('El nombre completo es obligatorio');
            return;
        }
        if (!regEmail.trim()) {
            setError('El correo electrónico es obligatorio');
            return;
        }
        const cleanPhone = regPhone.trim();
        if (cleanPhone && cleanPhone.length !== 8) {
            setError('El teléfono debe contener exactamente 8 dígitos');
            return;
        }
        if (regPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        const res = await register({
            name: regName,
            email: regEmail,
            password: regPassword,
            phone: cleanPhone || null
        });

        if (res.success) {
            setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo...');
            setTimeout(() => {
                navigate(redirect);
            }, 800);
        } else {
            setError(res.error || 'Error al crear la cuenta');
        }
    };

    // Helper para pruebas rápidas de QA
    const fillQaAccount = (type) => {
        setError('');
        if (type === 'customer') {
            setTab('login');
            setLoginEmail('cliente.qa@zzaly.com');
            setLoginPassword('ClienteQA_SecurePass2026!');
        } else if (type === 'admin') {
            setTab('login');
            setLoginEmail('admin.qa@zzaly.com');
            setLoginPassword('AdminQA_SecurePass2026!');
        }
    };

    return (
        <div className="client-auth-page">
            <div className="client-auth-container">
                <div className="client-auth-header">
                    <Link to="/" className="auth-brand-logo">
                        zz<span>a</span>ly
                    </Link>
                    <p className="auth-brand-sub">
                        {redirect.includes('carrito') ? 'Inicia sesión para completar tu compra' : 'Bienvenido a nuestra boutique'}
                    </p>
                </div>

                {/* Tabs de Selección */}
                <div className="auth-tabs">
                    <button
                        type="button"
                        className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => { setTab('login'); setError(''); }}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        type="button"
                        className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => { setTab('register'); setError(''); }}
                    >
                        Crear Cuenta
                    </button>
                </div>

                {error && (
                    <div className="auth-alert error">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="auth-alert success">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Tab 1: Iniciar Sesión */}
                {tab === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="client-auth-form">
                        <div className="auth-field-group">
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-field-group">
                            <div className="auth-field-label-row">
                                <label>Contraseña</label>
                            </div>
                            <input
                                type="password"
                                required
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                placeholder="••••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Verificando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                )}

                {/* Tab 2: Crear Cuenta */}
                {tab === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="client-auth-form">
                        <div className="auth-field-group">
                            <label>Nombre Completo *</label>
                            <input
                                type="text"
                                required
                                value={regName}
                                onChange={e => setRegName(e.target.value)}
                                placeholder="Ej. Ana Morales"
                                autoComplete="name"
                            />
                        </div>

                        <div className="auth-field-group">
                            <label>Correo Electrónico *</label>
                            <input
                                type="email"
                                required
                                value={regEmail}
                                onChange={e => setRegEmail(e.target.value)}
                                placeholder="ana@ejemplo.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-field-group">
                            <label>Teléfono (8 dígitos para envíos)</label>
                            <input
                                type="tel"
                                maxLength="8"
                                value={regPhone}
                                onChange={e => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                placeholder="55512345"
                            />
                        </div>

                        <div className="auth-field-group">
                            <label>Contraseña (mínimo 6 caracteres) *</label>
                            <input
                                type="password"
                                required
                                value={regPassword}
                                onChange={e => setRegPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Creando cuenta...' : 'Registrarme y Continuar'}
                        </button>
                    </form>
                )}

                {/* Panel de Ayuda Rápida para QA y Evaluación */}
                <div className="auth-qa-helper">
                    <p className="qa-helper-title">⚡ Acceso Rápido de Prueba (QA):</p>
                    <div className="qa-helper-buttons">
                        <button
                            type="button"
                            onClick={() => fillQaAccount('customer')}
                            className="qa-quick-btn"
                        >
                            👤 Cargar Cliente QA
                        </button>
                        <button
                            type="button"
                            onClick={() => fillQaAccount('admin')}
                            className="qa-quick-btn"
                        >
                            ⚙️ Cargar Admin QA
                        </button>
                    </div>
                </div>

                <div className="auth-footer-nav">
                    {redirect.includes('carrito') && (
                        <Link to="/carrito" className="back-link">
                            ← Volver al Carrito
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

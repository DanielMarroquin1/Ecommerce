import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [checking, setChecking] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('zzaly_admin_token');
        if (!token) {
            navigate('/admin/login');
            return;
        }

        fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.valid && (data.admin || data.user?.role === 'admin')) {
                    setAdmin(data.admin || data.user);
                    setChecking(false);
                } else {
                    localStorage.removeItem('zzaly_admin_token');
                    localStorage.removeItem('zzaly_admin_user');
                    navigate('/admin/login');
                }
            })
            .catch(() => {
                navigate('/admin/login');
            });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('zzaly_admin_token');
        localStorage.removeItem('zzaly_admin_user');
        navigate('/admin/login');
    };

    const isActive = (path) => location.pathname.includes(path);

    if (checking) {
        return (
            <div className="admin-checking">
                <div className="admin-checking-spinner"></div>
                <p>Verificando acceso...</p>
            </div>
        );
    }

    const navItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/productos', icon: '📦', label: 'Productos' },
        { path: '/admin/pedidos', icon: '🛒', label: 'Pedidos' },
        { path: '/admin/promos', icon: '🏷️', label: 'Promociones' },
    ];

    return (
        <div className="admin-layout">
            {/* Mobile toggle */}
            <button className="admin-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                ☰
            </button>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <h2 className="admin-sidebar-logo">zz<span>a</span>ly</h2>
                    <span className="admin-sidebar-badge">Admin</span>
                </div>

                <nav className="admin-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="admin-nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    {admin && (
                        <div className="admin-user-info">
                            <div className="admin-user-avatar">
                                {admin.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <div className="admin-user-name">{admin.name}</div>
                                <div className="admin-user-email">{admin.email}</div>
                            </div>
                        </div>
                    )}
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)}></div>}

            {/* Main Content */}
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { totalItems } = useCart();
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const isHome = location.pathname === '/';
    const lastScrollY = useRef(0);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            setScrolled(currentY > 60);

            // Hide on scroll down, show on scroll up
            if (currentY > 300) {
                setHidden(currentY > lastScrollY.current);
            } else {
                setHidden(false);
            }
            lastScrollY.current = currentY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
        setUserMenuOpen(false);
    }, [location]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <>
            {/* Announcement Bar */}
            <div className="announcement-bar">
                <div className="announcement-marquee">
                    <span>✨ ENVÍO GRATIS en compras mayores a Q500 &nbsp;&nbsp;|&nbsp;&nbsp; 🎁 NUEVA COLECCIÓN DISPONIBLE &nbsp;&nbsp;|&nbsp;&nbsp; 💳 PAGOS SEGUROS &nbsp;&nbsp;|&nbsp;&nbsp; ✨ ENVÍO GRATIS en compras mayores a Q500 &nbsp;&nbsp;|&nbsp;&nbsp; 🎁 NUEVA COLECCIÓN DISPONIBLE &nbsp;&nbsp;|&nbsp;&nbsp; 💳 PAGOS SEGUROS &nbsp;&nbsp;|&nbsp;&nbsp;</span>
                </div>
            </div>

            {!isHome && <div style={{ height: '108px' }}></div>}

            <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isHome ? 'is-home' : ''} ${hidden ? 'nav-hidden' : ''}`}>
                <div className="navbar-inner">
                    <Link to="/" className="navbar-logo">
                        zz<span>a</span>ly
                    </Link>

                    <ul className="navbar-links">
                        <li><Link to="/" className={isActive('/')}>Inicio</Link></li>
                        <li><Link to="/nosotros" className={isActive('/nosotros')}>Nosotros</Link></li>
                        <li className="nav-dropdown-container">
                            <Link to="/catalogo" className={isActive('/catalogo')}>Catálogo</Link>
                            <div className="nav-dropdown">
                                <div className="dropdown-links">
                                    <h4>Categorías</h4>
                                    <Link to="/catalogo?category=vestidos">Vestidos</Link>
                                    <Link to="/catalogo?category=blusas">Blusas</Link>
                                    <Link to="/catalogo?category=pantalones">Pantalones</Link>
                                    <Link to="/catalogo?category=abrigos">Abrigos</Link>
                                    <Link to="/catalogo?category=accesorios">Accesorios</Link>
                                    <Link to="/catalogo" className="view-all">Ver Todo →</Link>
                                </div>
                                <div className="dropdown-image">
                                    <img src="https://placehold.co/400x500/EBDAC9/5D4032?text=Colección+2026" alt="Nueva Colección" />
                                    <div className="dropdown-image-text">Nueva Temporada</div>
                                </div>
                            </div>
                        </li>

                        {/* Carrito */}
                        <li>
                            <Link to="/carrito" className={`navbar-cart ${isActive('/carrito')}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 01-8 0" />
                                </svg>
                                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                            </Link>
                        </li>

                        {/* Botón de Inicio de Sesión / Perfil de Usuario */}
                        <li>
                            {!isAuthenticated ? (
                                <Link to="/login" className={`navbar-auth-btn ${isActive('/login')}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <span>Iniciar Sesión</span>
                                </Link>
                            ) : (
                                <div className="navbar-user-dropdown-wrapper" ref={userMenuRef}>
                                    <button
                                        type="button"
                                        className="navbar-user-trigger"
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        aria-label="Perfil de usuario"
                                    >
                                        <span className="navbar-avatar-circle">
                                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                        <span className="navbar-user-name">
                                            {user?.name ? user.name.split(' ')[0] : 'Cuenta'}
                                        </span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </button>

                                    {userMenuOpen && (
                                        <div className="navbar-user-menu-popover">
                                            <div className="menu-popover-header">
                                                <strong>{user.name}</strong>
                                                <small>{user.email}</small>
                                                <span className={`role-badge ${user.role}`}>
                                                    {user.role === 'admin' ? '🛡️ Administrador' : '👤 Cliente'}
                                                </span>
                                            </div>
                                            <div className="menu-popover-divider" />
                                            {user.role === 'admin' && (
                                                <Link
                                                    to="/admin/dashboard"
                                                    className="menu-popover-item"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    ⚙️ Panel de Administración
                                                </Link>
                                            )}
                                            <Link
                                                to="/carrito"
                                                className="menu-popover-item"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                🛍️ Mi Carrito ({totalItems})
                                            </Link>
                                            <button
                                                type="button"
                                                className="menu-popover-logout"
                                                onClick={() => {
                                                    logout();
                                                    setUserMenuOpen(false);
                                                }}
                                            >
                                                🚪 Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    </ul>

                    <button
                        className={`hamburger ${menuOpen ? 'open' : ''}`}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>

            <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-inner">
                    <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
                    <Link to="/nosotros" onClick={() => setMenuOpen(false)}>Nosotros</Link>

                    <div className="mobile-dropdown-container">
                        <span className="mobile-dropdown-title">Catálogo</span>
                        <div className="mobile-dropdown-links">
                            <Link to="/catalogo?category=vestidos" onClick={() => setMenuOpen(false)}>Vestidos</Link>
                            <Link to="/catalogo?category=blusas" onClick={() => setMenuOpen(false)}>Blusas</Link>
                            <Link to="/catalogo?category=pantalones" onClick={() => setMenuOpen(false)}>Pantalones</Link>
                            <Link to="/catalogo?category=abrigos" onClick={() => setMenuOpen(false)}>Abrigos</Link>
                            <Link to="/catalogo?category=accesorios" onClick={() => setMenuOpen(false)}>Accesorios</Link>
                        </div>
                    </div>

                    <Link to="/carrito" onClick={() => setMenuOpen(false)}>
                        Carrito {totalItems > 0 && `(${totalItems})`}
                    </Link>

                    <div className="mobile-auth-section">
                        {!isAuthenticated ? (
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="mobile-login-btn">
                                👤 Iniciar Sesión
                            </Link>
                        ) : (
                            <div className="mobile-user-box">
                                <div className="mobile-user-info">
                                    <strong>{user.name}</strong>
                                    <small>{user.email}</small>
                                </div>
                                {user.role === 'admin' && (
                                    <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="mobile-admin-btn">
                                        ⚙️ Panel Admin
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    className="mobile-logout-btn"
                                    onClick={() => {
                                        logout();
                                        setMenuOpen(false);
                                    }}
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

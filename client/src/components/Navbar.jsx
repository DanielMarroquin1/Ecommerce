import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { totalItems } = useCart();
    const location = useLocation();
    const isHome = location.pathname === '/';
    const lastScrollY = useRef(0);

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
    }, [location]);

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
                </div>
            </div>
        </>
    );
}

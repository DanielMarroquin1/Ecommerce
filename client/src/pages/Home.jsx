import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import ProductCard from '../components/ProductCard';
import ProductDetail from '../components/ProductDetail';
import useScrollReveal from '../hooks/useScrollReveal';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api';

export default function Home() {
    useScrollReveal();
    const [featured, setFeatured] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/products?featured=true`)
            .then(res => res.json())
            .then(data => { setFeatured(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <>
            <HeroCarousel />

            {/* Marquee Ticker */}
            <div className="marquee-ticker">
                <div className="marquee-track">
                    <span>NUEVA COLECCIÓN 2026 ★ ENVÍO GRATIS +Q500 ★ PRENDAS EXCLUSIVAS ★ MODA FEMENINA ★ ELEGANCIA ATEMPORAL ★ NUEVA COLECCIÓN 2026 ★ ENVÍO GRATIS +Q500 ★ PRENDAS EXCLUSIVAS ★ MODA FEMENINA ★ ELEGANCIA ATEMPORAL ★&nbsp;</span>
                </div>
            </div>

            {/* Categories Section */}
            <section className="section">
                <div className="section-header reveal-on-scroll">
                    <span className="section-tag">EXPLORA</span>
                    <h2>Nuestras Categorías</h2>
                    <div className="divider"></div>
                </div>
                <div className="categories-grid">
                    <Link to="/catalogo?category=vestidos" className="category-card reveal-on-scroll stagger-1">
                        <img src="https://placehold.co/500x625/EBDAC9/5D4032?text=Vestidos" alt="Vestidos" />
                        <div className="category-card-overlay">
                            <span className="category-tag">Colección 2026</span>
                            <h3>Vestidos</h3>
                            <span className="category-explore">Explorar →</span>
                        </div>
                    </Link>
                    <Link to="/catalogo?category=blusas" className="category-card reveal-on-scroll stagger-2">
                        <img src="https://placehold.co/500x625/F6F2EF/5D4032?text=Blusas" alt="Blusas" />
                        <div className="category-card-overlay">
                            <span className="category-tag">Esenciales</span>
                            <h3>Blusas</h3>
                            <span className="category-explore">Explorar →</span>
                        </div>
                    </Link>
                    <Link to="/catalogo?category=abrigos" className="category-card reveal-on-scroll stagger-3">
                        <img src="https://placehold.co/500x625/BC967F/F6F2EF?text=Abrigos" alt="Abrigos" />
                        <div className="category-card-overlay">
                            <span className="category-tag">Temporada</span>
                            <h3>Abrigos</h3>
                            <span className="category-explore">Explorar →</span>
                        </div>
                    </Link>
                    <Link to="/catalogo?category=accesorios" className="category-card reveal-on-scroll stagger-4">
                        <img src="https://placehold.co/500x625/5D4032/F6F2EF?text=Accesorios" alt="Accesorios" />
                        <div className="category-card-overlay">
                            <span className="category-tag">Complementos</span>
                            <h3>Accesorios</h3>
                            <span className="category-explore">Explorar →</span>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Full-Width Parallax Banner */}
            <section className="parallax-banner reveal-on-scroll">
                <div className="parallax-bg" style={{ backgroundImage: 'url(/images/banner_season.jpg)' }}></div>
                <div className="parallax-content">
                    <span className="parallax-tag">NUEVA TEMPORADA</span>
                    <h2>Elegancia que<br />Define tu Estilo</h2>
                    <p>Cada pieza cuenta una historia. Descubre prendas diseñadas para la mujer que marca tendencia.</p>
                    <Link to="/catalogo" className="btn-outline-light">
                        Descubrir Colección
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Featured Products */}
            <section className="featured-section">
                <div className="section">
                    <div className="section-header reveal-on-scroll">
                        <span className="section-tag">LO MÁS DESEADO</span>
                        <h2>Productos Destacados</h2>
                        <div className="divider"></div>
                    </div>
                    {loading ? (
                        <div className="product-grid">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="product-card">
                                    <div className="product-card-image loading-skeleton" style={{ aspectRatio: '3/4' }}></div>
                                    <div className="product-card-info">
                                        <div className="loading-skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }}></div>
                                        <div className="loading-skeleton" style={{ height: 20, width: '80%', marginBottom: 8 }}></div>
                                        <div className="loading-skeleton" style={{ height: 18, width: '40%' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="product-grid">
                            {featured.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={setSelectedProduct}
                                />
                            ))}
                        </div>
                    )}
                    <div className="reveal-on-scroll" style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <Link to="/catalogo" className="btn-primary">
                            Ver Todo el Catálogo
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Split Banner Section */}
            <section className="split-banner reveal-on-scroll">
                <div className="split-image">
                    <img src="https://placehold.co/960x700/EBDAC9/5D4032?text=Lookbook" alt="Lookbook" />
                </div>
                <div className="split-content">
                    <span className="section-tag">LOOKBOOK</span>
                    <h2>Inspírate con<br />Nuestros Looks</h2>
                    <p>Combinaciones perfectas para cada ocasión. Descubre las últimas tendencias y encuentra tu estilo personal con nuestra selección curada de outfits.</p>
                    <Link to="/catalogo" className="btn-primary">
                        Ver Lookbook
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Second Marquee */}
            <div className="marquee-ticker marquee-dark">
                <div className="marquee-track">
                    <span>CALIDAD PREMIUM ✦ DISEÑO EXCLUSIVO ✦ MODA SOSTENIBLE ✦ ENVÍO RÁPIDO ✦ ATENCIÓN PERSONALIZADA ✦ CALIDAD PREMIUM ✦ DISEÑO EXCLUSIVO ✦ MODA SOSTENIBLE ✦ ENVÍO RÁPIDO ✦ ATENCIÓN PERSONALIZADA ✦&nbsp;</span>
                </div>
            </div>

            {/* Newsletter Banner */}
            <section className="newsletter-section reveal-on-scroll">
                <div className="newsletter-inner">
                    <div className="newsletter-text">
                        <span className="section-tag" style={{ color: 'rgba(255,255,255,0.7)' }}>EXCLUSIVO</span>
                        <h2>Únete a la Familia zzaly</h2>
                        <p>Suscríbete y recibe un 15% de descuento en tu primera compra, además de acceso exclusivo a nuevas colecciones.</p>
                    </div>
                    <div className="newsletter-form">
                        <input type="email" placeholder="tu@email.com" />
                        <button className="btn-light">Suscribirme →</button>
                    </div>
                </div>
            </section>

            {selectedProduct && (
                <ProductDetail
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </>
    );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductDetail from '../components/ProductDetail';

const API_URL = import.meta.env.VITE_API_URL;

export default function ProductPage() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        fetch(`${API_URL}/products/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Producto no encontrado');
                return res.json();
            })
            .then(data => {
                setProduct(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || 'Error al cargar el producto');
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div style={{ maxWidth: '1100px', margin: '4rem auto', padding: '0 2rem' }}>
                <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                    <div className="loading-skeleton" style={{ flex: '1 1 400px', height: '500px', borderRadius: 'var(--radius-md)' }} />
                    <div style={{ flex: '1 1 350px' }}>
                        <div className="loading-skeleton" style={{ height: '20px', width: '30%', marginBottom: '1rem' }} />
                        <div className="loading-skeleton" style={{ height: '36px', width: '80%', marginBottom: '1rem' }} />
                        <div className="loading-skeleton" style={{ height: '24px', width: '40%', marginBottom: '2rem' }} />
                        <div className="loading-skeleton" style={{ height: '80px', width: '100%', marginBottom: '2rem' }} />
                        <div className="loading-skeleton" style={{ height: '48px', width: '100%', borderRadius: 'var(--radius-full)' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>
                    Producto no encontrado
                </h2>
                <p style={{ color: '#BC967F', marginBottom: '2rem' }}>
                    Lo sentimos, el producto que buscas no existe o ya no está disponible.
                </p>
                <Link to="/catalogo" className="btn-primary" style={{ display: 'inline-flex' }}>
                    Volver al Catálogo
                </Link>
            </div>
        );
    }

    return (
        <div className="product-page-container" style={{ maxWidth: '1100px', margin: '2rem auto 5rem', padding: '0 2rem' }}>
            {/* Breadcrumbs */}
            <nav style={{ fontSize: '0.85rem', color: '#888', marginBottom: '2rem' }}>
                <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Inicio</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <Link to="/catalogo" style={{ color: 'inherit', textDecoration: 'none' }}>Catálogo</Link>
                {product.category_name && (
                    <>
                        <span style={{ margin: '0 8px' }}>/</span>
                        <Link to={`/catalogo?category=${product.category_slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {product.category_name}
                        </Link>
                    </>
                )}
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--espresso)', fontWeight: 500 }}>{product.name}</span>
            </nav>

            <ProductDetail product={product} isPage={true} />
        </div>
    );
}

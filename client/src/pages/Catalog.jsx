import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductList from '../components/ProductList';
import ProductDetail from '../components/ProductDetail';
import CatalogFilters from '../components/CatalogFilters';

const API_URL = import.meta.env.VITE_API_URL;

export default function Catalog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        search: searchParams.get('search') || '',
        size: '',
        color: '',
        min_price: '',
        max_price: '',
    });

    // Fetch categories
    useEffect(() => {
        fetch(`${API_URL}/categories`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error('Error al cargar categorías:', err);
                setCategories([]);
            });
    }, []);

    // Sync URL params to state
    useEffect(() => {
        const cat = searchParams.get('category') || '';
        const search = searchParams.get('search') || '';
        setFilters(prev => ({
            ...prev,
            category: cat,
            search: search
        }));
        setSearchInput(search);
    }, [searchParams]);

    // Fetch products when filters change
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });

        fetch(`${API_URL}/products?${params.toString()}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                return res.json();
            })
            .then(data => {
                setProducts(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error al cargar catálogo de productos:', err);
                setProducts([]);
                setLoading(false);
            });
    }, [filters]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const nextParams = new URLSearchParams(searchParams);
        if (searchInput.trim()) {
            nextParams.set('search', searchInput.trim());
        } else {
            nextParams.delete('search');
        }
        setSearchParams(nextParams);
        setFilters(prev => ({ ...prev, search: searchInput.trim() }));
    };

    const clearFilters = () => {
        setSearchInput('');
        setSearchParams({});
        setFilters({ category: '', search: '', size: '', color: '', min_price: '', max_price: '' });
    };

    return (
        <div className="catalog-layout">
            {/* Sidebar */}
            <aside className={`catalog-sidebar ${filtersOpen ? 'open' : ''}`}>
                <CatalogFilters
                    categories={categories}
                    filters={filters}
                    onChange={setFilters}
                    onClear={clearFilters}
                />
            </aside>

            {/* Main Content */}
            <main className="catalog-main">
                <div className="catalog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1>Catálogo</h1>
                        <span className="catalog-count">
                            {loading ? 'Cargando...' : `${products.length} producto${products.length !== 1 ? 's' : ''}`}
                        </span>
                    </div>

                    {/* Buscador de productos */}
                    <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1', maxWidth: '360px' }}>
                        <input
                            type="search"
                            placeholder="Buscar vestidos, blusas..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                border: '1px solid var(--sand)',
                                borderRadius: 'var(--radius-full)',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'var(--espresso)',
                                color: 'white',
                                padding: '10px 18px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Buscar
                        </button>
                    </form>
                </div>

                <button
                    className="mobile-filter-toggle"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="12" x2="14" y2="12" />
                        <line x1="4" y1="18" x2="8" y2="18" />
                    </svg>
                    {filtersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>

                {loading ? (
                    <div className="product-grid" data-testid="product-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => (
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
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#EBDAC9" strokeWidth="1.5" style={{ marginBottom: '1rem' }}>
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
                            No se encontraron productos
                        </h3>
                        <p style={{ color: '#BC967F' }}>Intenta con otros términos o filtros</p>
                        <button className="clear-filters" onClick={clearFilters} style={{ marginTop: '1rem', fontSize: '1rem' }}>
                            Limpiar filtros
                        </button>
                    </div>
                ) : (
                    <ProductList
                        products={products}
                        onSelectProduct={setSelectedProduct}
                    />
                )}
            </main>

            {selectedProduct && (
                <ProductDetail
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
}

import ProductCard from './ProductCard';

export default function ProductList({ products = [], onSelectProduct }) {
    const list = Array.isArray(products) ? products : [];

    if (list.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light, #888)' }}>
                <p>No se encontraron productos disponibles por el momento.</p>
            </div>
        );
    }

    return (
        <div className="product-grid" data-testid="product-grid">
            {list.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onClick={onSelectProduct}
                />
            ))}
        </div>
    );
}

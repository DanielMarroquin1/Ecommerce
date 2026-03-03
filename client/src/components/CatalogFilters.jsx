export default function CatalogFilters({ categories, filters, onChange, onClear }) {
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    const colors = [
        { name: 'Beige', hex: '#EBDAC9' },
        { name: 'Marrón', hex: '#5D4032' },
        { name: 'Rosa', hex: '#BC967F' },
        { name: 'Negro', hex: '#1a1a1a' },
        { name: 'Blanco', hex: '#f5f5f5' },
    ];

    const handleChange = (key, value) => {
        onChange({ ...filters, [key]: filters[key] === value ? '' : value });
    };

    const hasFilters = Object.values(filters).some(v => v !== '' && v !== undefined);

    return (
        <>
            <div className="filter-section">
                <h3>Categorías</h3>
                <div className="filter-group">
                    {categories.map((cat) => (
                        <label key={cat.slug}>
                            <input
                                type="radio"
                                name="category"
                                checked={filters.category === cat.slug}
                                onChange={() => handleChange('category', cat.slug)}
                            />
                            {cat.name}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3>Talla</h3>
                <div className="filter-group">
                    {sizes.map((size) => (
                        <label key={size}>
                            <input
                                type="radio"
                                name="size"
                                checked={filters.size === size}
                                onChange={() => handleChange('size', size)}
                            />
                            {size}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3>Color</h3>
                <div className="filter-colors">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            className={`filter-color-swatch ${filters.color === color.name ? 'active' : ''}`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                            onClick={() => handleChange('color', color.name)}
                        />
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3>Precio</h3>
                <div className="price-range">
                    <input
                        type="number"
                        placeholder="Min"
                        value={filters.min_price || ''}
                        onChange={(e) => onChange({ ...filters, min_price: e.target.value })}
                    />
                    <span>—</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={filters.max_price || ''}
                        onChange={(e) => onChange({ ...filters, max_price: e.target.value })}
                    />
                </div>
            </div>

            {hasFilters && (
                <button className="clear-filters" onClick={onClear}>
                    ✕ Limpiar filtros
                </button>
            )}
        </>
    );
}

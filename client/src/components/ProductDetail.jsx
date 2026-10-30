import { useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { useCart } from '../context/CartContext';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function ProductDetail({ product, onClose, isPage = false }) {
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState(
        product?.colors && product.colors.length === 1 ? product.colors[0].name : ''
    );
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { addItem } = useCart();

    const variants = useMemo(() => product?.variants || [], [product]);

    // Buscar la variante correspondiente a la talla y color elegidos
    const activeVariant = useMemo(() => {
        if (!selectedSize || !selectedColor) return null;
        return variants.find(v => v.size === selectedSize && v.color === selectedColor) || null;
    }, [variants, selectedSize, selectedColor]);

    // Stock disponible para la combinación elegida
    const maxStock = useMemo(() => {
        if (activeVariant) return activeVariant.stock;
        if (selectedSize && !selectedColor) {
            const sizeVariants = variants.filter(v => v.size === selectedSize);
            return sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
        }
        return 0;
    }, [activeVariant, selectedSize, selectedColor, variants]);

    // Función para saber si una talla está agotada
    const isSizeOutOfStock = (size) => {
        if (selectedColor) {
            const variant = variants.find(v => v.size === size && v.color === selectedColor);
            return !variant || variant.stock <= 0;
        }
        // Si no hay color seleccionado aún, revisar si existe stock en alguna variante de esa talla
        const sizeVariants = variants.filter(v => v.size === size);
        if (sizeVariants.length === 0) return false;
        return sizeVariants.every(v => v.stock <= 0);
    };

    if (!product) return null;

    const handleSelectSize = (size) => {
        setSelectedSize(size);
        setErrorMsg('');
        setQuantity(1);
    };

    const handleSelectColor = (colorName) => {
        setSelectedColor(colorName);
        setErrorMsg('');
        setQuantity(1);
    };

    const handleAdd = () => {
        if (!selectedSize) {
            setErrorMsg('Selecciona una talla');
            return;
        }
        if (!selectedColor) {
            setErrorMsg('Selecciona un color');
            return;
        }
        if (activeVariant && activeVariant.stock <= 0) {
            setErrorMsg('Esta combinación está agotada');
            return;
        }

        const qtyToAdd = Math.max(1, Math.min(quantity, maxStock > 0 ? maxStock : 1));
        addItem(
            product,
            selectedSize,
            selectedColor,
            qtyToAdd,
            activeVariant?.id || null,
            activeVariant ? activeVariant.stock : null
        );

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleOverlayClick = (e) => {
        if (onClose && e.target === e.currentTarget) onClose();
    };

    const isAvailable = !activeVariant || activeVariant.stock > 0;
    const canAddToCart = Boolean(selectedSize && selectedColor && isAvailable);

    const content = (
        <div className={`product-detail ${isPage ? 'product-detail-standalone' : ''}`}>
            {onClose && (
                <button className="product-detail-close" onClick={onClose} aria-label="Cerrar">
                    ✕
                </button>
            )}

            <div className="product-detail-gallery">
                <Swiper
                    modules={[Pagination, Navigation]}
                    pagination={{ clickable: true }}
                    navigation
                    loop
                >
                    {product.images?.map((img, idx) => (
                        <SwiperSlide key={idx}>
                            <img src={img.url} alt={img.alt_text || product.name} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <div className="product-detail-info">
                <span className="product-detail-category">{product.category_name}</span>
                <h2 className="product-detail-name">{product.name}</h2>
                <span className="product-detail-price">Q{parseFloat(product.price).toFixed(2)}</span>
                <p className="product-detail-desc">{product.description}</p>

                <div className="product-detail-divider" />

                {/* Selector de Talla */}
                <div>
                    <p className="selector-label">
                        Talla {selectedSize && `— ${selectedSize}`}
                    </p>
                    <div className="size-selector" data-testid="size-selector">
                        {product.sizes?.map((size) => {
                            const outOfStock = isSizeOutOfStock(size);
                            const isActive = selectedSize === size;
                            return (
                                <button
                                    key={size}
                                    type="button"
                                    className={`size-btn ${isActive ? 'active' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                                    onClick={() => handleSelectSize(size)}
                                    title={outOfStock ? `${size} (Agotada)` : size}
                                    style={outOfStock ? { opacity: 0.5, textDecoration: 'line-through', cursor: 'not-allowed' } : {}}
                                >
                                    {size} {outOfStock && <span style={{ fontSize: '0.65rem', display: 'block' }}>Agotada</span>}
                                </button>
                            );
                        })}
                    </div>
                    {!selectedSize && (
                        <p className="size-hint" style={{ fontSize: '0.82rem', color: '#BC967F', marginTop: '6px' }}>
                            Selecciona una talla
                        </p>
                    )}
                </div>

                {/* Selector de Color */}
                <div>
                    <p className="selector-label">
                        Color {selectedColor && `— ${selectedColor}`}
                    </p>
                    <div className="color-selector">
                        {product.colors?.map((color) => (
                            <button
                                key={color.name}
                                type="button"
                                className={`color-swatch ${selectedColor === color.name ? 'active' : ''}`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                                onClick={() => handleSelectColor(color.name)}
                            />
                        ))}
                    </div>
                </div>

                {/* Selector de Cantidad */}
                <div>
                    <p className="selector-label">Cantidad</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="qty-control" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                                style={{ opacity: quantity <= 1 ? 0.4 : 1, cursor: quantity <= 1 ? 'not-allowed' : 'pointer' }}
                            >
                                −
                            </button>
                            <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setQuantity(q => (maxStock > 0 ? Math.min(maxStock, q + 1) : q + 1))}
                                disabled={maxStock > 0 && quantity >= maxStock}
                                style={{
                                    opacity: maxStock > 0 && quantity >= maxStock ? 0.4 : 1,
                                    cursor: maxStock > 0 && quantity >= maxStock ? 'not-allowed' : 'pointer'
                                }}
                            >
                                +
                            </button>
                        </div>
                        {selectedSize && selectedColor && (
                            <span style={{ fontSize: '0.85rem', color: activeVariant && activeVariant.stock > 0 ? '#5D4032' : '#c0392b' }}>
                                {activeVariant
                                    ? (activeVariant.stock > 0 ? `${activeVariant.stock} disponibles` : 'Agotado en esta combinación')
                                    : 'Sin stock disponible'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Botón Agregar al Carrito */}
                <button
                    className={`add-to-cart-btn ${added ? 'added' : ''}`}
                    data-testid="add-to-cart"
                    onClick={handleAdd}
                    disabled={!canAddToCart}
                    style={{ opacity: !canAddToCart ? 0.5 : 1 }}
                >
                    {added
                        ? '✓ Añadido al Carrito'
                        : (!isAvailable ? 'Agotado' : 'Agregar al Carrito')}
                </button>

                {errorMsg && (
                    <p style={{ fontSize: '0.85rem', color: '#c0392b', textAlign: 'center', marginTop: '6px' }}>
                        {errorMsg}
                    </p>
                )}

                {!selectedSize && !errorMsg && (
                    <p style={{ fontSize: '0.8rem', color: '#BC967F', textAlign: 'center' }}>
                        Selecciona una talla para continuar
                    </p>
                )}
            </div>
        </div>
    );

    if (isPage) {
        return content;
    }

    return (
        <div className="product-detail-overlay" onClick={handleOverlayClick}>
            {content}
        </div>
    );
}

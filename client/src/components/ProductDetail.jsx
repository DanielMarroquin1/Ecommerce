import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { useCart } from '../context/CartContext';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function ProductDetail({ product, onClose }) {
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [added, setAdded] = useState(false);
    const { addItem } = useCart();

    if (!product) return null;

    const handleAdd = () => {
        if (!selectedSize || !selectedColor) return;
        addItem(product, selectedSize, selectedColor);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="product-detail-overlay" onClick={handleOverlayClick}>
            <div className="product-detail">
                <button className="product-detail-close" onClick={onClose}>✕</button>

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
                    <span className="product-detail-price">${product.price}</span>
                    <p className="product-detail-desc">{product.description}</p>

                    <div className="product-detail-divider" />

                    <div>
                        <p className="selector-label">Talla {selectedSize && `— ${selectedSize}`}</p>
                        <div className="size-selector">
                            {product.sizes?.map((size) => (
                                <button
                                    key={size}
                                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="selector-label">Color {selectedColor && `— ${selectedColor}`}</p>
                        <div className="color-selector">
                            {product.colors?.map((color) => (
                                <button
                                    key={color.name}
                                    className={`color-swatch ${selectedColor === color.name ? 'active' : ''}`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                    onClick={() => setSelectedColor(color.name)}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        className={`add-to-cart-btn ${added ? 'added' : ''}`}
                        onClick={handleAdd}
                        disabled={!selectedSize || !selectedColor}
                        style={{ opacity: (!selectedSize || !selectedColor) ? 0.5 : 1 }}
                    >
                        {added ? '✓ Añadido al Carrito' : 'Agregar al Carrito'}
                    </button>

                    {(!selectedSize || !selectedColor) && (
                        <p style={{ fontSize: '0.8rem', color: '#BC967F', textAlign: 'center' }}>
                            Selecciona talla y color para continuar
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

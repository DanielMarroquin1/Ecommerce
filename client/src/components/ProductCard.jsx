import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export default function ProductCard({ product, onClick }) {
    return (
        <div className="product-card" onClick={() => onClick(product)}>
            <div className="product-card-image">
                {product.is_featured && <span className="product-card-badge">Destacado</span>}
                {product.images && product.images.length > 1 ? (
                    <Swiper
                        modules={[Pagination]}
                        pagination={{ clickable: true }}
                        loop
                        onClick={(swiper, e) => e.stopPropagation()}
                    >
                        {product.images.map((img, idx) => (
                            <SwiperSlide key={idx}>
                                <img src={img.url} alt={img.alt_text || product.name} loading="lazy" />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <img
                        src={product.images?.[0]?.url || `https://placehold.co/600x800/EBDAC9/5D4032?text=${encodeURIComponent(product.name)}`}
                        alt={product.name}
                        loading="lazy"
                    />
                )}
                <button
                    className="product-card-quick"
                    onClick={(e) => { e.stopPropagation(); onClick(product); }}
                >
                    Vista Rápida
                </button>
            </div>
            <div className="product-card-info">
                <div className="product-card-category">{product.category_name}</div>
                <h3 className="product-card-name">{product.name}</h3>
                <div className="product-card-price">${product.price}</div>
                {product.colors && product.colors.length > 0 && (
                    <div className="product-card-colors">
                        {product.colors.map((color, idx) => (
                            <span
                                key={idx}
                                className="color-dot"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

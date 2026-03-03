import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const API_URL = 'http://localhost:5000/api';

export default function Cart() {
    const { items, removeItem, updateQuantity, totalPrice } = useCart();

    // Promo Code State
    const [promoInput, setPromoInput] = useState('');
    const [promoData, setPromoData] = useState(null);
    const [promoError, setPromoError] = useState('');

    // Checkout State
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleApplyPromo = async () => {
        setPromoError('');
        if (!promoInput) return;

        try {
            const res = await fetch(`${API_URL}/promos/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoInput, subtotal: totalPrice })
            });
            const data = await res.json();

            if (res.ok) {
                setPromoData(data);
            } else {
                setPromoError(data.error);
                setPromoData(null);
            }
        } catch (err) {
            setPromoError('Error al validar el código');
        }
    };

    const discountAmount = promoData
        ? (promoData.discount_type === 'percentage'
            ? (totalPrice * (promoData.discount_value / 100))
            : promoData.discount_value)
        : 0;

    const finalTotal = Math.max(0, totalPrice - discountAmount);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            const res = await fetch(`${API_URL}/checkout/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: null, // Guest for now
                    subtotal: totalPrice,
                    discountAmount,
                    total: finalTotal,
                    promoCodeId: promoData?.id || null,
                    shippingAddress: { city: 'Guatemala', address: 'Zona 10' }, // Mock
                    contactEmail: 'cliente@ejemplo.com',
                    contactPhone: '5555-5555',
                    items: items.map(i => ({ variantId: i.id, name: i.name, size: i.size, color: i.color, quantity: i.quantity, price: i.price }))
                })
            });
            const data = await res.json();

            if (res.ok) {
                alert(`¡Preparado para Banco Industrial!\nOrden ID: ${data.orderId}\nTransacción Pago ID: ${data.paymentId}`);
            } else {
                alert(`Error en checkout: ${data.error}`);
            }
        } catch (err) {
            alert('Error crítico al procesar checkout');
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <h1>Mi Carrito</h1>
                <div className="cart-empty">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#EBDAC9" strokeWidth="1.5">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                    <h3>Tu carrito está vacío</h3>
                    <p>Explora nuestra colección y encuentra prendas increíbles</p>
                    <Link to="/catalogo" className="hero-cta" style={{ display: 'inline-flex' }}>
                        Ir al Catálogo
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <h1>Mi Carrito</h1>

            {items.map((item) => (
                <div className="cart-item" key={item.key}>
                    <div className="cart-item-image">
                        <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-item-info">
                        <div>
                            <h3 className="cart-item-name">{item.name}</h3>
                            <p className="cart-item-meta">Talla: {item.size} · Color: {item.color}</p>
                        </div>
                        <div className="cart-item-actions">
                            <div className="qty-control">
                                <button onClick={() => updateQuantity(item.key, item.quantity - 1)}>−</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.key, item.quantity + 1)}>+</button>
                            </div>
                            <span className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                            <button className="cart-item-remove" onClick={() => removeItem(item.key)}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <div className="cart-summary">
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>¿Tienes un código de descuento?</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={promoInput}
                            onChange={e => setPromoInput(e.target.value)}
                            placeholder="Ej. VERANO20"
                            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sand)' }}
                        />
                        <button
                            onClick={handleApplyPromo}
                            style={{ background: 'var(--espresso)', color: 'white', padding: '10px 15px', borderRadius: 'var(--radius-sm)' }}
                        >
                            Aplicar
                        </button>
                    </div>
                    {promoError && <span style={{ color: 'red', fontSize: '0.8rem' }}>{promoError}</span>}
                    {promoData && <span style={{ color: 'green', fontSize: '0.8rem' }}>Código aplicado: {promoData.code}</span>}
                </div>

                <div className="cart-summary-row">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} artículos)</span>
                    <span>${totalPrice.toFixed(2)}</span>
                </div>
                {promoData && (
                    <div className="cart-summary-row">
                        <span>Descuento ({promoData.code})</span>
                        <span style={{ color: 'red' }}>-${discountAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="cart-summary-row">
                    <span>Envío</span>
                    <span style={{ color: '#BC967F' }}>Gratis</span>
                </div>
                <div className="cart-summary-total">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                </div>
                <button className="checkout-btn" onClick={handleCheckout} disabled={isCheckingOut}>
                    {isCheckingOut ? 'Procesando...' : 'Proceder al Pago'}
                </button>
            </div>
        </div>
    );
}

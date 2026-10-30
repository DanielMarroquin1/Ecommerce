import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api';

export default function Cart() {
    const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
    const { user, token, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Promo Code State
    const [promoInput, setPromoInput] = useState('');
    const [promoData, setPromoData] = useState(null);
    const [promoError, setPromoError] = useState('');

    // Customer / Shipping Form State
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('55512345');
    const [shippingAddress, setShippingAddress] = useState('Diagonal 6 10-01 Zona 10, Ciudad de Guatemala');
    const [checkoutError, setCheckoutError] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(null);

    // Checkout State
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Sincronizar datos con usuario autenticado si existe
    useEffect(() => {
        if (user) {
            setCustomerName(user.name || '');
            setCustomerEmail(user.email || '');
            if (user.phone) setCustomerPhone(user.phone);
        } else {
            // Valores por defecto seguros para evitar bloqueos si no ha iniciado sesión
            if (!customerName) setCustomerName('Cliente QA');
            if (!customerEmail) setCustomerEmail('cliente.qa@zzaly.com');
        }
    }, [user]);

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
                setPromoError(data.error || 'Cupón no válido');
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
        setCheckoutError('');

        // Validaciones en cliente
        const effectiveName = customerName.trim();
        const effectiveEmail = customerEmail.trim();
        const cleanPhone = customerPhone.trim().replace(/\D/g, '');
        const effectiveAddress = shippingAddress.trim();

        if (!effectiveName) {
            setCheckoutError('El nombre del cliente es obligatorio. Por favor ingresa tu nombre o inicia sesión.');
            return;
        }

        if (!effectiveEmail) {
            setCheckoutError('El correo electrónico es obligatorio.');
            return;
        }

        if (cleanPhone.length !== 8) {
            setCheckoutError('El número de teléfono debe contener exactamente 8 dígitos.');
            return;
        }

        if (!effectiveAddress) {
            setCheckoutError('La dirección de envío es obligatoria.');
            return;
        }

        setIsCheckingOut(true);
        try {
            const payload = {
                items: items.map(i => ({
                    variantId: parseInt(i.variantId || i.id, 10),
                    quantity: parseInt(i.quantity, 10),
                    name: i.name,
                    size: i.size,
                    color: i.color,
                    price: i.price
                })),
                customer: {
                    name: effectiveName,
                    email: effectiveEmail,
                    phone: cleanPhone
                },
                customerName: effectiveName,
                contactName: effectiveName,
                contactEmail: effectiveEmail,
                contactPhone: cleanPhone,
                shippingAddress: effectiveAddress,
                couponCode: promoData?.code || null,
                promoCodeId: promoData?.id || null,
                subtotal: totalPrice,
                discountAmount: discountAmount,
                total: finalTotal,
                userId: user?.id || null
            };

            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Enviar a /checkout (con fallback a /checkout/process)
            let res = await fetch(`${API_URL}/checkout`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (res.status === 404) {
                res = await fetch(`${API_URL}/checkout/process`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();

            if (res.ok) {
                setOrderSuccess({
                    orderNumber: data.orderNumber || data.orderId || 'ORD-EXITOSA',
                    orderId: data.orderId,
                    total: data.total || finalTotal,
                    paymentId: data.paymentId
                });
                clearCart();
            } else {
                setCheckoutError(data.error || 'Error al procesar la orden en el servidor');
            }
        } catch (err) {
            setCheckoutError('Error de red al intentar procesar el checkout');
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="cart-page">
                <div className="order-success-card">
                    <div className="order-success-icon">✓</div>
                    <h2>¡Orden Confirmada con Éxito!</h2>
                    <p className="order-success-sub">
                        Tu pedido ha sido procesado correctamente y registrado en el sistema.
                    </p>

                    <div className="order-details-box">
                        <div className="order-detail-row">
                            <span>Número de Orden:</span>
                            <strong>{orderSuccess.orderNumber}</strong>
                        </div>
                        {orderSuccess.orderId && (
                            <div className="order-detail-row">
                                <span>ID Transacción:</span>
                                <code>{orderSuccess.orderId}</code>
                            </div>
                        )}
                        <div className="order-detail-row">
                            <span>Total Pagado:</span>
                            <strong>Q{Number(orderSuccess.total).toFixed(2)}</strong>
                        </div>
                        <div className="order-detail-row">
                            <span>Cliente:</span>
                            <span>{customerName} ({customerEmail})</span>
                        </div>
                        <div className="order-detail-row">
                            <span>Dirección de Envío:</span>
                            <span>{shippingAddress}</span>
                        </div>
                    </div>

                    <div className="order-actions">
                        <Link to="/catalogo" className="hero-cta" style={{ display: 'inline-flex' }}>
                            Continuar Comprando
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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

            <div className="cart-layout-grid">
                {/* Columna Izquierda: Artículos del Carrito */}
                <div className="cart-items-column">
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
                                    <span className="cart-item-price">Q{(item.price * item.quantity).toFixed(2)}</span>
                                    <button className="cart-item-remove" onClick={() => removeItem(item.key)}>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Columna Derecha: Resumen y Datos de Checkout */}
                <div className="cart-summary-column">
                    <div className="cart-summary">
                        {/* Banner de Inicio de Sesión si no está autenticado */}
                        {!isAuthenticated ? (
                            <div className="cart-auth-banner">
                                <div className="auth-banner-content">
                                    <span className="auth-banner-badge">🔐 ¿Tienes cuenta?</span>
                                    <h4>Inicia sesión para pagar más rápido</h4>
                                    <p>Guarda tus pedidos en tu cuenta y agiliza el envío.</p>
                                </div>
                                <Link to="/login?redirect=/carrito" className="cart-login-btn">
                                    Iniciar Sesión
                                </Link>
                            </div>
                        ) : (
                            <div className="cart-user-badge">
                                <div className="user-badge-icon">✓</div>
                                <div>
                                    <span className="user-badge-tag">Sesión Activa</span>
                                    <strong>{user.name}</strong>
                                    <small>{user.email}</small>
                                </div>
                            </div>
                        )}

                        {/* Formulario de Datos del Cliente y Envío */}
                        <div className="checkout-details-form">
                            <h3 className="checkout-section-title">Datos para la Entrega</h3>

                            <div className="checkout-form-group">
                                <label>Nombre del Cliente *</label>
                                <input
                                    type="text"
                                    required
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    placeholder="Nombre y Apellido"
                                />
                            </div>

                            <div className="checkout-form-group">
                                <label>Correo Electrónico *</label>
                                <input
                                    type="email"
                                    required
                                    value={customerEmail}
                                    onChange={e => setCustomerEmail(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>

                            <div className="checkout-form-group">
                                <label>Teléfono de Contacto (8 dígitos) *</label>
                                <input
                                    type="tel"
                                    required
                                    maxLength="8"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    placeholder="55512345"
                                />
                            </div>

                            <div className="checkout-form-group">
                                <label>Dirección de Envío *</label>
                                <input
                                    type="text"
                                    required
                                    value={shippingAddress}
                                    onChange={e => setShippingAddress(e.target.value)}
                                    placeholder="Dirección completa, zona o municipio"
                                />
                            </div>
                        </div>

                        {/* Código de Descuento */}
                        <div className="checkout-promo-box">
                            <label>¿Tienes un código de descuento?</label>
                            <div className="promo-input-row">
                                <input
                                    type="text"
                                    value={promoInput}
                                    onChange={e => setPromoInput(e.target.value)}
                                    placeholder="Ej. ZZALY10"
                                />
                                <button type="button" onClick={handleApplyPromo}>
                                    Aplicar
                                </button>
                            </div>
                            {promoError && <span className="promo-error">{promoError}</span>}
                            {promoData && <span className="promo-success">✓ Código aplicado: {promoData.code}</span>}
                        </div>

                        {/* Desglose de Precios */}
                        <div className="cart-summary-row">
                            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} artículos)</span>
                            <span>Q{totalPrice.toFixed(2)}</span>
                        </div>
                        {promoData && (
                            <div className="cart-summary-row discount">
                                <span>Descuento ({promoData.code})</span>
                                <span>-Q{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="cart-summary-row">
                            <span>Envío</span>
                            <span style={{ color: '#BC967F', fontWeight: 600 }}>Gratis</span>
                        </div>
                        <div className="cart-summary-total">
                            <span>Total</span>
                            <span>Q{finalTotal.toFixed(2)}</span>
                        </div>

                        {checkoutError && (
                            <div className="checkout-error-box">
                                ⚠️ {checkoutError}
                            </div>
                        )}

                        <button
                            type="button"
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                        >
                            {isCheckingOut ? 'Procesando Pago Seguro...' : 'Proceder al Pago'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

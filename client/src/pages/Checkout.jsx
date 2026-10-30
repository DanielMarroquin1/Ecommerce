import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api';

const DEPARTAMENTOS_GUATEMALA = [
    'Alta Verapaz',
    'Baja Verapaz',
    'Chimaltenango',
    'Chiquimula',
    'El Progreso',
    'Escuintla',
    'Guatemala',
    'Huehuetenango',
    'Izabal',
    'Jalapa',
    'Jutiapa',
    'Petén',
    'Quetzaltenango',
    'Quiché',
    'Retalhuleu',
    'Sacatepéquez',
    'San Marcos',
    'Santa Rosa',
    'Sololá',
    'Suchitepéquez',
    'Totonicapán',
    'Zacapa'
];

export default function Checkout() {
    const { items, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    // Recibir descuentos y datos del carrito si existen
    const promoData = location.state?.promoData || null;
    const discountAmount = location.state?.discountAmount || 0;
    const customerNameFromCart = location.state?.customerName || '';
    const finalTotal = Math.max(0, totalPrice - discountAmount);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [copied, setCopied] = useState(false);

    // Formulario de envío y contacto con nombre, teléfono, correo, dirección y departamento/municipio
    const [form, setForm] = useState({
        fullName: customerNameFromCart || '',
        email: '',
        phone: '',
        address: '',
        department: 'Guatemala',
        municipality: '',
        city: '',
        paymentMethod: 'banco_industrial',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    // Sincronizar si llega customerName por location.state
    useEffect(() => {
        if (customerNameFromCart && !form.fullName) {
            setForm(prev => ({ ...prev, fullName: customerNameFromCart }));
        }
    }, [customerNameFromCart]);

    // Redirigir a /carrito cuando el carrito esté vacío y no se haya completado una orden
    useEffect(() => {
        if (items.length === 0 && !orderSuccess) {
            navigate('/carrito', { replace: true });
        }
    }, [items, orderSuccess, navigate]);

    const handleInputChange = (field, value) => {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'municipality') {
                next.city = value;
            }
            return next;
        });
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Validaciones del formulario
    const validateForm = () => {
        const newErrors = {};

        // Validación de Nombre
        if (!form.fullName.trim() || form.fullName.trim().length < 3) {
            newErrors.fullName = 'Ingresa tu nombre completo (mínimo 3 caracteres)';
        }

        // Validación de Teléfono
        const digits = form.phone.replace(/\D/g, '');
        if (!form.phone.trim()) {
            newErrors.phone = 'El número de teléfono es requerido';
        } else if (digits.length < 8 || !/^[0-9+() -]{8,15}$/.test(form.phone.trim())) {
            newErrors.phone = 'Ingresa un número de teléfono válido (mínimo 8 dígitos)';
        }

        // Validación de Correo
        if (!form.email.trim()) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            newErrors.email = 'Ingresa un formato de correo válido (ej. nombre@correo.com)';
        }

        // Validación de Dirección
        if (!form.address.trim() || form.address.trim().length < 5) {
            newErrors.address = 'Ingresa una dirección completa de entrega (calle, número, etc.)';
        }

        // Validación de Departamento
        if (!form.department || !form.department.trim()) {
            newErrors.department = 'Selecciona un departamento';
        }

        // Validación de Municipio
        const muni = (form.municipality || form.city || '').trim();
        if (!muni || muni.length < 2) {
            newErrors.municipality = 'Ingresa el municipio o localidad (mínimo 2 caracteres)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateForm()) {
            return;
        }

        if (items.length === 0) {
            setSubmitError('El carrito está vacío.');
            return;
        }

        setIsSubmitting(true);

        try {
            const muniValue = (form.municipality || form.city).trim();
            const shippingAddressObj = {
                fullName: form.fullName.trim(),
                address: form.address.trim(),
                city: muniValue,
                municipality: muniValue,
                department: form.department.trim(),
                notes: form.notes ? form.notes.trim() : ''
            };

            const payload = {
                userId: null, // Invitado
                customerName: form.fullName.trim(),
                subtotal: totalPrice,
                discountAmount: discountAmount,
                total: finalTotal,
                promoCodeId: promoData?.id || null,
                shippingAddress: shippingAddressObj,
                contactEmail: form.email.trim(),
                contactPhone: form.phone.trim(),
                items: items.map(item => ({
                    variantId: item.variantId || item.id,
                    name: item.name,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const res = await fetch(`${API_URL}/checkout/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                setSubmitError(data.error || 'Error al procesar la orden');
                setIsSubmitting(false);
                return;
            }

            // ÉXITO: Vaciar el carrito y guardar los datos de confirmación
            clearCart();
            setOrderSuccess({
                orderId: data.orderId,
                paymentId: data.paymentId,
                total: finalTotal,
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                municipality: muniValue,
                department: form.department.trim(),
                paymentMethod: form.paymentMethod
            });
        } catch (err) {
            console.error('Error de checkout:', err);
            setSubmitError('Error de conexión con el servidor. Intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyOrderId = () => {
        if (orderSuccess?.orderId) {
            navigator.clipboard.writeText(orderSuccess.orderId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    // Pantalla de Éxito cuando la orden se completó
    if (orderSuccess) {
        return (
            <div className="checkout-page" style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem' }}>
                <div style={{
                    background: 'var(--white)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2.5rem',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--sand)'
                }}>
                    <div style={{
                        width: '76px',
                        height: '76px',
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        margin: '0 auto 1.5rem',
                        fontWeight: 'bold'
                    }}>
                        ✓
                    </div>

                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginBottom: '0.75rem', color: 'var(--espresso)' }}>
                        ¡Pedido Confirmado!
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.05rem', marginBottom: '2rem' }}>
                        Muchas gracias por tu compra en <strong>zzaly</strong>, {orderSuccess.fullName}. Hemos recibido tu pedido correctamente.
                    </p>

                    <div style={{
                        background: 'var(--cream)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Número de Orden
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyOrderId}
                                style={{
                                    background: 'var(--white)',
                                    border: '1px solid var(--sand)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '5px 12px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    color: 'var(--espresso)',
                                    fontWeight: 600
                                }}
                            >
                                {copied ? '✓ Copiado' : 'Copiar ID'}
                            </button>
                        </div>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '1.15rem',
                            fontWeight: 'bold',
                            color: 'var(--espresso)',
                            wordBreak: 'break-all',
                            padding: '10px 14px',
                            background: 'var(--white)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--sand)'
                        }}>
                            {orderSuccess.orderId}
                        </div>

                        <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                            <div>
                                <span style={{ color: '#777', display: 'block' }}>Cliente:</span>
                                <strong>{orderSuccess.fullName}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#777', display: 'block' }}>Correo de confirmación:</span>
                                <strong>{orderSuccess.email}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#777', display: 'block' }}>Teléfono:</span>
                                <strong>{orderSuccess.phone}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#777', display: 'block' }}>Total pagado:</span>
                                <strong style={{ color: 'var(--espresso)', fontSize: '1.1rem' }}>Q{orderSuccess.total.toFixed(2)}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#777', display: 'block' }}>Dirección de entrega:</span>
                                <strong>{orderSuccess.address}, {orderSuccess.municipality}, {orderSuccess.department}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#777', display: 'block' }}>Método de pago:</span>
                                <strong>Banco Industrial (Transferencia / Enlace)</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/catalogo" className="btn-primary" style={{ display: 'inline-flex', padding: '14px 28px' }}>
                            Seguir Comprando
                        </Link>
                        <Link to="/" className="hero-cta" style={{ display: 'inline-flex', padding: '14px 28px' }}>
                            Ir al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Si el carrito está vacío y no hay orden, el useEffect redirige a /carrito
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="checkout-page" style={{ maxWidth: '1100px', margin: '2rem auto 5rem', padding: '0 1.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', marginBottom: '0.5rem' }}>
                Finalizar Compra
            </h1>
            <p style={{ color: '#888', marginBottom: '2.5rem' }}>
                Completa tus datos de envío para procesar tu orden de forma segura.
            </p>

            {submitError && (
                <div style={{
                    background: '#fde8e8',
                    color: '#c0392b',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.5rem',
                    border: '1px solid #f8b4b4',
                    fontWeight: 500
                }}>
                    ⚠️ {submitError}
                </div>
            )}

            <form onSubmit={handleSubmitOrder} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
                    {/* Columna Izquierda: Datos de envío y contacto */}
                    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '1.5rem', borderBottom: '1px solid var(--sand)', paddingBottom: '0.75rem' }}>
                            1. Información de Envío y Contacto
                        </h2>

                        {/* Nombre Completo */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label htmlFor="checkout-fullName" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Nombre Completo *
                            </label>
                            <input
                                id="checkout-fullName"
                                name="fullName"
                                type="text"
                                value={form.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                placeholder="Ej. Ana Lucía Morales"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: `1.5px solid ${errors.fullName ? '#c0392b' : 'var(--sand)'}`,
                                    fontSize: '0.95rem',
                                    outline: 'none'
                                }}
                            />
                            {errors.fullName && (
                                <span style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                    {errors.fullName}
                                </span>
                            )}
                        </div>

                        {/* Correo y Teléfono en dos columnas */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div>
                                <label htmlFor="checkout-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Correo Electrónico *
                                </label>
                                <input
                                    id="checkout-email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="ana@ejemplo.com"
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1.5px solid ${errors.email ? '#c0392b' : 'var(--sand)'}`,
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                                {errors.email && (
                                    <span style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                        {errors.email}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label htmlFor="checkout-phone" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Teléfono *
                                </label>
                                <input
                                    id="checkout-phone"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="Ej. 5555-1234"
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1.5px solid ${errors.phone ? '#c0392b' : 'var(--sand)'}`,
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                                {errors.phone && (
                                    <span style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                        {errors.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Dirección de Entrega */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label htmlFor="checkout-address" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Dirección de Entrega *
                            </label>
                            <input
                                id="checkout-address"
                                name="address"
                                type="text"
                                value={form.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Ej. 12 Calle 4-55, Zona 10, Edificio Las Flores"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: `1.5px solid ${errors.address ? '#c0392b' : 'var(--sand)'}`,
                                    fontSize: '0.95rem',
                                    outline: 'none'
                                }}
                            />
                            {errors.address && (
                                <span style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                    {errors.address}
                                </span>
                            )}
                        </div>

                        {/* Departamento y Municipio en dos columnas */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div>
                                <label htmlFor="checkout-department" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Departamento *
                                </label>
                                <select
                                    id="checkout-department"
                                    name="department"
                                    value={form.department}
                                    onChange={(e) => handleInputChange('department', e.target.value)}
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1.5px solid ${errors.department ? '#c0392b' : 'var(--sand)'}`,
                                        fontSize: '0.95rem',
                                        background: 'white',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="">-- Selecciona --</option>
                                    {DEPARTAMENTOS_GUATEMALA.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                                {errors.department && (
                                    <span style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                        {errors.department}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label htmlFor="checkout-municipality" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Municipio / Localidad *
                                </label>
                                <input
                                    id="checkout-municipality"
                                    name="municipality"
                                    type="text"
                                    value={form.municipality || form.city}
                                    onChange={(e) => handleInputChange('municipality', e.target.value)}
                                    placeholder="Ej. Guatemala, Mixco, Villa Nueva..."
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1.5px solid ${errors.municipality ? '#c0392b' : 'var(--sand)'}`,
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                                {errors.municipality && (
                                    <span style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                        {errors.municipality}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Notas Adicionales */}
                        <div>
                            <label htmlFor="checkout-notes" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Instrucciones de Entrega (Opcional)
                            </label>
                            <textarea
                                id="checkout-notes"
                                name="notes"
                                value={form.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Ej. Dejar en garita, referencia frente al parque..."
                                rows="2"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1.5px solid var(--sand)',
                                    fontSize: '0.9rem',
                                    resize: 'none',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Columna Derecha: Resumen de Orden y Botón de Pago */}
                    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '1.5rem', borderBottom: '1px solid var(--sand)', paddingBottom: '0.75rem' }}>
                            2. Resumen de tu Compra
                        </h2>

                        <div style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '4px' }}>
                            {items.map(item => (
                                <div key={item.key} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f6f2ef', paddingBottom: '0.75rem' }}>
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '4px', background: 'var(--cream)' }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontSize: '0.92rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.name}
                                        </h4>
                                        <p style={{ fontSize: '0.78rem', color: '#888' }}>
                                            Talla: {item.size} · Color: {item.color} · Cant: {item.quantity}
                                        </p>
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--espresso)' }}>
                                        Q{(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Método de pago */}
                        <div style={{ marginBottom: '1.5rem', background: 'var(--cream)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                                Método de Pago
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                <input
                                    type="radio"
                                    id="bi"
                                    name="paymentMethod"
                                    value="banco_industrial"
                                    checked={form.paymentMethod === 'banco_industrial'}
                                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                />
                                <label htmlFor="bi" style={{ cursor: 'pointer', fontWeight: 500 }}>
                                    🏦 Banco Industrial (Transferencia / Enlace)
                                </label>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--sand)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                <span>Subtotal</span>
                                <span>Q{totalPrice.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'red', fontSize: '0.95rem' }}>
                                    <span>Descuento {promoData?.code ? `(${promoData.code})` : ''}</span>
                                    <span>-Q{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                <span>Envío a todo el país</span>
                                <span style={{ color: '#2e7d32', fontWeight: 600 }}>Gratis</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '1.35rem',
                                fontWeight: 700,
                                borderTop: '2px solid var(--sand)',
                                paddingTop: '1rem',
                                color: 'var(--espresso)'
                            }}>
                                <span>Total a Pagar</span>
                                <span>Q{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Botón de Confirmación Bloqueado mientras se procesa */}
                        <button
                            type="submit"
                            className="checkout-btn"
                            data-testid="checkout-button"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                opacity: isSubmitting ? 0.6 : 1,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                                    Confirmando compra...
                                </>
                            ) : (
                                `Confirmar y Pagar (Q${finalTotal.toFixed(2)})`
                            )}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Link to="/carrito" style={{ fontSize: '0.85rem', color: '#888', textDecoration: 'underline' }}>
                                ← Regresar al Carrito
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

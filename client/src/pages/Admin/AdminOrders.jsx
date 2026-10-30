import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    const token = localStorage.getItem('zzaly_admin_token');
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const statusLabels = {
        pending: 'Pendiente',
        processing: 'Procesando',
        shipped: 'Enviado',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/orders`, { headers: authHeaders });
            const data = await res.json();
            setOrders(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ status: newStatus })
            });
            fetchOrders();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="admin-loading">Cargando pedidos...</div>;

    return (
        <div>
            <h1 className="admin-page-title">Gestión de Pedidos</h1>
            <p className="admin-page-subtitle">{orders.length} pedido{orders.length !== 1 ? 's' : ''} en total</p>

            <div className="admin-card" style={{ marginTop: '2rem' }}>
                {orders.length === 0 ? (
                    <p className="admin-empty">No hay pedidos aún</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <>
                                    <tr key={order.id} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{String(order.id).substring(0, 8)}...</td>
                                        <td>{order.shipping_address?.fullName ? `${order.shipping_address.fullName} (${order.contact_email})` : order.contact_email}</td>
                                        <td style={{ fontWeight: 600 }}>Q{parseFloat(order.total).toFixed(2)}</td>
                                        <td>
                                            <span className={`admin-badge admin-badge-${order.status}`}>
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                        </td>
                                        <td>{new Date(order.created_at).toLocaleDateString('es-GT')}</td>
                                        <td>
                                            <select
                                                value={order.status}
                                                onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                                                onClick={e => e.stopPropagation()}
                                                className="admin-status-select"
                                            >
                                                {Object.entries(statusLabels).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                    {expandedOrder === order.id && (
                                        <tr key={`${order.id}-detail`}>
                                            <td colSpan="6" className="admin-order-detail">
                                                <div className="admin-order-detail-grid">
                                                    <div>
                                                        <h4>Productos del Pedido</h4>
                                                        {order.items && order.items.length > 0 ? (
                                                            <ul className="admin-order-items">
                                                                {order.items.map((item, idx) => (
                                                                    <li key={idx}>
                                                                        <strong>{item.product_name}</strong>
                                                                        {item.size && <span> · Talla: {item.size}</span>}
                                                                        {item.color && <span> · Color: {item.color}</span>}
                                                                        <span> · Cantidad: {item.quantity}</span>
                                                                        <span> · Q{parseFloat(item.subtotal).toFixed(2)}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : <p>Sin detalles de items</p>}
                                                    </div>
                                                    <div>
                                                        <h4>Datos del Cliente</h4>
                                                        {order.shipping_address?.fullName && (
                                                            <p><strong>Nombre:</strong> {order.shipping_address.fullName}</p>
                                                        )}
                                                        <p><strong>Email:</strong> {order.contact_email}</p>
                                                        {order.contact_phone && <p><strong>Teléfono:</strong> {order.contact_phone}</p>}
                                                        {order.shipping_address?.address && (
                                                            <p><strong>Dirección:</strong> {order.shipping_address.address}, {order.shipping_address.municipality || order.shipping_address.city}, {order.shipping_address.department}</p>
                                                        )}
                                                        {order.shipping_address?.notes && (
                                                            <p><strong>Notas:</strong> {order.shipping_address.notes}</p>
                                                        )}
                                                        <p><strong>Subtotal:</strong> Q{parseFloat(order.subtotal).toFixed(2)}</p>
                                                        {parseFloat(order.discount_amount) > 0 && (
                                                            <p><strong>Descuento:</strong> -Q{parseFloat(order.discount_amount).toFixed(2)}</p>
                                                        )}
                                                        <p><strong>Total:</strong> Q{parseFloat(order.total).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

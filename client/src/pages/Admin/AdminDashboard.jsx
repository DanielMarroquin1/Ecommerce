import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('zzaly_admin_token');
        fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="admin-loading">Cargando dashboard...</div>;
    if (!stats) return <div className="admin-loading">Error al cargar datos</div>;

    const statusLabels = {
        pending: 'Pendiente',
        processing: 'Procesando',
        shipped: 'Enviado',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
    };

    return (
        <div className="admin-dashboard">
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Resumen general de tu tienda</p>

            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: '#e8f5e9' }}>📦</div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-value">{stats.totalProducts}</span>
                        <span className="admin-stat-label">Productos</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: '#e3f2fd' }}>🛒</div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-value">{stats.totalOrders}</span>
                        <span className="admin-stat-label">Pedidos</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: '#fff3e0' }}>💰</div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-value">Q{stats.totalRevenue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                        <span className="admin-stat-label">Ingresos Totales</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: stats.lowStockAlerts > 0 ? '#fce4ec' : '#e8f5e9' }}>
                        {stats.lowStockAlerts > 0 ? '⚠️' : '✅'}
                    </div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-value">{stats.lowStockAlerts}</span>
                        <span className="admin-stat-label">Alertas de Stock Bajo</span>
                    </div>
                </div>
            </div>

            <div className="admin-dashboard-grid">
                <div className="admin-card">
                    <h3>Pedidos Recientes</h3>
                    {stats.recentOrders && stats.recentOrders.length > 0 ? (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td>{order.contact_email}</td>
                                        <td>Q{parseFloat(order.total).toFixed(2)}</td>
                                        <td>
                                            <span className={`admin-badge admin-badge-${order.status}`}>
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                        </td>
                                        <td>{new Date(order.created_at).toLocaleDateString('es-GT')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="admin-empty">No hay pedidos aún</p>
                    )}
                </div>

                <div className="admin-card">
                    <h3>Acciones Rápidas</h3>
                    <div className="admin-quick-actions">
                        <Link to="/admin/productos" className="admin-quick-btn">
                            📦 Gestionar Productos
                        </Link>
                        <Link to="/admin/pedidos" className="admin-quick-btn">
                            🛒 Ver Pedidos
                        </Link>
                        <Link to="/admin/promos" className="admin-quick-btn">
                            🏷️ Códigos Promo
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

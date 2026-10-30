import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api';

export default function AdminPromos() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [newCode, setNewCode] = useState('');
    const [type, setType] = useState('percentage');
    const [value, setValue] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [maxUses, setMaxUses] = useState('');

    const token = localStorage.getItem('zzaly_admin_token');
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/promos`, { headers: authHeaders });
            const data = await res.json();
            setPromos(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreatePromo = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/admin/promos`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    code: newCode,
                    discount_type: type,
                    discount_value: parseFloat(value),
                    min_order_value: parseFloat(minOrder) || 0,
                    max_uses: parseInt(maxUses) || null
                })
            });

            if (res.ok) {
                setNewCode('');
                setValue('');
                setMinOrder('');
                setMaxUses('');
                setShowForm(false);
                fetchPromos();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'No se pudo crear el código'}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            await fetch(`${API_URL}/admin/promos/${id}`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ is_active: !currentStatus })
            });
            fetchPromos();
        } catch (err) {
            console.error(err);
        }
    };

    const deletePromo = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este código?')) return;
        try {
            await fetch(`${API_URL}/admin/promos/${id}`, {
                method: 'DELETE',
                headers: authHeaders
            });
            fetchPromos();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="admin-loading">Cargando códigos...</div>;

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Códigos Promocionales</h1>
                    <p className="admin-page-subtitle">{promos.length} código{promos.length !== 1 ? 's' : ''} creados</p>
                </div>
                <button className="admin-btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Nuevo Código'}
                </button>
            </div>

            {showForm && (
                <div className="admin-card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Crear Nuevo Código</h3>
                    <form onSubmit={handleCreatePromo} className="admin-promo-form">
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <label>Código (ej. VERANO20)</label>
                                <input type="text" required value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} />
                            </div>
                            <div className="admin-form-group">
                                <label>Tipo</label>
                                <select value={type} onChange={e => setType(e.target.value)}>
                                    <option value="percentage">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo (Q)</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label>Descuento</label>
                                <input type="number" required min="1" value={value} onChange={e => setValue(e.target.value)} />
                            </div>
                            <div className="admin-form-group">
                                <label>Pedido Mínimo (Q)</label>
                                <input type="number" min="0" value={minOrder} onChange={e => setMinOrder(e.target.value)} />
                            </div>
                            <div className="admin-form-group">
                                <label>Límite de usos</label>
                                <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
                            </div>
                        </div>
                        <button type="submit" className="admin-btn-primary" style={{ marginTop: '1rem' }}>Crear Código</button>
                    </form>
                </div>
            )}

            <div className="admin-card">
                {promos.length === 0 ? (
                    <p className="admin-empty">No hay códigos creados</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descuento</th>
                                <th>Usos</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map(promo => (
                                <tr key={promo.id}>
                                    <td style={{ fontWeight: 700, letterSpacing: '1px' }}>{promo.code}</td>
                                    <td>
                                        {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `Q${promo.discount_value}`}
                                        {parseFloat(promo.min_order_value) > 0 && (
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--rose-tan)' }}>Min: Q{promo.min_order_value}</span>
                                        )}
                                    </td>
                                    <td>{promo.used_count} / {promo.max_uses || '∞'}</td>
                                    <td>
                                        <span className={`admin-badge ${promo.is_active ? 'admin-badge-delivered' : 'admin-badge-cancelled'}`}>
                                            {promo.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-actions-row">
                                            <button className="admin-btn-sm" onClick={() => toggleActive(promo.id, promo.is_active)}>
                                                {promo.is_active ? '⏸ Desactivar' : '▶ Activar'}
                                            </button>
                                            <button className="admin-btn-sm admin-btn-danger" onClick={() => deletePromo(promo.id)}>🗑️ Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

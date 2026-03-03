import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminPromos() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newCode, setNewCode] = useState('');
    const [type, setType] = useState('percentage');
    const [value, setValue] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [maxUses, setMaxUses] = useState('');

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/promos`);
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: newCode,
                    discount_type: type,
                    discount_value: parseFloat(value),
                    min_order_value: parseFloat(minOrder) || 0,
                    max_uses: parseInt(maxUses) || null
                })
            });

            if (res.ok) {
                alert('Código promocional creado');
                setNewCode('');
                setValue('');
                setMinOrder('');
                setMaxUses('');
                fetchPromos();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'No se pudo crear el código'}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Cargando códigos...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Códigos Promocionales Temporales</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Create Form */}
                <div style={{ background: 'var(--white)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Crear Nuevo Código</h3>
                    <form onSubmit={handleCreatePromo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Código (ej. VERANO20)</label>
                            <input
                                type="text"
                                required
                                value={newCode}
                                onChange={e => setNewCode(e.target.value.toUpperCase())}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sand)' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tipo</label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sand)' }}
                                >
                                    <option value="percentage">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo ($)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Descuento</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sand)' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pedido Mínimo ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minOrder}
                                    onChange={e => setMinOrder(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sand)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Límite de usos</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={maxUses}
                                    onChange={e => setMaxUses(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sand)' }}
                                />
                            </div>
                        </div>
                        <button type="submit" className="hero-cta" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>Crear Código</button>
                    </form>
                </div>

                {/* List */}
                <div style={{ background: 'var(--white)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--sand)', color: 'var(--espresso)' }}>
                            <tr>
                                <th style={{ padding: '15px 20px' }}>Código</th>
                                <th style={{ padding: '15px 20px' }}>Descuento</th>
                                <th style={{ padding: '15px 20px' }}>Usos</th>
                                <th style={{ padding: '15px 20px' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map(promo => (
                                <tr key={promo.id} style={{ borderBottom: '1px solid var(--cream)' }}>
                                    <td style={{ padding: '15px 20px', fontWeight: 600 }}>{promo.code}</td>
                                    <td style={{ padding: '15px 20px' }}>
                                        {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                                        {parseFloat(promo.min_order_value) > 0 && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--rose-tan)' }}>Min: ${promo.min_order_value}</span>}
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        {promo.used_count} / {promo.max_uses || '∞'}
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            background: promo.is_active ? '#e6f4ea' : '#fce8e6',
                                            color: promo.is_active ? '#1e8e3e' : '#d93025'
                                        }}>
                                            {promo.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {promos.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--rose-tan)' }}>No hay códigos creados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

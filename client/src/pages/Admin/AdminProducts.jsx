import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // null means creating new

    // Form State
    const [formData, setFormData] = useState({
        name: '', slug: '', description: '', price: '', category_id: '',
        variants: [{ size: 'M', color: 'Negro', color_hex: '#000000', stock: 10 }],
        images: ['/images/product_dress.png']
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/products`);
            const data = await res.json();
            setProducts(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/categories`);
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error(err);
        }
    };

    const openCreateModal = () => {
        setSelectedProduct(null);
        setFormData({
            name: '', slug: '', description: '', price: '', category_id: categories[0]?.id || '',
            variants: [{ size: 'M', color: 'Negro', color_hex: '#000000', stock: 10 }],
            images: ['/images/product_dress.png'] // default placeholder
        });
        setIsModalOpen(true);
    };

    const openEditModal = async (product) => {
        // Fetch full product first if we were to edit, but for now we mainly just build the create flow 
        // per requirements, or show current data.
        setSelectedProduct(product);
        setFormData({
            name: product.name, slug: product.slug, description: product.description,
            price: product.price, category_id: product.category_id || '',
            variants: product.variants || [],
            images: product.images?.map(i => i.url) || []
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (!selectedProduct) {
                // Create
                const res = await fetch(`${API_URL}/admin/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, is_active: true, is_featured: false })
                });
                if (res.ok) {
                    alert('Producto creado exitosamente');
                    setIsModalOpen(false);
                    fetchProducts();
                } else {
                    const err = await res.json();
                    alert(`Error: ${err.error}`);
                }
            } else {
                // Note: Editing full product details is complex, usually implemented piece by piece.
                // Since the user asked to fix creation, we focus on creation. Adding an alert for edit.
                alert('Edición completa en desarrollo. Usa el botón de guardar para probar creación.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Cargando inventario...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Inventario de Productos</h1>
                <button className="hero-cta" onClick={openCreateModal} style={{ padding: '10px 20px', fontSize: '0.9rem' }}>+ Nuevo Producto</button>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {products.map(product => (
                    <div
                        key={product.id}
                        style={{ background: 'var(--white)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'transform 0.3s' }}
                        onClick={() => openEditModal(product)}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ height: '200px', width: '100%', background: '#eee' }}>
                            {product.images && product.images[0] && (
                                <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                            <p style={{ color: 'var(--rose-tan)', fontWeight: 600 }}>${parseFloat(product.price).toFixed(2)}</p>
                            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                                <p>{product.category_name}</p>
                                <p style={{ marginTop: '0.5rem' }}>
                                    {product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0} en stock total
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--white)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>{selectedProduct ? `Detalles: ${selectedProduct.name}` : 'Crear Nuevo Producto'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Nombre</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} style={{ width: '100%', padding: '10px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label>Slug (URL)</label>
                                    <input type="text" required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label>Precio ($)</label>
                                    <input type="number" required step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label>Categoría</label>
                                    <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label>Descripción</label>
                                <textarea required rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}></textarea>
                            </div>

                            {/* Variants Mapping */}
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}>Variantes (Stock / Talla / Color)</h3>
                                {formData.variants.map((v, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                        <input type="text" placeholder="Talla (S, M, L)" value={v.size} onChange={e => { const nv = [...formData.variants]; nv[i].size = e.target.value; setFormData({ ...formData, variants: nv }); }} style={{ width: '80px', padding: '5px' }} />
                                        <input type="text" placeholder="Color" value={v.color} onChange={e => { const nv = [...formData.variants]; nv[i].color = e.target.value; setFormData({ ...formData, variants: nv }); }} style={{ width: '100px', padding: '5px' }} />
                                        <input type="color" value={v.color_hex} onChange={e => { const nv = [...formData.variants]; nv[i].color_hex = e.target.value; setFormData({ ...formData, variants: nv }); }} style={{ padding: '0' }} />
                                        <input type="number" placeholder="Stock" value={v.stock} onChange={e => { const nv = [...formData.variants]; nv[i].stock = parseInt(e.target.value); setFormData({ ...formData, variants: nv }); }} style={{ width: '80px', padding: '5px' }} />
                                        {formData.variants.length > 1 && <button type="button" onClick={() => { const nv = formData.variants.filter((_, idx) => idx !== i); setFormData({ ...formData, variants: nv }); }}>X</button>}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setFormData({ ...formData, variants: [...formData.variants, { size: 'L', color: 'Blanco', color_hex: '#ffffff', stock: 5 }] })} style={{ fontSize: '0.8rem', padding: '5px 10px' }}>+ Variante</button>
                            </div>

                            <button type="submit" className="hero-cta" style={{ alignSelf: 'flex-end' }}>{selectedProduct ? 'Cerrar Detalles' : 'Crear Producto'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecommerce-na6d.onrender.com/api';

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const token = localStorage.getItem('zzaly_admin_token');
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const [formData, setFormData] = useState({
        name: '', slug: '', description: '', price: '', category_id: '',
        is_featured: false, is_active: true,
        variants: [{ size: 'M', color: 'Negro', color_hex: '#000000', stock: 10 }],
        images: ['']
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/products`, { headers: authHeaders });
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
            is_featured: false, is_active: true,
            variants: [{ size: 'M', color: 'Negro', color_hex: '#000000', stock: 10 }],
            images: ['']
        });
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name, slug: product.slug, description: product.description,
            price: product.price, category_id: product.category_id || '',
            is_featured: product.is_featured, is_active: product.is_active,
            variants: product.variants || [],
            images: product.images?.map(i => i.url || i) || ['']
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = selectedProduct
                ? `${API_URL}/admin/products/${selectedProduct.id}`
                : `${API_URL}/admin/products`;

            const res = await fetch(url, {
                method: selectedProduct ? 'PUT' : 'POST',
                headers: authHeaders,
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchProducts();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || err.detail}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await fetch(`${API_URL}/admin/products/${id}`, {
                method: 'DELETE',
                headers: authHeaders
            });
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="admin-loading">Cargando inventario...</div>;

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Productos</h1>
                    <p className="admin-page-subtitle">{products.length} producto{products.length !== 1 ? 's' : ''} en inventario</p>
                </div>
                <button className="admin-btn-primary" onClick={openCreateModal}>+ Nuevo Producto</button>
            </div>

            <div className="admin-products-grid">
                {products.map(product => (
                    <div key={product.id} className="admin-product-card">
                        <div className="admin-product-img">
                            {product.images && product.images[0] && (
                                <img src={product.images[0].url || product.images[0]} alt={product.name} />
                            )}
                            {product.is_featured && <span className="admin-featured-badge">★ Destacado</span>}
                        </div>
                        <div className="admin-product-info">
                            <h3>{product.name}</h3>
                            <p className="admin-product-category">{product.category_name}</p>
                            <div className="admin-product-meta">
                                <span className="admin-product-price">Q{parseFloat(product.price).toFixed(2)}</span>
                                <span className="admin-product-stock">
                                    {product.variants?.reduce((acc, v) => acc + v.stock, 0) || 0} en stock
                                </span>
                            </div>
                            <div className="admin-product-actions">
                                <button className="admin-btn-sm" onClick={() => openEditModal(product)}>✏️ Editar</button>
                                <button className="admin-btn-sm admin-btn-danger" onClick={() => handleDelete(product.id)}>🗑️ Eliminar</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{selectedProduct ? `Editar: ${selectedProduct.name}` : 'Crear Nuevo Producto'}</h2>
                            <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSave} className="admin-modal-form">
                            <div className="admin-form-grid">
                                <div className="admin-form-group">
                                    <label>Nombre</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Slug (URL)</label>
                                    <input type="text" required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Precio (Q)</label>
                                    <input type="number" required step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Categoría</label>
                                    <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label>Descripción</label>
                                <textarea required rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>

                            <div className="admin-form-row">
                                <label className="admin-checkbox">
                                    <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({ ...formData, is_featured: e.target.checked })} />
                                    Producto Destacado
                                </label>
                                <label className="admin-checkbox">
                                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                    Activo
                                </label>
                            </div>

                            {/* Variants */}
                            <div className="admin-form-section">
                                <h3>Variantes</h3>
                                {formData.variants.map((v, i) => (
                                    <div key={i} className="admin-variant-row">
                                        <input type="text" placeholder="Talla" value={v.size} onChange={e => { const nv = [...formData.variants]; nv[i].size = e.target.value; setFormData({ ...formData, variants: nv }); }} />
                                        <input type="text" placeholder="Color" value={v.color} onChange={e => { const nv = [...formData.variants]; nv[i].color = e.target.value; setFormData({ ...formData, variants: nv }); }} />
                                        <input type="color" value={v.color_hex} onChange={e => { const nv = [...formData.variants]; nv[i].color_hex = e.target.value; setFormData({ ...formData, variants: nv }); }} />
                                        <input type="number" placeholder="Stock" value={v.stock} onChange={e => { const nv = [...formData.variants]; nv[i].stock = parseInt(e.target.value); setFormData({ ...formData, variants: nv }); }} />
                                        {formData.variants.length > 1 && <button type="button" className="admin-btn-sm admin-btn-danger" onClick={() => { const nv = formData.variants.filter((_, idx) => idx !== i); setFormData({ ...formData, variants: nv }); }}>×</button>}
                                    </div>
                                ))}
                                <button type="button" className="admin-btn-sm" onClick={() => setFormData({ ...formData, variants: [...formData.variants, { size: 'L', color: 'Blanco', color_hex: '#ffffff', stock: 5 }] })}>+ Variante</button>
                            </div>

                            {/* Images */}
                            <div className="admin-form-section">
                                <h3>URLs de Imágenes</h3>
                                {formData.images.map((img, i) => (
                                    <div key={i} className="admin-image-row">
                                        <input type="text" placeholder="URL de la imagen" value={img} onChange={e => { const ni = [...formData.images]; ni[i] = e.target.value; setFormData({ ...formData, images: ni }); }} />
                                        {formData.images.length > 1 && <button type="button" className="admin-btn-sm admin-btn-danger" onClick={() => { const ni = formData.images.filter((_, idx) => idx !== i); setFormData({ ...formData, images: ni }); }}>×</button>}
                                    </div>
                                ))}
                                <button type="button" className="admin-btn-sm" onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}>+ Imagen</button>
                            </div>

                            <div className="admin-modal-footer">
                                <button type="button" className="admin-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="admin-btn-primary">{selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

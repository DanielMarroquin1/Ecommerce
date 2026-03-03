import { Outlet, Link, useLocation } from 'react-router-dom';

export default function AdminLayout() {
    const location = useLocation();

    return (
        <div className="admin-layout" style={{ display: 'flex', minHeight: '80vh' }}>
            {/* Admin Sidebar */}
            <aside style={{ width: '250px', background: 'var(--white)', padding: '2rem', borderRight: '1px solid var(--sand)' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--espresso)' }}>Admin Panel</h2>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Link
                        to="/admin/productos"
                        style={{
                            padding: '10px 15px',
                            borderRadius: '8px',
                            background: location.pathname.includes('/admin/productos') ? 'var(--sand)' : 'transparent',
                            color: location.pathname.includes('/admin/productos') ? 'var(--espresso)' : 'var(--rose-tan)',
                            fontWeight: 600
                        }}
                    >
                        📦 Productos e Inventario
                    </Link>
                    <Link
                        to="/admin/promos"
                        style={{
                            padding: '10px 15px',
                            borderRadius: '8px',
                            background: location.pathname.includes('/admin/promos') ? 'var(--sand)' : 'transparent',
                            color: location.pathname.includes('/admin/promos') ? 'var(--espresso)' : 'var(--rose-tan)',
                            fontWeight: 600
                        }}
                    >
                        🏷️ Códigos Promocionales
                    </Link>
                </nav>
            </aside>

            {/* Admin Main Content */}
            <main style={{ flex: 1, padding: '2rem', background: 'var(--cream)' }}>
                <Outlet />
            </main>
        </div>
    );
}

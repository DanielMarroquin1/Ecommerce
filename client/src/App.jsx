import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Nosotros from './pages/Nosotros';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminPromos from './pages/Admin/AdminPromos';
import './index.css';

function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return <div className="toast">✓ {toast}</div>;
}

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Client Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/carrito" element={<Cart />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="productos" element={<AdminProducts />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="promos" element={<AdminPromos />} />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

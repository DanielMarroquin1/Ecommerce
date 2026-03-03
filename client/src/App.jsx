import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Nosotros from './pages/Nosotros';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminPromos from './pages/Admin/AdminPromos';
import './index.css';

function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return <div className="toast">✓ {toast}</div>;
}

function AppContent() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Client Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/carrito" element={<Cart />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="productos" element={<AdminProducts />} />
            <Route path="promos" element={<AdminPromos />} />
          </Route>
        </Routes>
      </main>
      <Footer />
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

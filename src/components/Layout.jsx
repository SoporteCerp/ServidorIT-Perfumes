import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/firebase';
import { logoutUser } from '../services/authService';
import { getCartCount } from '../services/cartService';

const navItems = [
  { path: '/', icon: '🛍️', label: 'Catalogo' },
  { path: '/cart', icon: '🛒', label: 'Carrito' },
  { path: '/orders', icon: '📦', label: 'Pedidos' },
  { path: '/dashboard', icon: '📊', label: 'Ventas' },
  { path: '/inventory', icon: '🧴', label: 'Inventario' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
  }, [location.pathname]);

  const handleLogout = async () => { await logoutUser(); navigate('/login'); };
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-top">
          <div>
            <div className="header-greeting">Hola, {user?.displayName || 'Cliente'}</div>
            <div className="header-date">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => navigate('/cart')}>
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
            <button className="icon-btn" onClick={handleLogout}>🚪</button>
          </div>
        </div>
      </header>

      <main className="app-content"><Outlet /></main>

      <nav className="bottom-nav">
        {navItems.map(item => (
          <button key={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

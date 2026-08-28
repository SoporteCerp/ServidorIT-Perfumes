import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/firebase';
import { logoutUser, getUserRole } from '../services/authService';
import { getCartCount } from '../services/cartService';

const customerNav = [
  { path: '/', icon: '🛍️', label: 'Catalogo' },
  { path: '/cart', icon: '🛒', label: 'Carrito' },
  { path: '/orders', icon: '📦', label: 'Mis Pedidos' },
];

const adminNav = [
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
  const [role, setRole] = useState('customer');

  useEffect(() => {
    loadRole();
    setCartCount(getCartCount());
  }, [location.pathname]);

  const loadRole = async () => {
    try {
      const r = await getUserRole(user.uid);
      setRole(r);
    } catch { setRole('customer'); }
  };

  const navItems = role === 'admin' ? adminNav : customerNav;

  const handleLogout = async () => { await logoutUser(); navigate('/login'); };
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-top">
          <div>
            <div className="header-greeting">
              {role === 'admin' ? '🔧 Admin' : 'Hola'}, {user?.displayName || 'Cliente'}
            </div>
            <div className="header-date">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => navigate('/cart')}>
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
            <button className="icon-btn" onClick={() => navigate('/profile')}>👤</button>
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

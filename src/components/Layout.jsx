import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { logoutUser } from '../services/authService';
import { startListening, stopListening, requestNotificationPermission, setupForegroundListener, subscribeToNotifications, clearNotificationType } from '../services/notificationService';
import { getWishlistCount } from '../services/wishlistService';
import { getCart, getCartIdleHours } from '../services/cartService';
import WhatsAppFloat from './WhatsAppFloat';
import { getStoreSettings, DEFAULT_STORE } from '../services/storeSettingsService';

const customerNav = [
  { path: '/', icon: '\uD83C\uDFE0', label: 'Inicio' },
  { path: '/catalog', icon: '\uD83D\uDECD\uFE0F', label: 'Catalogo' },
  { path: '/cart', icon: '\uD83D\uDED2', label: 'Carrito' },
  { path: '/orders', icon: '\uD83D\uDCE6', label: 'Mis Pedidos' },
];

const adminNav = [
  { path: '/panel', icon: '\uD83E\uDDED', label: 'Panel' },
  { path: '/dashboard', icon: '\uD83D\uDCE6', label: 'Pedidos' },
  { path: '/inventory', icon: '\uD83E\uDDF4', label: 'Inventario' },
  { path: '/catalog', icon: '\uD83D\uDECD\uFE0F', label: 'Catalogo' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, userRole: role } = useAuth();
  const { cartCount } = useCart();
  const [wishCount, setWishCount] = useState(0);
  const [notifCounts, setNotifCounts] = useState({ order: 0, payment: 0, chat: 0 });
  const [store, setStore] = useState(DEFAULT_STORE);
  const [showReminder, setShowReminder] = useState(false);
  const notifCount = notifCounts.order + notifCounts.payment + notifCounts.chat;

  const REMINDER_KEY = 'servidorit_cart_reminder_dismissed';

  useEffect(() => {
    getStoreSettings().then(setStore).catch(() => {});
  }, []);

  useEffect(() => {
    if (role === 'admin' || cartCount === 0 || ['/cart', '/checkout'].some(p => location.pathname.startsWith(p))) {
      setShowReminder(false);
      return;
    }
    const dismissed = parseInt(localStorage.getItem(REMINDER_KEY) || '0', 10);
    if (Date.now() - dismissed < 24 * 60 * 60 * 1000) { setShowReminder(false); return; }
    setShowReminder(getCartIdleHours() >= 2);
  }, [cartCount, role, location.pathname]);

  useEffect(() => {
    setWishCount(getWishlistCount());
    requestNotificationPermission();
    setupForegroundListener();
    const unsubNotifs = subscribeToNotifications((type, fn) => {
      setNotifCounts(prev => ({ ...prev, [type]: fn(prev[type] ?? 0) }));
    });
    const clearHandler = (e) => {
      setNotifCounts(prev => ({ ...prev, [e.detail]: 0 }));
    };
    window.addEventListener('clear-notifications', clearHandler);
    startListening();
    return () => {
      stopListening(); unsubNotifs(); window.removeEventListener('clear-notifications', clearHandler);
    };
  }, []);

  useEffect(() => {
    document.title = notifCount > 0 ? '(' + notifCount + ') Esencia Gale' : 'Esencia Gale';
  }, [notifCount]);

  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith('/chat')) clearNotificationType('chat');
    if (p.startsWith('/orders')) clearNotificationType('order');
    if (p.startsWith('/dashboard')) { clearNotificationType('order'); clearNotificationType('payment'); }
    if (p.startsWith('/notifications')) { clearNotificationType('order'); clearNotificationType('payment'); clearNotificationType('chat'); }
    setWishCount(getWishlistCount());
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => setWishCount(getWishlistCount());
    window.addEventListener('wishlist-updated', handler);
    return () => window.removeEventListener('wishlist-updated', handler);
  }, []);

  const navItems = role === 'admin' ? adminNav : customerNav;

  const handleLogout = async () => { await logoutUser(); navigate('/login'); };
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-top">
          <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={() => navigate(role === 'admin' ? '/panel' : '/')}>
            <img src="/logo.jpg" alt="Esencia Gale" style={{width:46,height:46,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--primary,#D4AF37)'}} />
            <div>
              <div className="header-greeting">
                {role === 'admin' ? '\uD83D\uDD27 Admin' : 'Hola'}, {user?.displayName || 'Cliente'}
              </div>
              <div className="header-date">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => navigate('/wishlist')} aria-label="Lista de deseos">
              {'\u2764\uFE0F'}{wishCount > 0 && <span className="cart-badge">{wishCount}</span>}
            </button>
            {role !== 'admin' && (
              <button className="icon-btn" onClick={() => navigate('/cart')} aria-label="Carrito">
                {'\uD83D\uDED2'}
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            )}
            <button className="icon-btn" onClick={() => {
              if (role === 'admin') {
                if (notifCounts.order > 0 || notifCounts.payment > 0) {
                  clearNotificationType('order');
                  clearNotificationType('payment');
                  navigate('/dashboard');
                } else {
                  clearNotificationType('chat');
                  navigate('/chat');
                }
              } else if (notifCount > 0 && notifCounts.order > 0) {
                clearNotificationType('order');
                navigate('/orders');
              } else {
                clearNotificationType('chat');
                navigate('/chat');
              }
            }} aria-label="Chat y notificaciones">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16.004 3C8.826 3 3 8.827 3 16.004c0 2.29.598 4.523 1.735 6.497L3 29l6.693-1.752A12.92 12.92 0 0 0 16.004 29C23.182 29 29 23.172 29 16.004S23.182 3 16.004 3zm0 23.77a10.8 10.8 0 0 1-5.53-1.516l-.396-.236-4.036 1.056 1.078-3.928-.258-.41A10.78 10.78 0 0 1 5.23 16 10.78 10.78 0 0 1 16.004 5.23 10.78 10.78 0 0 1 26.77 16a10.78 10.78 0 0 1-10.766 10.77z"/>
                <path fill="#ffffff" d="M22.846 18.103c-.287-.144-1.7-.839-1.964-.935-.263-.096-.454-.144-.646.144-.192.288-.744.935-.912 1.127-.168.192-.336.216-.623.072-.287-.144-1.213-.447-2.31-1.425-.854-.76-1.43-1.7-1.598-1.987-.168-.288-.018-.443.126-.587.13-.13.287-.335.431-.503.144-.168.192-.287.288-.48.096-.192.048-.36-.024-.503-.072-.144-.646-1.557-.886-2.132-.233-.559-.47-.483-.646-.492-.168-.009-.36-.009-.552-.009-.192 0-.503.072-.767.36-.263.287-1.005.982-1.005 2.395s1.03 2.779 1.174 2.971c.144.192 2.027 3.095 4.91 4.34.686.296 1.221.473 1.638.606.688.218 1.314.187 1.809.113.552-.082 1.7-.695 1.94-1.366.24-.67.24-1.245.168-1.365-.072-.12-.263-.192-.55-.335z"/>
              </svg>
              {notifCount > 0 && <span className="cart-badge">{notifCount}</span>}
            </button>
            <button className="icon-btn" onClick={() => navigate('/profile')} aria-label="Perfil">{'\uD83D\uDC64'}</button>
            <button className="icon-btn" onClick={handleLogout} aria-label="Cerrar sesion">{'\uD83D\uDEAA'}</button>
          </div>
        </div>
      </header>

      <main className="app-content"><Outlet /></main>

      {showReminder && (
        <div className="cart-reminder">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cart-reminder-title">{'\uD83D\uDED2'} ¿Dejaste tu pedido pendiente?</div>
            <div className="cart-reminder-text">Termina tu compra por WhatsApp y te ayudamos con el pago y la entrega.</div>
          </div>
          <a
            className="cart-reminder-cta"
            href={'https://wa.me/' + store.whatsapp + '?text=' + encodeURIComponent(
              'Hola! Deje mi pedido pendiente:\n' +
              getCart().map(i => `- ${i.name} x${i.quantity} ($${(i.price * i.quantity).toFixed(2)})`).join('\n') +
              '\n\nYa tengo los productos elegidos, quiero pagar y coordinar la entrega.'
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Terminar por WhatsApp
          </a>
          <button className="cart-reminder-close" onClick={() => { localStorage.setItem(REMINDER_KEY, Date.now().toString()); setShowReminder(false); }} aria-label="Cerrar recordatorio">{'\u2715'}</button>
        </div>
      )}

      <nav className="bottom-nav">
        {navItems.map(item => (
          <button key={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <WhatsAppFloat visible={role !== 'admin'} />
    </div>
  );
}